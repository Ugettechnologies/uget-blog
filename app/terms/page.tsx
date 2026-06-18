"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Last updated: June 18, 2026
        </p>

        <div style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.8, color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: 24 }}>
          <p>
            Welcome to UGET! These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of UGET&rsquo;s website, APIs, and services (collectively, the &ldquo;Services&rdquo;). Please read them carefully. By using our Services, you agree to be bound by these Terms.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            1. Your Content &amp; Ownership
          </h2>
          <p>
            <strong>You own all content you post on UGET.</strong> We do not claim ownership of your writing, photos, or other content. By posting content to UGET, you grant us a non-exclusive, royalty-free, worldwide, fully sublicensable license to use, display, host, run, copy, distribute, modify, and translate that content solely for the purpose of operating, promoting, and improving the UGET platform.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            2. Copyright &amp; Intellectual Property
          </h2>
          <p>
            We respect the intellectual property of others. If you believe your work has been copied in a way that constitutes copyright infringement, please submit a notice to us. We will promptly remove infringing materials in accordance with our copyright policy and applicable laws, while protecting the rights of both readers and original content creators.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            3. Our Rules &amp; Acceptable Use
          </h2>
          <p>
            You agree not to use the Services to engage in spamming, harassment, impersonation, or copyright infringement. We reserve the right to review, edit, or remove any content that violates these Terms or our community guidelines.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            4. Limitation of Liability
          </h2>
          <p>
            UGET is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. UGET Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the platform.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            5. Friendly Resolution &amp; Governing Law
          </h2>
          <p>
            In the event of a dispute, we believe in a friendly and direct resolution process. You agree to contact us directly to resolve any issues before pursuing formal legal avenues. These Terms are governed by local regulations and are designed to be fair and protective of all participating parties.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
