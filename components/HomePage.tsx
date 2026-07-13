"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { createClient } from "@/lib/db-client/client";
import { UserDropdown } from "@/components/UserDropdown";
import type { Post } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarNav, SidebarFollowingList, CloseIcon, SearchIcon, HamburgerIcon, WriteIcon, BellIcon, SettingsIcon, HelpIcon, SignOutIcon } from "./SidebarNav";
import SafeImage from "./SafeImage";

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
              <SafeImage src={authorAvatar} alt={authorName} width={24} height={24} style={{ objectFit: "cover" }} />
            ) : (
              <span>{getInitials(authorName)}</span>
            )}
          </Link>
          <div className="post-card-author-info">
            <Link href={`/profile/${authorUsername}`} style={{ textDecoration: "none", color: "var(--ink)", fontWeight: 600 }}>{authorName}</Link>
            <span>·</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
        </div>
        <Link href={`/post/${post.slug}`} className="post-card-title-link" style={{ textDecoration: "none" }}>
          <h3 className="post-card-title">{post.title}</h3>
          {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
        </Link>
        <div className="post-card-meta">
          {cat && <span className="post-card-tag">{cat.label}</span>}
          <span>{post.read_time} min read</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            {post.like_count}
          </span>
        </div>
      </div>
      <Link href={`/post/${post.slug}`} className="post-card-image">
        <SafeImage src={post.cover_image} alt={post.title} fill fallbackSeed={post.id || post.slug} />
      </Link>
    </article>
  );
}

