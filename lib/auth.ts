import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { Redis } from '@upstash/redis';

// Stateless signed admin token: <base64url(JSON payload)>.<signature>
// payload = { n: nonce, iat: issued-at(ms), exp: expiry(ms) }
// - nonce makes two logins in the same millisecond produce distinct tokens
//   and enables revocation (blacklist).
// - expiry bounds the token lifetime; revocation + expiry cover the
//   "stateless = replayable forever" weakness of the old design.

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLOCK_SKEW_MS = 5 * 60 * 1000; // allow for server clock drift on `iat`

// When Redis is configured the revocation set is shared across instances, so a
// token logged out on one server is rejected by all. Without it (dev/tests)
// we fall back to the in-process set — correct locally, but on multi-instance
// hosting every instance must have the Upstash env vars.
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USING_REDIS = Boolean(UPSTASH_URL && UPSTASH_TOKEN);
const REVOKED_SET_KEY = 'brofit:admin:revoked-nonces';

// Per-process revocation blacklist keyed by nonce (fallback + fast path).
const revokedNonces = new Set<string>();

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
    if (!USING_REDIS) return null;
    if (!redisClient) {
        redisClient = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
    }
    return redisClient;
}

interface TokenPayload {
    n: string;
    iat: number;
    exp: number;
}

function getSecret(): string {
    const secret = process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASSWORD;
    if (!secret) {
        throw new Error('CRITICAL: ADMIN_PASSWORD or ADMIN_TOKEN_SECRET environment variable is not set.');
    }
    return secret;
}

function sign(payload: TokenPayload): string {
    return createHmac('sha256', getSecret())
        .update(JSON.stringify(payload))
        .digest('hex');
}

function encodePayload(payload: TokenPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodePayload(body: string): TokenPayload | null {
    try {
        const parsed = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (typeof parsed?.n !== 'string' || typeof parsed.iat !== 'number' || typeof parsed.exp !== 'number') {
            return null;
        }
        return parsed as TokenPayload;
    } catch {
        return null;
    }
}

export function generateAdminToken(): string {
    const payload: TokenPayload = {
        n: randomUUID().replace(/-/g, ''),
        iat: Date.now(),
        exp: Date.now() + TOKEN_TTL_MS,
    };
    return `${encodePayload(payload)}.${sign(payload)}`;
}

/**
 * Check whether a nonce has been revoked. Checks the in-process set first
 * (cheap, always correct when Redis is unset), then the shared Redis set so a
 * revocation made on another instance is honored here too. Redis failures are
 * treated as "not revoked" — verification must not hard-fail on a Redis blip.
 */
async function isNonceRevoked(nonce: string): Promise<boolean> {
    if (revokedNonces.has(nonce)) return true;
    const redis = getRedis();
    if (!redis) return false;
    try {
        const revoked = await redis.sismember(REVOKED_SET_KEY, nonce);
        return revoked === 1;
    } catch {
        return false;
    }
}

export async function verifyAdminToken(token: string): Promise<boolean> {
    if (!token || !token.includes('.')) return false;

    const [body, signature] = token.split('.');
    const payload = decodePayload(body);
    if (!payload || typeof signature !== 'string') return false;

    const now = Date.now();
    if (now > payload.exp) return false;              // expired
    if (payload.iat > now + CLOCK_SKEW_MS) return false; // issued in the future
    if (await isNonceRevoked(payload.n)) return false;   // revoked on logout

    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    // Constant-time compare prevents timing side-channels on the signature.
    return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Blacklist a token's nonce so its remaining lifetime is unusable.
 * Writes to both the in-process set and (when configured) the shared Redis
 * set, so the revocation propagates across instances immediately.
 */
export async function revokeAdminToken(token: string): Promise<void> {
    const body = token?.split('.')?.[0];
    if (!body) return;
    const payload = decodePayload(body);
    if (!payload) return;

    revokedNonces.add(payload.n);
    const redis = getRedis();
    if (redis) {
        try {
            await redis.sadd(REVOKED_SET_KEY, payload.n);
            // Revocation only needs to last as long as the token's own TTL.
            await redis.expire(REVOKED_SET_KEY, Math.ceil(TOKEN_TTL_MS / 1000));
        } catch {
            // Local revocation already applied; Redis write is best-effort.
        }
    }
}

/**
 * TEST-ONLY helper: remove all revocations to reset module state between tests.
 * This wipes the shared Redis blacklist, so it must never be called in a real
 * runtime — the guard throws unless we are under Vitest. We key off Vitest's
 * own env flag (not NODE_ENV) because CI/dev shells often inherit
 * NODE_ENV=production even while running the test runner.
 */
export async function clearRevokedTokens(): Promise<void> {
    if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
        throw new Error('clearRevokedTokens is a test-only helper and cannot be called outside the test runner.');
    }
    revokedNonces.clear();
    const redis = getRedis();
    if (redis) {
        try {
            await redis.del(REVOKED_SET_KEY);
        } catch {
            /* best-effort in tests */
        }
    }
}

// Helper to extract token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
}
