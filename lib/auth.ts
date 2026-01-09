import { createHmac } from 'crypto';

// Stateless token verification for serverless environments
// We use a simple HMAC signature based on the ADMIN_PASSWORD
// In production, you could add an expiration timestamp to the payload

function getSecret(): string {
    const secret = process.env.ADMIN_PASSWORD;
    if (!secret) {
        throw new Error('CRITICAL: ADMIN_PASSWORD environment variable is not set.');
    }
    return secret;
}

export function generateAdminToken(): string {
    const timestamp = Date.now().toString();
    const signature = createHmac('sha256', getSecret())
        .update(timestamp)
        .digest('hex');

    // The token is [timestamp].[signature]
    return `${timestamp}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
    if (!token || !token.includes('.')) return false;

    const [timestamp, signature] = token.split('.');

    // Optional: Add expiration check (e.g., 24 hours)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (isNaN(tokenTime) || now - tokenTime > 24 * 60 * 60 * 1000) {
        return false;
    }

    const expectedSignature = createHmac('sha256', getSecret())
        .update(timestamp)
        .digest('hex');

    return signature === expectedSignature;
}

export function storeAdminToken(token: string): void {
    // No-op: Token is stateless and carries its own proof of validity
}

export function revokeAdminToken(token: string): void {
    // In a stateless system, revocation usually requires a blacklist in Redis
    // For this simple case, we rely on token expiration
}

// Helper to extract token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
}
