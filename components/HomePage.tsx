"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { createClient } from "@/lib/db-client/client";
import type { Post } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";

function PostCard({ post }: { post: Post }) {
  const cat = CATEGORIES.find((c) => c.id === post.category);
  const authorName = (post.profiles as any)?.full_name || "Writer";
  const authorAvatar = (post.profiles as any)?.avatar_url;
  const authorUsername = (post.profiles as any)?.username || post.author_id;
  return (
    <article className="post-card">
      <div className="post-card-content">
        <div className="post-card-author">
          <Link href={`/profile/${authorUsername}`} className="post-card-author-avatar" style={{ textDecoration: "none" }}>
            {authorAvatar ? (
              <Image src={authorAvatar} alt={authorName} width={24} height={24} style={{ objectFit: "cover" }} />
            ) : (
              <span>{getInitials(authorName)}</span>
            )}
          </Link>
          <Link href={`/profile/${authorUsername}`} className="post-card-author-name" style={{ textDecoration: "none" }}>
            {authorName}
          </Link>
        </div>
        <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
          <h2 className="post-card-title">{post.title}</h2>
          {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
        </Link>
        <div className="post-card-meta">
          {cat && <span className="post-card-tag">{cat.icon} {cat.label}</span>}
          <span>{formatDate(post.created_at)}</span>
          <span>·</span>
          <span>{post.read_time} min read</span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.like_count}
          </span>
        </div>
      </div>
      <Link href={`/post/${post.slug}`} className="post-card-image">
        {post.cover_image ? (
          <Image src={post.cover_image} alt={post.title} width={200} height={134} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        ) : (
          <div className="post-card-placeholder">{cat?.icon || "📝"}</div>
        )}
      </Link>
    </article>
  );
}

function FeaturedCard({ post }: { post: Post }) {
  const cat = CATEGORIES.find((c) => c.id === post.category);
  const authorName = (post.profiles as any)?.full_name || "Writer";
  return (
    <Link href={`/post/${post.slug}`} className="featured-card" style={{ textDecoration: "none", display: "block" }}>
      {post.cover_image ? (
        <Image src={post.cover_image} alt={post.title} fill className="featured-card-img" style={{ objectFit: "cover" }} />
      ) : (
        <div className="featured-card-img" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 80, opacity: 0.3 }}>{cat?.icon}</span>
        </div>
      )}
      <div className="featured-card-overlay" />
      <div className="featured-card-content">
        {cat && <span className="featured-card-tag">{cat.label}</span>}
        <h2 className="featured-card-title">{post.title}</h2>
        <div className="featured-card-author">
          <span>{authorName}</span>
          <span>·</span>
          <span>{post.read_time} min read</span>
        </div>
      </div>
    </Link>
  );
}

const MediumIllustration = () => (
  <svg viewBox="0 0 400 400" width="100%" height="100%" style={{ maxWidth: 420 }}>
    {/* Geometric diagram lines */}
    <line x1="100" y1="50" x2="100" y2="350" stroke="rgba(124,58,237,0.08)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="50" y1="300" x2="350" y2="300" stroke="rgba(124,58,237,0.08)" strokeWidth="1" strokeDasharray="4 4" />
    
    <circle cx="100" cy="300" r="120" stroke="rgba(124,58,237,0.15)" strokeWidth="1" fill="none" />
    <circle cx="100" cy="300" r="180" stroke="rgba(124,58,237,0.08)" strokeWidth="1" fill="none" />
    
    {/* Math diagram arcs and lines */}
    <path d="M 100 120 A 180 180 0 0 1 280 300" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" fill="none" />
    <line x1="100" y1="300" x2="227" y2="173" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
    <circle cx="227" cy="173" r="4" fill="var(--brand)" />
    
    {/* Brand purple flower elements */}
    <g transform="translate(250, 150)">
      {/* Central center circle */}
      <circle cx="0" cy="0" r="28" fill="var(--brand)" />
      {/* 5 Petals */}
      <path d="M 0 -28 C -30 -80, 30 -80, 0 -28" fill="var(--brand)" opacity="0.95" />
      <path d="M 26.6 -8.6 C 75 -35, 85 25, 26.6 -8.6" fill="var(--brand)" opacity="0.95" transform="rotate(72)" />
      <path d="M 16.5 22.7 C 55 60, -15 85, 16.5 22.7" fill="var(--brand)" opacity="0.95" transform="rotate(144)" />
      <path d="M -16.5 22.7 C -55 60, 15 85, -16.5 22.7" fill="var(--brand)" opacity="0.95" transform="rotate(216)" />
      <path d="M -26.6 -8.6 C -75 -35, -85 25, -26.6 -8.6" fill="var(--brand)" opacity="0.95" transform="rotate(288)" />
    </g>
  </svg>
);

