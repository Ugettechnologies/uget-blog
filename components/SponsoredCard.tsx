"use client";

import { useState } from "react";

interface SponsoredCardProps {
  variant?: "feed" | "sidebar" | "banner";
}

const SPONSORED_OFFERS = [
  {
    title: "Discover Trending Tech & Daily Insights",
    description: "Explore curated stories, exclusive member updates, and special partner resources.",
    tag: "Sponsored",
    link: "https://omg10.com/4/11623443",
    cta: "Learn More",
  },
  {
    title: "Exclusive Member Content & Tools",
    description: "Access top writer tools, community perks, and featured partner content.",
    tag: "Partner Deal",
    link: "https://omg10.com/4/11623466",
    cta: "Explore Now",
  },
];

export default function SponsoredCard({ variant = "feed" }: SponsoredCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  // Pick deterministic offer based on variant
  const offer = variant === "sidebar" ? SPONSORED_OFFERS[0] : SPONSORED_OFFERS[1];

  if (variant === "sidebar") {
    return (
      <div 
        style={{
          margin: "16px 0",
          padding: "16px",
          borderRadius: "12px",
          background: "var(--bg-2, #18181b)",
          border: "1px solid var(--border, #27272a)",
          position: "relative"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#a855f7", background: "rgba(168, 85, 247, 0.12)", padding: "2px 8px", borderRadius: "999px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
            {offer.tag}
          </span>
          <button
            onClick={() => setDismissed(true)}
            style={{ background: "transparent", border: "none", color: "var(--muted, #a1a1aa)", cursor: "pointer", padding: "2px 4px", fontSize: "12px", borderRadius: "4px" }}
            title="Dismiss sponsored content"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
        <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink, #fafafa)", lineHeight: 1.4, margin: "0 0 4px 0" }}>
          {offer.title}
        </h4>
        <p style={{ fontSize: "12px", color: "var(--muted, #a1a1aa)", margin: "0 0 12px 0", lineHeight: 1.5 }}>
          {offer.description}
        </p>
        <a
          href={offer.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "8px 12px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#09090b",
            background: "#f59e0b",
            borderRadius: "8px",
            textDecoration: "none",
            transition: "opacity 0.2s"
          }}
        >
          {offer.cta} &rarr;
        </a>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div 
        style={{
          margin: "24px 0",
          padding: "20px",
          borderRadius: "16px",
          background: "var(--bg-2, #18181b)",
          border: "1px solid var(--border, #27272a)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          position: "relative"
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#f59e0b", background: "rgba(245, 158, 11, 0.12)", padding: "2px 8px", borderRadius: "999px", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              {offer.tag}
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted, #a1a1aa)" }}>Sponsored</span>
          </div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink, #fafafa)", margin: "0 0 4px 0" }}>{offer.title}</h3>
          <p style={{ fontSize: "13px", color: "var(--muted, #a1a1aa)", margin: 0, lineHeight: 1.5 }}>{offer.description}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a
            href={offer.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              whiteSpace: "nowrap",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#09090b",
              background: "#f59e0b",
              borderRadius: "10px",
              textDecoration: "none"
            }}
          >
            {offer.cta} &rarr;
          </a>
          <button
            onClick={() => setDismissed(true)}
            style={{ background: "transparent", border: "none", color: "var(--muted, #a1a1aa)", cursor: "pointer", padding: "4px 8px", fontSize: "14px" }}
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Feed card variant
  return (
    <article 
      style={{
        margin: "20px 0",
        padding: "16px 20px",
        borderRadius: "12px",
        background: "var(--bg-2, #18181b)",
        border: "1px solid var(--border, #27272a)",
        position: "relative"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#a855f7", background: "rgba(168, 85, 247, 0.12)", padding: "2px 8px", borderRadius: "999px", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
            {offer.tag}
          </span>
          <span style={{ fontSize: "11px", color: "var(--muted, #a1a1aa)" }}>Sponsored Content</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: "transparent", border: "none", color: "var(--muted, #a1a1aa)", cursor: "pointer", padding: "2px 6px", fontSize: "13px" }}
          aria-label="Dismiss post"
        >
          ✕
        </button>
      </div>
      <a
        href={offer.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink, #fafafa)", margin: "0 0 4px 0", lineHeight: 1.4 }}>
          {offer.title}
        </h3>
        <p style={{ fontSize: "13px", color: "var(--muted, #a1a1aa)", margin: 0, lineHeight: 1.5 }}>
          {offer.description}
        </p>
      </a>
      <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <a
          href={offer.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: "#f59e0b",
            textDecoration: "none"
          }}
        >
          <span>{offer.cta}</span>
          <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </article>
  );
}

