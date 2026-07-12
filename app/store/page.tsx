"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StorePage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", width: "100%" }}>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, marginBottom: 8, color: "var(--black)" }}>
          The EchoGist Merchandise Store
        </h1>
        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 40 }}>
          High-quality stationery and gear for modern writers.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
          {[
            { name: "The EchoGist Minimalist Notebook", price: "₦15,000.00", desc: "A hardbound, lay-flat journal with cream-colored acid-free pages, optimized for fountain pen drafting.", tag: "Notebook" },
            { name: "Matte Metal Gel Ink Pen", price: "₦10,000.00", desc: "Precision tip and quick-dry black ink for fluid, uninterrupted handwriting sessions.", tag: "Writing" },
            { name: "Premium Cotton Tote Bag", price: "₦18,000.00", desc: "Extra wide double-stitched canvas tote with custom embroidered brand logo for carrying books and laptops.", tag: "Apparel" },
            { name: "EchoGist Signature T-Shirt", price: "₦20,000.00", desc: "Heavyweight 100% combed cotton t-shirt with premium embroidered brand logo on the left chest. Perfect fit and maximum comfort.", tag: "Apparel" }
          ].map((item) => (
            <div 
              key={item.name}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
                background: "var(--bg-2)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
            >
              <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.tag}
              </span>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)" }}>
                {item.name}
              </h3>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", lineHeight: 1.5, flex: 1 }}>
                {item.desc}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--sans)" }}>{item.price}</span>
                <button className="btn btn-outline btn-sm">Coming Soon</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
