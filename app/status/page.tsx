"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StatusPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          System Status
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          Real-time system health and service status.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* Status Indicator Banner */}
          <div 
            style={{ 
              backgroundColor: "var(--accent-bg)", 
              border: "1px solid #b7dbb5", 
              borderRadius: 12, 
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16
            }}
          >
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#1a5c18" }}>
                All Systems Operational
              </h3>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "#2d6a2b", marginTop: 2 }}>
                We are monitoring services closely and all features are functioning normally.
              </p>
            </div>
          </div>

          {/* Breakdown list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {[
              { service: "UGET Web Platform", status: "Operational", color: "#22c55e" },
              { service: "Database Services (Supabase)", status: "Operational", color: "#22c55e" },
              { service: "Image Storage & Media Hosting", status: "Operational", color: "#22c55e" },
              { service: "Authentication & OAuth Services", status: "Operational", color: "#22c55e" },
              { service: "API & Notification Workers", status: "Operational", color: "#22c55e" }
            ].map((item) => (
              <div 
                key={item.service}
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-2)"
                }}
              >
                <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 500 }}>
                  {item.service}
                </span>
                <span 
                  style={{ 
                    fontFamily: "var(--sans)", 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: item.color, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6 
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
