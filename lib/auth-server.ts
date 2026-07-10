import bcrypt from "bcryptjs";
import { getSql } from "./db";

export const ALLOWED_ADMIN_EMAILS = [
  "ugettechnologies@gmail.com"
];

const JWT_SECRET = process.env.JWT_SECRET || "uget-super-secret-key-at-least-32-chars-long";

// Web Crypto JWT Signer (Edge & Node compatible)
export async function signJWT(payload: any, secretStr = JWT_SECRET): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = { alg: "HS256", typ: "JWT" };
  // Using custom safe base64 encoding to support edge runtimes
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await crypto.subtle.sign("HMAC", secretKey, dataToSign);
  const signatureBase64 = Buffer.from(signature).toString("base64url");

  return `${encodedHeader}.${encodedPayload}.${signatureBase64}`;
}

// Web Crypto JWT Verifier (Edge & Node compatible)
export async function verifyJWT(token: string, secretStr = JWT_SECRET): Promise<any | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerStr, payloadStr, signatureStr] = parts;

    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretStr),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = Buffer.from(signatureStr, "base64url");
    const dataToVerify = encoder.encode(`${headerStr}.${payloadStr}`);
    
    const isValid = await crypto.subtle.verify("HMAC", secretKey, signatureBytes, dataToVerify);
    if (!isValid) return null;

    const payloadJSON = Buffer.from(payloadStr, "base64url").toString("utf8");
    return JSON.parse(payloadJSON);
  } catch (err) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export async function getUserFromSession(cookies: any): Promise<any | null> {
  const sessionToken = cookies.get("uget_session")?.value;
  if (!sessionToken) return null;

  const payload = await verifyJWT(sessionToken);
  if (!payload || !payload.id) return null;

  try {
    const sql = getSql();
    const user = await sql`
      SELECT u.id, u.email, p.username, p.full_name, p.avatar_url, p.role
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.id = ${payload.id}
      LIMIT 1
    `;
    if (!user || user.length === 0) return null;
    return {
      ...user[0],
      provider: payload.provider || "email"
    };
  } catch (err) {
    return null;
  }
}

export function getCookieDomain(host: string | null): string | undefined {
  if (!host) return undefined;
  const cleanHost = host.split(":")[0].toLowerCase();
  
  if (cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1")) {
    return undefined;
  }
  
  if (cleanHost.endsWith(".vercel.app")) {
    return undefined;
  }
  
  const domainParts = cleanHost.split(".");
  if (domainParts.length >= 2) {
    return `.${domainParts.slice(-2).join(".")}`;
  }
  
  return undefined;
}

export function getCookieOptions(host: string | null) {
  const domain = getCookieDomain(host);
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
    ...(domain ? { domain } : {})
  };
}
