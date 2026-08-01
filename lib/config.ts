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

// Daily AI credit cap per user, configurable via env so each deployment can
// tune it without a code change. The DB side is coupled: the users table
// CHECK upper bound and the app_settings.max_daily_credits value used by
// reset_daily_credits() must be raised to match (see the
// configurable-credits migration) before bumping this beyond 5.
const CREDITS_FROM_ENV = Number(process.env.MAX_DAILY_CREDITS);
export const MAX_DAILY_CREDITS =
    Number.isInteger(CREDITS_FROM_ENV) && CREDITS_FROM_ENV >= 1 ? CREDITS_FROM_ENV : 5;

// Single source of truth for valid membership plans. Used by both the
// Zod member schema (lib/validation.ts) and price lookups above.
export const MEMBERSHIP_PLANS = [
    '15 Days',
    '1 Month',
    'Monthly',
    '3 Months',
    'Quarterly',
    '6 Months',
    'Half-Yearly',
] as const;

// The selectable plans shown in the registration form, with their display
// labels. Stored values ('1 Month' etc.) are the canonical membership_type
// keys; labels are the friendlier strings shown to the admin.
export const MEMBERSHIP_PLAN_DETAILS = [
    { value: '15 Days', label: '15 Days' },
    { value: '1 Month', label: 'Monthly' },
    { value: '3 Months', label: 'Quarterly' },
    { value: '6 Months', label: 'Half-Yearly' },
] as const;
