"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/db-client/client";
import type { Post, Profile } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";

type TabType = "stories" | "library" | "stats" | "followers" | "staff";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [staffPosts, setStaffPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<TabType>("stories");
  const [storySubTab, setStorySubTab] = useState<"published" | "drafts">("published");
  const [followSubTab, setFollowSubTab] = useState<"followers" | "following">("followers");
  
  const [toast, setToast] = useState("");

  const showMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Read tab parameter from URL search params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab") as TabType;
      if (t && ["stories", "library", "stats", "followers", "staff"].includes(t)) {
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
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async (uid: string) => {
    setLoading(true);
    
    // Fetch stories written by user
    const { data: postsRes } = await supabase.from("posts")
      .select("*")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });
    setPosts(postsRes as Post[] || []);

    // Fetch user bookmarks
    const { data: bookmarksRes } = await supabase.from("bookmarks")
      .select("*, posts(*)")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setBookmarks(bookmarksRes || []);

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
      .eq("role", "admin") // custom mapping in api route filters by profiles.role
      .order("created_at", { ascending: false });
    setStaffPosts(staffRes as Post[] || []);

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

  const handleRemoveBookmark = async (post_id: string) => {
    if (!profile) return;
    await supabase.from("bookmarks").delete().eq("post_id", post_id).eq("user_id", profile.id);
    setBookmarks(bookmarks.filter((b) => b.post_id !== post_id));
    showMsg("Removed from Library");
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

  const shownStories = storySubTab === "published" ? published : drafts;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">✓ {toast}</div>
        </div>
      )}

      <div style={{ maxWidth: 1192, margin: "0 auto", padding: "40px 24px" }}>
        <div className="dash-layout">
          
          {/* Sidebar Menu */}
          <aside className="dash-sidebar">
            {profile && (
              <div style={{ marginBottom: 28, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={44} height={44} style={{ objectFit: "cover" }} /> : getInitials(profile.full_name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--black)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{profile.full_name}</div>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>@{profile.username}</div>
                </div>
              </div>
            )}

            <nav style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 28 }}>
              {[
                { id: "stories", label: "Stories", icon: "📝" },
                { id: "library", label: "Library", icon: "📚" },
                { id: "stats", label: "Stats", icon: "📊" },
                { id: "followers", label: "Followers", icon: "👥" },
                { id: "staff", label: "Staff Corner", icon: "⭐" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as TabType)}
                  className={`sidebar-nav-btn ${activeTab === item.id ? "active" : ""}`}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontWeight: activeTab === item.id ? 700 : 500 }}>{item.label}</span>
                </button>
              ))}
            </nav>

            <Link href="/write" className="btn btn-primary btn-md" style={{ width: "100%", textDecoration: "none", justifyContent: "center" }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Write a story
            </Link>
          </aside>

          {/* Main Content Area */}
          <main style={{ minWidth: 0 }}>
            {loading ? (
              <div style={{ padding: "100px 0", textAlign: "center" }}>
                <div className="spinner" style={{ width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--ink)", margin: "0 auto" }} />
              </div>
            ) : (
              <>
                {/* ── STORIES TAB ── */}
                {activeTab === "stories" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)" }}>Your stories</h2>
                    </div>

                    <div className="dash-tabs" style={{ maxWidth: "none", padding: 0, marginBottom: 24, borderBottom: "1px solid var(--border-2)" }}>
                      {(["published", "drafts"] as const).map((sub) => (
                        <button key={sub} className={`dash-tab ${storySubTab === sub ? "active" : ""}`} onClick={() => setStorySubTab(sub)} style={{ padding: "12px 0", marginRight: 32 }}>
                          {sub === "published" ? `Published (${published.length})` : `Drafts (${drafts.length})`}
                        </button>
                      ))}
                    </div>

                    {shownStories.length === 0 ? (
                      <div className="empty-state">
                        <div style={{ fontSize: 40, marginBottom: 12 }}>{storySubTab === "published" ? "📢" : "📝"}</div>
                        <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>
                          {storySubTab === "published" ? "Nothing published yet" : "No drafts"}
                        </h4>
                        <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0 20px" }}>
                          {storySubTab === "published" ? "Share your thoughts and tutorials with the community." : "Begin writing a new story and save your progress."}
                        </p>
                        <Link href="/write" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Write a story</Link>
                      </div>
                    ) : (
                      shownStories.map((post) => {
                        const cat = CATEGORIES.find((c) => c.id === post.category);
                        return (
                          <div key={post.id} className="dash-post-row">
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
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><span style={{ fontSize: 14 }}>👁</span> {post.view_count || 0}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><span style={{ fontSize: 12 }}>💖</span> {post.like_count || 0}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}><span style={{ fontSize: 13 }}>💬</span> {post.comment_count || 0}</span>
                              </div>
                            </div>
                            <div className="row-actions">
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
                )}

                {/* ── LIBRARY TAB ── */}
                {activeTab === "library" && (
                  <div>
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)" }}>Your Library</h2>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Stories you've bookmarked to read later.</p>
                    </div>

                    {bookmarks.length === 0 ? (
                      <div className="empty-state">
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                        <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>Your library is empty</h4>
                        <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", margin: "6px 0 20px" }}>
                          Save articles by clicking the bookmark button on any story page.
                        </p>
                        <Link href="/" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>Explore stories</Link>
                      </div>
                    ) : (
                      bookmarks.map((bm) => {
                        const post = bm.posts;
                        if (!post) return null;
                        const author = post.profiles;
                        const cat = CATEGORIES.find((c) => c.id === post.category);
                        return (
                          <div key={bm.id} className="dash-post-row">
                            <div className="post-thumb">
                              {post.cover_image ? (
                                <Image src={post.cover_image} alt="" width={80} height={60} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              ) : (
                                <span style={{ fontSize: 22 }}>{cat?.icon || "📝"}</span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600, color: "var(--black)" }}>
                                  {author?.full_name || "Writer"}
                                </span>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>· {formatDate(post.created_at)}</span>
                              </div>
                              <Link href={`/post/${post.slug}`} style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", textDecoration: "none", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {post.title}
                              </Link>
                              <div style={{ display: "flex", gap: 12, marginTop: 4, color: "var(--muted-2)", fontSize: 12 }}>
                                <span>{post.read_time} min read</span>
                                {cat && <span>· {cat.icon} {cat.label}</span>}
                              </div>
                            </div>
                            <div className="row-actions">
                              <Link href={`/post/${post.slug}`} className="btn btn-outline btn-sm" style={{ textDecoration: "none" }}>Read</Link>
                              <button onClick={() => handleRemoveBookmark(post.id)} className="btn btn-sm" style={{ border: "1px solid var(--border)", borderRadius: 999, color: "var(--red)", padding: "7px 12px", fontSize: 13 }}>
                                Un-bookmark
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ── STATS TAB ── */}
                {activeTab === "stats" && (
                  <div>
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)" }}>Impact Analytics</h2>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Understand your readers and check story metrics.</p>
                    </div>

                    {/* Stats Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                      {[
                        { label: "Total Views", value: totalViews, icon: "👁", color: "#3b82f6" },
                        { label: "Total Likes", value: totalLikes, icon: "💖", color: "#ef4444" },
                        { label: "Stories written", value: posts.length, icon: "📝", color: "#8b5cf6" },
                        { label: "Avg. read time", value: `${avgReadTime}m`, icon: "⏱", color: "#10b981" }
                      ].map((card) => (
                        <div key={card.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 20, borderLeft: `3px solid ${card.color}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: 700 }}>{card.label}</span>
                            <span style={{ fontSize: 18 }}>{card.icon}</span>
                          </div>
                          <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 800, color: "var(--black)" }}>{card.value.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    {/* SVG Chart */}
                    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
                      <h3 style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--black)", marginBottom: 20 }}>Top Stories by Views</h3>
                      {chartPosts.length === 0 ? (
                        <p style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0" }}>No story data to display in chart.</p>
                      ) : (
                        <div style={{ position: "relative", paddingBottom: 10 }}>
                          <svg viewBox="0 0 500 200" width="100%" height="200" style={{ overflow: "visible" }}>
                            {/* Grid lines */}
                            <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-2)" strokeDasharray="4 4" />
                            <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-2)" strokeDasharray="4 4" />
                            <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-2)" strokeDasharray="4 4" />
                            <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-2)" />
                            
                            {/* Bars */}
                            {chartPosts.map((p, idx) => {
                              const barWidth = 40;
                              const gap = 50;
                              const x = 50 + idx * (barWidth + gap);
                              const height = ((p.view_count || 0) / maxViews) * 140; 
                              const y = 170 - height;
                              
                              return (
                                <g key={p.id}>
                                  <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={height}
                                    fill="url(#barGradient)"
                                    rx="4"
                                    style={{ transition: "height 0.3s, y 0.3s" }}
                                  />
                                  <text
                                    x={x + barWidth / 2}
                                    y={y - 6}
                                    textAnchor="middle"
                                    style={{ fill: "var(--ink)", fontSize: 10, fontWeight: 700, fontFamily: "var(--sans)" }}
                                  >
                                    {p.view_count}
                                  </text>
                                  <text
                                    x={x + barWidth / 2}
                                    y="188"
                                    textAnchor="middle"
                                    style={{ fill: "var(--muted)", fontSize: 9, fontFamily: "var(--sans)" }}
                                  >
                                    {p.title.length > 10 ? p.title.substring(0, 10) + ".." : p.title}
                                  </text>
                                </g>
                              );
                            })}
                            
                            <defs>
                              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--ink)" />
                                <stop offset="100%" stopColor="var(--border)" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Stories table */}
                    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                      <table className="admin-table">
                        <thead>
                          <tr><th>Story Title</th><th>Views</th><th>Likes</th><th>Read Time</th><th>Engagement Rate</th></tr>
                        </thead>
                        <tbody>
                          {posts.map((p) => {
                            const rate = p.view_count ? Math.round((p.like_count / p.view_count) * 100) : 0;
                            return (
                              <tr key={p.id}>
                                <td><Link href={`/post/${p.slug}`} style={{ fontWeight: 600, color: "var(--black)", textDecoration: "none" }}>{p.title}</Link></td>
                                <td>{p.view_count || 0}</td>
                                <td>{p.like_count || 0}</td>
                                <td>{p.read_time} min</td>
                                <td>{rate}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── FOLLOWERS TAB ── */}
                {activeTab === "followers" && (
                  <div>
                    <div style={{ marginBottom: 24 }}>
                      <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)" }}>Social Network</h2>
                      <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Follow writers and build your readership audience.</p>
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
                              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                        <h2 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, color: "var(--black)" }}>UGET Staff Corner</h2>
                        <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 4 }}>Official announcements, writing advice, and staff picks.</p>
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
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ink)", color: "white", fontFamily: "var(--sans)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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
                      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
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
          </main>

        </div>
      </div>

      <style>{`
        .dash-layout { display: grid; grid-template-columns: 240px 1fr; gap: 48px; align-items: start; }
        .dash-sidebar { position: sticky; top: 88px; }
        
        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          background: none;
          border: none;
          border-radius: 8px;
          font-family: var(--sans);
          font-size: 14px;
          color: var(--muted);
          text-align: left;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .sidebar-nav-btn:hover {
          background: var(--bg-2);
          color: var(--black);
        }
        .sidebar-nav-btn.active {
          background: var(--bg-3);
          color: var(--black);
        }
        
        .dash-post-row {
          display: flex;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border-2);
          align-items: flex-start;
        }
        .post-thumb {
          width: 80px;
          height: 60px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--bg-3);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .row-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .empty-state {
          padding: 60px 0;
          text-align: center;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-2);
          margin-top: 16px;
        }
        .staff-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 32px;
          align-items: start;
        }
        .staff-panel {
          position: sticky;
          top: 88px;
        }
        
        @media (max-width: 992px) {
          .staff-layout { grid-template-columns: 1fr; }
          .staff-panel { display: none; }
        }
        @media (max-width: 768px) {
          .dash-layout { grid-template-columns: 1fr; gap: 28px; }
          .dash-sidebar { position: static; }
          .dash-post-row { flex-wrap: wrap; }
          .row-actions { width: 100%; justify-content: flex-start; margin-top: 8px; }
        }
        @media (max-width: 480px) {
          .dash-post-row { gap: 10px !important; }
        }
      `}</style>
    </div>
  );
}
