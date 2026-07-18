"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AuthModal from "./AuthModal";
import { UserDropdown } from "./UserDropdown";
import { createClient } from "@/lib/db-client/client";
import type { Profile } from "@/lib/types";
import { getInitials, saveUserToSavedList } from "@/lib/types";

function NavbarInner() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const authVal = searchParams.get("auth");
    if (authVal === "signup") {
      setAuthMode("signup");
      setAuthModalOpen(true);
    } else if (authVal === "signin" || authVal === "login") {
      setAuthMode("login");
      setAuthModalOpen(true);
    }
  }, [searchParams]);

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
        const iconMap: any = { like: "💖", comment: "💬", follow: "👤", post: "✍️" };
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

  // ── fetchUserFromSession ─────────────────────────────────────────────────
  // Reads the custom JWT session cookie via /api/auth/me and updates Navbar state.
  // Used when the Supabase auth state change won't fire (e.g. magic-link flow).
  const fetchUserFromSession = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) return;
      const { user: sessionUser } = await res.json();
      if (sessionUser) {
        // Build a minimal user object matching the shape Navbar expects
        const u = { id: sessionUser.id, email: sessionUser.email };
        setUser(u);
        // Fetch the profile from Supabase using the user id
        supabase.from("profiles").select("*").eq("id", sessionUser.id).single()
          .then(({ data }) => {
            setProfile(data);
            if (data) {
              const remember = localStorage.getItem("uget_remember_me") !== "false";
              if (remember) saveUserToSavedList(u as any, data);
            }
          });
        loadNotifications(sessionUser.id);
      }
    } catch (err) {
      console.error("[Navbar] fetchUserFromSession error:", err);
    }
  };

  useEffect(() => {
    // ── 1. Supabase client-side auth (OAuth / Supabase magic link) ────────
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase.from("profiles").select("*").eq("id", user.id).single()
          .then(({ data }) => {
            setProfile(data);
            if (data) {
              const remember = localStorage.getItem("uget_remember_me") !== "false";
              if (remember) {
                saveUserToSavedList(user, data);
              }
            }
          });
        loadNotifications(user.id);
      } else {
        // No Supabase session — check for custom JWT session (email magic link)
        fetchUserFromSession();
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
          .then(({ data }) => {
            setProfile(data);
            if (data) {
              const remember = localStorage.getItem("uget_remember_me") !== "false";
              if (remember) {
                saveUserToSavedList(u, data);
              }
            }
          });
        loadNotifications(u.id);
      }
    });

    // ── 2. Custom JWT auth change event (fired by AuthModal after email magic-link polling) ──
    const handleAuthChange = () => {
      fetchUserFromSession();
    };
    window.addEventListener("uget-auth-change", handleAuthChange);

    // ── 3. Tab visibility change — re-check session when user returns to this tab ──
    // This handles the case where the user clicked the magic link in another tab/window.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUserFromSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("uget-auth-change", handleAuthChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

  // Theme styling configurations
  const isLoggedOut = !user;
  const isAboutPage = pathname === "/about";
  const isLoggedOutHome = isLoggedOut && pathname === "/";

  let navBg = "var(--nav-bg, rgba(255,255,255,0.96))";
  let navBorder = "1px solid var(--border)";
  let logoColor = "var(--brand)";
  let linkColor = "var(--muted)";
  let writeBtnBg = "var(--brand)";
  let writeBtnColor = "white";
  let writeBtnBorder = "none";

  if (isAboutPage) {
    navBg = "#191919";
    navBorder = "1px solid rgba(255, 255, 255, 0.15)";
    logoColor = "#ffffff";
    linkColor = "rgba(255, 255, 255, 0.85)";
    writeBtnBg = "transparent";
    writeBtnColor = "#ffffff";
    writeBtnBorder = "1px solid rgba(255, 255, 255, 0.6)";
  } else if (isLoggedOutHome) {
    navBg = "var(--hero-nav-bg)";
    navBorder = "1px solid var(--hero-nav-border)";
    logoColor = "var(--hero-nav-logo)";
    linkColor = "var(--hero-nav-link)";
    writeBtnBg = "var(--brand)";
    writeBtnColor = "#ffffff";
    writeBtnBorder = "none";
  }

  return (
    <>
      <nav className="nav" style={{ background: navBg, borderBottom: navBorder, zIndex: authModalOpen ? 9999 : undefined }}>
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <Image src="/favicon.png" alt="EchoGist" width={28} height={28} className="object-contain" />
          <span className="nav-logo-text" style={{ color: logoColor }}>EchoGist</span>
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
              {/* Commented out live feature
              <Link href="/live" className="nav-link" style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                <span style={{ color: "#ef4444" }}>🔴</span>
                <span>Live</span>
              </Link>
              */}
              {(profile?.role === "admin" || profile?.role === "staff" || profile?.role === "writer") && (
                <Link href="/write" className="nav-btn-write" style={{ marginRight: 8 }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="hide-sm">Write</span>
                </Link>
              )}

              {/* ── Notification Bell ── */}
              <div style={{ position: "relative", marginRight: 8 }} ref={notifRef}>
                <button
                  id="navbar-notif-btn"
                  onClick={() => setNotifOpen(!notifOpen)}
                  style={{
                    background: notifOpen ? "var(--bg-3)" : "none",
                    border: "none",
                    cursor: "pointer",
                    color: notifOpen ? "var(--brand)" : "var(--ink-2)",
                    padding: 8,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-3)";
                    e.currentTarget.style.color = "var(--brand)";
                  }}
                  onMouseLeave={(e) => {
                    if (!notifOpen) {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "var(--ink-2)";
                    }
                  }}
                  aria-label="Open notifications"
                  title="Notifications"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifCount > 0 && (
                    <span className="notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                  )}
                </button>

                {/* ── Notifications Dropdown Panel ── */}
                {notifOpen && (
                  <div className="notif-dropdown notif-dropdown--animated">
                    {/* Header */}
                    <div className="notif-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "var(--brand)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Notifications</span>
                        {unreadNotifCount > 0 && (
                          <span style={{ background: "var(--brand)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 7px", letterSpacing: "0.02em" }}>
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {unreadNotifCount > 0 && (
                          <button onClick={markAllAsRead} className="notif-action-btn notif-action-btn--primary">
                            Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={clearAllNotifications} className="notif-action-btn">
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="notif-body">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">
                          <div className="notif-empty-icon">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--muted-2)" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <p style={{ margin: 0, fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>All caught up!</p>
                          <p style={{ margin: "4px 0 0", fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>New activity will appear here</p>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const typeColors: Record<string, string> = {
                            "💖": "#f43f5e", "💬": "#8b5cf6", "👤": "#3b82f6",
                            "✍️": "#10b981", "🎉": "#f59e0b",
                          };
                          const chipColor = typeColors[item.icon] || "var(--brand)";
                          return (
                            <div
                              key={item.id}
                              className={`notif-item${item.unread ? " notif-item--unread" : ""}`}
                              onClick={() => handleNotificationClick(item.id)}
                            >
                              {/* Coloured icon chip */}
                              <div className="notif-icon-chip" style={{ background: `${chipColor}18`, color: chipColor }}>
                                <span style={{ fontSize: 14 }}>{item.icon}</span>
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="notif-text">{item.text}</p>
                                <span className="notif-time">{item.time}</span>
                              </div>

                              {item.unread && <span className="notif-unread-dot" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="notif-footer">
                        <Link href="/settings#notifications" onClick={() => setNotifOpen(false)} className="notif-footer-link">
                          Notification settings
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    )}
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
                <UserDropdown
                  isOpen={menuOpen}
                  user={user}
                  userProfile={profile}
                  onClose={() => setMenuOpen(false)}
                  onOpenNotifs={() => { setMenuOpen(false); /* Navbar doesn't have internal notifs yet, but handled */ }}
                  onSignOut={handleSignOut}
                />
              </div>
            </>
          ) : (
            <>
              {/* Commented out live feature
              <Link href="/live" className="nav-link" style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8, color: linkColor }}>
                <span style={{ color: "#ef4444" }}>🔴</span>
                <span>Live</span>
              </Link>
              */}
              <Link href="/about" className="nav-link hide-sm" style={{ marginRight: 8, color: linkColor }}>
                Our story
              </Link>
              <Link href="/membership" className="nav-link hide-sm" style={{ marginRight: 8, color: linkColor }}>
                Membership
              </Link>
              <button 
                onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }} 
                className="nav-link hide-sm" 
                style={{ marginRight: 8, background: "none", border: "none", cursor: "pointer", color: linkColor }}
              >
                Write
              </button>
              <button 
                onClick={() => { setAuthMode("login"); setAuthModalOpen(true); }} 
                className="nav-link" 
                style={{ marginRight: 8, background: "none", border: "none", cursor: "pointer", color: linkColor }}
              >
                Sign in
              </button>
              <button 
                onClick={() => { setAuthMode("signup"); setAuthModalOpen(true); }} 
                className="nav-btn-write"
                style={{
                  backgroundColor: writeBtnBg,
                  color: writeBtnColor,
                  border: writeBtnBorder,
                  borderRadius: "999px",
                  padding: "9px 20px"
                }}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>
      </nav>
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => {
          setAuthModalOpen(false);
          if (searchParams.get("auth")) {
            const params = new URLSearchParams(window.location.search);
            params.delete("auth");
            const newSearch = params.toString();
            const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "");
            router.replace(newPath, { scroll: false });
          }
        }} 
        initialMode={authMode} 
      />
    </>
  );
}

export default function Navbar() {
  return (
    <Suspense 
      fallback={
        <nav className="nav">
          <div className="nav-inner" style={{ height: "100%", display: "flex", alignItems: "center" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--brand)" }}>EchoGist</div>
          </div>
        </nav>
      }
    >
      <NavbarInner />
    </Suspense>
  );
}
