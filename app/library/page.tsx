"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import type { Post } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, WriteIcon, BellIcon, SettingsIcon, HelpIcon, SignOutIcon } from "@/components/SidebarNav";

export default function LibraryPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);

  // Library specific states
  const [libraryTab, setLibraryTab] = useState<"your-lists" | "saved-lists" | "highlights" | "history" | "responses">("your-lists");
  const [bannerVisible, setBannerVisible] = useState(true);
  const [readingListExpanded, setReadingListExpanded] = useState(false);

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

      // Fetch bookmarked posts
      const { data: bookmarkData } = await supabase
        .from("bookmarks")
        .select("posts(*, profiles(*))")
        .eq("user_id", user.id);
      
      if (bookmarkData && Array.isArray(bookmarkData)) {
        setBookmarks(bookmarkData.map((b: any) => b.posts).filter(Boolean));
      }
      setLoading(false);

      // Fetch notifications & following
      loadNotifications(user.id);
      loadFollowingProfiles(user.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("uget_library_banner_dismissed");
      if (dismissed === "true") {
        setBannerVisible(false);
      }
    }
  }, []);

  const dismissBanner = () => {
    setBannerVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("uget_library_banner_dismissed", "true");
    }
  };

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

  const WriteIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  const SearchIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  const HamburgerIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="15" y2="18" />
    </svg>
  );

  const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );

  return (
    <div className="uget-layout">
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
        .uget-content-container {
          max-width: 720px;
          width: 100%;
          margin: 0 auto;
          padding: 48px 24px 80px;
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
            padding: 0 16px;
          }
          .uget-content-container {
            padding: 24px 16px 60px;
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
            activePage="library"
            profileHref={`/profile/${userProfile?.username || user?.id}`}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} />
        </nav>

        {userProfile && (
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, marginTop: "auto" }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <Link href={`/profile/${userProfile?.username || user?.id}`} style={{ display: "block", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                  {userProfile.avatar_url ? (
                    <Image src={userProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#ede9fe", color: "#7c3aed", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getInitials(userProfile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userProfile.full_name || "Writer"}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{userProfile.username || "writer"}</div>
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
      {sidebarOpen && (
        <>
          <div className="uget-mobile-drawer-overlay" onClick={() => setSidebarOpen(false)} />
          <div className="uget-mobile-drawer" style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
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
                activePage="library"
                profileHref={`/profile/${userProfile?.username || user?.id}`}
                onItemClick={() => setSidebarOpen(false)}
              />
              <SidebarFollowingList followingProfiles={followingProfiles} />
            </nav>

            {userProfile && (
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {userProfile.avatar_url ? (
                    <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                      {getInitials(userProfile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
                <div className="min-w-0" style={{ flex: 1 }}>
                  <div className="font-bold text-sm text-gray-900 truncate">{userProfile.full_name || "Writer"}</div>
                  <div className="text-xs text-gray-500 truncate">@{userProfile.username || "writer"}</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

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
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center font-sans">
                    {getInitials(userProfile?.full_name || user?.email || "?")}
                  </div>
                )}
              </button>

              {/* Avatar Dropdown */}
              {userDropdownOpen && (
                <div className="avatar-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ right: 0, minWidth: 240 }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {userProfile?.avatar_url ? (
                        <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                          {getInitials(userProfile?.full_name || user?.email || "?")}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0" style={{ flex: 1 }}>
                      <div className="font-bold text-sm text-gray-900 truncate font-sans">{userProfile?.full_name || "Writer"}</div>
                      <div className="text-xs text-gray-500 truncate font-sans">{user?.email}</div>
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

        {/* Content area */}
        <div className="uget-content-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 42, fontWeight: 700, color: "#1a1a1a", margin: 0, letterSpacing: "-0.03em" }}>
              Your library
            </h1>
            <button
              onClick={() => {
                const listName = prompt("Enter a name for your new list:");
                if (listName) {
                  alert(`List "${listName}" created successfully!`);
                }
              }}
              style={{
                backgroundColor: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: 999,
                padding: "8px 18px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--sans)",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand)")}
            >
              New list
            </button>
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border-2)", marginBottom: 32, overflowX: "auto" }}>
            {[
              { id: "your-lists", label: "Your lists" },
              { id: "saved-lists", label: "Saved lists" },
              { id: "highlights", label: "Highlights" },
              { id: "history", label: "Reading history" },
              { id: "responses", label: "Responses" }
            ].map((tab) => {
              const active = libraryTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLibraryTab(tab.id as any)}
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
              <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 16 }}>Loading library details…</p>
            </div>
          ) : (
            <div>
              {libraryTab === "your-lists" && (
                <div>
                  {/* Banner */}
                  {bannerVisible && (
                    <div style={{
                      position: "relative",
                      background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
                      borderRadius: 16,
                      padding: "24px 32px",
                      marginBottom: 32,
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      overflow: "hidden"
                    }} className="flex-col md:flex-row gap-6">
                      <button
                        onClick={dismissBanner}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "none",
                          border: "none",
                          color: "rgba(255,255,255,0.7)",
                          fontSize: 18,
                          cursor: "pointer",
                          zIndex: 10
                        }}
                        title="Dismiss banner"
                      >
                        ✕
                      </button>

                      <div style={{ zIndex: 2, flex: 1 }}>
                        <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
                          Create a list to easily organize and share stories
                        </h2>
                        <button
                          onClick={() => {
                            const name = prompt("Enter list name:");
                            if (name) alert(`List "${name}" created!`);
                          }}
                          style={{
                            background: "white",
                            color: "#7c3aed",
                            border: "none",
                            borderRadius: 999,
                            padding: "10px 24px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--sans)",
                            marginTop: 12
                          }}
                        >
                          Start a list
                        </button>
                      </div>

                      {/* Icon overlay on right */}
                      <div className="hidden md:flex" style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 36,
                        flexShrink: 0
                      }}>
                        🔖
                      </div>
                    </div>
                  )}

                  {/* Reading list card */}
                  <div style={{
                    background: "#fdfcff",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s, border-color 0.2s"
                  }}
                  className="hover:border-violet-300 hover:shadow-sm"
                  onClick={() => setReadingListExpanded(!readingListExpanded)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", background: "var(--border)" }}>
                          {userProfile?.avatar_url ? (
                            <Image src={userProfile.avatar_url} alt="" width={20} height={20} className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-[8px] flex items-center justify-center font-sans">
                              {getInitials(userProfile?.full_name || user?.email || "?")}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--sans)" }}>
                          {userProfile?.full_name || "Writer"}
                        </span>
                      </div>

                      <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--black)", margin: "0 0 8px" }}>
                        Reading list
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                        <span>{bookmarks.length === 0 ? "No stories" : `${bookmarks.length} ${bookmarks.length === 1 ? "story" : "stories"}`}</span>
                        <span>🔒 Private</span>
                      </div>
                    </div>

                    {/* Miniature card cover blocks mock */}
                    <div style={{ display: "flex", gap: 2, height: 80, width: 90, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border-2)", flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ flex: 1, background: bookmarks[0]?.cover_image ? "none" : "#f3f4f6", position: "relative" }}>
                        {bookmarks[0]?.cover_image && <Image src={bookmarks[0].cover_image} alt="" fill style={{ objectFit: "cover" }} />}
                      </div>
                      <div style={{ width: 28, background: bookmarks[1]?.cover_image ? "none" : "#e5e7eb", borderLeft: "1px solid var(--border-2)", position: "relative" }}>
                        {bookmarks[1]?.cover_image && <Image src={bookmarks[1].cover_image} alt="" fill style={{ objectFit: "cover" }} />}
                      </div>
                      <div style={{ width: 28, background: bookmarks[2]?.cover_image ? "none" : "#f3f4f6", borderLeft: "1px solid var(--border-2)", position: "relative" }}>
                        {bookmarks[2]?.cover_image && <Image src={bookmarks[2].cover_image} alt="" fill style={{ objectFit: "cover" }} />}
                      </div>
                    </div>
                  </div>

                  {/* Reading list expanded stories feed */}
                  {readingListExpanded && (
                    <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 24, paddingLeft: 16 }}>
                      <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--brand)", marginBottom: 24 }}>
                        Reading list stories:
                      </h4>

                      {bookmarks.length === 0 ? (
                        <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", padding: "20px 0" }}>
                          No stories in this list yet.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                          {bookmarks.map((post: Post) => {
                            const cat = CATEGORIES.find((c) => c.id === post.category);
                            const authorName = (post.profiles as any)?.full_name || "Writer";
                            const authorAvatar = (post.profiles as any)?.avatar_url;
                            const authorUsername = (post.profiles as any)?.username || post.author_id;

                            return (
                              <article key={post.id} className="post-card" style={{ display: "flex", gap: 24, paddingBottom: 32, borderBottom: "1px solid var(--border-2)" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <div className="post-card-author-avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
                                      {authorAvatar ? (
                                        <Image src={authorAvatar} alt="" width={20} height={20} style={{ objectFit: "cover" }} />
                                      ) : (
                                        <span>{getInitials(authorName)}</span>
                                      )}
                                    </div>
                                    <Link href={`/profile/${authorUsername}`} style={{ textDecoration: "none", fontSize: 13, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--sans)" }}>
                                      {authorName}
                                    </Link>
                                  </div>
                                  <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                                    <h2 style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700, color: "var(--black)", marginBottom: 8, lineHeight: 1.3 }}>{post.title}</h2>
                                    {post.excerpt && <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.4 }} className="truncate-2">{post.excerpt}</p>}
                                  </Link>
                                  <div className="post-card-meta" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--muted-2)", fontFamily: "var(--sans)" }}>
                                    {cat && <span style={{ background: "var(--bg-3)", padding: "2px 8px", borderRadius: 4 }}>{cat.icon} {cat.label}</span>}
                                    <span>{formatDate(post.created_at)}</span>
                                    <span>·</span>
                                    <span>{post.read_time} min read</span>
                                  </div>
                                </div>
                                {post.cover_image && (
                                  <Link href={`/post/${post.slug}`} style={{ width: 100, height: 66, position: "relative", flexShrink: 0, borderRadius: 4, overflow: "hidden" }}>
                                    <Image src={post.cover_image} alt="" fill style={{ objectFit: "cover" }} />
                                  </Link>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {libraryTab === "saved-lists" && (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No saved lists</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Lists from other writers that you save will appear here.</p>
                </div>
              )}

              {libraryTab === "highlights" && (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🖍️</div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No highlights yet</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>When you highlight text on UGET articles, they will be archived here.</p>
                </div>
              )}

              {libraryTab === "history" && (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>History is empty</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Articles you read on UGET will be logged in your reading history.</p>
                </div>
              )}

              {libraryTab === "responses" && (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>No responses yet</h3>
                  <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Your comments and responses on posts will be stored here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
