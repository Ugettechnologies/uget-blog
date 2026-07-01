import { NextResponse } from "next/server";
import { signJWT } from "@/lib/auth-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let next = searchParams.get("next") || "/dashboard";
  if (next === "/") next = "/dashboard";

  const adminId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const token = await signJWT({ id: adminId, email: "admin@uget.com", provider: "github" });

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
}
