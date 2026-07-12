"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, CloseIcon, SearchIcon, HamburgerIcon, WriteIcon, BellIcon, SettingsIcon, HelpIcon, SignOutIcon } from "@/components/SidebarNav";
import SafeImage from "./SafeImage";

function getAvatarGradient(name: string | null | undefined) {
  const gradients = [
    "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)", // Violet to Pink
    "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", // Blue to Violet
    "linear-gradient(135deg, #10b981 0%, #059669 100%)", // Emerald to Deep Emerald
    "linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)", // Amber to Rose
    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)", // Cyan to Blue
    "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)", // Pink to Rose
  ];
  if (!name) return gradients[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
}

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
        // Fetch current user profile with follower/following counts
        const [cProfRes, cFollowersRes, cFollowingRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("follows").select("*").eq("following_id", user.id),
          supabase.from("follows").select("*").eq("follower_id", user.id),
        ]);
        const cProf = cProfRes.data ? {
          ...cProfRes.data,
          follower_count: cFollowersRes.data ? cFollowersRes.data.length : 0,
          following_count: cFollowingRes.data ? cFollowingRes.data.length : 0,
        } : null;
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

      // Fetch follower/following counts for target profile
      const [followersRes, followingRes] = await Promise.all([
        supabase.from("follows").select("*").eq("following_id", prof.id),
        supabase.from("follows").select("*").eq("follower_id", prof.id),
      ]);
      const profWithCounts = {
        ...prof,
        follower_count: followersRes.data ? followersRes.data.length : 0,
        following_count: followingRes.data ? followingRes.data.length : 0,
      };

      setProfile(profWithCounts);
      setBioInput(profWithCounts.bio || "");

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
    
    const nextFollowerCount = isFollowing 
      ? Math.max((profile.follower_count || 0) - 1, 0)
      : (profile.follower_count || 0) + 1;
      
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profile.id);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: currentUser.id, following_id: profile.id });
      setIsFollowing(true);
    }
    
    setProfile({
      ...profile,
      follower_count: nextFollowerCount
    });
    
    // Sync the count to profiles table in Supabase
    await supabase.from("profiles")
      .update({ follower_count: nextFollowerCount })
      .eq("id", profile.id);
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
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 28px 24px;
          box-shadow: var(--shadow-md);
        }
        .uget-profile-header-card {
          display: none !important;
        }
        .uget-profile-avatar-lg {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, var(--border) 0%, var(--border-2) 100%);
          margin-bottom: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
          display: inline-block;
        }
        .uget-profile-avatar-lg:hover {
          transform: scale(1.04);
          background: linear-gradient(135deg, var(--brand) 0%, #ec4899 100%);
          box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.25), 0 8px 10px -6px rgba(124, 58, 237, 0.25);
        }
        .uget-profile-avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
          background-color: var(--bg-2);
        }
        .uget-profile-avatar-initials {
          font-family: var(--sans);
          font-weight: 800;
          font-size: 2rem;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.15);
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
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

        /* Typography */
        .uget-profile-name {
          font-family: var(--sans);
          font-size: 22px;
          font-weight: 800;
          color: var(--black);
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .uget-profile-username {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Action Buttons */
        .profile-action-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          border-radius: 999px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: 1px solid transparent;
          text-decoration: none;
        }
        .profile-action-btn-primary {
          background: linear-gradient(135deg, var(--brand) 0%, #6d28d9 100%);
          color: white !important;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
        }
        .profile-action-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }
        .profile-action-btn-secondary {
          background: var(--bg-2);
          border: 1px solid var(--border);
          color: var(--ink);
        }
        .profile-action-btn-secondary:hover {
          background: var(--bg-3);
          border-color: var(--muted-2);
          transform: translateY(-1px);
        }

        /* Metrics Grid */
        .profile-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .profile-metric-card {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .profile-metric-card:hover {
          transform: translateY(-2px);
          border-color: var(--brand);
          background: var(--brand-light);
          box-shadow: var(--shadow-sm);
        }
        .dark .profile-metric-card:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: rgba(124, 58, 237, 0.4);
        }
        .profile-metric-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          margin-bottom: 2px;
        }
        .profile-metric-value {
          font-size: 18px;
          font-weight: 800;
          color: var(--black);
          line-height: 1.2;
        }
        .profile-metric-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Icon wrapper themes */
        .metric-stories-icon {
          background-color: var(--brand-light);
          color: var(--brand);
        }
        .metric-followers-icon {
          background-color: rgba(244, 63, 94, 0.1);
          color: #f43f5e;
        }
        .dark .metric-followers-icon {
          background-color: rgba(244, 63, 94, 0.2);
          color: #fb7185;
        }
        .metric-views-icon {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .dark .metric-views-icon {
          background-color: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }
        .metric-likes-icon {
          background-color: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }
        .dark .metric-likes-icon {
          background-color: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
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
            padding: 40px 24px 60px;
          }
          .uget-profile-sidebar {
            display: none;
          }
          .uget-profile-header-card {
            display: flex !important;
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
            <Image src="/favicon.png" alt="EchoGist Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">EchoGist</span>
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
          <div style={{ borderTop: "1px solid var(--border-2)", paddingTop: 16, marginTop: "auto" }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <Link href={`/profile/${currentUserProfile?.username || currentUser?.id}`} style={{ display: "block", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                  {currentUserProfile.avatar_url ? (
                    <Image src={currentUserProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--brand-light)", color: "var(--brand)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getInitials(currentUserProfile.full_name || currentUser?.email || "?")}
                    </div>
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUserProfile.full_name || "Writer"}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{currentUserProfile.username || "writer"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 4 }}>
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{currentUserProfile.following_count || 0}</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>Following</span>
              </Link>
              <div style={{ width: 1, background: "var(--border-2)", alignSelf: "stretch" }} />
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{currentUserProfile.follower_count || 0}</span>
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
            <Image src="/favicon.png" alt="EchoGist Logo" width={32} height={32} style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 800, color: "var(--brand)", letterSpacing: "-0.02em" }}>EchoGist</span>
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
            placeholder="Search EchoGist..."
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 15, width: "100%", color: "var(--ink)", fontFamily: "var(--sans)" }}
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
            {/* Live Indicator */}
            <Link href="/live" className="uget-live-pill" style={{ textDecoration: "none" }}>
              <span className="uget-live-dot" />
              <span className="hidden xs:inline">Live</span>
            </Link>

            {/* Write button */}
            <Link href="/write" className="nav-write-btn" style={{ textDecoration: "none" }}>
              <span className="flex items-center justify-center"><WriteIcon /></span>
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
                <div className="notif-dropdown" style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.1)", zIndex: 100, width: 340, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-3)" }}>
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
                  <div style={{ maxHeight: 360, overflowY: "auto", background: "var(--bg-2)" }}>
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
                {currentUserProfile?.avatar_url ? (
                  <Image src={currentUserProfile.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                ) : (
                  <span>{getInitials(currentUserProfile?.full_name || currentUser?.email || "?")}</span>
                )}
              </button>

              {/* Avatar Dropdown */}
              <UserDropdown
                isOpen={userDropdownOpen}
                user={currentUser}
                userProfile={currentUserProfile}
                onClose={() => setUserDropdownOpen(false)}
                onOpenNotifs={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }}
                onSignOut={handleSignOut}
              />
            </div>

          </div>
        </header>

        {/* Content Profile layout grid */}
        <div className="uget-profile-grid">
          {/* Feed Column */}
          <div className="uget-profile-feed">
            {/* Breadcrumbs */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
              <Link href="/me/following" style={{ textDecoration: "none", color: "var(--muted)", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}>
                Following
              </Link>
              <span style={{ fontSize: 12, opacity: 0.5 }}>❯</span>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>{profile.full_name}</span>
            </div>

            {/* Profile Card Header (Mobile only) */}
            <div className="uget-profile-header-card" style={{ border: "1px solid var(--border)", borderRadius: 24, padding: 24, background: "var(--bg-2)", boxShadow: "var(--shadow-md)", marginBottom: 32, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="uget-profile-avatar-lg" style={{ width: 80, height: 80, padding: '2px', marginBottom: 0 }}>
                    <div className="uget-profile-avatar-inner">
                      {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt="" width={80} height={80} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      ) : (
                        <div className="uget-profile-avatar-initials" style={{ background: getAvatarGradient(profile.full_name), fontSize: '1.6rem' }}>
                          {getInitials(profile.full_name)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h1 className="uget-profile-name" style={{ fontSize: 24 }}>
                      {profile.full_name}
                    </h1>
                    <div className="uget-profile-username" style={{ marginBottom: 0 }}>
                      <span>@{profile.username || "writer"}</span>
                    </div>
                  </div>
                </div>

                {/* Follow/Following trigger button */}
                <div className="relative following-dropdown-trigger flex-shrink-0">
                  {currentUser && currentUser.id === profile.id ? (
                    <Link
                      href="/settings"
                      className="profile-action-btn profile-action-btn-secondary"
                      style={{ padding: "8px 16px", width: "auto" }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      <span>Edit profile</span>
                    </Link>
                  ) : (
                    <>
                      {isFollowing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => setFollowingDropdownOpen(!followingDropdownOpen)}
                            className="profile-action-btn profile-action-btn-secondary"
                            style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, width: "auto" }}
                          >
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>Following</span>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ opacity: 0.5 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleFollow}
                          className="profile-action-btn profile-action-btn-primary"
                          style={{ padding: "8px 20px", width: "auto" }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          <span>Follow</span>
                        </button>
                      )}

                      {followingDropdownOpen && (
                        <div className="following-dropdown absolute right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1 w-48">
                          <button
                            onClick={() => {
                              handleFollow();
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-sans transition-colors"
                          >
                            Unfollow
                          </button>
                          <button
                            onClick={() => {
                              showMsg(`Muted ${profile.full_name} successfully`, "ok");
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-sans transition-colors"
                          >
                            Mute this writer
                          </button>
                          <button
                            onClick={() => {
                              showMsg(`Blocked ${profile.full_name} successfully`, "ok");
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-sans transition-colors"
                          >
                            Block this writer
                          </button>
                          <button
                            onClick={() => {
                              showMsg("Reported successfully", "ok");
                              setFollowingDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-sans transition-colors"
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
                <p className="text-base text-gray-600 dark:text-gray-400 font-serif leading-relaxed pt-3 border-t border-gray-100 dark:border-zinc-800">
                  {profile.bio}
                </p>
              )}

              {/* Metrics Grid for Mobile View */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-sans">Metrics</h3>
                <div className="profile-metrics-grid">
                  
                  {/* Stories Card */}
                  <div className="profile-metric-card">
                    <div className="profile-metric-icon-wrapper metric-stories-icon">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                    <span className="profile-metric-value">{posts.length}</span>
                    <span className="profile-metric-label">Stories</span>
                  </div>

                  {/* Followers Card */}
                  <div className="profile-metric-card">
                    <div className="profile-metric-icon-wrapper metric-followers-icon">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                    </div>
                    <span className="profile-metric-value">{profile.follower_count || 0}</span>
                    <span className="profile-metric-label">Followers</span>
                  </div>

                  {/* Total Views Card */}
                  <div className="profile-metric-card">
                    <div className="profile-metric-icon-wrapper metric-views-icon">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="profile-metric-value">{totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}</span>
                    <span className="profile-metric-label">Views</span>
                  </div>

                  {/* Likes Received Card */}
                  <div className="profile-metric-card">
                    <div className="profile-metric-icon-wrapper metric-likes-icon">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    </div>
                    <span className="profile-metric-value">{totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}</span>
                    <span className="profile-metric-label">Likes</span>
                  </div>

                </div>
              </div>
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
                  <div style={{ textAlign: "center", padding: "60px 0", background: "var(--bg-2)", borderRadius: 12, border: "1px dashed var(--border)" }}>
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
                              {cat && <span className="post-card-tag">{cat.label}</span>}
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                            <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                              <h2 className="post-card-title" style={{ fontSize: 20, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>{post.title}</h2>
                              {post.excerpt && <p className="post-card-excerpt" style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>{post.excerpt}</p>}
                            </Link>
                            <div className="post-card-meta" style={{ marginTop: 8 }}>
                              <span>{post.read_time || 1} min read</span>
                              <span>· {post.view_count} views</span>
                              <span>· {post.like_count} likes</span>
                            </div>
                          </div>
                          <Link href={`/post/${post.slug}`} className="post-card-image">
                            <SafeImage src={post.cover_image} alt={post.title} fill fallbackSeed={post.id || post.slug} />
                          </Link>
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
                      Check out the activity tab to see what this person has been engaging with on EchoGist.
                    </div>
                    <button 
                      onClick={() => setActivityDismissed(true)} 
                      style={{ backgroundColor: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 999, fontSize: 12, padding: "4px 12px", fontFamily: "var(--sans)", fontWeight: 600 }}
                    >
                      Okay, got it
                    </button>
                  </div>
                )}

                <div style={{ textAlign: "center", padding: "60px 0", background: "var(--bg-2)", borderRadius: 12, border: "1px dashed var(--border)" }}>
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
                          <div style={{ background: "var(--bg-2)", borderRadius: 12, padding: 32, textAlign: "center", border: "1px dashed var(--border)" }}>
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
              <div className="uget-profile-avatar-inner">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <div className="uget-profile-avatar-initials" style={{ background: getAvatarGradient(profile.full_name) }}>
                    {getInitials(profile.full_name)}
                  </div>
                )}
              </div>
            </div>

            <h2 className="uget-profile-name">{profile.full_name}</h2>
            <div className="uget-profile-username">
              <span>@{profile.username || "writer"}</span>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 font-serif leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: '16px' }}>
                {profile.bio}
              </p>
            )}

            {/* Follow/Edit trigger buttons */}
            <div style={{ marginBottom: '20px' }}>
              {currentUser && currentUser.id === profile.id ? (
                <Link
                  href="/settings"
                  className="profile-action-btn profile-action-btn-secondary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                  <span>Edit profile</span>
                </Link>
              ) : (
                <button
                  onClick={handleFollow}
                  className={`profile-action-btn ${isFollowing ? "profile-action-btn-secondary" : "profile-action-btn-primary"}`}
                >
                  {isFollowing ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* User details stats */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-sans">Metrics</h3>
              <div className="profile-metrics-grid">
                
                {/* Stories Card */}
                <div className="profile-metric-card">
                  <div className="profile-metric-icon-wrapper metric-stories-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <span className="profile-metric-value">{posts.length}</span>
                  <span className="profile-metric-label">Stories</span>
                </div>

                {/* Followers Card */}
                <div className="profile-metric-card">
                  <div className="profile-metric-icon-wrapper metric-followers-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                  </div>
                  <span className="profile-metric-value">{profile.follower_count || 0}</span>
                  <span className="profile-metric-label">Followers</span>
                </div>

                {/* Total Views Card */}
                <div className="profile-metric-card">
                  <div className="profile-metric-icon-wrapper metric-views-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="profile-metric-value">{totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}</span>
                  <span className="profile-metric-label">Views</span>
                </div>

                {/* Likes Received Card */}
                <div className="profile-metric-card">
                  <div className="profile-metric-icon-wrapper metric-likes-icon">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                  </div>
                  <span className="profile-metric-value">{totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes}</span>
                  <span className="profile-metric-label">Likes</span>
                </div>

              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
