"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import SafeImage from "./SafeImage";

type AdminTab = "overview" | "posts" | "users" | "payments" | "staff" | "analytics";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="admin-stat-card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="admin-stat-number">{value}</div>
    </div>
  );
}

import Navbar from "@/components/Navbar";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [allProfileViews, setAllProfileViews] = useState<any[]>([]);
  const [allFollows, setAllFollows] = useState<any[]>([]);
  const [allLikes, setAllLikes] = useState<any[]>([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<"today" | "week" | "month" | "quarter" | "6months" | "year" | "16months" | "custom" | "all">("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [dateModalTab, setDateModalTab] = useState<"filter" | "compare">("filter");
  const [tempPeriodOption, setTempPeriodOption] = useState<string>("6months");
  const [tempStartDate, setTempStartDate] = useState<string>("");
  const [tempEndDate, setTempEndDate] = useState<string>("");
  const [analyticsQuota, setAnalyticsQuota] = useState<"all" | "staff" | "personal">("all");
  const [analyticsRankTab, setAnalyticsRankTab] = useState<"impressions" | "followers" | "both">("both");
  const [awardModalUser, setAwardModalUser] = useState<any | null>(null);
  const [awardAmount, setAwardAmount] = useState("");
  const [awardNote, setAwardNote] = useState("");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNotAdmin, setIsNotAdmin] = useState(false);
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [debugUser, setDebugUser] = useState<any>(null);
  const [debugRole, setDebugRole] = useState<string | null>(null);

  // Official EchoGist Staff Profile state
  const [staffName, setStaffName] = useState("EchoGist Staff");
  const [staffUsername, setStaffUsername] = useState("echogiststaff");
  const [staffBio, setStaffBio] = useState("");
  const [staffAvatarUrl, setStaffAvatarUrl] = useState("");
  const [uploadingStaffAvatar, setUploadingStaffAvatar] = useState(false);
  const [savingStaffProfile, setSavingStaffProfile] = useState(false);

  useEffect(() => {
    const staff = users.find(u => u.id === "c0de57af-f011-0e5a-ff55-c0de57aff555");
    if (staff) {
      setStaffName(staff.full_name || "EchoGist Staff");
      setStaffUsername(staff.username || "echogiststaff");
      setStaffBio(staff.bio || "");
      setStaffAvatarUrl(staff.avatar_url || "");
    }
  }, [users]);

  const handleStaffAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStaffAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/staff-${Date.now()}.${ext}`;

    const { error, data } = await supabase.storage.from("avatars").upload(path, file);

    if (error) {
      showMsg(error.message, "err");
      setUploadingStaffAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
    setStaffAvatarUrl(publicUrl);
    setUploadingStaffAvatar(false);
    showMsg("Staff profile picture uploaded!");
  };

  const handleSaveStaffProfile = async () => {
    if (!staffName.trim()) {
      showMsg("Display name is required", "err");
      return;
    }
    setSavingStaffProfile(true);

    const payload = {
      id: "c0de57af-f011-0e5a-ff55-c0de57aff555",
      full_name: staffName.trim(),
      username: staffUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, ""),
      bio: staffBio.trim(),
      avatar_url: staffAvatarUrl,
      role: "staff",
      updated_at: new Date().toISOString()
    };

    const exists = users.some(u => u.id === "c0de57af-f011-0e5a-ff55-c0de57aff555");
    const query = exists
      ? supabase.from("profiles").update(payload).eq("id", "c0de57af-f011-0e5a-ff55-c0de57aff555")
      : supabase.from("profiles").insert(payload);

    const { error } = await query;

    setSavingStaffProfile(false);
    if (error) {
      showMsg(error.message, "err");
    } else {
      showMsg("Staff profile updated successfully!");
      loadData();
    }
  };

  const showMsg = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    checkAdmin();
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPublicPosts = async () => {
    const { data } = await supabase.from("posts")
      .select("*, profiles(full_name, avatar_url, username)")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) setPublicPosts(data as Post[]);
  };

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setDebugUser(user);
    if (!user || !user.email || user.email.toLowerCase() !== "ugettechnologies@gmail.com") {
      await loadPublicPosts();
      setIsNotAdmin(true);
      setLoading(false);
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    setDebugRole(prof?.role || "null");
    
    if (prof && prof.role !== "admin") {
      await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
      setDebugRole("admin");
    }
    
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const [postsRes, usersRes, subsRes, viewsRes, followsRes, likesRes] = await Promise.all([
      supabase.from("posts").select("*, profiles(full_name, avatar_url, username)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("profile_views").select("*").order("created_at", { ascending: false }),
      supabase.from("follows").select("*").order("created_at", { ascending: false }),
      supabase.from("likes").select("*").order("created_at", { ascending: false }),
    ]);
    setPosts(postsRes.data as Post[] || []);
    setUsers(usersRes.data as Profile[] || []);
    setSubscriptions(subsRes.data as any[] || []);
    setAllProfileViews(viewsRes.data || []);
    setAllFollows(followsRes.data || []);
    setAllLikes(likesRes.data || []);
    setLoading(false);
  };

  const handleUpdateSubStatus = async (subId: string, status: string) => {
    const { error } = await supabase.from("subscriptions").update({ status }).eq("id", subId);
    if (error) { showMsg(error.message, "err"); return; }
    setSubscriptions(subscriptions.map(s => s.id === subId ? { ...s, status } : s));
    showMsg(`Subscription status updated to ${status}`);
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { showMsg(error.message, "err"); return; }
    setPosts(posts.filter((p) => p.id !== id));
    showMsg("Post deleted");
  };

  const handleToggleFeatured = async (post: Post) => {
    const { data, error } = await supabase.from("posts").update({ featured: !post.featured }).eq("id", post.id).select().single();
    if (error) { showMsg(error.message, "err"); return; }
    setPosts(posts.map((p) => p.id === post.id ? data as Post : p));
    showMsg(data.featured ? "Marked as featured" : "Removed from featured");
  };

  const handleTogglePublish = async (post: Post) => {
    const { data, error } = await supabase.from("posts").update({ published: !post.published }).eq("id", post.id).select().single();
    if (error) { showMsg(error.message, "err"); return; }
    setPosts(posts.map((p) => p.id === post.id ? data as Post : p));
    showMsg(data.published ? "Post published" : "Post unpublished");
  };

  const handleChangeRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (error) { showMsg(error.message, "err"); return; }
    setUsers(users.map((u) => u.id === userId ? { ...u, role: role as Profile["role"] } : u));
    showMsg(`Role updated to ${role}`);
  };

  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const published = posts.filter((p) => p.published);

  const navItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "posts", label: "All Posts", icon: "📝" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "staff", label: "Staff", icon: "🛡️" },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  if (isNotAdmin) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--ink)", width: "100%" }}>
        <Navbar />
        <div style={{ maxWidth: 680, margin: "80px auto 40px", padding: "0 24px", textAlign: "center" }}>
          <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Page not found</span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: 110, fontWeight: 400, margin: "16px 0", color: "var(--black)", lineHeight: 1 }}>404</h1>
          <h2 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 700, marginBottom: 16, color: "var(--black)" }}>Out of nothing, something.</h2>
          <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32, marginLeft: "auto", marginRight: "auto", maxWidth: 540 }}>
            You can find (just about) anything on EchoGist — apparently even a page that doesn't exist. Maybe these stories will take you somewhere new?
          </p>
          <Link href="/" className="btn btn-outline" style={{ textDecoration: "none", borderRadius: 999, padding: "10px 24px", display: "inline-flex", borderColor: "var(--border)", color: "var(--black)" }}>
            Home
          </Link>
          {debugUser && (
            <div style={{ 
              marginTop: 40, 
              padding: 20, 
              background: "var(--bg-2)", 
              border: "1px solid var(--border)", 
              borderRadius: 12,
              textAlign: "left",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: "var(--muted)",
              maxWidth: 480,
              margin: "40px auto 0"
            }}>
              <strong style={{ display: "block", color: "var(--black)", marginBottom: 8, fontSize: 14 }}>🔍 Admin Access Diagnostic Info</strong>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Session Email:</span>
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{debugUser.email || "Unknown"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>Database Role:</span>
                <span style={{ fontWeight: 600, color: "var(--brand)" }}>{debugRole || "Checking..."}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>User UUID:</span>
                <span style={{ fontFamily: "monospace", fontSize: 11 }}>{debugUser.id}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)", padding: "60px 24px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 24 }}>Recommended stories</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {publicPosts.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>
                  No recommendations available
                </div>
              ) : (
                publicPosts.map((p) => {
                  const author = p.profiles as any;
                  return (
                    <article key={p.id} style={{ paddingBottom: 24, borderBottom: "1px solid var(--border-2)", display: "flex", gap: 24, justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {author?.avatar_url ? <Image src={author.avatar_url} alt="" width={20} height={20} style={{ objectFit: "cover" }} /> : getInitials(author?.full_name)}
                          </div>
                          <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--black)" }}>{author?.full_name || "Writer"}</span>
                          <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>· {formatDate(p.created_at)}</span>
                        </div>
                        <Link href={`/post/${p.slug}`} style={{ textDecoration: "none" }}>
                          <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", margin: "4px 0 8px", lineHeight: 1.3 }}>{p.title}</h4>
                          {p.excerpt && <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.excerpt}</p>}
                        </Link>
                      </div>
                      <Link href={`/post/${p.slug}`} style={{ width: 100, height: 100, borderRadius: 6, overflow: "hidden", flexShrink: 0, display: "block" }}>
                        <SafeImage src={p.cover_image} alt="" width={100} height={100} fallbackSeed={p.id || p.slug} />
                      </Link>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-2)" }}>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "err" ? "toast-error" : "toast-success"}`}>
            {toast.type === "ok" ? "✓" : "✗"} {toast.msg}
          </div>
        </div>
      )}

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)} 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 80,
            display: "none"
          }} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className="admin-sidebar" 
        style={{ 
          transform: sidebarOpen ? "none" : "translateX(-240px)", 
          transition: "transform 0.3s ease", 
          position: "fixed", 
          top: 0, 
          left: 0, 
          zIndex: 90,
          visibility: sidebarOpen ? "visible" : "hidden",
          pointerEvents: sidebarOpen ? "auto" : "none"
        }}
      >
        <div className="admin-logo">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image src="/logo-icon.png" alt="EchoGist" width={24} height={24} className="object-contain" />
            <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)" }}>EchoGist Admin</span>
          </div>
        </div>
        <nav style={{ padding: "8px 0" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`admin-nav-item ${tab === item.id ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "posts" && <span style={{ marginLeft: "auto", background: "var(--bg-3)", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{posts.length}</span>}
              {item.id === "users" && <span style={{ marginLeft: "auto", background: "var(--bg-3)", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{users.length}</span>}
              {item.id === "payments" && subscriptions.filter(s => s.status === 'pending_approval').length > 0 && <span style={{ marginLeft: "auto", background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{subscriptions.filter(s => s.status === 'pending_approval').length}</span>}
              {item.id === "staff" && <span style={{ marginLeft: "auto", background: "var(--bg-3)", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{users.filter(u => u.role === 'staff').length}</span>}
            </button>
          ))}
          <div style={{ height: 1, background: "var(--border-2)", margin: "12px 0" }} />
          <Link href="/" className="admin-nav-item" style={{ textDecoration: "none" }}>
            <span>🌐</span><span>View site</span>
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: sidebarOpen ? 240 : 0, transition: "margin-left 0.3s ease", minWidth: 0 }}>
        {/* Topbar */}
        <div className="admin-topbar" style={{ zIndex: 75 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="admin-page-title">
            {navItems.find((n) => n.id === tab)?.label}
          </h1>
          {tab === "posts" && (
            <Link href="/write" className="btn btn-primary btn-sm" style={{ textDecoration: "none", marginLeft: "auto" }}>
              + New post
            </Link>
          )}
        </div>

        <div className="admin-content">
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", flexDirection: "column", gap: 16 }}>
              <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--ink)", borderWidth: 3 }} />
              <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>Loading…</p>
            </div>
          ) : (
            <>
              {/* ── ANALYTICS & RANKINGS ── */}
              {tab === "analytics" && (() => {
                const now = new Date();
                
                let cutoffDate: Date | null = null;
                let maxDate: Date | null = null;
                let daysInPeriod = 0;
                let periodLabel = "28 days";

                if (analyticsPeriod === "today") {
                  cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                  daysInPeriod = 1;
                  periodLabel = "24 hours";
                } else if (analyticsPeriod === "week") {
                  cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  daysInPeriod = 7;
                  periodLabel = "7 days";
                } else if (analyticsPeriod === "month") {
                  cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
                  daysInPeriod = 28;
                  periodLabel = "28 days";
                } else if (analyticsPeriod === "quarter") {
                  cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                  daysInPeriod = 90;
                  periodLabel = "3 months";
                } else if (analyticsPeriod === "6months") {
                  cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                  daysInPeriod = 180;
                  periodLabel = "6 months";
                } else if (analyticsPeriod === "year") {
                  cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                  daysInPeriod = 365;
                  periodLabel = "12 months";
                } else if (analyticsPeriod === "16months") {
                  cutoffDate = new Date(now.getTime() - 480 * 24 * 60 * 60 * 1000);
                  daysInPeriod = 480;
                  periodLabel = "16 months";
                } else if (analyticsPeriod === "custom" && customStartDate && customEndDate) {
                  cutoffDate = new Date(customStartDate);
                  maxDate = new Date(customEndDate);
                  maxDate.setHours(23, 59, 59, 999);
                  const diffTime = Math.abs(maxDate.getTime() - cutoffDate.getTime());
                  daysInPeriod = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                  periodLabel = `${customStartDate} – ${customEndDate}`;
                } else {
                  cutoffDate = null;
                  daysInPeriod = 0;
                  periodLabel = "All time";
                }

                const filterByPeriod = (arr: any[]) => {
                  if (!cutoffDate) return arr;
                  return arr.filter(item => {
                    if (!item.created_at) return false;
                    const itemDate = new Date(item.created_at);
                    if (maxDate) {
                      return itemDate >= cutoffDate! && itemDate <= maxDate;
                    }
                    return itemDate >= cutoffDate!;
                  });
                };

                const filteredViews = filterByPeriod(allProfileViews);
                const filteredFollows = filterByPeriod(allFollows);
                const filteredLikes = filterByPeriod(allLikes);

                const getPostViewsInPeriod = (p: Post) => {
                  const views = p.view_count || 0;
                  if (views === 0) return 0;
                  if (!cutoffDate || daysInPeriod === 0) return views;
                  
                  const postDate = new Date(p.created_at || now);
                  const daysOld = Math.max(1, (now.getTime() - postDate.getTime()) / (1000 * 3600 * 24));
                  
                  if (postDate < cutoffDate) {
                    const dailyRate = views / daysOld;
                    return Math.min(views, Math.max(1, Math.round(dailyRate * daysInPeriod)));
                  } else {
                    return views;
                  }
                };

                // Compute creator statistics & ranks
                const creators = users
                  .filter(u => {
                    if (analyticsQuota === "staff") return u.role === "staff";
                    if (analyticsQuota === "personal") return u.role !== "staff" && u.role !== "admin";
                    return u.role !== "reader"; // all active writers & staff
                  })
                  .map(u => {
                    // Profile views for user in period
                    const userProfileViews = filteredViews.filter(v => v.profile_id === u.id).length;
                    
                    // User posts
                    const userPosts = posts.filter(p => p.author_id === u.id);
                    
                    // Post views for user's posts in period
                    const postViewsTotal = userPosts.reduce((sum, p) => sum + getPostViewsInPeriod(p), 0);
                    
                    // Total Impressions (Sum of profile visits + article views in period)
                    const totalImpressions = userProfileViews + postViewsTotal;
                    
                    // Followers gained for user in period
                    const newFollowers = filteredFollows.filter(f => f.following_id === u.id).length;
                    const totalFollowers = u.follower_count || allFollows.filter(f => f.following_id === u.id).length;

                    // Likes gained for user in period
                    const likesGained = filteredLikes.filter(l => {
                      const likedPost = posts.find(p => p.id === l.post_id);
                      return likedPost && likedPost.author_id === u.id;
                    }).length;

                    // Combined Performance Score
                    const combinedScore = totalImpressions + (newFollowers * 10) + (likesGained * 5);

                    return {
                      ...u,
                      userPostsCount: userPosts.length,
                      userProfileViews,
                      postViewsTotal,
                      totalImpressions,
                      newFollowers,
                      totalFollowers,
                      likesGained,
                      combinedScore,
                    };
                  });

                // Sort creators based on selected rank tab
                let rankedCreators = [...creators];
                if (analyticsRankTab === "impressions") {
                  rankedCreators.sort((a, b) => b.totalImpressions - a.totalImpressions);
                } else if (analyticsRankTab === "followers") {
                  rankedCreators.sort((a, b) => b.newFollowers !== a.newFollowers ? b.newFollowers - a.newFollowers : b.totalFollowers - a.totalFollowers);
                } else {
                  rankedCreators.sort((a, b) => b.combinedScore - a.combinedScore);
                }

                // Total calculated impressions for overall dashboard card
                const targetPostsForCard = posts.filter(p => {
                  if (analyticsQuota === "staff") {
                    const author = users.find(u => u.id === p.author_id);
                    return author?.role === "staff";
                  }
                  if (analyticsQuota === "personal") {
                    const author = users.find(u => u.id === p.author_id);
                    return author?.role !== "staff" && author?.role !== "admin";
                  }
                  return true;
                });
                const cardTotalPostViews = targetPostsForCard.reduce((s, p) => s + getPostViewsInPeriod(p), 0);
                const cardTotalImpressions = filteredViews.length + cardTotalPostViews;

                return (
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                      <div>
                        <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, margin: 0, color: "var(--black)" }}>
                          Analytics, Impressions & Staff Payment Rankings
                        </h3>
                        <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
                          Track creator performance, impression counts, and follower growth to decide daily, monthly & yearly payment awards.
                        </p>
                      </div>

                      {/* Quota Filter Toggle */}
                      <div style={{ display: "flex", gap: 6, background: "var(--bg-3)", padding: 4, borderRadius: 10, border: "1px solid var(--border)" }}>
                        <button
                          onClick={() => setAnalyticsQuota("all")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            fontFamily: "var(--sans)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: analyticsQuota === "all" ? "var(--brand)" : "transparent",
                            color: analyticsQuota === "all" ? "white" : "var(--muted)"
                          }}
                        >
                          🌐 All Creators
                        </button>
                        <button
                          onClick={() => setAnalyticsQuota("staff")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            fontFamily: "var(--sans)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: analyticsQuota === "staff" ? "var(--brand)" : "transparent",
                            color: analyticsQuota === "staff" ? "white" : "var(--muted)"
                          }}
                        >
                          🛡️ Staff Quota Only
                        </button>
                        <button
                          onClick={() => setAnalyticsQuota("personal")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: "none",
                            fontFamily: "var(--sans)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            background: analyticsQuota === "personal" ? "var(--brand)" : "transparent",
                            color: analyticsQuota === "personal" ? "white" : "var(--muted)"
                          }}
                        >
                          👤 Personal Creators
                        </button>
                      </div>
                    </div>

                    {/* Time Period Selector Bar - Google Search Console Style */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", alignItems: "center", background: "var(--bg-3)", padding: "6px 8px", borderRadius: 12, border: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px" }}>
                        Timeframe:
                      </span>
                      {[
                        { id: "today", label: "24 hours" },
                        { id: "week", label: "7 days" },
                        { id: "month", label: "28 days" },
                        { id: "quarter", label: "3 months" },
                      ].map(p => {
                        const isSelected = analyticsPeriod === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setAnalyticsPeriod(p.id as any)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: isSelected ? "1px solid rgba(124, 58, 237, 0.4)" : "1px solid transparent",
                              background: isSelected ? "var(--bg-2)" : "transparent",
                              color: isSelected ? "var(--brand)" : "var(--ink)",
                              fontFamily: "var(--sans)",
                              fontSize: 13,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: "pointer",
                              boxShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                            {isSelected && <span style={{ fontSize: 12, color: "var(--brand)" }}>✓</span>}
                            <span>{p.label}</span>
                          </button>
                        );
                      })}

                      {/* More ▾ Button for Custom Date & Range Modal */}
                      <button
                        onClick={() => {
                          setTempPeriodOption(["6months", "year", "16months", "custom"].includes(analyticsPeriod) ? analyticsPeriod : "6months");
                          setTempStartDate(customStartDate || "2026-07-30");
                          setTempEndDate(customEndDate || new Date().toISOString().split("T")[0]);
                          setDateModalOpen(true);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: ["6months", "year", "16months", "custom"].includes(analyticsPeriod) ? "1px solid rgba(124, 58, 237, 0.4)" : "1px solid var(--border)",
                          background: ["6months", "year", "16months", "custom"].includes(analyticsPeriod) ? "var(--bg-2)" : "transparent",
                          color: ["6months", "year", "16months", "custom"].includes(analyticsPeriod) ? "var(--brand)" : "var(--ink)",
                          fontFamily: "var(--sans)",
                          fontSize: 13,
                          fontWeight: ["6months", "year", "16months", "custom"].includes(analyticsPeriod) ? 700 : 500,
                          cursor: "pointer",
                          boxShadow: ["6months", "year", "16months", "custom"].includes(analyticsPeriod) ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {["6months", "year", "16months", "custom"].includes(analyticsPeriod) && <span style={{ fontSize: 12, color: "var(--brand)" }}>✓</span>}
                        <span>
                          {analyticsPeriod === "6months" ? "Last 6 months" :
                           analyticsPeriod === "year" ? "Last 12 months" :
                           analyticsPeriod === "16months" ? "Last 16 months" :
                           analyticsPeriod === "custom" && customStartDate ? `Custom (${customStartDate})` :
                           "More ▾"}
                        </span>
                      </button>

                      {/* All Time Button */}
                      <button
                        onClick={() => setAnalyticsPeriod("all")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: analyticsPeriod === "all" ? "1px solid rgba(124, 58, 237, 0.4)" : "1px solid transparent",
                          background: analyticsPeriod === "all" ? "var(--bg-2)" : "transparent",
                          color: analyticsPeriod === "all" ? "var(--brand)" : "var(--ink)",
                          fontFamily: "var(--sans)",
                          fontSize: 13,
                          fontWeight: analyticsPeriod === "all" ? 700 : 500,
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {analyticsPeriod === "all" && <span style={{ fontSize: 12, color: "var(--brand)" }}>✓</span>}
                        <span>All time</span>
                      </button>
                    </div>

                    {/* Overview Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
                      <StatCard 
                        label={`Total Impressions (${periodLabel})`} 
                        value={cardTotalImpressions.toLocaleString()} 
                        icon="👀" 
                        color="#8b5cf6" 
                      />
                      <StatCard 
                        label={`New Followers (${periodLabel})`} 
                        value={filteredFollows.length.toLocaleString()} 
                        icon="👥" 
                        color="#10b981" 
                      />
                      <StatCard 
                        label={`Likes Received (${periodLabel})`} 
                        value={filteredLikes.length.toLocaleString()} 
                        icon="❤️" 
                        color="#ef4444" 
                      />
                      <StatCard 
                        label="Active Creators Ranked" 
                        value={creators.length.toLocaleString()} 
                        icon="🏆" 
                        color="#f59e0b" 
                      />
                    </div>

                    {/* Ranking Leaderboard Container */}
                    <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <span style={{ fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, color: "var(--black)" }}>
                            🏆 Creator Ranks & Payment Award Leaderboard
                          </span>
                          <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                            Showing ranks for {analyticsQuota === "staff" ? "Staff Members Quota" : analyticsQuota === "personal" ? "Personal Creators" : "All Registered Creators"} ({analyticsPeriod === "today" ? "End of Day" : analyticsPeriod === "month" ? "End of Month" : analyticsPeriod === "year" ? "End of Year" : analyticsPeriod === "week" ? "This Week" : "All Time"})
                          </span>
                        </div>

                        {/* Rank Tab Switcher */}
                        <div style={{ display: "flex", gap: 4, background: "var(--bg-3)", padding: 3, borderRadius: 8 }}>
                          <button
                            onClick={() => setAnalyticsRankTab("impressions")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              fontFamily: "var(--sans)",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: analyticsRankTab === "impressions" ? "white" : "transparent",
                              color: analyticsRankTab === "impressions" ? "var(--black)" : "var(--muted)",
                              boxShadow: analyticsRankTab === "impressions" ? "var(--shadow-sm)" : "none"
                            }}
                          >
                            👁️ Highest Impressions
                          </button>
                          <button
                            onClick={() => setAnalyticsRankTab("followers")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              fontFamily: "var(--sans)",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: analyticsRankTab === "followers" ? "white" : "transparent",
                              color: analyticsRankTab === "followers" ? "var(--black)" : "var(--muted)",
                              boxShadow: analyticsRankTab === "followers" ? "var(--shadow-sm)" : "none"
                            }}
                          >
                            👥 Highest Followers
                          </button>
                          <button
                            onClick={() => setAnalyticsRankTab("both")}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "none",
                              fontFamily: "var(--sans)",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: analyticsRankTab === "both" ? "white" : "transparent",
                              color: analyticsRankTab === "both" ? "var(--black)" : "var(--muted)",
                              boxShadow: analyticsRankTab === "both" ? "var(--shadow-sm)" : "none"
                            }}
                          >
                            ⭐ Combined Rank (Both)
                          </button>
                        </div>
                      </div>

                      {/* Ranks Table */}
                      <div style={{ overflowX: "auto" }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>Creator / Staff Member</th>
                              <th>Quota Type</th>
                              <th>Impressions</th>
                              <th>Followers</th>
                              <th>Articles</th>
                              <th>Performance Score</th>
                              <th>Award Tier</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rankedCreators.map((c, index) => {
                              const rankPos = index + 1;
                              let rankBadge = `#${rankPos}`;
                              let rankBg = "var(--bg-3)";
                              let rankColor = "var(--muted)";

                              if (rankPos === 1) {
                                rankBadge = "🥇 1st";
                                rankBg = "rgba(245, 158, 11, 0.15)";
                                rankColor = "#d97706";
                              } else if (rankPos === 2) {
                                rankBadge = "🥈 2nd";
                                rankBg = "rgba(156, 163, 175, 0.2)";
                                rankColor = "#4b5563";
                              } else if (rankPos === 3) {
                                rankBadge = "🥉 3rd";
                                rankBg = "rgba(180, 83, 9, 0.15)";
                                rankColor = "#b45309";
                              }

                              return (
                                <tr key={c.id} style={{ background: rankPos === 1 ? "rgba(245, 158, 11, 0.03)" : "transparent" }}>
                                  <td>
                                    <span style={{
                                      fontFamily: "var(--sans)",
                                      fontSize: 12,
                                      fontWeight: 800,
                                      padding: "4px 10px",
                                      borderRadius: 999,
                                      background: rankBg,
                                      color: rankColor,
                                      display: "inline-block"
                                    }}>
                                      {rankBadge}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                        {c.avatar_url ? <Image src={c.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} /> : getInitials(c.full_name || "")}
                                      </div>
                                      <div>
                                        <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, color: "var(--black)" }}>
                                          {c.full_name || "—"}
                                        </div>
                                        <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)" }}>
                                          @{c.username || "user"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span style={{
                                      fontFamily: "var(--sans)",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: "3px 8px",
                                      borderRadius: 4,
                                      textTransform: "uppercase",
                                      background: c.role === "staff" ? "rgba(124, 58, 237, 0.15)" : c.role === "admin" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-3)",
                                      color: c.role === "staff" ? "var(--brand)" : c.role === "admin" ? "var(--red)" : "var(--muted)"
                                    }}>
                                      {c.role === "staff" ? "🛡️ Staff Quota" : c.role === "admin" ? "Admin" : "👤 Personal Writer"}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, color: "var(--brand)" }}>
                                      👁️ {c.totalImpressions.toLocaleString()}
                                    </span>
                                    <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>
                                      ({c.postViewsTotal} posts / {c.userProfileViews} profile)
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "#10b981" }}>
                                      +{c.newFollowers} new
                                    </span>
                                    <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>
                                      ({c.totalFollowers} total)
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--black)", fontWeight: 600 }}>
                                      {c.userPostsCount}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 800, color: "var(--black)" }}>
                                      ⚡ {c.combinedScore.toLocaleString()} pts
                                    </span>
                                  </td>
                                  <td>
                                    {rankPos === 1 && (
                                      <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "#d97706", background: "rgba(245, 158, 11, 0.1)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                                        🏆 #1 Payout Tier
                                      </span>
                                    )}
                                    {rankPos === 2 && (
                                      <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "#4b5563", background: "rgba(156, 163, 175, 0.1)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(156, 163, 175, 0.3)" }}>
                                        🥈 #2 Payout Tier
                                      </span>
                                    )}
                                    {rankPos === 3 && (
                                      <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "#b45309", background: "rgba(180, 83, 9, 0.1)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(180, 83, 9, 0.3)" }}>
                                        🥉 #3 Payout Tier
                                      </span>
                                    )}
                                    {rankPos > 3 && (
                                      <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--muted)" }}>
                                        Standard Tier
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => {
                                        setAwardModalUser(c);
                                        setAwardAmount("");
                                        setAwardNote(`Payment award for ${analyticsPeriod.toUpperCase()} rank #${rankPos} (${c.role === 'staff' ? 'Staff Quota' : 'Personal Creator'})`);
                                      }}
                                      style={{
                                        fontFamily: "var(--sans)",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "white",
                                        background: "var(--brand)",
                                        border: "none",
                                        borderRadius: 6,
                                        padding: "6px 12px",
                                        cursor: "pointer"
                                      }}
                                    >
                                      💳 Award Payment
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {rankedCreators.length === 0 && (
                        <div style={{ padding: "60px 0", textAlign: "center" }}>
                          <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)" }}>
                            No creators found for the selected quota filter.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                    <StatCard label="Total posts" value={posts.length} icon="📝" color="#3b82f6" />
                    <StatCard label="Published" value={published.length} icon="🌐" color="#10b981" />
                    <StatCard label="Writers" value={users.length} icon="✍️" color="#8b5cf6" />
                    <StatCard label="Total views" value={totalViews.toLocaleString()} icon="👁" color="#f59e0b" />
                    <StatCard label="Total likes" value={totalLikes} icon="❤️" color="#ef4444" />
                  </div>

                  {/* Recent posts */}
                  <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, color: "var(--black)" }}>Recent posts</span>
                      <button onClick={() => setTab("posts")} style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--blue)", background: "none", border: "none", cursor: "pointer" }}>View all</button>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                      <thead>
                        <tr><th>Title</th><th>Author</th><th>Status</th><th>Views</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {posts.slice(0, 8).map((p) => {
                          const author = p.profiles as any;
                          return (
                            <tr key={p.id}>
                              <td>
                                <Link href={`/post/${p.slug}`} style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 600, color: "var(--black)", textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const, overflow: "hidden", maxWidth: 300 }}>{p.title}</Link>
                              </td>
                              <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{author?.full_name || "—"}</span></td>
                              <td>
                                <span className={`status-badge ${p.published ? "status-published" : "status-draft"}`}>
                                  {p.published ? "Live" : "Draft"}
                                </span>
                              </td>
                              <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{p.view_count}</span></td>
                              <td><span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(p.created_at)}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ALL POSTS ── */}
              {tab === "posts" && (
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                    <thead>
                      <tr><th>Title</th><th>Author</th><th>Category</th><th>Status</th><th>Featured</th><th>Views</th><th>Date</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {posts.map((p) => {
                        const author = p.profiles as any;
                        const cat = CATEGORIES.find((c) => c.id === p.category);
                        return (
                          <tr key={p.id}>
                            <td style={{ maxWidth: 260 }}>
                              <Link href={`/post/${p.slug}`} style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 600, color: "var(--black)", textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                                {p.title}
                              </Link>
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                  {author?.avatar_url ? <Image src={author.avatar_url} alt="" width={24} height={24} style={{ objectFit: "cover" }} /> : getInitials(author?.full_name || "")}
                                </div>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>{author?.full_name || "—"}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", background: "var(--bg-3)", padding: "3px 8px", borderRadius: 999 }}>
                                {cat?.icon} {cat?.label || p.category}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${p.published ? "status-published" : "status-draft"}`}>
                                {p.published ? "Live" : "Draft"}
                              </span>
                            </td>
                            <td>
                              <button onClick={() => handleToggleFeatured(p)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: p.featured ? 1 : 0.25 }}
                                title={p.featured ? "Unfeature" : "Feature"}>
                                ⭐
                              </button>
                            </td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{p.view_count}</span></td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", whiteSpace: "nowrap" }}>{formatDate(p.created_at)}</span></td>
                            <td>
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <Link href={`/write/${p.id}`}
                                  style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--blue)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(21,101,192,0.2)", textDecoration: "none", whiteSpace: "nowrap" }}>
                                  Edit
                                </Link>
                                <button onClick={() => handleTogglePublish(p)}
                                  style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                                  {p.published ? "Unpublish" : "Publish"}
                                </button>
                                <button onClick={() => handleDeletePost(p.id)}
                                  style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--red)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(192,57,43,0.2)", background: "none", cursor: "pointer" }}>
                                  Del
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  {posts.length === 0 && (
                    <div style={{ padding: "60px 0", textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)" }}>No posts yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── USERS ── */}
              {tab === "users" && (
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                    <thead>
                      <tr><th>User</th><th>Username</th><th>Role</th><th>Posts</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                {u.avatar_url ? <Image src={u.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} /> : getInitials(u.full_name || "")}
                              </div>
                              <div>
                                <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--black)" }}>{u.full_name || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>@{u.username || "—"}</span></td>
                          <td>
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              style={{ fontFamily: "var(--sans)", fontSize: 13, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 6, outline: "none", background: "var(--input-bg, white)", color: "var(--ink)", cursor: "pointer" }}
                            >
                              <option value="reader">Reader</option>
                              <option value="writer">Writer</option>
                              <option value="staff">Staff</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{posts.filter((p) => p.author_id === u.id).length}</span></td>
                          <td><span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(u.created_at)}</span></td>
                          <td>
                            <Link href={`/profile/${u.username || u.id}`}
                              style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--blue)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(21,101,192,0.2)", textDecoration: "none" }}>
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {users.length === 0 && (
                    <div style={{ padding: "60px 0", textAlign: "center" }}>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)" }}>No users yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── PAYMENTS ── */}
              {tab === "payments" && (
                <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>Subscriptions & Payments</span>
                    <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                      Total payments: {subscriptions.length}
                    </span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Plan</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Proof / Details</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((sub) => {
                        const profileObj = users.find(u => u.id === sub.user_id);
                        const badgeStyle = sub.status === "active" 
                          ? { backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }
                          : sub.status === "pending_approval"
                            ? { backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)" }
                            : { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" };
                        
                        return (
                          <tr key={sub.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                  {profileObj?.avatar_url ? <Image src={profileObj.avatar_url} alt="" width={24} height={24} style={{ objectFit: "cover" }} /> : getInitials(profileObj?.full_name || "")}
                                </div>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--black)" }}>{profileObj?.full_name || "—"}</span>
                              </div>
                            </td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{(profileObj as any)?.email || "—"}</span></td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--black)", fontWeight: 500 }}>{sub.plan_name}</span></td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>{sub.amount}</span></td>
                            <td>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", textTransform: "capitalize" }}>
                                {sub.payment_method?.replace("_", " ")}
                              </span>
                            </td>
                            <td>
                              {sub.payment_proof_url ? (
                                <a href={sub.payment_proof_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--blue)", fontWeight: 600, textDecoration: "underline" }}>
                                  View Proof 🔗
                                </a>
                              ) : (
                                <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", fontStyle: "italic" }}>No proof provided</span>
                              )}
                            </td>
                            <td>
                              <select
                                value={sub.status}
                                onChange={(e) => handleUpdateSubStatus(sub.id, e.target.value)}
                                style={{
                                  fontFamily: "var(--sans)", 
                                  fontSize: 12, 
                                  padding: "4px 8px", 
                                  borderRadius: 6, 
                                  outline: "none", 
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  ...badgeStyle
                                }}
                              >
                                <option value="pending_approval" style={{ color: "#f59e0b", background: "white" }}>Pending</option>
                                <option value="active" style={{ color: "#10b981", background: "white" }}>Active</option>
                                <option value="expired" style={{ color: "#ef4444", background: "white" }}>Expired</option>
                              </select>
                            </td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", whiteSpace: "nowrap" }}>{formatDate(sub.created_at)}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  {subscriptions.length === 0 && (
                    <div style={{ padding: "60px 0", textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                      <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--muted)" }}>No payments recorded yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STAFF ── */}
              {tab === "staff" && (
                <div>
                  {/* Official EchoGist Staff Profile Settings */}
                  <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>Official EchoGist Staff Profile Settings</span>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Customize the public profile for the official EchoGist Staff account.
                      </p>
                    </div>

                    <div className="admin-staff-settings-grid" style={{ padding: 24, gap: 32 }}>
                      {/* Left: Card Preview */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Profile Card Preview</div>
                        
                        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "var(--shadow-sm)" }}>
                          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f5f3ff", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", marginBottom: 16 }}>
                            {staffAvatarUrl ? (
                              <Image src={staffAvatarUrl} alt="" width={80} height={80} style={{ objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", fontSize: 24, fontWeight: 700, fontFamily: "var(--sans)" }}>
                                {getInitials(staffName)}
                              </div>
                            )}
                            {uploadingStaffAvatar && (
                              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div className="spinner" style={{ width: 20, height: 20 }} />
                              </div>
                            )}
                          </div>
                          
                          <div style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 800, color: "var(--black)", marginBottom: 4 }}>{staffName}</div>
                          <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>@{staffUsername}</div>
                          <div style={{ fontFamily: "var(--serif)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 48 }}>
                            {staffBio || "No bio set yet. Write a public bio on the right."}
                          </div>
                          <button type="button" className="btn btn-primary btn-sm" style={{ width: "100%", borderRadius: 999, pointerEvents: "none" }}>Follow</button>
                        </div>
                      </div>

                      {/* Right: Form fields */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="admin-staff-fields-grid" style={{ gap: 16 }}>
                          <div>
                            <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Display Name</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={staffName} 
                              onChange={(e) => setStaffName(e.target.value)} 
                              style={{ fontSize: 14, padding: "8px 12px", borderRadius: 8, background: "var(--input-bg, white)", color: "var(--ink)" }} 
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Username</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={staffUsername} 
                              onChange={(e) => setStaffUsername(e.target.value)} 
                              style={{ fontSize: 14, padding: "8px 12px", borderRadius: 8, background: "var(--input-bg, white)", color: "var(--ink)" }} 
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Bio Description</label>
                          <textarea 
                            className="form-input" 
                            rows={3} 
                            value={staffBio} 
                            onChange={(e) => setStaffBio(e.target.value)} 
                            style={{ fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "var(--input-bg, white)", color: "var(--ink)", resize: "vertical" }} 
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Profile Picture</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                            <label className="btn btn-outline btn-sm" style={{ cursor: "pointer", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                              📁 {uploadingStaffAvatar ? "Uploading picture..." : "Select New Picture"}
                              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleStaffAvatarUpload} disabled={uploadingStaffAvatar} />
                            </label>
                            {staffAvatarUrl && (
                              <button 
                                type="button" 
                                onClick={() => setStaffAvatarUrl("")}
                                className="btn btn-sm" 
                                style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer" }}
                              >
                                Remove Picture
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-2)", paddingTop: 16, marginTop: 8 }}>
                          <button 
                            type="button" 
                            onClick={handleSaveStaffProfile} 
                            disabled={savingStaffProfile} 
                            className="btn btn-primary" 
                            style={{ borderRadius: 8, padding: "10px 24px", fontWeight: 700 }}
                          >
                            {savingStaffProfile ? "Saving..." : "Save Staff Profile"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current staff table */}
                  <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>EchoGist Staff Members</span>
                      <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                        Active staff: {users.filter(u => u.role === "staff").length}
                      </span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => u.role === "staff").map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                  {u.avatar_url ? <Image src={u.avatar_url} alt="" width={36} height={36} style={{ objectFit: "cover" }} /> : getInitials(u.full_name || "")}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--black)" }}>{u.full_name || "—"}</div>
                                </div>
                              </div>
                            </td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>@{u.username || "—"}</span></td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{(u as any).email || "—"}</span></td>
                            <td>
                              <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, background: "rgba(124,58,237,0.1)", color: "var(--brand)", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>
                                Staff
                              </span>
                            </td>
                            <td><span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(u.created_at)}</span></td>
                            <td>
                              <button
                                onClick={() => handleChangeRole(u.id, "writer")}
                                style={{
                                  fontFamily: "var(--sans)",
                                  fontSize: 12,
                                  color: "var(--red)",
                                  padding: "5px 10px",
                                  borderRadius: 6,
                                  border: "1px solid rgba(192,57,43,0.2)",
                                  background: "none",
                                  cursor: "pointer"
                                }}
                              >
                                Remove Staff
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    {users.filter(u => u.role === "staff").length === 0 && (
                      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)", fontFamily: "var(--sans)", fontSize: 14 }}>
                        No staff members assigned yet.
                      </div>
                    )}
                  </div>

                  {/* Promote/Assign section */}
                  <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>Assign New Staff Members</span>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Select a writer or reader to give them staff writer status. Only staff members and admins can write on EchoGist.
                      </p>
                    </div>
                    
                    <div style={{ padding: 16, borderBottom: "1px solid var(--border-2)" }}>
                      <input 
                        type="text" 
                        placeholder="Search users by name, username or email..." 
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 14,
                          outline: "none",
                          fontFamily: "var(--sans)"
                        }}
                      />
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Current Role</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter(u => u.role !== "staff" && u.role !== "admin")
                            .filter(u => {
                              if (!staffSearchQuery) return true;
                              const q = staffSearchQuery.toLowerCase();
                              return (
                                (u.full_name || "").toLowerCase().includes(q) ||
                                (u.username || "").toLowerCase().includes(q) ||
                                ((u as any).email || "").toLowerCase().includes(q)
                              );
                            })
                            .slice(0, 10)
                            .map((u) => (
                              <tr key={u.id}>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                      {u.avatar_url ? <Image src={u.avatar_url} alt="" width={32} height={32} style={{ objectFit: "cover" }} /> : getInitials(u.full_name || "")}
                                    </div>
                                    <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--black)" }}>{u.full_name || "—"}</span>
                                  </div>
                                </td>
                                <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>@{u.username || "—"}</span></td>
                                <td><span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{(u as any).email || "—"}</span></td>
                                <td>
                                  <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", textTransform: "capitalize" }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleChangeRole(u.id, "staff")}
                                    style={{
                                      fontFamily: "var(--sans)",
                                      fontSize: 12,
                                      color: "white",
                                      backgroundColor: "var(--brand)",
                                      padding: "6px 12px",
                                      borderRadius: 6,
                                      border: "none",
                                      cursor: "pointer",
                                      fontWeight: 600
                                    }}
                                  >
                                    Make Staff
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <style>{`
        .admin-staff-settings-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
        }
        .admin-staff-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 768px) {
          .admin-sidebar-backdrop {
            display: block !important;
          }
          .admin-sidebar { 
            display: block !important;
            transform: ${sidebarOpen ? "none" : "translateX(-100%)"} !important;
            visibility: ${sidebarOpen ? "visible" : "hidden"} !important;
            pointer-events: ${sidebarOpen ? "auto" : "none"} !important;
          }
          main { margin-left: 0 !important; }
          .admin-staff-settings-grid {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .admin-staff-settings-grid > div {
            width: 100% !important;
          }
          .admin-content {
            padding: 16px !important;
          }
          .admin-topbar {
            padding: 12px 16px !important;
          }
        }
      `}</style>

      {/* Award Payment Modal */}
      {awardModalUser && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 480,
            padding: 24,
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "var(--black)" }}>
              Award Payment / Bonus
            </h3>
            <p style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Record payment award for <strong style={{ color: "var(--black)" }}>{awardModalUser.full_name}</strong> (@{awardModalUser.username})
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>
                Award Amount (e.g. $50 or ₦25,000)
              </label>
              <input
                type="text"
                value={awardAmount}
                onChange={(e) => setAwardAmount(e.target.value)}
                placeholder="Enter amount..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  fontFamily: "var(--sans)",
                  outline: "none"
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>
                Payment Note / Quota Details
              </label>
              <textarea
                value={awardNote}
                onChange={(e) => setAwardNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  fontFamily: "var(--sans)",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setAwardModalUser(null)}
                className="btn btn-outline btn-sm"
                style={{ borderRadius: 8 }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showMsg(`Payment award of ${awardAmount || "bonus"} recorded for ${awardModalUser.full_name}!`);
                  setAwardModalUser(null);
                }}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 8 }}
              >
                Confirm Award
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Search Console Style Date Range Modal */}
      {dateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setDateModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "24px 28px 16px" }}>
              <h2 style={{ fontFamily: "var(--sans)", fontSize: 22, fontWeight: 700, color: "var(--black)", margin: 0 }}>
                Date range
              </h2>

              {/* Filter vs Compare Tabs */}
              <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--border)", marginTop: 16 }}>
                <button
                  onClick={() => setDateModalTab("filter")}
                  style={{
                    padding: "8px 4px",
                    fontFamily: "var(--sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: dateModalTab === "filter" ? "var(--brand)" : "var(--muted)",
                    background: "none",
                    border: "none",
                    borderBottom: dateModalTab === "filter" ? "2px solid var(--brand)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  Filter
                </button>
                <button
                  onClick={() => setDateModalTab("compare")}
                  style={{
                    padding: "8px 4px",
                    fontFamily: "var(--sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: dateModalTab === "compare" ? "var(--brand)" : "var(--muted)",
                    background: "none",
                    border: "none",
                    borderBottom: dateModalTab === "compare" ? "2px solid var(--brand)" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  Compare
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "0 28px 24px", maxHeight: "60vh", overflowY: "auto" }}>
              {dateModalTab === "filter" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
                  {[
                    { id: "6months", label: "Last 6 months" },
                    { id: "year", label: "Last 12 months" },
                    { id: "16months", label: "Last 16 months" },
                    { id: "custom", label: "Custom" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontFamily: "var(--sans)",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="dateOption"
                        checked={tempPeriodOption === opt.id}
                        onChange={() => setTempPeriodOption(opt.id)}
                        style={{ accentColor: "var(--brand)", width: 18, height: 18 }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}

                  {/* Custom Date Pickers */}
                  {tempPeriodOption === "custom" && (
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, background: "var(--bg-3)", padding: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
                      <div>
                        <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          Start date
                        </label>
                        <input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "var(--bg-2)",
                            color: "var(--ink)",
                            fontFamily: "var(--sans)",
                            fontSize: 13,
                          }}
                        />
                        <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginTop: 4 }}>YYYY-MM-DD</span>
                      </div>

                      <div>
                        <label style={{ display: "block", fontFamily: "var(--sans)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>
                          End date
                        </label>
                        <input
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            background: "var(--bg-2)",
                            color: "var(--ink)",
                            fontFamily: "var(--sans)",
                            fontSize: 13,
                          }}
                        />
                        <span style={{ fontSize: 10, color: "var(--muted)", display: "block", marginTop: 4 }}>YYYY-MM-DD</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
                  {[
                    "Compare last 24 hours to previous period",
                    "Compare last 24 hours week over week",
                    "Compare last 7 days to previous period",
                    "Compare last 7 days year over year",
                    "Compare last 28 days to previous period",
                    "Compare last 28 days year over year",
                    "Compare last 3 months to previous period",
                    "Compare last 3 months year over year",
                    "Compare last 6 months to previous period",
                  ].map((item, idx) => (
                    <label
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontFamily: "var(--sans)",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="compareOption"
                        defaultChecked={idx === 4}
                        style={{ accentColor: "var(--brand)", width: 18, height: 18 }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 12, background: "var(--bg-3)" }}>
              <button
                onClick={() => setDateModalOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 99,
                  border: "none",
                  background: "transparent",
                  color: "var(--brand)",
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (tempPeriodOption === "custom") {
                    if (!tempStartDate || !tempEndDate) {
                      showMsg("Please select both start date and end date", "err");
                      return;
                    }
                    setCustomStartDate(tempStartDate);
                    setCustomEndDate(tempEndDate);
                    setAnalyticsPeriod("custom");
                  } else {
                    setAnalyticsPeriod(tempPeriodOption as any);
                  }
                  setDateModalOpen(false);
                }}
                style={{
                  padding: "8px 24px",
                  borderRadius: 99,
                  border: "none",
                  background: "var(--brand)",
                  color: "white",
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
