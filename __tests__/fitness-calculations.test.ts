import { describe, expect, it } from 'vitest';
import {
    calculateBMR,
    calculateTDEE,
    calculateBMI,
    getBMICategory,
    calculate1RM,
} from '@/lib/fitness-calculations';

describe('fitness-calculations', () => {
    describe('calculateBMR', () => {
        it('calculates BMR for male accurately', () => {
            // Male: 10*75 + 6.25*175 - 5*25 + 5 = 750 + 1093.75 - 125 + 5 = 1723.75
            const bmr = calculateBMR({ weightKg: 75, heightCm: 175, ageYears: 25, gender: 'Male' });
            expect(bmr).toBe(1723.75);
        });

        it('calculates BMR for female accurately', () => {
            // Female: 10*60 + 6.25*160 - 5*28 - 161 = 600 + 1000 - 140 - 161 = 1299
            const bmr = calculateBMR({ weightKg: 60, heightCm: 160, ageYears: 28, gender: 'Female' });
            expect(bmr).toBe(1299);
        });

        it('returns null on invalid or non-positive inputs', () => {
            expect(calculateBMR({ weightKg: 0, heightCm: 170, ageYears: 25, gender: 'Male' })).toBeNull();
            expect(calculateBMR({ weightKg: 70, heightCm: -10, ageYears: 25, gender: 'Male' })).toBeNull();
            expect(calculateBMR({ weightKg: 70, heightCm: 170, ageYears: 0, gender: 'Male' })).toBeNull();
            expect(calculateBMR({ weightKg: NaN, heightCm: 170, ageYears: 25, gender: 'Male' })).toBeNull();
        });
    });

    describe('calculateTDEE', () => {
        it('calculates TDEE using mapped activity level multiplier', () => {
            const params = { weightKg: 75, heightCm: 175, ageYears: 25, gender: 'Male' }; // BMR = 1723.75
            expect(calculateTDEE(params, 'sedentary')).toBe(Math.round(1723.75 * 1.2));
            expect(calculateTDEE(params, 'Moderate (Exercise 3-5 days)')).toBe(Math.round(1723.75 * 1.55));
            expect(calculateTDEE(params, 'active')).toBe(Math.round(1723.75 * 1.725));
            expect(calculateTDEE(params, 'Athlete (2x Training)')).toBe(Math.round(1723.75 * 1.9));
        });

        it('uses default 1.55 multiplier for unknown activity levels', () => {
            const params = { weightKg: 75, heightCm: 175, ageYears: 25, gender: 'Male' };
            expect(calculateTDEE(params, 'unknown-activity')).toBe(Math.round(1723.75 * 1.55));
        });

        it('returns null if BMR cannot be calculated', () => {
            const invalidParams = { weightKg: -10, heightCm: 175, ageYears: 25, gender: 'Male' };
            expect(calculateTDEE(invalidParams, 'sedentary')).toBeNull();
        });
    });

    describe('calculateBMI', () => {
        it('calculates BMI rounded to 1 decimal place', () => {
            // 70 / (1.75 * 1.75) = 22.857... => 22.9
            expect(calculateBMI(70, 175)).toBe(22.9);
        });

        it('returns null on invalid inputs', () => {
            expect(calculateBMI(0, 175)).toBeNull();
            expect(calculateBMI(70, -10)).toBeNull();
            expect(calculateBMI(NaN, 175)).toBeNull();
        });
    });

    describe('getBMICategory', () => {
        it('categorizes BMI correctly', () => {
            expect(getBMICategory(17.5).label).toBe('Underweight');
            expect(getBMICategory(22.0).label).toBe('Normal weight');
            expect(getBMICategory(27.5).label).toBe('Overweight');
            expect(getBMICategory(32.0).label).toBe('Obesity');
        });
    });

    describe('calculate1RM', () => {
        it('returns exact weight for 1 rep', () => {
            expect(calculate1RM(100, 1)).toBe(100);
        });

        it('calculates 1RM with Epley formula for multi-reps', () => {
            // 100 * (1 + 10 / 30) = 133.33 => 133
            expect(calculate1RM(100, 10)).toBe(133);
        });

        it('returns null on non-positive or NaN values', () => {
            expect(calculate1RM(0, 5)).toBeNull();
            expect(calculate1RM(100, 0)).toBeNull();
            expect(calculate1RM(NaN, 5)).toBeNull();
        });
    });
});
