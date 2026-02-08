// Centralized configuration for business constants
// Update these values in one place to reflect across the entire application

export const PLAN_PRICES = {
    '1 Month': 700,
    'Monthly': 700,
    '3 Months': 1800,
    'Quarterly': 1800,
    '6 Months': 3300,
    'Half-Yearly': 3300,
    '15 Days': 350
} as const;

/**
 * Get price for a plan, defaulting to Monthly if not found
 */
export function getPlanPrice(planName?: string | null): number {
    if (!planName) return PLAN_PRICES['Monthly'];
    return (PLAN_PRICES as Record<string, number>)[planName] ?? PLAN_PRICES['Monthly'];
}

export const CONTACT_INFO = {
    aman: {
        name: 'Aman',
        phone: '+919131179343',
        whatsapp: '919131179343'
    },
    pradeep: {
        name: 'Pradeep',
        phone: '+919131272754',
        whatsapp: '919131272754'
    }
};

export const WHATSAPP_COUNTRY_CODE = '91';

export const GYM_NAME = "Brother's Fitness";

export const MAX_DAILY_CREDITS = 3;
