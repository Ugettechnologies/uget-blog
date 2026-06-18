"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if ("speechSynthesis" in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert("Text to speech is not supported in this browser.");
    }
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          Text to Speech
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", marginBottom: 40, lineHeight: 1.6 }}>
          Experience hands-free reading on UGET. Listen to your stories or copy any text below to hear it spoken aloud using our high-fidelity narration engine.
        </p>

        <form onSubmit={handleSpeak} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <textarea
            className="form-input"
            rows={8}
            placeholder="Paste your story content here to listen..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ 
              resize: "vertical", 
              fontFamily: "var(--serif)", 
              fontSize: 16, 
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--border)",
              width: "100%"
            }}
            required
          />
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            style={{ alignSelf: "flex-start", minWidth: 160 }}
          >
            {speaking ? "🔊 Stop Listening" : "🗣️ Listen Now"}
          </button>
        </form>

        <div style={{ borderTop: "1px solid var(--border)", marginTop: 48, paddingTop: 32 }}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>
            Audio Stories
          </h3>
          <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6 }}>
            Every member-only article on UGET comes with a built-in play button at the top of the page. Subscribed members can listen to high-quality audio narrations of their favorite articles on the go, perfect for commutes or multitasking.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
