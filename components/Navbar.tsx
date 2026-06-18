"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Profile } from "@/lib/types";
import { getInitials } from "@/lib/types";

export default function Navbar() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [notifications, setNotifications] = useState<any[]>([]);

  const unreadNotifCount = notifications.filter(n => n.unread).length;

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase.from("notifications")
      .select("*, profiles(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data.map((n: any) => {
        const actor = n.actor_profile;
        const iconMap: any = { like: "💖", comment: "💬", follow: "👤" };
        return {
          id: n.id,
          text: actor ? `${actor.full_name} ${n.content}` : n.content,
          time: new Date(n.created_at).toLocaleDateString() || "Just now",
          unread: !n.read,
          icon: iconMap[n.type] || "🎉"
        };
      }));
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => setProfile(data));
        loadNotifications(user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: string, session: any) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        setProfile(null);
        setNotifications([]);
      } else {
        supabase.from("profiles").select("*").eq("id", u.id).single()
          .then(({ data }) => setProfile(data));
        loadNotifications(u.id);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) { router.push(`/?q=${encodeURIComponent(search.trim())}`); setSearch(""); }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = async (id: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/"); router.refresh(); setMenuOpen(false);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/favicon.png" alt="UGET" width={28} height={28} className="object-contain" />
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
              <Link href="/live" className="nav-link" style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                <span style={{ color: "#ef4444" }}>🔴</span>
                <span>Live</span>
              </Link>
              <Link href="/write" className="nav-btn-write" style={{ marginRight: 8 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hide-sm">Write</span>
              </Link>

              {/* Notification bell button */}
              <div style={{ position: "relative", marginRight: 8 }} ref={notifRef}>
                <button 
                  onClick={() => setNotifOpen(!notifOpen)}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    color: "var(--ink-2)", 
                    padding: 6, 
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  title="Notifications"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      background: "#ef4444",
                      color: "white",
                      fontSize: 9,
                      fontWeight: "bold",
                      borderRadius: "50%",
                      width: 14,
                      height: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid var(--bg)"
                    }}>
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications dropdown menu */}
                {notifOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--bg-2)",
                    border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)",
                    width: 320, zIndex: 200, overflow: "hidden", animation: "fadeIn 0.15s ease",
                  }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>Notifications</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {unreadNotifCount > 0 && (
                          <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 500, padding: 0 }}>
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={clearAllNotifications} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 500, padding: 0 }}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 14 }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => handleNotificationClick(item.id)}
                            style={{ 
                              display: "flex", 
                              gap: 12, 
                              padding: "12px 16px", 
                              borderBottom: "1px solid var(--border-2)",
                              cursor: "pointer",
                              background: item.unread ? "var(--bg-3)" : "none",
                              position: "relative"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
                            onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
                          >
                            <span style={{ fontSize: 18, alignSelf: "flex-start" }}>{item.icon}</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4, fontWeight: item.unread ? 500 : 400 }}>{item.text}</p>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted-2)", marginTop: 4, display: "block" }}>{item.time}</span>
                            </div>
                            {item.unread && (
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", alignSelf: "center", flexShrink: 0 }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                    position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--bg-2)",
                    border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)",
                    minWidth: 220, zIndex: 200, overflow: "hidden", animation: "fadeIn 0.15s ease",
                  }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-2)" }}>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--black)" }}>{profile?.full_name || "Writer"}</div>
                      <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{user.email}</div>
                    </div>
                    {[
                      { href: "/dashboard", label: "Dashboard", icon: "📊" },
                      { href: "/write", label: "New story", icon: "✍️" },
                      { href: `/profile/${profile?.username || user.id}`, label: "Profile", icon: "👤" },
                      { href: "/settings", label: "Settings", icon: "⚙️" },
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
                        <span>🛠️</span>Admin panel
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
              <Link href="/live" className="nav-link" style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                <span style={{ color: "#ef4444" }}>🔴</span>
                <span>Live</span>
              </Link>
              <Link href="/auth?mode=signup" className="nav-btn-write">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
