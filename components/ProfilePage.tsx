"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, CloseIcon, SearchIcon, HamburgerIcon, WriteIcon, BellIcon, SettingsIcon, HelpIcon, SignOutIcon } from "@/components/SidebarNav";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = (params?.username as string || "").replace(/^@/, "");
  const supabase = createClient();

  // Page state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "activity" | "about">("home");
  const [followingDropdownOpen, setFollowingDropdownOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showMsg = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Bio editor state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);

  // Activity tooltip state
  const [activityDismissed, setActivityDismissed] = useState(false);

  useEffect(() => {
    if (!rawUsername) return;
    const load = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Fetch current user profile
        const { data: cProf } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setCurrentUserProfile(cProf);
        loadNotifications(user.id);
        loadFollowingProfiles(user.id);
      }

      // Try by username first, then by ID
      let { data: prof } = await supabase.from("profiles").select("*").eq("username", rawUsername).single();
      if (!prof) {
        const res = await supabase.from("profiles").select("*").eq("id", rawUsername).single();
        prof = res.data;
      }
      if (!prof) { setLoading(false); return; }
      setProfile(prof);
      setBioInput(prof.bio || "");

      if (user && user.id !== prof.id) {
        const { data: followRes } = await supabase.from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", prof.id)
          .single();
        setIsFollowing(!!followRes);
      }

      const { data } = await supabase.from("posts")
        .select("*").eq("author_id", prof.id).eq("published", true)
        .order("created_at", { ascending: false });
      setPosts(data as Post[] || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawUsername]);

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
      if (!target.closest(".following-dropdown-trigger") && !target.closest(".following-dropdown")) {
        setFollowingDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (!currentUser) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", currentUser.id);
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    setUnreadNotifCount(0);
  };

  const handleNotificationClick = async (id: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = async () => {
    if (!currentUser) return;
    await supabase.from("notifications").delete().eq("user_id", currentUser.id);
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

  const handleFollow = async () => {
    if (!currentUser) { router.push("/auth"); return; }
    if (!profile) return;
    
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profile.id);
      setIsFollowing(false);
      setProfile({
        ...profile,
        follower_count: Math.max((profile.follower_count || 0) - 1, 0)
      });
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profile.id });
      setIsFollowing(true);
      setProfile({
        ...profile,
        follower_count: (profile.follower_count || 0) + 1
      });
    }
  };

  const saveBio = async () => {
    if (!currentUser || !profile) return;
    setSavingBio(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ bio: bioInput })
        .eq("id", currentUser.id);
      
      if (!error) {
        setProfile({ ...profile, bio: bioInput });
        setIsEditingBio(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBio(false);
    }
  };

  // (Sidebar icons moved to SidebarNav.tsx)

  if (loading) return (
    <div style={{ background: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
    </div>
  );

  if (!profile) return (
    <div style={{ background: "white", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>Writer not found</h1>
      <Link href="/" className="btn btn-primary btn-md" style={{ textDecoration: "none", marginTop: 16, display: "inline-flex" }}>Back to home</Link>
    </div>
  );

  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);

  return (
    <div className="uget-layout">
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "err" ? "toast-error" : "toast-success"}`}>
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </div>
        </div>
      )}
      {/* CSS Styles injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .uget-layout {
          display: flex;
          min-height: 100vh;
          background-color: #ffffff;
        }
        .uget-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 252px;
          background-color: #ffffff;
          border-right: 1px solid #f0f0f0;
          display: flex;
          flex-direction: column;
          padding: 28px 14px 24px;
          gap: 0;
          z-index: 100;
          overflow-y: auto;
        }
        .uget-main {
          flex: 1;
          margin-left: 252px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
        }
        .uget-header {
          position: sticky;
          top: 0;
          height: 64px;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 90;
        }
        .uget-header-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #fafafa;
          border-radius: 99px;
          padding: 6px 16px;
          width: 240px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .uget-header-search:focus-within {
          background-color: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .uget-profile-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 48px;
          padding: 48px 32px 80px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }
        .uget-profile-feed {
          min-width: 0;
        }
        .uget-profile-sidebar {
          position: sticky;
          top: 88px;
          align-self: start;
          background-color: var(--bg-2);
          border: 1px solid var(--border-2);
          border-radius: 16px;
          padding: 24px;
        }
        .uget-profile-avatar-lg {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          overflow: hidden;
          background-color: var(--bg-3);
          border: 1px solid var(--border);
          margin-bottom: 16px;
        }
        .uget-profile-header-card {
          display: none;
        }
        .uget-mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background-color: #ffffff;
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
        .profile-tab {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          padding: 12px 4px;
          border-bottom: 2px solid transparent;
          background: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .profile-tab.active {
          color: var(--black);
          border-bottom-color: var(--black);
          font-weight: 600;
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
          .uget-profile-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 24px 16px 60px;
          }
          .uget-profile-sidebar {
            display: none;
          }
          .uget-profile-header-card {
            display: flex !important;
          }
          .uget-header {
            padding: 0 16px;
          }
        }
      `}} />

      {/* ── Persistent Desktop Left Sidebar ── */}
      <aside className="uget-sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Image src="/favicon.png" alt="UGET Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">UGET</span>
          </Link>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage="profile"
            profileHref={`/profile/${currentUserProfile?.username || currentUser?.id}`}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} />
        </nav>

        {currentUserProfile && (
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: "auto" }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <Link href={`/profile/${currentUserProfile?.username || currentUser?.id}`} style={{ display: "block", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                  {currentUserProfile.avatar_url ? (
                    <Image src={currentUserProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#ede9fe", color: "#7c3aed", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getInitials(currentUserProfile.full_name || currentUser?.email || "?")}
                    </div>
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUserProfile.full_name || "Writer"}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{currentUserProfile.username || "writer"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 4 }}>
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "#111827" }}>{followingProfiles.length}</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "#9ca3af" }}>Following</span>
              </Link>
              <div style={{ width: 1, background: "#f0f0f0", alignSelf: "stretch" }} />
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "#111827" }}>—</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "#9ca3af" }}>Followers</span>
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Sidebar Drawer overlay ── */}
      <div 
        className="uget-mobile-drawer-overlay" 
        style={{ 
          opacity: sidebarOpen ? 1 : 0, 
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 0.3s ease-in-out" 
        }} 
        onClick={() => setSidebarOpen(false)} 
      />
      <div 
        className="uget-mobile-drawer" 
        style={{ 
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" 
        }}
      >
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }} onClick={() => setSidebarOpen(false)}>
            <Image src="/favicon.png" alt="UGET Logo" width={28} height={28} />
            <span className="font-bold text-xl text-violet-600 font-display">UGET</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Mobile search bar in drawer */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-100 mb-6">
          <SearchIcon />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search UGET..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-800"
          />
        </form>

        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage="profile"
            profileHref={`/profile/${currentUserProfile?.username || currentUser?.id}`}
            onItemClick={() => setSidebarOpen(false)}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} />
        </nav>

        {currentUserProfile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {currentUserProfile.avatar_url ? (
                <Image src={currentUserProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                  {getInitials(currentUserProfile.full_name || currentUser?.email || "?")}
                </div>
              )}
            </div>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm text-gray-900 truncate">{currentUserProfile.full_name || "Writer"}</div>
              <div className="text-xs text-gray-500 truncate">@{currentUserProfile.username || "writer"}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Area ── */}
      <main className="uget-main">
        {/* Header bar */}
        <header className="uget-header">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Open menu"
            >
              <HamburgerIcon />
            </button>

            {/* Logo for mobile */}
            <Link href="/" className="lg:hidden flex items-center gap-1.5" style={{ textDecoration: "none" }}>
              <Image src="/favicon.png" alt="UGET" width={24} height={24} />
              <span className="font-bold text-lg text-violet-600 font-display">UGET</span>
            </Link>

            {/* Search Input on Desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex uget-header-search">
              <SearchIcon />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full text-black placeholder-gray-400 font-sans"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <Link href="/live" className="uget-live-pill" style={{ textDecoration: "none" }}>
              <span className="uget-live-dot" />
              <span className="hidden xs:inline">Live</span>
            </Link>

            {/* Write button */}
            <Link href="/write" className="flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm" style={{ textDecoration: "none" }}>
              <WriteIcon />
              <span className="hidden sm:inline">Write</span>
            </Link>

            {/* Notification bell trigger */}
            <div className="relative notif-dropdown-trigger">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 transition-colors relative flex items-center justify-center"
                title="Notifications"
              >
                <BellIcon />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    backgroundColor: "#ef4444",
                    color: "white",
                    fontSize: 9,
                    fontWeight: "bold",
                    borderRadius: "50%",
                    width: 14,
                    height: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid #ffffff"
                  }}>
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Bell dropdown */}
              {notifDropdownOpen && (
                <div className="notif-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ right: 0, width: 320 }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <span className="font-bold text-sm text-gray-900 font-sans">Notifications</span>
                    <div className="flex gap-2.5">
                      {unreadNotifCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-violet-600 hover:text-violet-700 font-semibold font-sans">
                          Mark read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} className="text-xs text-gray-500 hover:text-gray-600 font-medium font-sans">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400 font-sans">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item.id)}
                          className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors ${item.unread ? "bg-violet-50/30" : "hover:bg-gray-50"}`}
                        >
                          <span className="text-lg flex-shrink-0">{item.icon}</span>
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

            {/* Avatar Dropdown trigger */}
            <div className="relative avatar-dropdown-trigger">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 cursor-pointer flex items-center justify-center relative focus:outline-none"
              >
                {currentUserProfile?.avatar_url ? (
                  <Image src={currentUserProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center font-sans">
                    {getInitials(currentUserProfile?.full_name || currentUser?.email || "?")}
                  </div>
                )}
              </button>

              {/* Avatar Dropdown */}
              {userDropdownOpen && (
                <div className="avatar-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ right: 0, minWidth: 240 }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {currentUserProfile?.avatar_url ? (
                        <Image src={currentUserProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                          {getInitials(currentUserProfile?.full_name || currentUser?.email || "?")}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0" style={{ flex: 1 }}>
                      <div className="font-bold text-sm text-gray-900 truncate font-sans">{currentUserProfile?.full_name || "Writer"}</div>
                      <div className="text-xs text-gray-500 truncate font-sans">{currentUser?.email}</div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link href="/write" className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans" style={{ textDecoration: "none" }} onClick={() => setUserDropdownOpen(false)}>
                      <span className="text-gray-400" style={{ display: "inline-flex", alignItems: "center" }}><WriteIcon /></span> Write
                    </Link>
                    <button onClick={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }} className="w-full text-left flex items-center gap-3.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans">
                      <span className="text-gray-400" style={{ display: "inline-flex", alignItems: "center" }}><BellIcon /></span> Notifications
                    </button>
                    <Link href="/settings" className="flex items-center gap-3.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans" style={{ textDecoration: "none" }} onClick={() => setUserDropdownOpen(false)}>
                      <span className="text-gray-400" style={{ display: "inline-flex", alignItems: "center" }}><SettingsIcon /></span> Settings
                    </Link>
                    <button onClick={() => { setUserDropdownOpen(false); alert("Need help? Please send an email to support@uget.com or check our Help Center."); }} className="w-full text-left flex items-center gap-3.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans">
                      <span className="text-gray-400" style={{ display: "inline-flex", alignItems: "center" }}><HelpIcon /></span> Help
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3.5 px-4 py-2.5 text-sm text-red-650 hover:bg-red-50 font-sans">
                      <span className="text-red-500" style={{ display: "inline-flex", alignItems: "center" }}><SignOutIcon /></span> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Profile layout grid */}
        <div className="uget-profile-grid">
          {/* Feed Column */}
          <div className="uget-profile-feed">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-sans text-gray-500 mb-6">
              <Link href="/me/following" className="hover:text-gray-900 transition-colors">
                Following
              </Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-medium">{profile.full_name}</span>
            </div>

            {/* Profile Card Header (Mobile only) */}
            <div className="uget-profile-header-card border border-gray-100 rounded-2xl p-6 md:p-8 bg-white shadow-sm mb-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {profile.avatar_url ? (
                      <Image src={profile.avatar_url} alt="" width={80} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-2xl flex items-center justify-center font-sans">
                        {getInitials(profile.full_name)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-2xl md:text-3xl text-gray-900 leading-tight">
                      {profile.full_name}
                    </h1>
                    <div className="text-sm text-gray-500 font-sans mt-1">
                      {profile.follower_count ? profile.follower_count.toLocaleString() : 0} followers
                    </div>
                  </div>
                </div>

                {/* Follow/Following trigger button */}
                <div className="relative following-dropdown-trigger flex-shrink-0">
                  {currentUser && currentUser.id === profile.id ? (
                    <Link
                      href="/settings"
                      className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-sans font-semibold rounded-full hover:bg-gray-50 transition-colors text-gray-700"
                      style={{ textDecoration: "none" }}
                    >
                      Edit profile
                    </Link>
                  ) : (
                    <>
                      {isFollowing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFollowingDropdownOpen(!followingDropdownOpen)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-sans font-semibold rounded-full hover:bg-gray-50 transition-colors text-gray-700"
                          >
                            <span>Following</span>
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleFollow}
                          className="inline-flex items-center px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-sans font-semibold rounded-full transition-colors shadow-sm"
                        >
                          Follow
                        </button>
                      )}

                      {followingDropdownOpen && (
                        <div className="following-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1 w-48">
                          <button
                            onClick={() => {
                              handleFollow();
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-sans transition-colors"
                          >
                            Unfollow
                          </button>
                          <button
                            onClick={() => {
                              showMsg(`Muted ${profile.full_name} successfully`, "ok");
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans transition-colors"
                          >
                            Mute this writer
                          </button>
                          <button
                            onClick={() => {
                              showMsg(`Blocked ${profile.full_name} successfully`, "ok");
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans transition-colors"
                          >
                            Block this writer
                          </button>
                          <button
                            onClick={() => {
                              showMsg("Reported successfully", "ok");
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans transition-colors"
                          >
                            Report profile
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-base text-gray-600 font-serif leading-relaxed pt-4 border-t border-gray-100">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Profile sub tabs */}
            <div style={{ borderBottom: "1px solid var(--border-2)", display: "flex", gap: 24, marginBottom: 28 }}>
              <button onClick={() => setActiveTab("home")} className={`profile-tab ${activeTab === "home" ? "active" : ""}`}>
                Home
              </button>
              <button onClick={() => setActiveTab("activity")} className={`profile-tab ${activeTab === "activity" ? "active" : ""}`}>
                Activity
              </button>
              <button onClick={() => setActiveTab("about")} className={`profile-tab ${activeTab === "about" ? "active" : ""}`}>
                About
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "home" && (
              <div>
                {posts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", background: "#fafafa", borderRadius: 12, border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)" }}>No stories published yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {posts.map((post) => {
                      const cat = CATEGORIES.find((c) => c.id === post.category);
                      return (
                        <article key={post.id} className="post-card" style={{ padding: "24px 0", borderBottom: "1px solid var(--border-2)" }}>
                          <div className="post-card-content">
                            <div className="post-card-meta" style={{ marginBottom: 8 }}>
                              {cat && <span className="post-card-tag">{cat.icon} {cat.label}</span>}
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                            <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                              <h2 className="post-card-title" style={{ fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>{post.title}</h2>
                              {post.excerpt && <p className="post-card-excerpt" style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>{post.excerpt}</p>}
                            </Link>
                            <div className="post-card-meta" style={{ marginTop: 8 }}>
                              <span>{post.read_time} min read</span>
                              <span>· {post.view_count} views</span>
                              <span>· {post.like_count} likes</span>
                            </div>
                          </div>
                          {post.cover_image && (
                            <Link href={`/post/${post.slug}`} className="post-card-image">
                              <Image src={post.cover_image} alt={post.title} width={200} height={134} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                            </Link>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div>
                {/* Activity Tooltip card matching Screenshot 3 */}
                {!activityDismissed && (
                  <div style={{ backgroundColor: "#292929", color: "#ffffff", borderRadius: 8, padding: 20, marginBottom: 28, position: "relative", zIndex: 10 }}>
                    <div style={{ fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
                      Check out the activity tab to see what this person has been engaging with on UGET.
                    </div>
                    <button 
                      onClick={() => setActivityDismissed(true)} 
                      style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 999, fontSize: 12, padding: "4px 12px", fontFamily: "var(--sans)", fontWeight: 600 }}
                    >
                      Okay, got it
                    </button>
                  </div>
                )}

                <div style={{ textAlign: "center", padding: "60px 0", background: "#fafafa", borderRadius: 12, border: "1px dashed var(--border)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }} className="font-sans">No recent activities</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)" }}>Actions like published posts, follows, or comments will appear here.</p>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div style={{ padding: "8px 0" }}>
                {currentUser && currentUser.id === profile.id ? (
                  <div>
                    {isEditingBio ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={bioInput}
                          onChange={(e) => setBioInput(e.target.value)}
                          placeholder="Tell the world about yourself..."
                          rows={6}
                          className="w-full border border-gray-200 rounded-xl p-4 font-serif text-base focus:outline-none focus:border-gray-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveBio}
                            disabled={savingBio}
                            className="btn btn-primary btn-sm"
                            style={{ borderRadius: 999, padding: "6px 16px" }}
                          >
                            {savingBio ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => { setIsEditingBio(false); setBioInput(profile.bio || ""); }}
                            className="btn btn-outline btn-sm"
                            style={{ borderRadius: 999, padding: "6px 16px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {profile.bio ? (
                          <div>
                            <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", whiteSpace: "pre-line", marginBottom: 20 }}>
                              {profile.bio}
                            </p>
                            <button
                              onClick={() => setIsEditingBio(true)}
                              className="text-sm font-semibold text-violet-600 hover:text-violet-700 font-sans"
                            >
                              Edit bio
                            </button>
                          </div>
                        ) : (
                          <div style={{ background: "#fafafa", borderRadius: 12, padding: 32, textAlign: "center", border: "1px dashed var(--border)" }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }} className="font-sans">Tell the world about yourself</h3>
                            <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.5 }}>
                              Here's where you can share more about yourself: your history, work experience, accomplishments, interests, dreams, and more. You can even add images and use rich text to personalize your bio.
                            </p>
                            <button
                              onClick={() => setIsEditingBio(true)}
                              className="btn btn-primary btn-sm font-sans"
                              style={{ borderRadius: 999, padding: "8px 20px" }}
                            >
                              Get started
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {profile.bio ? (
                      <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", whiteSpace: "pre-line" }}>
                        {profile.bio}
                      </p>
                    ) : (
                      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", fontStyle: "italic" }}>
                        This author hasn't shared a bio yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right profile sidebar widget */}
          <aside className="uget-profile-sidebar">
            <div className="uget-profile-avatar-lg">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={88} height={88} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-3xl flex items-center justify-center font-sans">
                  {getInitials(profile.full_name)}
                </div>
              )}
            </div>

            <h2 className="font-bold text-lg text-gray-900 font-sans mb-1">{profile.full_name}</h2>
            <p className="text-sm text-gray-500 font-sans mb-4">@{profile.username || "writer"}</p>

            {profile.bio && (
              <p className="text-sm text-gray-600 font-serif leading-relaxed mb-6" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {profile.bio}
              </p>
            )}

            {/* Follow/Edit trigger buttons */}
            <div className="mb-6">
              {currentUser && currentUser.id === profile.id ? (
                <Link
                  href="/settings"
                  className="btn btn-outline btn-sm font-sans w-full text-center"
                  style={{ borderRadius: 999, textDecoration: "none", display: "block" }}
                >
                  Edit profile
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`btn btn-sm font-sans w-full justify-center ${isFollowing ? "btn-outline" : "btn-primary"}`}
                  style={{ borderRadius: 999 }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>

            {/* User details stats */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 font-sans">Metrics</h3>
              <div className="flex flex-col gap-3 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Stories:</span>
                  <span className="font-bold text-gray-900">{posts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Followers:</span>
                  <span className="font-bold text-gray-900">{profile.follower_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Views:</span>
                  <span className="font-bold text-gray-900">{totalViews.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Likes Received:</span>
                  <span className="font-bold text-gray-900">{totalLikes.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
