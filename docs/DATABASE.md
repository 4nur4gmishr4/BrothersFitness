# Database Architecture & Security Model

This document provides the definitive technical specification for the **PostgreSQL 15** database schema, Row Level Security (RLS) policies, atomic stored procedures, and storage buckets implemented via **Supabase**.

---

## 1. Relational Entity Schema

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 POSTGRESQL ENTITY GRAPH                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                               ┌─────────────────────────┐                              │
│                               │       auth.users        │                              │
│                               └────────────┬────────────┘                              │
│                                            │ 1:1 (id = auth.uid())                     │
│                                            ▼                                           │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐ │
│  │      app_settings       │  │      public.users       │  │   contact_submissions   │ │
│  ├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤ │
│  │ key (TEXT, PK)          │  │ id (UUID, PK -> auth)   │  │ id (UUID, PK)           │ │
│  │ value (TEXT)            │  │ email (TEXT)            │  │ name (TEXT)             │ │
│  │ description (TEXT)      │  │ full_name (TEXT)        │  │ email (TEXT)            │ │
│  │ updated_at (TIMESTAMPTZ)│  │ avatar_url (TEXT)       │  │ phone (TEXT)            │ │
│  └─────────────────────────┘  │ daily_credits (INT)     │  │ message (TEXT)          │ │
│                               │ last_credit_reset (DATE)│  │ created_at (TIMESTAMPTZ)│ │
│                               │ created_at (TIMESTAMPTZ)│  └─────────────────────────┘ │
│                               │ updated_at (TIMESTAMPTZ)│                              │
│                               └─────────────────────────┘                              │
│                                                                                        │
│  ┌────────────────────────────────────────────────────────┐┌─────────────────────────┐ │
│  │                   public.gym_members                   ││   admin_activity_logs   │ │
│  ├────────────────────────────────────────────────────────┤├─────────────────────────┤ │
│  │ id (UUID, PK)                                          ││ id (UUID, PK)           │ │
│  │ full_name (TEXT)         membership_type (TEXT)        ││ action_type (TEXT)      │ │
│  │ mobile (TEXT)            membership_start (DATE)       ││ member_name (TEXT)      │ │
│  │ email (TEXT)             membership_end (DATE)         ││ member_id (UUID)        │ │
│  │ date_of_birth (DATE)     photo_url (TEXT)              ││ admin_id (TEXT)         │ │
│  │ gender (TEXT)            notes (TEXT)                  ││ ip_address (TEXT)       │ │
│  │ height_cm (NUMERIC)      created_at (TIMESTAMPTZ)      ││ user_agent (TEXT)       │ │
│  │ weight_kg (NUMERIC)      updated_at (TIMESTAMPTZ)      ││ details (JSONB)         │ │
│  │ address (TEXT)                                         ││ created_at (TIMESTAMPTZ)│ │
│  └────────────────────────────────────────────────────────┘└─────────────────────────┘ │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Specifications & Columns

### 1. `public.users`
Trainee profiles linked directly to Supabase Auth.
- `id` (`UUID`, PK): Foreign key to `auth.users(id)` with `ON DELETE CASCADE`.
- `email` (`TEXT`, Nullable): User's primary email address.
- `full_name` (`TEXT`, Nullable): Display name extracted from OAuth profile.
- `avatar_url` (`TEXT`, Nullable): Google account avatar URL.
- `daily_credits` (`INT`, Default `5`): Remaining AI generation quota for today.
- `last_credit_reset` (`DATE`, Default `CURRENT_DATE`): Last date credits were refreshed (IST).
- `created_at` (`TIMESTAMPTZ`, Default `NOW()`): Record creation timestamp.
- `updated_at` (`TIMESTAMPTZ`, Default `NOW()`): Last record modification timestamp.

