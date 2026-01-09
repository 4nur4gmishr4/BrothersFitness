import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { ChatSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

// Lazy initialization to avoid build-time crash when OPENAI_API_KEY is not set
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

/**
 * Hybrid Generation Strategy:
 * 1. Primary: Gemini 2.5 Flash (Fast, Efficient)
 * 2. Secondary: Gemini 2.5 Flash Lite (Backup)
 * 3. Tertiary: OpenAI GPT-4o-Mini (High Reliability / Rate Limit Absorber)
 */
async function generateWithFallback(message: string, systemPrompt: string, signal?: AbortSignal) {
    // 1. Try Gemini Models
    const geminiModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

    for (const modelName of geminiModels) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Affirmative. Systems Online. Ready to assist." }] },
                ],
            });

            const result = await chat.sendMessage(message);
            return result.response.text();
        } catch (error: unknown) {
            const err = error as { message?: string; status?: number };
            const isRateLimit = err.message?.includes("429") || err.status === 429 || err.status === 503;
            if (isRateLimit) {
                console.warn(`[Gemini] Model ${modelName} hit rate limit. Switching backup...`);
                continue;
            }
            console.warn(`[Gemini] Model ${modelName} error: ${err.message}.`);
        }
    }

    // 2. Fallback to OpenAI (GPT-4o-Mini)
    try {
        console.log("[System] Engaging OpenAI Backup (GPT-4o-Mini)...");
        const completion = await getOpenAI().chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "assistant", content: "Affirmative. Systems Online. Ready to assist." },
                { role: "user", content: message },
            ],
            model: "gpt-4o-mini"
        }, { signal });
        return completion.choices[0].message.content || "System Malfunction.";
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("[System] OpenAI Fallback Failed:", err?.message || "Unknown");
        throw new Error("All tactical models exhausted. Application Offline.");
    }
}

export async function POST(req: Request) {
    // Rate limit check - Combined 5 AI requests per day per IP (diet + chatbot)
    const headerUserId = req.headers.get("x-brofit-user-id");
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    // Prioritize User ID (Browser UUID), fallback to IP
    const identifier = (headerUserId && headerUserId !== 'unknown') ? `user_${headerUserId}` : `ai_${ip}`;

    const rateCheck = checkRateLimit(identifier, RATE_LIMITS.AI_COMBINED);

    if (!rateCheck.allowed) {
        return NextResponse.json(
            {
                error: "Daily AI limit reached. You can use AI features (diet + chatbot) up to 5 times per day. Please try again tomorrow."
            },
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
            You are 'BroFit AI', an expert tactical fitness and health assistant designed for Indian users.
            The user is seeking expert advice on fitness, nutrition, physical health, and the human body.
            
            User Context:
            ${JSON.stringify(context)}

            Your Expertise Areas:
            1. **Fitness & Training**: Workout plans, exercise form, muscle building, strength training, cardio, HIIT, recovery
            2. **Nutrition**: Diet planning, macro/micro nutrients, meal timing, supplements, Indian foods, weight management
            3. **Physical Health**: Injury prevention, mobility, flexibility, posture, sleep, stress management
            4. **Body Science**: Muscle groups, metabolism, hormones, body composition, biomechanics
            5. **Sports Performance**: Athletic training, endurance, power, speed, agility
            
            Your Mission:
            1. Provide accurate, evidence-based answers on ALL fitness and health topics
            2. Be specific and actionable - give concrete steps, numbers, and methods
            3. Keep answers concise (2-4 sentences max) but comprehensive
            4. Use motivational, tactical language ("Deploy", "Execute", "Protocol", "Systems")
            5. For Indian users: recommend local foods, understand cultural context (vegetarian options, budget constraints)
            6. ${languageInstruction}

            STRICT FORMATTING RULES:
            - Do NOT use markdown (no asterisks **, no hashes #)
            - Do NOT use quotation marks within the text
            - Keep paragraphs short and scannable
            - Use numbers for lists (e.g., "1. First step, 2. Second step")
        `;

        const response = await generateWithFallback(message, systemPrompt, controller.signal);

        clearTimeout(timeoutId);
        return NextResponse.json({ response });
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        const err = error as { name?: string; message?: string };

        if (err.name === 'AbortError') {
            return NextResponse.json({ error: "Timeout: Chat took too long. Please retry." }, { status: 408 });
        }

        // Sanitized error logging (no API keys)
        logger.error("Chat Error", { error: err?.message || "Unknown error" });
        return NextResponse.json({ error: "System Busy. All tactical uplinks failed." }, { status: 500 });
    }
}
