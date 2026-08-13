/** Shared types for the Fuel synthesizer UI + its extracted result view. */

export type LocalizedText = { en: string; hi: string };

export type DietPlan = {
    summary: LocalizedText;
    user_inputs_summary?: {
        gender: string;
        age: string;
        height: string;
        current_weight: string;
        target_weight: string;
        activity_level: string;
        diet_type: string;
        budget: string;
        mode: string;
        weight_change_rate?: string;
        calorie_adjustment?: string;
    };
    shopping_list: {
        total_estimated_cost: number;
        duration_days?: number;
        average_daily_cost?: number;
        items: {
            name: LocalizedText;
            quantity: LocalizedText;
            category: "Home_Essentials" | "Market_Purchase";
            duration_days: number;
            price_inr: number;
        }[];
    };
    transformation_timeline?: {
        estimated_duration: string;
        weekly_change: string;
        daily_calories: number;
        total_days?: number;
        total_weeks?: number;
    };
    meal_plan: {
        name: LocalizedText;
        timing?: string;
        calories: number;
        protein: number;
        carbs: number;
        fats: number;
        fiber?: number;
        sugar?: number;
        recipe?: LocalizedText;
        ingredients?: { name: LocalizedText; quantity: string }[];
        description: LocalizedText;
    }[];
};
