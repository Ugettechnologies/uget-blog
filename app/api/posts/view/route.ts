import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { isBot } from "@/lib/bot-detector";
import { randomUUID } from "crypto";

// In-memory rate limiting & deduplication cache (Key: `${ip}:${postId}`, Value: timestamp)
const viewDeduplicationCache = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours per IP per post

// Clean up old entries from cache every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewDeduplicationCache.entries()) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      viewDeduplicationCache.delete(key);
    }
  }
}, 30 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get("user-agent") || "";
    
    // 1. Filter out known bots, scrapers, crawlers, and automated test agents
    if (isBot(userAgent)) {
      return NextResponse.json({
        recorded: false,
        reason: "bot_ignored",
      });
    }

    const { postId, authorId, channel = "direct", referrerDomain = "direct", device = "desktop" } = await request.json();

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // 2. Extract Client IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (request.headers.get("x-real-ip") || "127.0.0.1");

    // 3. Cookie Deduplication Check
    const cookieStore = await cookies();
    const cookieKey = `echogist_view_${postId}`;
    const hasViewCookie = cookieStore.has(cookieKey);

    // 4. IP-based Cache Deduplication Check
    const cacheKey = `${clientIp}:${postId}`;
    const lastViewTime = viewDeduplicationCache.get(cacheKey);
    const now = Date.now();

    if (hasViewCookie || (lastViewTime && now - lastViewTime < DEDUPLICATION_WINDOW_MS)) {
      return NextResponse.json({
        recorded: false,
        deduplicated: true,
      });
    }

    // Record view in IP cache
    viewDeduplicationCache.set(cacheKey, now);

    const sql = getSql();

    // 5. Atomic database increment for the post
    const updateResult = await sql`
      UPDATE posts 
      SET view_count = COALESCE(view_count, 0) + 1 
      WHERE id = ${postId} 
      RETURNING view_count, author_id
    `;

    const updatedPost = updateResult[0];
    const postAuthorId = authorId || updatedPost?.author_id;

    // 6. Record timestamped profile view for author analytics
    if (postAuthorId) {
      try {
        await sql`
          INSERT INTO profile_views (id, profile_id, post_id, created_at)
          VALUES (${randomUUID()}, ${postAuthorId}, ${postId}, ${new Date().toISOString()})
        `;
      } catch (pvErr) {
        console.debug("[View Tracker] Error logging profile view:", pvErr);
      }
    }

    // 7. Record site visit for analytics traffic breakdown
    try {
      await sql`
        INSERT INTO site_visits (id, post_id, channel, referrer_domain, device, country_code, created_at)
        VALUES (
          ${randomUUID()}, 
          ${postId}, 
          ${channel}, 
          ${referrerDomain}, 
          ${device}, 
          'NG', 
          ${new Date().toISOString()}
        )
      `;
    } catch (visitErr) {
      console.debug("[View Tracker] Error logging site visit:", visitErr);
    }

    // 8. Create response and set 12-hour deduplication cookie
    const response = NextResponse.json({
      recorded: true,
      view_count: updatedPost?.view_count,
    });

    response.cookies.set({
      name: cookieKey,
      value: "1",
      maxAge: 12 * 60 * 60, // 12 hours
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("[View Tracker API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to record view" }, { status: 500 });
  }
}
