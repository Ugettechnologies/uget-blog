"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BlogPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          The EchoGist Official Blog
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Product updates, design notes, and stories from inside EchoGist.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {[
            { date: "June 18, 2026", title: "Introducing Self-Healing Database Warnings on Live Dashboard", excerpt: "To assist developers and project owners during deployment, EchoGist's dashboard now detects missing database schemas automatically and offers a single-click self-healing migration button directly in the UI." },
            { date: "May 24, 2026", title: "Improving Editor Typography with Variable Serif Fonts", excerpt: "We believe that reading comfort is paramount. In this update, we switched our core editor typeface to Google Fonts Literata and Source Serif 4 to provide a premium, fatigue-free reading experience." },
            { date: "April 12, 2026", title: "Why We Choose Direct Member Support Over Ad Monetization", excerpt: "Monetization shapes incentives. Learn more about our decision to completely omit display ads from EchoGist, placing the relationship between writer and reader first." }
          ].map((blogPost) => (
            <article key={blogPost.title} style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 28 }}>
              <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{blogPost.date}</span>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", margin: "4px 0 10px" }}>{blogPost.title}</h3>
              <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>{blogPost.excerpt}</p>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
