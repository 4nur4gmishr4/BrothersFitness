import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Never statically prerendered: the response depends on the query param and
// the cache above must be a runtime decision, not baked at build time.
export const dynamic = 'force-dynamic';

// Small in-memory cache per muscle group to protect the paid API quota.
// Serverless instances reset on cold start, so this only de-dupes requests
// within one warm instance — the entry cap below keeps it from growing
// unboundedly within that window (M8).
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_ENTRIES = 20;
const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(req: Request) {
    const apiKey = process.env.API_NINJAS_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "API Ninjas key missing" }, { status: 500 });
    }

    // Public proxy: rate-limit per IP to protect the paid API quota.
    const rateCheck = await checkRateLimit(`ninjas:${getClientIp(req)}`, {
        maxRequests: 60,
        windowMs: 60 * 60 * 1000, // 60/hour
    });
    if (!rateCheck.allowed) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const muscle = searchParams.get("muscle") || "biceps";

    // Serve from cache when fresh.
    const cached = cache.get(muscle);
    if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json({ exercises: cached.data, cached: true });
    }

    try {
        const res = await fetch(`https://api.api-ninjas.com/v1/exercises?muscle=${encodeURIComponent(muscle)}`, {
            headers: { 'X-Api-Key': apiKey }
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch exercises. Please try again.' }, { status: 500 });
        }

        const exercises = await res.json();
        cache.set(muscle, { data: exercises, expiresAt: Date.now() + CACHE_TTL_MS });
        // Evict oldest entries once the cap is exceeded (LRU-ish by insertion
        // order) so a hostile muscle param can't grow the map without bound.
        if (cache.size > MAX_CACHE_ENTRIES) {
            const oldest = cache.keys().next().value;
            if (oldest !== undefined) cache.delete(oldest);
        }

        return NextResponse.json({ exercises });
    } catch (err) {
        console.error('Exercise proxy failed:', err);
        return NextResponse.json({ error: 'Failed to fetch exercises. Please try again.' }, { status: 500 });
    }
}
