import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // Cache on edge/CDN for 24 hours

const EXERCISES_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

let memoryCache: unknown = null;
let lastFetchTime = 0;
const MEMORY_CACHE_MS = 12 * 60 * 60 * 1000; // 12 hours in memory

export async function GET() {
  const now = Date.now();
  if (memoryCache && now - lastFetchTime < MEMORY_CACHE_MS) {
    return NextResponse.json(memoryCache, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  }

  try {
    const res = await fetch(EXERCISES_URL, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Upstream fetch returned status ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      memoryCache = data;
      lastFetchTime = now;
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
        },
      });
    }

    throw new Error("Invalid upstream data format");
  } catch (error) {
    console.error("Failed to fetch exercises from upstream:", error);
    if (memoryCache) {
      return NextResponse.json(memoryCache);
    }
    return NextResponse.json(
      { error: "Failed to load exercise database" },
      { status: 502 }
    );
  }
}
