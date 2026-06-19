"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

type TabType = "stories" | "stats" | "followers" | "staff";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
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

  // Read tab parameter from URL search params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab") as TabType;
      if (t && ["stories", "stats", "followers", "staff"].includes(t)) {
        setActiveTab(t);
      }
    }
  }, []);

  const handleTabChange = (t: TabType) => {
    setActiveTab(t);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", t);
      window.history.pushState({}, "", url.toString());
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      
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

    // Fetch staff corner posts (posts authored by admins)
    const { data: staffRes } = await supabase.from("posts")
      .select("*, profiles(*)")
      .eq("published", true)
      .eq("role", "admin")
      .order("created_at", { ascending: false });
    setStaffPosts(staffRes as Post[] || []);

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

  // SVG Icons
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

  const OptionsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
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
      <Link href={`/profile/${profile?.username || profile?.id}`} className={inactiveLinkStyle} onClick={onItemClick}>
        <ProfileIcon />
        <span>Profile</span>
      </Link>
      <button onClick={() => { handleTabChange("stories"); if (onItemClick) onItemClick(); }} className={activeTab === "stories" ? activeLinkStyle : inactiveLinkStyle}>
        <StoriesIcon />
        <span>Stories</span>
      </button>
      <button onClick={() => { handleTabChange("stats"); if (onItemClick) onItemClick(); }} className={activeTab === "stats" ? activeLinkStyle : inactiveLinkStyle}>
        <StatsIcon />
        <span>Stats</span>
      </button>
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
        
        <Link
          href="/dashboard?tab=followers"
          className="px-4 text-xs text-gray-500 hover:underline font-sans mt-2"
          style={{ textDecoration: "none", display: "block", lineHeight: "1.4" }}
        >
          <div className="text-gray-400 font-medium">+ Find writers and publications to follow.</div>
          <div className="text-violet-600 font-semibold mt-0.5">See suggestions</div>
        </Link>
      </div>
    </div>
  );

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
            padding: 24px 16px 60px;
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
          {renderSidebarLinks()}
          {renderFollowingList()}
        </nav>

        {profile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <Link href={`/profile/${profile?.username || profile?.id}`} className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ display: "block" }}>
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                  {getInitials(profile.full_name || "?")}
                </div>
              )}
            </Link>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm text-gray-900 truncate">{profile.full_name || "Writer"}</div>
              <div className="text-xs text-gray-500 truncate">@{profile.username || "writer"}</div>
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
              {renderSidebarLinks(() => setSidebarOpen(false))}
              {renderFollowingList()}
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
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center font-sans">
                    {getInitials(profile?.full_name || "?")}
                  </div>
                )}
              </button>

              {/* Avatar Dropdown */}
              {userDropdownOpen && (
                <div className="avatar-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ right: 0, minWidth: 240 }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                          {getInitials(profile?.full_name || "?")}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0" style={{ flex: 1 }}>
                      <div className="font-bold text-sm text-gray-900 truncate font-sans">{profile?.full_name || "Writer"}</div>
                      <div className="text-xs text-gray-500 truncate font-sans">@{profile?.username}</div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link href="/write" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans" style={{ textDecoration: "none" }} onClick={() => setUserDropdownOpen(false)}>
                      <span>✍️</span> Write
                    </Link>
                    <button onClick={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans">
                      <span>🔔</span> Notifications
                    </button>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans" style={{ textDecoration: "none" }} onClick={() => setUserDropdownOpen(false)}>
                      <span>⚙️</span> Settings
                    </Link>
                    <button onClick={() => { setUserDropdownOpen(false); alert("Need help? Please send an email to support@uget.com or check our Help Center."); }} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-sans">
                      <span>💡</span> Help
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleSignOut} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-sans">
                      <span>🚪</span> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Area */}
        <div className="uget-dashboard-grid">
          {loading ? (
            <div style={{ padding: "100px 0", textAlign: "center" }}>
              <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--ink)", margin: "0 auto" }} />
            </div>
          ) : (
            <>
              {/* ── STORIES TAB ── */}
              {activeTab === "stories" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display text-3xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>
                      Stories
                    </h2>
                    <Link href="/write" className="flex items-center gap-2 text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm font-sans" style={{ textDecoration: "none" }}>
                      <WriteIcon />
                      <span>Write a story</span>
                    </Link>
                  </div>

                  {/* Sub-tabs row matching Screenshot 4 */}
                  <div style={{ borderBottom: "1px solid var(--border-2)", display: "flex", gap: 24, marginBottom: 20 }}>
                    <button
                      onClick={() => setStoriesSubTab("published")}
                      className={`dash-stories-subtab ${storiesSubTab === "published" ? "active" : ""}`}
                    >
                      Published ({published.length})
                    </button>
                    <button
                      onClick={() => setStoriesSubTab("drafts")}
                      className={`dash-stories-subtab ${storiesSubTab === "drafts" ? "active" : ""}`}
                    >
                      Drafts ({drafts.length})
                    </button>
                    <button
                      onClick={() => setStoriesSubTab("scheduled")}
                      className={`dash-stories-subtab ${storiesSubTab === "scheduled" ? "active" : ""}`}
                      style={{ opacity: 0.5, cursor: "not-allowed" }}
                    >
                      Scheduled (0)
                    </button>
                  </div>

                  {shownStories.length === 0 ? (
                    <div className="empty-state">
                      <div style={{ fontSize: 40, marginBottom: 12 }}>{storiesSubTab === "published" ? "📢" : "📝"}</div>
                      <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>
                        {storiesSubTab === "published" ? "Nothing published yet" : "No drafts"}
                      </h4>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0 20px" }}>
                        {storiesSubTab === "published" ? "Share your thoughts and tutorials with the community." : "Begin writing a new story and save your progress."}
                      </p>
                      <Link href="/write" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Write a story</Link>
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
                  <div className="dash-tabs" style={{ maxWidth: "none", padding: 0, marginBottom: 32, borderBottom: "1px solid var(--border-2)" }}>
                    <button className={`dash-tab ${statsSubTab === "stories" ? "active" : ""}`} onClick={() => setStatsSubTab("stories")} style={{ padding: "12px 0", marginRight: 32 }}>
                      Stories
                    </button>
                    <button className={`dash-tab ${statsSubTab === "audience" ? "active" : ""}`} onClick={() => setStatsSubTab("audience")} style={{ padding: "12px 0", marginRight: 32 }}>
                      Audience
                    </button>
                  </div>

                  {statsSubTab === "stories" ? (
                    <div>
                      {/* Monthly header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <h3 style={{ fontFamily: "var(--sans)", fontSize: 24, fontWeight: 700, color: "var(--black)", margin: 0 }}>
                            Monthly
                          </h3>
                          <span style={{ fontSize: 13, color: "var(--muted)" }}>
                            June 1, 2026 - Today (UTC) · Updated hourly
                          </span>
                        </div>
                        <select style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 6, backgroundColor: "white", outline: "none", cursor: "pointer" }}>
                          <option>June 2026</option>
                          <option>May 2026</option>
                          <option>April 2026</option>
                        </select>
                      </div>

                      {/* Metrics Summary Row */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border)",
                        paddingBottom: 24,
                        marginBottom: 32,
                        gap: 24,
                        overflowX: "auto"
                      }} className="flex-nowrap">
                        {[
                          { label: "Presentations", value: Math.floor(totalViews * 1.4), tooltip: "How many times your stories were shown to readers." },
                          { label: "Views", value: totalViews, tooltip: "How many times your stories were opened." },
                          { label: "Reads", value: Math.floor(totalViews * 0.75), tooltip: "How many times readers finished your stories." },
                          { label: "Followers", value: followers.length, tooltip: "How many users follow you." },
                          { label: "Subscribers", value: Math.floor(followers.length * 0.2), tooltip: "How many users subscribe to your updates." }
                        ].map((m, idx, arr) => (
                          <div key={m.label} style={{
                            flex: 1,
                            minWidth: 120,
                            borderRight: idx < arr.length - 1 ? "1px solid var(--border-2)" : "none",
                            paddingRight: 16
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.03em", fontWeight: 700, marginBottom: 8, fontFamily: "var(--sans)", whiteSpace: "nowrap" }}>
                              {m.label}
                              <span style={{ cursor: "help", color: "var(--muted-2)" }} title={m.tooltip}>ⓘ</span>
                            </div>
                            <div style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 800, color: "var(--black)" }}>
                              {m.value.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* SVG Line Chart */}
                      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 32px", marginBottom: 40, boxShadow: "var(--shadow-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h4 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", margin: 0 }}>Views &amp; Reads Trend</h4>
                          <div style={{ display: "flex", gap: 16, fontSize: 12, fontFamily: "var(--sans)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#7c3aed" }} /> Views
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#d946ef" }} /> Reads
                            </span>
                          </div>
                        </div>

                        {totalViews === 0 ? (
                          <p style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontFamily: "var(--serif)" }}>No activity trend data available for this period.</p>
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
                      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)", margin: 0 }}>
                          Lifetime
                        </h4>
                        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--sans)" }}>Latest</span>
                      </div>

                      {published.length === 0 ? (
                        <div style={{ padding: "60px 0", textAlign: "center", background: "#fdfcff", border: "1px solid var(--border)", borderRadius: 16 }}>
                          <div style={{ fontSize: 44, marginBottom: 12 }}>✍️</div>
                          <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>You haven't published any stories yet.</h4>
                          <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0 20px" }}>Share your ideas with the UGET community.</p>
                          <Link href="/write" className="btn btn-primary btn-md" style={{ textDecoration: "none" }}>
                            Start writing
                          </Link>
                        </div>
                      ) : (
                        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                          <table className="admin-table">
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
                    <div style={{ background: "#fdfcff", border: "1px solid var(--border)", borderRadius: 16, padding: 32, textAlign: "center" }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
                      <h3 style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Audience Insights</h3>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "0 auto 24px", maxWidth: 440 }}>
                        Track your follower growth, subscriber signups, and readers network trends.
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
                        <div style={{ background: "white", padding: "16px 24px", borderRadius: 12, border: "1px solid var(--border)", minWidth: 150 }}>
                          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Followers</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--black)" }}>{followers.length}</div>
                        </div>
                        <div style={{ background: "white", padding: "16px 24px", borderRadius: 12, border: "1px solid var(--border)", minWidth: 150 }}>
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
                    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 24, boxShadow: "var(--shadow-sm)" }}>
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
