"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RulesPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          Platform Rules
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Last updated: June 18, 2026
        </p>

        <div style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.8, color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: 24 }}>
          <p>
            To keep UGET a welcoming, creative, and safe environment for sharing ideas, we require all users to follow these Platform Rules. By using UGET, you agree to these community guidelines.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            1. Respect &amp; Civility
          </h2>
          <p>
            We welcome healthy debates and constructive discussions, but we do not tolerate harassment, bullying, hate speech, threats, or discrimination. Be respectful to other writers and readers.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            2. Intellectual Property &amp; Plagiarism
          </h2>
          <p>
            <strong>Only publish content that you created or have the explicit rights to share.</strong> Plagiarism, copying articles from other sites without authorization, and copyright infringement are strictly forbidden. If you quote others, give proper citation.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            3. Spams &amp; Deceptive Content
          </h2>
          <p>
            UGET is a place for quality ideas, not advertisement boards. Affiliate link stuffing, excessive self-promotion, clickbait scams, and misleading content are prohibited.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            4. Authenticity
          </h2>
          <p>
            Do not impersonate other writers, figures, or organizations. Let&rsquo;s keep the community authentic and transparent.
          </p>

          <h2 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginTop: 16 }}>
            5. Enforcement
          </h2>
          <p>
            We reserve the right to warn users, hide or remove content, or restrict/suspend accounts that repeatedly violate these rules.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
