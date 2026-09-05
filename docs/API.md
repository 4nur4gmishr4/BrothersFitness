# API Reference & Route Specifications

Complete specification of all RESTful route handlers in BroFit.

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

## 2. Public & Trainee Endpoints

### `POST /api/generate-diet`
Synthesizes a 6-meal nutritional protocol and 15-day grocery procurement plan tailored to user biometrics and caloric targets.

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

---

### `POST /api/chat`
Conversational fitness assistant supporting English and Hinglish inquiries.

**Request Body:**
```json
{
  "message": "How many grams of protein should I consume for muscle gain?",
  "history": [
    { "role": "user", "content": "Hi, I am 70kg trainee." }
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

## 3. Administrative Endpoints (`/api/admin/*`)

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

### `POST /api/admin/backup`
Generates a full JSON snapshot of all gym database records and uploads to private Supabase `backups` bucket.

**Response (`200 OK`):**
```json
{
  "success": true,
  "filename": "backup-2026-09-05-175245.json",
  "membersCount": 184,
  "leadsCount": 42
}
```
