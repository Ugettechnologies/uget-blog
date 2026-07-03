"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, CloseIcon, SearchIcon, HamburgerIcon, WriteIcon, BellIcon, OptionsIcon, SettingsIcon, HelpIcon, SignOutIcon } from "@/components/SidebarNav";

type TabType = "stories" | "stats" | "followers" | "staff";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [staffPosts, setStaffPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<TabType>("stories");
  const [storiesSubTab, setStoriesSubTab] = useState<"drafts" | "published" | "scheduled" | "unlisted">("published");
  const [followSubTab, setFollowSubTab] = useState<"followers" | "following">("followers");
  const [statsSubTab, setStatsSubTab] = useState<"stories" | "audience">("stories");
  
  // Custom dropdowns and layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);
  
  // Options menu for stories
  const [activeStoryMenuId, setActiveStoryMenuId] = useState<string | null>(null);
  
  const [toast, setToast] = useState("");
  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Sync activeTab state with URL search params reactively (works for drawer/sidebar links)
  useEffect(() => {
    const t = searchParams.get("tab") as TabType;
    if (t && ["stories", "stats", "followers", "staff"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (t: TabType) => {
    setActiveTab(t);
    router.push(`/dashboard?tab=${t}`);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      setCurrentUser(user);
      
      supabase.from("profiles").select("*").eq("id", user.id).single()
        .then(({ data }) => setProfile(data));
      
      loadDashboardData(user.id);
      loadNotifications(user.id);
      loadFollowingProfiles(user.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close header dropdowns
      if (!target.closest(".avatar-dropdown-trigger") && !target.closest(".avatar-dropdown")) {
        setUserDropdownOpen(false);
      }
      if (!target.closest(".notif-dropdown-trigger") && !target.closest(".notif-dropdown")) {
        setNotifDropdownOpen(false);
      }
      // Close stories action menu
      if (!target.closest(".story-options-trigger") && !target.closest(".story-options-menu")) {
        setActiveStoryMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDashboardData = async (uid: string) => {
    setLoading(true);
    
    // Fetch stories written by user
    const { data: postsRes } = await supabase.from("posts")
      .select("*")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });
    setPosts(postsRes as Post[] || []);

    // Fetch followers & following
    const [followersRes, followingRes] = await Promise.all([
      supabase.from("follows").select("*, profiles(*)").eq("following_id", uid),
      supabase.from("follows").select("*, profiles(*)").eq("follower_id", uid)
    ]);
    setFollowers(followersRes.data || []);
    setFollowing(followingRes.data || []);

    // Fetch staff corner posts (posts authored by admins or staff)
    const { data: staffRes } = await supabase.from("posts")
      .select("*, profiles(*)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    const filteredStaffPosts = (staffRes as Post[] || []).filter(
      (p) => p.profiles?.role === "admin" || p.profiles?.role === "staff"
    );
    setStaffPosts(filteredStaffPosts);

    setLoading(false);
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
    if (!profile) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id);
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    setUnreadNotifCount(0);
  };

  const handleNotificationClick = async (id: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = async () => {
    if (!profile) return;
    await supabase.from("notifications").delete().eq("user_id", profile.id);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    await supabase.from("posts").delete().eq("id", id);
    setPosts(posts.filter((p) => p.id !== id));
    setActiveStoryMenuId(null);
    showMsg("Story deleted");
  };

  const handleTogglePublish = async (post: Post) => {
    const { data } = await supabase.from("posts").update({ published: !post.published }).eq("id", post.id).select().single();
    if (data) {
      setPosts(posts.map((p) => p.id === post.id ? data as Post : p));
      setActiveStoryMenuId(null);
      showMsg(data.published ? "Story published!" : "Moved to drafts");
    }
  };

  const copyPostLink = (post: Post) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/post/${post.slug}`);
    setActiveStoryMenuId(null);
    showMsg("Link copied to clipboard!");
  };

  const handleFollowToggle = async (targetId: string, isFollowing: boolean) => {
    if (!profile) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", profile.id).eq("following_id", targetId);
      setFollowing(following.filter((f) => f.following_id !== targetId));
      showMsg("Unfollowed successfully");
    } else {
      const { data } = await supabase.from("follows").insert({ follower_id: profile.id, following_id: targetId }).select().single();
      if (data) {
        const { data: profData } = await supabase.from("profiles").select("*").eq("id", targetId).single();
        if (profData) {
          setFollowing([...following, { ...data, following_profile: profData }]);
          showMsg("Following user");
        }
      }
    }
  };

  // Helper selectors
  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);
  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const avgReadTime = posts.length > 0 ? Math.round(posts.reduce((s, p) => s + (p.read_time || 0), 0) / posts.length) : 0;
  
  // Sort posts for SVG stats bar chart
  const chartPosts = [...posts]
    .filter(p => p.published)
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5);
  const maxViews = Math.max(...chartPosts.map(p => p.view_count || 0), 10);

  const shownStories = storiesSubTab === "published" ? published : (storiesSubTab === "drafts" ? drafts : []);

  // (Sidebar icons moved to SidebarNav.tsx)

  return (
    <div className="uget-layout">
      {/* Toast message popup */}
      {toast && (
        <div className="toast-container">
          <div className="toast toast-success font-sans">✓ {toast}</div>
        </div>
      )}

      {/* CSS Styles injection */}
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
          width: 252px;
          background-color: var(--bg);
          border-right: 1px solid var(--border);
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
        .uget-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          padding: 48px 32px 80px;
          max-width: 900px;
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
        .dash-stories-subtab {
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          padding: 10px 0;
          background: none;
          cursor: pointer;
          border-bottom: 2.5px solid transparent;
          transition: all 0.15s;
        }
        .dash-stories-subtab.active {
          color: var(--black);
          border-bottom-color: var(--black);
          font-weight: 600;
        }
        .story-row-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border-2);
          position: relative;
        }
        .story-row-wrapper:last-child {
          border-bottom: none;
        }
        .story-options-menu {
          position: absolute;
          right: 0;
          top: 50px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          z-index: 80;
          min-width: 160px;
          overflow: hidden;
          padding: 4px 0;
        }
        .story-options-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 16px;
          font-family: var(--sans);
          font-size: 13px;
          color: #4b5563;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }
        .story-options-item:hover {
          background-color: #f9fafb;
          color: #111827;
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
          .uget-dashboard-grid {
            padding: 40px 24px 60px;
          }
          .uget-header {
            padding: 0 24px;
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
            activePage={activeTab === "stories" ? "stories" : activeTab === "stats" ? "stats" : "stories"}
            profileHref={`/profile/${profile?.username || profile?.id}`}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} />
        </nav>

        {profile && (
          <div style={{ borderTop: "1px solid var(--border-2)", paddingTop: 16, marginTop: "auto" }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <Link href={`/profile/${profile?.username || profile?.id}`} style={{ display: "block", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--brand-light)", color: "var(--brand)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getInitials(profile.full_name || "?")}
                    </div>
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.full_name || "Writer"}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{profile.username || "writer"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 4 }}>
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{following.length}</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>Following</span>
              </Link>
              <div style={{ width: 1, background: "var(--border-2)", alignSelf: "stretch" }} />
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{followers.length}</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>Followers</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} onClick={() => setSidebarOpen(false)}>
            <Image src="/favicon.png" alt="UGET Logo" width={32} height={32} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 800, color: "var(--brand)", letterSpacing: "-0.02em" }}>UGET</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} style={{ padding: 8, background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-3)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <CloseIcon />
          </button>
        </div>

        {/* Mobile search bar in drawer */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-2)", borderRadius: 999, padding: "12px 16px", border: "1px solid var(--border-2)", marginBottom: 32 }}>
          <span style={{ color: "var(--muted)", display: "flex" }}><SearchIcon /></span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search UGET..."
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 15, width: "100%", color: "var(--ink)", fontFamily: "var(--sans)" }}
          />
        </form>

        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage={activeTab === "stories" ? "stories" : activeTab === "stats" ? "stats" : "stories"}
            profileHref={`/profile/${profile?.username || profile?.id}`}
            onItemClick={() => setSidebarOpen(false)}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} />
        </nav>

        {profile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                  {getInitials(profile.full_name || "?")}
                </div>
              )}
            </div>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm text-gray-900 truncate">{profile.full_name || "Writer"}</div>
              <div className="text-xs text-gray-500 truncate">@{profile.username || "writer"}</div>
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
          </div>

          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <Link href="/live" className="uget-live-pill" style={{ textDecoration: "none" }}>
              <span className="uget-live-dot" />
              <span className="hidden xs:inline">Live</span>
            </Link>

            {/* Write button */}
            <Link href="/write" className="nav-write-btn">
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><WriteIcon /></span>
              <span className="nav-write-btn-text">Write</span>
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
                className="nav-avatar"
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                ) : (
                  <span>{getInitials(profile?.full_name || currentUser?.email || "?")}</span>
                )}
              </button>

              {/* Avatar Dropdown */}
              <UserDropdown
                isOpen={userDropdownOpen}
                user={{ email: currentUser?.email || "", id: currentUser?.id || profile?.id || "" }}
                userProfile={profile}
                onClose={() => setUserDropdownOpen(false)}
                onOpenNotifs={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }}
                onSignOut={handleSignOut}
              />
            </div>

          </div>
        </header>

        {/* Content Area */}
        <div className="w-full max-w-full overflow-hidden py-6 box-border" style={{ paddingLeft: "max(24px, 5vw)", paddingRight: "max(24px, 5vw)", boxSizing: "border-box" }}>
          {loading ? (
            <div style={{ padding: "100px 0", textAlign: "center" }}>
              <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--ink)", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* ── STORIES TAB ── */}
              {activeTab === "stories" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                    <h2 style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 800, color: "var(--black)", letterSpacing: "-0.02em", margin: 0 }}>
                      Your stories
                    </h2>
                    <Link href="/write" className="btn btn-primary btn-sm" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 20px" }}>
                      <WriteIcon />
                      <span style={{ fontWeight: 600 }}>Write a story</span>
                    </Link>
                  </div>

                  {/* Sub-tabs row matching Screenshot 4 */}
                  <div style={{ display: "flex", gap: 16, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
                    <button
                      onClick={() => setStoriesSubTab("published")}
                      style={{ padding: "10px 20px", borderRadius: 999, fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s", background: storiesSubTab === "published" ? "var(--ink)" : "var(--bg-3)", color: storiesSubTab === "published" ? "var(--bg)" : "var(--muted)", border: "1px solid", borderColor: storiesSubTab === "published" ? "var(--ink)" : "var(--border-2)", cursor: "pointer" }}
                    >
                      Published <span style={{ opacity: 0.7, marginLeft: 4 }}>{published.length}</span>
                    </button>
                    <button
                      onClick={() => setStoriesSubTab("drafts")}
                      style={{ padding: "10px 20px", borderRadius: 999, fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s", background: storiesSubTab === "drafts" ? "var(--ink)" : "var(--bg-3)", color: storiesSubTab === "drafts" ? "var(--bg)" : "var(--muted)", border: "1px solid", borderColor: storiesSubTab === "drafts" ? "var(--ink)" : "var(--border-2)", cursor: "pointer" }}
                    >
                      Drafts <span style={{ opacity: 0.7, marginLeft: 4 }}>{drafts.length}</span>
                    </button>
                    <button
                      onClick={() => setStoriesSubTab("scheduled")}
                      style={{ padding: "10px 20px", borderRadius: 999, fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s", background: storiesSubTab === "scheduled" ? "var(--ink)" : "var(--bg-3)", color: storiesSubTab === "scheduled" ? "var(--bg)" : "var(--muted)", border: "1px solid", borderColor: storiesSubTab === "scheduled" ? "var(--ink)" : "var(--border-2)", cursor: "not-allowed", opacity: 0.6 }}
                    >
                      Scheduled <span style={{ opacity: 0.7, marginLeft: 4 }}>0</span>
                    </button>
                  </div>

                  {shownStories.length === 0 ? (
                    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 24, padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                      <div style={{ width: 80, height: 80, background: "#f5f3ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, color: "var(--brand)" }}>
                        {storiesSubTab === "published" ? (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        ) : (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        )}
                      </div>
                      <h4 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)", margin: "0 0 12px 0" }}>
                        {storiesSubTab === "published" ? "Nothing published yet" : "No drafts in progress"}
                      </h4>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--muted)", margin: "0 0 32px 0", maxWidth: 400, lineHeight: 1.5 }}>
                        {storiesSubTab === "published" ? "Ready to share your ideas? Start writing your first story today and publish it to the community." : "Every great story starts with a draft. Begin writing and your progress will be saved here."}
                      </p>
                      <Link href="/write" className="btn btn-primary" style={{ textDecoration: "none", padding: "14px 32px", fontSize: 16, borderRadius: 999, fontWeight: 600, display: "inline-block" }}>
                        Start writing
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {shownStories.map((post) => {
                        const cat = CATEGORIES.find((c) => c.id === post.category);
                        return (
                          <div key={post.id} className="story-row-wrapper">
                            <div className="post-thumb">
                              {post.cover_image ? (
                                <Image src={post.cover_image} alt="" width={80} height={60} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              ) : (
                                <span style={{ fontSize: 22 }}>{cat?.icon || "📝"}</span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: post.published ? "var(--accent-bg)" : "var(--bg-3)", color: post.published ? "var(--accent-hover)" : "var(--muted)" }}>
                                  {post.published ? "Published" : "Draft"}
                                </span>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(post.created_at)}</span>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>· {post.read_time} min read</span>
                              </div>
                              <Link href={`/post/${post.slug}`} style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {post.title}
                              </Link>
                              <div style={{ display: "flex", gap: 12, marginTop: 6, color: "var(--muted-2)" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><span style={{ fontSize: 14 }}>👁</span> {post.view_count || 0} views</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><span style={{ fontSize: 12 }}>💖</span> {post.like_count || 0} likes</span>
                              </div>
                            </div>

                            {/* Dropdown Options menu triggers */}
                            <div className="relative story-options-trigger">
                              <button
                                onClick={() => setActiveStoryMenuId(activeStoryMenuId === post.id ? null : post.id)}
                                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                              >
                                <OptionsIcon />
                              </button>

                              {activeStoryMenuId === post.id && (
                                <div className="story-options-menu">
                                  <button onClick={() => copyPostLink(post)} className="story-options-item">
                                    Copy link
                                  </button>
                                  <Link href={`/write/${post.id}`} className="story-options-item">
                                    Edit story
                                  </Link>
                                  <button onClick={() => handleTogglePublish(post)} className="story-options-item">
                                    {post.published ? "Unpublish story" : "Publish story"}
                                  </button>
                                  <button onClick={() => handleDelete(post.id)} className="story-options-item" style={{ color: "var(--red)" }}>
                                    Delete story
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STATS TAB ── */}
              {activeTab === "stats" && (
                <div>
                  <div style={{ marginBottom: 24 }}>
                    <h2 className="font-display text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em", marginBottom: 6 }}>
                      Stats
                    </h2>
                  </div>

                  {/* Stats Sub-tabs */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 32, overflowX: "auto", paddingBottom: 8 }}>
                    <button 
                      style={{ padding: "10px 20px", borderRadius: 999, fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", transition: "background 0.2s, color 0.2s", background: statsSubTab === "stories" ? "var(--ink)" : "var(--bg-3)", color: statsSubTab === "stories" ? "var(--bg)" : "var(--muted)", border: "none", cursor: "pointer" }}
                      onClick={() => setStatsSubTab("stories")}
                    >
                      Stories
                    </button>
                    <button 
                      style={{ padding: "10px 20px", borderRadius: 999, fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", transition: "background 0.2s, color 0.2s", background: statsSubTab === "audience" ? "var(--ink)" : "var(--bg-3)", color: statsSubTab === "audience" ? "var(--bg)" : "var(--muted)", border: "none", cursor: "pointer" }}
                      onClick={() => setStatsSubTab("audience")}
                    >
                      Audience
                    </button>
                  </div>

                  {statsSubTab === "stories" ? (
                    <div>
                      {/* Monthly header */}
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <h3 style={{ fontFamily: "var(--sans)", fontSize: 24, fontWeight: 700, color: "var(--black)", margin: 0 }}>
                            Monthly
                          </h3>
                          <span style={{ fontSize: 13, color: "var(--muted)" }}>
                            June 1, 2026 - Today (UTC) · Updated hourly
                          </span>
                        </div>
                        <select style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--ink)", padding: "8px 16px", border: "1px solid var(--border)", borderRadius: 12, backgroundColor: "white", outline: "none", cursor: "pointer", width: "100%", maxWidth: 200 }}>
                          <option>June 2026</option>
                          <option>May 2026</option>
                          <option>April 2026</option>
                        </select>
                      </div>

                      {/* Metrics Summary Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 40 }}>
                        {[
                          { label: "Presentations", value: Math.floor(totalViews * 1.4), tooltip: "How many times your stories were shown to readers." },
                          { label: "Views", value: totalViews, tooltip: "How many times your stories were opened." },
                          { label: "Reads", value: Math.floor(totalViews * 0.75), tooltip: "How many times readers finished your stories." },
                          { label: "Followers", value: followers.length, tooltip: "How many users follow you." },
                          { label: "Subscribers", value: Math.floor(followers.length * 0.2), tooltip: "How many users subscribe to your updates." }
                        ].map((m, idx) => (
                          <div key={m.label} style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 12, fontFamily: "var(--sans)" }}>
                              {m.label}
                              <span style={{ cursor: "help", color: "var(--border)" }} title={m.tooltip}>ⓘ</span>
                            </div>
                            <div style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 800, color: "var(--black)" }}>
                              {m.value.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* SVG Line Chart */}
                      <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 16, padding: "24px", marginBottom: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)", width: "100%", overflow: "hidden", boxSizing: "border-box" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
                          <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", margin: 0 }}>Views &amp; Reads Trend</h4>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, fontFamily: "var(--sans)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontWeight: 500 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "var(--primary)" }} /> Views
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontWeight: 500 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#d946ef" }} /> Reads
                            </span>
                          </div>
                        </div>

                        {totalViews === 0 ? (
                          <div style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                            <div style={{ width: 64, height: 64, background: "#f9fafb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                            </div>
                            <p style={{ color: "var(--muted)", fontFamily: "var(--serif)", fontSize: 15, maxWidth: 250, margin: 0 }}>No activity trend data available for this period.</p>
                          </div>
                        ) : (
                          <div style={{ position: "relative", width: "100%", height: 200 }}>
                            <svg viewBox="0 0 800 200" width="100%" height="200" style={{ overflow: "visible" }}>
                              {/* Grid lines */}
                              {[20, 65, 110, 155].map((y) => (
                                <line key={y} x1="40" y1={y} x2="760" y2={y} stroke="var(--border-2)" strokeDasharray="4 4" />
                              ))}
                              <line x1="40" y1="155" x2="760" y2="155" stroke="var(--border)" strokeWidth="1.5" />

                              {/* Daily trend mock lines */}
                              {(() => {
                                const baseVal = totalViews / 15;
                                const viewsData = [0.3, 0.7, 1.2, 0.9, 1.8, 1.5, 0.6, 1.1, 1.4, 2.2, 1.7, 0.9, 1.3, 1.6, 0.8].map(m => baseVal * m);
                                const maxVal = Math.max(...viewsData, 10);
                                
                                // Coordinates mapping
                                const getX = (idx: number) => 40 + idx * (720 / 14);
                                const getY = (val: number) => 155 - (val / maxVal) * 125;

                                const viewsPoints = viewsData.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
                                const readsPoints = viewsData.map((v, i) => `${getX(i)},${getY(v * 0.75)}`).join(" ");

                                return (
                                  <>
                                    {/* Views Path */}
                                    <polyline fill="none" stroke="#7c3aed" strokeWidth="2.5" points={viewsPoints} strokeLinecap="round" strokeLinejoin="round" />
                                    {/* Reads Path */}
                                    <polyline fill="none" stroke="#d946ef" strokeWidth="2.5" points={readsPoints} strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Data dots */}
                                    {viewsData.map((v, idx) => (
                                      <g key={`dots-${idx}`}>
                                        <circle cx={getX(idx)} cy={getY(v)} r="4" fill="#7c3aed" stroke="white" strokeWidth="1.5" style={{ cursor: "pointer" }} />
                                        <circle cx={getX(idx)} cy={getY(v * 0.75)} r="4" fill="#d946ef" stroke="white" strokeWidth="1.5" style={{ cursor: "pointer" }} />
                                      </g>
                                    ))}
                                  </>
                                );
                              })()}

                              {/* X Axis Labels */}
                              <text x="40" y="178" textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--sans)" }}>Jun 1</text>
                              <text x="400" y="178" textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--sans)" }}>Jun 8</text>
                              <text x="760" y="178" textAnchor="middle" style={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--sans)" }}>Jun 15</text>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Lifetime Story Table */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, borderBottom: "2px solid var(--border-2)", paddingBottom: 16 }}>
                        <h4 style={{ fontFamily: "var(--sans)", fontSize: 24, fontWeight: 800, color: "var(--black)", margin: 0, letterSpacing: "-0.02em" }}>
                          Lifetime performance
                        </h4>
                        <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)", fontWeight: 500, background: "var(--bg-2)", padding: "4px 12px", borderRadius: 999 }}>Latest to oldest</span>
                      </div>

                      {published.length === 0 ? (
                        <div style={{ background: "linear-gradient(180deg, #fafafa 0%, #ffffff 100%)", border: "1px solid var(--border-2)", borderRadius: 16, padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: 40 }}>
                          <div style={{ fontSize: 48, marginBottom: 20, textShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>✍️</div>
                          <h4 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", margin: "0 0 8px 0" }}>You haven't published any stories yet</h4>
                          <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", margin: "0 0 32px 0", maxWidth: 400 }}>Share your ideas, tutorials, and stories with the growing UGET community.</p>
                          <Link href="/write" style={{ background: "var(--primary)", color: "white", fontFamily: "var(--sans)", fontSize: 15, fontWeight: 600, padding: "12px 32px", borderRadius: 999, textDecoration: "none", transition: "background 0.2s", display: "inline-block" }}>
                            Start writing
                          </Link>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm w-full no-scrollbar">
                          <table className="admin-table w-full min-w-[600px]">
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", paddingLeft: 24 }}>Story</th>
                                <th style={{ textAlign: "right" }}>Presentations <span style={{ cursor: "help", color: "var(--muted-2)" }} title="How many times your story card was displayed to users">ⓘ</span></th>
                                <th style={{ textAlign: "right" }}>Views</th>
                                <th style={{ textAlign: "right", paddingRight: 24 }}>Reads</th>
                              </tr>
                            </thead>
                            <tbody>
                              {published.map((p) => {
                                const views = p.view_count || 0;
                                const presentations = Math.floor(views * 1.4);
                                const reads = Math.floor(views * 0.75);
                                return (
                                  <tr key={p.id}>
                                    <td style={{ textAlign: "left", paddingLeft: 24, paddingRight: 16, paddingTop: 16, paddingBottom: 16 }}>
                                      <Link href={`/post/${p.slug}`} style={{ fontWeight: 600, color: "var(--black)", textDecoration: "none", fontSize: 15 }}>
                                        {p.title}
                                      </Link>
                                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                                        {formatDate(p.created_at)} · {p.read_time} min read
                                      </div>
                                    </td>
                                    <td style={{ fontWeight: 500, textAlign: "right" }}>{presentations.toLocaleString()}</td>
                                    <td style={{ fontWeight: 500, textAlign: "right" }}>{views.toLocaleString()}</td>
                                    <td style={{ fontWeight: 500, textAlign: "right", paddingRight: 24 }}>{reads.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Audience stats tab content */
                    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, textAlign: "center" }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
                      <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Audience Insights</h3>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "0 auto 24px", maxWidth: 440 }}>
                        Track your follower growth, subscriber signups, and readers network trends.
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
                        <div style={{ background: "var(--bg)", padding: "16px 24px", borderRadius: 12, border: "1px solid var(--border)", minWidth: 150 }}>
                          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Followers</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--black)" }}>{followers.length}</div>
                        </div>
                        <div style={{ background: "var(--bg)", padding: "16px 24px", borderRadius: 12, border: "1px solid var(--border)", minWidth: 150 }}>
                          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Subscribers</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--black)" }}>{Math.floor(followers.length * 0.2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── FOLLOWERS TAB ── */}
              {activeTab === "followers" && (
                <div>
                  <div style={{ marginBottom: 28 }}>
                    <h2 className="font-display text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em", marginBottom: 6 }}>
                      Social Network
                    </h2>
                    <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>Follow writers and build your readership audience.</p>
                  </div>

                  <div className="dash-tabs" style={{ maxWidth: "none", padding: 0, marginBottom: 24, borderBottom: "1px solid var(--border-2)" }}>
                    <button className={`dash-tab ${followSubTab === "followers" ? "active" : ""}`} onClick={() => setFollowSubTab("followers")} style={{ padding: "12px 0", marginRight: 32 }}>
                      Followers ({followers.length})
                    </button>
                    <button className={`dash-tab ${followSubTab === "following" ? "active" : ""}`} onClick={() => setFollowSubTab("following")} style={{ padding: "12px 0", marginRight: 32 }}>
                      Following ({following.length})
                    </button>
                  </div>

                  {followSubTab === "followers" ? (
                    followers.length === 0 ? (
                      <div className="empty-state">
                        <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                        <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>No followers yet</h4>
                        <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0 20px" }}>Publish high quality content to attract followers.</p>
                      </div>
                    ) : (
                      followers.map((f) => {
                        const prof = f.follower_profile || f.profiles;
                        if (!prof) return null;
                        const isFollowingBack = following.some((fol) => fol.following_id === prof.id);
                        return (
                          <div key={f.id} className="dash-post-row" style={{ alignItems: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", overflow: "hidden", justifyContent: "center" }}>
                              {prof.avatar_url ? <Image src={prof.avatar_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} /> : getInitials(prof.full_name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`/profile/${prof.username || prof.id}`} style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--black)", textDecoration: "none" }}>{prof.full_name}</Link>
                              <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>@{prof.username || "writer"}</div>
                            </div>
                            <button
                              onClick={() => handleFollowToggle(prof.id, isFollowingBack)}
                              className={`btn btn-sm ${isFollowingBack ? "btn-outline" : "btn-primary"}`}
                              style={{ borderRadius: 999 }}
                            >
                              {isFollowingBack ? "Following" : "Follow back"}
                            </button>
                          </div>
                        );
                      })
                    )
                  ) : (
                    following.length === 0 ? (
                      <div className="empty-state">
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                        <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>Not following anyone yet</h4>
                        <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0 20px" }}>Follow authors whose writing you enjoy.</p>
                        <Link href="/" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Discover writers</Link>
                      </div>
                    ) : (
                      following.map((f) => {
                        const prof = f.following_profile || f.profiles;
                        if (!prof) return null;
                        return (
                          <div key={f.id} className="dash-post-row" style={{ alignItems: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", overflow: "hidden", justifyContent: "center" }}>
                              {prof.avatar_url ? <Image src={prof.avatar_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} /> : getInitials(prof.full_name)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`/profile/${prof.username || prof.id}`} style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--black)", textDecoration: "none" }}>{prof.full_name}</Link>
                              <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>@{prof.username || "writer"}</div>
                            </div>
                            <button
                              onClick={() => handleFollowToggle(prof.id, true)}
                              className="btn btn-outline btn-sm"
                              style={{ borderRadius: 999 }}
                            >
                              Following
                            </button>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              )}

              {/* ── STAFF CORNER TAB ── */}
              {activeTab === "staff" && (
                <div className="staff-layout">
                  {/* Posts feed */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ marginBottom: 24, borderBottom: "1px solid var(--border-2)", paddingBottom: 16 }}>
                      <h2 className="font-display text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em", marginBottom: 6 }}>UGET Staff Corner</h2>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>Official announcements, writing advice, and staff picks.</p>
                    </div>

                    {staffPosts.length === 0 ? (
                      <div className="empty-state">
                        <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
                        <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>No staff writeups yet</h4>
                        <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0" }}>Check back later for official announcements and guides.</p>
                      </div>
                    ) : (
                      staffPosts.map((post) => {
                        const author = post.profiles as any;
                        const cat = CATEGORIES.find((c) => c.id === post.category);
                        return (
                          <article key={post.id} className="dash-post-row" style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "24px 0" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", overflow: "hidden", justifyContent: "center" }}>
                                  {author?.avatar_url ? <Image src={author.avatar_url} alt="" width={24} height={24} style={{ objectFit: "cover" }} /> : getInitials(author?.full_name)}
                                </div>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--black)" }}>{author?.full_name || "UGET Staff"}</span>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, background: "var(--accent-bg)", color: "var(--accent-hover)", padding: "2px 6px", borderRadius: 4 }}>STAFF</span>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>· {formatDate(post.created_at)}</span>
                              </div>
                              <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                                <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", margin: "4px 0 8px" }}>{post.title}</h3>
                                {post.excerpt && <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.excerpt}</p>}
                              </Link>
                              <div style={{ display: "flex", gap: 12, marginTop: 8, color: "var(--muted-2)", fontSize: 12 }}>
                                <span>{post.read_time} min read</span>
                                {cat && <span>· {cat.icon} {cat.label}</span>}
                              </div>
                            </div>
                            {post.cover_image && (
                              <Link href={`/post/${post.slug}`} style={{ width: 90, height: 90, borderRadius: 6, overflow: "hidden", flexShrink: 0, display: "block" }}>
                                <Image src={post.cover_image} alt="" width={90} height={90} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              </Link>
                            )}
                          </article>
                        );
                      })
                    )}
                  </div>

                  {/* Editorial Guidelines Panel */}
                  <aside className="staff-panel">
                    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-sm)" }}>
                      <h3 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 12 }}>UGET Writer Guild</h3>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                        Welcome to the UGET Writer Guild. Review these basic rules and guidelines to ensure your articles qualify for promotion in the Staff Picks feed.
                      </p>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                          { title: "Content Policy", desc: "Respect intellectual property and avoid plagiarism." },
                          { title: "Format & Layout", desc: "Use headers, bolding, and code snippets correctly." },
                          { title: "Readability Tips", desc: "Keep paragraphs short and explain complex jargon." }
                        ].map((g) => (
                          <div key={g.title} style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 10 }}>
                            <strong style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink)", display: "block" }}>{g.title}</strong>
                            <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>{g.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
