import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = getSupabase();
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error('Auth callback exchange error:', err);
    }
  }

  // Redirect back to requested page or home
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
