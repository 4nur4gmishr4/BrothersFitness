import OpenAI from "openai";

// Type definitions for AI Request
export interface AIRequestConfig {
    prompt: string;
    systemPrompt?: string;
    jsonMode?: boolean;
    maxTokens?: number;
    temperature?: number;
    /** Per-provider timeout in ms (default 30s). Guards against hung providers. */
    timeoutMs?: number;
    /** Hard cap for the whole fallback walk in ms (default 90s). */
    totalTimeoutMs?: number;
}

export interface AIResponse {
    text: string;
    modelUsed: string;
    providerUsed: string;
}

// Per-call timeout is deliberately tight (8s) so the whole 4-provider fallback
// walk stays within standard serverless execution budgets (Vercel Hobby/Pro
// edge functions default to a 10–60s cap). A hung provider costs at most 8s
// instead of burning the entire invocation before the backup is even tried.
export const DEFAULT_TIMEOUT_MS = 8_000;
// Hard cap for the entire fallback walk across all providers.
export const DEFAULT_TOTAL_TIMEOUT_MS = 60_000;

/** AbortController tied to a timer; `clear()` must run in a finally block. */
function createAbort(timeoutMs: number): { signal: AbortSignal; clear: () => void } {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return {
        signal: controller.signal,
        clear: () => clearTimeout(timer),
    };
}

// Active Verified Working Provider Types
type Provider = "groq" | "mistral" | "openrouter" | "cohere" | "vercel";

interface ModelConfig {
    id: string;
    provider: Provider;
    name: string;
    description?: string;
}

// Unified Model Stack - Ranked by Speed & Availability
export const MODEL_STACK: ModelConfig[] = [
    { id: "llama-3.1-8b-instant", provider: "groq", name: "Llama 3.1 8B (Groq)" },
    { id: "inclusionai/ling-3.0-tiny-free", provider: "vercel", name: "Ling 3.0 Tiny (Vercel AI Gateway)" },
    { id: "codestral-latest", provider: "mistral", name: "Codestral (Mistral AI)" },
    { id: "pixtral-12b-2409", provider: "mistral", name: "Pixtral 12B (Mistral AI)" },
    { id: "llama-3.3-70b-versatile", provider: "groq", name: "Llama 3.3 70B (Groq)" },
    { id: "mistral-tiny", provider: "mistral", name: "Mistral Tiny (Mistral AI)" },
    { id: "mistral-medium-latest", provider: "mistral", name: "Mistral Medium (Mistral AI)" },
    { id: "mistral-small-latest", provider: "mistral", name: "Mistral Small (Mistral AI)" },
    { id: "mistral-large-latest", provider: "mistral", name: "Mistral Large (Mistral AI)" },
    { id: "meta-llama/llama-3.3-70b-instruct", provider: "openrouter", name: "Llama 3.3 70B Instruct (OpenRouter)" },
    { id: "deepseek/deepseek-r1", provider: "openrouter", name: "DeepSeek R1 (OpenRouter)" },
    { id: "qwen/qwen-2.5-72b-instruct", provider: "openrouter", name: "Qwen 2.5 72B Instruct (OpenRouter)" },
    { id: "meta-llama/llama-3.1-8b-instruct", provider: "openrouter", name: "Llama 3.1 8B Instruct (OpenRouter)" },
    { id: "command-r-plus-08-2024", provider: "cohere", name: "Command R+ (Cohere)" },
    { id: "command-r-08-2024", provider: "cohere", name: "Command R (Cohere)" },
    { id: "open-mistral-7b", provider: "mistral", name: "Open Mistral 7B (Mistral AI)" },
];

// Initialize Active Clients (Lazy)
let groqClient: OpenAI | null = null;
let mistralClient: OpenAI | null = null;
let openRouterClient: OpenAI | null = null;
let vercelClient: OpenAI | null = null;

function getGroqClient() {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new OpenAI({
            baseURL: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groqClient;
}

function getMistralClient() {
    if (!mistralClient && process.env.MISTRAL_API_KEY) {
        mistralClient = new OpenAI({
            baseURL: 'https://api.mistral.ai/v1',
            apiKey: process.env.MISTRAL_API_KEY
        });
    }
    return mistralClient;
}

function getOpenRouterClient() {
    if (!openRouterClient && process.env.OPENROUTER_API_KEY) {
        openRouterClient = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://brothersfitness.in',
                'X-Title': 'BroFit'
            }
        });
    }
    return openRouterClient;
}

function getVercelClient() {
    const key = process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!vercelClient && key) {
        vercelClient = new OpenAI({
            baseURL: 'https://ai-gateway.vercel.com/v1',
            apiKey: key,
        });
    }
    return vercelClient;
}

