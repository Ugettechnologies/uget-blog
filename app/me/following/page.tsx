"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

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

  // Icons
  const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const LibraryIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const ProfileIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const StoriesIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const StatsIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const WriteIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );

  const BellIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const HamburgerIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const activeLinkStyle = "flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm font-semibold bg-[#f3efff] text-[#7c3aed] transition-colors";
  const inactiveLinkStyle = "flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm font-medium text-gray-500 hover:bg-[#f8f6ff] hover:text-[#7c3aed] transition-colors";

  const renderSidebarLinks = (onItemClick?: () => void) => (
    <div className="flex flex-col gap-1.5">
      <Link href="/" className={inactiveLinkStyle} onClick={onItemClick}>
        <HomeIcon />
        <span>Home</span>
      </Link>
      <Link href="/library" className={inactiveLinkStyle} onClick={onItemClick}>
        <LibraryIcon />
        <span>Library</span>
      </Link>
      <Link href={`/profile/${userProfile?.username || user?.id}`} className={inactiveLinkStyle} onClick={onItemClick}>
        <ProfileIcon />
        <span>Profile</span>
      </Link>
      <Link href="/dashboard?tab=stories" className={inactiveLinkStyle} onClick={onItemClick}>
        <StoriesIcon />
        <span>Stories</span>
      </Link>
      <Link href="/dashboard?tab=stats" className={inactiveLinkStyle} onClick={onItemClick}>
        <StatsIcon />
        <span>Stats</span>
      </Link>
    </div>
  );

  const renderFollowingList = () => (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="text-[11px] font-sans font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">
        Following
      </div>
      <div className="flex flex-col gap-2">
        {followingProfiles.length === 0 ? (
          <Link
            href="/profile/admin"
            className="flex items-center gap-3 px-4 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-sans"
            style={{ textDecoration: "none" }}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
              UG
            </div>
            <span className="truncate font-medium">UGET Staff</span>
          </Link>
        ) : (
          followingProfiles.map((prof) => (
            <Link
              key={prof.id}
              href={`/profile/${prof.username || prof.id}`}
              className="flex items-center gap-3 px-4 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-sans"
              style={{ textDecoration: "none" }}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {prof.avatar_url ? (
                  <Image src={prof.avatar_url} alt="" width={20} height={20} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-[8px] flex items-center justify-center">
                    {getInitials(prof.full_name || "?")}
                  </div>
                )}
              </div>
              <span className="truncate font-medium">{prof.full_name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="uget-layout">
      {/* Shared CSS styling */}
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
          width: 240px;
          background-color: #ffffff;
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

      {/* ── Desktop Sidebar ── */}
      <aside className="uget-sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Image src="/favicon.png" alt="UGET Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">UGET</span>
          </Link>
        </div>
        <nav style={{ flex: 1 }}>
          {renderSidebarLinks()}
          {renderFollowingList()}
        </nav>

        {userProfile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {userProfile.avatar_url ? (
                <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                  {getInitials(userProfile.full_name || "?")}
                </div>
              )}
            </div>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm text-gray-900 truncate font-sans">{userProfile.full_name || "Writer"}</div>
              <div className="text-xs text-gray-500 truncate font-sans">@{userProfile.username || "writer"}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
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
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-100 mb-6">
              <SearchIcon />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm w-full text-gray-800"
              />
            </form>
            <nav style={{ flex: 1 }}>
              {renderSidebarLinks(() => setSidebarOpen(false))}
              {renderFollowingList()}
            </nav>
          </div>
        </>
      )}

      {/* ── Main content area ── */}
      <main className="uget-main">
        {/* Header bar */}
        <header className="uget-header">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <HamburgerIcon />
            </button>
            <Link href="/" className="lg:hidden flex items-center gap-1.5" style={{ textDecoration: "none" }}>
              <Image src="/favicon.png" alt="UGET" width={24} height={24} />
              <span className="font-bold text-lg text-violet-600 font-display">UGET</span>
            </Link>
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex uget-header-search">
              <SearchIcon />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search UGET..."
                className="bg-transparent border-none outline-none text-sm w-full text-black placeholder-gray-400 font-sans"
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/live" className="uget-live-pill" style={{ textDecoration: "none" }}>
              <span className="uget-live-dot" />
              <span className="hidden xs:inline">Live</span>
            </Link>
            <Link href="/write" className="flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-700 px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm" style={{ textDecoration: "none" }}>
              <WriteIcon />
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
                <div className="notif-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ right: 0, width: 320 }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <span className="font-bold text-sm text-gray-900 font-sans">Notifications</span>
                    <div className="flex gap-2.5">
                      {unreadNotifCount > 0 && <button onClick={markAllAsRead} className="text-xs text-violet-600 font-semibold font-sans">Mark read</button>}
                      {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-xs text-gray-500 font-medium font-sans">Clear</button>}
                    </div>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400 font-sans">No notifications yet</div>
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
              <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 cursor-pointer flex items-center justify-center focus:outline-none">
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center font-sans">
                    {getInitials(userProfile?.full_name || user?.email || "?")}
                  </div>
                )}
              </button>
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
                    <Link href="/write" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans" onClick={() => setUserDropdownOpen(false)}>✍️ Write</Link>
                    <button onClick={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans">🔔 Notifications</button>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans" onClick={() => setUserDropdownOpen(false)}>⚙️ Settings</Link>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-sans">🚪 Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Console Container */}
        <div className="uget-content-container">
          <h1 style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, color: "#1a1a1a", marginBottom: 8, letterSpacing: "-0.02em" }}>
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
