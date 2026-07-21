import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { sendEmailBatch, buildNewsletterHtml } from "@/lib/email";

/**
 * Vercel serverless max execution time for this route.
 * Newsletter blasts to many users need more than the default 10 s.
 * Set to 60 s (Hobby) — raise to 300 on Pro if needed.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    // return NextResponse.json({
    //   success: true,
    //   message: "Cron job notifications are currently paused.",
    // });
    // ── 1. Auth check (Vercel Cron standard) ──────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const isLocal = process.env.NODE_ENV === "development";

    if (
      !isLocal &&
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sql = getSql();

    // ── 2. Fetch all users with a valid email ──────────────────────────────────
    const users = await sql`
      SELECT u.id, u.email
      FROM users u
      WHERE u.email IS NOT NULL
        AND u.email <> ''
    `;

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No registered users to notify.",
      });
    }

    // ── 3. Fetch the latest published post ────────────────────────────────────
    const posts = await sql`
      SELECT
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.cover_image,
        p.category,
        p.read_time,
        p.created_at,
        pr.full_name AS author_name
      FROM posts p
      LEFT JOIN profiles pr ON p.author_id = pr.id
      WHERE p.published = true
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No published posts to include in newsletter.",
      });
    }

    const post = posts[0];
    
    // Resolve public-facing site URL dynamically
    const host = request.headers.get("host");
    const isHostLocal = host?.includes("localhost") || host?.includes("127.0.0.1") || host?.includes("::1");
    const customSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    let siteUrl = "https://www.echo-gist.com";
    if (customSiteUrl && !customSiteUrl.includes("localhost")) {
      siteUrl = customSiteUrl.startsWith("http") ? customSiteUrl : `https://${customSiteUrl}`;
    } else if (host && !isHostLocal) {
      siteUrl = `https://${host}`;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      siteUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }

    // Ensure siteUrl has no trailing slash
    siteUrl = siteUrl.replace(/\/$/, "");

    const postUrl = `${siteUrl}/post/${post.slug}`;

    // ── 4. Build HTML once, reuse for all recipients ──────────────────────────
    const html = buildNewsletterHtml({
      authorName: post.author_name || "Echo Gist Writer",
      title: post.title,
      excerpt:
        post.excerpt ||
        "Read the latest updates and stories published today on Echo Gist.",
      coverImage: post.cover_image,
      category: post.category,
      readTime: post.read_time,
      postUrl,
      siteUrl,
    });

    const subject = `New on Echo Gist: "${post.title}"`;

    // ── 5. Send via Resend Batch API (1 request per 100 users) ────────────────
    const { sent, failed, errors } = await sendEmailBatch(
      users.map((u: any) => ({
        to: u.email,
        subject,
        html,
      }))
    );

    console.log(
      `[cron] Newsletter for "${post.title}" — sent: ${sent}, failed: ${failed}`
    );

    if (errors.length > 0) {
      console.error("[cron] Resend errors:", errors);
    }

    return NextResponse.json({
      success: true,
      post: post.title,
      total: users.length,
      sent,
      failed,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (err: any) {
    console.error("[cron] Fatal error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Cron job failed" },
      { status: 500 }
    );
  }
}
