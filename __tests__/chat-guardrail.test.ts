import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/chat/route';

vi.mock('@/lib/credit-service', () => ({
  verifyUserToken: vi.fn(async () => ({
    supabase: {},
    userId: 'test-user-id',
  })),
  getUserCreditState: vi.fn(async () => ({ credits: 5 })),
  spendUserCredit: vi.fn(async () => ({ remaining: 4 })),
}));

vi.mock('@/lib/ai-provider', () => ({
  generateTextWithFallback: vi.fn(async () => ({
    text: 'Bench press is the best chest builder.',
    modelUsed: 'mock-model',
    providerUsed: 'mock-provider',
  })),
}));

describe('Chat API Domain Guardrails', () => {
  it('rejects blatant out-of-domain coding question in English', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        message: 'Write python code to reverse a binary tree',
        context: { language: 'en' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.response).toContain('Sorry, I can only help you with gym workouts, exercises, fitness, and diet');
  });

  it('rejects blatant out-of-domain politics question in Hindi', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        message: 'Who is the prime minister of the country?',
        context: { language: 'hi' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.response).toContain('Sorry bhai, main sirf gym, workout, exercise aur diet ke baare me bata sakta hoon');
  });

  it('allows and processes in-domain gym workout query', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        message: 'What is the best way to do barbell squats?',
        context: { language: 'en' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.response).toBe('Bench press is the best chest builder.');
    expect(data.meta.remaining).toBe(4);
  });
});
