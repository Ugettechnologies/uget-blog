"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");
  const [toast, setToast] = useState("");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => setProfile(data));
      loadPosts(user.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPosts = async (uid: string) => {
    setLoading(true);
    const { data } = await supabase.from("posts").select("*").eq("author_id", uid).order("created_at", { ascending: false });
    setPosts(data as Post[] || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    await supabase.from("posts").delete().eq("id", id);
    setPosts(posts.filter((p) => p.id !== id));
    showMsg("Story deleted");
  };

  const handleTogglePublish = async (post: Post) => {
    const { data } = await supabase.from("posts").update({ published: !post.published }).eq("id", post.id).select().single();
    if (data) {
      setPosts(posts.map((p) => p.id === post.id ? data as Post : p));
      showMsg(data.published ? "Story published!" : "Moved to drafts");
    }
  };

  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);
  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const shown = activeTab === "published" ? published : drafts;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">✓ {toast}</div>
        </div>
      )}

      <div style={{ maxWidth: 1192, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 48, alignItems: "start" }}>
          {/* Left sidebar */}
          <div>
            {profile && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 24, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 12 }}>
                  {profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={64} height={64} style={{ objectFit: "cover" }} /> : getInitials(profile.full_name)}
                </div>
                <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--black)" }}>{profile.full_name}</div>
                <div style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)", marginTop: 4 }}>@{profile.username}</div>
              </div>
            )}

            {/* Stats */}
            <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              {[
                { label: "Published", value: published.length },
                { label: "Drafts", value: drafts.length },
                { label: "Total views", value: totalViews.toLocaleString() },
                { label: "Total likes", value: totalLikes },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-2)" }}>
                  <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--muted)" }}>{s.label}</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)" }}>{s.value}</span>
                </div>
              ))}
            </div>

            <Link href="/write" className="btn btn-primary btn-md" style={{ width: "100%", textDecoration: "none", justifyContent: "center" }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Write new story
            </Link>
          </div>

          {/* Main content */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h1 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, color: "var(--black)" }}>Your stories</h1>
            </div>

            {/* Tabs */}
            <div className="dash-tabs" style={{ maxWidth: "none", padding: 0, marginBottom: 24 }}>
              {(["published", "drafts"] as const).map((tab) => (
                <button key={tab} className={`dash-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)} style={{ padding: "12px 0", marginRight: 32 }}>
                  {tab === "published" ? `Published (${published.length})` : `Drafts (${drafts.length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--border)", borderTopColor: "var(--ink)", margin: "0 auto" }} />
              </div>
            ) : shown.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{activeTab === "published" ? "📢" : "📝"}</div>
                <p style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
                  {activeTab === "published" ? "Nothing published yet" : "No drafts"}
                </p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", marginBottom: 20 }}>
                  {activeTab === "published" ? "Share your first story with the world." : "Start writing and save as draft."}
                </p>
                <Link href="/write" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Write a story</Link>
              </div>
            ) : (
              shown.map((post) => {
                const cat = CATEGORIES.find((c) => c.id === post.category);
                return (
                  <div key={post.id} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: "1px solid var(--border-2)", alignItems: "flex-start" }}>
                    {/* Cover thumb */}
                    <div style={{ width: 80, height: 60, borderRadius: 6, overflow: "hidden", background: "var(--bg-3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {post.cover_image ? (
                        <Image src={post.cover_image} alt="" width={80} height={60} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>{cat?.icon}</span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: post.published ? "var(--accent-bg)" : "var(--bg-3)", color: post.published ? "var(--accent-hover)" : "var(--muted)" }}>
                          {post.published ? "Published" : "Draft"}
                        </span>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>{formatDate(post.created_at)}</span>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>· {post.read_time} min</span>
                      </div>
                      <Link href={`/post/${post.slug}`} style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                        {post.title}
                      </Link>
                      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {post.view_count}
                        </span>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {post.like_count}
                        </span>
                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                          {post.comment_count}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <Link href={`/write/${post.id}`} className="btn btn-outline btn-sm" style={{ textDecoration: "none" }}>Edit</Link>
                      <button onClick={() => handleTogglePublish(post)} className="btn btn-sm" style={{ border: "1px solid var(--border)", borderRadius: 999, color: "var(--muted)", padding: "7px 12px", fontSize: 13 }}>
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      <button onClick={() => handleDelete(post.id)} className="btn btn-sm" style={{ color: "var(--red)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 999, padding: "7px 12px", fontSize: 13 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .grid-layout { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
