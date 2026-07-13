import { NextResponse } from "next/server";
import { getCookieOptions } from "@/lib/auth-server";

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true });

  // Clear existing Set-Cookie header to avoid conflicts
  response.headers.delete("Set-Cookie");

  const hostHeader = request.headers.get("host");
  const options = getCookieOptions(hostHeader);
  const secureFlag = options.secure ? "; Secure" : "";
  const sameSiteFlag = options.sameSite ? `; SameSite=${options.sameSite}` : "";

  // 1. Clear host-only cookie (no Domain attribute, which matches login/signup)
  response.headers.append(
    "Set-Cookie",
    `uget_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly${secureFlag}${sameSiteFlag}`
  );

  // 2. Clear domain-specific and wildcard domain cookies to handle legacy/duplicate cases
  if (hostHeader) {
    const domain = hostHeader.split(":")[0]; // clean port if any

    // Explicit domain setting is rejected on localhost by modern browsers, so only set for real domains.
    if (domain && domain !== "localhost" && domain !== "127.0.0.1") {
      response.headers.append(
        "Set-Cookie",
        `uget_session=; Domain=${domain}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly${secureFlag}${sameSiteFlag}`
      );

      // Clear root wildcard domain (.domain.com)
      if (domain.includes(".")) {
        const parts = domain.split(".");
        if (parts.length >= 2) {
          const rootDomain = "." + parts.slice(-2).join(".");
          response.headers.append(
            "Set-Cookie",
            `uget_session=; Domain=${rootDomain}; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly${secureFlag}${sameSiteFlag}`
          );
        }
      }
    }
  }

  return response;
}
