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
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    // Honeypot field - should be empty if submitted by a human
    _honeypot: z.string().max(0, 'Bot detected').optional(),
});
export type ContactPayload = z.infer<typeof ContactSchema>;

// --- Chat ---
export const ChatSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    context: z.object({
        language: z.enum(['en', 'hi']).optional().default('en'),
    }).passthrough(), // Allow extra fields
});
export type ChatPayload = z.infer<typeof ChatSchema>;

// --- Generate Diet ---
export const GenerateDietSchema = z.object({
    calories: z.number().optional(),
    mode: z.string().optional(),
    dietType: z.string().optional(),
    budget: z.string().optional(),
    goal_description: z.string().optional(),
    currentWeight: z.union([z.string(), z.number()]).optional(),
    targetWeight: z.union([z.string(), z.number()]).optional(),
    age: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional(),
    activityLevel: z.string().optional(),
    weightChangeRate: z.union([z.string(), z.number()]).optional(),
});
export type GenerateDietPayload = z.infer<typeof GenerateDietSchema>;

// --- AI Response Schema (lenient, for safeParse) ---
// This validates the *structure* of the AI response to prevent crashes.
export const DietResponseSchema = z.object({
    tactical_brief: z.record(z.string(), z.string()).optional(),
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
    mobile: z.string().min(7, 'Mobile number is required'),
    email: z.string().nullable().optional(),
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
    full_name: z.string().min(1, 'Name is required').optional(),
    date_of_birth: z.string().optional(),
    height_cm: z.number().optional(),
    weight_kg: z.number().optional(),
    gender: z.string().optional(),
    photo_url: z.string().url().optional(),
});
export type ProfileUpdatePayload = z.infer<typeof ProfileUpdateSchema>;
