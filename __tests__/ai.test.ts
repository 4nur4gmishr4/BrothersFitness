import { describe, it, expect, vi } from 'vitest';
import { generateTextWithFallback, MODEL_STACK } from '@/lib/ai-provider';

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        getGenerativeModel() {
            return {
                generateContent: vi.fn().mockResolvedValue({
                    response: { text: () => 'Mocked Google Response' }
                })
            };
        }
    }
}));

vi.mock('openai', () => ({
    default: class {
        chat = {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Mocked OpenAI Response' } }]
                })
            }
        }
    },
    OpenAI: class {
        chat = {
            completions: {
                create: vi.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Mocked OpenAI Response' } }]
                })
            }
        }
    }
}));

describe('AI Provider Stack', () => {
    it('should return a successful response from the first model in the stack', async () => {
        const config = { prompt: 'Hello' };
        const response = await generateTextWithFallback(config);

        expect(response).toBeDefined();
        expect(response.text).toBeTruthy();
        expect(MODEL_STACK.some(m => m.name === response.modelUsed)).toBe(true);
    });

    it('should export the model stack', () => {
        expect(Array.isArray(MODEL_STACK)).toBe(true);
        expect(MODEL_STACK.length).toBeGreaterThan(0);
    });
});
