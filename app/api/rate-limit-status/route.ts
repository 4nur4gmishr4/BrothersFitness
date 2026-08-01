import { NextResponse } from "next/server";
import { peekRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { verifyUserToken } from "@/lib/credit-service";

export async function GET(req: Request) {
    try {
        // Key by the authenticated user when possible, so the counter matches
        // the one the AI routes enforce; otherwise fall back to the client IP.
        let key: string;
        const authHeader = req.headers.get("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            try {
                const identity = await verifyUserToken(req);
                key = identity instanceof NextResponse
                    ? `ip:${getClientIp(req)}`
                    : `user:${identity.userId}`;
            } catch {
                key = `ip:${getClientIp(req)}`;
            }
        } else {
            key = `ip:${getClientIp(req)}`;
        }

        // peekRateLimit is non-destructive: reading status must not consume a slot.
        const aiCheck = await peekRateLimit(key, RATE_LIMITS.AI_COMBINED);

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
