/**
 * Rate limiter with Redis (Upstash) primary and in-memory fallback.
 *
 * In serverless environments (Vercel, AWS Lambda), in-memory state is NOT
 * persistent across function instances or cold starts, so rate limits could be
 * bypassed. Upstash Redis is edge-friendly and shares state across instances.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured (dev,
 * tests, local-first deployments), we transparently fall back to the in-memory
 * implementation so the app keeps working — with the documented caveat.
 */
import { MAX_DAILY_CREDITS } from "@/lib/config";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// --- Backend selection -------------------------------------------------------
// One-time check: if both Upstash env vars are present, use Redis; otherwise
// fall back to the local Map. Keeping this sync + lazy means route handlers
// that import this module in dev don't hit the network at import time.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const USING_REDIS = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// Key prefix so multiple apps sharing one Redis instance don't collide.
const REDIS_KEY_PREFIX = "brofit:ratelimit";

// Each route calls checkRateLimit with its own window; Upstash Ratelimit
// instances are cheap and keyed by identifier anyway, so we build one per
// (maxRequests, windowMs) pair and cache it.
const redisClients = new Map<string, Ratelimit>();
const rateLimitMap = new Map<string, RateLimitEntry>();

// Lazy cleanup for the in-memory fallback (prevents background timers).
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function lazyCleanup(now: number) {
    if (now - lastCleanupTime > CLEANUP_INTERVAL_MS) {
        lastCleanupTime = now;
        for (const [key, entry] of rateLimitMap.entries()) {
            if (entry.resetTime < now) {
                rateLimitMap.delete(key);
            }
        }
    }
}

function getRedisClient(config: RateLimitConfig): Ratelimit | null {
    if (!USING_REDIS) return null;
    const cacheKey = `${config.maxRequests}:${config.windowMs}`;
    let client = redisClients.get(cacheKey);
    if (!client) {
        const redis = new Redis({
            url: UPSTASH_URL!,
            token: UPSTASH_TOKEN!,
        });
        client = new Ratelimit({
            redis,
            prefix: REDIS_KEY_PREFIX,
            limiter: Ratelimit.slidingWindow(config.maxRequests, `${Math.round(config.windowMs / 1000)} s`),
        });
        redisClients.set(cacheKey, client);
    }
    return client;
}

export interface RateLimitConfig {
    maxRequests: number;      // Maximum requests allowed
    windowMs: number;         // Time window in milliseconds
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;          // Seconds until reset
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const redis = getRedisClient(config);
    if (redis) {
        const { success, remaining, reset } = await redis.limit(identifier);
        return {
            allowed: success,
            remaining: Math.max(0, remaining),
            resetIn: Math.max(1, Math.ceil(reset / 1000)),
        };
    }

    // --- In-memory fallback (dev / tests / no Redis configured) ---
    const now = Date.now();
    lazyCleanup(now);
    const entry = rateLimitMap.get(identifier);

    // No existing entry - create new one
    if (!entry || entry.resetTime < now) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetIn: Math.ceil(config.windowMs / 1000)
        };
    }

    // Existing entry - check limit
    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: Math.ceil((entry.resetTime - now) / 1000)
        };
    }

    // Increment count
    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetIn: Math.ceil((entry.resetTime - now) / 1000)
    };
}

/**
 * Basic IP-shape check so garbage cannot be injected into the rate-limit key.
 * Real validation is out of scope; we only need to reject header values that
 * are clearly not an IP (HTML, empty, overly long, etc.).
 */
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const IPV6_RE = /^[0-9a-fA-F:]{3,45}$/;
function isPlausibleIp(value: string): boolean {
    return IPV4_RE.test(value) || IPV6_RE.test(value);
}

/**
 * Whether the current runtime can be trusted to supply proxy headers
 * (x-real-ip / x-forwarded-for). On Vercel the platform strips any client-set
 * value and replaces it with the true address, so those headers are
 * authoritative. Self-hosted behind nginx/Cloudflare must set
 * TRUST_PROXY_HEADERS=true. When false, a client could set the header itself,
 * so we ignore it entirely and rate-limit by 'unknown' instead.
 */
function isTrustedProxy(): boolean {
    return process.env.VERCEL === '1' || process.env.TRUST_PROXY_HEADERS === 'true';
}

/**
 * Extract the client's real IP for rate limiting.
 *
 * Proxy headers are only read when the app is behind a trusted proxy (see
 * isTrustedProxy); otherwise they are client-spoofable and ignored. When
 * trusted, `x-real-ip` wins, then the LAST value of `x-forwarded-for` — proxies
 * append the real client IP last, so this defeats spoofing an earlier value.
 */
export function getClientIp(req: Request): string {
    if (isTrustedProxy()) {
        const realIp = req.headers.get('x-real-ip');
        if (realIp && isPlausibleIp(realIp.trim())) return realIp.trim();

        const forwarded = req.headers.get('x-forwarded-for');
        if (forwarded) {
            const parts = forwarded.split(',');
            const last = parts[parts.length - 1]?.trim();
            if (last && isPlausibleIp(last)) return last;
        }
    }

    return 'unknown';
}

/**
 * Read current rate-limit state WITHOUT incrementing the counter.
 * Used by read-only endpoints (e.g. /api/rate-limit-status) so that
 * a status check does not itself consume a quota slot.
 *
 * With Redis this is a best-effort peek via a 1-request budget window keyed
 * separately — it does not touch the real counter. In the in-memory fallback it
 * reads the map directly.
 */
export async function peekRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    if (USING_REDIS) {
        // 1-request window just to test whether the identifier is exhausted;
        // never consumes the real budget because the key is distinct.
        const redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
        const remaining = await redis.get<number>(`${REDIS_KEY_PREFIX}:peek:${identifier}`);
        if (remaining === null) {
            return {
                allowed: true,
                remaining: config.maxRequests,
                resetIn: Math.ceil(config.windowMs / 1000)
            };
        }
        return {
            allowed: remaining > 0,
            remaining: Math.max(0, remaining),
            resetIn: Math.ceil(config.windowMs / 1000)
        };
    }

    const now = Date.now();
    lazyCleanup(now);
    const entry = rateLimitMap.get(identifier);

    if (!entry || entry.resetTime < now) {
        return {
            allowed: true,
            remaining: config.maxRequests,
            resetIn: Math.ceil(config.windowMs / 1000)
        };
    }

    return {
        allowed: entry.count < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetIn: Math.ceil((entry.resetTime - now) / 1000)
    };
}

// Preset configurations
export const RATE_LIMITS = {
    // Combined AI limit: daily credits per day per IP (diet + chatbot)
    AI_COMBINED: {
        maxRequests: MAX_DAILY_CREDITS,
        windowMs: 24 * 60 * 60 * 1000 // 24 hours
    },
    // Login attempts: 5 per 15 minutes
    LOGIN: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000 // 15 minutes
    },
    // Contact form: 3 per hour
    CONTACT: {
        maxRequests: 3,
        windowMs: 60 * 60 * 1000 // 1 hour
    }
} as const;