function FeaturedCard({ post }: { post: Post }) {
  const cat = CATEGORIES.find((c) => c.id === post.category);
  const authorName = (post.profiles as any)?.full_name || "Writer";
  return (
    <Link href={`/post/${post.slug}`} className="featured-card" style={{ textDecoration: "none", display: "block" }}>
      <SafeImage src={post.cover_image} alt={post.title} fill className="featured-card-img" fallbackSeed={post.id || post.slug} />
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

const BrandIllustration = () => (
  <div className="illustration-3d-container">
    {/* Floating backdrop glow orb */}
    <div className="hero-glow-orb hero-glow-orb-1" />

    {/* Concentric SVG Radar Arcs */}
    <svg 
      viewBox="0 0 400 400" 
      style={{
        position: "absolute",
        width: "110%",
        height: "110%",
        pointerEvents: "none",
        zIndex: 1
      }}
    >
      {/* Dashed & solid arcs */}
      <circle cx="200" cy="200" r="180" stroke="var(--hero-grid-color)" strokeWidth="1.5" fill="none" strokeDasharray="6 6" style={{ transition: "stroke 0.5s ease" }} />
      <circle cx="200" cy="200" r="130" stroke="var(--hero-grid-color)" strokeWidth="1" fill="none" style={{ transition: "stroke 0.5s ease" }} />
      <circle cx="200" cy="200" r="80" stroke="var(--hero-grid-color)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" style={{ transition: "stroke 0.5s ease" }} />
      
      {/* Grid lines */}
      <line x1="200" y1="10" x2="200" y2="390" stroke="var(--hero-grid-color)" strokeWidth="1" strokeDasharray="6 6" style={{ transition: "stroke 0.5s ease" }} />
      <line x1="10" y1="200" x2="390" y2="200" stroke="var(--hero-grid-color)" strokeWidth="1" strokeDasharray="6 6" style={{ transition: "stroke 0.5s ease" }} />
      
      {/* Diagonal line pointing towards the text (top-left) */}
      <line x1="200" y1="200" x2="60" y2="60" stroke="var(--hero-grid-color)" strokeWidth="1.5" style={{ transition: "stroke 0.5s ease" }} />
      <circle cx="60" cy="60" r="5" fill="var(--brand)" style={{ transition: "fill 0.5s ease" }} />
    </svg>

    {/* Floating visual elements (glassmorphic circle accents) */}
    <div className="floating-circle floating-circle-1" />
    <div className="floating-circle floating-circle-2" />

    {/* The main logo icon facing towards the text (horizontal flip via CSS animation class) */}
    <div className="brand-logo-illustration">
      <Image 
        src="/logo-icon-transparent.png" 
        alt="EchoGist Brand Icon" 
        width={220} 
        height={220} 
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  </div>
);

interface TrendingSectionProps {
  posts: Post[];
  router: any;
}

function TrendingSection({ posts, router }: TrendingSectionProps) {
  // Take first 6 posts
  const trendingPosts = posts.slice(0, 6);

  return (
    <div className="trending-section" style={{ borderBottom: "1px solid var(--border)", background: "white" }}>
      <div style={{ maxWidth: 1192, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <h2 style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink)" }}>
            Trending on EchoGist
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

const EmptyStateIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 20px", opacity: 0.9 }}>
    <circle cx="60" cy="60" r="50" fill="#f5f3ff" />
    <rect x="42" y="32" width="36" height="48" rx="3" fill="white" stroke="#7c3aed" strokeWidth="2" />
    <rect x="48" y="38" width="36" height="48" rx="3" fill="white" stroke="#c0a1f9" strokeWidth="1.5" />
    <line x1="56" y1="46" x2="74" y2="46" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
    <line x1="56" y1="54" x2="74" y2="54" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
    <line x1="56" y1="62" x2="68" y2="62" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
    <path d="M78 72 L88 52 C88 52 90 48 94 48 C98 48 100 52 100 52 L90 72 Z" fill="#7c3aed" />
    <path d="M78 72 L76 76 L80 74 Z" fill="#1a1a1a" />
    <path d="M82 64 C84 64 86 66 86 68" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

interface EmptyStateProps {
  showWriteButton?: boolean;
}

function EmptyState({ showWriteButton = false }: EmptyStateProps) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <EmptyStateIllustration />
      <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--black)", marginBottom: 8 }}>
        No stories yet
      </h3>
      <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)", maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.5 }}>
        Be the first to write something and share your perspective with the EchoGist community.
      </p>
      {showWriteButton && (
        <Link 
          href="/write" 
          className="btn btn-primary font-sans"
          style={{ padding: "10px 24px", fontSize: 14 }}
        >
          Write a story
        </Link>
      )}
    </div>
  );
}

const tabStyle = (isActive: boolean) => ({
  fontFamily: "var(--sans)",
  fontSize: "14px",
  fontWeight: isActive ? 600 : 500,
  color: isActive ? "var(--black)" : "var(--muted)",
  padding: "12px 4px",
  borderBottom: isActive ? "2px solid var(--black)" : "2px solid transparent",
  backgroundColor: "transparent",
  cursor: "pointer",
  borderLeft: "none",
  borderRight: "none",
  borderTop: "none",
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
  transition: "all 0.2s"
});

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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
        const [profileRes, followersRes, followingRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("follows").select("*").eq("following_id", user.id),
          supabase.from("follows").select("*").eq("follower_id", user.id),
        ]);
        const profile = profileRes.data ? {
          ...profileRes.data,
          follower_count: followersRes.data ? followersRes.data.length : 0,
          following_count: followingRes.data ? followingRes.data.length : 0,
        } : null;
        setUserProfile(profile);
        // Check localStorage fallback before redirecting (in case DB column is missing)
        const localInterests = (() => { try { const s = localStorage.getItem("uget_user_interests"); return s ? JSON.parse(s) : []; } catch { return []; } })();
        const hasInterests = (profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0) || localInterests.length > 0;
        if (profile && !hasInterests) {
          router.push("/onboarding");
          return;
        }
        loadNotifications(user.id);
        loadFollowingProfiles(user.id);
        setIsCheckingAuth(false);
      } else {
        setIsCheckingAuth(false);
      }
      loadSuggestedWriters();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const [profileRes, followersRes, followingRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", u.id).single(),
          supabase.from("follows").select("*").eq("following_id", u.id),
          supabase.from("follows").select("*").eq("follower_id", u.id),
        ]);
        const profile = profileRes.data ? {
          ...profileRes.data,
          follower_count: followersRes.data ? followersRes.data.length : 0,
          following_count: followingRes.data ? followingRes.data.length : 0,
        } : null;
        setUserProfile(profile);
        // Check localStorage fallback before redirecting (in case DB column is missing)
        const localInterestsAuth = (() => { try { const s = localStorage.getItem("uget_user_interests"); return s ? JSON.parse(s) : []; } catch { return []; } })();
        const hasInterestsAuth = (profile?.interests && Array.isArray(profile.interests) && profile.interests.length > 0) || localInterestsAuth.length > 0;
        if (profile && !hasInterestsAuth) {
          router.push("/onboarding");
          return;
        }
        loadNotifications(u.id);
        loadFollowingProfiles(u.id);
        setIsCheckingAuth(false);
      } else {
        setUserProfile(null);
        setNotifications([]);
        setUnreadNotifCount(0);
        setFollowingProfiles([]);
        setIsCheckingAuth(false);
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

  if (isCheckingAuth) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: 32, height: 32, borderTopColor: "var(--brand)", borderColor: "var(--border)", borderRadius: "50%", borderWidth: 2, borderStyle: "solid", animation: "spin 1s linear infinite" }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  const isLoggedOut = !user;

  if (isLoggedOut) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />

        {/* ── Logged-out Clean Hero ── */}
        <div className="home-hero-3d">
          <div className="home-hero-3d-inner">
            <div style={{ position: "relative", zIndex: 10 }}>
              <h1 
                style={{ 
                  fontFamily: "var(--display)", 
                  fontSize: "clamp(48px, 6.8vw, 86px)", 
                  fontWeight: 800, 
                  lineHeight: 1.0, 
                  color: "var(--hero-text)",
                  letterSpacing: "-0.04em",
                  marginBottom: 24
                }}
               >
                Curiosity in.<br />
                <span style={{ 
                  background: "linear-gradient(135deg, var(--brand) 0%, #ec4899 100%)", 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent"
                }}>
                  Perspective out.
                </span>
              </h1>
              <p 
                style={{ 
                  fontFamily: "var(--serif)", 
                  fontSize: 22, 
                  color: "var(--hero-sub)", 
                  marginBottom: 36,
                  lineHeight: 1.45,
                  maxWidth: 480
                }}
              >
                EchoGist is the home for clean, human-written stories. No clickbait, no algorithmic fluff. Just real thoughts from creators on tech, design, and everything in between.
              </p>
              <div style={{ display: "flex" }} className="hero-3d-cta-wrap">
                <button
                  onClick={() => router.push("/?auth=signin")}
                  className="btn btn-primary btn-lg"
                  style={{
                    background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)",
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: 600,
                    padding: "14px 38px",
                    borderRadius: "999px",
                    boxShadow: "0 8px 24px var(--hero-head-glow)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 30px var(--hero-head-glow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px var(--hero-head-glow)";
                  }}
                >
                  Start reading
                </button>
              </div>
            </div>
            <div className="hide-md" style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 10 }}>
              <BrandIllustration />
            </div>
          </div>
        </div>

        {/* ── Trending Section ── */}
        <TrendingSection posts={posts} router={router} />

        {/* ── Main content grid (stories feed on left, sidebar on right) ── */}
        <div className="home-feed-container" style={{ background: "var(--bg)" }}>
          <div style={{ maxWidth: 1192, margin: "0 auto", padding: "0 24px" }}>
            <div className="home-grid">
              <main className="home-feed">
                {loading ? (
                  <div style={{ padding: "60px 0", textAlign: "center" }}>
                    <div className="spinner" style={{ borderTopColor: "var(--ink)", borderColor: "var(--border)", margin: "0 auto" }} />
                    <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 16 }}>Loading stories…</p>
                  </div>
                ) : rest.length === 0 ? (
                  <EmptyState />
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
                        {cat.label}
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
          .home-hero-container {
            padding: 40px 0 80px;
          }
          .trending-section {
            padding: 48px 0 40px;
          }
          .home-feed-container {
            padding: 48px 0 80px;
          }
          @media (max-width: 900px) {
            .hero-split {
              grid-template-columns: 1fr !important;
              text-align: center;
              padding: 24px 16px !important;
              gap: 24px !important;
            }
            .hero-split button {
              margin: 0 auto;
            }
            .home-hero-container {
              padding: 24px 0 32px !important;
            }
            .trending-section {
              padding: 24px 0 20px !important;
            }
            .home-feed-container {
              padding: 24px 0 60px !important;
            }
          }
        `}</style>
      </div>
    );
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/?q=${encodeURIComponent(searchInput.trim())}`);
    } else {
      router.push("/");
    }
  };

  const feedPosts = activeFeedTab === "foryou" ? posts : (activeFeedTab === "featured" ? posts.filter((p) => p.featured) : posts);

  // ── Logged-in feed layout ──
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
          background-color: var(--bg-2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 28px 14px 24px;
          gap: 0;
          z-index: 100;
          overflow-y: auto;
        }
        .uget-sidebar-logo {
          padding: 0 8px;
          margin-bottom: 28px;
        }
        .uget-sidebar-nav {
          flex: 1;
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
        .uget-content-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 32px;
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
            padding: 0 24px;
          }
        }
      `}} />
      {/* ── Persistent Desktop Left Sidebar ── */}
      <aside className="uget-sidebar">
        <div style={{ marginBottom: 32 }}>
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }} onClick={() => setActiveCategory("all")}>
            <Image src="/favicon.png" alt="EchoGist Logo" width={32} height={32} />
            <span className="font-bold text-2xl text-violet-600 font-display">EchoGist</span>
          </Link>
        </div>

        <nav style={{ flex: 1 }}>
          <SidebarNav
            activePage="home"
            profileHref={`/profile/${userProfile?.username || user?.id}`}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} userProfileId={userProfile?.id} />
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
            {/* Clickable follower/following counts */}
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
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} onClick={() => { setSidebarOpen(false); setActiveCategory("all"); }}>
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
            activePage="home"
            profileHref={`/profile/${userProfile?.username || user?.id}`}
            onItemClick={() => setSidebarOpen(false)}
          />
          <SidebarFollowingList followingProfiles={followingProfiles} userProfileId={userProfile?.id} />
        </nav>

        {userProfile && (
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {userProfile.avatar_url ? (
                <Image src={userProfile.avatar_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full font-bold text-sm flex items-center justify-center" style={{ backgroundColor: "var(--brand-light)", color: "var(--brand)" }}>
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
            <Link href="/" className="uget-header-logo flex items-center gap-1.5" style={{ textDecoration: "none" }} onClick={() => setActiveCategory("all")}>
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
            {(userProfile?.role === "admin" || userProfile?.role === "staff") && (
              <Link href="/write" className="flex items-center justify-center gap-2 text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-1.5 rounded-full text-sm font-medium transition-all" style={{ textDecoration: "none" }}>
                <span className="flex items-center justify-center"><WriteIcon /></span>
                <span className="hidden sm:inline">Write</span>
              </Link>
            )}

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

        {/* Content columns */}
        <div className="uget-content-grid">
          {/* Feed Column */}
          <div className="uget-feed-column">
            {/* Unified Feed & Category Navigation Tabs */}
            <div style={{ borderBottom: "1px solid var(--border-2)", display: "flex", gap: 24, marginBottom: 20, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }} className="feed-nav-scroll">
              <button
                onClick={() => { setActiveCategory("all"); setActiveFeedTab("foryou"); }}
                style={tabStyle(activeFeedTab === "foryou" && activeCategory === "all")}
              >
                For you
              </button>
              <button
                onClick={() => { setActiveCategory("all"); setActiveFeedTab("following"); }}
                style={tabStyle(activeFeedTab === "following")}
              >
                Following
              </button>
              <button
                onClick={() => { setActiveCategory("all"); setActiveFeedTab("featured"); }}
                style={tabStyle(activeFeedTab === "featured")}
              >
                Featured
              </button>
              <div style={{ width: 1, backgroundColor: "var(--border)", margin: "12px 0", alignSelf: "stretch", flexShrink: 0 }} />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setActiveFeedTab("foryou"); }}
                  style={tabStyle(activeFeedTab === "foryou" && activeCategory === cat.id)}
                >
                  {cat.label}
                </button>
              ))}
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
                                <div className="w-full h-full font-bold text-sm flex items-center justify-center font-sans" style={{ backgroundColor: "var(--brand-light)", color: "var(--brand)" }}>
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
                              border: "1px solid var(--brand)",
                              color: isF ? "white" : "var(--brand)",
                              backgroundColor: isF ? "var(--brand)" : "transparent",
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
              <EmptyState showWriteButton={userProfile?.role === "admin" || userProfile?.role === "staff"} />
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
                    onClick={() => { setActiveCategory(cat.id); setActiveFeedTab("foryou"); }}
                    className={`tag-chip${activeCategory === cat.id ? " active" : ""}`}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop right sidebar footer */}
            <div style={{ borderTop: "1px solid var(--border-2)", paddingTop: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 12 }}>
                {[
                  { label: "Help", href: "/help" },
                  { label: "Status", href: "/status" },
                  { label: "About", href: "/about" },
                  { label: "Careers", href: "/careers" },
                  { label: "Blog", href: "/blog" },
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                  { label: "Teams", href: "/staff" }
                ].map((link) => (
                  <Link key={link.label} href={link.href} style={{ fontSize: 11, color: "var(--muted-2)", textDecoration: "none" }} className="hover:underline">
                    {link.label}
                  </Link>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted-2)" }}>
                © 2026 EchoGist. All rights reserved.
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
