/**
 * Centralized Zod Validation Schemas
 * For all API request bodies.
 */
import { z } from 'zod';

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
