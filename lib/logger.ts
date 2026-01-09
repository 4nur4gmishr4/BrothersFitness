/**
 * Structured Logger Utility
 * Provides JSON logging for production observability.
 * In development, logs are human-readable.
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

export const logger = {
    info: (message: string, context?: LogContext) => {
        console.log(formatLog('info', message, context));
    },
    warn: (message: string, context?: LogContext) => {
        console.warn(formatLog('warn', message, context));
    },
    error: (message: string, context?: LogContext) => {
        console.error(formatLog('error', message, context));
    },
    debug: (message: string, context?: LogContext) => {
        if (!isProduction) {
            console.debug(formatLog('debug', message, context));
        }
    },
};
