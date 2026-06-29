"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";

/* ─── 3D Logo ─────────────────────────────────────────── */
function Logo3D() {
  const logoRef = useRef<HTMLDivElement>(null);
  const autoRot = useRef(0);
  const dragRot = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, rx: 0, ry: 0 });
  const isDragging = useRef(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    let last = 0;
    const tick = (t: number) => {
      const dt = t - last; last = t;
      if (!isDragging.current) autoRot.current += dt * 0.045;
      if (logoRef.current) {
        logoRef.current.style.transform =
          `rotateX(${dragRot.current.x}deg) rotateY(${autoRot.current + dragRot.current.y}deg)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const onDown = useCallback((cx: number, cy: number) => {
    isDragging.current = true;
    dragStart.current = { x: cx, y: cy, rx: dragRot.current.x, ry: dragRot.current.y };
  }, []);
  const onMove = useCallback((cx: number, cy: number) => {
    if (!isDragging.current) return;
    dragRot.current.y = dragStart.current.ry + (cx - dragStart.current.x) * 0.55;
    dragRot.current.x = dragStart.current.rx + (cy - dragStart.current.y) * 0.55;
  }, []);
  const onUp = useCallback(() => {
    if (!isDragging.current) return;
    autoRot.current += dragRot.current.y;
    dragRot.current = { x: 0, y: 0 };
    isDragging.current = false;
  }, []);

  return (
    <div
      style={{ perspective: 700, cursor: "grab", userSelect: "none" }}
      onMouseDown={(e) => onDown(e.clientX, e.clientY)}
      onMouseMove={(e) => onMove(e.clientX, e.clientY)}
      onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={(e) => onDown(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={onUp}
    >
      <div ref={logoRef} style={{ width: 140, height: 140, transformStyle: "preserve-3d" }}>
        <Image
          src="/logo-icon-transparent.png" alt="UGET"
          width={140} height={140}
          style={{
            objectFit: "contain", display: "block",
            filter: "drop-shadow(0 15px 45px rgba(124,58,237,0.3)) drop-shadow(0 0 80px rgba(124,58,237,0.15))",
            pointerEvents: "none",
          }}
          priority
        />
      </div>
    </div>
  );
}

/* ─── OAuth Icons ─────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

/* ─── Auth Form ───────────────────────────────────────── */
function AuthForm() {
  const searchParams = useSearchParams();
  const initMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initMode);
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
    const err = searchParams.get("error");
    if (err) {
      if (err === "oauth_disabled_use_credentials") {
        setError("OAuth credentials are not configured yet. Please configure the environment variables or sign in with credentials.");
      } else {
        setError(err);
      }
    }
  }, [searchParams]);

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    setError("");
    localStorage.setItem("uget_remember_me", "true");
    localStorage.setItem("uget_pending_provider", provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }) as any;
    if (error) { 
      setError(error.message); 
      setOauthLoading(null);
      localStorage.removeItem("uget_pending_provider");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name"); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        router.push("/onboarding");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/"); router.refresh();
      }
    } catch (e: unknown) {
      setError((e as Error).message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-form-wrap">
      {/* Mobile logo */}
      <div className="auth-logo-mobile">
        <Image src="/logo-icon-transparent.png" alt="UGET" width={48} height={48} className="object-contain" />
      </div>

      <h1 className="auth-title">{mode === "login" ? "Welcome back." : "Join UGET."}</h1>
      <p className="auth-subtitle">{mode === "login" ? "Sign in to continue reading." : "Create an account to start writing."}</p>

      {/* Mode toggle */}
      <div className="auth-tabs">
        <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>Sign in</button>
        <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>Sign up</button>
      </div>

      {/* OAuth */}
      <button onClick={() => handleOAuth("google")} className="oauth-btn" disabled={!!oauthLoading}>
        {oauthLoading === "google" ? <div className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(0,0,0,0.15)", borderTopColor: "var(--ink)" }} /> : <GoogleIcon />}
        Continue with Google
      </button>
      <button onClick={() => handleOAuth("github")} className="oauth-btn oauth-github" disabled={!!oauthLoading}>
        {oauthLoading === "github" ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <GithubIcon />}
        Continue with GitHub
      </button>

      {/* Divider */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or</span>
        <div className="auth-divider-line" />
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input type="text" className="form-input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} className="form-input" placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} required />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted-2)", padding: 4 }}>
              {showPw ? (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? <div className="spinner" /> : (mode === "login" ? "Sign in" : "Create account")}
        </button>
      </form>

      <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", marginTop: 20, textAlign: "center", lineHeight: 1.6 }}>
        By continuing, you agree to our{" "}
        <Link href="#" style={{ color: "var(--ink)", textDecoration: "underline" }}>Terms</Link> and{" "}
        <Link href="#" style={{ color: "var(--ink)", textDecoration: "underline" }}>Privacy Policy</Link>.
      </p>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/" style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
          ← Back to UGET
        </Link>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="auth-page">
      {/* Left — 3D logo panel */}
      <div className="auth-left">
        <div className="auth-left-bg" />
        <div className="auth-left-dots" />
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 28 }}>
            Drag to spin
          </p>
          <Logo3D />
          <h2 className="auth-tagline">
            Ideas worth<br /><span>sharing.</span>
          </h2>
          <p className="auth-tagline-sub">
            UGET is where writers and thinkers share their best work.
          </p>
          <div className="auth-stats">
            {[{ v: "12K+", l: "Readers" }, { v: "1K+", l: "Stories" }, { v: "50+", l: "Topics" }].map((s) => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div className="auth-stat-value">{s.v}</div>
                <div className="auth-stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="auth-right">
        <Suspense fallback={<div />}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
