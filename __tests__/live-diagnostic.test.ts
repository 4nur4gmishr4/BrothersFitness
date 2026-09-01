import { describe, it, expect } from "vitest";
import { generateTextWithFallback } from "@/lib/ai-provider";
import { GenerateDietSchema, DietResponseSchema, ChatSchema } from "@/lib/validation";

describe("Live AI & Diet & Chatbot Verification", () => {
  it("validates diet input and output schema structures", () => {
    const validDietInput = {
      calories: 2200,
      mode: "custom" as const,
      dietType: "Vegetarian",
      budget: "Standard",
      goal_description: "Build lean muscle",
      currentWeight: 72,
      targetWeight: 75,
      age: 24,
      height: 175,
      gender: "male",
      activityLevel: "moderate",
      weightChangeRate: "0.5",
    };

    const parsed = GenerateDietSchema.safeParse(validDietInput);
    expect(parsed.success).toBe(true);

    const mockDietResponse = {
      summary: "High protein vegetarian plan for muscle gain",
      daily_calories: 2200,
      macros: {
        protein_g: 140,
        carbs_g: 240,
        fat_g: 65,
      },
      meals: [
        {
          name: "Breakfast",
          time: "8:00 AM",
          calories: 500,
          protein_g: 30,
          carbs_g: 60,
          fat_g: 15,
          items: ["Paneer Oats", "Almonds"],
        },
      ],
      tips: ["Drink 3L water daily", "Keep progressive overload in gym"],
    };

    const parsedResponse = DietResponseSchema.safeParse(mockDietResponse);
    expect(parsedResponse.success).toBe(true);
  });

  it("validates chat input schema", () => {
    const chatInput = {
      message: "What is the best protein source for vegetarians in India?",
      context: {
        language: "hi" as const,
        source: "floating_chat",
        gym_name: "Brother's Fitness",
      },
    };

    const parsed = ChatSchema.safeParse(chatInput);
    expect(parsed.success).toBe(true);
  });

  it("generates live text via AI Provider stack if keys are present", async () => {
    const hasKeys = !!(process.env.MISTRAL_API_KEY || process.env.OPENROUTER_API_KEY || process.env.COHERE_API_KEY);
    if (!hasKeys) {
      console.log("No API keys found in test runner environment; skipping live request.");
      return;
    }

    const response = await generateTextWithFallback({
      prompt: "Give me 1 quick gym tip in 5 words.",
      systemPrompt: "You are a fitness coach.",
      jsonMode: false,
      temperature: 0.7,
      timeoutMs: 15000,
    });

    expect(response.text).toBeDefined();
    expect(response.text.length).toBeGreaterThan(0);
    console.log("Live AI response generated successfully:", response.text, "using:", response.modelUsed);
  }, 20000);
});
