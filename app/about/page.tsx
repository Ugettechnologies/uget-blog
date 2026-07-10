"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div style={{ background: "#191919", minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "100px 24px 120px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          <h1 
            style={{ 
              fontFamily: "var(--serif)", 
              fontSize: "clamp(44px, 8vw, 88px)", 
              fontWeight: 400, 
              lineHeight: 1.05, 
              color: "#ffffff", 
              letterSpacing: "-0.03em",
              marginBottom: 48,
              maxWidth: 750
            }}
          >
            Everyone has a story to tell.
          </h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 640 }}>
            <p 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: 22, 
                lineHeight: 1.6, 
                color: "rgba(255, 255, 255, 0.95)",
                fontWeight: 300
              }}
            >
              EchoGist is a home for human stories and ideas. Here, anyone can share knowledge and wisdom with the world—without having to build a mailing list or a following first. The internet is noisy and chaotic; EchoGist is quiet yet full of insight. It’s simple, beautiful, collaborative, and helps you find the right readers for whatever you have to say.
            </p>
            
            <p 
              style={{ 
                fontFamily: "var(--serif)", 
                fontSize: 22, 
                lineHeight: 1.6, 
                color: "rgba(255, 255, 255, 0.95)",
                fontWeight: 300,
                borderLeft: "2px solid rgba(255, 255, 255, 0.3)",
                paddingLeft: 24,
                fontStyle: "italic"
              }}
            >
              Ultimately, our goal is to deepen our collective understanding of the world through the power of writing.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
