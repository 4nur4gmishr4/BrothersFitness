import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Type definitions for AI Request
export interface AIRequestConfig {
    prompt: string;
    systemPrompt?: string;
    jsonMode?: boolean;
    maxTokens?: number;
    temperature?: number;
}

export interface AIResponse {
    text: string;
    modelUsed: string;
    providerUsed: string;
}

// Provider Types
type Provider = "google" | "openai" | "deepseek" | "groq";

interface ModelConfig {
    id: string;
    provider: Provider;
    name: string;
    description?: string;
}

// Unified Model Stack - Ranked by Intelligence/Capability as requested
export const MODEL_STACK: ModelConfig[] = [
    // Tier 1: Reasoning & High Intelligence
    { id: "deepseek-reasoner", provider: "deepseek", name: "DeepSeek R1 (Reasoning)" },
    { id: "gemini-1.5-pro", provider: "google", name: "Gemini 1.5 Pro (Complex)" },
    { id: "deepseek-chat", provider: "deepseek", name: "DeepSeek V3 (High Intel)" },

    // Tier 1.5: High Performance Open Source (Groq)
    { id: "llama-3.3-70b-versatile", provider: "groq", name: "Llama 3.3 70B (Groq)" },
    { id: "openai/gpt-oss-120b", provider: "groq", name: "GPT-OSS 120B (Groq)" },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", provider: "groq", name: "Llama 4 Maverick (Groq)" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", provider: "groq", name: "Llama 4 Scout (Groq)" },

    // Tier 2: Strong General Purpose
    { id: "gemini-2.0-flash", provider: "google", name: "Gemini 2.0 Flash (Balanced)" },
    { id: "qwen/qwen3-32b", provider: "groq", name: "Qwen 3 32B (Groq)" },
    { id: "moonshotai/kimi-k2-instruct", provider: "groq", name: "Kimi K2 Instruct (Groq)" },

    // Tier 3: Speed & Efficiency Fallbacks
    { id: "deepseek-r1-distill-llama-70b", provider: "groq", name: "DeepSeek R1 Distill (Groq)" },
    { id: "llama-3.1-8b-instant", provider: "groq", name: "Llama 3.1 8B (Groq Instant)" },
    { id: "groq/compound", provider: "groq", name: "Groq Compound" },
    { id: "groq/compound-mini", provider: "groq", name: "Groq Compound Mini" },
    { id: "moonshotai/kimi-k2-instruct-0905", provider: "groq", name: "Kimi K2 0905 (Groq)" },
    { id: "openai/gpt-oss-20b", provider: "groq", name: "GPT-OSS 20B (Groq)" },
    { id: "gemini-1.5-flash", provider: "google", name: "Gemini 1.5 Flash (Backup)" },
];

// Initialize Clients (Lazy)
let googleClient: GoogleGenerativeAI | null = null;
let openaiClient: OpenAI | null = null;
let deepseekClient: OpenAI | null = null;
let groqClient: OpenAI | null = null;

function getGoogleClient() {
    if (!googleClient && process.env.GEMINI_API_KEY) {
        googleClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return googleClient;
}

function getOpenAIClient() {
    if (!openaiClient && process.env.OPENAI_API_KEY) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

function getDeepSeekClient() {
    if (!deepseekClient && process.env.DEEPSEEK_API_KEY) {
        deepseekClient = new OpenAI({
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.DEEPSEEK_API_KEY
        });
    }
    return deepseekClient;
}

function getGroqClient() {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new OpenAI({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groqClient;
}

// Main Generation Function
export async function generateTextWithFallback(config: AIRequestConfig): Promise<AIResponse> {
    const errors: string[] = [];

    for (const model of MODEL_STACK) {
        try {
            console.log(`[AI] Attempting generation with ${model.name} (${model.provider})...`);

            let resultText = "";

            // --- Google Provider ---
            if (model.provider === "google") {
                const client = getGoogleClient();
                if (!client) throw new Error("Google API Key missing");

                const genModel = client.getGenerativeModel({
                    model: model.id,
                    generationConfig: {
                        responseMimeType: config.jsonMode ? "application/json" : "text/plain",
                        temperature: config.temperature
                    }
                });

                const parts = [];
                if (config.systemPrompt) parts.push({ text: `SYSTEM: ${config.systemPrompt}` });
                parts.push({ text: config.prompt });

                const result = await genModel.generateContent({
                    contents: [{ role: "user", parts }]
                });
                resultText = result.response.text();
            }

            // --- OpenAI Compatible Providers (OpenAI, DeepSeek, Groq) ---
            else {
                let client: OpenAI | null = null;

                if (model.provider === "openai") client = getOpenAIClient();
                else if (model.provider === "deepseek") client = getDeepSeekClient();
                else if (model.provider === "groq") client = getGroqClient();

                if (!client) throw new Error(`${model.provider} API Key missing`);

                const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
                if (config.systemPrompt) {
                    messages.push({ role: "system", content: config.systemPrompt });
                }
                messages.push({ role: "user", content: config.prompt });

                const completion = await client.chat.completions.create({
                    model: model.id,
                    messages,
                    response_format: config.jsonMode ? { type: "json_object" } : { type: "text" },
                    temperature: config.temperature,
                });

                resultText = completion.choices[0].message.content || "";
            }

            // Success!
            if (!resultText) throw new Error("Empty response");

            return {
                text: resultText,
                modelUsed: model.name,
                providerUsed: model.provider
            };

        } catch (error) {
            const errorMsg = (error as Error)?.message || "Unknown error";
            console.warn(`[AI] Failed with ${model.name}: ${errorMsg}`);
            errors.push(`${model.name}: ${errorMsg}`);

            // Check for specific fatal errors (like invalid API key format) vs retryable (rate limits)
            // For now, we continue to next model on ANY error to ensure robustness
            continue;
        }
    }

    throw new Error(`All AI models failed. Errors: ${errors.join(", ")}`);
}
