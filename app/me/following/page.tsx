"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, HamburgerIcon, CloseIcon, SearchIcon, WriteIcon, BellIcon } from "@/components/SidebarNav";

export default function RefineRecommendationsPage() {
  const [activeTab, setActiveTab] = useState<"following" | "history" | "muted" | "suggestions">("suggestions");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  // Follow states
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [suggestedWriters, setSuggestedWriters] = useState<any[]>([]);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);

  const [toast, setToast] = useState("");
  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/?auth=signin");
        return;
      }
      setUser(user);

      // Fetch user profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setUserProfile(profile);

      // Load following & suggestions
      await Promise.all([
        loadFollowingData(user.id),
        loadSuggestedWriters(user.id),
        loadNotifications(user.id),
        loadFollowingProfiles(user.id)
      ]);

      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Click outside dropdowns listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".avatar-dropdown-trigger") && !target.closest(".avatar-dropdown")) {
        setUserDropdownOpen(false);
      }
      if (!target.closest(".notif-dropdown-trigger") && !target.closest(".notif-dropdown")) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadFollowingData = async (userId: string) => {
    try {
      const { data } = await supabase.from("follows")
        .select("following_id, following_profile:profiles(*)")
        .eq("follower_id", userId);
      if (data) {
        setFollowingList(data.map((f: any) => f.following_profile).filter(Boolean));
      }
    } catch (err) {
      console.error("Error loading following:", err);
    }
  };

  const loadSuggestedWriters = async (userId: string) => {
    try {
      // Get all profiles except user
      const { data } = await supabase.from("profiles")
        .select("*")
        .neq("id", userId)
        .limit(10);
      if (data) {
        setSuggestedWriters(data);
      }
    } catch (err) {
      console.error("Error loading suggestions:", err);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const { data } = await supabase.from("notifications")
        .select("*, actor_profile:profiles(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setNotifications(data.map((n: any) => {
          const actor = n.actor_profile || n.profiles;
          const iconMap: any = { like: "💖", comment: "💬", follow: "👤" };
          return {
            id: n.id,
            text: actor ? `${actor.full_name} ${n.content}` : n.content,
            time: new Date(n.created_at).toLocaleDateString() || "Just now",
            unread: !n.read,
            icon: iconMap[n.type] || "🎉"
          };
        }));
        setUnreadNotifCount(data.filter((n: any) => !n.read).length);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const loadFollowingProfiles = async (userId: string) => {
    try {
      const { data } = await supabase.from("follows")
        .select("following_id, following_profile:profiles(*)")
        .eq("follower_id", userId)
        .limit(5);
      if (data) {
        setFollowingProfiles(data.map((f: any) => f.following_profile).filter(Boolean));
      }
    } catch (err) {
      console.error("Error loading following profiles:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id);
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    setUnreadNotifCount(0);
  };

  const handleNotificationClick = async (id: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
    setUnreadNotifCount(0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleFollowToggle = async (targetId: string, currentlyFollowing: boolean) => {
    if (!user) return;
    if (currentlyFollowing) {
      const { error } = await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);
      if (!error) {
        setFollowingList(followingList.filter(f => f.id !== targetId));
        showMsg("Unfollowed user");
        loadFollowingProfiles(user.id);
      }
    } else {
      const { error } = await supabase.from("follows")
        .insert({ follower_id: user.id, following_id: targetId });
      if (!error) {
        // Refetch profile details of followed user
        const { data } = await supabase.from("profiles").select("*").eq("id", targetId).single();
        if (data) {
          setFollowingList([...followingList, data]);
        }
        showMsg("Following user");
        loadFollowingProfiles(user.id);
      }
    }
  };

  return (
    <div className="uget-layout">
      {/* Shared CSS styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .uget-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg);
        }
        .uget-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 240px;
          background-color: var(--bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          z-index: 100;
        }
        .uget-main {
          flex: 1;
          margin-left: 240px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
        }
        .uget-header {
          position: sticky;
          top: 0;
          height: 64px;
          background-color: var(--nav-bg, rgba(255, 255, 255, 0.95));
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 90;
        }
        .uget-header-search {
          align-items: center;
          gap: 8px;
          background-color: var(--bg-3);
          border-radius: 99px;
          padding: 6px 16px;
          width: 240px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .uget-header-search:focus-within {
          background-color: var(--bg);
          border-color: var(--border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .uget-content-container {
          padding: 32px 40px 80px;
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
        }
        .uget-mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background-color: var(--bg);
          z-index: 1001;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 24px rgba(0,0,0,0.15);
          transition: transform 0.3s ease-in-out;
        }
        .uget-mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0,0,0,0.4);
          backdrop-filter: blur(2px);
          z-index: 1000;
        }
        .uget-live-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
        }
        .uget-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @media (max-width: 1024px) {
          .uget-sidebar {
            display: none;
          }
          .uget-main {
            margin-left: 0;
          }
        }
        @media (max-width: 960px) {
          .uget-header {
            padding: 0 24px;
          }
          .uget-content-container {
            padding: 40px 24px 60px;
          }
        }
      `}} />

      {/* ── Desktop Sidebar ── */}
      <aside className="uget-sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Image src="/favicon.png" alt="EchoGist Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">EchoGist</span>
          </Link>
        </div>
        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage="profile" // there's no "following" active page in the standard set, "profile" is closest or just "home"
            profileHref={userProfile ? `/profile/${userProfile.username || user?.id}` : "/profile"}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} userProfileId={user?.id} />
        </nav>

        {userProfile && (
          <div className="flex items-center gap-3 pt-4 mt-auto" style={{ borderTop: "1px solid var(--border-2)" }}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {userProfile.avatar_url ? (
                <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full font-bold text-sm flex items-center justify-center font-sans" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                  {getInitials(userProfile.full_name || "?")}
                </div>
              )}
            </div>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm truncate font-sans" style={{ color: "var(--ink)" }}>{userProfile.full_name || "Writer"}</div>
              <div className="text-xs truncate font-sans" style={{ color: "var(--muted)" }}>@{userProfile.username || "writer"}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <>
          <div className="uget-mobile-drawer-overlay" onClick={() => setSidebarOpen(false)} />
          <div className="uget-mobile-drawer" style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <Link
                href="/"
                style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
                onClick={() => setSidebarOpen(false)}
              >
                <Image src="/favicon.png" alt="EchoGist Logo" width={32} height={32} style={{ borderRadius: 6 }} />
                <span style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 800, color: "var(--brand)", letterSpacing: "-0.02em" }}>EchoGist</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ padding: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-2)", borderRadius: 999, padding: "12px 16px", border: "1px solid var(--border-2)", marginBottom: 32 }}
            >
              <span style={{ color: "var(--muted)", display: "flex" }}><SearchIcon /></span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search EchoGist..."
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 15, width: "100%", color: "var(--ink)", fontFamily: "var(--sans)" }}
              />
            </form>
            <nav style={{ flex: 1 }}>
              <SidebarNav
                activePage="profile"
                profileHref={userProfile ? `/profile/${userProfile.username || user?.id}` : "/profile"}
                onItemClick={() => setSidebarOpen(false)}
              />
              <SidebarFollowingList followingProfiles={followingProfiles} userProfileId={user?.id} />
            </nav>
          </div>
        </>
      )}

      {/* ── Main content area ── */}
      <main className="uget-main">
        {/* Header bar */}
        <header className="uget-header">
          <div className="flex items-center gap-3">
            {/* Hamburger for desktop & mobile */}
            <button
              onClick={() => {
                if (window.innerWidth > 1024) {
                  const isCollapsed = document.documentElement.classList.toggle("sidebar-collapsed");
                  localStorage.setItem("uget_sidebar_collapsed", String(isCollapsed));
                } else {
                  setSidebarOpen(true);
                }
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-600 dark:text-zinc-400 transition-colors"
              title="Toggle menu"
            >
              <HamburgerIcon />
            </button>

            {/* Logo for mobile / collapsed desktop header */}
            <Link href="/" className="uget-header-logo flex items-center gap-1.5" style={{ textDecoration: "none" }}>
              <Image src="/favicon.png" alt="EchoGist" width={24} height={24} />
              <span className="font-bold text-lg text-violet-600 font-display">EchoGist</span>
            </Link>

          </div>

          <div className="flex items-center gap-4">
            <Link href="/live" className="uget-live-pill" style={{ textDecoration: "none" }}>
              <span className="uget-live-dot" />
              <span className="hidden xs:inline">Live</span>
            </Link>
            <Link href="/write" className="nav-write-btn" style={{ textDecoration: "none" }}>
              <span className="flex items-center justify-center"><WriteIcon /></span>
              <span className="hidden sm:inline">Write</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative notif-dropdown-trigger">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 transition-colors relative flex items-center justify-center"
              >
                <BellIcon />
                {unreadNotifCount > 0 && (
                  <span style={{ position: "absolute", top: 2, right: 2, backgroundColor: "#ef4444", color: "white", fontSize: 9, fontWeight: "bold", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #ffffff" }}>
                    {unreadNotifCount}
                  </span>
                )}
              </button>
              {notifDropdownOpen && (
                <div className="notif-dropdown" style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: "white", border: "1px solid var(--border-2)", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.1)", zIndex: 100, width: 340, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfcfc" }}>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)" }}>Notifications</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      {unreadNotifCount > 0 && (
                        <button onClick={markAllAsRead} style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto", background: "white" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 14, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} onClick={() => handleNotificationClick(item.id)} className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer ${item.unread ? "bg-violet-50/30" : "hover:bg-gray-50"}`}>
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs text-gray-700 leading-relaxed font-sans ${item.unread ? "font-semibold" : ""}`}>{item.text}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block font-sans">{item.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative avatar-dropdown-trigger">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="nav-avatar"
              >
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                ) : (
                  <span>{getInitials(userProfile?.full_name || user?.email || "?")}</span>
                )}
              </button>
              <UserDropdown
                isOpen={userDropdownOpen}
                user={user}
                userProfile={userProfile}
                onClose={() => setUserDropdownOpen(false)}
                onOpenNotifs={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </header>

        {/* Console Container */}
        <div className="uget-content-container" style={{ boxSizing: "border-box", paddingLeft: "max(24px, 5vw)", paddingRight: "max(24px, 5vw)" }}>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, color: "var(--black)", marginBottom: 8, letterSpacing: "-0.02em" }}>
            Refine recommendations
          </h1>
          <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", marginBottom: 32, lineHeight: 1.5 }}>
            Adjust recommendations by updating what you're following, your reading history, and who you've muted.
          </p>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border-2)", marginBottom: 32, overflowX: "auto" }}>
            {[
              { id: "following", label: "Following" },
              { id: "history", label: "Reading history" },
              { id: "muted", label: "Muted" },
              { id: "suggestions", label: "Suggestions" }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    padding: "12px 0",
                    border: "none",
                    background: "none",
                    borderBottom: active ? "1.5px solid var(--brand)" : "1.5px solid transparent",
                    color: active ? "var(--brand)" : "var(--muted)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "var(--sans)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div className="spinner" style={{ borderTopColor: "var(--brand)", borderColor: "var(--border)", margin: "0 auto" }} />
              <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 16 }}>Loading recommendations...</p>
            </div>
          ) : (
            <div>
              {activeTab === "suggestions" && (
                <div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", marginBottom: 20 }}>
                    Writers to follow
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {suggestedWriters.length === 0 ? (
                      <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)" }}>No recommendations available.</p>
                    ) : (
                      suggestedWriters.map((writer) => {
                        const isF = followingList.some(f => f.id === writer.id);
                        return (
                          <div key={writer.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid var(--border-2)" }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                              <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--border)", flexShrink: 0 }}>
                                {writer.avatar_url ? (
                                  <Image src={writer.avatar_url} alt="" width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                ) : (
                                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                                    {getInitials(writer.full_name || "?")}
                                  </div>
                                )}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <Link href={`/profile/${writer.username || writer.id}`} style={{ textDecoration: "none", display: "block" }}>
                                  <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>{writer.full_name}</span>
                                </Link>
                                <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {writer.bio || "No bio description provided."}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleFollowToggle(writer.id, isF)}
                              style={{
                                border: "1px solid var(--brand)",
                                color: isF ? "white" : "var(--brand)",
                                backgroundColor: isF ? "var(--brand)" : "transparent",
                                borderRadius: 999,
                                padding: "6px 16px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "var(--sans)",
                                marginLeft: 16
                              }}
                            >
                              {isF ? "Following" : "Follow"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === "following" && (
                <div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", marginBottom: 20 }}>
                    Writers you follow
                  </h3>
                  {followingList.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>You aren't following anyone yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      {followingList.map((writer) => (
                        <div key={writer.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid var(--border-2)" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--border)", flexShrink: 0 }}>
                              {writer.avatar_url ? (
                                <Image src={writer.avatar_url} alt="" width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              ) : (
                                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                                  {getInitials(writer.full_name || "?")}
                                </div>
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <Link href={`/profile/${writer.username || writer.id}`} style={{ textDecoration: "none", display: "block" }}>
                                <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>{writer.full_name}</span>
                              </Link>
                              <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>
                                {writer.bio || "No bio description provided."}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFollowToggle(writer.id, true)}
                            style={{
                              border: "1px solid var(--brand)",
                              color: "white",
                              backgroundColor: "var(--brand)",
                              borderRadius: 999,
                              padding: "6px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "var(--sans)",
                              marginLeft: 16
                            }}
                          >
                            Following
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Your reading history is clean.</p>
                </div>
              )}

              {activeTab === "muted" && (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>You haven't muted anyone yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Message */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#1f2937",
          color: "white",
          padding: "10px 24px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          fontFamily: "var(--sans)"
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
