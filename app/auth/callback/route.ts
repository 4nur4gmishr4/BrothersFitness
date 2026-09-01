import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    const errorParam = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(new URL(`/?auth_error=${errorParam}`, requestUrl.origin));
  }

  if (code) {
    // Forward the authorization code to client app for local PKCE session completion
    return NextResponse.redirect(new URL(`/?code=${encodeURIComponent(code)}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
