"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

type AdminTab = "overview" | "posts" | "users" | "payments" | "staff";

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
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNotAdmin, setIsNotAdmin] = useState(false);
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [debugUser, setDebugUser] = useState<any>(null);
  const [debugRole, setDebugRole] = useState<string | null>(null);

  // Official UGET Staff Profile state
  const [staffName, setStaffName] = useState("UGET Staff");
  const [staffUsername, setStaffUsername] = useState("ugetstaff");
  const [staffBio, setStaffBio] = useState("");
  const [staffAvatarUrl, setStaffAvatarUrl] = useState("");
  const [uploadingStaffAvatar, setUploadingStaffAvatar] = useState(false);
  const [savingStaffProfile, setSavingStaffProfile] = useState(false);

  useEffect(() => {
    const staff = users.find(u => u.id === "c0de57af-f011-0e5a-ff55-c0de57aff555");
    if (staff) {
      setStaffName(staff.full_name || "UGET Staff");
      setStaffUsername(staff.username || "ugetstaff");
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
    const [postsRes, usersRes, subsRes] = await Promise.all([
      supabase.from("posts").select("*, profiles(full_name, avatar_url, username)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    ]);
    setPosts(postsRes.data as Post[] || []);
    setUsers(usersRes.data as Profile[] || []);
    setSubscriptions(subsRes.data as any[] || []);
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
            You can find (just about) anything on UGET — apparently even a page that doesn't exist. Maybe these stories will take you somewhere new?
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
                      {p.cover_image && (
                        <Link href={`/post/${p.slug}`} style={{ width: 100, height: 100, borderRadius: 6, overflow: "hidden", flexShrink: 0, display: "block" }}>
                          <Image src={p.cover_image} alt="" width={100} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                        </Link>
                      )}
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
            <Image src="/logo-icon.png" alt="UGET" width={24} height={24} className="object-contain" />
            <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)" }}>UGET Admin</span>
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
                  {/* Official UGET Staff Profile Settings */}
                  <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 32 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>Official UGET Staff Profile Settings</span>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Customize the public profile for the official UGET Staff account.
                      </p>
                    </div>

                    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
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
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
                      <span style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>UGET Staff Members</span>
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
                        Select a writer or reader to give them staff writer status. Only staff members and admins can write on UGET.
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
        }
      `}</style>
    </div>
  );
}
