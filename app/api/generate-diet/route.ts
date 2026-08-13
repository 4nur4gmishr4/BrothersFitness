import { NextResponse } from "next/server";
import { GenerateDietSchema, DietResponseSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { generateTextWithFallback, type AIRequestConfig } from "@/lib/ai-provider";
import { verifyUserToken, getUserCreditState, spendUserCredit } from "@/lib/credit-service";
import { getRequestId, withRequestId } from "@/lib/request-id";

// L38: allow up to 60s for AI generation — the default Vercel budget (10s)
// is easily exceeded by multi-provider fallback + JSON parsing.
export const maxDuration = 60;

/** Strip ```json / ``` code fences the model sometimes wraps JSON in. */
function stripJsonFences(text: string): string {
    return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

/**
 * Ask the model for JSON, retrying once if the first attempt is malformed.
 * Throws a clear 'invalid JSON' error only after both attempts fail.
 */
async function requestDietJson(aiConfig: AIRequestConfig, originalPrompt: string, log: typeof logger): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt++) {
        const aiResponse = await generateTextWithFallback(aiConfig);
        try {
            return JSON.parse(stripJsonFences(aiResponse.text));
        } catch {
            if (attempt === 1) throw new Error(`AI returned invalid JSON: ${aiResponse.modelUsed}`);
            log.warn('Diet AI returned malformed JSON, retrying once');
            aiConfig.prompt = originalPrompt +
                '\n\nIMPORTANT: Your previous output was not valid JSON. Return ONLY the raw JSON object — no markdown, no commentary.';
        }
    }
    throw new Error("AI returned invalid JSON");
}

