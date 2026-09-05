# Security Architecture & Anti-Abuse Hardening

This document outlines the security controls, authentication safeguards, and defensive measures implemented in BroFit.

---

## 1. Zero-Trust Administrative Security

### Constant-Time Passcode Verification
To eliminate timing side-channel attacks on master passcode verification, `crypto.timingSafeEqual` is strictly enforced:
```typescript
const passwordBuffer = Buffer.from(password);
const adminPasswordBuffer = Buffer.from(adminPassword);

if (passwordBuffer.length === adminPasswordBuffer.length) {
    isValid = timingSafeEqual(passwordBuffer, adminPasswordBuffer);
} else {
    // Constant-time dummy check to prevent timing leaks on input length
    timingSafeEqual(adminPasswordBuffer, adminPasswordBuffer);
    isValid = false;
}
```

### Stateless HMAC-SHA256 Token with Distributed Revocation
1. Admin tokens follow the structure: `<base64url(payload)>.<signature>` where payload includes a cryptographic `nonce`, `iat`, and `exp` (24-hour lifetime).
2. On logout, the token's nonce is immediately pushed into both a local in-memory Set and an **Upstash Redis** set (`brofit:admin:revoked-nonces`) with a 24-hour TTL.
3. Every protected route via `requireAdminToken()` checks whether the token's nonce has been revoked before processing the request.

---

## 2. Distributed Rate Limiting

Rate limiting is enforced at the serverless API boundary using `@upstash/ratelimit` with an in-memory sliding-window fallback for local development:

| Target Endpoint | Limit Preset | Window | Identifier |
| :--- | :--- | :--- | :--- |
| `/api/admin/login` | **5 requests** | 15 minutes | Trusted Client IP |
| `/api/contact` | **3 submissions** | 1 hour | Trusted Client IP |
| `/api/generate-diet` | **5 credits** | 24 hours (IST) | Supabase User UUID |
| `/api/chat` | **5 credits** | 24 hours (IST) | Supabase User UUID |

### Trusted IP Resolution
To prevent header spoofing via `x-forwarded-for`, proxies are only honored when running in verified environments (`VERCEL=1` or `TRUST_PROXY_HEADERS=true`), resolving to the rightmost trustworthy IP in the forward chain.

---

## 3. Input Sanitization & Anti-Abuse

### Magic-Byte MIME Validation (`/api/admin/upload`)
The server validates the first 8–12 bytes of binary image buffers before committing them to Supabase Storage:
- **JPEG**: `FF D8 FF`
- **PNG**: `89 50 4E 47 0D 0A 1A 0A`
- **WebP**: `RIFF....WEBP`
- **AVIF**: `....ftypavif`
- **GIF**: `GIF87a` / `GIF89a`
Client-spoofed file extensions or disguised executables are rejected immediately with HTTP 400.

### CSV Formula Injection Neutralization
When exporting administrative data (`/admin/dashboard` & `/admin/members`), all cell values starting with formula control characters (`=`, `+`, `-`, `@`, `\t`, `\r`, `\n`) are sanitized with leading tab delimiters to prevent remote code execution in spreadsheet software.

### Honeypot Bot Detection
Contact forms include a visually hidden `_honeypot` field. Automated scraping bots that populate this field receive a deceptive `{ success: true }` HTTP 200 response while the database insertion is silently discarded.
