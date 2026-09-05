# API Reference & Route Specifications

This document provides the complete technical specification for all RESTful route handlers, authentication requirements, and request/response payloads in **BroFit**.

---

## 1. Authentication & Security Headers

### Trainee Authentication
Trainee endpoints require the Supabase JWT passed as a Bearer token:
```http
Authorization: Bearer <supabase_access_token>
```

### Administrator Authentication
Administrative endpoints under `/api/admin/*` require the HMAC-signed admin token:
```http
Authorization: Bearer <admin_token>
```
*Note: The token is also automatically validated from the HttpOnly `admin_token` cookie if present.*

---

## 2. Complete Endpoint Directory

| Method | Endpoint | Access Level | Description | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Public (Master Passcode) | Authenticates admin passcode, returns signed HMAC token | 5 req / 15 min |
| `POST` | `/api/admin/logout` | Administrator | Revokes admin token by blacklisting its nonce | - |
| `GET` | `/api/admin/verify` | Administrator | Validates session token validity on route transition | - |
| `GET` | `/api/admin/members` | Administrator | Retrieves paginated members with search and sorting | - |
| `POST` | `/api/admin/members` | Administrator | Registers a new gym member record | - |
| `PUT` | `/api/admin/members` | Administrator | Updates an existing member profile | - |
| `DELETE` | `/api/admin/members` | Administrator | Deletes a member and cleans up associated photo assets | - |
| `GET` | `/api/admin/leads` | Administrator | Retrieves visitor contact submissions | - |
| `DELETE` | `/api/admin/leads` | Administrator | Deletes a lead record by UUID | - |
| `GET` | `/api/admin/activity-logs` | Administrator | Fetches immutable audit trail of administrative events | - |
| `POST` | `/api/admin/upload` | Administrator | Uploads magic-byte validated photo to `member-photos` | - |
| `POST` | `/api/admin/backup` | Administrator | Generates and saves a full JSON database snapshot | - |
| `POST` | `/api/generate-diet` | Trainee (OAuth JWT) | Synthesizes 6-meal nutrition protocol; spends 1 credit | 5 credits / day |
| `POST` | `/api/chat` | Trainee (OAuth JWT) | Tactical fitness chatbot conversation; spends 1 credit | 5 credits / day |
| `POST` | `/api/contact` | Public Visitor | Ingests contact inquiry into CRM leads inbox | 3 req / 1 hour |
| `GET` | `/api/public/member-count`| Public Visitor | Live active member count and 4-month quarterly trend | - |
| `GET` | `/api/rate-limit-status` | Trainee (OAuth JWT) | Checks remaining daily AI generation credits | - |
| `GET` | `/api/exercises/ninjas` | Public Visitor | Proxies API Ninjas exercise database with 1h cache | - |
| `GET` | `/api/health` | Public Probe | Service liveness check | - |
| `GET` | `/api/cron/monthly-revenue`| Cron (`CRON_SECRET`)| Computes monthly revenue, plan breakdown, and churn | - |

---

## 3. Public & Trainee Endpoints

