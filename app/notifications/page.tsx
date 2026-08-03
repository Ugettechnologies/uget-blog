"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import { getInitials } from "@/lib/types";
import {
  SidebarNav,
  SidebarFollowingList,
  WriteIcon,
  BellIcon,
  SearchIcon,
  HamburgerIcon,
  CloseIcon,
  NavNotificationButton,
} from "@/components/SidebarNav";

type FilterTab = "all" | "unread" | "stories" | "social";

interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  content: string;
  read: boolean;
  created_at: string;
  actor_id?: string;
  post_id?: string;
  actor_profile?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
    username?: string;
  };
  posts?: {
    id: string;
    slug?: string;
    title?: string;
  };
  icon?: string;
  text?: string;
  time?: string;
  unread?: boolean;
}

// ── Shared Icons ──
const HeartIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#0284c7">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

const UserPlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const StoryBookIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CheckAllIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 7 17l-5-5" />
    <path d="m22 10-7.5 7.5L13 16" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SlidersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export default function NotificationsPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchInput, setSearchInput] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCollapsed = localStorage.getItem("uget_sidebar_collapsed") === "true";
      if (isCollapsed) {
        document.documentElement.classList.add("sidebar-collapsed");
      }
    }

    async function initUser() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              loadUserProfile(data.user.id);
              loadNotifications(data.user.id);
              loadFollowing(data.user.id);
              return;
            }
          }
          setLoading(false);
          return;
        }

        setUser(currentUser);
        loadUserProfile(currentUser.id);
        loadNotifications(currentUser.id);
        loadFollowing(currentUser.id);
      } catch (err) {
        console.error("Error fetching user session:", err);
        setLoading(false);
      }
    }

    initUser();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setUserProfile(data);
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  const loadNotifications = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor_profile:profiles(*), posts:posts(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
      }

      if (data) {
        const formatted = (data as any[]).map((n) => {
          const actor = n.actor_profile || n.profiles;
          const post = n.posts;

          return {
            ...n,
            actor_profile: actor,
            posts: post,
            unread: !n.read,
            time: formatRelativeTime(n.created_at),
          };
        });

        setNotifications(formatted);
      }
    } catch (err) {
      console.error("Exception loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("following_id, following_profile:profiles(*)")
        .eq("follower_id", userId)
        .limit(5);
      if (data) {
        setFollowingProfiles(
          data.map((f: any) => f.following_profile).filter(Boolean)
        );
      }
    } catch (err) {
      console.error("Error loading following profiles:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, unread: false })));
      showToast("All notifications marked as read");
    } catch (err) {
      console.error("Failed to mark all read:", err);
      showToast("Failed to mark notifications as read", "err");
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await supabase.from("notifications").delete().eq("user_id", user.id);
      setNotifications([]);
      showToast("All notifications cleared");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      showToast("Failed to clear notifications", "err");
    }
  };

  const toggleReadStatus = async (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    const newRead = !item.read;
    try {
      await supabase
        .from("notifications")
        .update({ read: newRead })
        .eq("id", item.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: newRead, unread: !newRead } : n))
      );
      showToast(newRead ? "Marked as read" : "Marked as unread");
    } catch (err) {
      console.error("Error toggling read status:", err);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await supabase.from("notifications").delete().eq("id", id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notification removed");
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", item.id);

        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true, unread: false } : n))
        );
      } catch (err) {
        console.error("Failed marking notification read on click:", err);
      }
    }

    const actor = item.actor_profile;
    const post = item.posts;

    if (item.type === "follow" && actor?.username) {
      router.push(`/profile/${actor.username}`);
    } else if (item.type === "follow" && item.actor_id) {
      router.push(`/profile/${item.actor_id}`);
    } else if (post?.slug) {
      router.push(`/post/${post.slug}`);
    } else if (item.post_id) {
      router.push(`/post/${item.post_id}`);
    } else if (actor?.username) {
      router.push(`/profile/${actor.username}`);
    } else {
      showToast("Notification opened");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const storiesCount = notifications.filter(
    (n) => n.type === "post" || n.type === "comment" || n.type === "like" || n.type === "publish"
  ).length;
  const socialCount = notifications.filter((n) => n.type === "follow").length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.read;
    if (activeTab === "stories")
      return (
        item.type === "post" ||
        item.type === "comment" ||
        item.type === "like" ||
        item.type === "publish"
      );
    if (activeTab === "social") return item.type === "follow";
    return true;
  });

  function formatRelativeTime(dateStr: string) {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const getFormattedContent = (item: NotificationItem) => {
    const actor = item.actor_profile;
    const post = item.posts;
    const actorName = actor?.full_name || actor?.username || "Someone";
    const postTitle = post?.title || "";

    let actionText = "";
    let iconComponent = <StoryBookIcon />;

    switch (item.type) {
      case "like":
        actionText = "liked your story";
        iconComponent = <HeartIcon />;
        break;
      case "comment":
        actionText = "commented on your story";
        iconComponent = <CommentIcon />;
        break;
      case "follow":
        actionText = "started following you";
        iconComponent = <UserPlusIcon />;
        break;
      case "publish":
      case "post":
        actionText = "published a new story";
        iconComponent = <StoryBookIcon />;
        break;
      default: {
        let raw = item.content || "";
        if (raw.toLowerCase().startsWith(actorName.toLowerCase())) {
          raw = raw.slice(actorName.length).trim();
        }
        if (postTitle && raw.includes(postTitle)) {
          raw = raw
            .replace(`: "${postTitle}"`, "")
            .replace(`"${postTitle}"`, "")
            .replace(postTitle, "")
            .trim();
        }
        actionText = raw || "sent you an update";
        break;
      }
    }

    return {
      actorName,
      actionText,
      postTitle,
      iconComponent,
    };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    router.push("/");
  };

  return (
    <div className="uget-layout">
      {/* ── Direct CSS Styles (Zero Tailwind Conflicts, Full Theme Variable Alignment) ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .uget-layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg);
          color: var(--ink);
          font-family: var(--sans);
        }
        .uget-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 252px;
          background-color: var(--bg-2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 28px 14px 24px;
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
          display: flex;
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
        .uget-content-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 40px;
          padding: 36px 32px 80px;
          max-width: 1140px;
          width: 100%;
          margin: 0 auto;
        }
        .uget-feed-column {
          min-width: 0;
        }
        .uget-right-sidebar {
          position: sticky;
          top: 88px;
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ── Tabs Bar ── */
        .notif-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .notif-tabs::-webkit-scrollbar { display: none; }
        .notif-tab {
          font-family: var(--sans) !important;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          padding: 10px 16px 14px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .notif-tab:hover {
          color: var(--ink);
        }
        .notif-tab.active {
          color: var(--brand);
          border-bottom-color: var(--brand);
          font-weight: 700;
        }
        .notif-tab-badge {
          font-family: var(--sans) !important;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
          background: var(--bg-3);
          color: var(--muted);
        }
        .notif-tab.active .notif-tab-badge {
          background: var(--brand-light);
          color: var(--brand);
        }

        /* ── Notification Card ── */
        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notif-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notif-card.unread {
          background: var(--brand-light);
          border-color: rgba(124, 58, 237, 0.25);
        }
        .notif-card:hover {
          border-color: var(--brand);
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.08);
          transform: translateY(-2px);
        }
        .notif-icon-chip {
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .notif-card:hover .notif-icon-chip {
          transform: scale(1.15);
          border-color: var(--brand) !important;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
        }

        .nav-notif-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--brand-light);
          color: var(--brand);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .nav-notif-btn:hover {
          background: var(--brand) !important;
          color: #ffffff !important;
          transform: scale(1.08);
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
        }

        /* ── Sidebar Cards ── */
        .notif-sidebar-card {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
        }
        .notif-sidebar-title {
          font-family: var(--sans) !important;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .notif-stat-box {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }

        /* ── Action Buttons ── */
        .btn-action-outline {
          font-family: var(--sans) !important;
          font-size: 13px;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--ink);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .btn-action-outline:hover {
          border-color: var(--brand);
          color: var(--brand);
        }
        .btn-action-ghost {
          font-family: var(--sans) !important;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 12px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .btn-action-ghost:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        /* ── Mobile Drawer ── */
        .uget-mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 280px;
          background-color: var(--bg-2);
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

        @media (max-width: 1024px) {
          .uget-sidebar {
            display: none;
          }
          .uget-main {
            margin-left: 0;
          }
          .uget-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 24px 20px 60px;
          }
          .uget-right-sidebar {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .uget-content-grid {
            padding: 16px 12px 60px;
          }
          .uget-header {
            padding: 0 12px;
            gap: 6px;
            height: 56px;
          }
          .uget-header-search {
            display: none !important;
          }
        }
      `}} />

      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: toast.type === "err" ? "#ef4444" : "var(--brand)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--sans)",
          }}
        >
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Desktop Left Sidebar */}
      <aside className="uget-sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            className="flex items-center gap-2"
            style={{ textDecoration: "none" }}
          >
            <Image src="/favicon.png" alt="EchoGist Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">
              EchoGist
            </span>
          </Link>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage="notifications"
            profileHref={`/profile/${userProfile?.username || user?.id || ""}`}
          />
          <SidebarFollowingList
            followingProfiles={followingProfiles}
            userProfileId={userProfile?.id}
          />
        </nav>

        {userProfile && (
          <div
            style={{
              borderTop: "1px solid var(--border-2)",
              paddingTop: 16,
              marginTop: "auto",
            }}
          >
            <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
              <Link
                href={`/profile/${userProfile?.username || user?.id}`}
                style={{ display: "block", flexShrink: 0 }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    overflow: "hidden",
                  }}
                >
                  {userProfile.avatar_url ? (
                    <Image
                      src={userProfile.avatar_url}
                      alt=""
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "var(--brand-light)",
                        color: "var(--brand)",
                        fontWeight: 700,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getInitials(userProfile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--sans)",
                  }}
                >
                  {userProfile.full_name || "Writer"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: "var(--sans)",
                  }}
                >
                  @{userProfile.username || "writer"}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className="uget-mobile-drawer-overlay"
        style={{
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 0.3s ease-in-out",
        }}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className="uget-mobile-drawer"
        style={{
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <Image src="/favicon.png" alt="EchoGist" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">
              EchoGist
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              padding: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              borderRadius: "50%",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage="notifications"
            profileHref={`/profile/${userProfile?.username || user?.id || ""}`}
            onItemClick={() => setSidebarOpen(false)}
          />
          <SidebarFollowingList
            followingProfiles={followingProfiles}
            userProfileId={userProfile?.id}
          />
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="uget-main">
        {/* Top Sticky Header Nav */}
        <header className="uget-header">
          <div className="flex items-center gap-2 sm:gap-3" style={{ minWidth: 0 }}>
            <button
              onClick={() => {
                if (window.innerWidth > 1024) {
                  const isCollapsed = document.documentElement.classList.toggle(
                    "sidebar-collapsed"
                  );
                  localStorage.setItem(
                    "uget_sidebar_collapsed",
                    String(isCollapsed)
                  );
                } else {
                  setSidebarOpen(true);
                }
              }}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-600 dark:text-zinc-400 transition-colors flex-shrink-0"
              title="Toggle menu"
            >
              <HamburgerIcon />
            </button>

            <Link
              href="/"
              className="uget-header-logo flex items-center gap-1.5 flex-shrink-0"
              style={{ textDecoration: "none" }}
            >
              <Image src="/favicon.png" alt="EchoGist" width={24} height={24} />
              <span className="font-bold text-base sm:text-lg text-violet-600 font-display">
                EchoGist
              </span>
            </Link>

            <form
              onSubmit={handleSearchSubmit}
              className="uget-header-search hidden sm:flex"
            >
              <span style={{ color: "var(--muted)", display: "flex" }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  width: "100%",
                  color: "var(--ink)",
                  fontFamily: "var(--sans)",
                  marginLeft: 6,
                }}
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Mobile Search Icon Button */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400 transition-colors"
              title="Search"
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            {userProfile && (
              <Link
                href="/write"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "var(--ink)",
                  background: "var(--bg-3)",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  fontFamily: "var(--sans)",
                }}
              >
                <WriteIcon />
                <span className="hidden sm:inline">Write</span>
              </Link>
            )}

            <NavNotificationButton unreadCount={unreadCount} active={true} />

            {user ? (
              <div className="relative avatar-dropdown-trigger">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="nav-avatar"
                >
                  {userProfile?.avatar_url ? (
                    <Image
                      src={userProfile.avatar_url}
                      alt=""
                      width={36}
                      height={36}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <span>
                      {getInitials(
                        userProfile?.full_name || user?.email || "?"
                      )}
                    </span>
                  )}
                </button>

                <UserDropdown
                  isOpen={userDropdownOpen}
                  user={user}
                  userProfile={userProfile}
                  onClose={() => setUserDropdownOpen(false)}
                  onOpenNotifs={() => {
                    setUserDropdownOpen(false);
                    router.push("/notifications");
                  }}
                  onSignOut={handleSignOut}
                />
              </div>
            ) : (
              <Link
                href="/auth"
                style={{
                  background: "var(--brand)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "7px 18px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontFamily: "var(--sans)",
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Expandable Search Bar */}
        {mobileSearchOpen && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-2)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            className="sm:hidden"
          >
            <form
              onSubmit={handleSearchSubmit}
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
              <span style={{ color: "var(--muted)", display: "flex" }}>
                <SearchIcon />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search EchoGist..."
                autoFocus
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  width: "100%",
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
                color: "var(--muted)",
                cursor: "pointer",
                padding: "4px 6px",
                fontFamily: "var(--sans)",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Content Layout Grid */}
        <div className="uget-content-grid">
          {/* Main Feed Column */}
          <div className="uget-feed-column">
            {/* Page Title & Top Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--brand)",
                      background: "var(--brand-light)",
                      border: "1px solid rgba(124, 58, 237, 0.2)",
                      padding: "3px 10px",
                      borderRadius: 99,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="btn-action-outline">
                    <CheckAllIcon />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAllNotifications} className="btn-action-ghost">
                    <TrashIcon />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="notif-tabs">
              {[
                { id: "all", label: "All", count: notifications.length },
                { id: "unread", label: "Unread", count: unreadCount },
                { id: "stories", label: "Stories & Activity", count: storiesCount },
                { id: "social", label: "Social & Followers", count: socialCount },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as FilterTab)}
                    className={`notif-tab ${active ? "active" : ""}`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="notif-tab-badge">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Notification Feed List */}
            {loading ? (
              <div className="notif-list">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 72,
                      borderRadius: 12,
                      background: "var(--bg-2)",
                      border: "1px solid var(--border)",
                    }}
                  />
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: "56px 24px",
                  textAlign: "center",
                  background: "var(--bg-2)",
                  borderRadius: 16,
                  border: "1px dashed var(--border)",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--brand-light)",
                    color: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <BellIcon />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--ink)",
                    marginBottom: 6,
                  }}
                >
                  {activeTab === "unread"
                    ? "You're all caught up!"
                    : activeTab === "social"
                    ? "No social updates yet"
                    : activeTab === "stories"
                    ? "No story activity yet"
                    : "No notifications right now"}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 13,
                    color: "var(--muted)",
                    maxWidth: 380,
                    margin: "0 auto 20px",
                    lineHeight: 1.6,
                  }}
                >
                  {activeTab === "unread"
                    ? "There are no unread notifications matching your current filter. We will let you know when new activity arrives."
                    : "When writers publish new stories, or when users follow you or comment on your work, you'll see them right here."}
                </p>
                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "9px 20px",
                    borderRadius: 999,
                    background: "var(--brand)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontFamily: "var(--sans)",
                  }}
                >
                  Explore stories →
                </Link>
              </div>
            ) : (
              <div className="notif-list">
                {filteredNotifications.map((item) => {
                  const { actorName, actionText, postTitle, iconComponent } =
                    getFormattedContent(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`notif-card ${item.unread ? "unread" : ""}`}
                    >
                      {/* Avatar with Badged Icon */}
                      <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "1px solid var(--border)",
                            background: "var(--bg-3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {item.actor_profile?.avatar_url ? (
                            <Image
                              src={item.actor_profile.avatar_url}
                              alt=""
                              width={40}
                              height={40}
                              style={{ objectFit: "cover", width: "100%", height: "100%" }}
                            />
                          ) : (
                            <span style={{ fontFamily: "var(--sans)", fontWeight: 700, fontSize: 13, color: "var(--brand)" }}>
                              {getInitials(actorName)}
                            </span>
                          )}
                        </div>
                        {/* Overlay Type Icon */}
                        <span
                          className="notif-icon-chip"
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          {iconComponent}
                        </span>
                      </div>

                      {/* Main Text & Subline Container */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.45, color: "var(--ink)", wordBreak: "break-word" }}>
                          <span
                            style={{ fontWeight: 700, color: "var(--ink)", cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.actor_profile?.username) router.push(`/profile/${item.actor_profile.username}`);
                            }}
                          >
                            {actorName}
                          </span>{" "}
                          <span style={{ color: "var(--muted)" }}>{actionText}</span>
                          {postTitle && (
                            <>
                              {": "}
                              <span
                                style={{ fontWeight: 600, color: "var(--brand)", cursor: "pointer" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.posts?.slug) router.push(`/post/${item.posts.slug}`);
                                }}
                              >
                                "{postTitle}"
                              </span>
                            </>
                          )}
                        </div>

                        {/* Metadata & Actions Subline */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>
                              {item.time}
                            </span>
                            {item.unread && (
                              <span
                                style={{
                                  fontFamily: "var(--sans)",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "var(--brand)",
                                  background: "var(--brand-light)",
                                  padding: "1px 7px",
                                  borderRadius: 99,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand)" }} />
                                Unread
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => toggleReadStatus(e, item)}
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 11.5,
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                                background: item.read ? "transparent" : "var(--brand-light)",
                                color: item.read ? "var(--muted)" : "var(--brand)",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              title={item.read ? "Mark as unread" : "Mark as read"}
                            >
                              {item.read ? "Read" : "Mark read"}
                            </button>
                            <button
                              onClick={(e) => deleteNotification(e, item.id)}
                              style={{
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: "none",
                                background: "transparent",
                                color: "var(--muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              title="Delete notification"
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color = "#ef4444";
                                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <aside className="uget-right-sidebar">
            {/* Overview Card */}
            <div className="notif-sidebar-card">
              <div className="notif-sidebar-title">
                <span>Summary</span>
                <BellIcon />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <div className="notif-stat-box">
                  <div style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 800, color: "var(--brand)" }}>
                    {unreadCount}
                  </div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, color: "var(--muted)", marginTop: 2 }}>
                    Unread
                  </div>
                </div>

                <div className="notif-stat-box">
                  <div style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>
                    {notifications.length}
                  </div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 500, color: "var(--muted)", marginTop: 2 }}>
                    Total
                  </div>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    width: "100%",
                    padding: "9px 14px",
                    borderRadius: 999,
                    background: "var(--brand)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontFamily: "var(--sans)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <CheckAllIcon />
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification Preferences Link Card */}
            <div className="notif-sidebar-card">
              <div className="notif-sidebar-title" style={{ gap: 6, justifyContent: "flex-start" }}>
                <SlidersIcon />
                <span>Preferences</span>
              </div>
              <p
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  color: "var(--muted)",
                  lineHeight: 1.5,
                  marginBottom: 14,
                }}
              >
                Customize your email digests, push notifications, and activity alerts anytime in settings.
              </p>
              <Link
                href="/settings"
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--brand)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Manage preferences →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
