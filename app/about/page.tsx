"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ background: "#191919", minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Section */}
      <main style={{ flex: 1 }}>
        <div 
          style={{ 
            maxWidth: 1040, 
            margin: "0 auto", 
            padding: "80px 24px 60px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <h1 
            style={{ 
              fontFamily: "var(--serif)", 
              fontSize: "clamp(36px, 8vw, 76px)", 
              fontWeight: 400, 
              lineHeight: 1.05, 
              color: "#ffffff", 
              letterSpacing: "-0.03em",
              maxWidth: 800,
              marginBottom: 40
            }}
          >
            Everyone has a <span style={{ fontStyle: "italic", fontFamily: "var(--serif)" }}>story</span> to tell.
          </h1>
          <p 
            style={{ 
              fontFamily: "var(--serif)", 
              fontSize: "clamp(18px, 3.5vw, 24px)", 
              lineHeight: 1.5, 
              color: "rgba(255, 255, 255, 0.8)", 
              maxWidth: 720,
              fontWeight: 300
            }}
          >
            UGET is a home for human stories and ideas. Here, anyone can share insightful perspectives, useful knowledge, and life wisdom with the world — without the distraction of ads or clickbait.
          </p>
        </div>

        {/* Narrative columns */}
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "60px 24px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 64 }}>
            <div>
              <h2 style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 600, color: "#ffffff", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Our Mission
              </h2>
              <p style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.7, color: "rgba(255, 255, 255, 0.7)" }}>
                We believe that what you read and write matters. Words can build bridges, spark movements, change minds, and generate empathy. That’s why we’re building an open platform where over a million readers come to find thinking that shapes their lives.
              </p>
            </div>
            
            <div>
              <h2 style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 600, color: "#ffffff", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                For Writers
              </h2>
              <p style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.7, color: "rgba(255, 255, 255, 0.7)" }}>
                UGET is designed to get out of your way. With a clean, focused editor and a built-in community, it’s easier than ever to write your thoughts and share them immediately. You own your content, and we provide the reach to help you build an audience.
              </p>
            </div>

            <div>
              <h2 style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 600, color: "#ffffff", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Ad-Free & Member-Supported
              </h2>
              <p style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.7, color: "rgba(255, 255, 255, 0.7)" }}>
                Instead of selling your attention to advertisers, we are supported directly by our members. This means our only incentive is to help you find outstanding, high-quality writing, and reward the creators who make it possible.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 80, textAlign: "center", background: "rgba(255, 255, 255, 0.03)", padding: "48px 32px", borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 600, color: "#ffffff", marginBottom: 12 }}>
              Ready to share your story?
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
              Join UGET today and become part of a community that values deep thinking and quality narratives.
            </p>
            <Link 
              href="/?auth=signup" 
              className="btn btn-primary btn-lg" 
              style={{ 
                backgroundColor: "#ffffff", 
                color: "#191919", 
                fontWeight: 600,
                textDecoration: "none"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              Get started
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
