/**
 * Canonical Fitness & Nutritional Calculations Engine
 * Single source of truth for BMR, TDEE, BMI, and 1RM formulas across the entire application.
 */

export interface BMRParams {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: "Male" | "Female" | string;
}

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  "Sedentary (Office Job)": 1.2,
  "Light (Exercise 1-3 days)": 1.375,
  "Moderate (Exercise 3-5 days)": 1.55,
  "Active (Exercise 6-7 days)": 1.725,
  "Athlete (2x Training)": 1.9,
  "sedentary": 1.2,
  "light": 1.375,
  "moderate": 1.55,
  "active": 1.725,
  "very-active": 1.9,
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 */
export function calculateBMR({ weightKg, heightCm, ageYears, gender }: BMRParams): number | null {
  if (
    isNaN(weightKg) ||
    isNaN(heightCm) ||
    isNaN(ageYears) ||
    weightKg <= 0 ||
    heightCm <= 0 ||
    ageYears <= 0
  ) {
    return null;
  }

  const isMale = String(gender).toLowerCase() === "male";
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return isMale ? base + 5 : base - 161;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTDEE(
  params: BMRParams,
  activityLevel: string
): number | null {
  const bmr = calculateBMR(params);
  if (bmr === null) return null;

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates Body Mass Index (BMI).
 */
export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (isNaN(weightKg) || isNaN(heightCm) || weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export type BMICategory = "Underweight" | "Normal weight" | "Overweight" | "Obesity";

export function getBMICategory(bmi: number): { label: BMICategory; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
  if (bmi < 24.9) return { label: "Normal weight", color: "text-emerald-400" };
  if (bmi < 29.9) return { label: "Overweight", color: "text-amber-400" };
  return { label: "Obesity", color: "text-red-400" };
}

/**
 * Calculates One-Rep Max (1RM) using the Epley formula.
 */
export function calculate1RM(weightKg: number, reps: number): number | null {
  if (isNaN(weightKg) || isNaN(reps) || weightKg <= 0 || reps <= 0) {
    return null;
  }
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}
