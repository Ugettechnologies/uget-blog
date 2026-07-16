import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { signJWT } from "@/lib/auth-server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, name, mode } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (mode === "signup" && !name) {
      return NextResponse.json({ error: "Name is required for sign up" }, { status: 400 });
    }

    const sql = getSql();

    // Check if user exists
    const users = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;
    const userExists = users && users.length > 0;

    if (mode === "signup" && userExists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    if (mode === "login" && !userExists) {
      return NextResponse.json({ error: "No account found with this email. Please sign up first." }, { status: 400 });
    }

    // Generate verification token (signed JWT, expires in 15 mins)
    const tokenPayload = {
      email: email.toLowerCase(),
      name: name || "",
      mode,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const token = await signJWT(tokenPayload);

    // Build magic link
    const host = request.headers.get("host");
    const isHostLocal = host?.includes("localhost") || host?.includes("127.0.0.1") || host?.includes("::1");
    const siteUrl = (host && !isHostLocal)
      ? `https://${host}`
      : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
          ? process.env.NEXT_PUBLIC_SITE_URL
          : "https://echo-gist.com");

    const magicLink = `${siteUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

    // Build styled HTML email template
    const actionText = mode === "signup" ? "complete your sign up" : "sign in";
    const buttonText = mode === "signup" ? "Verify & Sign Up" : "Sign In to Echo Gist";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${buttonText}</title>
</head>
<body style="font-family:'Segoe UI',Roboto,sans-serif;background-color:#f4f0ff;color:#292929;margin:0;padding:40px 10px;">
  <div style="background:#ffffff;border:1px solid #e2d9ff;border-radius:16px;max-width:480px;margin:0 auto;overflow:hidden;box-shadow:0 8px 24px rgba(139,92,246,0.06);padding:32px 24px;text-align:center;">
    <h2 style="margin:0 0 8px;font-weight:800;color:#7c3aed;letter-spacing:-0.02em;font-size:28px;">Echo Gist</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Click the button below to ${actionText} to your account.</p>
    
    <div style="margin:32px 0;">
      <a href="${magicLink}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:9999px;font-weight:700;font-size:15px;box-shadow:0 4px 18px rgba(124,58,237,0.3);letter-spacing:0.01em;">
        ${buttonText}
      </a>
    </div>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
      Or copy and paste this link into your browser:<br />
      <a href="${magicLink}" style="color:#7c3aed;text-decoration:none;word-break:break-all;">${magicLink}</a>
    </p>

    <div style="border-top:1px solid #ede9fe;margin-top:32px;padding-top:20px;font-size:12px;color:#9ca3af;">
      <p style="margin:0;">This link is valid for 15 minutes.</p>
      <p style="margin:4px 0 0;">If you did not request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email using Resend
    const result = await sendEmail({
      to: email,
      subject: mode === "signup" ? "Verify your Echo Gist account" : "Sign in to Echo Gist",
      html,
    });

    // Output code to server console for easy developer login when testing locally
    if (!process.env.RESEND_API_KEY || isHostLocal) {
      console.log(`\n==================================================`);
      console.log(`[EchoGist AUTH] Magic Link for ${email} is:`);
      console.log(magicLink);
      console.log(`==================================================\n`);
    }

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Failed to send magic link email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Magic link generation error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
