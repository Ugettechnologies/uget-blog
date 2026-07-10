import { NextResponse } from "next/server";
import { getCookieDomain } from "@/lib/auth-server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });
  const host = request.headers.get("host");
  const domain = getCookieDomain(host);

  response.cookies.set("uget_session", "", {
    path: "/",
    maxAge: 0,
    ...(domain ? { domain } : {})
  });

  return response;
}
