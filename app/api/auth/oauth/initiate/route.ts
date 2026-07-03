import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = (searchParams.get("provider") || "google").toLowerCase();
  const next = searchParams.get("next") || "/dashboard";

  const host = request.headers.get("host") || "localhost:3000";
  const isLocal = host.includes("localhost") || 
                  host.includes("127.0.0.1") || 
                  host.startsWith("192.168.") || 
                  host.startsWith("10.") || 
                  host.startsWith("172.") || 
                  host.includes(":");
  const protocol = isLocal ? "http" : "https";
  const siteUrl = isLocal ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`);

  const state = encodeURIComponent(next);

  if (provider === "google") {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return NextResponse.redirect(new URL(`/auth?error=Google+OAuth+not+configured`, request.url));
    }
    const redirectUri = encodeURIComponent(`${siteUrl}/api/auth/oauth/google/callback`);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20profile%20email&state=${state}`;
    return NextResponse.redirect(authUrl);
  }

  if (provider === "github") {
    const githubClientId = process.env.GITHUB_CLIENT_ID;
    if (!githubClientId) {
      return NextResponse.redirect(new URL(`/auth?error=GitHub+OAuth+not+configured`, request.url));
    }
    const redirectUri = encodeURIComponent(`${siteUrl}/api/auth/oauth/github/callback`);
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`;
    return NextResponse.redirect(authUrl);
  }

  // Fallback to mock oauth page for unsupported/other providers
  return NextResponse.redirect(new URL(`/auth/oauth-mock?provider=${provider}&next=${state}`, request.url));
}
