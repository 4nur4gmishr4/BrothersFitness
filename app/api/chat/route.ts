import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for chat

    try {
        const { message, context } = await req.json();

        // Contextual System Prompt
        const languageInstruction = context.language === "hi"
            ? "CRITICAL RULE: Respond ONLY in informal Hindi (Hinglish) suitable for Indian gym bros. Use words like 'Bhai', 'Tagda', 'Focus kar'. Do not speak pure English."
            : "Respond in English.";

        const systemPrompt = `
            You are 'BroFit AI', a tactical fitness assistant designed for Indian users.
            The user is currently viewing their diet plan.
            
            User Context:
            ${JSON.stringify(context)}

            Your Mission:
            1. Answer questions about the generated diet, workout advice, or nutrition.
            2. Keep answers concise, motivational, and "tactical".
            3. Do not ignore the user's specific stats (Weight, Goal, etc.).
            4. ${languageInstruction}

            STRICT FORMATTING RULES:
            - Do NOT use markdown (no asterisks **, no hashes #).
            - Do NOT use quotation marks within the text.
            - Keep paragraphs short.
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
        console.error("Chat Error:", err?.message || "Unknown error");
        return NextResponse.json({ error: "System Busy. All tactical uplinks failed." }, { status: 500 });
    }
}
