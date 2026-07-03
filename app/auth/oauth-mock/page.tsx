"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSavedUsers, getInitials } from "@/lib/types";
import type { SavedUser } from "@/lib/types";

/* ── OAuth Icons ─────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

function OAuthMockInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const provider = (searchParams.get("provider") || "google").toLowerCase();
  const next = searchParams.get("next") || "/dashboard";

  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [themeIsDark, setThemeIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      const localTheme = localStorage.getItem("theme");
      const systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDarkActive = root.classList.contains("dark") || 
                           localTheme === "dark" || 
                           (!localTheme && systemIsDark);
      setThemeIsDark(isDarkActive);
    };
    checkTheme();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => checkTheme();
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const list = getSavedUsers();
    // Filter to only matching provider if needed, or show all email accounts
    const filtered = list.filter(u => u.provider === provider || u.provider === "email");
    setSavedUsers(filtered);
    if (filtered.length === 0) {
      setShowCustomForm(true);
    }
  }, [provider]);

  const handleSelectAccount = (selectedEmail: string, selectedName: string) => {
    setLoading(true);
    const targetUrl = `/api/auth/oauth/${provider}?email=${encodeURIComponent(selectedEmail)}&name=${encodeURIComponent(selectedName)}&next=${encodeURIComponent(next)}`;
    router.push(targetUrl);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const displayName = name || email.split("@")[0];
    const targetUrl = `/api/auth/oauth/${provider}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName)}&next=${encodeURIComponent(next)}`;
    router.push(targetUrl);
  };

  // Provider-specific theme styles
  let themeBg = "white";
  let brandColor = "#1a73e8"; // Google Blue
  let btnBg = "#1a73e8";
  let titleText = "Sign in with Google";
  let subtitleText = "to continue to UGET";
  let logo = <GoogleIcon />;

  if (provider === "github") {
    themeBg = "#0d1117"; // GitHub dark mode
    brandColor = "#2da44e"; // GitHub Green
    btnBg = "#2da44e";
    titleText = "Authorize UGET Blog";
    subtitleText = "to connect your GitHub account";
    logo = <span style={{ color: "#c9d1d9" }}><GithubIcon /></span>;
  } else if (provider === "facebook") {
    themeBg = "#f0f2f5";
    brandColor = "#1877F2";
    btnBg = "#1877F2";
    titleText = "Log in with Facebook";
    subtitleText = "to continue to UGET";
    logo = <FacebookIcon />;
  }

  const isDark = provider === "github" || themeIsDark;

  return (
    <div 
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#0d1117" : "#f8f9fa",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        padding: "20px",
        transition: "all 0.3s"
      }}
    >
      <div 
        style={{
          width: "100%",
          maxWidth: "450px",
          backgroundColor: isDark ? "#161b22" : "white",
          borderRadius: "16px",
          padding: "40px 32px",
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.06)",
          border: isDark ? "1px solid #30363d" : "1px solid #e1e4e8",
          textAlign: "center",
          color: isDark ? "#c9d1d9" : "#24292e"
        }}
      >
        {/* Brand Logo Row */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div 
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: "50%", 
              backgroundColor: isDark ? "#30363d" : "#f1f3f4", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            {logo}
          </div>
          <span style={{ fontSize: 24, fontWeight: 300, color: isDark ? "#8b949e" : "#5f6368" }}>⟷</span>
          <div 
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: "12px", 
              backgroundColor: "var(--brand, #7c3aed)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
            }}
          >
            <span style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>U</span>
          </div>
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px 0", color: isDark ? "#f0f6fc" : "#202124" }}>
          {titleText}
        </h2>
        <p style={{ fontSize: "15px", color: isDark ? "#8b949e" : "#5f6368", margin: "0 0 32px 0" }}>
          {subtitleText}
        </p>

        {loading ? (
          <div style={{ padding: "40px 0" }}>
            <div 
              style={{
                width: 40,
                height: 40,
                border: `3px solid ${isDark ? "#30363d" : "#e8eaed"}`,
                borderTopColor: brandColor,
                borderRadius: "50%",
                margin: "0 auto 20px auto",
                animation: "spin 0.8s linear infinite"
              }}
            />
            <p style={{ fontSize: 14, color: isDark ? "#8b949e" : "#5f6368" }}>Connecting to UGET...</p>
          </div>
        ) : (
          <>
            {/* Account Chooser */}
            {!showCustomForm && savedUsers.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", margin: "0 0 12px 0", color: isDark ? "#8b949e" : "#5f6368" }}>
                  Saved Accounts
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {savedUsers.map((su) => (
                    <button
                      key={su.email}
                      onClick={() => handleSelectAccount(su.email, su.full_name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        padding: "12px 16px",
                        backgroundColor: isDark ? "#21262d" : "white",
                        border: isDark ? "1px solid #30363d" : "1px solid #dadce0",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        color: isDark ? "#c9d1d9" : "#3c4043",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? "#30363d" : "#f8f9fa";
                        e.currentTarget.style.borderColor = isDark ? "#8b949e" : "#bdc1c6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? "#21262d" : "white";
                        e.currentTarget.style.borderColor = isDark ? "#30363d" : "#dadce0";
                      }}
                    >
                      <div 
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: "var(--brand-light, #f5f3ff)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: 14,
                          color: "var(--brand, #7c3aed)"
                        }}
                      >
                        {getInitials(su.full_name || su.email)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {su.full_name}
                        </div>
                        <div style={{ fontSize: 12, color: isDark ? "#8b949e" : "#70757a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {su.email}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: isDark ? "#58a6ff" : "#1a73e8", fontWeight: 500 }}>Sign in →</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCustomForm(true)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: isDark ? "#58a6ff" : "#1a73e8",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Use another account
                </button>
              </div>
            )}

            {/* Custom Input Form */}
            {showCustomForm && (
              <form onSubmit={handleSubmitCustom} style={{ textAlign: "left" }}>
                <div style={{ marginBottom: 16 }}>
                  <label 
                    style={{ 
                      display: "block", 
                      fontSize: 14, 
                      fontWeight: 500, 
                      marginBottom: 6, 
                      color: isDark ? "#c9d1d9" : "#3c4043" 
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #30363d" : "1px solid #dadce0",
                      backgroundColor: isDark ? "#0d1117" : "white",
                      color: isDark ? "white" : "black",
                      fontSize: 14,
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label 
                    style={{ 
                      display: "block", 
                      fontSize: 14, 
                      fontWeight: 500, 
                      marginBottom: 6, 
                      color: isDark ? "#c9d1d9" : "#3c4043" 
                    }}
                  >
                    Full Name (for new accounts)
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: isDark ? "1px solid #30363d" : "1px solid #dadce0",
                      backgroundColor: isDark ? "#0d1117" : "white",
                      color: isDark ? "white" : "black",
                      fontSize: 14,
                      outline: "none"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: btnBg,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  Continue to UGET
                </button>

                {savedUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      marginTop: 16,
                      backgroundColor: "transparent",
                      border: "none",
                      color: isDark ? "#8b949e" : "#5f6368",
                      fontSize: 13,
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    ← Back to saved accounts
                  </button>
                )}
              </form>
            )}
          </>
        )}

        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function OAuthMockPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e8eaed", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    }>
      <OAuthMockInner />
    </Suspense>
  );
}
