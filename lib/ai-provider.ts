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

// Active Verified Working Provider Types
type Provider = "groq" | "mistral" | "openrouter" | "cohere";

interface ModelConfig {
    id: string;
    provider: Provider;
    name: string;
    description?: string;
}

// Unified Model Stack - 100% Verified Working Models (Ranked Strictly by Speed: 331ms -> 2401ms)
export const MODEL_STACK: ModelConfig[] = [
    { id: "llama-3.1-8b-instant", provider: "groq", name: "Llama 3.1 8B (Groq)" },
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
                'HTTP-Referer': 'https://brofit.app',
                'X-Title': 'BroFit App'
            }
        });
    }
    return openRouterClient;
}

function isProviderConfigured(provider: Provider): boolean {
    switch (provider) {
        case "groq": return !!process.env.GROQ_API_KEY;
        case "mistral": return !!process.env.MISTRAL_API_KEY;
        case "openrouter": return !!process.env.OPENROUTER_API_KEY;
        case "cohere": return !!process.env.COHERE_API_KEY;
        default: return false;
    }
}

// Cohere Direct Chat Runner
async function generateCohereText(config: AIRequestConfig, modelId: string): Promise<string> {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) throw new Error("Cohere API Key missing");

    const promptText = config.systemPrompt ? `SYSTEM: ${config.systemPrompt}\nUSER: ${config.prompt}` : config.prompt;
    const res = await fetch('https://api.cohere.com/v1/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
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

    for (const model of MODEL_STACK) {
        if (!isProviderConfigured(model.provider)) {
            errors.push(`${model.name}: Skipped (${model.provider} API Key missing)`);
            continue;
        }

        try {
            console.log(`AI: Initializing ${model.name}...`);
            let resultText = "";

            // --- Cohere Provider ---
            if (model.provider === "cohere") {
                resultText = await generateCohereText(config, model.id);
            }

            // --- OpenAI Compatible Providers (Groq, Mistral, OpenRouter) ---
            else {
                let client: OpenAI | null = null;

                if (model.provider === "groq") client = getGroqClient();
                else if (model.provider === "mistral") client = getMistralClient();
                else if (model.provider === "openrouter") client = getOpenRouterClient();

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
