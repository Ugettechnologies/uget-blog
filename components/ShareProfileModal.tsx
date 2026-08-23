"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getInitials } from "@/lib/types";

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    id?: string;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    follower_count?: number;
    twitter?: string | null;
    website?: string | null;
  } | null;
}

function formatTwitterHandle(handle: string | null | undefined): string {
  if (!handle) return "";
  return handle.trim().replace(/^@/, "");
}

function formatWebsiteUrl(url: string | null | undefined): string {
  if (!url) return "";
  let trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function formatWebsiteDisplay(url: string | null | undefined): string {
  if (!url) return "";
  return url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function ShareProfileModal({ isOpen, onClose, profile }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedTwitter, setCopiedTwitter] = useState(false);
  const [copiedWebsite, setCopiedWebsite] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && profile) {
      const usernameHandle = profile.username ? profile.username.replace(/^@/, "") : profile.id || "";
      const url = `${window.location.origin}/profile/${usernameHandle}`;
      setProfileUrl(url);
    }
  }, [profile]);

  if (!isOpen || !profile) return null;

  const fullName = profile.full_name || "Writer";
  const username = profile.username ? `@${profile.username.replace(/^@/, "")}` : "@writer";

  const handleCopy = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} (${username}) on EchoGist`,
          text: `Check out ${fullName}'s profile on EchoGist!`,
          url: profileUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const shareTitle = encodeURIComponent(`Check out ${fullName}'s profile on EchoGist!`);
  const encodedUrl = encodeURIComponent(profileUrl);

  const socialLinks = [
    {
      name: "WhatsApp",
      bgColor: "#25D366",
      hoverBg: "#20bd5a",
      textColor: "#ffffff",
      url: `https://api.whatsapp.com/send?text=${shareTitle}%20${encodedUrl}`,
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.87 11.87 0 005.707 1.456h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.177-1.238-6.163-3.487-8.411" />
        </svg>
      ),
    },
    {
      name: "Snapchat",
      bgColor: "#FFFC00",
      hoverBg: "#f0ed00",
      textColor: "#000000",
      url: `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`,
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.007 0C5.834 0 4.144 2.802 4.144 4.545c0 1.258.461 2.222 1.096 3.018.175.22.188.384.072.585-.183.315-.658.995-1.129 1.472-.451.457-.962.632-1.39.632-.239 0-.472-.054-.68-.159-.286-.145-.505-.18-.686-.18-.389 0-.69.274-.69.7 0 .809 1.077 1.471 2.378 1.471.493 0 1.002-.12 1.464-.343.435-.21.84-.45 1.157-.45.203 0 .341.076.474.331.332.638 1.082 1.776 2.793 2.039.262.04.548.061.85.061.353 0 .685-.027.974-.072 1.73-.27 2.474-1.42 2.8-2.052.128-.247.265-.32.464-.32.321 0 .723.238 1.157.447.464.223.974.343 1.467.343 1.301 0 2.378-.662 2.378-1.471 0-.426-.301-.7-.69-.7-.181 0-.4.035-.686.18-.208.105-.441.159-.68.159-.428 0-.939-.175-1.39-.632-.471-.477-.946-1.157-1.129-1.472-.116-.201-.103-.365.072-.585.635-.796 1.096-1.76 1.096-3.018C19.87 2.802 18.18 0 12.007 0z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      bgColor: "#0A66C2",
      hoverBg: "#0855a3",
      textColor: "#ffffff",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      bgColor: "#000000",
      hoverBg: "#1a1a1a",
      textColor: "#ffffff",
      url: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodedUrl}`,
      icon: (
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      bgColor: "#1877F2",
      hoverBg: "#1464cc",
      textColor: "#ffffff",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      bgColor: "#26A5E4",
      hoverBg: "#1e8cc3",
      textColor: "#ffffff",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${shareTitle}`,
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.03 9.56c-.15.68-.55.84-1.12.52l-3.1-2.28-1.5 1.44c-.16.16-.3.3-.61.3l.22-3.15 5.74-5.18c.25-.22-.05-.34-.39-.12l-7.1 4.47-3.06-.96c-.66-.21-.68-.66.14-.98l11.96-4.61c.55-.2 1.04.14.85.99z" />
        </svg>
      ),
    },
    {
      name: "Reddit",
      bgColor: "#FF4500",
      hoverBg: "#d93a00",
      textColor: "#ffffff",
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${shareTitle}`,
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.196-.491a1.72 1.72 0 0 1 1.718 1.717c0 .67-.384 1.252-.94 1.543.018.197.027.397.027.599 0 3.08-3.484 5.578-7.788 5.578-4.305 0-7.788-2.498-7.788-5.578 0-.197.008-.393.024-.585A1.73 1.73 0 0 1 3.528 12.5a1.72 1.72 0 0 1 1.718-1.717c.47 0 .894.186 1.206.498 1.192-.853 2.844-1.414 4.664-1.488l.926-4.336 3.067.644a1.25 1.25 0 0 1 1.903-.357z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-2, #ffffff)",
          border: "1px solid var(--border, #e5e7eb)",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "scaleUp 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border-2, #f3f4f6)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "var(--brand-light, rgba(124, 58, 237, 0.1))",
                color: "var(--brand, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a3 3 0 100-6 3 3 0 000 6zm-12 7a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6zm-12-7l8-4.5m-8 4.5l8 4.5" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--sans)", fontSize: "18px", fontWeight: 700, color: "var(--black)", margin: 0, lineHeight: 1.2 }}>
                Share Profile
              </h3>
              <p style={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--muted)", margin: 0, marginTop: "2px" }}>
                Share {fullName}'s EchoGist profile link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3, #f3f4f6)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* User Profile Card Preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "var(--bg-3, #f9fafb)",
              border: "1px solid var(--border-2, #f3f4f6)",
            }}
          >
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={fullName} width={52} height={52} className="object-cover w-full h-full" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getInitials(fullName)}
                </div>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "var(--sans)", fontSize: "16px", fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {fullName}
              </div>
              <div style={{ fontFamily: "var(--sans)", fontSize: "13px", color: "var(--muted)", marginTop: "1px" }}>
                {username}
              </div>

              {/* Twitter handle & Website badges if present */}
              {(profile.twitter || profile.website) && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginTop: "6px" }}>
                  {profile.twitter && (
                    <a
                      href={`https://x.com/${formatTwitterHandle(profile.twitter)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontFamily: "var(--sans)",
                        fontWeight: 600,
                        color: "var(--ink)",
                        textDecoration: "none",
                        background: "rgba(0,0,0,0.05)",
                        padding: "2px 8px",
                        borderRadius: "99px",
                      }}
                      title="View X/Twitter Profile"
                    >
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>@{formatTwitterHandle(profile.twitter)}</span>
                    </a>
                  )}
                  {profile.website && (
                    <a
                      href={formatWebsiteUrl(profile.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        fontFamily: "var(--sans)",
                        fontWeight: 600,
                        color: "#7c3aed",
                        textDecoration: "none",
                        background: "rgba(124,58,237,0.08)",
                        padding: "2px 8px",
                        borderRadius: "99px",
                      }}
                      title="Visit Website"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                      </svg>
                      <span>{formatWebsiteDisplay(profile.website)}</span>
                    </a>
                  )}
                </div>
              )}

              {profile.bio && (
                <p style={{ fontFamily: "var(--serif)", fontSize: "12.5px", color: "var(--muted)", margin: 0, marginTop: "6px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {profile.bio}
                </p>
              )}
            </div>
            {profile.follower_count !== undefined && (
              <div style={{ textAlign: "right", paddingLeft: "8px", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: "14px", fontWeight: 700, color: "var(--brand, #7c3aed)", display: "block" }}>
                  {profile.follower_count}
                </span>
                <span style={{ fontFamily: "var(--sans)", fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Followers
                </span>
              </div>
            )}
          </div>

          {/* Copy Link Section */}
          <div>
            <label style={{ fontFamily: "var(--sans)", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "block" }}>
              Direct Profile Link
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                readOnly
                value={profileUrl}
                style={{
                  flex: 1,
                  background: "var(--bg, #ffffff)",
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: "12px",
                  padding: "10px 14px",
                  fontSize: "13.5px",
                  fontFamily: "var(--sans)",
                  color: "var(--ink)",
                  outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                }}
              />
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "#10b981" : "var(--brand, #7c3aed)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 18px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  fontFamily: "var(--sans)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: copied ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(124, 58, 237, 0.25)",
                }}
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Grid */}
          <div>
            <label style={{ fontFamily: "var(--sans)", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px", display: "block" }}>
              Share to Social Media
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              {socialLinks.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "12px 8px",
                    borderRadius: "14px",
                    background: platform.bgColor,
                    color: platform.textColor,
                    textDecoration: "none",
                    fontFamily: "var(--sans)",
                    fontSize: "11px",
                    fontWeight: 600,
                    transition: "transform 0.15s ease, filter 0.15s ease",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.filter = "brightness(0.95)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.filter = "none";
                  }}
                >
                  {platform.icon}
                  <span>{platform.name}</span>
                </a>
              ))}

              {/* Native System Share / More button */}
              <button
                onClick={handleNativeShare}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "12px 8px",
                  borderRadius: "14px",
                  background: "var(--bg-3, #f3f4f6)",
                  border: "1px solid var(--border, #e5e7eb)",
                  color: "var(--ink, #111827)",
                  fontFamily: "var(--sans)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "transform 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "var(--border-2, #e5e7eb)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.background = "var(--bg-3, #f3f4f6)";
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>More</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
