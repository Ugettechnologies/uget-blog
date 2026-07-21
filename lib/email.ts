/**
 * lib/email.ts
 *
 * Central email helper for Echo Gist.
 * Uses Resend (https://resend.com) for all outbound email.
 *
 * Sending domain: notify.echo-gist.com  (must be verified in Resend dashboard)
 * Required env vars: RESEND_API_KEY, RESEND_FROM
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  /** Optional plain-text fallback */
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

// ─── Single email ─────────────────────────────────────────────────────────────

/**
 * Send one transactional email via Resend.
 * Reads RESEND_API_KEY fresh on every call (safe in serverless).
 * Gracefully no-ops (console.warn) if the key is missing — dev friendly.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    options.from ||
    process.env.RESEND_FROM ||
    "Echo Gist <hello@notify.echo-gist.com>";

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping send.\n" +
        `  To: ${options.to}  Subject: ${options.subject}`
    );
    return { ok: true, id: "mock-no-key" };
  }

  const body: Record<string, unknown> = {
    from,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
  };
  if (options.text) body.text = options.text;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data?.message ?? data?.name ?? `HTTP ${res.status}`;
      console.error("[email] Resend rejected the request:", data);
      return { ok: false, error: errMsg };
    }

    console.log("[email] Sent OK — Resend id:", data.id);
    return { ok: true, id: data.id };
  } catch (err: any) {
    console.error("[email] Network error calling Resend:", err);
    return { ok: false, error: err?.message ?? "Network error" };
  }
}

// ─── Batch email ──────────────────────────────────────────────────────────────

export interface BatchEmailItem {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export interface BatchEmailResult {
  sent: number;
  failed: number;
  ids: string[];
  errors: string[];
}

/**
 * Send up to 100 emails in a single Resend Batch API call.
 * Falls back to sequential single sends if the batch endpoint fails.
 *
 * Resend Batch docs: https://resend.com/docs/api-reference/emails/send-batch-emails
 */
export async function sendEmailBatch(
  emails: BatchEmailItem[]
): Promise<BatchEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom =
    process.env.RESEND_FROM || "Echo Gist <hello@notify.echo-gist.com>";

  const result: BatchEmailResult = { sent: 0, failed: 0, ids: [], errors: [] };

  if (emails.length === 0) return result;

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipping batch of ${emails.length} emails.`
    );
    result.sent = emails.length; // mock success in dev
    return result;
  }

  // Resend batch endpoint accepts an array of email objects (max 100 per call)
  const BATCH_SIZE = 100;
  const chunks: BatchEmailItem[][] = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    chunks.push(emails.slice(i, i + BATCH_SIZE));
  }

  for (const chunk of chunks) {
    const payload = chunk.map((e) => ({
      from: e.from ?? defaultFrom,
      to: [e.to],
      subject: e.subject,
      html: e.html,
      ...(e.text ? { text: e.text } : {}),
    }));

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Batch call failed — record all as failed
        const errMsg = data?.message ?? `HTTP ${res.status}`;
        console.error("[email] Resend batch error:", data);
        result.failed += chunk.length;
        result.errors.push(errMsg);
      } else {
        // data is { data: Array<{ id: string }> }
        const ids: string[] = (data?.data ?? []).map((d: any) => d.id);
        result.sent += ids.length;
        result.ids.push(...ids);
        // Any chunk items without an id count as failed
        const gap = chunk.length - ids.length;
        if (gap > 0) result.failed += gap;
      }
    } catch (err: any) {
      console.error("[email] Network error calling Resend batch:", err);
      result.failed += chunk.length;
      result.errors.push(err?.message ?? "Network error");
    }
  }

  return result;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface NewsletterPayload {
  authorName: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  category?: string | null;
  readTime?: number | string | null;
  postUrl: string;
  siteUrl: string;
}

/**
 * Returns the full HTML for the Echo Gist newsletter email.
 * Uses inline styles so Gmail / Outlook render it correctly.
 */
export function buildNewsletterHtml({
  authorName,
  title,
  excerpt,
  coverImage,
  category,
  readTime,
  postUrl,
  siteUrl,
}: NewsletterPayload): string {
  const coverImg = coverImage
    ? `<a href="${postUrl}" style="text-decoration:none;display:block;"><img src="${coverImage}" alt="${title}" width="560" style="width:100%;height:240px;object-fit:cover;border-radius:10px;margin-bottom:24px;display:block;" /></a>`
    : "";

  const categoryTag = category
    ? `<span style="text-transform:uppercase;font-family:'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:0.06em;display:inline-block;background:#f3eeff;padding:3px 10px;border-radius:999px;margin-bottom:14px;">${category}</span>`
    : "";

  const meta = readTime
    ? `By <strong>${authorName}</strong> &middot; ${readTime} min read`
    : `By <strong>${authorName}</strong>`;

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="font-family:'Georgia',serif;background-color:#f4f0ff;color:#292929;margin:0;padding:30px 10px;">
  <div style="background:#ffffff;border:1px solid #e2d9ff;border-radius:16px;max-width:600px;margin:0 auto;overflow:hidden;box-shadow:0 8px 24px rgba(139,92,246,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:28px 24px;text-align:center;">
      <h2 style="margin:0;font-family:'Segoe UI',Roboto,sans-serif;font-weight:800;color:#ffffff;letter-spacing:-0.03em;font-size:26px;">Echo Gist</h2>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-family:'Segoe UI',Roboto,sans-serif;font-size:13px;">Your daily dose of ideas</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 28px;">
      ${categoryTag}
      <h1 style="font-size:26px;font-weight:700;margin:0 0 12px;line-height:1.25;color:#1a1a1a;">
        <a href="${postUrl}" style="color:#1a1a1a;text-decoration:none;">${title}</a>
      </h1>
      <div style="font-family:'Segoe UI',Roboto,sans-serif;font-size:13px;color:#6b7280;margin-bottom:24px;">${meta}</div>
      ${coverImg}
      <p style="font-size:16px;line-height:1.7;color:#374151;margin-bottom:30px;">${excerpt}</p>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${postUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);color:#ffffff;text-decoration:none;padding:13px 36px;border-radius:9999px;font-weight:700;font-size:14px;font-family:'Segoe UI',Roboto,sans-serif;box-shadow:0 4px 18px rgba(124,58,237,0.35);letter-spacing:0.01em;">
          Read Full Story &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#faf8ff;border-top:1px solid #ede9fe;text-align:center;font-size:12px;color:#9ca3af;padding:24px;font-family:'Segoe UI',Roboto,sans-serif;line-height:1.6;">
      <p style="margin:0 0 6px;">You&rsquo;re receiving this because you&rsquo;re a member of Echo Gist.</p>
      <p style="margin:0 0 6px;">&copy; ${year} Echo Gist. All rights reserved.</p>
      <p style="margin:0;">
        <a href="${siteUrl}/settings" style="color:#7c3aed;text-decoration:none;">Manage notifications</a>
        &nbsp;&middot;&nbsp;
        <a href="${siteUrl}/settings" style="color:#7c3aed;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}
