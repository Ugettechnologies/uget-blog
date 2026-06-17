import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/";

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  // Determine site URL/redirect URI dynamically based on request host or NEXT_PUBLIC_SITE_URL env
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  const redirectUri = `${siteUrl}/api/auth/oauth/google/callback`;

  // Encode redirect path in state parameter
  const state = encodeURIComponent(next);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&state=${state}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(googleAuthUrl);
}
