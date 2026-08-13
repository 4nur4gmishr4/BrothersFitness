import { NextResponse } from "next/server";
import { ChatSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { generateTextWithFallback } from "@/lib/ai-provider";
import { verifyUserToken, getUserCreditState, spendUserCredit } from "@/lib/credit-service";
import { getRequestId, withRequestId } from "@/lib/request-id";

export async function POST(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        // 0. Verify the caller's Supabase session token server-side (never trust
        // a client-supplied identity header).
        const identity = await verifyUserToken(req);
        if (identity instanceof NextResponse) return withRequestId(identity, requestId);
        const { supabase, userId } = identity;

        // 1. Check credits (informational pre-check; the RPC below is the
        // authoritative, atomic deduction).
        const creditState = await getUserCreditState(supabase, userId);
        if (creditState instanceof NextResponse) return withRequestId(creditState, requestId);

        // 2. Validate request body
        const body = await req.json();
        const parsed = ChatSchema.safeParse(body);
        if (!parsed.success) {
            return withRequestId(
                NextResponse.json(
                    { error: parsed.error.issues[0]?.message || 'Invalid request' },
                    { status: 400 }
                ),
                requestId
            );
        }

        const { message, context } = parsed.data;

        // Contextual System Prompt
        const languageInstruction = context.language === "hi"
            ? "CRITICAL RULE: Respond ONLY in informal Hindi (Hinglish) suitable for Indian gym bros. Use words like 'Bhai', 'Tag da', 'Focus kar'. Do not speak pure English."
            : "Respond in English.";

        const systemPrompt = `
        You are 'Brothers Fitness AI', an expert fitness and health assistant for Indian users.
        Provide expert advice on fitness, nutrition, and wellness.

        User Context:
        ${JSON.stringify(context)}

        Guidelines:
        1. Provide accurate, evidence-based answers on fitness and health.
        2. Be specific and actionable with concrete steps and numbers.
        3. Keep answers concise (2-4 sentences max).
        4. Maintain a professional, motivational tone.
        5. For Indian users: suggest local foods and culturally appropriate options.
        6. ${languageInstruction}

        Formatting:
        - No markdown (no ** or #).
        - No quotation marks.
        - Short, scannable paragraphs.
        - Use numbered lists.
    `;

        const aiResponse = await generateTextWithFallback({
            prompt: message,
            systemPrompt: systemPrompt,
            jsonMode: false,
            temperature: 0.7
        });

        // 3. Deduct the credit atomically AFTER a successful generation.
        const spent = await spendUserCredit(supabase, userId);
        if (spent instanceof NextResponse) return withRequestId(spent, requestId);

        return withRequestId(
            NextResponse.json({
                response: aiResponse.text,
                meta: { model: aiResponse.modelUsed, provider: aiResponse.providerUsed, remaining: spent.remaining }
            }),
            requestId
        );
    } catch (error: unknown) {
        const err = error as { name?: string; message?: string };

        // Sanitized error logging (no API keys)
        log.error("Chat Error", { error: err?.message || "Unknown error" });
        return withRequestId(
            NextResponse.json({ error: "Service temporarily unavailable. Please try again." }, { status: 500 }),
            requestId
        );
    }
}
