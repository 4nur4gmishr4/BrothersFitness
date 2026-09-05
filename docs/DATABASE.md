# Database Schema & Security Architecture

This document describes the **PostgreSQL** schema, Row Level Security (RLS) policies, and stored procedures implemented via **Supabase**.

---

## 1. Relational Entity Schema

```
┌─────────────────────────┐
│       auth.users        │
└────────────┬────────────┘
             │ 1:1 (id)
             ▼
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│      public.users       │     │  contact_submissions    │     │      app_settings       │
├─────────────────────────┤     ├─────────────────────────┤     ├─────────────────────────┤
│ id (UUID, PK -> auth)   │     │ id (UUID, PK)           │     │ key (TEXT, PK)          │
│ email (TEXT)            │     │ name (TEXT)             │     │ value (TEXT)            │
│ full_name (TEXT)        │     │ email (TEXT)            │     │ description (TEXT)      │
│ avatar_url (TEXT)       │     │ phone (TEXT)            │     │ updated_at (TIMESTAMPTZ)│
│ daily_credits (INT)     │     │ message (TEXT)          │     └─────────────────────────┘
│ last_credit_reset (DATE)│     │ created_at (TIMESTAMPTZ)│
│ created_at (TIMESTAMPTZ)│     └─────────────────────────┘
│ updated_at (TIMESTAMPTZ)│
└─────────────────────────┘

┌────────────────────────────────────────────────────────┐     ┌─────────────────────────┐
│                   public.gym_members                   │     │   admin_activity_logs   │
├────────────────────────────────────────────────────────┤     ├─────────────────────────┤
│ id (UUID, PK)                                          │     │ id (UUID, PK)           │
│ full_name (TEXT)         membership_type (TEXT)        │     │ action_type (TEXT)      │
│ mobile (TEXT)            membership_start (DATE)       │     │ member_name (TEXT)      │
│ email (TEXT)             membership_end (DATE)         │     │ member_id (UUID)        │
│ date_of_birth (DATE)     photo_url (TEXT)              │     │ admin_id (TEXT)         │
│ gender (TEXT)            notes (TEXT)                  │     │ ip_address (TEXT)       │
│ height_cm (NUMERIC)      created_at (TIMESTAMPTZ)      │     │ user_agent (TEXT)       │
│ weight_kg (NUMERIC)      updated_at (TIMESTAMPTZ)      │     │ details (JSONB)         │
│ address (TEXT)                                         │     │ created_at (TIMESTAMPTZ)│
└────────────────────────────────────────────────────────┘     └─────────────────────────┘
```

---

## 2. Row Level Security (RLS) Policy Matrix

| Table | Target Role | Allowed Operations | Policy Enforcement |
| :--- | :--- | :--- | :--- |
| `public.users` | `authenticated` (Owner) | `SELECT`, `INSERT`, `UPDATE` | `auth.uid() = id` (Users can only access their own profile and credit quota). |
| `public.users` | `anon` | None | Completely blocked from anonymous reads or writes. |
| `public.gym_members` | `anon` / `authenticated` | None | All direct client access blocked. Managed exclusively via serverless backend with service-role authorization. |
| `public.contact_submissions` | `anon` / `public` | `INSERT` only | Public visitors can submit inquiries; `SELECT`, `UPDATE`, and `DELETE` permissions are revoked. |
| `public.admin_activity_logs` | `anon` / `authenticated` | None | Immutable audit table writable and readable only via server service role. |
| `public.app_settings` | `anon` / `authenticated` | None | Restricted entirely to server-side administrative procedures. |

---

## 3. Stored Procedures (Atomic RPCs)

### `spend_user_credit(p_uid UUID, p_max INT)`
Executes an atomic deduction of daily credits tied to Indian Standard Time (IST):
```sql
CREATE OR REPLACE FUNCTION spend_user_credit(p_uid UUID, p_max INT DEFAULT 5)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_credits INT;
  v_last_reset DATE;
  v_ist_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::DATE;
BEGIN
  SELECT daily_credits, last_credit_reset INTO v_credits, v_last_reset
  FROM public.users WHERE id = p_uid FOR UPDATE;

  IF v_last_reset IS NULL OR v_last_reset < v_ist_today THEN
    v_credits := p_max - 1;
    UPDATE public.users SET daily_credits = v_credits, last_credit_reset = v_ist_today WHERE id = p_uid;
    RETURN v_credits;
  ELSIF v_credits > 0 THEN
    v_credits := v_credits - 1;
    UPDATE public.users SET daily_credits = v_credits WHERE id = p_uid;
    RETURN v_credits;
  ELSE
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;
END;
$$;
```

---

## 4. Storage Buckets

1. **`member-photos` (Public)**:
   - Contains member profile avatars.
   - Read access: Public.
   - Upload access: Authenticated server service-role only. File types validated via magic bytes (JPEG, PNG, WebP).
2. **`backups` (Private)**:
   - Stores raw and encrypted JSON database exports created by administrators.
   - Read/Write access: Restricted completely to server service role.
