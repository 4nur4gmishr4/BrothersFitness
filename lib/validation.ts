/**
 * Centralized Zod Validation Schemas
 * For all API request bodies.
 */
import { z } from 'zod';
import { MEMBERSHIP_PLANS } from '@/lib/config';

// --- Admin Login ---
export const LoginSchema = z.object({
    password: z.string().min(1, 'Password is required'),
});
export type LoginPayload = z.infer<typeof LoginSchema>;

// --- Contact Form ---
export const ContactSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Invalid email format').max(254, 'Email is too long'),
    phone: z.string().max(20, 'Phone is too long').optional(),
    message: z.string().min(1, 'Message is required').max(2000, 'Message must be under 2000 characters'),
    // Honeypot field - should be empty if submitted by a human
    _honeypot: z.string().max(0, 'Bot detected').optional(),
});
export type ContactPayload = z.infer<typeof ContactSchema>;

// --- Chat ---
export const ChatSchema = z.object({
    message: z.string().min(1, 'Message is required').max(4000, 'Message must be under 4000 characters'),
    context: z.object({
        language: z.enum(['en', 'hi']).optional().default('en'),
    }).passthrough(), // Allow extra fields
});
export type ChatPayload = z.infer<typeof ChatSchema>;

// --- Generate Diet ---
// Shared numeric bound so the server never pays for or renders absurd biometrics.
const numericInRange = (min: number, max: number) =>
    z.union([z.string(), z.number()]).refine(
        (v) => {
            const n = typeof v === 'number' ? v : parseFloat(v);
            return !Number.isNaN(n) && n >= min && n <= max;
        },
        { message: `Value must be between ${min}-${max}` }
    );

export const GenerateDietSchema = z.object({
    calories: z.number().min(800).max(10000).optional(),
    mode: z.string().max(20).optional(),
    dietType: z.string().max(40).optional(),
    budget: z.string().max(100).optional(),
    goal_description: z.string().max(500, 'Goal description must be under 500 characters').optional(),
    currentWeight: numericInRange(1, 500).optional(),
    targetWeight: numericInRange(1, 500).optional(),
    age: numericInRange(10, 120).optional(),
    height: numericInRange(50, 300).optional(),
    gender: z.string().max(20).optional(),
    activityLevel: z.string().max(40).optional(),
    weightChangeRate: numericInRange(0, 5).optional(),
});
export type GenerateDietPayload = z.infer<typeof GenerateDietSchema>;

// --- AI Response Schema (lenient, for safeParse) ---
// This validates the *structure* of the AI response to prevent crashes.
export const DietResponseSchema = z.object({
    summary: z.record(z.string(), z.string()).optional(),
    user_inputs_summary: z.record(z.string(), z.any()).optional(),
    transformation_timeline: z.object({
        estimated_duration: z.string().optional(),
        weekly_change: z.string().optional(),
        daily_calories: z.number().optional(),
        total_days: z.number().optional(),
        total_weeks: z.number().optional(),
    }).passthrough().optional(),
    shopping_list: z.object({
        total_estimated_cost: z.number().optional(),
        duration_days: z.number().optional(),
        items: z.array(z.any()).optional(),
    }).passthrough().optional(),
    meal_plan: z.array(z.any()).optional(),
}).passthrough(); // Allow extra fields from AI

// --- Admin Member (create/update) ---
// membership_type is constrained to the known plans so it can be used safely
// as a PLAN_PRICES lookup key (a typo previously produced ₹0 revenue).
export const MemberSchema = z.object({
    full_name: z.string().min(1, 'Name is required'),
    mobile: z.string().min(7, 'Mobile number is required').max(15, 'Mobile number is too long'),
    address: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    height_cm: z.number().min(50).max(300).nullable().optional(),
    weight_kg: z.number().min(10).max(500).nullable().optional(),
    photo_url: z.string().nullable().optional(),
    membership_type: z.enum(MEMBERSHIP_PLANS).nullable().optional(),
    membership_start: z.string().nullable().optional(),
    membership_end: z.string().nullable().optional(),
    emergency_contact: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});
export type MemberPayload = z.infer<typeof MemberSchema>;

// --- Profile Update ---
export const ProfileUpdateSchema = z.object({
    full_name: z.string().min(1, 'Name is required').max(100).optional(),
    date_of_birth: z.string().optional(),
    height_cm: z.number().min(50).max(300).optional(),
    weight_kg: z.number().min(10).max(500).optional(),
    gender: z.string().max(20).optional(),
    photo_url: z.string().url().optional(),
});
export type ProfileUpdatePayload = z.infer<typeof ProfileUpdateSchema>;
