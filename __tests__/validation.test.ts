import { describe, it, expect } from 'vitest';
import { GenerateDietSchema } from '../lib/validation';

describe('validation', () => {
    it('validates numericInRange correctly', () => {
        // Valid string
        expect(GenerateDietSchema.safeParse({ age: "25" }).success).toBe(true);
        // Valid number
        expect(GenerateDietSchema.safeParse({ age: 25 }).success).toBe(true);
        // Invalid NaN
        expect(GenerateDietSchema.safeParse({ age: "abc" }).success).toBe(false);
        // Invalid string number out of range
        expect(GenerateDietSchema.safeParse({ age: "5" }).success).toBe(false);
        // Invalid number out of range
        expect(GenerateDietSchema.safeParse({ age: 500 }).success).toBe(false);
    });
});
