import { NextResponse } from "next/server";
import { ChatSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { generateTextWithFallback } from "@/lib/ai-provider";
import { createClient } from "@supabase/supabase-js";

import { MAX_DAILY_CREDITS } from "@/lib/config";

// Initialize Supabase Admin Client (for reliable credit checks)
// moved inside handler to avoid build-time errors

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        logger.error("Missing Supabase Configuration", { url: !!supabaseUrl, key: !!supabaseServiceKey });
        return NextResponse.json(
            { error: "System Configuration Error: API service offline." },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const headerUserId = req.headers.get("x-brofit-user-id");

    if (!headerUserId || headerUserId === 'unknown') {
        return NextResponse.json(
            { error: "Authentication required. Please login to use Tactical Chat." },
            { status: 401 }
        );
    }

    try {
        // 1. Check Credits
        const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('daily_credits, last_credit_reset')
            .eq('firebase_uid', headerUserId)
            .single();

        if (userError || !userProfile) {
            console.error('Chat API: Profile Fetch Error:', userError);
            return NextResponse.json({ error: "User profile not found. Please complete your profile." }, { status: 403 });
        }

        const today = new Date().toISOString().split('T')[0];
        let credits = userProfile.daily_credits;

        // Reset logic (mirroring context)
        if (userProfile.last_credit_reset !== today) {
            credits = MAX_DAILY_CREDITS; // Reset to Max
            // We implicitly reset here for the check, but will update DB only on deduction
        }

        if (credits <= 0) {
            return NextResponse.json(
                { error: `Daily credits depleted (0/${MAX_DAILY_CREDITS}). Resets tomorrow.` },
                { status: 429 }
            );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for chat

        try {
            const body = await req.json();

            // Validate with Zod
            const parsed = ChatSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json(
                    { error: parsed.error.issues[0]?.message || 'Invalid request' },
                    { status: 400 }
                );
            }

            const { message, context } = parsed.data;

            // Contextual System Prompt
            const languageInstruction = context.language === "hi"
                ? "CRITICAL RULE: Respond ONLY in informal Hindi (Hinglish) suitable for Indian gym bros. Use words like 'Bhai', 'Tag da', 'Focus kar'. Do not speak pure English."
                : "Respond in English.";

            const systemPrompt = `
            You are 'BroFit AI', an expert fitness and health assistant for Indian users.
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

            // Deduct Credit on Success
            await supabase
                .from('users')
                .update({
                    daily_credits: credits - 1,
                    last_credit_reset: today
                })
                .eq('firebase_uid', headerUserId);

            clearTimeout(timeoutId);
            return NextResponse.json({
                response: aiResponse.text,
                meta: { model: aiResponse.modelUsed, provider: aiResponse.providerUsed }
            });
        } catch (error: unknown) {
            clearTimeout(timeoutId);
            const err = error as { name?: string; message?: string };

            if (err.name === 'AbortError') {
                return NextResponse.json({ error: "Timeout: Chat took too long. Please retry." }, { status: 408 });
            }

            // Sanitized error logging (no API keys)
            logger.error("Chat Error", { error: err?.message || "Unknown error" });
            return NextResponse.json({ error: "Service temporarily unavailable. Please try again." }, { status: 500 });
        }
    } catch (error: unknown) {
        const err = error as Error;
        logger.error("Fatal API Error", { error: err.message });
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
