import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    parseLocalDate,
    todayIST,
    getMemberStatus,
    formatDate,
    formatTodayIST,
    getDaysUntil,
    initials,
} from '@/lib/member-utils';

describe('member-utils', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    describe('parseLocalDate', () => {
        it('parses valid YYYY-MM-DD date strings', () => {
            const date = parseLocalDate('2026-08-15');
            expect(date).not.toBeNull();
            expect(date?.getFullYear()).toBe(2026);
            expect(date?.getMonth()).toBe(7); // August (0-indexed)
            expect(date?.getDate()).toBe(15);
        });

        it('returns null for empty, null, or invalid strings', () => {
            expect(parseLocalDate(null)).toBeNull();
            expect(parseLocalDate('')).toBeNull();
            expect(parseLocalDate('invalid')).toBeNull();
            expect(parseLocalDate('2026-abc-01')).toBeNull();
        });
    });

    describe('todayIST', () => {
        it('returns date string in YYYY-MM-DD format', () => {
            const today = todayIST();
            expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getMemberStatus', () => {
        it('returns active for future end dates > 7 days', () => {
            vi.setSystemTime(new Date(2026, 5, 1, 12)); // 1 June 2026
            expect(getMemberStatus('2026-06-20')).toBe('active');
        });

        it('returns expiring for end dates within 7 days', () => {
            vi.setSystemTime(new Date(2026, 5, 1, 12)); // 1 June 2026
            expect(getMemberStatus('2026-06-05')).toBe('expiring');
        });

        it('returns expired for past end dates', () => {
            vi.setSystemTime(new Date(2026, 5, 10, 12)); // 10 June 2026
            expect(getMemberStatus('2026-06-01')).toBe('expired');
        });

        it('returns active for null or invalid end dates', () => {
            expect(getMemberStatus(null)).toBe('active');
            expect(getMemberStatus('invalid')).toBe('active');
        });
    });

    describe('formatDate', () => {
        it('formats valid date as DD/Mon/YYYY', () => {
            expect(formatDate('2026-08-04')).toBe('04/Aug/2026');
        });

        it('returns - for null or invalid dates', () => {
            expect(formatDate(null)).toBe('-');
            expect(formatDate('invalid')).toBe('-');
        });
    });

    describe('formatTodayIST', () => {
        it('formats current date in DD/Mon/YYYY format in IST', () => {
            const formatted = formatTodayIST();
            expect(formatted).toMatch(/^\d{2}\/[A-Za-z]{3,4}\/\d{4}$/);
        });
    });

    describe('getDaysUntil', () => {
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

    describe('initials', () => {
        it('extracts initials for multi-word names', () => {
            expect(initials('Aman Shrivastava')).toBe('AS');
            expect(initials('Pradeep Kumar Shrivastava')).toBe('PS');
        });

        it('extracts two characters for single-word names', () => {
            expect(initials('Brofit')).toBe('BR');
        });

        it('returns — for empty or null names', () => {
            expect(initials(null)).toBe('—');
            expect(initials('')).toBe('—');
        });
    });
});
