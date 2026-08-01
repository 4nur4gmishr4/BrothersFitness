/**
 * Structured Logger Utility
 * Provides JSON logging for production observability.
 * In development, logs are human-readable.
 *
 * `logger.child({ requestId })` returns a logger bound to that context — every
 * line it emits carries the request id, so the logs for one serverless
 * invocation can be traced end-to-end.
 */

const isProduction = process.env.NODE_ENV === 'production';

interface LogContext {
    [key: string]: unknown;
}

function formatLog(level: string, message: string, context?: LogContext): string {
    if (isProduction) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...context,
        });
    }
    // Development: human-readable format
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${level.toUpperCase()}] ${message}${contextStr}`;
}

type LogFn = (message: string, context?: LogContext) => void;

interface Logger {
    info: LogFn;
    warn: LogFn;
    error: LogFn;
    debug: LogFn;
    /** Returns a logger that merges `context` into every subsequent line. */
    child: (context: LogContext) => Logger;
}

// Keep a bare line truly bare (dev output shows no "{}" when nothing is bound),
// but attach context the moment any is present — child-scoped or per-call.
function mergeContext(bound: LogContext, context?: LogContext): LogContext | undefined {
    const merged = { ...bound, ...context };
    return Object.keys(merged).length ? merged : undefined;
}

function createLogger(bound: LogContext): Logger {
    const emit = (consoleFn: (...args: unknown[]) => void, level: string): LogFn =>
        (message, context) => consoleFn(formatLog(level, message, mergeContext(bound, context)));

    return {
        info: emit(console.log, 'info'),
        warn: emit(console.warn, 'warn'),
        error: emit(console.error, 'error'),
        debug: (message, context) => {
            if (!isProduction) {
                console.debug(formatLog('debug', message, mergeContext(bound, context)));
            }
        },
        child: (context) => createLogger({ ...bound, ...context }),
    };
}

export const logger = createLogger({});
