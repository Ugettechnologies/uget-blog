"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HelpPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 24, color: "var(--black)" }}>
          Help Center
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", marginBottom: 40, lineHeight: 1.6 }}>
          Need assistance or want to learn how to make the most of UGET? Search our guides below or reach out to support.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            { q: "How do I start writing on UGET?", a: "Once you sign in, click the 'Write' button in the navigation bar. This will take you to our simple, clutter-free text editor where you can type your title, upload a cover image, format headings, and publish your story instantly." },
            { q: "Is UGET free to read?", a: "Yes, you can read public stories for free. We also have a member-supported model where premium stories can be unlocked by subscribing to our Membership package." },
            { q: "How do I update my profile?", a: "Go to settings by clicking on your avatar dropdown menu and choosing 'Settings'. You can update your display name, set a username, write a short bio, and select your preferred light or dark theme." },
            { q: "Can I delete or edit a published story?", a: "Absolutely. Simply go to your profile, click on the story you wish to edit, and click 'Edit'. You can make updates and save, or choose to delete the post entirely from the editor settings." }
          ].map((faq) => (
            <div key={faq.q} style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 24 }}>
              <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{faq.q}</h3>
              <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
