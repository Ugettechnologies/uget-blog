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
            At EchoGist, we care deeply about your privacy. This Privacy Policy describes how we collect, use, and share information when you use our Services. Our policy is designed to protect your identity, data, and creative works, ensuring EchoGist is a safe and trustworthy space.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            1. Information We Collect
          </h2>
          <p>
            We collect only the minimal information necessary to provide you with a great experience:
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li><strong>Account details:</strong> Email address, username, full name, and avatar when you sign up.</li>
            <li><strong>Content:</strong> The posts, comments, drafts, and media you upload to EchoGist.</li>
            <li><strong>Technical data:</strong> Basic usage statistics to help us monitor performance and optimize the user interface.</li>
          </ul>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            2. How We Use Information
          </h2>
          <p>
            We use the data we collect solely to host your writing, personalize your feed, handle subscriptions, send notifications, and prevent abuse on the platform. <strong>We do not sell, rent, or trade your personal data with third-party advertisers.</strong>
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            3. Cookies &amp; Tracking Technologies
          </h2>
          <p>
            We use cookies and similar storage technologies to maintain your session, keep you logged in, remember your user preferences (such as light or dark theme), and analyze site performance.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            4. Google AdSense &amp; Third-Party Advertising
          </h2>
          <p>
            EchoGist uses Google AdSense to serve advertisements when you visit our website. To comply with Google's policies and applicable privacy laws, please note the following:
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>
              <strong>Third-Party Vendors:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&rsquo;s prior visits to EchoGist or other websites.
            </li>
            <li>
              <strong>Advertising Cookies:</strong> Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to EchoGist and/or other sites on the Internet.
            </li>
            <li>
              <strong>Opting Out:</strong> You may opt out of personalized advertising at any time by visiting{" "}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", textDecoration: "underline" }}>
                Google Ads Settings
              </a>. Alternatively, you can opt out of a third-party vendor&rsquo;s use of cookies for personalized advertising by visiting{" "}
              <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", textDecoration: "underline" }}>
                www.aboutads.info
              </a>.
            </li>
          </ul>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            5. CCPA &amp; GDPR Compliance
          </h2>
          <p>
            If you are a resident of the European Economic Area (EEA) or California, you are entitled to certain rights regarding your personal data under the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). This includes the right to access, rectify, delete, or limit the processing of your personal data, and the right to opt out of the sale or sharing of personal information.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            6. Your Rights &amp; Account Control
          </h2>
          <p>
            You have full control over your account. You can edit your profile details, delete your posts, or request complete deletion of your account and related data at any time from your account settings.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            7. Contact Us
          </h2>
          <p>
            If you have questions or concerns regarding this Privacy Policy or our data practices, please contact us at{" "}
            <a href="mailto:support@echo-gist.com" style={{ color: "var(--brand)", textDecoration: "underline" }}>
              support@echo-gist.com
            </a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