### 2. `public.gym_members`
Master records for gym trainees managed via the administrative ERP console.
- `id` (`UUID`, PK): `DEFAULT gen_random_uuid()`.
- `full_name` (`TEXT`, Not Null): Member's legal name.
- `mobile` (`TEXT`, Not Null): Primary contact number (indexed for fast search).
- `email` (`TEXT`, Nullable): Member email address.
- `date_of_birth` (`DATE`, Nullable): Used for automated birthday alerts and age calculations.
- `gender` (`TEXT`, Nullable): Trainee gender classification.
- `height_cm` (`NUMERIC(5,2)`, Nullable): Physical stature in centimeters.
- `weight_kg` (`NUMERIC(5,2)`, Nullable): Body mass in kilograms.
- `address` (`TEXT`, Nullable): Residential address.
- `membership_type` (`TEXT`, Not Null): Plan tier (`Monthly`, `Quarterly`, `Half-Yearly`, `Annual`).
- `membership_start` (`DATE`, Not Null): Activation date.
- `membership_end` (`DATE`, Not Null): Expiry date (indexed for status filtering).
- `photo_url` (`TEXT`, Nullable): Storage URL pointing to `member-photos` bucket.
- `notes` (`TEXT`, Nullable): Trainer notes, medical observations, batch timings.
- `created_at` (`TIMESTAMPTZ`, Default `NOW()`).
- `updated_at` (`TIMESTAMPTZ`, Default `NOW()`).

### 3. `public.contact_submissions`
Visitor inquiries ingested from the public website contact form.
- `id` (`UUID`, PK): `DEFAULT gen_random_uuid()`.
- `name` (`TEXT`, Not Null): Inquirer name.
- `email` (`TEXT`, Nullable): Contact email.
- `phone` (`TEXT`, Not Null): Mobile number for WhatsApp/Call engagement.
- `message` (`TEXT`, Not Null): Inquiry details.
- `created_at` (`TIMESTAMPTZ`, Default `NOW()`).

### 4. `public.admin_activity_logs`
Immutable audit log tracking every administrative action.
- `id` (`UUID`, PK): `DEFAULT gen_random_uuid()`.
- `action_type` (`TEXT`, Not Null): `MEMBER_CREATED`, `MEMBER_UPDATED`, `MEMBER_DELETED`, `ADMIN_LOGIN`, `ADMIN_LOGOUT`, `DATABASE_BACKUP`.
- `member_name` (`TEXT`, Nullable): Name of affected member.
- `member_id` (`UUID`, Nullable): Target member UUID.
- `admin_id` (`TEXT`, Nullable): Admin identifier.
- `ip_address` (`TEXT`, Nullable): Client IP address.
- `user_agent` (`TEXT`, Nullable): Browser/Client User-Agent.
- `details` (`JSONB`, Nullable): Structured metadata detailing modified fields or operational stats.
- `created_at` (`TIMESTAMPTZ`, Default `NOW()`).

### 5. `public.app_settings`
Dynamic runtime configuration key-value store.
- `key` (`TEXT`, PK): Setting identifier (e.g., `max_daily_credits`).
- `value` (`TEXT`, Not Null): Setting value.
- `description` (`TEXT`, Nullable): Documentation describing the configuration parameter.
- `updated_at` (`TIMESTAMPTZ`, Default `NOW()`).

---

## 3. Row Level Security (RLS) Policy Matrix

Row Level Security is enabled on **every** table in the `public` schema (`ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY`):

