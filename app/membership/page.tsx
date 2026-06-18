"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CheckoutModalProps {
  isOpen: boolean;
  planName: string;
  price: string;
  onClose: () => void;
}

function CheckoutModal({ isOpen, planName, price, onClose }: CheckoutModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div 
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
        padding: 24
      }}
    >
      <div 
        style={{
          background: "white",
          borderRadius: 20,
          padding: 36,
          maxWidth: 420,
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          position: "relative",
          animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          border: "1px solid var(--border)",
          color: "var(--ink-2)"
        }}
      >
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
            borderRadius: "50%"
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!success ? (
          <form onSubmit={handlePay}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, marginBottom: 4, color: "var(--black)" }}>
              Complete subscription
            </h3>
            <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
              You are subscribing to <strong style={{ color: "var(--brand)" }}>{planName}</strong> for <strong>{price}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600 }}>Name on card</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Jane Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600 }}>Card number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="4111 2222 3333 4444" 
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\s+/g, "").replace(/[^0-8\d]/g, "");
                    const matches = v.match(/\d{4,16}/g);
                    const match = (matches && matches[0]) || "";
                    const parts = [];
                    for (let i = 0, len = match.length; i < len; i += 4) {
                      parts.push(match.substring(i, i + 4));
                    }
                    if (parts.length > 0) {
                      setCardNumber(parts.join(" "));
                    } else {
                      setCardNumber(v);
                    }
                  }}
                  maxLength={19}
                  required 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600 }}>Expiry date</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="MM/YY" 
                    value={expiry}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s+/g, "").replace(/[^0-9\d]/g, "");
                      if (v.length >= 2) {
                        setExpiry(v.substring(0, 2) + "/" + v.substring(2, 4));
                      } else {
                        setExpiry(v);
                      }
                    }}
                    maxLength={5}
                    required 
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600 }}>CVC</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="123" 
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/[^0-9\d]/g, ""))}
                    maxLength={4}
                    required 
                  />
                </div>
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
                marginTop: 24,
                backgroundColor: "var(--brand)",
                color: "white"
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                `Pay ${price}`
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
              Subscription Active!
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Thank you for supporting human stories on UGET. Your membership account is now fully activated.
            </p>
            <button 
              onClick={onClose} 
              className="btn btn-primary"
              style={{ padding: "10px 32px" }}
            >
              Start reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: string } | null>(null);

  const plans = [
    {
      name: "UGET Member",
      price: "$5/month",
      desc: "Support human writing and unlock exclusive reader features.",
      features: [
        "Read member-only stories",
        "Support writers directly with your subscription",
        "Bookmark and organize stories into custom lists",
        "Listen to audio narrations (Text to Speech)"
      ],
      actionLabel: "Get started"
    },
    {
      name: "Friend of UGET",
      price: "$15/month",
      desc: "For super supporters who want to give more back to the community.",
      features: [
        "All benefits of the UGET Member plan",
        "Give 3x more support directly to writers",
        "Exclusive 'Friend of UGET' badge on your profile",
        "A free digital member sticker pack"
      ],
      actionLabel: "Get started"
    }
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Header Banner */}
      <div 
        style={{ 
          background: "#ffd1dc", 
          borderBottom: "1px solid var(--border)", 
          padding: "80px 24px" 
        }}
      >
        <div 
          style={{ 
            maxWidth: 1040, 
            margin: "0 auto", 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: 48,
            alignItems: "center"
          }}
          className="hide-sm-stack"
        >
          <div>
            <h1 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: "clamp(32px, 6vw, 64px)", 
                fontWeight: 400, 
                lineHeight: 1.1, 
                color: "#1a1a1a", 
                letterSpacing: "-0.03em",
                marginBottom: 20
              }}
            >
              Support human stories.
            </h1>
            <p 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: 18, 
                lineHeight: 1.5, 
                color: "#292929", 
                marginBottom: 28,
                maxWidth: 440
              }}
            >
              UGET is a place where independent voices thrive. By becoming a member, you support the writers you love and enable human perspectives to flourish.
            </p>
            <button 
              onClick={() => setCheckoutPlan({ name: "UGET Member", price: "$5/mo" })}
              className="btn btn-primary btn-lg"
              style={{ backgroundColor: "#1a1a1a", color: "white" }}
            >
              Become a member
            </button>
          </div>
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "center",
              position: "relative" 
            }}
            className="hide-md"
          >
            {/* Visual graphics */}
            <div 
              style={{ 
                width: 320, 
                height: 240, 
                border: "2px solid #1a1a1a", 
                borderRadius: 16,
                background: "white",
                padding: 24,
                boxShadow: "8px 8px 0px #1a1a1a"
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#7c3aed", marginBottom: 16 }} />
              <div style={{ width: "80%", height: 16, background: "#1a1a1a", marginBottom: 8 }} />
              <div style={{ width: "50%", height: 16, background: "#1a1a1a", marginBottom: 20 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 60, height: 24, borderRadius: 12, background: "#f3f3f3" }} />
                <div style={{ width: 60, height: 24, borderRadius: 12, background: "#f3f3f3" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <main style={{ flex: 1, maxWidth: 1040, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, marginBottom: 12, color: "var(--black)" }}>
            Choose your membership package
          </h2>
          <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)" }}>
            Directly support the writers who make UGET a home for great ideas.
          </p>
        </div>

        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
            gap: 32,
            maxWidth: 800,
            margin: "0 auto"
          }}
        >
          {plans.map((plan) => (
            <div 
              key={plan.name}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 32,
                background: "var(--bg-2)",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <h3 style={{ fontFamily: "var(--sans)", fontSize: 20, fontWeight: 700, color: "var(--black)" }}>
                {plan.name}
              </h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "16px 0 8px" }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: "var(--black)", fontFamily: "var(--display)" }}>
                  {plan.price.split("/")[0]}
                </span>
                <span style={{ fontSize: 14, color: "var(--muted)" }}>
                  /{plan.price.split("/")[1]}
                </span>
              </div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.5 }}>
                {plan.desc}
              </p>
              
              <div style={{ borderBottom: "1px solid var(--border)", marginBottom: 24 }} />

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {plan.features.map((feat) => (
                  <li key={feat} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--ink-2)", fontFamily: "var(--serif)", lineHeight: 1.4 }}>
                    <span style={{ color: "var(--brand)" }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => setCheckoutPlan({ name: plan.name, price: plan.price })}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px", borderRadius: 999 }}
              >
                {plan.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </main>

      <CheckoutModal 
        isOpen={checkoutPlan !== null}
        planName={checkoutPlan?.name || ""}
        price={checkoutPlan?.price || ""}
        onClose={() => setCheckoutPlan(null)}
      />

      <Footer />

      <style jsx global>{`
        @media (max-width: 640px) {
          .hide-sm-stack {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 24px !important;
          }
          .hide-sm-stack button {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
