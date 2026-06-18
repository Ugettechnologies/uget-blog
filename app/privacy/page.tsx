"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Last updated: June 18, 2026
        </p>

        <div style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.8, color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: 24 }}>
          <p>
            At UGET, we care deeply about your privacy. This Privacy Policy describes how we collect, use, and share information when you use our Services. Our policy is designed to protect your identity, data, and creative works, ensuring UGET is a safe and trustworthy space.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            1. Information We Collect
          </h2>
          <p>
            We collect only the minimal information necessary to provide you with a great experience:
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><strong>Account details:</strong> Email address, username, full name, and avatar when you sign up.</li>
            <li><strong>Content:</strong> The posts, comments, drafts, and media you upload to UGET.</li>
            <li><strong>Technical data:</strong> Basic usage statistics to help us monitor performance and optimize the user interface.</li>
          </ul>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            2. How We Use Information
          </h2>
          <p>
            We use the data we collect solely to host your writing, personalize your feed, handle subscriptions, send notifications, and prevent abuse on the platform. <strong>We do not sell, rent, or trade your personal data with third-party advertisers.</strong>
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            3. Cookies &amp; Storage
          </h2>
          <p>
            We use standard session cookies and localStorage to keep you logged in and remember your preferences (like light or dark mode). These are essential for the operation of the site and do not track you across other websites.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            4. Your Rights &amp; Control
          </h2>
          <p>
            You have full control over your account. You can edit your profile details, delete your posts, or request complete deletion of your account and related data at any time from your settings page.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            5. Security
          </h2>
          <p>
            We implement industry-standard security measures to safeguard your information against unauthorized access, loss, or alteration.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
