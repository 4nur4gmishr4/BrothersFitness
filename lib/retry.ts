/**
 * Retry helper for transient network failures (M4).
 *
 * Only idempotent operations may be retried blindly. Non-idempotent writes
 * (e.g. the credit-spend RPC) must reconcile state before retrying — see
 * lib/credit-service.ts for the reconciliation pattern.
 */

const DEFAULT_ATTEMPTS = 3;
const BASE_DELAY_MS = 150;
const MAX_DELAY_MS = 2000;

/** Extract a searchable message from any thrown value (Error or PostgrestError). */
function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    return '';
}

/**
 * Classify an error as transient (network/connection/5xx) vs permanent.
 * Permanent errors (4xx, validation) must NOT be retried — retrying masks real
 * bugs and wastes provider quota.
 */
export function isTransientError(error: unknown): boolean {
    const msg = errorMessage(error);
    if (/fetch failed|network|ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|connection reset/i.test(msg)) {
        return true;
    }
    // PostgREST 5xx (server error) — safe to retry, unlike 4xx.
    return /(^|\D)[5]\d{2}(\D|$)/.test(msg);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RetryOptions {
    attempts?: number;
    baseDelayMs?: number;
}

/**
 * Run `fn`, retrying up to `attempts` times with exponential backoff + jitter
 * on transient failures only. Jitter prevents retry stampedes across a fleet.
 * Throws the last error once retries are exhausted (or a permanent error hits).
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
    const baseDelayMs = options.baseDelayMs ?? BASE_DELAY_MS;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (!isTransientError(error) || attempt === attempts - 1) {
                throw error;
            }
            const delay = Math.min(MAX_DELAY_MS, baseDelayMs * 2 ** attempt);
            await sleep(delay + Math.random() * delay * 0.25);
        }
    }
    throw lastError;
}

interface ResultWithError {
    error: unknown;
    data?: unknown;
}

/**
 * Run a Supabase query, retrying on transient (network) failures.
 * Supabase surfaces network errors as returned `error` values rather than
 * throwing, so we re-throw transient ones to let withRetry back off. Non-
 * transient errors (4xx, validation) pass through untouched, as do the
 * original `{ data, error }` results on success.
 */
export async function retryableQuery<TResult extends ResultWithError>(
    fn: () => PromiseLike<TResult>
): Promise<TResult> {
    try {
        return await withRetry(async () => {
            const res = await fn();
            if (res.error && isTransientError(res.error)) throw res.error;
            return res;
        });
    } catch (error) {
        // Retries exhausted (or non-transient): normalize back to an error
        // result so callers keep the existing `if (error)` handling.
        return { data: null, error } as TResult;
    }
}
