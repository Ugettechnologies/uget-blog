import Link from "next/link";

export default function Footer() {
  const links = [
    { label: "Help", href: "/help" },
    { label: "Status", href: "/status" },
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
    { label: "Store", href: "/store" },
    { label: "Privacy", href: "/privacy" },
    { label: "Rules", href: "/rules" },
    { label: "Terms", href: "/terms" },
    { label: "Text to speech", href: "/text-to-speech" },
  ];

  return (
    <footer className="site-footer">
      <div className="footer-inner" style={{ justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px 24px" }}>
          {links.map((link) => (
            <Link 
              key={link.label} 
              href={link.href} 
              className="footer-link"
              style={{ 
                fontFamily: "var(--sans)", 
                fontSize: 13, 
                color: "var(--muted)", 
                transition: "color 0.2s",
                textDecoration: "none"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span className="footer-logo" style={{ fontSize: 16 }}>EchoGist</span>
          <span style={{ fontSize: 13, color: "var(--muted-2)", fontFamily: "var(--sans)" }}>·</span>
          <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>
            © {new Date().getFullYear()} EchoGist Technologies
          </span>
        </div>
      </div>
    </footer>
  );
}
