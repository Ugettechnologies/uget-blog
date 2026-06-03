import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { comparePassword, signJWT } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = getSql();
    
    // Fetch user and profile
    const users = await sql`
      SELECT u.id, u.email, u.password_hash, p.username, p.full_name, p.avatar_url, p.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const user = users[0];
    const passwordMatch = comparePassword(password, user.password_hash);
    
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: { full_name: user.full_name }
    };

    // Sign session token
    const token = await signJWT({ id: user.id, email: user.email });

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
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
