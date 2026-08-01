/**
 * Shared date/status helpers for the admin members UI. Single source of truth
 * so the members page and its extracted components agree on "today" (IST) and
 * what counts as active/expiring/expired.
 */

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
    const end = new Date(endDateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

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
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${MONTHS[date.getMonth()]}/${date.getFullYear()}`;
}

/** Days until the target date, always projected onto the current year. */
export function getDaysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setFullYear(today.getFullYear()); // Use current year for comparison
    if (target < today) target.setFullYear(today.getFullYear() + 1); // Next year if passed
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
