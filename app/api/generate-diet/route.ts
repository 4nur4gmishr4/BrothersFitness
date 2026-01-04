import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const {
            calories,
            mode,
            dietType,
            budget,
            exclusions,
            goal_description,
            currentWeight,
            targetWeight,
            age,
            height,
            gender,
            activityLevel
        } = await req.json();

        const prompt = `
      You are a tactical fitness nutritionist for 'BroFit', optimizing for an **Indian User**.
      
      User Biometrics:
      - Gender: ${gender}
      - Age: ${age}
      - Height: ${height}
      - Current Weight: ${currentWeight}
      - Target Weight: ${targetWeight}
      - Activity Level: ${activityLevel}
      
      Mission Parameters:
      - Target Calories: ${calories || "CALCULATE EXACT SURPLUS/DEFICIT BASED ON GOAL & BIOMETRICS"}
      - Protocol: ${mode}
      - Diet Type: ${dietType}
      - Budget: ${budget}
      - Goal: ${goal_description}

      STRICT OUTPUT RULES:
      1. Output ONLY valid JSON.
      2. **CURRENCY**: Indian Rupees (₹).
      3. **CONTEXT**: Suggest Indian-friendly foods.
      4. **LANGUAGE**: Provide TEXT content in BOTH English and Hindi.
      5. **CATEGORIZATION**: Split shopping items into 'Home_Essentials' and 'Market_Purchase'.
      6. **TIMELINE**: Calculate a realistic "estimated_duration" (e.g., "6 Months") to reach the target weight safely.
      
      JSON STRUCTURE:
      {
        "tactical_brief": { "en": "...", "hi": "..." },
        "transformation_timeline": {
           "estimated_duration": "6 Months",
           "weekly_change": "0.5kg",
           "daily_calories": 2800 
        },
        "shopping_list": {
            "total_estimated_cost": 2500,
            "items": [
                { 
                    "name": { "en": "Item", "hi": "Item" },
                    "quantity": { "en": "Qty", "hi": "Qty" },
                    "category": "Home_Essentials" | "Market_Purchase", 
                    "duration_days": 7,
                    "price_inr": 100
                }
            ]
        },
        "meal_plan": [
            {
                "name": { "en": "Meal Name", "hi": "Meal Name" },
                "calories": 500,
                "protein": 30,
                "carbs": 50,
                "fats": 15,
                "description": { "en": "Description", "hi": "Description" }
            }
        ]
      }
    `;

        // 1. Try Gemini
        const geminiModels = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
        for (const modelName of geminiModels) {
            try {
                console.log(`[Gemini] Attempting synthesis with ${modelName}...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json" }
                });
                const result = await model.generateContent(prompt);
                const text = result.response.text();

                // Robust JSON Cleanup (Handle Markdown backticks)
                const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

                return NextResponse.json(JSON.parse(cleanJson));
            } catch (error: unknown) {
                const err = error as { message?: string; status?: number };
                const isRateLimit = err.message?.includes("429") || err.status === 429 || err.status === 503;
                if (isRateLimit) {
                    console.warn(`[Gemini] ${modelName} hit rate limit.`);
                    continue;
                }
                console.warn(`[Gemini] ${modelName} error:`, err.message);
            }
        }

        // 2. Fallback to OpenAI (GPT-4o-Mini)
        try {
            console.log("[System] Gemini failed. Engaging OpenAI (GPT-4o-Mini)...");
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a JSON-only API. You must return valid JSON matching the user's schema. Do not include markdown formatting." },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error("OpenAI returned empty response");

            return NextResponse.json(JSON.parse(content));
        } catch (error) {
            console.error("[System] OpenAI Fallback Failed:", error);
            return NextResponse.json(
                { error: "Failed to synthesize protocol. Systems Overloaded." },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Fatal System Error" },
            { status: 500 }
        );
    }
}
