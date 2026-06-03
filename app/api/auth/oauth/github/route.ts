import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/";

  const githubClientId = process.env.GITHUB_CLIENT_ID;
  if (!githubClientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID not configured" }, { status: 500 });
  }

  // Determine site URL/redirect URI dynamically based on request host
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/oauth/github/callback`;

  // Encode redirect path in state parameter
  const state = encodeURIComponent(next);

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user:email&state=${state}`;

  return NextResponse.redirect(githubAuthUrl);
}
