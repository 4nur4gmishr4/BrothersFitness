import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Lazy initialization to avoid build-time crash when OPENAI_API_KEY is not set
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!openaiClient) {
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

export async function POST(req: Request) {
    try {
        const {
            calories,
            mode,
            dietType,
            budget,
            // exclusions removed - not currently used
            goal_description,
            currentWeight,
            targetWeight,
            age,
            height,
            gender,
            activityLevel,
            weightChangeRate
        } = await req.json();

        // Calculate calorie adjustment based on weight change rate
        // 1 kg of body mass = ~7700 kcal, divided by 7 days = ~1100 kcal/day per kg/week
        const rateNum = parseFloat(weightChangeRate) || 0.5;
        const calorieAdjustment = Math.round(rateNum * 1100);

        const prompt = `
      You are a tactical fitness nutritionist for 'BroFit', a high-performance system optimizing for an **Indian User**.
      
      **MISSION PROFILE // USER BIOMETRICS**
      - Gender: ${gender}
      - Age: ${age} years
      - Height: ${height} cm
      - Current Weight: ${currentWeight} kg
      - Target Weight: ${targetWeight} kg
      - Activity Level: ${activityLevel}
      - Weight Change Rate: ${rateNum} kg/week
      
      **OPERATIONAL PARAMETERS**
      - Daily Calorie Target: ${calories ? calories + " kcal (PRE-CALCULATED)" : "CALCULATE OPTIMAL TDEE"}
      - Calorie Adjustment: ${calorieAdjustment} kcal/day (${rateNum} kg/week × 1100)
      - Training Mode: ${mode} (${parseFloat(targetWeight) > parseFloat(currentWeight) ? "BULK - Add calories" : "CUT - Subtract calories"})
      - Diet Preference: ${dietType}
      - Budget: ${budget}
      - Primary Objective: ${goal_description}

      **TACTICAL INSTRUCTIONS**:
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
      9.  **TACTICAL BRIEF**: Write a DETAILED summary explaining the strategy for the user.
      
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

        // Unified AI Fallback Chain: Smartest -> Fastest
        const modelChain = [
            { provider: "google", name: "gemini-1.5-pro" },      // Smartest Google
            { provider: "openai", name: "gpt-4o" },              // Smartest OpenAI
            { provider: "google", name: "gemini-1.5-flash" },    // Fast & Smart
            { provider: "openai", name: "gpt-4-turbo" },         // Balanced
            { provider: "google", name: "gemini-pro" },          // Legacy Stable
            { provider: "openai", name: "gpt-4o-mini" },         // Ultra-fast efficiency
            { provider: "openai", name: "gpt-3.5-turbo" }         // Last resort fallback
        ];

        for (const entry of modelChain) {
            try {
                console.log(`[AI Uplink] Attempting synthesis with ${entry.name} (${entry.provider})...`);

                if (entry.provider === "google") {
                    const model = genAI.getGenerativeModel({
                        model: entry.name,
                        generationConfig: { responseMimeType: "application/json" }
                    });
                    const result = await model.generateContent(prompt);
                    const text = result.response.text();
                    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
                    return NextResponse.json(JSON.parse(cleanJson));
                } else {
                    const completion = await getOpenAI().chat.completions.create({
                        messages: [
                            { role: "system", content: "You are a JSON-only API. You must return valid JSON matching the user's schema. Do not include markdown formatting." },
                            { role: "user", content: prompt }
                        ],
                        model: entry.name,
                        response_format: { type: "json_object" }
                    });

                    const content = completion.choices[0].message.content;
                    if (!content) throw new Error("OpenAI returned empty response");
                    return NextResponse.json(JSON.parse(content));
                }
            } catch (error: unknown) {
                const err = error as { message?: string; status?: number };
                console.warn(`[System] ${entry.name} failed. Moving to next candidate. Error:`, err.message || error);
                continue; // Move to the next model in the chain
            }
        }

        // If all fail
        throw new Error("All AI Strategic Units Exhausted");
    } catch (error) {
        console.error("Fatal API Error:", error);
        return NextResponse.json(
            { error: "Failed to synthesize protocol. Systems Overloaded. Please try again later." },
            { status: 500 }
        );
    }
}
