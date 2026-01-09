import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(req: Request) {
    try {
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        // Check AI combined limit (diet + chatbot)
        const aiCheck = checkRateLimit(`ai_${ip}`, RATE_LIMITS.AI_COMBINED);

        return NextResponse.json({
            ai: {
                remaining: aiCheck.remaining,
                total: RATE_LIMITS.AI_COMBINED.maxRequests,
                resetIn: aiCheck.resetIn
            }
        });
    } catch (error) {
        console.error("Rate limit status error:", error);
        return NextResponse.json(
            { error: "Failed to fetch rate limit status" },
            { status: 500 }
        );
    }
}
