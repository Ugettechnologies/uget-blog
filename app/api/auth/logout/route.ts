import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth-server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });

  const cookieOptions = {
    ...getCookieOptions(request.headers.get("host")),
    maxAge: 0,
  };

  response.cookies.set("uget_session", "", cookieOptions);

  return response;
}