function isProviderConfigured(provider: Provider): boolean {
    switch (provider) {
        case "groq": return !!process.env.GROQ_API_KEY;
        case "mistral": return !!process.env.MISTRAL_API_KEY;
        case "openrouter": return !!process.env.OPENROUTER_API_KEY;
        case "cohere": return !!process.env.COHERE_API_KEY;
        case "vercel": return !!(process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY);
        default: return false;
    }
}

const PROVIDER_ENV_KEY: Record<Provider, string> = {
    groq: "GROQ_API_KEY",
    mistral: "MISTRAL_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    cohere: "COHERE_API_KEY",
    vercel: "VERCEL_AI_GATEWAY_API_KEY",
};

/**
 * Fail fast when NO provider key is configured. Without this, the fallback
 * walk logs a "Skipped (API Key missing)" warning per model — 15 identical
 * warns that drown out real errors and cost a full 90s deadline before
 * surfacing a generic failure. A clear, immediate config error is far more
 * actionable for the operator.
 */
export function getMissingProviderKeys(): Provider[] {
    return (Object.keys(PROVIDER_ENV_KEY) as Provider[]).filter(
        (provider) => !isProviderConfigured(provider)
    );
}

// Cohere Direct Chat Runner
async function generateCohereText(config: AIRequestConfig, modelId: string, signal: AbortSignal): Promise<string> {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) throw new Error("Cohere API Key missing");

    const promptText = config.systemPrompt ? `SYSTEM: ${config.systemPrompt}\nUSER: ${config.prompt}` : config.prompt;
    const res = await fetch('https://api.cohere.com/v1/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        signal,
        body: JSON.stringify({
            model: modelId,
            message: promptText,
            temperature: config.temperature
        })
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Cohere API Error (${res.status}): ${errText.slice(0, 100)}`);
    }

    const data = await res.json();
    return data.text || "";
}

// Main Generation Function
export async function generateTextWithFallback(config: AIRequestConfig): Promise<AIResponse> {
    const errors: string[] = [];
    const deadline = Date.now() + (config.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS);

    // Fail fast (instead of silently walking all 15 models with "Skipped"
    // warns) when the deployment has no AI provider keys configured at all.
    const configured = MODEL_STACK.filter((m) => isProviderConfigured(m.provider));
    if (configured.length === 0) {
        const missing = getMissingProviderKeys().map((p) => PROVIDER_ENV_KEY[p]).join(", ");
        throw new Error(`No AI provider configured. Set one of: ${missing}`);
    }

    for (const model of MODEL_STACK) {
        if (!isProviderConfigured(model.provider)) {
            errors.push(`${model.name}: Skipped (${model.provider} API Key missing)`);
            continue;
        }

        try {
            // Enforce a hard cap across the whole fallback walk so a series of
            // hung providers can't hold the request until the platform timeout.
            const remainingMs = deadline - Date.now();
            if (remainingMs <= 0) throw new Error("Total request time budget exhausted");

            const perCallMs = Math.min(config.timeoutMs ?? DEFAULT_TIMEOUT_MS, remainingMs);
            const { signal, clear } = createAbort(perCallMs);

            let resultText = "";
            try {
                // --- Cohere Provider ---
                if (model.provider === "cohere") {
                    resultText = await generateCohereText(config, model.id, signal);
                }

                // --- OpenAI Compatible Providers (Groq, Mistral, OpenRouter) ---
                else {
                    let client: OpenAI | null = null;

                    if (model.provider === "groq") client = getGroqClient();
                    else if (model.provider === "mistral") client = getMistralClient();
                    else if (model.provider === "openrouter") client = getOpenRouterClient();
                    else if (model.provider === "vercel") client = getVercelClient();

                    if (!client) throw new Error(`${model.provider} API Key missing`);

                    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
                    if (config.systemPrompt) {
                        messages.push({ role: "system", content: config.systemPrompt });
                    }
                    messages.push({ role: "user", content: config.prompt });

                    const completion = await client.chat.completions.create(
                        {
                            model: model.id,
                            messages,
                            response_format: config.jsonMode ? { type: "json_object" } : { type: "text" },
                            temperature: config.temperature,
                        },
                        { signal }
                    );

                    resultText = completion.choices[0].message.content || "";
                }
            } finally {
                clear();
            }

            if (!resultText) throw new Error("Empty response");

            return {
                text: resultText,
                modelUsed: model.name,
                providerUsed: model.provider
            };

        } catch (error) {
            const errorMsg = (error as Error)?.message || "Unknown error";
            console.warn(`AI: Failed with ${model.name}: ${errorMsg}`);
            errors.push(`${model.name}: ${errorMsg}`);
            continue;
        }
    }

    throw new Error(`All AI models failed. Errors: ${errors.join(", ")}`);
}
