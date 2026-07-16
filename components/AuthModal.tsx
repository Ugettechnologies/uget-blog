"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { getInitials, getSavedUsers, saveUserToSavedList, removeUserFromSavedList } from "@/lib/types";
import type { SavedUser } from "@/lib/types";


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

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" style={{ flexShrink: 0 }}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState(false);

  // New verification states
  const [verificationStep, setVerificationStep] = useState<"none" | "verify_code" | "forgot_password" | "reset_password" | "check_email">("none");
  const [verificationCode, setVerificationCode] = useState("");
  const [userInputCode, setUserInputCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [toastCode, setToastCode] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      const list = getSavedUsers();
      setSavedUsers(list);
      
      if (list.length > 0 && mode === "login") {
        setShowMoreOptions(false);
      } else {
        setShowMoreOptions(true);
      }

      setShowEmailForm(false);
      setError("");
      setSuccess("");
      setName("");
      setEmail("");
      setPassword("");

      // Reset verification steps
      setVerificationStep("none");
      setVerificationCode("");
      setUserInputCode("");
      setNewPassword("");
      setToastCode(null);

      const urlError = searchParams?.get("error");
      if (urlError) {
        setError(urlError);
        setShowEmailForm(true);
      }
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleOAuth = async (provider: "google" | "github" | "facebook") => {
    setOauthLoading(provider);
    setError("");
    localStorage.setItem("uget_remember_me", rememberMe ? "true" : "false");
    localStorage.setItem("uget_pending_provider", provider);
    
    await supabase.auth.signOut();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { 
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { prompt: "consent" }
      },
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
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      localStorage.setItem("uget_remember_me", rememberMe ? "true" : "false");
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: mode === "signup" ? name : "", mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }
      setVerificationStep("check_email");
      setSuccess(`A sign-in link has been sent to ${email}!`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (userInputCode !== verificationCode) {
      setError("Invalid verification code. Please try again.");
      return;
    }
    setLoading(true);
    localStorage.setItem("uget_remember_me", rememberMe ? "true" : "false");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          },
        });
        if (error) throw error;
        
        if (data?.user) {
          if (rememberMe) {
            saveUserToSavedList(data.user, { full_name: name, avatar_url: "" }, "email");
          }
        }
        onClose();
        router.push("/onboarding");
        router.refresh();
      } else {
        await supabase.auth.signOut();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
          if (rememberMe) {
            saveUserToSavedList(user, profile, "email");
          }
          const hasInterests = profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0;
          onClose();
          if (!hasInterests) {
            router.push("/onboarding");
          } else {
            router.push("/dashboard");
          }
        } else {
          onClose();
        }
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const generated = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(generated);
      setToastCode(generated);
      console.log(`\n==================================================`);
      console.log(`[EchoGist RESET PASSWORD] Verification Code for ${email} is: ${generated}`);
      console.log(`==================================================\n`);
      setVerificationStep("reset_password");
      setSuccess("A verification code has been sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (userInputCode !== verificationCode) {
      setError("Invalid verification code. Please try again.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: newPassword });
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (rememberMe) {
          saveUserToSavedList(user, profile, "email");
        }
        onClose();
        router.push("/dashboard");
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
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
        padding: "40px 16px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch"
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
        className="modal auth-modal-light" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "40px 24px 32px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 24px 64px rgba(124,58,237,0.16)",
          position: "relative",
          zIndex: 1010,
          animation: "modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          border: "1px solid #e8e8e8",
          textAlign: "center",
          margin: "auto",
          /* Force light palette so inputs/labels are always readable */
          color: "#1a1a1a",
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

        {/* Simulated Email Passcode Toast Notification */}
        {toastCode && (
          <div 
            style={{
              position: "absolute",
              top: -65,
              left: 0,
              right: 0,
              backgroundColor: "#191919",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              fontFamily: "var(--sans)",
              fontSize: 13,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 1100,
              animation: "slideDown 0.3s ease-out forwards"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>✉️</span>
              <div>
                <strong style={{ display: "block" }}>[Email Code Verification]</strong>
                <span style={{ color: "var(--muted-2)" }}>
                  Your code is <strong style={{ color: "#10b981", fontSize: 14, letterSpacing: 1 }}>{toastCode}</strong>
                </span>
              </div>
            </div>
            <button 
              onClick={() => setToastCode(null)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 14, padding: 4 }}
            >
              ✕
            </button>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        ` }} />

        {!showMoreOptions && mode === "login" && savedUsers.length > 0 ? (
          /* ────────────────────────────────────────────────────────
             PRE-FILLED MULTI-PROFILE VIEW (Welcome back chooser)
             ──────────────────────────────────────────────────────── */
          <div>
            <h2 
              style={{ 
                fontFamily: "var(--display)", 
                fontSize: 32, 
                fontWeight: 700, 
                color: "var(--black)", 
                marginBottom: 28,
                letterSpacing: "-0.02em"
              }}
            >
              Welcome back.
            </h2>

            {/* Profile Chooser row */}
            <div 
              className="feed-nav-scroll"
              style={{ 
                display: "flex", 
                flexWrap: "nowrap",
                justifyContent: savedUsers.length > 2 ? "flex-start" : "center", 
                gap: "24px",
                marginBottom: 32,
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                padding: "8px 4px"
              }}
            >
              {savedUsers.map((su) => (
                <div 
                  key={su.email}
                  style={{
                    position: "relative",
                    width: 110,
                    minWidth: 110,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                  onClick={() => {
                    if (su.provider === "email") {
                      setEmail(su.email);
                      setShowEmailForm(true);
                      setShowMoreOptions(true);
                      setTimeout(() => {
                        const pwInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                        if (pwInput) pwInput.focus();
                      }, 100);
                    } else {
                      handleOAuth(su.provider as any);
                    }
                  }}
                >
                  {/* Remove profile button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUserFromSavedList(su.email);
                      const updated = getSavedUsers();
                      setSavedUsers(updated);
                      if (updated.length === 0) {
                        setShowMoreOptions(true);
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: 10,
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "none",
                      color: "white",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: "bold",
                      zIndex: 10,
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.9)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)"; }}
                    title="Forget this account"
                  >
                    ✕
                  </button>

                  {/* Avatar wrapper */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: su.avatar_url ? "none" : "var(--bg-3)",
                      boxShadow: "var(--shadow-md)",
                      border: "2px solid var(--border)",
                      transition: "all 0.2s",
                      marginBottom: 10
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.06)";
                      e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                      e.currentTarget.style.borderColor = "var(--brand)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    {su.avatar_url ? (
                      <Image 
                        src={su.avatar_url} 
                        alt={su.full_name} 
                        fill 
                        style={{ objectFit: "cover", borderRadius: "50%" }} 
                        priority
                      />
                    ) : (
                      <span style={{ fontSize: 24, fontWeight: 700, color: "var(--ink-2)" }}>
                        {getInitials(su.full_name || su.email)}
                      </span>
                    )}

                    {/* Provider Badge icon */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "white",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--border)",
                        padding: 3
                      }}
                    >
                      {su.provider === "google" && <GoogleIcon />}
                      {su.provider === "facebook" && <FacebookIcon />}
                      {su.provider === "github" && <GithubIcon />}
                      {su.provider === "email" && <EmailIcon />}
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div 
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      width: "100%",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {su.full_name}
                  </div>
                  <div 
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 11,
                      color: "var(--muted)",
                      width: "100%",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {su.email}
                  </div>
                </div>
              ))}
            </div>

            {/* Use another account option */}
            <div 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 12, 
                marginBottom: 20,
                fontSize: 14,
                fontFamily: "var(--sans)"
              }}
            >
              <button 
                onClick={() => setShowMoreOptions(true)} 
                style={{ 
                  color: "#1a8917", 
                  fontWeight: 700, 
                  textDecoration: "underline", 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer" 
                }}
              >
                Use another account
              </button>
            </div>
          </div>
        ) : (
          /* ────────────────────────────────────────────────────────
             FULL LOG IN & SIGN UP OPTIONS VIEW
             ──────────────────────────────────────────────────────── */
          <div style={{ textAlign: "center" }}>
            {!showEmailForm ? (
              /* Simple Options List */
              <div>
                <h2 
                  style={{ 
                    fontFamily: "var(--display)", 
                    fontSize: 32, 
                    fontWeight: 700, 
                    color: "var(--black)", 
                    marginBottom: 28,
                    textAlign: "center",
                    letterSpacing: "-0.02em"
                  }}
                >
                  {mode === "login" ? "Welcome back." : "Join EchoGist."}
                </h2>

                {/* Google Sign In Button */}
                <button 
                  onClick={() => handleOAuth("google")} 
                  className="oauth-btn-modal"
                  disabled={!!oauthLoading}
                >
                  <div style={{ position: "absolute", left: 24, display: "flex", alignItems: "center" }}>
                    {oauthLoading === "google" ? (
                      <div className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--ink)" }} />
                    ) : (
                      <GoogleIcon />
                    )}
                  </div>
                  {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
                </button>

                {/* GitHub Sign In Button */}
                <button 
                  onClick={() => handleOAuth("github")} 
                  className="oauth-btn-modal"
                  disabled={!!oauthLoading}
                >
                  <div style={{ position: "absolute", left: 24, display: "flex", alignItems: "center" }}>
                    {oauthLoading === "github" ? (
                      <div className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--ink)" }} />
                    ) : (
                      <GithubIcon />
                    )}
                  </div>
                  {mode === "login" ? "Sign in with GitHub" : "Sign up with GitHub"}
                </button>

                {/* Email Sign In Button */}
                <button 
                  onClick={() => { setError(""); setSuccess(""); setShowEmailForm(true); }} 
                  className="oauth-btn-modal"
                >
                  <div style={{ position: "absolute", left: 24, display: "flex", alignItems: "center" }}>
                    <EmailIcon />
                  </div>
                  {mode === "login" ? "Sign in with email" : "Sign up with email"}
                </button>

                {/* Remember Me Checkbox */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "24px 0 28px" }}>
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    style={{ 
                      cursor: "pointer", 
                      width: 16, 
                      height: 16,
                      accentColor: "#191919"
                    }}
                  />
                  <label 
                    htmlFor="rememberMe" 
                    style={{ 
                      fontFamily: "var(--sans)", 
                      fontSize: 14, 
                      color: "var(--ink)", 
                      cursor: "pointer", 
                      userSelect: "none" 
                    }}
                  >
                    Remember me for faster sign in
                  </label>
                </div>

                {/* Mode Toggles */}
                {mode === "login" ? (
                  <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)", margin: "16px 0 24px" }}>
                    No account?{" "}
                    <button 
                      onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                      style={{ color: "#1a8917", fontWeight: 700, cursor: "pointer", border: "none", background: "none", textDecoration: "underline" }}
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink)", margin: "16px 0 24px" }}>
                    Already have an account?{" "}
                    <button 
                      onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                      style={{ color: "#1a8917", fontWeight: 700, cursor: "pointer", border: "none", background: "none", textDecoration: "underline" }}
                    >
                      Sign in
                    </button>
                  </p>
                )}

                {/* Back to Quick Sign-In */}
                {savedUsers.length > 0 && mode === "login" && (
                  <button 
                    onClick={() => setShowMoreOptions(false)} 
                    style={{
                      display: "block",
                      margin: "24px auto 0",
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
                )}
              </div>
            ) : (
              /* Email/Password Form and Verification Flow Container */
              <div style={{ textAlign: "left" }}>
                {verificationStep === "check_email" && (
                  /* ─── CHECK EMAIL STEP ─── */
                  <div style={{ textAlign: "center", padding: "16px 8px" }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      backgroundColor: "#f3eeff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      color: "#7c3aed"
                    }}>
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <h2 style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: "var(--black)", marginBottom: 10, letterSpacing: "-0.015em" }}>
                      Check your email
                    </h2>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", marginBottom: 28, lineHeight: 1.6 }}>
                      We sent a login link to <strong>{email}</strong>.<br />
                      Click the link in your inbox to sign in automatically.
                    </p>
                    <button 
                      type="button"
                      onClick={() => { setVerificationStep("none"); setError(""); setSuccess(""); }} 
                      style={{
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--brand)",
                        border: "1px solid var(--border)",
                        padding: "8px 20px",
                        borderRadius: 999,
                        background: "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--ink)";
                        e.currentTarget.style.color = "var(--ink)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--brand)";
                      }}
                    >
                      ← Back to form
                    </button>
                  </div>
                )}

                {verificationStep === "verify_code" && (
                  /* ─── VERIFY CODE STEP ─── */
                  <div>
                    <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)", marginBottom: 6, textAlign: "center", letterSpacing: "-0.015em" }}>
                      Verify your identity
                    </h2>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", marginBottom: 24, textAlign: "center" }}>
                      Please enter the 6-digit code sent to **{email}**.
                    </p>

                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

                    <form onSubmit={handleVerifyCodeSubmit}>
                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label">Verification Code</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          className="form-input" 
                          placeholder="123456" 
                          value={userInputCode} 
                          onChange={(e) => setUserInputCode(e.target.value.replace(/\D/g, ""))}
                          style={{ letterSpacing: "8px", textAlign: "center", fontSize: 20, fontWeight: 700 }}
                          required 
                        />
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
                        }}
                      >
                        {loading ? <div className="spinner" /> : "Verify & Continue"}
                      </button>
                    </form>

                    <button 
                      type="button"
                      onClick={() => { setVerificationStep("none"); setUserInputCode(""); setError(""); setSuccess(""); }} 
                      style={{
                        display: "block",
                        margin: "24px auto 0",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        color: "var(--muted)",
                        textDecoration: "underline",
                        border: "none",
                        background: "none",
                        cursor: "pointer"
                      }}
                    >
                      ← Back to form
                    </button>
                  </div>
                )}

                {verificationStep === "forgot_password" && (
                  /* ─── FORGOT PASSWORD STEP ─── */
                  <div>
                    <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)", marginBottom: 6, textAlign: "center", letterSpacing: "-0.015em" }}>
                      Reset your password
                    </h2>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", marginBottom: 24, textAlign: "center" }}>
                      Enter the email address associated with your account.
                    </p>

                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

                    <form onSubmit={handleForgotPasswordSubmit}>
                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label">Email address</label>
                        <input 
                          type="email" 
                          className="form-input" 
                          placeholder="you@example.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                        />
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
                        }}
                      >
                        {loading ? <div className="spinner" /> : "Send Reset Code"}
                      </button>
                    </form>

                    <button 
                      type="button"
                      onClick={() => { setVerificationStep("none"); setError(""); setSuccess(""); }} 
                      style={{
                        display: "block",
                        margin: "24px auto 0",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        color: "var(--muted)",
                        textDecoration: "underline",
                        border: "none",
                        background: "none",
                        cursor: "pointer"
                      }}
                    >
                      ← Back to sign in
                    </button>
                  </div>
                )}

                {verificationStep === "reset_password" && (
                  /* ─── RESET PASSWORD STEP ─── */
                  <div>
                    <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)", marginBottom: 6, textAlign: "center", letterSpacing: "-0.015em" }}>
                      Choose new password
                    </h2>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", marginBottom: 24, textAlign: "center" }}>
                      Please enter the code sent to your email and your new password.
                    </p>

                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

                    <form onSubmit={handleResetPasswordSubmit}>
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">Verification Code</label>
                        <input 
                          type="text" 
                          maxLength={6}
                          className="form-input" 
                          placeholder="123456" 
                          value={userInputCode} 
                          onChange={(e) => setUserInputCode(e.target.value.replace(/\D/g, ""))}
                          style={{ letterSpacing: "8px", textAlign: "center", fontSize: 16, fontWeight: 700 }}
                          required 
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label">New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="At least 6 characters" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          required 
                        />
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
                        }}
                      >
                        {loading ? <div className="spinner" /> : "Reset & Log in"}
                      </button>
                    </form>

                    <button 
                      type="button"
                      onClick={() => { setVerificationStep("forgot_password"); setUserInputCode(""); setNewPassword(""); setError(""); setSuccess(""); }} 
                      style={{
                        display: "block",
                        margin: "24px auto 0",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        color: "var(--muted)",
                        textDecoration: "underline",
                        border: "none",
                        background: "none",
                        cursor: "pointer"
                      }}
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {verificationStep === "none" && (
                  /* ─── STANDARD EMAIL FORM ─── */
                  <div>
                    <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)", marginBottom: 6, textAlign: "center", letterSpacing: "-0.015em" }}>
                      {mode === "login" ? "Welcome back." : "Join EchoGist."}
                    </h2>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", marginBottom: 24, textAlign: "center" }}>
                      {mode === "login" ? "Sign in with email." : "Create an account with email."}
                    </p>

                    {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                    {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

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
                      <div className="form-group" style={{ marginBottom: 16 }}>
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

                    {mode === "login" && (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--sans)" }}>or</span>
                          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleOAuth("google")} 
                          className="oauth-btn-modal"
                          disabled={!!oauthLoading}
                          style={{ marginBottom: 0 }}
                        >
                          <div style={{ position: "absolute", left: 24, display: "flex", alignItems: "center" }}>
                            {oauthLoading === "google" ? (
                              <div className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--ink)" }} />
                            ) : (
                              <GoogleIcon />
                            )}
                          </div>
                          Sign in with Google
                        </button>
                      </div>
                    )}

                    {/* Back to all options */}
                    <button 
                      type="button"
                      onClick={() => setShowEmailForm(false)} 
                      style={{
                        display: "block",
                        margin: "24px auto 0",
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
                      ← Back to all options
                    </button>
                  </div>
                )}
              </div>
            )}
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
          By clicking &ldquo;{mode === "login" ? "Sign in" : "Sign up"}&rdquo;, you accept EchoGist&rsquo;s{" "}
          <Link href="/terms" style={{ color: "var(--ink)", textDecoration: "underline" }} onClick={onClose}>Terms of Service</Link> and{" "}
          <Link href="/privacy" style={{ color: "var(--ink)", textDecoration: "underline" }} onClick={onClose}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

