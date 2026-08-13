/**
 * Shared date/status helpers for the admin members UI. Single source of truth
 * so the members page and its extracted components agree on "today" (IST) and
 * what counts as active/expiring/expired.
 */

/** Safely parse a YYYY-MM-DD date string as local time without UTC offset skewing the day. */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const clean = String(dateStr).trim().split('T')[0];
    const parts = clean.split('-');
    if (parts.length < 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d);
}

/** "Today" as YYYY-MM-DD in India Standard Time (5:30 AM reset). */
export function todayIST(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

/** Categorise a membership by its end date relative to today. */
export function getMemberStatus(endDateString: string | null): 'active' | 'expiring' | 'expired' {
    if (!endDateString) return 'active';
    const end = parseLocalDate(endDateString);
    if (!end) return 'active';
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 7) return 'expiring';
    return 'active';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** DD/Mon/YYYY (e.g. 04/Aug/2026) — or "-" for null/empty. */
export function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const date = parseLocalDate(dateString);
    if (!date) return '-';
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
}

/**
 * "Now" rendered as DD/Mon/YYYY in IST. Use this for a human-facing "today"
 * stamp: formatting `new Date().toISOString()` (UTC) in local time shows
 * *yesterday* during 00:00–05:29 IST (M27).
 */
export function formatTodayIST(): string {
    const parts = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    }).formatToParts(new Date());
    const day = parts.find(p => p.type === 'day')?.value ?? '';
    const month = parts.find(p => p.type === 'month')?.value ?? '';
    const year = parts.find(p => p.type === 'year')?.value ?? '';
    return `${day}/${month}/${year}`;
}

/** Days until the target date, always projected onto the current year. */
export function getDaysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const born = parseLocalDate(dateString);
    if (!born) return 0;

    // Build the birthday from month/day parts so a Feb 29 birthday clamps to
    // Feb 28 on non-leap years instead of the Date constructor silently
    // rolling it over to Mar 1 (L50).
    let target = new Date(today.getFullYear(), born.getMonth(), born.getDate());
    if (target.getMonth() !== born.getMonth() || target.getDate() !== born.getDate()) {
        // Day 0 of the *next* month = last real day of the birthday month
        // (Feb 29 rolls here to Feb 28; day 0 of the same month would be Jan 31).
        target = new Date(today.getFullYear(), born.getMonth() + 1, 0);
    }
    if (target < today) target.setFullYear(today.getFullYear() + 1); // Next year if passed
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
