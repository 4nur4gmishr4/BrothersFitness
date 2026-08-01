import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Small in-memory cache so repeated queries don't burn the USDA quota.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(req: Request) {
    // Public proxy: rate-limit per IP to protect the (paid/limited) upstream key.
    const rateCheck = await checkRateLimit(`usda:${getClientIp(req)}`, {
        maxRequests: 30,
        windowMs: 60 * 60 * 1000, // 30/hour
    });
    if (!rateCheck.allowed) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";

    if (query.length < 2) {
        return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    // Serve from cache when fresh.
    const cached = cache.get(query);
    if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json({ foods: cached.data, cached: true });
    }

    const apiKey = "DEMO_KEY";

    try {
        const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=${apiKey}`);

        if (!res.ok) {
            return NextResponse.json({ error: `USDA API returned status ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        const foods = data.foods || [];
        cache.set(query, { data: foods, expiresAt: Date.now() + CACHE_TTL_MS });

        return NextResponse.json({ foods });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
