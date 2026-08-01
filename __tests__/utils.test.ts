import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
    it('joins truthy class strings with a space', () => {
        expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('drops falsy values', () => {
        expect(cn('a', undefined, null, false, 0, '', 'b')).toBe('a b');
    });

    it('flattens nested arrays and conditionals', () => {
        expect(cn(['a', ['b', false]], { c: true, d: false })).toBe('a b c');
    });

    it('lets tailwind-merge resolve conflicting utilities last-wins', () => {
        // tailwind-merge keeps the later padding class only.
        expect(cn('p-4', 'px-6')).toBe('p-4 px-6');
        expect(cn('px-6', 'px-2')).toBe('px-2');
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('returns an empty string for no valid inputs', () => {
        expect(cn()).toBe('');
        expect(cn(null, undefined, false)).toBe('');
    });
});