| Table | Target Role | Permitted Actions | Policy Using / Check Expression | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.users` | `authenticated` (Owner) | `SELECT`, `INSERT`, `UPDATE` | `auth.uid() = id` | Restricts trainees strictly to their own profile and credit quota. |
| `public.users` | `anon` | None | Denied | Blocks unauthenticated visitors from inspecting user profiles. |
| `public.gym_members` | `anon` / `authenticated` | None | Denied | Prevents public or client-side leakage of gym member records. |
| `public.contact_submissions` | `anon` / `public` | `INSERT` only | `true` (Insert only) | Enables public visitors to submit inquiries; blocks reading or tampering. |
| `public.admin_activity_logs` | `anon` / `authenticated` | None | Denied | Audit logs cannot be inspected or altered through public client keys. |
| `public.app_settings` | `anon` / `authenticated` | None | Denied | Runtime settings can only be accessed via server-side service role. |

> **Note**: Serverless route handlers operating on administrative tables execute queries using the `SUPABASE_SERVICE_ROLE_KEY`, which safely bypasses RLS on the trusted Next.js backend after `requireAdminToken()` verification.

---

## 4. Atomic Stored Procedures (PostgreSQL RPCs)

### 1. `spend_user_credit(p_uid UUID, p_max INT)`
Performs an atomic credit check and deduction tied to Indian Standard Time (IST). Enforces row locking (`FOR UPDATE`) to prevent race conditions during concurrent API invocations:

```sql
CREATE OR REPLACE FUNCTION spend_user_credit(p_uid UUID, p_max INT DEFAULT 5)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits INT;
  v_last_reset DATE;
  v_ist_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;
BEGIN
  -- Acquire exclusive row lock on trainee profile
  SELECT daily_credits, last_credit_reset INTO v_credits, v_last_reset
  FROM public.users WHERE id = p_uid FOR UPDATE;

  -- Lazy reset: If last reset was before today (IST), grant full daily allocation minus this call
  IF v_last_reset IS NULL OR v_last_reset < v_ist_today THEN
    v_credits := p_max - 1;
    UPDATE public.users 
    SET daily_credits = v_credits, last_credit_reset = v_ist_today, updated_at = NOW() 
    WHERE id = p_uid;
    RETURN v_credits;
  ELSIF v_credits > 0 THEN
    v_credits := v_credits - 1;
    UPDATE public.users 
    SET daily_credits = v_credits, updated_at = NOW() 
    WHERE id = p_uid;
    RETURN v_credits;
  ELSE
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;
END;
$$;
```

### 2. `reset_daily_credits()`
Scheduled maintenance procedure that reads the dynamic credit cap from `app_settings` and resets all user balances:

```sql
CREATE OR REPLACE FUNCTION reset_daily_credits()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cap INT := 5;
  v_ist_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;
BEGIN
  -- Dynamically query credit cap if set in configuration
  SELECT COALESCE(value::INT, 5) INTO v_cap 
  FROM public.app_settings 
  WHERE key = 'max_daily_credits';

  UPDATE public.users 
  SET daily_credits = v_cap, last_credit_reset = v_ist_today, updated_at = NOW()
  WHERE last_credit_reset < v_ist_today OR last_credit_reset IS NULL;
END;
$$;
```

---

## 5. Object Storage Buckets

| Bucket Name | Visibility | Allowed MIME Types | Max Size | Access Control |
| :--- | :--- | :--- | :--- | :--- |
| `member-photos` | **Public** | `image/jpeg`, `image/png`, `image/webp` | 5 MB | Public read for displaying trainee avatars in dashboard; uploads restricted to service-role API routes after magic-byte verification. |
| `backups` | **Private** | `application/json` | 50 MB | Read and write access restricted entirely to administrative serverless routes (`/api/admin/backup`). |

---

## 6. Administrative Backup Snapshot Layout

When administrators trigger a manual or automated backup via `POST /api/admin/backup`, a timestamped JSON snapshot (`backup-YYYY-MM-DD-HHmmss.json`) is generated:

```json
{
  "version": "1.0",
  "exportedAt": "2026-09-05T18:00:00.000Z",
  "counts": {
    "members": 184,
    "leads": 42,
    "activityLogs": 1250
  },
  "data": {
    "gym_members": [
      {
        "id": "7b0d2d3e-2f95-46b8-b80c-26156a00ef90",
        "full_name": "Rohan Patel",
        "mobile": "+91 98765 12345",
        "membership_type": "Monthly",
        "membership_start": "2026-09-01",
        "membership_end": "2026-10-01",
        "created_at": "2026-09-01T10:00:00Z"
      }
    ],
    "contact_submissions": [],
    "admin_activity_logs": []
  }
}
```
The snapshot is uploaded to the private `backups` bucket and immediately offered as a client download.
