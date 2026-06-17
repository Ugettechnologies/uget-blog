import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPassword, signJWT } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "/";
    const nextPath = decodeURIComponent(state);

    if (!code) {
      return NextResponse.redirect(new URL(`/auth?error=No+code+provided`, request.url));
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.redirect(new URL(`/auth?error=Google+OAuth+credentials+not+configured`, request.url));
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const redirectUri = `${siteUrl}/api/auth/oauth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(new URL(`/auth?error=Google+token+exchange+failed`, request.url));
    }

    // Fetch user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok || !userInfo.email) {
      console.error("Failed to fetch Google user info:", userInfo);
      return NextResponse.redirect(new URL(`/auth?error=Failed+to+fetch+user+info`, request.url));
    }

    const email = userInfo.email.toLowerCase();
    const fullName = userInfo.name || email.split("@")[0];
    const avatarUrl = userInfo.picture || null;

    const sql = getSql();

    // Check if user exists in our local PostgreSQL database
    let users = await sql`SELECT id FROM users WHERE email = ${email}`;
    let userId: string;

    if (users.length > 0) {
      userId = users[0].id;
      // Update avatar if not set
      if (avatarUrl) {
        await sql`
          UPDATE profiles 
          SET avatar_url = COALESCE(avatar_url, ${avatarUrl}), updated_at = NOW()
          WHERE id = ${userId}
        `;
      }
    } else {
      // Create user and profile
      const randomPassword = crypto.randomUUID();
      const passwordHash = hashPassword(randomPassword);

      const userRes = await sql`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, ${passwordHash})
        RETURNING id
      `;
      userId = userRes[0].id;

      // Create a unique username for them
      const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const username = baseUsername + Math.floor(Math.random() * 9000 + 1000);
      
      await sql`
        INSERT INTO profiles (id, username, full_name, avatar_url, role)
        VALUES (${userId}, ${username}, ${fullName}, ${avatarUrl}, 'writer')
      `;
    }

    // Sign session token
    const token = await signJWT({ id: userId, email });

    // Set token cookie and redirect
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set("uget_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(err.message || "Google OAuth failed")}`, request.url));
  }
}
