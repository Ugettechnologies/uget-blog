"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand)", display: "block", marginBottom: 12 }}>
          Get in Touch
        </span>
        <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 700, marginBottom: 12, color: "var(--black)" }}>
          Contact Us
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--muted)", marginBottom: 40, lineHeight: 1.6 }}>
          Have a question, feedback, editorial inquiry, or technical issue? Reach out directly to the EchoGist team using the form below or our direct email and WhatsApp support channels.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
          <div style={{ padding: 24, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 6 }}>
              📧 Email Inquiries
            </h3>
            <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
              For article pitches, account support, partnerships, and general inquiries:
            </p>
            <a href="mailto:ugettechnologies@gmail.com" style={{ color: "var(--brand)", fontWeight: 600, fontSize: 14, textDecoration: "underline" }}>
              ugettechnologies@gmail.com
            </a>
          </div>

          <div style={{ padding: 24, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12 }}>
            <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 6 }}>
              💬 WhatsApp &amp; Direct Line
            </h3>
            <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", margin: "0 0 10px" }}>
              Direct messaging for quick support, writer assistance, and urgent issues:
            </p>
            <a 
              href="https://wa.me/2348106175131" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: "#25D366", fontWeight: 600, fontSize: 14, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span>+234-8106175131</span>
              <span>(Chat on WhatsApp &rarr;)</span>
            </a>
          </div>
        </div>

        <div style={{ padding: 32, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 16 }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--black)", marginBottom: 16 }}>
            Send us a message
          </h2>

          {submitted ? (
            <div style={{ padding: 20, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, color: "#10b981" }}>
              <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Message Received</h4>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>Thank you for reaching out! A member of our team will reply to <strong>{formData.email}</strong> within 24–48 business hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Inquiry or feedback topic"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>Message</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your message in detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", fontSize: 14, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: "flex-start", padding: "10px 24px", fontSize: 14, fontWeight: 600 }}
              >
                Submit Message
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
