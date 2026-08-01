import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateTextWithFallback, MODEL_STACK } from '@/lib/ai-provider';

// Expose the mocked client's `create` so tests can drive per-call behavior
// (first call fails → fallback to the next provider).
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

// The provider stack (Groq/Mistral/OpenRouter) is OpenAI-compatible, so the
// `openai` SDK is mocked to resolve without any live API key.
vi.mock('openai', () => ({
    default: class {
        chat = { completions: { create: mockCreate } };
    },
    OpenAI: class {
        chat = { completions: { create: mockCreate } };
    },
}));

function okResponse(text: string) {
    return { choices: [{ message: { content: text } }] };
}

describe('AI Provider Stack', () => {
    beforeEach(() => {
        // Reset call history; default every provider call to succeed.
        mockCreate.mockReset();
        mockCreate.mockResolvedValue(okResponse('Mocked Response'));
    });

    afterEach(() => {
        // Restore defaults so later tests don't inherit deleted keys.
        process.env.GROQ_API_KEY = 'test-groq-key';
        delete process.env.MISTRAL_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.COHERE_API_KEY;
        vi.unstubAllGlobals();
    });

    it('should return a successful response from the first model in the stack', async () => {
        const response = await generateTextWithFallback({ prompt: 'Hello' });

        expect(response.text).toBe('Mocked Response');
        expect(response.modelUsed).toBe('Llama 3.1 8B (Groq)');
        expect(response.providerUsed).toBe('groq');
        expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should fall back to the next provider when the first one fails', async () => {
        // Groq is first in MODEL_STACK; make its call throw, then succeed for
        // the next provider. Mistral is second, so the fallback must land there.
        process.env.MISTRAL_API_KEY = 'test-mistral-key';
        mockCreate.mockRejectedValueOnce(new Error('provider down'));

        const response = await generateTextWithFallback({ prompt: 'Hello' });

        expect(mockCreate).toHaveBeenCalledTimes(2);
        expect(response.modelUsed).toBe('Codestral (Mistral AI)');
        expect(response.providerUsed).toBe('mistral');
        expect(response.text).toBe('Mocked Response');
    });

    it('fails fast with a clear config error when no provider keys are set', async () => {
        delete process.env.GROQ_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.COHERE_API_KEY;

        await expect(generateTextWithFallback({ prompt: 'Hello' }))
            .rejects.toThrow(/No AI provider configured/);
        // Must not walk the stack pointlessly — the openai SDK is never touched.
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should throw when every configured provider fails', async () => {
        mockCreate.mockReset();
        mockCreate.mockRejectedValue(new Error('all down'));

        await expect(generateTextWithFallback({ prompt: 'Hello' })).rejects.toThrow('All AI models failed');
    });

    it('should export the model stack', () => {
        expect(Array.isArray(MODEL_STACK)).toBe(true);
        expect(MODEL_STACK.length).toBeGreaterThan(0);
        // Groq is intended to be fastest, so it must lead the stack.
        expect(MODEL_STACK[0].provider).toBe('groq');
    });

    it('should forward the system prompt and jsonMode to the provider', async () => {
        process.env.MISTRAL_API_KEY = 'test-mistral-key';
        await generateTextWithFallback({
            prompt: 'Hi',
            systemPrompt: 'Be brief',
            jsonMode: true,
        });
        expect(mockCreate).toHaveBeenCalledTimes(1);
        const [options] = mockCreate.mock.calls[0];
        expect(options).toMatchObject({
            response_format: { type: 'json_object' },
        });
        expect(options.messages[0]).toMatchObject({ role: 'system', content: 'Be brief' });
    });

    it('should use the OpenRouter client when configured', async () => {
        // Only OpenRouter is configured, so the walk must land there.
        delete process.env.GROQ_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.COHERE_API_KEY;
        process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
        const response = await generateTextWithFallback({ prompt: 'Hi' });
        expect(response.providerUsed).toBe('openrouter');
        expect(response.modelUsed).toBe('Llama 3.3 70B Instruct (OpenRouter)');
    });

    it('should use the Cohere provider via raw fetch', async () => {
        // Disable every OpenAI-compatible provider so the walk reaches Cohere.
        delete process.env.GROQ_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        process.env.COHERE_API_KEY = 'test-cohere-key';

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ text: 'Cohere Reply' }),
        });
        vi.stubGlobal('fetch', mockFetch);

        const response = await generateTextWithFallback({ prompt: 'Hi', systemPrompt: 'Be terse' });
        expect(response.providerUsed).toBe('cohere');
        expect(response.text).toBe('Cohere Reply');
        // Cohere is last in MODEL_STACK; every earlier model was skipped.
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should surface a Cohere HTTP error and keep falling back', async () => {
        delete process.env.GROQ_API_KEY;
        delete process.env.MISTRAL_API_KEY;
        delete process.env.OPENROUTER_API_KEY;
        process.env.COHERE_API_KEY = 'test-cohere-key';

        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            text: async () => 'rate limited',
        });
        vi.stubGlobal('fetch', mockFetch);

        await expect(generateTextWithFallback({ prompt: 'Hi' })).rejects.toThrow('All AI models failed');
    });
});
