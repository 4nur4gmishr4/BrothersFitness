import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServiceSupabase } from "@/lib/server-supabase";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { ContactSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { getRequestId, withRequestId } from "@/lib/request-id";

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const log = logger.child({ requestId });
  try {
    // Rate limit: 3 contact submissions per hour per IP
    const ip = getClientIp(req);
    const rateCheck = await checkRateLimit(ip, RATE_LIMITS.CONTACT);

    if (!rateCheck.allowed) {
      return withRequestId(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        ),
        requestId
      );
    }

    const body = await req.json();

    // Validate with Zod (includes honeypot check)
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      // If honeypot was filled, silently accept (don't let bot know it was detected)
      if (firstError?.path[0] === '_honeypot') {
        log.warn('Bot detected via honeypot', { ip });
        return withRequestId(NextResponse.json({ success: true }, { status: 200 }), requestId);
      }
      return withRequestId(
        NextResponse.json(
          { error: firstError?.message || "Invalid request" },
          { status: 400 }
        ),
        requestId
      );
    }

    const { name, email, phone, message } = parsed.data;

    // Store in Supabase. Use service client when available (bypasses RLS) to prevent
    // silent lead drops if anon insert permissions change.
    let client;
    try {
      client = getServiceSupabase();
    } catch {
      client = supabase;
    }

    const { error: dbError } = await client.from('contact_submissions').insert([{
      name,
      email,
      phone: phone || null,
      message
    }]);

    if (dbError) {
      log.error('Failed to store contact submission', { error: dbError.message });
      return withRequestId(
        NextResponse.json(
          { error: "Could not save your message. Please try again." },
          { status: 502 }
        ),
        requestId
      );
    }

    return withRequestId(NextResponse.json({ success: true }, { status: 200 }), requestId);
  } catch (error) {
    log.error("Contact submission error", { error: error instanceof Error ? error.message : 'Unknown' });
    return withRequestId(NextResponse.json({ error: "Server error" }, { status: 500 }), requestId);
  }
}
