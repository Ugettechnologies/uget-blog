import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth-server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });

  // 1. Next.js official API to clear the cookie (defaults to host-only / path "/")
  response.cookies.delete("uget_session");

  // 2. Explicitly clear using same configuration settings with a past expiration date
  const cookieOptions = {
    ...getCookieOptions(request.headers.get("host")),
    maxAge: 0,
    expires: new Date(0),
  };
  response.cookies.set("uget_session", "", cookieOptions);

  // 3. Clear explicit domain and root wildcard domain to handle any legacy/duplicate cookies
  const host = request.headers.get("host");
  if (host) {
    const domain = host.split(":")[0]; // clean port if any
    
    // Clear explicit domain
    response.cookies.set("uget_session", "", {
      domain,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    // Clear root wildcard domain (.domain.com) if not localhost
    if (domain.includes(".") && !domain.startsWith("localhost")) {
      const parts = domain.split(".");
      if (parts.length >= 2) {
        const rootDomain = "." + parts.slice(-2).join(".");
        response.cookies.set("uget_session", "", {
          domain: rootDomain,
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }
    }
  }

  return response;
}
