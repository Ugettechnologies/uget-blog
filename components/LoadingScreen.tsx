"use client";
import React, { useState, useEffect } from "react";

const PHRASES = [
  "Turning the page…",
  "Gathering stories…",
  "Inking the presses…",
  "Echoing thoughts…",
  "Preparing your feed…"
];

export default function LoadingScreen() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % PHRASES.length);
        setFade(true);
      }, 300);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: "var(--bg, #ffffff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <style jsx global>{`
        @keyframes pageFanLeft {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          50% { transform: rotate(-14deg) translateX(-6px); }
        }
        @keyframes pageFanRight {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          50% { transform: rotate(14deg) translateX(6px); }
        }
        @keyframes pageCenterFlip {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.92) translateY(-2px); }
        }
        @keyframes caretBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Animated Book & Pages Fan Icon */}
      <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Left page leaf */}
        <div
          style={{
            position: "absolute",
            width: 32,
            height: 44,
            borderRadius: "3px 8px 8px 3px",
            border: "2px solid var(--brand, #7c3aed)",
            background: "var(--brand-light, rgba(124, 58, 237, 0.08))",
            transformOrigin: "right center",
            animation: "pageFanLeft 2s ease-in-out infinite",
          }}
        />
        {/* Right page leaf */}
        <div
          style={{
            position: "absolute",
            width: 32,
            height: 44,
            borderRadius: "8px 3px 3px 8px",
            border: "2px solid var(--brand, #7c3aed)",
            background: "var(--brand-light, rgba(124, 58, 237, 0.08))",
            transformOrigin: "left center",
            animation: "pageFanRight 2s ease-in-out infinite",
          }}
        />
        {/* Center Book Spine & Sheet */}
        <div
          style={{
            position: "relative",
            width: 36,
            height: 48,
            borderRadius: 6,
            background: "var(--bg, #ffffff)",
            border: "2px solid var(--ink, #171717)",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "8px 6px",
            zIndex: 2,
            animation: "pageCenterFlip 2s ease-in-out infinite",
          }}
        >
          {/* Skeleton lines on page */}
          <div style={{ width: "85%", height: 2.5, borderRadius: 2, background: "var(--brand, #7c3aed)" }} />
          <div style={{ width: "100%", height: 2, borderRadius: 2, background: "var(--muted, #a3a3a3)", opacity: 0.7 }} />
          <div style={{ width: "70%", height: 2, borderRadius: 2, background: "var(--muted, #a3a3a3)", opacity: 0.7 }} />
          <div style={{ width: "90%", height: 2, borderRadius: 2, background: "var(--muted, #a3a3a3)", opacity: 0.7 }} />
          <div style={{ width: "40%", height: 2, borderRadius: 2, background: "var(--brand, #7c3aed)" }} />
        </div>
      </div>

      {/* Brand & Rotating Text */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div
          style={{
            fontFamily: "var(--display, serif)",
            fontSize: 20,
            fontWeight: 700,
            color: "var(--ink, #171717)",
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <span>EchoGist</span>
          <span style={{ width: 2, height: 16, background: "var(--brand, #7c3aed)", animation: "caretBlink 1s step-end infinite", display: "inline-block", marginLeft: 2 }} />
        </div>

        <div
          style={{
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--sans, sans-serif)",
              fontSize: 14,
              color: "var(--muted, #737373)",
              fontWeight: 500,
              letterSpacing: "0.01em",
              opacity: fade ? 1 : 0,
              transform: fade ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            {PHRASES[index]}
          </span>
        </div>
      </div>
    </div>
  );
}
