import { NextResponse } from "next/server";
import { MAX_DAILY_CREDITS } from "@/lib/config";
import { verifyUserToken, getUserCreditState } from "@/lib/credit-service";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            const identity = await verifyUserToken(req);
            if (!(identity instanceof NextResponse)) {
                // C2 fix: read credits from the Supabase user row (authoritative)
                // instead of peekRateLimit, whose Redis path was always returning
                // full quota due to a never-written key.
                const creditState = await getUserCreditState(identity.supabase, identity.userId);
                if (!(creditState instanceof NextResponse)) {
                    return NextResponse.json({
                        ai: {
                            remaining: creditState.credits,
                            total: MAX_DAILY_CREDITS,
                        }
                    });
                }
            }
        }

        // Unauthenticated fallback: return the credit cap (no per-user data).
        return NextResponse.json({
            ai: {
                remaining: MAX_DAILY_CREDITS,
                total: MAX_DAILY_CREDITS,
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
