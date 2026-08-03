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
import { NavNotificationButton } from "./SidebarNav";

function NavbarInner() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
      .select("*, actor_profile:profiles(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data.map((n: any) => {
        const actor = n.actor_profile || n.profiles;
        const iconMap: any = { like: "💖", comment: "💬", follow: "👤", post: "✍️" };
        return {
          id: n.id,
          text: actor ? `${actor.full_name} ${n.content}` : n.content,
          time: new Date(n.created_at).toLocaleDateString() || "Just now",
          unread: !n.read,
          icon: iconMap[n.type] || "🎉",
          type: n.type,
          actor_username: actor?.username,
          post_slug: n.posts?.slug
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

  const handleNotificationClick = async (item: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", item.id);
    setNotifications(notifications.map(n => n.id === item.id ? { ...n, unread: false } : n));
    setNotifOpen(false);
    if (item.type === "follow" && item.actor_username) {
      router.push(`/profile/${item.actor_username}`);
    } else if (item.post_slug) {
      router.push(`/post/${item.post_slug}`);
    }
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
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="nav-mobile-search-btn"
            style={{
              background: "none",
              border: "none",
              padding: 6,
              color: logoColor || "var(--muted)",
              cursor: "pointer",
              borderRadius: "50%",
            }}
            title="Search"
            aria-label="Search"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

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
              <NavNotificationButton unreadCount={unreadNotifCount} active={pathname === "/notifications"} />


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
                  onOpenNotifs={() => { setMenuOpen(false); router.push("/notifications"); }}
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
      {mobileSearchOpen && (
        <div
          style={{
            padding: "10px 16px",
            background: navBg,
            borderTop: navBorder,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
          className="hide-md-up"
        >
          <form
            onSubmit={handleSearch}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-3)",
              borderRadius: 999,
              padding: "6px 14px",
              border: "1px solid var(--border)",
            }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted-2)", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search EchoGist…"
              autoFocus
              style={{
                width: "100%",
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "var(--ink)",
                fontFamily: "var(--sans)",
              }}
            />
          </form>
          <button
            onClick={() => setMobileSearchOpen(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              color: logoColor || "var(--muted)",
              cursor: "pointer",
              padding: "4px 8px",
              fontFamily: "var(--sans)",
            }}
          >
            Cancel
          </button>
        </div>
      )}
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
