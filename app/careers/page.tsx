"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CareersPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          Careers at EchoGist
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", marginBottom: 40, lineHeight: 1.6 }}>
          Help us build the future of online publishing. We are a small, fully remote team passionate about high-quality writing, human storytelling, and clean software craftsmanship.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>
              Why Join Us?
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
              At EchoGist, we do not measure success by ad impressions or click rates. We measure success by the depth of thinking and direct value we generate for our writers and readers. You will work on a clean, modern stack, enjoy a flexible work schedule, and have a major voice in defining platform features.
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 32 }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 20 }}>
              Open Roles
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { title: "Senior Full-Stack Engineer (React / Next.js)", type: "Remote · Full-time", desc: "Lead the feature development of the EchoGist editor, notification mechanics, and collaborative drafting tools." },
                { title: "UI/UX Product Designer", type: "Remote · Full-time", desc: "Own the premium visual layout and design aesthetics of EchoGist platforms across web, tablet, and mobile displays." },
                { title: "Community & Creator Advocate", type: "Remote · Part-time", desc: "Build relationships with independent writers, journalists, and editors to foster organic creator growth." }
              ].map((role) => (
                <div key={role.title} style={{ padding: "20px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12 }}>
                  <h4 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                    {role.title}
                  </h4>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--brand)", fontWeight: 500 }}>
                    {role.type}
                  </span>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
                    {role.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
