import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, seedAdminIfNeeded } from "@/lib/db";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  seedAdminIfNeeded();
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const user = createUser({
    name,
    email,
    password: hashPassword(password),
    role: "user",
    avatar: null,
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return res;
}
