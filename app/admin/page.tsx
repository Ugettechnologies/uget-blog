"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  coverImage: string | null;
  author: string;
  published: boolean;
  featured: boolean;
  readTime: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const CATEGORIES = [
  { id: "frontend", label: "Frontend Dev", emoji: "💻" },
  { id: "uiux", label: "UI/UX Design", emoji: "🎨" },
  { id: "cybersecurity", label: "Cybersecurity", emoji: "🔐" },
  { id: "ai", label: "AI & Tech", emoji: "🤖" },
  { id: "career", label: "Career Guides", emoji: "🚀" },
  { id: "tutorials", label: "Tutorials", emoji: "📚" },
  { id: "mobile", label: "Mobile Dev", emoji: "📱" },
  { id: "backend", label: "Backend Dev", emoji: "⚙️" },
];

const CAT_COLORS: Record<string, string> = {
  frontend: "cat-frontend", uiux: "cat-uiux", cybersecurity: "cat-cyber",
  ai: "cat-ai", career: "cat-career", tutorials: "cat-tutorials",
  mobile: "cat-mobile", backend: "cat-backend",
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "new" | "edit">("posts");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", category: "frontend",
    tags: "", coverImage: "", featured: false, published: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) { router.push("/auth"); return; }
    const data = await res.json();
    if (data.user?.role !== "admin") { router.push("/"); return; }
    setUser(data.user);
    loadPosts();
  };

  const loadPosts = async () => {
    setLoading(true);
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      setForm((f) => ({ ...f, coverImage: data.url }));
      showToast("Image uploaded!");
    } else {
      showToast(data.error || "Upload failed", "error");
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.content || !form.category) {
      showToast("Title, content, and category are required", "error"); return;
    }
    setSaving(true);
    try {
      const isEdit = activeTab === "edit" && editingPost;
      const url = isEdit ? `/api/posts/${editingPost.id}` : "/api/posts";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(isEdit ? "Post updated!" : "Post published!");
      await loadPosts();
      setActiveTab("posts");
      resetForm();
    } catch (e: unknown) {
      showToast((e as Error).message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Post deleted");
      setPosts((p) => p.filter((x) => x.id !== id));
    } else {
      showToast("Delete failed", "error");
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setForm({
      title: post.title, excerpt: post.excerpt, content: post.content,
      category: post.category, tags: post.tags, coverImage: post.coverImage || "",
      featured: post.featured, published: post.published,
    });
    setActiveTab("edit");
  };

  const resetForm = () => {
    setForm({ title: "", excerpt: "", content: "", category: "frontend", tags: "", coverImage: "", featured: false, published: true });
    setEditingPost(null);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  };

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const published = posts.filter((p) => p.published).length;

  return (
    <div className="admin-layout">
      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type === "error" ? "admin-toast-error" : "admin-toast-success"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl mb-4">🗑️</div>
            <h3 className="text-white text-xl font-bold mb-2">Delete Post?</h3>
            <p className="text-white/50 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="admin-btn-outline flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="admin-btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : "admin-sidebar-closed"}`}>
        <div className="admin-sidebar-logo">
          <Image src="/logo-text.png" alt="UGET" width={100} height={28} className="object-contain" />
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav">
          {[
            { id: "posts", label: "All Posts", icon: "📋", count: posts.length },
            { id: "new", label: "New Post", icon: "✏️" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { if (item.id === "new") { resetForm(); } setActiveTab(item.id as "posts" | "new"); }}
              className={`admin-nav-item ${activeTab === item.id || (activeTab === "edit" && item.id === "posts") ? "admin-nav-item-active" : ""}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {item.count !== undefined && <span className="admin-nav-count">{item.count}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item" target="_blank">
            <span>🌐</span><span>View Site</span>
          </Link>
          <button onClick={handleLogout} className="admin-nav-item text-red-400/70 hover:text-red-400">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="admin-menu-btn">
            <span /><span /><span />
          </button>
          <div className="admin-topbar-title">
            {activeTab === "posts" && "All Posts"}
            {activeTab === "new" && "New Post"}
            {activeTab === "edit" && "Edit Post"}
          </div>
          <div className="admin-topbar-user">
            <div className="admin-avatar">{user?.name?.charAt(0) || "A"}</div>
            <span className="text-white/60 text-sm hidden sm:block">{user?.name}</span>
          </div>
        </header>

        <div className="admin-content">
          {/* Stats */}
          {activeTab === "posts" && (
            <>
              <div className="admin-stats-grid">
                {[
                  { label: "Total Posts", value: posts.length, icon: "📝", color: "blue" },
                  { label: "Published", value: published, icon: "✅", color: "green" },
                  { label: "Drafts", value: posts.length - published, icon: "📄", color: "yellow" },
                  { label: "Total Views", value: totalViews.toLocaleString(), icon: "👁", color: "purple" },
                ].map((s) => (
                  <div key={s.label} className={`admin-stat-card admin-stat-${s.color}`}>
                    <div className="admin-stat-icon">{s.icon}</div>
                    <div>
                      <div className="admin-stat-value">{s.value}</div>
                      <div className="admin-stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Posts table */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Posts</h2>
                  <button onClick={() => { resetForm(); setActiveTab("new"); }} className="admin-btn-primary">
                    + New Post
                  </button>
                </div>

                {loading ? (
                  <div className="admin-empty">
                    <div className="admin-spinner-lg" />
                    <p className="text-white/40 mt-4">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="admin-empty">
                    <div className="text-5xl mb-4">📝</div>
                    <p className="text-white/40">No posts yet. Create your first post!</p>
                    <button onClick={() => setActiveTab("new")} className="admin-btn-primary mt-4">Write First Post</button>
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Views</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map((post) => {
                          const cat = CATEGORIES.find((c) => c.id === post.category);
                          return (
                            <tr key={post.id}>
                              <td>
                                <div className="admin-post-title">
                                  {post.featured && <span className="admin-featured-dot" title="Featured" />}
                                  <span className="font-medium text-white">{post.title}</span>
                                </div>
                                <div className="text-white/30 text-xs mt-0.5 truncate max-w-xs">{post.excerpt}</div>
                              </td>
                              <td>
                                <span className={`tag-pill ${CAT_COLORS[post.category] || ""}`}>
                                  {cat?.emoji} {cat?.label || post.category}
                                </span>
                              </td>
                              <td>
                                <span className={`admin-status-pill ${post.published ? "admin-status-live" : "admin-status-draft"}`}>
                                  {post.published ? "Live" : "Draft"}
                                </span>
                              </td>
                              <td className="text-white/50 text-sm">{post.views}</td>
                              <td className="text-white/40 text-xs">
                                {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleEdit(post)} className="admin-action-btn admin-action-edit" title="Edit">✏️</button>
                                  <Link href={`/post/${post.slug}`} target="_blank" className="admin-action-btn admin-action-view" title="View">👁</Link>
                                  <button onClick={() => setDeleteConfirm(post.id)} className="admin-action-btn admin-action-delete" title="Delete">🗑️</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Post Editor */}
          {(activeTab === "new" || activeTab === "edit") && (
            <div className="admin-editor">
              <div className="admin-editor-main">
                {/* Title */}
                <div className="admin-field">
                  <label className="admin-label">Post Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter an engaging title..."
                    className="admin-input admin-input-xl"
                  />
                </div>

                {/* Excerpt */}
                <div className="admin-field">
                  <label className="admin-label">Excerpt <span className="text-white/30">(optional)</span></label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Short summary shown in post cards..."
                    rows={2}
                    className="admin-input admin-textarea"
                  />
                </div>

                {/* Content */}
                <div className="admin-field">
                  <label className="admin-label">Content *</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Write your article content here... (Markdown supported)"
                    rows={20}
                    className="admin-input admin-textarea admin-content-area"
                  />
                  <p className="text-white/25 text-xs mt-1">
                    {form.content.split(/\s+/).filter(Boolean).length} words · ~{Math.max(1, Math.ceil(form.content.split(/\s+/).length / 200))} min read
                  </p>
                </div>
              </div>

              {/* Sidebar controls */}
              <div className="admin-editor-sidebar">
                {/* Publish */}
                <div className="admin-card">
                  <h3 className="admin-card-title mb-4">Publish</h3>
                  <div className="space-y-3">
                    <label className="admin-toggle-row">
                      <span className="text-white/70 text-sm">Published</span>
                      <div
                        onClick={() => setForm({ ...form, published: !form.published })}
                        className={`admin-toggle ${form.published ? "admin-toggle-on" : ""}`}
                      >
                        <div className="admin-toggle-thumb" />
                      </div>
                    </label>
                    <label className="admin-toggle-row">
                      <span className="text-white/70 text-sm">Featured</span>
                      <div
                        onClick={() => setForm({ ...form, featured: !form.featured })}
                        className={`admin-toggle ${form.featured ? "admin-toggle-on" : ""}`}
                      >
                        <div className="admin-toggle-thumb" />
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button onClick={() => setActiveTab("posts")} className="admin-btn-outline flex-1 text-sm">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="admin-btn-primary flex-1 text-sm">
                      {saving ? <span className="admin-spinner" /> : (activeTab === "edit" ? "Update" : "Publish")}
                    </button>
                  </div>
                </div>

                {/* Category */}
                <div className="admin-card">
                  <h3 className="admin-card-title mb-4">Category *</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id })}
                        className={`admin-cat-btn ${form.category === cat.id ? "admin-cat-btn-active" : ""}`}
                      >
                        <span>{cat.emoji}</span>
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Image */}
                <div className="admin-card">
                  <h3 className="admin-card-title mb-4">Cover Image</h3>
                  {form.coverImage && (
                    <div className="relative mb-3 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.coverImage} alt="Cover" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => setForm({ ...form, coverImage: "" })}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center hover:bg-red-500"
                      >✕</button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="admin-upload-btn"
                  >
                    {uploading ? <><span className="admin-spinner" /> Uploading...</> : <><span>📁</span> Upload Image</>}
                  </button>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={form.coverImage}
                      onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                      placeholder="Or paste image URL..."
                      className="admin-input text-xs"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="admin-card">
                  <h3 className="admin-card-title mb-4">Tags</h3>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="react, javascript, css..."
                    className="admin-input"
                  />
                  <p className="text-white/25 text-xs mt-1">Comma-separated</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
