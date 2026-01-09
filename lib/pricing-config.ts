/**
 * Pricing Configuration
 * Centralized plan prices for revenue calculations.
 * 
 * To update prices, modify this file. No code deployment needed for price logic changes
 * if you move this to a database or external config in the future.
 */

export const PLAN_PRICES: Record<string, number> = {
    'Monthly': 700,
    'Quarterly': 1800,
    '6 Months': 3200,
    '15 Days': 400,
};

/**
 * Get the price for a given plan.
 * Returns a default of 700 (Monthly) if plan is not found.
 */
export function getPlanPrice(planName: string | null | undefined): number {
    if (!planName) return PLAN_PRICES['Monthly'];
    return PLAN_PRICES[planName] ?? PLAN_PRICES['Monthly'];
}
