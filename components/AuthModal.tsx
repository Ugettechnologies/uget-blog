"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

/* ── OAuth Icons ─────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Reset options display on modal open
      setShowMoreOptions(false);
      setError("");
      setSuccess("");
      setName("");
      setEmail("");
      setPassword("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }) as any;
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          },
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflow: "hidden"
      }}
    >
      {/* Drifting background animation blobs */}
      <div 
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          top: "10%",
          left: "15%",
          animation: "float-blob-1 12s infinite ease-in-out",
          pointerEvents: "none"
        }}
      />
      <div 
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
          bottom: "15%",
          right: "10%",
          animation: "float-blob-2 16s infinite ease-in-out",
          pointerEvents: "none"
        }}
      />

      <style jsx global>{`
        @keyframes float-blob-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-blob-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.15); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Modal Container */}
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--modal-bg, white)",
          borderRadius: "20px",
          padding: "48px 36px 40px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          position: "relative",
          zIndex: 1010,
          animation: "modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          border: "1px solid var(--border)",
          textAlign: "center"
        }}
      >
        {/* Close [X] Button */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            padding: 8,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-3)";
            e.currentTarget.style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "none";
            e.currentTarget.style.color = "var(--muted)";
          }}
          aria-label="Close modal"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!showMoreOptions ? (
          /* ────────────────────────────────────────────────────────
             PRE-FILLED VIEW (Screenshot: Welcome back ogobor blessed)
             ──────────────────────────────────────────────────────── */
          <div>
            <h2 
              style={{ 
                fontFamily: "var(--display)", 
                fontSize: 32, 
                fontWeight: 700, 
                color: "var(--black)", 
                marginBottom: 24,
                letterSpacing: "-0.02em"
              }}
            >
              Welcome back.
            </h2>

            {/* Simulated Avatar Card */}
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                marginBottom: 32 
              }}
            >
              <div 
                style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: "50%", 
                  overflow: "hidden", 
                  marginBottom: 12,
                  boxShadow: "var(--shadow-md)",
                  border: "2px solid var(--border)",
                  position: "relative"
                }}
              >
                <Image 
                  src="/ogobor_avatar.png" 
                  alt="ogobor blessed" 
                  fill 
                  style={{ objectFit: "cover" }} 
                  priority
                />
              </div>
              <div 
                style={{ 
                  fontFamily: "var(--sans)", 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: "var(--ink)" 
                }}
              >
                ogobor blessed
              </div>
              <div 
                style={{ 
                  fontFamily: "var(--sans)", 
                  fontSize: 13, 
                  color: "var(--muted)" 
                }}
              >
                bl*********@gmail.com
              </div>
            </div>

            {/* Google Sign In Button */}
            <button 
              onClick={() => handleOAuth("google")} 
              className="oauth-btn"
              disabled={!!oauthLoading}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 999,
                fontSize: 15,
                fontWeight: 500,
                marginBottom: 20,
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg)";
                e.currentTarget.style.transform = "";
              }}
            >
              {oauthLoading === "google" ? (
                <div className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--ink)" }} />
              ) : (
                <GoogleIcon />
              )}
              Sign in with Google
            </button>

            {/* Action Links */}
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 12, 
                marginBottom: 32,
                fontSize: 13,
                fontFamily: "var(--sans)"
              }}
            >
              <button 
                onClick={() => setShowMoreOptions(true)} 
                style={{ 
                  color: "var(--muted)", 
                  textDecoration: "underline", 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer" 
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                Forget this account
              </button>

              <button 
                onClick={() => setShowMoreOptions(true)} 
                style={{ 
                  color: "var(--ink)", 
                  fontWeight: 500, 
                  textDecoration: "underline", 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer" 
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--brand)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink)")}
              >
                Not your account? More sign in options
              </button>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────
             FULL LOG IN & SIGN UP OPTIONS VIEW
             ──────────────────────────────────────────────────────── */
          <div style={{ textAlign: "left" }}>
            <h2 
              style={{ 
                fontFamily: "var(--display)", 
                fontSize: 28, 
                fontWeight: 700, 
                color: "var(--black)", 
                marginBottom: 6,
                textAlign: "center",
                letterSpacing: "-0.015em"
              }}
            >
              {mode === "login" ? "Welcome back." : "Join UGET."}
            </h2>
            <p 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: 14, 
                color: "var(--muted)", 
                marginBottom: 24,
                textAlign: "center"
              }}
            >
              {mode === "login" ? "Sign in to continue reading." : "Create an account to start writing."}
            </p>

            {/* Mode Tabs */}
            <div className="auth-tabs" style={{ marginBottom: 20 }}>
              <button 
                className={`auth-tab ${mode === "login" ? "active" : ""}`} 
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              >
                Sign in
              </button>
              <button 
                className={`auth-tab ${mode === "signup" ? "active" : ""}`} 
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              >
                Sign up
              </button>
            </div>

            {/* OAuth Buttons */}
            <button 
              onClick={() => handleOAuth("google")} 
              className="oauth-btn" 
              disabled={!!oauthLoading}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg)",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                cursor: "pointer",
                marginBottom: 10,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-3)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg)")}
            >
              {oauthLoading === "google" ? (
                <div className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--ink)" }} />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <button 
              onClick={() => handleOAuth("github")} 
              className="oauth-btn oauth-github" 
              disabled={!!oauthLoading}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: "var(--brand)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                cursor: "pointer",
                border: "none",
                marginBottom: 20,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand)")}
            >
              {oauthLoading === "github" ? (
                <div className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                <GithubIcon />
              )}
              Continue with GitHub
            </button>

            {/* Divider */}
            <div className="auth-divider" style={{ margin: "20px 0" }}>
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">Full name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Your full name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              )}
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Password</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showPw ? "text" : "password"} 
                    className="form-input" 
                    placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    style={{ paddingRight: 44 }} 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)}
                    style={{ 
                      position: "absolute", 
                      right: 12, 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      color: "var(--muted-2)", 
                      padding: 4,
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {showPw ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className="auth-submit" 
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  marginTop: 8
                }}
              >
                {loading ? <div className="spinner" /> : (mode === "login" ? "Sign in" : "Create account")}
              </button>
            </form>

            <button 
              onClick={() => setShowMoreOptions(false)} 
              style={{
                display: "block",
                margin: "16px auto 0",
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--muted)",
                textDecoration: "underline",
                border: "none",
                background: "none",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              ← Back to quick sign-in
            </button>
          </div>
        )}

        {/* Universal Disclaimer */}
        <p 
          style={{ 
            fontFamily: "var(--sans)", 
            fontSize: 12, 
            color: "var(--muted-2)", 
            marginTop: 24, 
            lineHeight: 1.6 
          }}
        >
          By clicking &ldquo;Sign in&rdquo;, you accept UGET&rsquo;s{" "}
          <Link href="/terms" style={{ color: "var(--ink)", textDecoration: "underline" }} onClick={onClose}>Terms of Service</Link> and{" "}
          <Link href="/privacy" style={{ color: "var(--ink)", textDecoration: "underline" }} onClick={onClose}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
