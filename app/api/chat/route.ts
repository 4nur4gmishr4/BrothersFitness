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

        // Fast Guardrail: Instantly decline completely unrelated queries without burning credits
        const lowerMsg = message.toLowerCase().trim();
        const nonFitnessPatterns = [
            /\b(write|create|debug|fix|compile)\s+(code|python|javascript|java|c\+\+|html|css|sql|script|program)\b/i,
            /\b(prime minister|president of|chief minister|who won the election|politics)\b/i,
            /\b(solve|calculate)\s+(\d+[\+\-\*\/]|\bmath\b|\bequation\b)/i,
            /\b(write an? (essay|poem|song|letter|speech|resume))\b/i,
            /\b(weather in|forecast for|temperature in)\b/i,
            /\b(cryptocurrency|bitcoin|nifty|sensex|stock market|share price)\b/i,
            /\b(movie review|box office|film plot|cinema cast)\b/i
        ];

        const isBlatantlyOutOfDomain = nonFitnessPatterns.some((pattern) => pattern.test(lowerMsg));
        if (isBlatantlyOutOfDomain) {
            const declineText = context.language === "hi"
                ? "Sorry bhai, main sirf gym, workout, exercise aur diet ke baare me bata sakta hoon. Fitness ya workout se related koi bhi sawal pucho!"
                : "Sorry, I can only help you with gym workouts, exercises, fitness, and diet. Please feel free to ask anything related to your fitness journey!";

            return withRequestId(
                NextResponse.json({
                    response: declineText,
                    meta: { model: "guardrail", provider: "local", remaining: creditState.credits }
                }),
                requestId
            );
        }

        // Contextual System Prompt with Strict Gym & Diet Domain Restriction
        const domainGuard = context.language === "hi"
            ? `CRITICAL DOMAIN RESTRICTION:
Aap STRICTLY Brother's Fitness Lakhnadon ke gym, workout, physical training aur diet assistant ho.
Agar user gym, workout, bodybuilding, weight loss, muscle gain, cardio, physical exercises, protein, health, nutrition, ya fitness diet ke ALAAWA kisi bhi aur topic par sawal pooche (jaise computer, coding, movies, politics, weather, math, general knowledge, games, relationships, history, etc.), toh aapko STRICTLY kisi bhi doosri cheez ka jawab NAHI dena hai.
Aapko turant aur vinamrata se yahi kehna hai:
"Sorry bhai, main sirf gym, workout, exercise aur diet ke baare me bata sakta hoon. Fitness ya workout se related koi bhi sawal pucho!"
Kabhi bhi out-of-domain sawal ka answer mat do.`
            : `CRITICAL DOMAIN RESTRICTION:
You are STRICTLY the dedicated gym, workout, exercise, and diet coach for Brother's Fitness.
If the user asks about ANY subject outside of gym workouts, exercises, muscle building, weight loss, cardio, physical fitness, nutrition, or fitness diet (such as programming, coding, movies, politics, weather, mathematics, general knowledge, celebrities, etc.), you MUST STRICTLY decline to answer.
You must respond politely and concisely:
"Sorry, I can only help you with gym workouts, exercises, fitness, and diet. Please feel free to ask anything related to your fitness journey!"
Never answer any out-of-domain questions under any circumstances.`;

        const languageInstruction = context.language === "hi"
            ? "CRITICAL RULE: Respond ONLY in informal Hindi (Hinglish) suitable for Indian gym bros. Use words like 'Bhai', 'Tag da', 'Focus kar'. Do not speak pure English."
            : "Respond in clear, friendly English.";

        const systemPrompt = `
        You are "Brother's Fitness AI", the expert gym workout, exercise, and diet coach for Brother's Fitness.
        
        ${domainGuard}

        Guidelines:
        1. Provide accurate, evidence-based answers exclusively on gym workouts, exercises, and fitness nutrition.
        2. Be specific and actionable with concrete exercises, reps, sets, and protein/calorie guidance.
        3. Keep answers concise (2-4 sentences max).
        4. Maintain a motivational, encouraging gym coach tone.
        5. For Indian users: suggest local foods and culturally appropriate options (paneer, dal, chana, soya, oats, eggs).
        6. ${languageInstruction}

        Formatting:
        - No markdown (no ** or #).
        - No quotation marks.
        - Short, scannable sentences.
        - Numbered lists if giving steps.
    `;

        const userPrompt = `
        User Context:
        ${JSON.stringify(context)}

        User Message:
        ${message}
        `;

        const aiResponse = await generateTextWithFallback({
            prompt: userPrompt,
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
