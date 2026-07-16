import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { verifyJWT, signJWT, getCookieOptions, ALLOWED_ADMIN_EMAILS } from "@/lib/auth-server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`${origin}/?auth=signin&error=Missing verification token`);
    }

    // Verify token signature and expiry
    const payload = await verifyJWT(token);
    if (!payload || !payload.email) {
      return NextResponse.redirect(`${origin}/?auth=signin&error=The login link is invalid or has expired`);
    }

    const { email, name, mode } = payload;
    const sql = getSql();

    // Query user
    let users = await sql`
      SELECT u.id, u.email, p.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.email = ${email}
      LIMIT 1
    `;

    let userId: string;

    if (mode === "signup") {
      if (users && users.length > 0) {
        // User already exists, proceed to sign in directly
        userId = users[0].id;
      } else {
        // Insert new user with placeholder password
        const insertedUsers = await sql`
          INSERT INTO users (email, password_hash)
          VALUES (${email}, 'magic-link-passwordless')
          RETURNING id
        `;
        
        if (!insertedUsers || insertedUsers.length === 0) {
          throw new Error("Failed to insert user records.");
        }
        
        userId = insertedUsers[0].id;

        // Generate unique username
        const usernameBase = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
        const username = `${usernameBase}${Math.floor(1000 + Math.random() * 9000)}`;
        const role = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "writer";

        // Insert profile
        await sql`
          INSERT INTO profiles (id, username, full_name, role)
          VALUES (${userId}, ${username}, ${name || "User"}, ${role})
        `;
      }
    } else {
      // mode === "login"
      if (!users || users.length === 0) {
        return NextResponse.redirect(`${origin}/?auth=signup&error=No account found with this email. Please sign up first.`);
      }
      userId = users[0].id;
    }

    // Generate session JWT
    const sessionToken = await signJWT({ id: userId, email: email, provider: "email" });

    // Set cookie and redirect to dashboard
    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set("uget_session", sessionToken, getCookieOptions(request.headers.get("host")));

    return response;
  } catch (err: any) {
    console.error("Magic link verification error:", err);
    return NextResponse.redirect(`${origin}/?auth=signin&error=An internal error occurred during verification`);
  }
}
