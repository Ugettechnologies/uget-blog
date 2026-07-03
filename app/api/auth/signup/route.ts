import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPassword, signJWT, ALLOWED_ADMIN_EMAILS } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
    }

    const sql = getSql();
    
    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // Insert user
    const insertedUsers = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;
    const newUser = insertedUsers[0];
    const userId = newUser.id;

    // Generate unique username
    const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 1000);
    const role = ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "writer";

    // Insert profile
    await sql`
      INSERT INTO profiles (id, username, full_name, role)
      VALUES (${userId}, ${username}, ${name}, ${role})
    `;

    const userPayload = {
      id: userId,
      email: email,
      role: role,
      user_metadata: { full_name: name },
      aud: "authenticated",
      app_metadata: { provider: "email" }
    };

    // Sign session token
    const token = await signJWT({ id: userId, email: email, provider: "email" });

    const response = NextResponse.json({ user: userPayload, session: { access_token: token } });
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
