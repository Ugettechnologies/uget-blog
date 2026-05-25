"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 3D logo rotation state
  const rotX = useRef(0);
  const rotY = useRef(0);
  const autoRotY = useRef(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const logoRef = useRef<HTMLDivElement>(null);
  const rotXState = useRef(0);
  const rotYState = useRef(0);

  const router = useRouter();

  // Animate 3D logo
  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      if (!isDragging.current) {
        autoRotY.current += dt * 0.04; // clockwise vertical rotation
      }
      if (logoRef.current) {
        const totalRotY = rotY.current + autoRotY.current;
        const totalRotX = rotX.current;
        logoRef.current.style.transform = `rotateX(${totalRotX}deg) rotateY(${totalRotY}deg)`;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    rotXState.current = rotX.current;
    rotYState.current = rotY.current;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    rotY.current = rotYState.current + dx * 0.5;
    rotX.current = rotXState.current + dy * 0.5;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    // Sync autoRot so it continues from current position
    if (logoRef.current) {
      autoRotY.current += rotY.current;
      rotY.current = 0;
      rotYState.current = 0;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    rotXState.current = rotX.current;
    rotYState.current = rotY.current;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - lastMouse.current.x;
    const dy = e.touches[0].clientY - lastMouse.current.y;
    rotY.current = rotYState.current + dx * 0.5;
    rotX.current = rotXState.current + dy * 0.5;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page min-h-screen flex overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left panel - 3D Logo showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden auth-left-panel">
        {/* Background effects */}
        <div className="absolute inset-0 auth-bg-mesh" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#2563EB]/20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-[#60A5FA]/15 blur-3xl" />
        <div className="absolute inset-0 auth-grid-bg opacity-20" />

        {/* Grid dots */}
        <div className="absolute inset-0 auth-dots-pattern" />

        {/* 3D Logo Scene */}
        <div className="relative z-10 flex flex-col items-center select-none">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-8 font-medium">
            Drag to rotate
          </p>

          {/* 3D perspective wrapper */}
          <div
            className="auth-logo-scene cursor-grab active:cursor-grabbing"
            style={{ perspective: "800px" }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <div
              ref={logoRef}
              className="auth-logo-3d"
              style={{ transformStyle: "preserve-3d", transition: isDragging.current ? "none" : undefined }}
            >
              {/* Front face */}
              <div className="auth-face auth-face-front">
                <div className="auth-logo-glow" />
                <Image
                  src="/logo-icon-3d.png"
                  alt="UGET"
                  width={160}
                  height={160}
                  className="object-contain relative z-10"
                  priority
                />
              </div>
              {/* Back face */}
              <div className="auth-face auth-face-back">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-4xl font-black text-white/90 tracking-tight">UGET</div>
                </div>
              </div>
              {/* Side faces for 3D depth */}
              <div className="auth-face auth-face-left" />
              <div className="auth-face auth-face-right" />
              <div className="auth-face auth-face-top" />
              <div className="auth-face auth-face-bottom" />
            </div>
          </div>

          {/* Brand text */}
          <div className="mt-10 text-center">
            <Image
              src="/logo-text.png"
              alt="UGET Technologies"
              width={180}
              height={48}
              className="object-contain mx-auto mb-4"
            />
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              Expert tech education crafted for the next generation of African talent.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-8">
            {[
              { value: "12K+", label: "Readers" },
              { value: "50+", label: "Articles" },
              { value: "8", label: "Categories" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-white/35 text-[11px] tracking-widest uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === 2 ? "w-8 bg-[#2563EB]" : "w-2 bg-white/20"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-[#080E1A]" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#2563EB]/5 blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/logo-text.png" alt="UGET" width={130} height={36} className="object-contain" />
          </div>

          {/* Form header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
              <span className="text-[#60A5FA] text-[11px] font-semibold tracking-widest uppercase">
                {mode === "login" ? "Welcome Back" : "Join UGET"}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "Sign in to your account" : "Create your account"}
            </h1>
            <p className="text-white/45 text-sm">
              {mode === "login"
                ? "Enter your credentials to access the platform"
                : "Start your tech learning journey today"}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  mode === m
                    ? "bg-gradient-to-r from-[#2563EB] to-[#60A5FA] text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="auth-field-group">
                <label className="auth-label">Full Name</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                  className="auth-input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="auth-field-group">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="auth-submit-btn w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="auth-spinner" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            {mode === "login" && (
              <div className="text-center">
                <p className="text-white/30 text-xs mt-2">
                  Default admin: <span className="text-[#60A5FA]/70 font-mono">admin@uget.com</span> / <span className="text-[#60A5FA]/70 font-mono">admin123</span>
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between text-xs text-white/30">
            <Link href="/" className="hover:text-white/60 transition-colors flex items-center gap-1">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Blog
            </Link>
            <span>© 2025 UGET Technologies</span>
          </div>
        </div>
      </div>
    </div>
  );
}
