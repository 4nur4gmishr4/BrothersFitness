import { NextResponse } from "next/server";
import { GenerateDietSchema, DietResponseSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { generateTextWithFallback } from "@/lib/ai-provider";
import { createClient } from "@supabase/supabase-js";
import { MAX_DAILY_CREDITS } from "@/lib/config";

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        logger.error("Missing Supabase Configuration", { url: !!supabaseUrl, key: !!supabaseServiceKey });
        return NextResponse.json(
            { error: "System Configuration Error: API service offline." },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const headerUserId = req.headers.get("x-brofit-user-id");

    if (!headerUserId || headerUserId === 'unknown') {
        return NextResponse.json(
            { error: "Authentication required. Please login to use the Diet Generator." },
            { status: 401 }
        );
    }

    try {
        // 1. Check Credits
        const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('daily_credits, last_credit_reset')
            .eq('firebase_uid', headerUserId)
            .single();

        if (userError || !userProfile) {
            console.error('Diet API: Profile Fetch Error:', userError);
            return NextResponse.json({ error: "User profile not found. Please complete your profile." }, { status: 403 });
        }

        const today = new Date().toISOString().split('T')[0];
        let credits = userProfile.daily_credits;

        if (userProfile.last_credit_reset !== today) {
            credits = MAX_DAILY_CREDITS;
        }

        if (credits <= 0) {
            return NextResponse.json(
                { error: `Daily credits depleted (0/${MAX_DAILY_CREDITS}). Resets tomorrow.` },
                { status: 429 }
            );
        }

        const body = await req.json();

        // Validate with Zod
        const parsed = GenerateDietSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || 'Invalid request' },
                { status: 400 }
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

        // Calculate calorie adjustment based on weight change rate
        // 1 kg of body mass = ~7700 kcal, divided by 7 days = ~1100 kcal/day per kg/week
        const rateNum = parseFloat(String(weightChangeRate)) || 0.5;
        const calorieAdjustment = Math.round(rateNum * 1100);

        const prompt = `
      You are an expert fitness nutritionist for 'BroFit', optimizing for an **Indian User**.
      
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
      10. **Summary**: Write a detailed explanation of the plan.
      
      **STRICT OUTPUT FORMAT**:
      Return ONLY valid JSON. No Markdown. No pre-text. Matches this schema EXACTLY:
      {
        "tactical_brief": { 
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

        const aiResponse = await generateTextWithFallback({
            prompt: prompt,
            systemPrompt: "You are a JSON-only API. You must return valid JSON matching the user's schema. Do not include markdown formatting.",
            jsonMode: true,
            temperature: 0.2 // Lower temperature for consistent JSON
        });

        // Parse JSON from text response
        let parsedResponse;
        try {
            // Clean markdown code blocks if any (e.g. ```json ... ```)
            const cleanJson = aiResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedResponse = JSON.parse(cleanJson);
        } catch {
            console.error("Failed to parse AI response as JSON", aiResponse.text);
            throw new Error(`AI returned invalid JSON: ${aiResponse.modelUsed}`);
        }

        // Validate AI response structure (lenient)
        const validated = DietResponseSchema.safeParse(parsedResponse);
        if (!validated.success) {
            logger.warn('AI response structure mismatch', { issues: validated.error.issues.length });
        }

        // Deduct Credit on Success (Post-Generation)
        await supabase
            .from('users')
            .update({
                daily_credits: credits - 1,
                last_credit_reset: today
            })
            .eq('firebase_uid', headerUserId);

        return NextResponse.json(parsedResponse);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        logger.error("Fatal API Error in Generate Diet", { error: errorMessage, stack: errorStack });

        // Provide more helpful error message to the user
        let userMessage = "Detailed Synthesis Failure: ";
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
            userMessage = "Access Denied: API Key or Authentication validity expired.";
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('429')) {
            userMessage = "Resource Exhausted: AI Daily Quota reached.";
        } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
            userMessage = "Network Interruption: Uplink timed out.";
        } else if (errorMessage.includes('JSON')) {
            userMessage = "Data Corruption: AI Returned Invalid Protocol Structure.";
        } else {
            userMessage += errorMessage;
        }

        return NextResponse.json(
            {
                error: userMessage,
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
