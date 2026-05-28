"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { getInitials } from "@/lib/types";

export default function Navbar() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) { router.push(`/?q=${encodeURIComponent(search.trim())}`); setSearch(""); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/"); router.refresh(); setMenuOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/logo-icon.png" alt="UGET" width={28} height={28} className="object-contain" />
          <span className="nav-logo-text">UGET</span>
        </Link>
        <div className="nav-divider" style={{ display: "var(--sm-hide, flex)" }} />
        <form onSubmit={handleSearch} className="nav-search" style={{ maxWidth: 280 }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted-2)", flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
        </form>
        <div className="nav-links">
          {user ? (
            <>
              <Link href="/write" className="nav-btn-write">
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hide-sm">Write</span>
              </Link>
              <div style={{ position: "relative" }} ref={menuRef}>
                <button className="nav-avatar" onClick={() => setMenuOpen(!menuOpen)}>
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                  ) : (
                    <span>{getInitials(profile?.full_name || user.email || "?")}</span>
                  )}
                </button>
                {menuOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)", background: "white",
                    border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)",
                    minWidth: 220, zIndex: 200, overflow: "hidden", animation: "fadeIn 0.15s ease",
                  }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-2)" }}>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{profile?.full_name || "Writer"}</div>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{user.email}</div>
                    </div>
                    {[
                      { href: "/dashboard", label: "Dashboard", icon: "📊" },
                      { href: "/write", label: "New story", icon: "✍️" },
                      { href: `/profile/${profile?.username || user.id}`, label: "Profile", icon: "👤" },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
                          fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <span>{item.icon}</span>{item.label}
                      </Link>
                    ))}
                    {profile?.role === "admin" && (
                      <Link href="/admin" onClick={() => setMenuOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
                          fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                        <span>⚙️</span>Admin panel
                      </Link>
                    )}
                    <div style={{ borderTop: "1px solid var(--border-2)" }} />
                    <button onClick={handleSignOut}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
                        fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", cursor: "pointer",
                        border: "none", background: "none", textAlign: "left" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-3)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
                      <span>🚪</span>Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth" className="nav-link">Sign in</Link>
              <Link href="/auth?mode=signup" className="nav-btn-write">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
