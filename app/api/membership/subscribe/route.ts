import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSql } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth-server";
import nodemailer from "nodemailer";

// Initialize Nodemailer SMTP transporter using Gmail App Password
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "ugettechnologies@gmail.com",
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getUserFromSession(cookieStore);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const { planName, price, paymentMethod, paymentProofUrl, name } = await request.json();

    if (!planName || !price || !paymentMethod) {
      return NextResponse.json({ error: "Missing required checkout fields." }, { status: 400 });
    }

    if (paymentMethod !== "bank_transfer") {
      return NextResponse.json({ error: "Only manual bank transfer is supported at this time." }, { status: 400 });
    }

    if (!paymentProofUrl) {
      return NextResponse.json({ error: "Please upload your transaction receipt proof screenshot." }, { status: 400 });
    }

    const sql = getSql();
    const status = "pending_approval";

    // 1. Insert subscription into the database
    const subscriptionResult = await sql`
      INSERT INTO subscriptions (user_id, plan_name, amount, status, payment_method, payment_proof_url)
      VALUES (${user.id}, ${planName}, ${price}, ${status}, 'bank_transfer', ${paymentProofUrl})
      RETURNING *
    `;

    const subscription = subscriptionResult[0];

    // 2. Email verification request receipt using Nodemailer
    const mailOptions = {
      from: `"UGET Technologies" <${process.env.SMTP_USER || "ugettechnologies@gmail.com"}>`,
      to: user.email,
      subject: "UGET Membership Transfer Verification Pending",
      html: getEmailHTML({
        fullName: user.full_name || name || user.email.split("@")[0],
        email: user.email,
        planName,
        price,
        receiptId: subscription.id,
        paymentProofUrl,
      }),
    };

    if (process.env.SMTP_PASS) {
      try {
        await transporter.sendMail(mailOptions);
        console.log(`✓ Verification email sent to ${user.email}`);
      } catch (emailErr: any) {
        console.error("Transporter email failed to send:", emailErr.message);
      }
    } else {
      console.warn("⚠️ SMTP_PASS is not configured. Email receipt skipped in development.");
    }

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    console.error("Subscription endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process subscription" },
      { status: 500 }
    );
  }
}

// Premium Email Layout Builder
function getEmailHTML({
  fullName,
  email,
  planName,
  price,
  receiptId,
  paymentProofUrl,
}: any) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #faf8ff;
            color: #2e2a36;
            margin: 0;
            padding: 40px 20px;
          }
          .card {
            background-color: #ffffff;
            border: 1px solid #e9d5ff;
            border-radius: 16px;
            max-width: 500px;
            margin: 0 auto;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.05);
          }
          .header {
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: #ffffff;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .body {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 12px;
            color: #1f1b24;
          }
          .desc {
            font-size: 14px;
            line-height: 1.6;
            color: #6b7280;
            margin-bottom: 24px;
          }
          .receipt-details {
            background-color: #f5f3ff;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .detail-row:last-child {
            margin-bottom: 0;
            border-top: 1px dashed #ddd6fe;
            padding-top: 10px;
            font-weight: 700;
          }
          .label {
            color: #7c3aed;
          }
          .value {
            color: #1f1b24;
            text-align: right;
          }
          .bank-instructions {
            border-left: 4px solid #f59e0b;
            background-color: #fffbeb;
            padding: 16px;
            border-radius: 0 12px 12px 0;
            font-size: 13px;
            color: #b45309;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            padding-bottom: 32px;
          }
          .btn {
            display: inline-block;
            background-color: #8b5cf6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 8px;
            text-align: center;
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.2);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>UGET Technologies</h1>
            <p>Membership Order Initiated</p>
          </div>
          <div class="body">
            <h2 class="greeting">Hi ${fullName},</h2>
            <p class="desc">
              We have received your manual bank transfer application. Our team is verifying the transaction details against the uploaded proof. We will notify you as soon as your account is activated!
            </p>

            <div class="receipt-details">
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${dateStr}</span>
              </div>
              <div class="detail-row">
                <span class="label">Plan:</span>
                <span class="value">${planName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Type:</span>
                <span class="value">Manual Bank Transfer</span>
              </div>
              <div class="detail-row">
                <span class="label">Order Ref:</span>
                <span class="value" style="font-family: monospace; font-size: 11px;">${receiptId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value" style="color: #f59e0b; font-weight: bold;">
                  Verification Pending
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Total Charged:</span>
                <span class="value" style="color: #6d28d9; font-size: 16px;">${price}</span>
              </div>
            </div>

            <div class="bank-instructions">
              <strong>Transaction Verification Note:</strong> We are validating the bank transfer to <strong>Moniepoint</strong> (Account: <strong>674 362 0799</strong>). If there are any discrepancies, please reach out to us at ugettechnologies@gmail.com with your Order Reference.
            </div>

            <div style="text-align: center;">
              ${
                paymentProofUrl
                  ? `<a href="${paymentProofUrl}" class="btn" target="_blank">View Uploaded Receipt Proof</a>`
                  : `<a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}" class="btn">Explore UGET Stories</a>`
              }
            </div>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 UGET Technologies. All rights reserved.</p>
          <p>Sent to ${email} • ugettechnologies@gmail.com</p>
        </div>
      </body>
    </html>
  `;
}
