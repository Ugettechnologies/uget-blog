import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, seedAdminIfNeeded } from "@/lib/db";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  seedAdminIfNeeded();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user || !comparePassword(password, user.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

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