export async function POST(req: Request) {
    const requestId = getRequestId(req);
    const log = logger.child({ requestId });
    try {
        // 0. Verify the caller's Supabase session token server-side.
        const identity = await verifyUserToken(req);
        if (identity instanceof NextResponse) return withRequestId(identity, requestId);
        const { supabase, userId } = identity;

        // 1. Check credits (informational; the RPC below is the atomic spend).
        const creditState = await getUserCreditState(supabase, userId);
        if (creditState instanceof NextResponse) return withRequestId(creditState, requestId);

        // 2. Validate request body
        const body = await req.json();
        const parsed = GenerateDietSchema.safeParse(body);
        if (!parsed.success) {
            return withRequestId(
                NextResponse.json(
                    { error: parsed.error.issues[0]?.message || 'Invalid request' },
                    { status: 400 }
                ),
                requestId
            );
        }

        const {
            calories,
            mode,
            dietType,
            budget,
            goal_description,
            currentWeight,
            targetWeight,
            age,
            height,
            gender,
            activityLevel,
            weightChangeRate
        } = parsed.data;

        // 0 is a valid maintenance rate — only fall back to the default when the
        // value is genuinely absent/unparseable.
        const rateNum = weightChangeRate === undefined || weightChangeRate === null || weightChangeRate === ''
            || Number.isNaN(parseFloat(String(weightChangeRate)))
            ? 0.5
            : parseFloat(String(weightChangeRate));
        const calorieAdjustment = Math.round(rateNum * 1100);

        const prompt = `
      You are an expert fitness nutritionist for 'Brothers Fitness', optimizing for an **Indian User**.

      **User Biometrics**
      - Gender: ${gender}
      - Age: ${age} years
      - Height: ${height} cm
      - Current Weight: ${currentWeight} kg
      - Target Weight: ${targetWeight} kg
      - Activity Level: ${activityLevel}
      - Weight Change Rate: ${rateNum} kg/week

      **Parameters**
      - Daily Calorie Target: ${calories ? calories + " kcal" : "Calculate TDEE"}
      - Calorie Adjustment: ${calorieAdjustment} kcal/day
      - Diet Preference: ${dietType}
      - Budget: ${budget}
      - Primary Objective: ${goal_description}

      **Instructions**:
      1.  **CALORIE CALCULATION**:
          - If Daily Calorie Target is provided, USE IT EXACTLY.
          - Otherwise, calculate TDEE using Mifflin-St Jeor formula.
          - For BULK: Add ${calorieAdjustment} kcal to TDEE.
          - For CUT: Subtract ${calorieAdjustment} kcal from TDEE.
      2.  **CONTEXT**: The user is in INDIA. Suggest LOCAL, AVAILABLE, and CULTURALLY APPROPRIATE foods (e.g., Paneer, Dal, Chicken, Rice, Roti, Eggs, Oats, Soya Chunks, Peanuts, Banana, Milk, Curd, Chana, Rajma, Moong, Fish, Mutton if non-veg).
      3.  **LANGUAGE**: Provide all text content in both **English** ('en') and **Hindi** ('hi').
      4.  **MEAL PLAN - CRITICAL**: Generate EXACTLY 5-6 MEALS with specific IST timings:
          - Meal 1: Early Morning (6:00-7:00 AM)
          - Meal 2: Breakfast (8:30-9:30 AM)
          - Meal 3: Mid-Morning Snack (11:00-11:30 AM)
          - Meal 4: Lunch (1:00-2:00 PM)
          - Meal 5: Evening Snack (5:00-6:00 PM)
          - Meal 6: Dinner (8:00-9:00 PM)
      5.  **SHOPPING LIST - CRITICAL**: Generate a COMPLETE A-to-Z shopping list for **15 DAYS**. Include EVERY SINGLE ingredient:
          - All proteins (eggs, chicken, paneer, dal, soya chunks, fish, etc.)
          - All grains (rice, wheat flour, oats, bread, etc.)
          - All vegetables (onion, tomato, spinach, capsicum, carrot, etc.)
          - All dairy (milk, curd, cheese, butter, ghee)
          - All fruits (banana, apple, orange, etc.)
          - All spices (turmeric, cumin, coriander, garam masala, salt, pepper, etc.)
          - All oils (mustard oil, olive oil, coconut oil, etc.)
          - Cooking essentials (ginger, garlic, green chilli, lemon, etc.)
          DO NOT MISS ANY INGREDIENT. Include realistic Indian market prices in INR.
      6.  **CATEGORIZATION**: Split shopping list into 'Home_Essentials' (Spices, Oil, common staples likely at home) and 'Market_Purchase' (Fresh produce, specific proteins, perishables).
      7.  **RECIPES**: For each meal, include full recipe instructions, complete ingredient list with quantities, and detailed macros.
      8.  **TIMELINE**: Calculate realistic "estimated_duration" based on ${rateNum} kg/week rate. Provide total_days and total_weeks.
      9.  **Summary**: Write a detailed explanation of the plan.

      **STRICT OUTPUT FORMAT**:
      Return ONLY valid JSON. No Markdown. No pre-text. Matches this schema EXACTLY:
      {
        "summary": {
          "en": "Detailed strategic summary including: User's current stats (${currentWeight}kg, ${height}cm, ${age}yo, ${gender}), goal (${targetWeight}kg), activity level (${activityLevel}), diet type (${dietType}), budget (${budget}), weight change rate (${rateNum}kg/week), calculated calories, and full explanation of the approach...",
          "hi": "Same detailed summary in Hindi..."
        },
        "user_inputs_summary": {
          "gender": "${gender}",
          "age": "${age}",
          "height": "${height}",
          "current_weight": "${currentWeight}",
          "target_weight": "${targetWeight}",
          "activity_level": "${activityLevel}",
          "diet_type": "${dietType}",
          "budget": "${budget}",
          "mode": "${mode}",
          "weight_change_rate": "${rateNum}",
          "calorie_adjustment": "${calorieAdjustment}"
        },
        "transformation_timeline": {
           "estimated_duration": "e.g. 12 Weeks",
           "weekly_change": "${rateNum}kg",
           "daily_calories": 2500,
           "total_days": 84,
           "total_weeks": 12,
           "calorie_adjustment": ${calorieAdjustment}
        },
        "shopping_list": {
            "total_estimated_cost": 5000,
            "duration_days": 15,
            "average_daily_cost": 333,
            "items": [
                {
                    "name": { "en": "Item Name", "hi": "Hindi Name" },
                    "quantity": { "en": "e.g. 2kg", "hi": "e.g. 2kg" },
                    "category": "Home_Essentials" | "Market_Purchase",
                    "duration_days": 15,
                    "price_inr": 150
                }
            ]
        },
        "meal_plan": [
            {
                "name": { "en": "Meal Name", "hi": "Hindi Name" },
                "timing": "7:30 AM",
                "calories": 500,
                "protein": 30,
                "carbs": 50,
                "fats": 15,
                "fiber": 5,
                "sugar": 8,
                "recipe": { "en": "Step-by-step cooking instructions...", "hi": "Hindi instructions..." },
                "ingredients": [
                    { "name": { "en": "Ingredient", "hi": "Hindi" }, "quantity": "100g" }
                ],
                "description": { "en": "Brief description", "hi": "Hindi description" }
            }
        ]
      }
    `;

        // 3. Generate + parse the JSON (with a single retry on malformed output).
        const json = await requestDietJson({
            prompt,
            systemPrompt: "You are a JSON-only API. You must return valid JSON matching the user's schema. Do not include markdown formatting.",
            jsonMode: true,
            temperature: 0.2, // Lower temperature for consistent JSON
        }, prompt, log);

        // 4. Validate the structure; do NOT pass structurally invalid AI output
        // through to the client.
        const validated = DietResponseSchema.safeParse(json);
        if (!validated.success) {
            log.warn('Diet AI response failed validation', { issues: validated.error.issues.length });
            return withRequestId(
                NextResponse.json(
                    { error: 'The AI returned an incomplete meal plan. Please try again.' },
                    { status: 502 }
                ),
                requestId
            );
        }

        // 5. Deduct the credit atomically AFTER a successful generation.
        const spent = await spendUserCredit(supabase, userId);
        if (spent instanceof NextResponse) return withRequestId(spent, requestId);

        return withRequestId(
            NextResponse.json({
                ...validated.data,
                _meta: { remaining: spent.remaining }
            }),
            requestId
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        log.error("Fatal API Error in Generate Diet", { error: errorMessage, stack: errorStack });

        // Provide more helpful error message to the user
        let userMessage = "Generation failed: ";
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
            userMessage = "Access denied: API key or authentication expired.";
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('429')) {
            userMessage = "Daily AI quota reached. Try again tomorrow.";
        } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted') || errorMessage.includes('ECONNREFUSED')) {
            userMessage = "Network timeout — please try again.";
        } else if (errorMessage.includes('JSON')) {
            userMessage = "The AI returned an invalid response. Please try again.";
        } else {
            userMessage += errorMessage;
        }

        return withRequestId(
            NextResponse.json(
                { error: userMessage },
                { status: 500 }
            ),
            requestId
        );
    }
}
