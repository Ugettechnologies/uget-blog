"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import type { Post } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, WriteIcon, BellIcon, SettingsIcon, HelpIcon, SignOutIcon } from "@/components/SidebarNav";
import SafeImage from "../../components/SafeImage";

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
  const [customLists, setCustomLists] = useState<any[]>([]);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListPrivate, setNewListPrivate] = useState(true);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showMsg = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || !user) return;
    
    const newList = {
      id: Math.random().toString(36).substring(2) + "-" + Math.random().toString(36).substring(2),
      name: newListName.trim(),
      count: 0,
      private: newListPrivate,
      created_at: new Date().toISOString()
    };
    
    const updated = [...customLists, newList];
    setCustomLists(updated);
    
    const { error } = await supabase
      .from("profiles")
      .update({ custom_lists: JSON.stringify(updated) })
      .eq("id", user.id);
      
    if (error) {
      showMsg("Failed to save list to database: " + error.message, "err");
    } else {
      showMsg(`List "${newList.name}" created successfully!`, "ok");
    }
    
    setNewListName("");
    setNewListPrivate(true);
    setIsNewListModalOpen(false);
  };

  const handleDeleteList = async (id: string) => {
    if (!user) return;
    const listToDelete = customLists.find(l => l.id === id);
    const updated = customLists.filter((l) => l.id !== id);
    setCustomLists(updated);
    
    if (expandedListId === id) {
      setExpandedListId(null);
    }
    
    const { error } = await supabase
      .from("profiles")
      .update({ custom_lists: JSON.stringify(updated) })
      .eq("id", user.id);
      
    if (error) {
      showMsg("Failed to delete list from database: " + error.message, "err");
    } else if (listToDelete) {
      showMsg(`List "${listToDelete.name}" deleted successfully!`, "ok");
    }
  };

  useEffect(() => {
    if (userProfile) {
      let lists = userProfile.custom_lists;
      if (typeof lists === "string") {
        try {
          lists = JSON.parse(lists);
        } catch (e) {
          lists = [];
        }
      }
      if (!Array.isArray(lists)) {
        lists = [];
      }
      setCustomLists(lists);
    }
  }, [userProfile]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/?auth=signin");
        return;
      }
      setUser(user);

      // Fetch user profile with follower/following counts
      const [profileRes, followersRes, followingRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("follows").select("*").eq("following_id", user.id),
        supabase.from("follows").select("*").eq("follower_id", user.id),
      ]);
      const profile = profileRes.data ? {
        ...profileRes.data,
        follower_count: followersRes.data ? followersRes.data.length : 0,
        following_count: followingRes.data ? followingRes.data.length : 0
      } : null;
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
          color: var(--muted);
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

        /* Custom lists grid */
        .custom-lists-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .custom-list-card {
          background: var(--reading-list-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-list-card:hover {
          border-color: var(--brand);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        
        /* Modal dialog overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-container {
          background-color: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          width: 100%;
          max-width: 440px;
          box-shadow: var(--shadow-xl);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: var(--ink);
        }
        .modal-title {
          font-family: var(--display);
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--black);
        }
        .modal-desc {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 24px;
          line-height: 1.4;
        }
        .modal-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background-color: var(--bg);
          color: var(--ink);
          font-family: var(--sans);
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 20px;
        }
        .modal-input:focus {
          border-color: var(--brand);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .modal-btn {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-btn-cancel {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--ink);
        }
        .modal-btn-cancel:hover {
          background: var(--bg-3);
        }
        .modal-btn-confirm {
          background: linear-gradient(135deg, var(--brand) 0%, #6d28d9 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
        }
        .modal-btn-confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.3);
        }
        .modal-btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Toast notifications */
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1100;
        }
        .toast {
          background-color: var(--black);
          color: var(--bg);
          padding: 12px 24px;
          border-radius: 12px;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-success {
          border-left: 4px solid #10b981;
        }
        .toast-error {
          border-left: 4px solid #ef4444;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
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
            activePage="library"
            profileHref={`/profile/${userProfile?.username || user?.id}`}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} />
        </nav>

        {userProfile && (
          <div style={{ borderTop: "1px solid var(--border-2)", paddingTop: 16, marginTop: "auto" }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <Link href={`/profile/${userProfile?.username || user?.id}`} style={{ display: "block", flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                  {userProfile.avatar_url ? (
                    <Image src={userProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--brand-light)", color: "var(--brand)", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getInitials(userProfile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userProfile.full_name || "Writer"}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{userProfile.username || "writer"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 4 }}>
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{userProfile.following_count || 0}</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>Following</span>
              </Link>
              <div style={{ width: 1, background: "var(--border-2)", alignSelf: "stretch" }} />
              <Link href="/dashboard?tab=followers" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{userProfile.follower_count || 0}</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>Followers</span>
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
                activePage="library"
                profileHref={`/profile/${userProfile?.username || user?.id}`}
                onItemClick={() => setSidebarOpen(false)}
              />
              <SidebarFollowingList followingProfiles={followingProfiles} />
            </nav>

            {userProfile && (
              <div className="flex items-center gap-3 pt-4 mt-auto" style={{ borderTop: "1px solid var(--border-2)" }}>
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {userProfile.avatar_url ? (
                    <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full font-bold text-sm flex items-center justify-center font-sans" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                      {getInitials(userProfile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
                <div className="min-w-0" style={{ flex: 1 }}>
                  <div className="font-bold text-sm truncate font-sans" style={{ color: "var(--ink)" }}>{userProfile.full_name || "Writer"}</div>
                  <div className="text-xs truncate font-sans" style={{ color: "var(--muted)" }}>@{userProfile.username || "writer"}</div>
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
            {/* Live Indicator
            <Link href="/live" className="uget-live-pill" style={{ textDecoration: "none" }}>
              <span className="uget-live-dot" />
              <span className="hidden xs:inline">Live</span>
            </Link>
            */}

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
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} />
                ) : (
                  <span>{getInitials(userProfile?.full_name || user?.email || "?")}</span>
                )}
              </button>

              {/* Avatar Dropdown */}
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

        {/* Content area */}
        <div className="uget-content-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 42, fontWeight: 700, color: "var(--ink)", margin: 0, letterSpacing: "-0.03em" }}>
              Your library
            </h1>
            <button
              onClick={() => setIsNewListModalOpen(true)}
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
                          onClick={() => setIsNewListModalOpen(true)}
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
                    background: "var(--reading-list-bg)",
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
                      <div style={{ flex: 1, position: "relative" }}>
                        {bookmarks[0] && <SafeImage src={bookmarks[0].cover_image} alt="" fill fallbackSeed={bookmarks[0].id} />}
                      </div>
                      <div style={{ width: 28, borderLeft: "1px solid var(--border-2)", position: "relative" }}>
                        {bookmarks[1] && <SafeImage src={bookmarks[1].cover_image} alt="" fill fallbackSeed={bookmarks[1].id} />}
                      </div>
                      <div style={{ width: 28, borderLeft: "1px solid var(--border-2)", position: "relative" }}>
                        {bookmarks[2] && <SafeImage src={bookmarks[2].cover_image} alt="" fill fallbackSeed={bookmarks[2].id} />}
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
                                    <span>{post.read_time || 1} min read</span>
                                  </div>
                                </div>
                                <Link href={`/post/${post.slug}`} style={{ width: 100, height: 66, position: "relative", flexShrink: 0, borderRadius: 4, overflow: "hidden" }}>
                                  <SafeImage src={post.cover_image} alt="" fill fallbackSeed={post.id || post.slug} />
                                </Link>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Lists rendering */}
                  <div className="custom-lists-container">
                    {Array.isArray(customLists) && customLists.filter(Boolean).map((item) => {
                      const isExpanded = expandedListId === item.id;
                      return (
                        <div key={item.id}>
                          <div
                            className="custom-list-card"
                            onClick={() => setExpandedListId(isExpanded ? null : item.id)}
                            style={{ marginTop: 16 }}
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
                                {item.name}
                              </h3>

                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                                <span>0 stories</span>
                                <span>{item.private ? "🔒 Private" : "🌐 Public"}</span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              {/* Empty Cover mockup */}
                              <div style={{ display: "flex", alignItems: "center", height: 80, width: 90, borderRadius: 6, background: "var(--bg-3)", border: "1px solid var(--border-2)", flexShrink: 0, fontSize: 20, fontFamily: "var(--sans)", justifyContent: "center" }}>
                                📂
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteList(item.id);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--muted)",
                                  cursor: "pointer",
                                  padding: 8,
                                  borderRadius: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                                title="Delete list"
                              >
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 24, paddingLeft: 16 }}>
                              <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--brand)", marginBottom: 12 }}>
                                {item.name} stories:
                              </h4>
                              <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", padding: "10px 0" }}>
                                No stories in this list yet.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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

      {/* New List Modal */}
      {isNewListModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewListModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Create a new list</h3>
            <p className="modal-desc">Organize your bookmarked stories or collections under a custom list folder.</p>
            <form onSubmit={handleCreateList}>
              <input
                type="text"
                className="modal-input"
                placeholder="List name (e.g. My tech stack)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="newListPrivate"
                  checked={newListPrivate}
                  onChange={(e) => setNewListPrivate(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--brand)" }}
                />
                <label htmlFor="newListPrivate" style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", cursor: "pointer" }}>
                  Keep this list private
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => {
                    setIsNewListModalOpen(false);
                    setNewListName("");
                    setNewListPrivate(true);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-confirm"
                  disabled={!newListName.trim()}
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast System */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "err" ? "toast-error" : "toast-success"}`}>
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </div>
        </div>
      )}

    </div>
  );
}
