import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPassword, signJWT, ALLOWED_ADMIN_EMAILS } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password, full_name } = await request.json();
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = getSql();
    
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    
    // Insert into users and profiles in transaction (or sequential statements since Neon is fast)
    const userRes = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;
    const userId = userRes[0].id;

    // Generate random avatar background for rich styling
    const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 9000 + 1000);
    
    const isAdmin = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
    const role = isAdmin ? "admin" : "writer";

    const profileRes = await sql`
      INSERT INTO profiles (id, username, full_name, role)
      VALUES (${userId}, ${username}, ${full_name}, ${role})
      RETURNING id, username, full_name, avatar_url, role
    `;

    const user = {
      id: userId,
      email: email,
      user_metadata: { full_name },
      profile: profileRes[0]
    };

    // Sign session token
    const token = await signJWT({ id: userId, email, provider: "email" });

    const response = NextResponse.json({ user, session: { access_token: token } });
    response.cookies.set("uget_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/"
    });

    return response;
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