interface TrendingSectionProps {
  posts: Post[];
  router: any;
}

function TrendingSection({ posts, router }: TrendingSectionProps) {
  // Take first 6 posts
  const trendingPosts = posts.slice(0, 6);

  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 0 40px", background: "white" }}>
      <div style={{ maxWidth: 1192, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <h2 style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink)" }}>
            Trending on UGET
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px 24px" }}>
          {trendingPosts.map((post, idx) => {
            const authorName = (post.profiles as any)?.full_name || "Writer";
            const authorAvatar = (post.profiles as any)?.avatar_url;
            const authorUsername = (post.profiles as any)?.username || post.author_id;
            return (
              <div key={post.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontFamily: "var(--sans)", fontSize: 30, fontWeight: 700, color: "#ddd6fe", lineHeight: 1, marginTop: -4 }}>
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--brand)", color: "white", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                      {authorAvatar ? (
                        <Image src={authorAvatar} alt="" width={20} height={20} style={{ objectFit: "cover" }} />
                      ) : (
                        <span>{getInitials(authorName)}</span>
                      )}
                    </div>
                    <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{authorName}</span>
                  </div>
                  <Link href={`/post/${post.slug}`} style={{ textDecoration: "none" }}>
                    <h3 style={{ fontFamily: "var(--sans)", fontSize: 15, fontWeight: 700, lineHeight: 1.3, color: "var(--black)", marginBottom: 8 }} className="truncate-2">
                      {post.title}
                    </h3>
                  </Link>
                  <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>
                    {formatDate(post.created_at)} · {post.read_time} min read
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Redesign state hooks
  const [activeFeedTab, setActiveFeedTab] = useState<"foryou" | "following" | "featured">("foryou");
  const [followingFeedTab, setFollowingFeedTab] = useState<"writers" | "topics">("writers");
  const [suggestedWriters, setSuggestedWriters] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [followingProfiles, setFollowingProfiles] = useState<any[]>([]);

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

  const loadSuggestedWriters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let q = supabase.from("profiles").select("*").limit(10);
      if (user) {
        q = q.neq("id", user.id);
      }
      const { data } = await q;
      if (data) {
        setSuggestedWriters(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowSuggestedWriter = async (writerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/?auth=signin"); return; }
    const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: writerId });
    if (!error) {
      loadFollowingProfiles(user.id);
      loadSuggestedWriters();
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
    setUser(null);
    setUserProfile(null);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setUserProfile(profile);
        if (profile && (!profile.interests || !Array.isArray(profile.interests) || profile.interests.length === 0)) {
          router.push("/onboarding");
        }
        loadNotifications(user.id);
        loadFollowingProfiles(user.id);
      }
      loadSuggestedWriters();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", u.id).single();
        setUserProfile(profile);
        if (profile && (!profile.interests || !Array.isArray(profile.interests) || profile.interests.length === 0)) {
          router.push("/onboarding");
        }
        loadNotifications(u.id);
        loadFollowingProfiles(u.id);
      } else {
        setUserProfile(null);
        setNotifications([]);
        setUnreadNotifCount(0);
        setFollowingProfiles([]);
      }
      loadSuggestedWriters();
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  useEffect(() => {
    loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, query, userProfile, activeFeedTab, followingProfiles]);

  const loadPosts = async () => {
    setLoading(true);
    let q = supabase
      .from("posts")
      .select("*, profiles(id, full_name, avatar_url, username)")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(30);
    if (activeCategory !== "all") q = q.eq("category", activeCategory);
    if (query) q = q.ilike("title", `%${query}%`);
    
    if (activeFeedTab === "following" && followingProfiles.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data } = await q;
    
    let fetchedPosts = data as Post[] || [];
    if (activeFeedTab === "following") {
      const followedIds = followingProfiles.map(f => f.id);
      fetchedPosts = fetchedPosts.filter(p => followedIds.includes(p.author_id));
    }
    if (activeCategory === "all" && activeFeedTab !== "following" && userProfile?.interests && userProfile.interests.length > 0) {
      fetchedPosts = [...fetchedPosts].sort((a, b) => {
        const aMatches = matchesInterests(a, userProfile.interests);
        const bMatches = matchesInterests(b, userProfile.interests);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    setPosts(fetchedPosts);
    setLoading(false);
  };

  const featured = posts.filter((p) => p.featured).slice(0, 1)[0] || posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);
  const topSidebar = posts.slice(0, 5);

  const isLoggedOut = !user;

  if (isLoggedOut) {
    return (
      <div style={{ background: "#f5f3ff", minHeight: "100vh" }}>
        <Navbar />

        {/* ── Logged-out Hero ── */}
        <div style={{ borderBottom: "1px solid #ddd6fe", padding: "20px 0 60px" }}>
          <div 
            style={{ 
              maxWidth: 1192, 
              margin: "0 auto", 
              padding: "0 24px",
              display: "grid",
              gridTemplateColumns: "1fr 400px",
              gap: 48,
              alignItems: "center"
            }}
            className="hero-split"
          >
            <div>
              <h1 
                style={{ 
                  fontFamily: "var(--serif)", 
                  fontSize: "clamp(42px, 7.5vw, 92px)", 
                  fontWeight: 400, 
                  lineHeight: 0.95, 
                  color: "#000000",
                  letterSpacing: "-0.045em",
                  marginBottom: 24
                }}
              >
                Human stories<br />&amp; ideas
              </h1>
              <p 
                style={{ 
                  fontFamily: "var(--serif)", 
                  fontSize: 22, 
                  color: "#292929", 
                  marginBottom: 36,
                  lineHeight: 1.4,
                  maxWidth: 460
                }}
              >
                A place to read, write, and deepen your understanding.
              </p>
              <button
                onClick={() => router.push("/?auth=signin")}
                className="btn btn-primary btn-lg"
                style={{
                  backgroundColor: "var(--brand)",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 600,
                  padding: "14px 36px",
                  borderRadius: "999px"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand)")}
              >
                Start reading
              </button>
            </div>
            <div className="hide-md" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <MediumIllustration />
            </div>
          </div>
        </div>

        {/* ── Trending Section ── */}
        <TrendingSection posts={posts} router={router} />

        {/* ── Main content grid (stories feed on left, sidebar on right) ── */}
        <div style={{ background: "white", padding: "48px 0 80px" }}>
          <div style={{ maxWidth: 1192, margin: "0 auto", padding: "0 24px" }}>
            <div className="home-grid">
              <main className="home-feed">
                {loading ? (
                  <div style={{ padding: "60px 0", textAlign: "center" }}>
                    <div className="spinner" style={{ borderTopColor: "var(--ink)", borderColor: "var(--border)", margin: "0 auto" }} />
                    <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 16 }}>Loading stories…</p>
                  </div>
                ) : rest.length === 0 ? (
                  <div style={{ padding: "80px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                    <p style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>No stories yet</p>
                    <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Be the first to write something.</p>
                  </div>
                ) : (
                  rest.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </main>

              <aside className="home-sidebar">
                <div className="sidebar-section">
                  <div className="sidebar-title">Staff picks</div>
                  {topSidebar.map((post) => {
                    const authorName = (post.profiles as any)?.full_name || "Writer";
                    const cat = CATEGORIES.find((c) => c.id === post.category);
                    return (
                      <Link key={post.id} href={`/post/${post.slug}`} className="sidebar-post" style={{ textDecoration: "none" }}>
                        <div className="sidebar-post-author">
                          <div className="post-card-author-avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
                            {getInitials(authorName)}
                          </div>
                          <span>{authorName}</span>
                        </div>
                        <div className="sidebar-post-title">{post.title}</div>
                        <div className="sidebar-post-meta">{cat?.icon} {cat?.label} · {post.read_time} min</div>
                      </Link>
                    );
                  })}
                </div>
                <div className="sidebar-section">
                  <div className="sidebar-title">Topics to explore</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`tag-chip${activeCategory === cat.id ? " active" : ""}`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <Footer />

        <style jsx global>{`
          @media (max-width: 900px) {
            .hero-split {
              grid-template-columns: 1fr !important;
              text-align: center;
              padding: 40px 16px !important;
            }
            .hero-split button {
              margin: 0 auto;
            }
          }
        `}</style>
      </div>
    );
  }

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push("/");
    }
  };

  const activeLinkStyle = "flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm font-semibold bg-[#f3efff] text-[#7c3aed] transition-colors";
  const inactiveLinkStyle = "flex items-center gap-4 px-4 py-3 rounded-xl font-sans text-sm font-medium text-gray-500 hover:bg-[#f8f6ff] hover:text-[#7c3aed] transition-colors";

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

  const renderSidebarLinks = (onItemClick?: () => void) => (
    <div className="flex flex-col gap-1.5">
      <Link href="/" className={activeCategory === "all" ? activeLinkStyle : inactiveLinkStyle} onClick={() => { setActiveCategory("all"); if (onItemClick) onItemClick(); }}>
        <HomeIcon />
        <span>Home</span>
      </Link>
      <Link href="/library" className={inactiveLinkStyle} onClick={onItemClick}>
        <LibraryIcon />
        <span>Library</span>
      </Link>
      <Link href={`/profile/${userProfile?.username || user?.id}`} className={inactiveLinkStyle} onClick={onItemClick}>
        <ProfileIcon />
        <span>Profile</span>
      </Link>
      <Link href="/dashboard?tab=stories" className={inactiveLinkStyle} onClick={onItemClick}>
        <StoriesIcon />
        <span>Stories</span>
      </Link>
      <Link href="/dashboard?tab=stats" className={inactiveLinkStyle} onClick={onItemClick}>
        <StatsIcon />
        <span>Stats</span>
      </Link>
    </div>
  );

  const feedPosts = activeFeedTab === "foryou" ? posts : (activeFeedTab === "featured" ? posts.filter((p) => p.featured) : posts);

  // ── Logged-in feed layout ──
  return (
    <div className="uget-layout">
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
        .uget-content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 48px;
          padding: 24px 32px 80px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }
        .uget-feed-column {
          min-width: 0;
        }
        .uget-right-sidebar {
          position: sticky;
          top: 88px;
          height: calc(100vh - 120px);
          overflow-y: auto;
        }
        .uget-right-sidebar::-webkit-scrollbar {
          display: none;
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
        .uget-live-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--sans);
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
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
          .uget-content-grid {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 16px 16px 60px;
          }
          .uget-right-sidebar {
            display: none;
          }
          .uget-header {
            padding: 0 16px;
          }
        }
      `}} />

      {/* ── Persistent Desktop Left Sidebar ── */}
      <aside className="uget-sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }} onClick={() => setActiveCategory("all")}>
            <Image src="/favicon.png" alt="UGET Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">UGET</span>
          </Link>
        </div>

        <nav style={{ flex: 1 }}>
          {renderSidebarLinks()}
          {renderFollowingList()}
        </nav>

        {userProfile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <Link href={`/profile/${userProfile?.username || user?.id}`} className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ display: "block" }}>
              {userProfile.avatar_url ? (
                <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                  {getInitials(userProfile.full_name || user?.email || "?")}
                </div>
              )}
            </Link>
            <div className="min-w-0" style={{ flex: 1 }}>
              <div className="font-bold text-sm text-gray-900 truncate">{userProfile.full_name || "Writer"}</div>
              <div className="text-xs text-gray-500 truncate">@{userProfile.username || "writer"}</div>
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
              <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }} onClick={() => { setSidebarOpen(false); setActiveCategory("all"); }}>
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

            {userProfile && (
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  {userProfile.avatar_url ? (
                    <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center">
                      {getInitials(userProfile.full_name || user?.email || "?")}
                    </div>
                  )}
                </div>
                <div className="min-w-0" style={{ flex: 1 }}>
                  <div className="font-bold text-sm text-gray-900 truncate">{userProfile.full_name || "Writer"}</div>
                  <div className="text-xs text-gray-500 truncate">@{userProfile.username || "writer"}</div>
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
            <Link href="/" className="lg:hidden flex items-center gap-1.5" style={{ textDecoration: "none" }} onClick={() => setActiveCategory("all")}>
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
                {userProfile?.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt="" width={36} height={36} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center font-sans">
                    {getInitials(userProfile?.full_name || user?.email || "?")}
                  </div>
                )}
              </button>

              {/* Avatar Dropdown */}
              {userDropdownOpen && (
                <div className="avatar-dropdown absolute right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ right: 0, minWidth: 240 }}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {userProfile?.avatar_url ? (
                        <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                          {getInitials(userProfile?.full_name || user?.email || "?")}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0" style={{ flex: 1 }}>
                      <div className="font-bold text-sm text-gray-900 truncate font-sans">{userProfile?.full_name || "Writer"}</div>
                      <div className="text-xs text-gray-500 truncate font-sans">{user?.email}</div>
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

        {/* Explore Categories Horizontal Bar */}
        <div style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#ffffff" }}>
          <div className="home-cat-tabs" style={{ paddingTop: 8, paddingBottom: 8, margin: "0 auto", paddingLeft: 32, paddingRight: 32, maxWidth: 1200 }}>
            <button
              onClick={() => setActiveCategory("all")}
              className={`home-cat-tab${activeCategory === "all" ? " active" : ""}`}
              style={{ fontWeight: 600 }}
            >
              For you
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`home-cat-tab${activeCategory === cat.id ? " active" : ""}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content columns */}
        <div className="uget-content-grid">
          {/* Feed Column */}
          <div className="uget-feed-column">
            {/* Feed Tabs: For you / Following / Featured */}
            <div style={{ borderBottom: "1px solid var(--border-2)", display: "flex", gap: 24, marginBottom: 16 }}>
              <button
                onClick={() => setActiveFeedTab("foryou")}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: activeFeedTab === "foryou" ? 600 : 500,
                  color: activeFeedTab === "foryou" ? "var(--black)" : "var(--muted)",
                  padding: "12px 4px",
                  borderBottom: activeFeedTab === "foryou" ? "2px solid var(--black)" : "2px solid transparent",
                  backgroundColor: "transparent",
                  cursor: "pointer"
                }}
              >
                For you
              </button>
              <button
                onClick={() => setActiveFeedTab("following")}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: activeFeedTab === "following" ? 600 : 500,
                  color: activeFeedTab === "following" ? "var(--black)" : "var(--muted)",
                  padding: "12px 4px",
                  borderBottom: activeFeedTab === "following" ? "2px solid var(--black)" : "2px solid transparent",
                  backgroundColor: "transparent",
                  cursor: "pointer"
                }}
              >
                Following
              </button>
              <button
                onClick={() => setActiveFeedTab("featured")}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: activeFeedTab === "featured" ? 600 : 500,
                  color: activeFeedTab === "featured" ? "var(--black)" : "var(--muted)",
                  padding: "12px 4px",
                  borderBottom: activeFeedTab === "featured" ? "2px solid var(--black)" : "2px solid transparent",
                  backgroundColor: "transparent",
                  cursor: "pointer"
                }}
              >
                Featured
              </button>
            </div>

            {/* Sub-tabs row when Following is active */}
            {activeFeedTab === "following" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-2)", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 16 }}>
                  <button
                    onClick={() => setFollowingFeedTab("writers")}
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      fontWeight: followingFeedTab === "writers" ? 600 : 500,
                      color: followingFeedTab === "writers" ? "var(--brand)" : "var(--muted)",
                      padding: "10px 4px",
                      borderBottom: followingFeedTab === "writers" ? "1.5px solid var(--brand)" : "1.5px solid transparent",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      border: "none"
                    }}
                  >
                    Writers and publications
                  </button>
                  <button
                    onClick={() => setFollowingFeedTab("topics")}
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      fontWeight: followingFeedTab === "topics" ? 600 : 500,
                      color: followingFeedTab === "topics" ? "var(--brand)" : "var(--muted)",
                      padding: "10px 4px",
                      borderBottom: followingFeedTab === "topics" ? "1.5px solid var(--brand)" : "1.5px solid transparent",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      border: "none"
                    }}
                  >
                    Topics
                  </button>
                </div>
                <Link
                  href="/me/following"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: 16,
                    fontWeight: "bold",
                    backgroundColor: "white",
                    cursor: "pointer"
                  }}
                  title="Refine recommendations"
                >
                  +
                </Link>
              </div>
            )}

            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <div className="spinner" style={{ borderTopColor: "var(--ink)", borderColor: "var(--border)", margin: "0 auto" }} />
                <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 16 }}>Loading stories…</p>
              </div>
            ) : activeFeedTab === "following" && followingProfiles.length === 0 ? (
              /* Follow suggestions list */
              <div style={{ padding: "16px 0" }}>
                <h4 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--black)", marginBottom: 20 }}>
                  Writers to follow
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {suggestedWriters.length === 0 ? (
                    <p style={{ fontFamily: "var(--serif)", fontSize: 14, color: "var(--muted)" }}>No suggestions available at the moment.</p>
                  ) : (
                    suggestedWriters.map((writer) => {
                      const isF = followingProfiles.some(p => p.id === writer.id);
                      return (
                        <div key={writer.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid var(--border-2)" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--border)", flexShrink: 0 }}>
                              {writer.avatar_url ? (
                                <Image src={writer.avatar_url} alt="" width={44} height={44} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                              ) : (
                                <div className="w-full h-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center font-sans">
                                  {getInitials(writer.full_name || "?")}
                                </div>
                              )}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <Link href={`/profile/${writer.username || writer.id}`} style={{ textDecoration: "none", display: "block" }}>
                                <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--black)" }}>{writer.full_name}</span>
                              </Link>
                              <span style={{ display: "block", fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {writer.bio || "No bio description provided."}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFollowSuggestedWriter(writer.id)}
                            style={{
                              border: isF ? "1px solid var(--border)" : "1px solid var(--brand)",
                              color: isF ? "var(--muted)" : "var(--brand)",
                              backgroundColor: "transparent",
                              borderRadius: 999,
                              padding: "6px 16px",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "var(--sans)",
                              marginLeft: 16
                            }}
                          >
                            {isF ? "Following" : "Follow"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : feedPosts.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <p style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>No stories yet</p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Be the first to write something.</p>
                <Link href="/write" className="btn btn-primary btn-md" style={{ marginTop: 20, display: "inline-flex", textDecoration: "none" }}>
                  Write a story
                </Link>
              </div>
            ) : (
              feedPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>


          {/* Desktop Right Sidebar */}
          <aside className="uget-right-sidebar">
            <div className="sidebar-section" style={{ marginBottom: 32 }}>
              <div className="sidebar-title" style={{ fontWeight: 700 }}>Staff picks</div>
              {topSidebar.map((post) => {
                const authorName = (post.profiles as any)?.full_name || "Writer";
                const cat = CATEGORIES.find((c) => c.id === post.category);
                return (
                  <Link key={post.id} href={`/post/${post.slug}`} className="sidebar-post" style={{ textDecoration: "none" }}>
                    <div className="sidebar-post-author" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div className="post-card-author-avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
                        {getInitials(authorName)}
                      </div>
                      <span className="font-semibold" style={{ color: "var(--ink)" }}>{authorName}</span>
                    </div>
                    <div className="sidebar-post-title" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, color: "var(--black)" }}>
                      {post.title}
                    </div>
                    <div className="sidebar-post-meta" style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 6 }}>
                      {cat?.icon} {cat?.label} · {post.read_time} min read
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="sidebar-section" style={{ marginBottom: 32 }}>
              <div className="sidebar-title" style={{ fontWeight: 700 }}>Topics to explore</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`tag-chip${activeCategory === cat.id ? " active" : ""}`}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop right sidebar footer */}
            <div style={{ borderTop: "1px solid var(--border-2)", paddingTop: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 12 }}>
                {["Help", "Status", "About", "Careers", "Blog", "Privacy", "Terms", "Teams"].map((link) => (
                  <Link key={link} href="#" style={{ fontSize: 11, color: "var(--muted-2)", textDecoration: "none" }} className="hover:underline">
                    {link}
                  </Link>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-2)" }}>
                © 2026 UGET. All rights reserved.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function matchesInterests(post: Post, interests: string[]): boolean {
  const catLower = post.category ? post.category.toLowerCase() : "";
  const titleLower = post.title ? post.title.toLowerCase() : "";
  
  for (const interest of interests) {
    const interestLower = interest.toLowerCase();
    
    // Check direct tag match
    if (post.tags && Array.isArray(post.tags) && post.tags.some(t => t.toLowerCase() === interestLower)) {
      return true;
    }
    
    // Check direct word in title
    if (titleLower.includes(interestLower)) {
      return true;
    }
    
    // Map specific interests to high-level categories
    if (catLower === "ai" && (interestLower === "ai" || interestLower === "artificial intelligence" || interestLower === "llm" || interestLower === "chatgpt" || interestLower === "ai agent")) return true;
    if (catLower === "programming" && (interestLower === "programming" || interestLower === "python" || interestLower === "javascript" || interestLower === "react" || interestLower === "web development" || interestLower === "software development" || interestLower === "software engineering" || interestLower === "devops" || interestLower === "data science" || interestLower === "machine learning" || interestLower === "deep learning" || interestLower === "flutter" || interestLower === "java")) return true;
    if (catLower === "technology" && (interestLower === "technology" || interestLower === "tech" || interestLower === "future" || interestLower === "apple" || interestLower === "android" || interestLower === "ios" || interestLower === "kubernetes" || interestLower === "aws")) return true;
    if (catLower === "cybersecurity" && interestLower === "cybersecurity") return true;
    if (catLower === "startup" && (interestLower === "startup" || interestLower === "entrepreneurship")) return true;
    if (catLower === "career" && (interestLower === "careers" || interestLower === "career" || interestLower === "work" || interestLower === "leadership")) return true;
    if (catLower === "design" && (interestLower === "design" || interestLower === "ux" || interestLower === "ux design" || interestLower === "art" || interestLower === "creativity")) return true;
  }
  
  return false;
}