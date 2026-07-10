"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setStep("code");
      if (data.devCode) {
        setDevCode(data.devCode);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Successful login, redirect to admin panel
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      {/* Dev helper banner */}
      {devCode && (
        <div className="dev-banner">
          <span className="dev-banner-badge">DEV TOOL</span>
          <span className="dev-banner-text">
            Verification code sent to <strong>ugettechnologies@gmail.com</strong>: <code>{devCode}</code>
          </span>
        </div>
      )}

      <div className="admin-login-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Image src="/favicon.png" alt="EchoGist" width={40} height={40} />
            <span style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)" }}>EchoGist</span>
          </Link>
        </div>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>
            Admin Portal Sign-In
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>
            {step === "email"
              ? "Enter your email address to access the restricted administrative panel."
              : `A 6-digit verification code has been dispatched to the company account.`}
          </p>
        </div>

        {error && (
          <div className="login-error-box">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label htmlFor="email-input" className="form-label">Company Email</label>
              <input
                id="email-input"
                type="email"
                required
                placeholder="e.g. ugettechnologies@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", width: "100%", height: 44 }} disabled={loading}>
              {loading ? <div className="spinner" /> : "Request Sign-In Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label htmlFor="code-input" className="form-label">Verification Code</label>
              <input
                id="code-input"
                type="text"
                required
                maxLength={6}
                placeholder="Enter 6-digit OTP code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="form-input"
                style={{ textAlign: "center", letterSpacing: "0.2em", fontSize: 20, fontWeight: 700 }}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", width: "100%", height: 44 }} disabled={loading}>
              {loading ? <div className="spinner" /> : "Verify and Login"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setDevCode(null); }}
              className="btn btn-outline"
              style={{ justifyContent: "center", width: "100%", border: "none", color: "var(--muted)" }}
              disabled={loading}
            >
              Back to email
            </button>
          </form>
        )}
      </div>

      <style>{`
        .admin-login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg) 0%, var(--bg-2) 100%);
          padding: 24px;
          position: relative;
        }
        .dev-banner {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 8px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: var(--shadow-sm);
          z-index: 100;
          max-width: 90%;
        }
        .dev-banner-badge {
          background: #d97706;
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--sans);
        }
        .dev-banner-text {
          font-family: var(--sans);
          font-size: 13px;
          color: #92400e;
        }
        .dev-banner-text code {
          background: #fef08a;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
          border: 1px solid #fde047;
        }
        .admin-login-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 40px 32px;
          box-shadow: var(--shadow-lg);
        }
        .form-label {
          display: block;
          font-family: var(--sans);
          font-size: 13px;
          fontWeight: 600;
          color: var(--ink-2);
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          height: 44px;
          border-radius: 8px;
          border: 1px solid var(--border);
          padding: 0 16px;
          font-family: var(--sans);
          font-size: 14px;
          color: var(--ink);
          outline: none;
          background: var(--bg);
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: var(--ink-3);
        }
        .login-error-box {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: var(--sans);
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}
