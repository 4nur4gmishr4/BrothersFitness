/**
 * Simple in-memory rate limiter for serverless environments.
 * Limits requests per IP address within a time window.
 * 
 * ⚠️  WARNING: This is an IN-MEMORY rate limiter.
 * In serverless environments (Vercel, AWS Lambda), this state is NOT persistent
 * across function instances or cold starts. Rate limits may be bypassed.
 * 
 * TODO: For production, integrate Upstash Redis for persistent, distributed rate limiting.
 * See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (entry.resetTime < now) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

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
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
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

// Preset configurations
export const RATE_LIMITS = {
    // Combined AI limit: 5 requests per day per IP (diet + chatbot)
    AI_COMBINED: {
        maxRequests: 5,
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
