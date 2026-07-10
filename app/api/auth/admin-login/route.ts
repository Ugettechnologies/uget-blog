import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { signJWT, verifyJWT, hashPassword, ALLOWED_ADMIN_EMAILS, getCookieOptions } from "@/lib/auth-server";

// POST /api/auth/admin-login - Requests a code or verifies it
export async function POST(request: Request) {
  try {
    const { action, email, code } = await request.json();

    if (action === "request") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
        return NextResponse.json({ error: "Access denied: Unauthorized email." }, { status: 403 });
      }

      // Generate 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`\n==================================================`);
      console.log(`[ADMIN LOGIN] Verification Code for ${normalizedEmail} is: ${generatedCode}`);
      console.log(`==================================================\n`);

      // Store in verification token cookie (expires in 5 minutes)
      const tokenPayload = { email: normalizedEmail, code: generatedCode };
      const verificationToken = await signJWT(tokenPayload);

      const response = NextResponse.json({
        success: true,
        // Expose code only in local development for easier testing
        devCode: process.env.NODE_ENV !== "production" ? generatedCode : undefined
      });

      const cookieStore = await cookies();
      cookieStore.set("uget_admin_verification", verificationToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300, // 5 minutes
        path: "/"
      });

      return response;
    }

    if (action === "verify") {
      if (!email || !code) {
        return NextResponse.json({ error: "Email and verification code are required" }, { status: 400 });
      }

      const cookieStore = await cookies();
      const verificationTokenCookie = cookieStore.get("uget_admin_verification");
      const verificationToken = verificationTokenCookie?.value;

      if (!verificationToken) {
        return NextResponse.json({ error: "Verification session expired. Please request a new code." }, { status: 400 });
      }

      const payload = await verifyJWT(verificationToken);
      if (!payload || payload.email !== email.toLowerCase().trim() || payload.code !== code.trim()) {
        return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
      }

      // Code matches! Clear the verification cookie
      const response = NextResponse.json({ success: true });
      response.cookies.delete("uget_admin_verification");

      // Sign the user in
      const sql = getSql();
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      let users = await sql`
        SELECT u.id, u.email, p.role
        FROM users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE u.email = ${normalizedEmail}
      `;

      let userId;
      let role = "admin";

      if (users.length === 0) {
        // Create new user & profile as Admin
        const defaultHash = hashPassword("admin123");
        const newUsers = await sql`
          INSERT INTO users (email, password_hash)
          VALUES (${normalizedEmail}, ${defaultHash})
          RETURNING id
        `;
        userId = newUsers[0].id;
        
        const username = `uget_staff_${Math.floor(1000 + Math.random() * 9000)}`;
        await sql`
          INSERT INTO profiles (id, username, full_name, role)
          VALUES (${userId}, ${username}, 'UGET Staff', ${role})
        `;
      } else {
        userId = users[0].id;
        // Promote role to admin in profiles
        await sql`
          UPDATE profiles
          SET role = 'admin'
          WHERE id = ${userId}
        `;
      }

      // Generate session token
      const sessionToken = await signJWT({ id: userId, email: normalizedEmail, provider: "email" });

      response.cookies.set("uget_session", sessionToken, getCookieOptions(request.headers.get("host")));

      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin login API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
