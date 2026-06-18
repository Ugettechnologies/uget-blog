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
    <line x1="100" y1="50" x2="100" y2="350" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="50" y1="300" x2="350" y2="300" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4 4" />
    
    <circle cx="100" cy="300" r="120" stroke="rgba(21,128,61,0.12)" strokeWidth="1" fill="none" />
    <circle cx="100" cy="300" r="180" stroke="rgba(21,128,61,0.06)" strokeWidth="1" fill="none" />
    
    {/* Math diagram arcs and lines */}
    <path d="M 100 120 A 180 180 0 0 1 280 300" stroke="rgba(21,128,61,0.25)" strokeWidth="1.5" fill="none" />
    <line x1="100" y1="300" x2="227" y2="173" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
    <circle cx="227" cy="173" r="4" fill="var(--brand)" />
    
    {/* Green flower elements */}
    <g transform="translate(250, 150)">
      {/* Central center circle */}
      <circle cx="0" cy="0" r="28" fill="#15803d" />
      {/* 5 Petals */}
      <path d="M 0 -28 C -30 -80, 30 -80, 0 -28" fill="#15803d" opacity="0.95" />
      <path d="M 26.6 -8.6 C 75 -35, 85 25, 26.6 -8.6" fill="#15803d" opacity="0.95" transform="rotate(72)" />
      <path d="M 16.5 22.7 C 55 60, -15 85, 16.5 22.7" fill="#15803d" opacity="0.95" transform="rotate(144)" />
      <path d="M -16.5 22.7 C -55 60, 15 85, -16.5 22.7" fill="#15803d" opacity="0.95" transform="rotate(216)" />
      <path d="M -26.6 -8.6 C -75 -35, -85 25, -26.6 -8.6" fill="#15803d" opacity="0.95" transform="rotate(288)" />
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
                <div style={{ fontFamily: "var(--sans)", fontSize: 30, fontWeight: 700, color: "#e6e6e6", lineHeight: 1, marginTop: -4 }}>
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--ink)", color: "white", fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, query]);

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
    const { data } = await q;
    setPosts(data as Post[] || []);
    setLoading(false);
  };

  const featured = posts.filter((p) => p.featured).slice(0, 1)[0] || posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);
  const topSidebar = posts.slice(0, 5);

  const isLoggedOut = !user;

  if (isLoggedOut) {
    return (
      <div style={{ background: "#f6f4ee", minHeight: "100vh" }}>
        <Navbar />

        {/* ── Logged-out Hero ── */}
        <div style={{ borderBottom: "1px solid var(--border)", padding: "20px 0 60px" }}>
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
                  backgroundColor: "#1a1a1a",
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 600,
                  padding: "14px 36px",
                  borderRadius: "999px"
                }}
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

  // ── Logged-in feed layout ──
  return (
    <div style={{ background: "white", minHeight: "100vh" }}>
      <Navbar />

      <div className="home-feed-wrap" style={{ paddingTop: 24 }}>
        {/* Category tabs */}
        <div className="home-cat-tabs" style={{ paddingTop: 0 }}>
          <button
            onClick={() => setActiveCategory("all")}
            className={`home-cat-tab${activeCategory === "all" ? " active" : ""}`}
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

        <div className="home-grid">
          <main className="home-feed">
            {loading ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <div className="spinner" style={{ borderTopColor: "var(--ink)", borderColor: "var(--border)", margin: "0 auto" }} />
                <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", marginTop: 16 }}>Loading stories…</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ padding: "80px 0", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <p style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>No stories yet</p>
                <p style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--muted)" }}>Be the first to write something.</p>
                <Link href="/write" className="btn btn-primary btn-md" style={{ marginTop: 20, display: "inline-flex", textDecoration: "none" }}>
                  Write a story
                </Link>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
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

      <Footer />
    </div>
  );
}