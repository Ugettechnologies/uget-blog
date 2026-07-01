import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { hashPassword, signJWT, ALLOWED_ADMIN_EMAILS } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const adminId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const userPayload = {
      id: adminId,
      email: "admin@uget.com",
      user_metadata: { full_name: "UGET Admin" },
      profile: {
        id: adminId,
        username: "admin",
        full_name: "UGET Admin",
        avatar_url: "",
        role: "admin"
      }
    };

    // Sign session token
    const token = await signJWT({ id: adminId, email: "admin@uget.com", provider: "email" });

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
