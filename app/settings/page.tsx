"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import type { Profile } from "@/lib/types";
import { getInitials } from "@/lib/types";
import { SidebarNav, SidebarFollowingList, HamburgerIcon, CloseIcon, SearchIcon, WriteIcon, BellIcon } from "@/components/SidebarNav";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  // User and Profile states
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");
  const [role, setRole] = useState("writer");
  const [theme, setTheme] = useState("light");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Tab State: account, publishing, privacy, notifications, membership, security
  const [activeTab, setActiveTab] = useState<
    "account" | "publishing" | "privacy" | "notifications" | "membership" | "security"
  >("account");

  // Inline edit toggle states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingProfileInfo, setIsEditingProfileInfo] = useState(false);
  const [isEditingDomain, setIsEditingDomain] = useState(false);
  const [isEditingTipping, setIsEditingTipping] = useState(false);

  // Simulated state checkboxes
  const [hideHighlights, setHideHighlights] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(true);
  const [provideFeedback, setProvideFeedback] = useState(true);
  const [allowPrivateNotes, setAllowPrivateNotes] = useState(true);
  const [allowEmailReplies, setAllowEmailReplies] = useState(false);
  const [tippingUrl, setTippingUrl] = useState("");

  // Privacy tab states
  const [privClaps, setPrivClaps] = useState(true);
  const [privResponses, setPrivResponses] = useState(true);
  const [privHighlights, setPrivHighlights] = useState(true);
  const [privDiscoverability, setPrivDiscoverability] = useState("Everyone");

  // Notification settings states
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("Daily");
  const [recommendedReading, setRecommendedReading] = useState(true);
  const [savedLists, setSavedLists] = useState(true);
  const [followsHighlights, setFollowsHighlights] = useState(true);
  const [repliesResponses, setRepliesResponses] = useState(true);
  const [storyMentions, setStoryMentions] = useState("In network");
  const [writerActivity, setWriterActivity] = useState(true);
  const [writerLists, setWriterLists] = useState(true);
  const [writerEditorFeature, setWriterEditorFeature] = useState(true);
  const [pubSubmissions, setPubSubmissions] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState(true);
  const [otherProductFeatures, setOtherProductFeatures] = useState(true);
  const [otherMembership, setOtherMembership] = useState(true);
  const [otherAnnouncements, setOtherAnnouncements] = useState(true);
  const [allowEmailNotifications, setAllowEmailNotifications] = useState(true);
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);

  // Toast notifications state
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showMsg = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // Load profile
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setTwitter(data.twitter || "");
        setWebsite(data.website || "");
        setRole(data.role || "writer");
        setAvatarUrl(data.avatar_url || "");

        const localTheme = localStorage.getItem("theme") || data.theme || "light";
        setTheme(localTheme);
      }
      setLoading(false);

      // Load notifications & following
      loadNotifications(user.id);
      loadFollowingProfiles(user.id);
    });

    // Load simulated states from localStorage
    if (typeof window !== "undefined") {
      setHideHighlights(localStorage.getItem("uget_settings_hide_highlights") === "true");
      setAiAllowed(localStorage.getItem("uget_settings_ai_allowed") !== "false");
      setProvideFeedback(localStorage.getItem("uget_settings_provide_feedback") !== "false");
      setAllowPrivateNotes(localStorage.getItem("uget_settings_private_notes") !== "false");
      setAllowEmailReplies(localStorage.getItem("uget_settings_email_replies") === "true");
      setTippingUrl(localStorage.getItem("uget_settings_tipping_url") || "");

      // Load privacy states
      setPrivClaps(localStorage.getItem("uget_settings_priv_claps") !== "false");
      setPrivResponses(localStorage.getItem("uget_settings_priv_responses") !== "false");
      setPrivHighlights(localStorage.getItem("uget_settings_priv_highlights") !== "false");
      setPrivDiscoverability(localStorage.getItem("uget_settings_priv_discoverability") || "Everyone");

      // Load notifications states
      setDigestEnabled(localStorage.getItem("uget_settings_notif_digest") !== "false");
      setDigestFrequency(localStorage.getItem("uget_settings_notif_digest_freq") || "Daily");
      setRecommendedReading(localStorage.getItem("uget_settings_notif_recommended") !== "false");
      setSavedLists(localStorage.getItem("uget_settings_notif_saved_lists") !== "false");
      setFollowsHighlights(localStorage.getItem("uget_settings_notif_follows_highlights") !== "false");
      setRepliesResponses(localStorage.getItem("uget_settings_notif_replies_responses") !== "false");
      setStoryMentions(localStorage.getItem("uget_settings_notif_story_mentions") || "In network");
      setWriterActivity(localStorage.getItem("uget_settings_notif_writer_activity") !== "false");
      setWriterLists(localStorage.getItem("uget_settings_notif_writer_lists") !== "false");
      setWriterEditorFeature(localStorage.getItem("uget_settings_notif_writer_feature") !== "false");
      setPubSubmissions(localStorage.getItem("uget_settings_notif_pub_submissions") !== "false");
      setSubmissionStatus(localStorage.getItem("uget_settings_notif_sub_status") !== "false");
      setOtherProductFeatures(localStorage.getItem("uget_settings_notif_other_features") !== "false");
      setOtherMembership(localStorage.getItem("uget_settings_notif_other_membership") !== "false");
      setOtherAnnouncements(localStorage.getItem("uget_settings_notif_other_announcements") !== "false");
      setAllowEmailNotifications(localStorage.getItem("uget_settings_notif_allow_email") !== "false");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { data } = await supabase
        .from("notifications")
        .select("*, actor_profile:profiles(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setNotifications(
          data.map((n: any) => {
            const actor = n.actor_profile || n.profiles;
            const iconMap: any = { like: "💖", comment: "💬", follow: "👤" };
            return {
              id: n.id,
              text: actor ? `${actor.full_name} ${n.content}` : n.content,
              time: new Date(n.created_at).toLocaleDateString() || "Just now",
              unread: !n.read,
              icon: iconMap[n.type] || "🎉",
            };
          })
        );
        setUnreadNotifCount(data.filter((n: any) => !n.read).length);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const loadFollowingProfiles = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("follows")
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
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
    setUnreadNotifCount(0);
  };

  const handleNotificationClick = async (id: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}-${Date.now()}.${ext}`;

    const { error, data } = await supabase.storage.from("avatars").upload(path, file);

    if (error) {
      showMsg(error.message, "err");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
    setAvatarUrl(publicUrl);
    setUploading(false);
    showMsg("Profile picture uploaded!");
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (darkQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const handleSaveField = async (updatedFields: Partial<Profile>) => {
    if (!user) return;
    setSaving(true);

    const payload = {
      ...updatedFields,
      updated_at: new Date().toISOString(),
    };

    let { error } = await supabase.from("profiles").update(payload).eq("id", user.id);

    // self-healing fallback for theme field if missing
    if (error && error.message && (error.message.includes('column "theme"') || error.message.includes("theme"))) {
      const { theme: _, ...fallbackPayload } = payload as any;
      const retry = await supabase.from("profiles").update(fallbackPayload).eq("id", user.id);
      error = retry.error;
    }

    setSaving(false);
    if (error) {
      showMsg(error.message, "err");
    } else {
      // Sync cache
      const remember = localStorage.getItem("uget_remember_me") !== "false";
      if (remember) {
        localStorage.setItem(
          "uget_last_user",
          JSON.stringify({
            full_name: payload.full_name || fullName || user.email || "User",
            email: user.email || "",
            avatar_url: payload.avatar_url || avatarUrl || "",
          })
        );
      }
      showMsg("Settings saved successfully!");

      // Update local profile view
      setProfile((prev: any) => ({ ...prev, ...payload }));
    }
  };

  // Simulated field toggles
  const handleToggleSimulated = (key: string, value: any) => {
    localStorage.setItem(key, String(value));
    showMsg("Setting updated successfully!");
  };

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  if (loading) {
    return (
      <div style={{ background: "white", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--border)", borderTopColor: "var(--ink)" }} />
      </div>
    );
  }

  const activeTabStyle = "settings-tab active";
  const inactiveTabStyle = "settings-tab";

  return (
    <div className="uget-layout">
      {/* Toast Alert */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "err" ? "toast-error" : "toast-success"}`}>
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </div>
        </div>
      )}

      {/* Inject custom styling locally for setting specific widgets */}
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
          background-color: var(--nav-bg);
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
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 48px;
          padding: 48px 32px 100px;
          max-width: 1060px;
          width: 100%;
          margin: 0 auto;
          color: var(--black);
        }
        .settings-content {
          min-width: 0;
        }
        .settings-help-sidebar {
          position: sticky;
          top: 88px;
          align-self: start;
        }
        .settings-tabs-wrapper {
          border-bottom: 1px solid var(--border-2);
          display: flex;
          gap: 24px;
          margin-bottom: 32px;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
        }
        .settings-tabs-wrapper::-webkit-scrollbar {
          display: none;
        }
        .settings-tab {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 400;
          color: var(--muted);
          padding: 10px 0 12px;
          border-bottom: 1px solid transparent;
          background: none;
          border-top: none;
          border-left: none;
          border-right: none;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: -1px;
        }
        .settings-tab.active {
          color: var(--black);
          border-bottom-color: var(--black);
          font-weight: 500;
        }
        .settings-section-title {
          font-family: var(--sans);
          font-size: 22px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 20px;
          margin-top: 32px;
          border-bottom: none;
          padding-bottom: 0;
          text-transform: none;
          letter-spacing: normal;
        }
        .settings-section-title:first-of-type {
          margin-top: 0;
        }

        /* Medium checkmark custom checkbox styling */
        .medium-checkbox-container {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        .medium-checkbox-box {
          width: 16px;
          height: 16px;
          border: 1px solid var(--muted-2);
          border-radius: 3px;
          background-color: var(--bg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, border-color 0.15s;
        }
        .medium-checkbox-box.checked {
          background-color: var(--black);
          border-color: var(--black);
        }
        .medium-checkbox-box svg {
          width: 10px;
          height: 10px;
          stroke: var(--bg);
          stroke-width: 2.5px;
          fill: none;
        }
        .medium-checkbox-label {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--black);
          margin-left: 12px;
        }

        /* Medium custom radio button styling */
        .medium-radio-container {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }
        .medium-radio-circle {
          width: 18px;
          height: 18px;
          border: 1px solid var(--muted-2);
          border-radius: 50%;
          background-color: var(--bg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s;
        }
        .medium-radio-circle.selected {
          border-color: var(--black);
        }
        .medium-radio-circle-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--black);
        }
        .medium-radio-label {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--black);
          margin-left: 12px;
        }

        /* Medium custom select styling */
        .medium-select-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          color: #1a8917;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .medium-select {
          appearance: none;
          background: transparent;
          border: none;
          color: #1a8917;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          padding-right: 18px;
          cursor: pointer;
          outline: none;
        }
        .medium-select-caret {
          position: absolute;
          right: 0;
          pointer-events: none;
          width: 10px;
          height: 10px;
          fill: #1a8917;
          display: inline-flex;
          align-items: center;
        }

        /* Membership banner styling */
        .membership-promo-banner {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(26, 137, 23, 0.08) 100%);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 24px;
        }
        .membership-promo-text {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--black);
          line-height: 1.5;
        }
        .membership-promo-link {
          color: #7c3aed;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .membership-promo-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
          color: #9ca3af;
          line-height: 1;
        }

        /* Diagonal Arrow Link */
        .diagonal-arrow-btn {
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .diagonal-arrow-btn:hover {
          color: var(--black);
        }
        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border-2);
        }
        .settings-row:last-child {
          border-bottom: none;
        }
        .settings-row-main {
          flex: 1;
        }
        .settings-label {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 3px;
        }
        .settings-value {
          font-family: var(--sans);
          font-size: 14px;
          color: var(--ink-2);
          margin-bottom: 4px;
        }
        .settings-desc {
          font-family: var(--sans);
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
        }
        .settings-row-action {
          flex-shrink: 0;
          text-align: right;
        }
        .settings-action-btn {
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 600;
          color: #7c3aed;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 99px;
          transition: all 0.2s;
        }
        .settings-action-btn:hover {
          background-color: rgba(124, 58, 237, 0.1);
        }
        .settings-inline-editor {
          margin-top: 12px;
          background-color: var(--bg-2);
          border: 1px solid var(--border-2);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .settings-help-card {
          border: 1px solid var(--border-2);
          border-radius: 16px;
          padding: 24px;
          background-color: var(--bg-2);
        }
        .settings-help-title {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 16px;
        }
        .settings-help-link {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--muted);
          display: block;
          margin-bottom: 12px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .settings-help-link:hover {
          color: #7c3aed;
          text-decoration: underline;
        }
        .settings-help-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-t: 1px solid var(--border-2);
          font-family: var(--sans);
          font-size: 11px;
          color: var(--muted-2);
          line-height: 1.6;
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
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--border);
          transition: .3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--bg);
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: #7c3aed;
        }
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        @media (max-width: 1024px) {
          .uget-sidebar {
            display: none;
          }
          .uget-main {
            margin-left: 0;
          }
        }
        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 24px 16px 80px;
          }
          .settings-help-sidebar {
            display: none;
          }
          .uget-header {
            padding: 0 24px;
          }
        }

        /* ── Dark Mode Overrides for Tailwind classes ── */
        .dark .border-gray-100 {
          border-color: var(--border) !important;
        }
        .dark .bg-white {
          background-color: var(--bg-2) !important;
        }
        .dark .text-gray-900 {
          color: var(--black) !important;
        }
        .dark .text-gray-700 {
          color: var(--ink-2) !important;
        }
        .dark .text-gray-600 {
          color: var(--ink-3) !important;
        }
        .dark .text-gray-500 {
          color: var(--muted) !important;
        }
        .dark .text-gray-400 {
          color: var(--muted-2) !important;
        }
        .dark .bg-gray-50 {
          background-color: var(--bg-3) !important;
        }
        .dark .bg-gray-50\/50 {
          background-color: var(--bg-3) !important;
        }
        .dark .hover\:bg-gray-50:hover {
          background-color: var(--bg-3) !important;
        }
        .dark .hover\:bg-gray-100:hover {
          background-color: var(--bg-3) !important;
        }
        .dark .bg-gray-100 {
          background-color: var(--bg-3) !important;
        }
        .dark .border-gray-200 {
          border-color: var(--border) !important;
        }
        .dark .bg-\[\#f3efff\] {
          background-color: rgba(124, 58, 237, 0.15) !important;
        }
        .dark .hover\:bg-\[\#f8f6ff\]:hover {
          background-color: rgba(124, 58, 237, 0.08) !important;
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
            activePage="settings"
            profileHref={profile ? `/profile/${profile.username || user?.id}` : "/profile"}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} userProfileId={user?.id} />
        </nav>

        {profile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <Link
              href={`/profile/${profile.username || user?.id}`}
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
              style={{ display: "block" }}
            >
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                  {getInitials(profile.full_name || user?.email || "?")}
                </div>
              )}
            </Link>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm text-gray-900 truncate">
                {profile.full_name || "Writer"}
              </div>
              <div className="text-xs text-gray-500 truncate">@{profile.username || "writer"}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Mobile Sidebar Drawer overlay ── */}
      {sidebarOpen && (
        <>
          <div className="uget-mobile-drawer-overlay" onClick={() => setSidebarOpen(false)} />
          <div
            className="uget-mobile-drawer"
            style={{ transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
          >
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
                activePage="settings"
                profileHref={profile ? `/profile/${profile.username || user?.id}` : "/profile"}
                onItemClick={() => setSidebarOpen(false)}
              />
              <SidebarFollowingList followingProfiles={followingProfiles} userProfileId={user?.id} />
            </nav>

            {profile && (
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                      {getInitials(profile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
                <div className="min-w-0" style={{ flex: 1 }}>
                  <div className="font-bold text-sm text-gray-900 truncate">
                    {profile.full_name || "Writer"}
                  </div>
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
            <Link
              href="/"
              className="uget-header-logo flex items-center gap-1.5"
              style={{ textDecoration: "none" }}
            >
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
            <Link
              href="/write"
              className="nav-write-btn"
              style={{ textDecoration: "none" }}
            >
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
                  <span
                    style={{
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
                      border: "1.5px solid #ffffff",
                    }}
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Bell dropdown */}
              {notifDropdownOpen && (
                <div
                  className="notif-dropdown" style={{ position: "absolute", right: 0, top: "calc(100% + 12px)", background: "white", border: "1px solid var(--border-2)", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.1)", zIndex: 100, width: 320, overflow: "hidden" }}
                >
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
                          className={`flex gap-3 px-4 py-3 border-b border-gray-55 cursor-pointer transition-colors ${
                            item.unread ? "bg-violet-50/30" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-lg flex-shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs text-gray-700 leading-relaxed font-sans ${
                                item.unread ? "font-semibold" : ""
                              }`}
                            >
                              {item.text}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block font-sans">
                              {item.time}
                            </span>
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
                  <span>{getInitials(profile?.full_name || user?.email || "?")}</span>
                )}
              </button>

              <UserDropdown
                isOpen={userDropdownOpen}
                user={{ email: user?.email || "", id: user?.id || "" }}
                userProfile={profile}
                onClose={() => setUserDropdownOpen(false)}
                onOpenNotifs={() => { setUserDropdownOpen(false); setNotifDropdownOpen(true); }}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </header>

        {/* ── Settings layout grid ── */}
        <div className="settings-grid">
          {/* Main content column */}
          <div className="settings-content">
            <h1
              className="font-bold text-3xl md:text-4xl text-gray-900 mb-2 font-display"
              style={{ letterSpacing: "-0.025em" }}
            >
              Settings
            </h1>
            <p className="text-sm text-gray-500 font-sans mb-8">
              Manage your personal settings, publishing defaults, and account privacy.
            </p>

            {/* Tabs matching Screenshots */}
            <div className="settings-tabs-wrapper">
              <button
                onClick={() => setActiveTab("account")}
                className={activeTab === "account" ? activeTabStyle : inactiveTabStyle}
              >
                Account
              </button>
              <button
                onClick={() => setActiveTab("publishing")}
                className={activeTab === "publishing" ? activeTabStyle : inactiveTabStyle}
              >
                Publishing
              </button>
              <button
                onClick={() => setActiveTab("privacy")}
                className={activeTab === "privacy" ? activeTabStyle : inactiveTabStyle}
              >
                Privacy
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={activeTab === "notifications" ? activeTabStyle : inactiveTabStyle}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("membership")}
                className={activeTab === "membership" ? activeTabStyle : inactiveTabStyle}
              >
                Membership and payment
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={activeTab === "security" ? activeTabStyle : inactiveTabStyle}
              >
                Security and apps
              </button>
            </div>

            {/* TAB CONTENT: Account */}
            {activeTab === "account" && (
              <div className="flex flex-col gap-8">
                {/* Profile Settings Block */}
                <div>
                  <div className="settings-section-title">Profile</div>

                  {/* Email row */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Email address</div>
                      <div className="settings-value">{user?.email || "Not authenticated"}</div>
                      <div className="settings-desc">
                        Your login email address. To change it, please contact support.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() =>
                          alert("Please contact support@echogist.com to update your email address.")
                        }
                        className="settings-action-btn"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Theme settings row */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Site Theme</div>
                      <div className="settings-value" style={{ textTransform: "capitalize" }}>{theme} theme</div>
                      <div className="settings-desc">
                        Customize the color scheme of your EchoGist experience. Choose between Light, Dark, or System themes.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <div style={{
                        display: "inline-flex",
                        background: "var(--bg-3)",
                        padding: 3,
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        gap: 2,
                      }}>
                        {[
                          { value: "light", label: "Light", icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                            </svg>
                          )},
                          { value: "dark", label: "Dark", icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                            </svg>
                          )},
                          { value: "system", label: "System", icon: (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="14" x="2" y="3" rx="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          )}
                        ].map((opt) => {
                          const isActive = theme === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleThemeChange(opt.value)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 16px",
                                borderRadius: 8,
                                fontSize: 13.5,
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? "var(--black)" : "var(--muted)",
                                background: isActive ? "var(--bg)" : "transparent",
                                border: "1px solid " + (isActive ? "var(--border)" : "transparent"),
                                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.04)" : "none",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                outline: "none",
                              }}
                            >
                              {opt.icon}
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Username row */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Username and subdomain</div>
                      {isEditingUsername ? (
                        <div className="settings-inline-editor">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-sans">
                              Username
                            </label>
                            <div className="flex items-center">
                              <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-lg px-3 py-2 text-gray-500 font-sans text-sm">
                                echogist.com/@
                              </span>
                              <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="border border-gray-200 rounded-r-lg px-3 py-2 text-sm text-black font-sans focus:outline-none focus:border-violet-600 flex-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                handleSaveField({
                                  username: username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                                });
                                setIsEditingUsername(false);
                              }}
                              disabled={saving}
                              className="btn btn-primary btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setUsername(profile?.username || "");
                                setIsEditingUsername(false);
                              }}
                              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-semibold font-sans"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="settings-value">@{profile?.username || "writer"}</div>
                          <div className="settings-desc">
                            Edit your unique EchoGist username and public profile URL path.
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditingUsername && (
                      <div className="settings-row-action">
                        <button
                          onClick={() => setIsEditingUsername(true)}
                          className="settings-action-btn"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile info row */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Profile information</div>
                      {isEditingProfileInfo ? (
                        <div className="settings-inline-editor">
                          {/* Avatar Upload */}
                          <div className="flex items-center gap-4 py-2 border-b border-gray-100 mb-2">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-violet-100 border border-gray-200 flex-shrink-0 flex items-center justify-center text-violet-700 text-xl font-bold relative">
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt="Avatar"
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <span>{getInitials(fullName || "?")}</span>
                              )}
                              {uploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <div className="spinner w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-700 font-sans">
                                Profile Photo
                              </div>
                              <label className="text-xs text-violet-600 hover:underline cursor-pointer font-sans font-medium mt-1 block">
                                Upload image file...
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleAvatarUpload}
                                  disabled={uploading}
                                />
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black font-sans focus:outline-none focus:border-violet-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">
                              Bio
                            </label>
                            <textarea
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              rows={3}
                              placeholder="Tell readers about yourself..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black font-serif focus:outline-none focus:border-violet-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">
                              Website URL
                            </label>
                            <input
                              type="url"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="https://yourpage.com"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black font-sans focus:outline-none focus:border-violet-600"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-sans">
                              Twitter Handle (no @)
                            </label>
                            <input
                              type="text"
                              value={twitter}
                              onChange={(e) => setTwitter(e.target.value)}
                              placeholder="handle"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black font-sans focus:outline-none focus:border-violet-600"
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                handleSaveField({
                                  full_name: fullName.trim(),
                                  bio: bio.trim(),
                                  website: website.trim(),
                                  twitter: twitter.trim(),
                                  avatar_url: avatarUrl,
                                });
                                setIsEditingProfileInfo(false);
                              }}
                              disabled={saving}
                              className="btn btn-primary btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setFullName(profile?.full_name || "");
                                setBio(profile?.bio || "");
                                setWebsite(profile?.website || "");
                                setTwitter(profile?.twitter || "");
                                setIsEditingProfileInfo(false);
                              }}
                              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-semibold font-sans"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 py-1.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              {profile?.avatar_url ? (
                                <Image
                                  src={profile.avatar_url}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">
                                  {getInitials(profile?.full_name || "?")}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-sans font-bold text-sm text-gray-900">
                                {profile?.full_name}
                              </div>
                              {profile?.bio && (
                                <div className="font-serif text-xs text-gray-500 mt-0.5 max-w-sm truncate">
                                  {profile.bio}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="settings-desc">
                            Edit your display photo, name, short bio, website URL, and Twitter handle.
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditingProfileInfo && (
                      <div className="settings-row-action">
                        <button
                          onClick={() => setIsEditingProfileInfo(true)}
                          className="settings-action-btn"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Custom Domain row */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Custom domain</div>
                      {isEditingDomain ? (
                        <div className="settings-inline-editor">
                          <div className="text-sm text-gray-700 font-sans leading-relaxed">
                            💡 <strong>EchoGist Custom Domains</strong> allow you to map your own personal web
                            domain (e.g. `yourname.com`) directly to your EchoGist publication.
                          </div>
                          <div className="text-xs text-gray-500 font-sans">
                            This feature is premium and requires a valid active EchoGist Membership subscription.
                          </div>
                          <div className="flex gap-2 justify-end mt-2">
                            <button
                              onClick={() => {
                                showMsg("Upgrade page simulated!", "ok");
                                setIsEditingDomain(false);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Upgrade to Member
                            </button>
                            <button
                              onClick={() => setIsEditingDomain(false)}
                              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-semibold font-sans"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="settings-value">None</div>
                          <div className="settings-desc">
                            Upgrade to a EchoGist Membership to map your own custom domain.
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditingDomain && (
                      <div className="settings-row-action">
                        <button
                          onClick={() => setIsEditingDomain(true)}
                          className="settings-action-btn"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stories block */}
                <div>
                  <div className="settings-section-title">Stories</div>

                  {/* Partner Program */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Partner Program</div>
                      <div className="settings-value">Not enrolled</div>
                      <div className="settings-desc">
                        You are not currently enrolled in the Partner Program. Enroll to earn revenue from your
                        published articles.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() =>
                          alert(
                            "Thank you for your interest! The Partner Program is currently invitation-only. Maintain a regular writing schedule to qualify for review."
                          )
                        }
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors inline-flex"
                      >
                        <ArrowRightIcon />
                      </button>
                    </div>
                  </div>

                  {/* Third party AI */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Third-party AI indexing bots</div>
                      <div className="settings-value">{aiAllowed ? "Allowed" : "Blocked"}</div>
                      <div className="settings-desc">
                        Control whether AI scrapers and Large Language Models (LLMs) can crawl and index your EchoGist
                        stories for training datasets.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={aiAllowed}
                          onChange={(e) => {
                            setAiAllowed(e.target.checked);
                            handleToggleSimulated("uget_settings_ai_allowed", e.target.checked);
                          }}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Hide highlights */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Hide highlights from others</div>
                      <div className="settings-desc">
                        Prevent other readers and authors from seeing the custom highlights you make on posts.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={hideHighlights}
                          onChange={(e) => {
                            setHideHighlights(e.target.checked);
                            handleToggleSimulated("uget_settings_hide_highlights", e.target.checked);
                          }}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Recommendations settings */}
                <div>
                  <div className="settings-section-title">Recommendations</div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Refine recommendations</div>
                      <div className="settings-desc">
                        Adjust recommendations by updating the writers, publications, and categories you follow.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <Link
                        href="/me/following"
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors inline-flex"
                      >
                        <ArrowRightIcon />
                      </Link>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Muted writers and publications</div>
                      <div className="settings-desc">
                        Manage who you've muted. Muted accounts will not appear in your feeds.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <Link
                        href="/me/following"
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors inline-flex"
                      >
                        <ArrowRightIcon />
                      </Link>
                    </div>
                  </div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Blocked users</div>
                      <div className="settings-value">0 users blocked</div>
                      <div className="settings-desc">
                        Accounts you block cannot follow you, comment on your posts, or view your profile page.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => alert("You haven't blocked any accounts.")}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors inline-flex"
                      >
                        <ArrowRightIcon />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <div className="settings-section-title">Account</div>

                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Provide feedback</div>
                      <div className="settings-desc">
                        Opt-in to participate in feedback programs, surveys, and user research.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={provideFeedback}
                          onChange={(e) => {
                            setProvideFeedback(e.target.checked);
                            handleToggleSimulated("uget_settings_provide_feedback", e.target.checked);
                          }}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Deactivate account */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <button
                        onClick={() => {
                          const confirm = window.confirm(
                            "Are you sure you want to deactivate your EchoGist account? This will hide your stories and profile temporarily."
                          );
                          if (confirm) {
                            showMsg("Account deactivated (simulated).", "ok");
                          }
                        }}
                        className="text-red-600 hover:text-red-700 font-sans font-semibold text-sm text-left block border-none bg-none p-0"
                      >
                        Deactivate account
                      </button>
                      <div className="settings-desc mt-1">
                        Deactivating will suspend your public profile until you sign back in.
                      </div>
                    </div>
                  </div>

                  {/* Delete account */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <button
                        onClick={() => {
                          const confirm = window.confirm(
                            "⚠️ WARNING: Are you sure you want to delete your EchoGist account? This will permanently delete your stories, comments, and profile. This action CANNOT be undone."
                          );
                          if (confirm) {
                            showMsg("Account deletion started (simulated).", "ok");
                          }
                        }}
                        className="text-red-600 hover:text-red-700 font-sans font-semibold text-sm text-left block border-none bg-none p-0"
                      >
                        Delete account
                      </button>
                      <div className="settings-desc mt-1">
                        Permanently delete your EchoGist account, all published stories, and stats metrics.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Publishing */}
            {activeTab === "publishing" && (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="settings-section-title">Publications</div>
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Manage publications</div>
                      <div className="settings-desc font-sans text-sm text-violet-600 hover:underline">
                        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
                          Create or manage your publications &gt;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="settings-section-title">Reader Engagement</div>

                  {/* Private notes */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Allow private notes on your stories</div>
                      <div className="settings-desc">
                        Readers can leave private annotations visible only to you and editors of the publication.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={allowPrivateNotes}
                          onChange={(e) => {
                            setAllowPrivateNotes(e.target.checked);
                            handleToggleSimulated("uget_settings_private_notes", e.target.checked);
                          }}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Tipping settings */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Manage tipping on your stories</div>
                      {isEditingTipping ? (
                        <div className="settings-inline-editor">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-sans">
                              Payment URL / Link
                            </label>
                            <input
                              type="url"
                              value={tippingUrl}
                              onChange={(e) => setTippingUrl(e.target.value)}
                              placeholder="e.g. https://ko-fi.com/username or PayPal URL"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black font-sans focus:outline-none focus:border-violet-600"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                handleToggleSimulated("uget_settings_tipping_url", tippingUrl);
                                setIsEditingTipping(false);
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setTippingUrl(localStorage.getItem("uget_settings_tipping_url") || "");
                                setIsEditingTipping(false);
                              }}
                              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-xs font-semibold font-sans"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="settings-value">
                            {tippingUrl ? `Enabled: ${tippingUrl}` : "Disabled"}
                          </div>
                          <div className="settings-desc">
                            Allow readers to send tips or support your writing via external links like PayPal or Ko-fi.
                          </div>
                        </>
                      )}
                    </div>
                    {!isEditingTipping && (
                      <div className="settings-row-action">
                        <button
                          onClick={() => setIsEditingTipping(true)}
                          className="settings-action-btn"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Allow email replies */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Allow email replies</div>
                      <div className="settings-desc">
                        Let newsletter subscribers reply to your articles directly from their email inbox.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={allowEmailReplies}
                          onChange={(e) => {
                            setAllowEmailReplies(e.target.checked);
                            handleToggleSimulated("uget_settings_email_replies", e.target.checked);
                          }}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>

                  {/* Reply to email address */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">'Reply To' email address</div>
                      <div className="settings-value">{user?.email || "No email"}</div>
                      <div className="settings-desc">
                        The email address that newsletter subscribers will see in the 'Reply-To' field.
                      </div>
                    </div>
                  </div>

                  {/* Import subscribers */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Import email subscribers</div>
                      <div className="settings-desc">
                        Upload a CSV or TXT file list containing up to 25,000 email addresses to migrate your newsletter audience.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".csv,.txt";
                          input.onchange = () => {
                            if (input.files?.[0]) {
                              showMsg(`File "${input.files[0].name}" successfully parsed. Added subscribers (simulation).`, "ok");
                            }
                          };
                          input.click();
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors inline-flex"
                        title="Import list"
                      >
                        <ArrowRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
 
            {/* TAB CONTENT: Privacy */}
            {activeTab === "privacy" && (
              <div className="flex flex-col gap-10">
                {/* Social section */}
                <div>
                  <h2 className="settings-section-title" style={{ marginTop: 0 }}>Social</h2>

                  <div style={{ marginBottom: 4 }}>
                    <div className="settings-label" style={{ marginBottom: 4 }}>Activity tab</div>
                    <div className="settings-desc" style={{ marginBottom: 16 }}>
                      Control which public actions appear on your profile&apos;s recent activity tab.
                    </div>
                    <div className="flex flex-col gap-3">
                      {([
                        { label: "Claps", checked: privClaps, set: setPrivClaps, key: "priv_claps" },
                        { label: "Responses", checked: privResponses, set: setPrivResponses, key: "priv_responses" },
                        { label: "Highlights", checked: privHighlights, set: setPrivHighlights, key: "priv_highlights" }
                      ] as { label: string; checked: boolean; set: (v: boolean) => void; key: string }[]).map(({ label, checked, set, key }) => (
                        <div key={label} className="medium-checkbox-container" style={{ padding: "4px 0" }}>
                          <div
                            onClick={() => {
                              const n = !checked;
                              set(n);
                              localStorage.setItem(`uget_settings_${key}`, String(n));
                              showMsg(`${label} ${n ? "visible" : "hidden"}`);
                            }}
                            className={`medium-checkbox-box ${checked ? "checked" : ""}`}
                          >
                            {checked && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="medium-checkbox-label" style={{ userSelect: "none" }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Address book section */}
                <div>
                  <h2 className="settings-section-title">Address book</h2>
                  <div>
                    <div className="settings-label" style={{ marginBottom: 4 }}>Discoverability</div>
                    <div className="settings-desc" style={{ marginBottom: 16 }}>
                      Who can discover your profile or connect with you if they have your email?
                    </div>
                    <div className="flex flex-col gap-3">
                      {["Everyone", "Nobody"].map((option) => (
                        <div key={option} className="medium-radio-container" style={{ padding: "4px 0" }}>
                          <div
                            onClick={() => {
                              setPrivDiscoverability(option);
                              localStorage.setItem("uget_settings_priv_discoverability", option);
                              showMsg(`Discoverability set to ${option}`);
                            }}
                            className={`medium-radio-circle ${privDiscoverability === option ? "selected" : ""}`}
                          >
                            {privDiscoverability === option && <div className="medium-radio-circle-dot" />}
                          </div>
                          <span className="medium-radio-label" style={{ userSelect: "none" }}>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Notifications */}
            {activeTab === "notifications" && (
              <div className="flex flex-col gap-0" style={{ maxWidth: 680 }}>
                <h2 style={{ fontFamily: "var(--sans)", fontSize: 28, fontWeight: 700, color: "#242424", marginBottom: 28 }}>Email notifications</h2>

                {/* Story recommendations */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>Story recommendations</h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">EchoGist Digest</div>
                        <div className="settings-desc">
                          The best stories on EchoGist personalized based on your interests, as well as outstanding stories selected by our editors.
                        </div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !digestEnabled;
                              setDigestEnabled(n);
                              localStorage.setItem("uget_settings_notif_digest", String(n));
                              showMsg(`Digest recommendations ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${digestEnabled ? "checked" : ""}`}
                          >
                            {digestEnabled && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Your EchoGist Digest frequency</div>
                        <div className="settings-desc">Adjust how often you see a new Digest.</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-select-container">
                          <select
                            value={digestFrequency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDigestFrequency(val);
                              localStorage.setItem("uget_settings_notif_digest_freq", val);
                              showMsg(`Digest frequency set to ${val}`);
                            }}
                            className="medium-select"
                          >
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Never">Never</option>
                          </select>
                          <div className="medium-select-caret">
                            <svg viewBox="0 0 10 6" width="10" height="6">
                              <path d="M1 1l4 4 4-4" fill="none" stroke="#1a8917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Recommended reading</div>
                        <div className="settings-desc">
                          Featured stories, columns, and collections that we think you&apos;ll enjoy based on your reading history.
                        </div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !recommendedReading;
                              setRecommendedReading(n);
                              localStorage.setItem("uget_settings_notif_recommended", String(n));
                              showMsg(`Recommended reading ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${recommendedReading ? "checked" : ""}`}
                          >
                            {recommendedReading && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* From writers and publications */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>From writers and publications</h3>
                  <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                    <div className="settings-row-main">
                      <div className="settings-label">New stories added to lists you&apos;ve saved</div>
                    </div>
                    <div className="settings-row-action">
                      <div className="medium-checkbox-container">
                        <div
                          onClick={() => {
                            const n = !savedLists;
                            setSavedLists(n);
                            localStorage.setItem("uget_settings_notif_saved_lists", String(n));
                            showMsg(`Saved lists notifications ${n ? "enabled" : "disabled"}`);
                          }}
                          className={`medium-checkbox-box ${savedLists ? "checked" : ""}`}
                        >
                          {savedLists && (
                            <svg viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social activity */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>Social activity</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Follows and matching highlights</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !followsHighlights;
                              setFollowsHighlights(n);
                              localStorage.setItem("uget_settings_notif_follows_highlights", String(n));
                              showMsg(`Follows and highlights notifications ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${followsHighlights ? "checked" : ""}`}
                          >
                            {followsHighlights && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Replies to your responses</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !repliesResponses;
                              setRepliesResponses(n);
                              localStorage.setItem("uget_settings_notif_replies_responses", String(n));
                              showMsg(`Replies notifications ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${repliesResponses ? "checked" : ""}`}
                          >
                            {repliesResponses && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Story mentions</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-select-container">
                          <select
                            value={storyMentions}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStoryMentions(val);
                              localStorage.setItem("uget_settings_notif_story_mentions", val);
                              showMsg(`Story mentions set to ${val}`);
                            }}
                            className="medium-select"
                          >
                            <option value="In network">In network</option>
                            <option value="Everyone">Everyone</option>
                            <option value="Nobody">Nobody</option>
                          </select>
                          <div className="medium-select-caret">
                            <svg viewBox="0 0 10 6" width="10" height="6">
                              <path d="M1 1l4 4 4-4" fill="none" stroke="#1a8917" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* For writers */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>For writers</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Activity on your published stories</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !writerActivity;
                              setWriterActivity(n);
                              localStorage.setItem("uget_settings_notif_writer_activity", String(n));
                              showMsg(`Published stories activity ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${writerActivity ? "checked" : ""}`}
                          >
                            {writerActivity && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Activity on your lists</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !writerLists;
                              setWriterLists(n);
                              localStorage.setItem("uget_settings_notif_writer_lists", String(n));
                              showMsg(`Lists activity notifications ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${writerLists ? "checked" : ""}`}
                          >
                            {writerLists && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">From editors about featuring your stories</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !writerEditorFeature;
                              setWriterEditorFeature(n);
                              localStorage.setItem("uget_settings_notif_writer_feature", String(n));
                              showMsg(`Editor feature notifications ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${writerEditorFeature ? "checked" : ""}`}
                          >
                            {writerEditorFeature && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* For publications */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>For publications</h3>
                  <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                    <div className="settings-row-main">
                      <div className="settings-label">New submissions</div>
                    </div>
                    <div className="settings-row-action">
                      <div className="medium-checkbox-container">
                        <div
                          onClick={() => {
                            const n = !pubSubmissions;
                            setPubSubmissions(n);
                            localStorage.setItem("uget_settings_notif_pub_submissions", String(n));
                            showMsg(`Submissions notifications ${n ? "enabled" : "disabled"}`);
                          }}
                          className={`medium-checkbox-box ${pubSubmissions ? "checked" : ""}`}
                        >
                          {pubSubmissions && (
                            <svg viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* For submissions */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>For submissions</h3>
                  <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                    <div className="settings-row-main">
                      <div className="settings-label">Submission status changes</div>
                    </div>
                    <div className="settings-row-action">
                      <div className="medium-checkbox-container">
                        <div
                          onClick={() => {
                            const n = !submissionStatus;
                            setSubmissionStatus(n);
                            localStorage.setItem("uget_settings_notif_sub_status", String(n));
                            showMsg(`Submission status changes ${n ? "enabled" : "disabled"}`);
                          }}
                          className={`medium-checkbox-box ${submissionStatus ? "checked" : ""}`}
                        >
                          {submissionStatus && (
                            <svg viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Others from EchoGist */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 600, color: "#242424", marginBottom: 20 }}>Others from EchoGist</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">New product features from EchoGist</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !otherProductFeatures;
                              setOtherProductFeatures(n);
                              localStorage.setItem("uget_settings_notif_other_features", String(n));
                              showMsg(`Product feature updates ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${otherProductFeatures ? "checked" : ""}`}
                          >
                            {otherProductFeatures && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Information about EchoGist membership</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !otherMembership;
                              setOtherMembership(n);
                              localStorage.setItem("uget_settings_notif_other_membership", String(n));
                              showMsg(`Membership info notifications ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${otherMembership ? "checked" : ""}`}
                          >
                            {otherMembership && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                      <div className="settings-row-main">
                        <div className="settings-label">Writing updates and announcements</div>
                      </div>
                      <div className="settings-row-action">
                        <div className="medium-checkbox-container">
                          <div
                            onClick={() => {
                              const n = !otherAnnouncements;
                              setOtherAnnouncements(n);
                              localStorage.setItem("uget_settings_notif_other_announcements", String(n));
                              showMsg(`Announcements ${n ? "enabled" : "disabled"}`);
                            }}
                            className={`medium-checkbox-box ${otherAnnouncements ? "checked" : ""}`}
                          >
                            {otherAnnouncements && (
                              <svg viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allow email notifications master toggle */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24, marginBottom: 32 }}>
                  <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                    <div className="settings-row-main">
                      <div className="settings-label">Allow email notifications</div>
                      <div className="settings-desc">You&apos;ll still receive administrative emails even if this setting is off.</div>
                    </div>
                    <div className="settings-row-action">
                      <div className="medium-checkbox-container">
                        <div
                          onClick={() => {
                            const n = !allowEmailNotifications;
                            setAllowEmailNotifications(n);
                            localStorage.setItem("uget_settings_notif_allow_email", String(n));
                            showMsg(`Master email notifications ${n ? "enabled" : "disabled"}`);
                          }}
                          className={`medium-checkbox-box ${allowEmailNotifications ? "checked" : ""}`}
                        >
                          {allowEmailNotifications && (
                            <svg viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Push notifications */}
                <div>
                  <h2 style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 700, color: "#242424", marginBottom: 16 }}>Push notifications</h2>
                  <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "#757575" }}>
                    Open the EchoGist app from your mobile device to make changes to push notifications.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Membership */}
            {activeTab === "membership" && (
              <div className="flex flex-col gap-6" style={{ maxWidth: 680 }}>
                {/* Top upgrade banner */}
                {showPromoBanner && (
                  <div className="membership-promo-banner">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>✨</span>
                      <span className="membership-promo-text">
                        Get unlimited access to the best of EchoGist for less than $1/week.{" "}
                        <button
                          onClick={() => alert("Membership page — upgrade flow simulated!")}
                          className="membership-promo-link"
                          style={{ color: "#242424", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0, fontFamily: "var(--sans)", textDecoration: "underline" }}
                        >
                          Become a member
                        </button>
                      </span>
                    </div>
                    <button onClick={() => setShowPromoBanner(false)} className="membership-promo-close">×</button>
                  </div>
                )}

                {/* Upgrade to Membership row */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24 }}>
                  <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                    <div className="settings-row-main">
                      <div className="settings-label" style={{ fontSize: 16 }}>Upgrade to a EchoGist Membership</div>
                      <div className="settings-desc">
                        Subscribe for unlimited access to the smartest writers and biggest ideas on EchoGist.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => alert("Membership upgrade page simulated!")}
                        className="diagonal-arrow-btn"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payout methods */}
                <div style={{ borderBottom: "1px solid #f2f2f2", paddingBottom: 24 }}>
                  <div className="settings-row" style={{ padding: 0, borderBottom: "none", alignItems: "center" }}>
                    <div className="settings-row-main">
                      <div className="settings-label">Payout methods</div>
                      <div className="settings-value" style={{ fontSize: 14, color: "#242424", fontWeight: 500, margin: "6px 0" }}>No payout methods configured</div>
                      <div className="settings-desc">
                        Connect a Stripe Express account to receive payouts from the Partner Program and reader tipping.
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => alert("Stripe onboarding flow simulated!")}
                        style={{ background: "#242424", color: "#ffffff", padding: "8px 16px", borderRadius: "99px", fontSize: 13, fontWeight: 500, transition: "background-color 0.15s", border: "none", cursor: "pointer" }}
                      >
                        Set up Stripe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Security */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="settings-section-title">Account Security</div>

                  {/* Password row */}
                  <div className="settings-row">
                    <div className="settings-row-main flex flex-col gap-3">
                      <div className="settings-label">Change Password</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320 }}>
                        <input
                          type="password"
                          placeholder="Current Password"
                          style={{ border: "1px solid var(--border-2)", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "var(--sans)", color: "var(--ink)", outline: "none", background: "var(--bg)", transition: "border-color 0.2s" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-2)"}
                        />
                        <input
                          type="password"
                          placeholder="New Password"
                          style={{ border: "1px solid var(--border-2)", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "var(--sans)", color: "var(--ink)", outline: "none", background: "var(--bg)", transition: "border-color 0.2s" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-2)"}
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          style={{ border: "1px solid var(--border-2)", borderRadius: 12, padding: "12px 16px", fontSize: 14, fontFamily: "var(--sans)", color: "var(--ink)", outline: "none", background: "var(--bg)", transition: "border-color 0.2s" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
                          onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-2)"}
                        />
                      </div>
                    </div>
                    <div className="settings-row-action">
                      <button
                        onClick={() => showMsg("Password changed (simulated)!", "ok")}
                        className="btn btn-primary"
                        style={{ borderRadius: 999, padding: "10px 24px", fontSize: 14, fontWeight: 600 }}
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  {/* Two factor */}
                  <div className="settings-row">
                    <div className="settings-row-main">
                      <div className="settings-label">Two-factor authentication (2FA)</div>
                      <div className="settings-desc">
                        Add an extra layer of security to your EchoGist account by requiring a code from your phone upon sign in.
                      </div>
                    </div>
                    <div className="settings-row-action" style={{ display: "flex", alignItems: "center" }}>
                      <label className="toggle-switch" style={{ position: "relative", display: "inline-block", width: 44, height: 24 }}>
                        <input
                          type="checkbox"
                          style={{ opacity: 0, width: 0, height: 0 }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              alert("Please set up Google Authenticator or an equivalent TOTP app (simulation).");
                            }
                          }}
                        />
                        <span className="toggle-slider" style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "var(--border-2)", transition: "0.4s", borderRadius: 34 }}>
                          <span style={{ position: "absolute", height: 18, width: 18, left: 3, bottom: 3, backgroundColor: "white", transition: "0.4s", borderRadius: "50%", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
 
          {/* Right sidebar help articles widget */}
          <aside className="settings-help-sidebar">
            <div className="settings-help-card" style={{ border: "none", padding: "0 0 0 24px", background: "transparent", borderLeft: "1px solid var(--border)", borderRadius: 0 }}>
              <h3 className="settings-help-title" style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--black)", marginBottom: 20 }}>Suggested help articles</h3>
              <Link
                href="/help"
                className="settings-help-link hover:underline"
                style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, display: "block", textDecoration: "none" }}
              >
                Sign in or sign up to EchoGist
              </Link>
              <Link
                href="/help"
                className="settings-help-link hover:underline"
                style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, display: "block", textDecoration: "none" }}
              >
                Your profile page
              </Link>
              <Link
                href="/help"
                className="settings-help-link hover:underline"
                style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, display: "block", textDecoration: "none" }}
              >
                Writing and publishing your first story
              </Link>
              <Link
                href="/help"
                className="settings-help-link hover:underline"
                style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, display: "block", textDecoration: "none" }}
              >
                About EchoGist's distribution system
              </Link>
              <Link
                href="/help"
                className="settings-help-link hover:underline"
                style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, display: "block", textDecoration: "none" }}
              >
                Get started with the Partner Program
              </Link>
 
              <div className="settings-help-footer" style={{ borderTop: "none", paddingTop: 0, marginTop: 40, color: "var(--muted-2)", fontSize: 12, lineHeight: 1.8, display: "flex", flexWrap: "wrap", gap: "8px 12px" }}>
                {[
                  { label: "Help", href: "/help" },
                  { label: "Status", href: "/status" },
                  { label: "About", href: "/about" },
                  { label: "Careers", href: "/careers" },
                  { label: "Press", href: "/press" },
                  { label: "Blog", href: "/blog" },
                  { label: "Privacy", href: "/privacy" },
                  { label: "Rules", href: "/rules" },
                  { label: "Terms", href: "/terms" },
                  { label: "Text to speech", href: "/text-to-speech" }
                ].map((item) => (
                  <Link key={item.label} href={item.href} style={{ color: "var(--muted-2)", textDecoration: "none" }} className="hover:underline">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
