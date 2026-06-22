"use client";
import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface CheckoutModalProps {
  isOpen: boolean;
  planName: string;
  price: string;
  onClose: () => void;
}

function CheckoutModal({ isOpen, planName, price, onClose }: CheckoutModalProps) {
  const [name, setName] = useState("");
  
  // Bank transfer receipt upload states
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileName(selectedFile.name);
    setUploadingProof(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.path) {
        setPaymentProofUrl(data.path);
      } else {
        setUploadError(data.error || "File upload failed.");
      }
    } catch (err: any) {
      setUploadError("Upload failed: " + err.message);
    } finally {
      setUploadingProof(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProofUrl) {
      setErrorMessage("Please upload bank transfer receipt proof.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/membership/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          price,
          paymentMethod: "bank_transfer",
          paymentProofUrl,
          name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorMessage(data.error || "Failed to process subscription.");
      }
    } catch (err: any) {
      setErrorMessage("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
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
      onClick={onClose}
    >
      <div 
        style={{
          background: "var(--bg-2)",
          borderRadius: 20,
          padding: 36,
          maxWidth: 460,
          width: "100%",
          boxShadow: "var(--shadow-xl)",
          position: "relative",
          animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          border: "1px solid var(--border)",
          color: "var(--ink-2)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={(e) => e.stopPropagation()}
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
            borderRadius: "50%",
            zIndex: 10
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
            <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              You are subscribing to <strong style={{ color: "var(--brand)" }}>{planName}</strong> for <strong>{price}</strong>
            </p>

            {errorMessage && (
              <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#ef4444", fontSize: 13, marginBottom: 16, fontFamily: "var(--sans)" }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ backgroundColor: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--brand)", display: "block", marginBottom: 8, fontFamily: "var(--sans)" }}>
                  Manual Bank Details
                </span>
                <div style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--black)", lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 4 }}>Bank: <strong>Moniepoint</strong></div>
                  <div style={{ marginBottom: 4 }}>Account Number: <strong style={{ letterSpacing: 0.5 }}>674 362 0799</strong></div>
                  <div>Account Name: <strong>uget technologies</strong></div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600 }}>Sender Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Jane Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px", border: "1px solid var(--border)", borderRadius: "12px", fontSize: 15, background: "none"
                  }}
                  required 
                />
              </div>

              {/* Upload Receipt Proof Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600 }}>Upload Payment Proof (Receipt Screenshot/Video)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{
                    padding: "10px 16px",
                    border: "1px dashed var(--brand)",
                    borderRadius: 12,
                    backgroundColor: "var(--bg-2)",
                    color: "var(--brand)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-block",
                    fontFamily: "var(--sans)"
                  }}>
                    📁 {uploadingProof ? "Uploading to Cloudinary..." : "Choose File"}
                    <input type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: "none" }} disabled={uploadingProof} />
                  </label>
                  {fileName && <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--sans)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 180 }}>{fileName}</span>}
                </div>
                {uploadError && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--sans)" }}>{uploadError}</span>}
                {paymentProofUrl && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#10b981", fontWeight: 600, fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4 }}>
                    ✓ Proof uploaded successfully to Cloudinary!
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="auth-submit" 
              disabled={loading || uploadingProof}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                marginTop: 24,
                backgroundColor: (loading || uploadingProof) ? "var(--muted)" : "var(--brand)",
                color: "white",
                border: "none",
                transition: "background-color 0.2s"
              }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 16, height: 16, margin: "0 auto" }} />
              ) : (
                "Submit Transfer Proof"
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
              Transfer Verification Pending!
            </h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
              Thank you! We've received your Moniepoint transaction proof. Our administrators will verify the transfer, and you'll receive a confirmation email at ugettechnologies@gmail.com once activated.
            </p>
            <button 
              onClick={onClose} 
              className="btn btn-primary"
              style={{ padding: "10px 32px", borderRadius: 999 }}
            >
              Close Panel
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
      yearlyPrice: "$50/year",
      features: [
        "Read member-only stories",
        "Support writers you read most",
        "Listen to audio narrations",
        "Read offline with the UGET app",
        "Access our Mastodon community",
        "Connect your custom domain",
        "Create your own publications"
      ]
    },
    {
      name: "Friend of UGET",
      price: "$15/month",
      yearlyPrice: "$150/year",
      isPremium: true,
      features: [
        "Give 4x more to the writers you read",
        "Share member-only stories with anyone and drive more earnings for writers",
        "Customize app icon"
      ]
    }
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Header Banner (Screenshot 4) */}
      <div 
        style={{ 
          background: "var(--brand-light)", 
          borderBottom: "1px solid var(--border)", 
          padding: "80px 24px" 
        }}
      >
        <div 
          style={{ 
            maxWidth: 1040, 
            margin: "0 auto", 
            display: "grid", 
            gridTemplateColumns: "1fr 420px", 
            gap: 60,
            alignItems: "center"
          }}
          className="hide-sm-stack"
        >
          <div>
            <h1 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: "clamp(36px, 6vw, 68px)", 
                fontWeight: 400, 
                lineHeight: 1.05, 
                color: "var(--ink)", 
                letterSpacing: "-0.04em",
                marginBottom: 24
              }}
            >
              Support human stories.
            </h1>
            <p 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: 19, 
                lineHeight: 1.5, 
                color: "var(--ink-2)", 
                marginBottom: 36,
                maxWidth: 480
              }}
            >
              Become a member to read without limits or ads, fund great writers, and join a global community of people who care about high-quality storytelling.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <button 
                onClick={() => setCheckoutPlan({ name: "UGET Member", price: "$5/mo" })}
                className="btn btn-primary btn-lg"
                style={{ backgroundColor: "var(--brand)", color: "white", padding: "12px 28px", fontSize: 15, borderRadius: "999px" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand)")}
              >
                Get started
              </button>
              <a 
                href="#plans"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn btn-outline btn-lg"
                style={{ borderColor: "var(--brand)", color: "var(--brand)", padding: "12px 28px", fontSize: 15, borderRadius: "999px", textDecoration: "none" }}
              >
                View plans
              </a>
            </div>
          </div>

          {/* Featured Editorial Card (Screenshot 4 right side) */}
          <div className="hide-md" style={{ display: "flex", justifyContent: "center" }}>
            <div 
              style={{ 
                width: "100%",
                maxWidth: 380,
                border: "1px solid var(--border)", 
                borderRadius: 16,
                background: "var(--bg-2)",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
              }}
            >
              <div style={{ position: "relative", width: "100%", height: 200 }}>
                <Image 
                  src="/sleeping_couple.png" 
                  alt="How to sleep" 
                  fill 
                  style={{ objectFit: "cover" }} 
                />
              </div>
              <div style={{ padding: 24 }}>
                <span 
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: 4, 
                    backgroundColor: "var(--brand-light)", 
                    color: "var(--brand)", 
                    fontSize: 11, 
                    fontWeight: 700, 
                    fontFamily: "var(--sans)", 
                    padding: "4px 8px", 
                    borderRadius: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 12
                  }}
                >
                  ✦ Member-only story
                </span>
                <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", lineHeight: 1.3, marginBottom: 16 }}>
                  How to Sleep on Hot Summer Nights: Science vs. Myth
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--brand-light)", color: "var(--brand)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    RB
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--black)" }}>Robert Roy Britt</div>
                    <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>Author of Make Sleep Your Superpower</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Grid Section (Screenshot 2) */}
      <main id="plans" style={{ flex: 1, maxWidth: 1040, margin: "0 auto", padding: "100px 24px 120px", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 64 }} className="plans-grid">
          {/* Headline on left */}
          <div>
            <h2 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: 48, 
                fontWeight: 400, 
                lineHeight: 1.1, 
                color: "var(--black)", 
                letterSpacing: "-0.025em" 
              }}
            >
              Membership plans
            </h2>
          </div>

          {/* Columns on right */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }} className="plans-columns">
            {plans.map((plan) => (
              <div key={plan.name} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>
                    {plan.name}
                  </h3>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--black)", fontWeight: 600 }}>
                    {plan.price} or {plan.yearlyPrice}
                  </div>
                  
                  <button 
                    onClick={() => setCheckoutPlan({ name: plan.name, price: plan.price })}
                    className="btn btn-primary"
                    style={{ 
                      width: "100%", 
                      padding: "10px", 
                      borderRadius: 999, 
                      backgroundColor: "var(--brand)", 
                      color: "white", 
                      fontWeight: 600, 
                      marginTop: 20,
                      fontSize: 14
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand)")}
                  >
                    Get started
                  </button>
                </div>

                {plan.isPremium && (
                  <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    All UGET member benefits
                    <div style={{ fontSize: 10, color: "var(--brand)", marginTop: 2 }}>plus</div>
                  </div>
                )}

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                  {plan.features.map((feat) => (
                    <li key={feat} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--ink-2)", fontFamily: "var(--serif)", lineHeight: 1.45 }}>
                      <span style={{ color: "var(--brand)", fontWeight: "bold" }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .plans-columns {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
        @media (max-width: 640px) {
          .hide-sm-stack {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 24px !important;
          }
          .hide-sm-stack button, .hide-sm-stack a {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
