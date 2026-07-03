import { NextResponse } from "next/server";
import { signJWT, hashPassword, ALLOWED_ADMIN_EMAILS } from "@/lib/auth-server";
import { getSql } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "admin@uget.com";
  const name = searchParams.get("name") || "UGET Admin";
  let next = searchParams.get("next") || "/dashboard";
  if (next === "/") next = "/dashboard";

  try {
    const sql = getSql();
    
    // Look up user by email
    const users = await sql`
      SELECT u.id, u.email, p.username, p.full_name, p.avatar_url, p.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.email = ${email}
      LIMIT 1
    `;

    let userId: string;
    let userRole: string;

    if (users && users.length > 0) {
      userId = users[0].id;
      userRole = users[0].role;
    } else {
      // Create new user for OAuth
      const passwordHash = hashPassword(Math.random().toString(36));
      const inserted = await sql`
        INSERT INTO users (email, password_hash)
        VALUES (${email}, ${passwordHash})
        RETURNING id, email
      `;
      userId = inserted[0].id;
      
      const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);
      userRole = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "writer";
      
      await sql`
        INSERT INTO profiles (id, username, full_name, role)
        VALUES (${userId}, ${username}, ${name}, ${userRole})
      `;
    }

    const token = await signJWT({ id: userId, email, provider: "github" });

    const redirectUrl = new URL(next, request.url);
    const response = NextResponse.redirect(redirectUrl);
    
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
    return NextResponse.redirect(new URL("/auth?error=oauth_failed", request.url));
  }
}
