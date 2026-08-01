import { randomUUID } from 'node:crypto';
import type { NextResponse } from 'next/server';

/** Header echoed back to callers so they can reference a request in logs. */
export const REQUEST_ID_HEADER = 'x-request-id';

// Client-supplied ids are honored only when they look like a safe id; anything
// else gets a fresh server UUID. This prevents log injection / spoofing via a
// forged header value.
const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** Read a validated client-supplied id, or mint a fresh one. */
export function getRequestId(req: Request): string {
    const header = req.headers.get(REQUEST_ID_HEADER);
    if (header && SAFE_ID.test(header)) return header;
    return randomUUID();
}

/** Attach the request id to a response so callers can reference it. */
export function withRequestId(response: NextResponse, requestId: string): NextResponse {
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
}
