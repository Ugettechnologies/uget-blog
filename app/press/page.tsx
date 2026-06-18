"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PressPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          Press &amp; Media Kit
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Assets, logos, and contacts for press inquiries.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>
              About UGET
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
              UGET Technologies is a modern digital publishing platform built to support clean, focused writing and premium editorial experiences. Established to provide a sustainable, membership-driven alternative to ad-supported blogging, UGET connects over a million monthly active readers directly with the creators they support.
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32 }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 16 }}>
              Media Assets
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", marginBottom: 20 }}>
              Need our logo for your article? Download the high-resolution transparent vector logo icon:
            </p>
            <a 
              href="/logo-icon-transparent.png" 
              download 
              className="btn btn-outline"
              style={{ display: "inline-flex", gap: 8, textDecoration: "none" }}
            >
              📥 Download Logo Pack
            </a>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32 }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>
              Press Contact
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
              For press inquiries, interview requests, and brand partnerships, reach out directly to our communications desk at:
              <br />
              <strong style={{ color: "var(--brand)", display: "block", marginTop: 8 }}>press@ugettechnologies.com</strong>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