### `POST /api/generate-diet`
Synthesizes a 6-meal Indian nutritional protocol and 15-day grocery procurement plan tailored to user biometrics and caloric targets.

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <supabase_user_jwt>
```

**Request Body:**
```json
{
  "age": 24,
  "gender": "male",
  "currentWeight": 72,
  "targetWeight": 78,
  "height": 178,
  "activityLevel": "moderate",
  "goal": "bulk",
  "dietaryPreference": "vegetarian",
  "budget": "medium",
  "lang": "en"
}
```

**Response (`200 OK`):**
```json
{
  "calories": 2850,
  "macros": {
    "protein": 160,
    "carbs": 360,
    "fats": 75
  },
  "meals": [
    {
      "name": "Breakfast",
      "timing": "8:30 AM",
      "items": ["Paneer Oats Porridge", "1 Banana", "Almonds"],
      "calories": 650,
      "protein": 32,
      "carbs": 85,
      "fats": 18
    }
  ],
  "groceries": [
    { "category": "Dairy", "item": "Low-Fat Paneer", "quantity": "2.5 kg" },
    { "category": "Grains", "item": "Rolled Oats", "quantity": "2 kg" }
  ]
}
```

<div align="center">
  <p><sub><b>Mobile UI Rendering of Synthesized Nutrition Response (Full Red/Black iOS Theme)</b></sub></p>

[![Rendered Diet Response Interface](./assets/ios-fuel-preview.svg)](./assets/ios-fuel-preview.svg)

</div>

---

### `POST /api/chat`
Conversational fitness assistant supporting English and Hinglish inquiries.

**Request Body:**
```json
{
  "message": "How many grams of protein should I consume for muscle gain?",
  "history": [
    { "role": "user", "content": "Hi, I am a 70kg trainee." }
  ]
}
```

**Response (`200 OK`):**
```json
{
  "reply": "For muscle hypertrophy, aim for 1.6g to 2.2g of protein per kg of bodyweight (approx 112g–154g daily for 70kg). Focus on paneer, lentils, whey, and soy chunks.",
  "creditsRemaining": 4
}
```

---

### `POST /api/contact`
Submits public inquiry into the gym's CRM leads inbox.

**Request Body:**
```json
{
  "name": "Aarav Sharma",
  "email": "aarav.sample@example.com",
  "phone": "+91 98765 43210",
  "message": "Inquiring about personal training and quarterly gym packages.",
  "_honeypot": ""
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Inquiry submitted successfully. A trainer will reach out shortly."
}
```

---

### `GET /api/public/member-count`
Retrieves live count of active gym trainees and 4-month quarterly trend metrics for the public landing page.

**Response (`200 OK`):**
```json
{
  "count": 184,
  "trends": [
    { "month": "Jun", "members": 152 },
    { "month": "Jul", "members": 164 },
    { "month": "Aug", "members": 176 },
    { "month": "Sep", "members": 184 }
  ]
}
```

---

### `GET /api/rate-limit-status`
Returns the authenticated trainee's remaining AI generation credits for today.

**Response (`200 OK`):**
```json
{
  "dailyCredits": 4,
  "maxDailyCredits": 5,
  "resetAt": "2026-09-06T00:00:00+05:30"
}
```

---

## 4. Administrative Endpoints (`/api/admin/*`)

### `POST /api/admin/login`
Authenticates master password against `ADMIN_PASSWORD` using constant-time comparison.

**Request Body:**
```json
{
  "password": "<master_passcode>"
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "token": "<stateless_hmac_token>",
  "message": "Welcome back"
}
```

---

### `POST /api/admin/logout`
Revokes an active administrative token by blacklisting its nonce in Redis and memory.

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Session terminated"
}
```

---

### `GET /api/admin/members`
Fetches paginated gym members with search and status filtering.

**Query Parameters:**
- `search`: Filter by name, mobile, address, or plan.
- `page`: Page number (default: 1).
- `pageSize`: Items per page (default: 50).
- `sort`: `newest`, `oldest`, `a-z`.

**Response (`200 OK`):**
```json
{
  "members": [
    {
      "id": "7b0d2d3e-2f95-46b8-b80c-26156a00ef90",
      "full_name": "Rohan Patel",
      "mobile": "+91 98765 12345",
      "membership_type": "Monthly",
      "membership_start": "2026-09-01",
      "membership_end": "2026-10-01",
      "photo_url": "https://<supabase-url>/storage/v1/object/public/member-photos/patel.jpg",
      "notes": "Evening batch trainee",
      "created_at": "2026-09-01T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 50
}
```

---

### `POST /api/admin/upload`
Uploads a member avatar photograph validated through binary magic-byte inspection (JPEG, PNG, WebP).

**Request:** `multipart/form-data` with `file` binary.

**Response (`200 OK`):**
```json
{
  "success": true,
  "url": "https://<supabase-url>/storage/v1/object/public/member-photos/uuid-avatar.webp"
}
```

---

### `POST /api/admin/backup`
Generates a full JSON snapshot of all gym database records and uploads to private Supabase `backups` bucket.

**Response (`200 OK`):**
```json
{
  "success": true,
  "filename": "backup-2026-09-05-180000.json",
  "membersCount": 184,
  "leadsCount": 42
}
```

---

## 5. Cron & Scheduled Endpoints

### `GET /api/cron/monthly-revenue`
Computes calendar-month revenue, plan breakdown, and churn. Protected by `Authorization: Bearer <CRON_SECRET>`.

**Response (`200 OK`):**
```json
{
  "success": true,
  "period": "2026-08",
  "totalRevenue": 142000,
  "newRegistrations": 28,
  "renewals": 45,
  "churned": 4
}
```
