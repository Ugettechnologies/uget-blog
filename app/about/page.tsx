"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "80px 24px 100px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
          <span style={{ 
            fontFamily: "var(--sans)", 
            fontSize: 13, 
            fontWeight: 700, 
            textTransform: "uppercase", 
            letterSpacing: "0.1em", 
            color: "var(--brand)", 
            display: "block",
            marginBottom: 16 
          }}>
            About EchoGist
          </span>
          <h1 
            style={{ 
              fontFamily: "var(--serif)", 
              fontSize: "clamp(36px, 6vw, 64px)", 
              fontWeight: 400, 
              lineHeight: 1.1, 
              color: "var(--black)", 
              letterSpacing: "-0.02em",
              marginBottom: 32,
              maxWidth: 780
            }}
          >
            Where Ideas, Stories, and Deep Technical Knowledge Live.
          </h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 32, fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.8, color: "var(--ink-2)" }}>
            <p style={{ fontSize: 21, lineHeight: 1.6, color: "var(--ink)", fontWeight: 300 }}>
              EchoGist is an independent publishing platform and knowledge hub dedicated to bringing thoughtful, in-depth writing on software engineering, technology, career development, design, and artificial intelligence to a global audience.
            </p>
            
            <p>
              In an era dominated by superficial snippets and clickbait, EchoGist was founded on the belief that genuine learning and thoughtful discourse require nuance, depth, and clarity. Whether you are a beginner writing your first lines of code, an experienced software engineer architecting distributed systems, or a designer crafting user experiences, EchoGist provides a clutter-free, accessible environment to read and publish meaningful work.
            </p>

            <div style={{ 
              borderLeft: "3px solid var(--black)", 
              padding: "16px 0 16px 28px", 
              margin: "16px 0",
              background: "var(--bg-2)",
              borderRadius: "0 8px 8px 0"
            }}>
              <p style={{ fontStyle: "italic", fontSize: 20, color: "var(--black)", margin: 0, fontWeight: 400 }}>
                &ldquo;Our mission is to elevate technical literacy and empower creators to share practical, authentic insights without algorithmic distortion.&rdquo;
              </p>
            </div>

            <h2 style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: "var(--black)", marginTop: 24, marginBottom: 8 }}>
              Our Editorial Principles
            </h2>
            <p>
              To maintain the highest level of trust and value for our readers, content published on EchoGist adheres to four core principles:
            </p>
            <ul style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <li>
                <strong>Actionable Depth &amp; Practical Value:</strong> Every tutorial, architectural guide, and career essay must provide tangible value, validated code samples, or clear reasoning.
              </li>
              <li>
                <strong>Authenticity &amp; Originality:</strong> We champion authentic first-hand experience, original research, and unique analysis. We strictly discourage duplicate, scraped, or thin automated content.
              </li>
              <li>
                <strong>Transparency &amp; Attribution:</strong> All sources, research papers, external tools, and contributing authors are clearly cited and attributed.
              </li>
              <li>
                <strong>Reader-First Experience:</strong> Fast load times, responsive typography, intuitive navigation, and non-intrusive presentation ensure learning remains frictionless.
              </li>
            </ul>

            <h2 style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: "var(--black)", marginTop: 24, marginBottom: 8 }}>
              What We Cover
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 12 }}>
              <div style={{ padding: 20, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <h4 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 6 }}>💻 Web Development</h4>
                <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", margin: 0 }}>Modern frontend and backend frameworks, React, Next.js, Node.js, and database engineering.</p>
              </div>
              <div style={{ padding: 20, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <h4 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 6 }}>🤖 AI &amp; Machine Learning</h4>
                <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", margin: 0 }}>Practical LLM engineering, Retrieval-Augmented Generation (RAG), and generative AI workflows.</p>
              </div>
              <div style={{ padding: 20, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <h4 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 6 }}>🛡️ Cybersecurity</h4>
                <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", margin: 0 }}>Web security fundamentals, authentication systems, zero trust architectures, and risk mitigation.</p>
              </div>
              <div style={{ padding: 20, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <h4 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 6 }}>🚀 Career &amp; Growth</h4>
                <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", margin: 0 }}>Navigating technical hiring, leveling up to senior engineering, portfolio design, and remote work.</p>
              </div>
            </div>

            <h2 style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: "var(--black)", marginTop: 32, marginBottom: 8 }}>
              Publisher &amp; Contact Information
            </h2>
            <p>
              EchoGist is operated by <strong>EchoGist Technologies</strong>. We welcome feedback, editorial submissions, corrections, and partnerships from developers and writers worldwide.
            </p>
            <div style={{ padding: 24, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, marginTop: 8 }}>
              <p style={{ margin: "0 0 10px", fontSize: 15, fontFamily: "var(--sans)" }}>
                <strong>Official Inquiries:</strong> <a href="mailto:support@echo-gist.com" style={{ color: "var(--brand)", textDecoration: "underline" }}>support@echo-gist.com</a>
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 15, fontFamily: "var(--sans)" }}>
                <strong>Editorial Team:</strong> <a href="mailto:editor@echo-gist.com" style={{ color: "var(--brand)", textDecoration: "underline" }}>editor@echo-gist.com</a>
              </p>
              <p style={{ margin: 0, fontSize: 15, fontFamily: "var(--sans)" }}>
                <strong>Community &amp; Guidelines:</strong> Visit our <Link href="/rules" style={{ color: "var(--brand)", textDecoration: "underline" }}>Community Rules</Link> and <Link href="/privacy" style={{ color: "var(--brand)", textDecoration: "underline" }}>Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

