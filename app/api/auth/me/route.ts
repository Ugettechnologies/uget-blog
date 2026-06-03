import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/lib/auth-server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromSession(cookieStore);
    
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const formattedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: { full_name: user.full_name },
      // Standard JWT payload structure:
      aud: "authenticated",
      app_metadata: { provider: "email" }
    };

    return NextResponse.json({ user: formattedUser });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json({ user: null, error: err.message });
  }
}
