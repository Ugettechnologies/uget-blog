import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import nodemailer from "nodemailer";

// Initialize Nodemailer SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "ugettechnologies@gmail.com",
    pass: process.env.SMTP_PASS,
  },
});

export async function GET(request: Request) {
  try {
    // 1. Verify cron authorization token (Vercel Cron security standard)
    const authHeader = request.headers.get("authorization");
    const isLocal = process.env.NODE_ENV === "development";
    
    // In production, we require the Bearer token to match process.env.CRON_SECRET
    if (!isLocal && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sql = getSql();

    // 2. Fetch all registered users
    const users = await sql`
      SELECT id, email FROM users
    `;

    if (users.length === 0) {
      return NextResponse.json({ success: true, message: "No registered users to email." });
    }

    // 3. Fetch the latest published post
    const posts = await sql`
      SELECT p.*, pr.full_name as author_name 
      FROM posts p
      LEFT JOIN profiles pr ON p.author_id = pr.id
      WHERE p.published = true
      ORDER BY p.created_at DESC
      LIMIT 1
    `;

    if (posts.length === 0) {
      return NextResponse.json({ success: true, message: "No published posts to include in newsletter." });
    }

    const latestPost = posts[0];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const postUrl = `${siteUrl}/post/${latestPost.slug}`;

    // 4. Send emails in batch (using Promise.all or a loop)
    // For large lists, you would send this to an email service or queue,
    // but a parallel nodemailer send is perfect for this project scale.
    const emailPromises = users.map((user: any) => {
      const mailOptions = {
        from: `"UGET Technologies" <${process.env.SMTP_USER || "ugettechnologies@gmail.com"}>`,
        to: user.email,
        subject: `Latest Story on UGET: "${latestPost.title}"`,
        html: getNewsletterHTML({
          authorName: latestPost.author_name || "UGET Writer",
          title: latestPost.title,
          excerpt: latestPost.excerpt || "Read the latest updates and stories published today on UGET Technologies.",
          coverImage: latestPost.cover_image,
          category: latestPost.category,
          readTime: latestPost.read_time,
          postUrl,
          siteUrl,
        }),
      };

      if (process.env.SMTP_PASS) {
        return transporter.sendMail(mailOptions);
      } else {
        console.log(`[Mock Send] Email would be sent to ${user.email} with latest post: ${latestPost.title}`);
        return Promise.resolve(null);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Newsletter for post "${latestPost.title}" successfully sent to ${users.length} users.`,
    });
  } catch (err: any) {
    console.error("Cron notification job error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process cron job" },
      { status: 500 }
    );
  }
}

// Newsletter Layout Builder
function getNewsletterHTML({
  authorName,
  title,
  excerpt,
  coverImage,
  category,
  readTime,
  postUrl,
  siteUrl,
}: any) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Georgia', serif;
            background-color: #fafafa;
            color: #292929;
            margin: 0;
            padding: 30px 10px;
          }
          .container {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          }
          .header {
            border-bottom: 1px solid #f1f5f9;
            padding: 24px;
            text-align: center;
          }
          .header h2 {
            margin: 0;
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-weight: 800;
            color: #8b5cf6;
            letter-spacing: -0.03em;
            font-size: 26px;
          }
          .body {
            padding: 32px 24px;
          }
          .category {
            text-transform: uppercase;
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            font-weight: 700;
            color: #8b5cf6;
            letter-spacing: 0.05em;
            display: inline-block;
            margin-bottom: 12px;
          }
          .title {
            font-size: 26px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
            line-height: 1.25;
            color: #1a1a1a;
          }
          .meta {
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 24px;
          }
          .cover {
            width: 100%;
            height: 240px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 24px;
          }
          .excerpt {
            font-size: 16px;
            line-height: 1.6;
            color: #292929;
            margin-bottom: 30px;
          }
          .btn-container {
            text-align: center;
            margin-bottom: 12px;
          }
          .btn {
            display: inline-block;
            background-color: #8b5cf6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 14px;
            font-family: 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.25);
          }
          .footer {
            background-color: #f8fafc;
            border-top: 1px solid #f1f5f9;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            padding: 24px;
            font-family: 'Segoe UI', Roboto, sans-serif;
          }
          .footer a {
            color: #8b5cf6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>UGET Technologies</h2>
          </div>
          <div class="body">
            <span class="category">${category}</span>
            <h1 class="title">${title}</h1>
            <div class="meta">By <strong>${authorName}</strong> • ${readTime} min read</div>
            
            ${coverImage ? `<img src="${coverImage}" alt="${title}" class="cover" />` : ""}
            
            <p class="excerpt">${excerpt}</p>
            
            <div class="btn-container">
              <a href="${postUrl}" class="btn">Read Full Story</a>
            </div>
          </div>
          <div class="footer">
            <p>You received this email because you are a registered user of UGET Technologies.</p>
            <p>© 2026 UGET Technologies. All rights reserved.</p>
            <p><a href="${siteUrl}/settings">Unsubscribe from notifications</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}
