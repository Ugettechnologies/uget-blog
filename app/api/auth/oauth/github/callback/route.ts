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

    const githubClientId = process.env.GITHUB_CLIENT_ID;
    const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!githubClientId || !githubClientSecret) {
      return NextResponse.redirect(new URL(`/auth?error=GitHub+OAuth+credentials+not+configured`, request.url));
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const redirectUri = `${siteUrl}/api/auth/oauth/github/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token exchange failed:", tokenData);
      return NextResponse.redirect(new URL(`/auth?error=GitHub+token+exchange+failed`, request.url));
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile from GitHub
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "uget-blog",
      },
    });

    const profileData = await profileResponse.json();
    if (!profileResponse.ok || !profileData.id) {
      console.error("Failed to fetch GitHub profile:", profileData);
      return NextResponse.redirect(new URL(`/auth?error=Failed+to+fetch+GitHub+profile`, request.url));
    }

    // GitHub emails are often private, so fetch email addresses explicitly
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "uget-blog",
      },
    });

    const emails = await emailsResponse.json();
    let email = profileData.email;

    if (Array.isArray(emails)) {
      const primaryEmail = emails.find((e: any) => e.primary && e.verified) || emails.find((e: any) => e.primary) || emails[0];
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }

    if (!email) {
      // Fallback if no email is found (rare, but possible)
      email = `${profileData.login}@github.uget.local`;
    }

    email = email.toLowerCase();
    const fullName = profileData.name || profileData.login;
    const avatarUrl = profileData.avatar_url || null;

    const sql = getSql();

    // Check if user exists in database
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

      // Clean username from github login name
      const baseUsername = profileData.login.toLowerCase().replace(/[^a-z0-9]/g, "");
      const username = baseUsername + Math.floor(Math.random() * 9000 + 1000);

      await sql`
        INSERT INTO profiles (id, username, full_name, avatar_url, role)
        VALUES (${userId}, ${username}, ${fullName}, ${avatarUrl}, 'writer')
      `;
    }

    // Sign session token
    const token = await signJWT({ id: userId, email, provider: "github" });

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
    console.error("GitHub OAuth error:", err);
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(err.message || "GitHub OAuth failed")}`, request.url));
  }
}
