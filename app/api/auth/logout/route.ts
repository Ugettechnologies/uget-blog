import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth-server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });

  // 1. Next.js official API to clear the cookie
  response.cookies.delete("uget_session");

  // 2. Explicitly clear using same configuration settings with a past expiration date
  const cookieOptions = {
    ...getCookieOptions(request.headers.get("host")),
    maxAge: 0,
    expires: new Date(0),
  };

  response.cookies.set("uget_session", "", cookieOptions);

  return response;
}
