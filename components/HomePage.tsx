"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";
import { CATEGORIES, formatDate, getInitials } from "@/lib/types";
import { useSearchParams } from "next/navigation";

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

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const supabase = createClient();

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

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero ── */}
      <div className="home-hero">
        <div className={`home-hero-inner ${featured ? "has-featured" : "no-featured"}`}>
          <div>
            <h1 className="home-hero-title">
              Human stories<br />&amp; ideas
            </h1>
            <p className="home-hero-sub">A place to read, write, and deepen your understanding.</p>
            <Link href="/auth?mode=signup" className="home-hero-cta">
              Start reading
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <div className="topic-pills">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="topic-pill"
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          {featured && (
            <div>
              <FeaturedCard post={featured} />
            </div>
          )}
        </div>
      </div>

      {/* ── Feed + Sidebar ── */}
      <div className="home-feed-wrap" id="feed">

        {/* Category tabs */}
        <div className="home-cat-tabs">
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
          {/* Feed */}
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
                <Link href="/write" className="btn btn-primary btn-md" style={{ marginTop: 20, display: "inline-flex", textDecoration: "none" }}>
                  Write a story
                </Link>
              </div>
            ) : (
              rest.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </main>

          {/* Sidebar */}
          <aside className="home-sidebar">
            <div className="sidebar-section">
              <div className="sidebar-title">Staff picks</div>
              {topSidebar.map((post) => {
                const authorName = (post.profiles as any)?.full_name || "Writer";
                const authorUsername = (post.profiles as any)?.username || post.author_id;
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

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-logo">UGET</span>
          <div className="footer-links">
            {["About", "Help", "Terms", "Privacy"].map((l) => (
              <Link key={l} href="#" className="footer-link">{l}</Link>
            ))}
          </div>
          <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)" }}>
            © {new Date().getFullYear()} UGET Technologies
          </span>
        </div>
      </footer>

      <style>{`
        /* ── Feed wrapper ── */
        .home-feed-wrap {
          max-width: 1192px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }

        /* ── Category tabs ── */
        .home-cat-tabs {
          display: flex;
          align-items: center;
          gap: 0;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          margin-bottom: 0;
          padding-top: 32px;
        }
        .home-cat-tabs::-webkit-scrollbar { display: none; }

        .home-cat-tab {
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          padding: 12px 16px;
          border-bottom: 2px solid transparent;
          background: none;
          cursor: pointer;
          margin-bottom: -1px;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .home-cat-tab:hover { color: var(--ink); }
        .home-cat-tab.active {
          color: var(--black);
          border-bottom-color: var(--black);
        }

        /* ── Feed grid ── */
        .home-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 64px;
          padding-top: 8px;
        }

        .home-feed { min-width: 0; }
        .home-sidebar { padding-top: 20px; }

        /* ── Tablet: hide sidebar ── */
        @media (max-width: 960px) {
          .home-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .home-sidebar { display: none; }
        }

        /* ── Mobile tweaks ── */
        @media (max-width: 640px) {
          .home-feed-wrap { padding: 0 16px 60px; }

          .home-cat-tab { font-size: 13px; padding: 10px 12px; }

          /* stack post card vertically */
          .post-card { flex-direction: column-reverse; gap: 12px; padding: 20px 0; }
          .post-card-image {
            width: 100% !important;
            min-width: unset !important;
            height: 180px !important;
          }
          .post-card-meta { flex-wrap: wrap; gap: 6px; }
        }

        /* ── Small mobile ── */
        @media (max-width: 400px) {
          .home-cat-tab { font-size: 12px; padding: 8px 10px; }
        }
      `}</style>
    </div>
  );
}