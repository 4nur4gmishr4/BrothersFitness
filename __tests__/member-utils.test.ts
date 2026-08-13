import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDaysUntil } from '@/lib/member-utils';

// Date.parse('YYYY-MM-DD') is UTC, so month/day parts shift in negative
// timezones. Using a local-time noon string keeps every assertion stable on
// any machine/CI. System "today" is pinned via fake timers (local components).
describe('getDaysUntil', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('counts days to an upcoming birthday this year', () => {
        vi.setSystemTime(new Date(2026, 0, 15, 12)); // 15 Jan 2026
        expect(getDaysUntil('1990-02-10T12:00:00')).toBe(26); // 10 Feb 2026
    });

    it('projects a passed birthday to next year', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 12)); // 15 Mar 2026
        expect(getDaysUntil('1990-02-10T12:00:00')).toBe(332); // 10 Feb 2027
    });

    it('clamps Feb 29 to Feb 28 on a non-leap year', () => {
        vi.setSystemTime(new Date(2026, 1, 25, 12)); // 25 Feb 2026
        expect(getDaysUntil('2000-02-29T12:00:00')).toBe(3); // clamps to 28 Feb 2026
    });

    it('keeps Feb 29 in a leap year', () => {
        vi.setSystemTime(new Date(2028, 1, 26, 12)); // 26 Feb 2028
        expect(getDaysUntil('2000-02-29T12:00:00')).toBe(3); // 29 Feb 2028
    });

    it('projects a passed Feb 29 to Feb 28 of the next year', () => {
        vi.setSystemTime(new Date(2026, 2, 15, 12)); // 15 Mar 2026
        expect(getDaysUntil('2000-02-29T12:00:00')).toBe(350); // 28 Feb 2027
    });

    it('returns 0 for an invalid date string', () => {
        vi.setSystemTime(new Date(2026, 1, 28, 12));
        expect(getDaysUntil('not-a-date')).toBe(0);
    });
});
