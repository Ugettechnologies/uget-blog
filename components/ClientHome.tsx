"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
}

const CAT_META: Record<string, { label: string; color: string; emoji: string }> = {
  frontend: { label: "Frontend Dev", color: "cat-frontend", emoji: "💻" },
  uiux: { label: "UI/UX Design", color: "cat-uiux", emoji: "🎨" },
  cybersecurity: { label: "Cybersecurity", color: "cat-cyber", emoji: "🔐" },
  ai: { label: "AI & Tech", color: "cat-ai", emoji: "🤖" },
  career: { label: "Career Guides", color: "cat-career", emoji: "🚀" },
  tutorials: { label: "Tutorials", color: "cat-tutorials", emoji: "📚" },
  mobile: { label: "Mobile Dev", color: "cat-mobile", emoji: "📱" },
  backend: { label: "Backend Dev", color: "cat-backend", emoji: "⚙️" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PostCard({ post }: { post: Post }) {
  const cat = CAT_META[post.category] || { label: post.category, color: "cat-tutorials", emoji: "📝" };
  return (
    <Link href={`/post/${post.slug}`} className="blog-card group">
      <div className="blog-card-image">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0F172A] to-[#1E293B] flex items-center justify-center">
            <div className="grid-pattern absolute inset-0 opacity-30" />
            <span className="text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
          </div>
        )}
        {post.featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="featured-badge text-white text-[10px]">TRENDING</span>
          </div>
        )}
      </div>
      <div className="blog-card-body">
        <div className="flex items-center gap-2 mb-3">
          <span className={`tag-pill ${cat.color}`}>{cat.label}</span>
          <span className="text-white/30 text-xs">{post.readTime} min read</span>
        </div>
        <h3 className="blog-card-title group-hover:text-[#60A5FA] transition-colors">{post.title}</h3>
        <p className="blog-card-excerpt">{post.excerpt}</p>
        <div className="blog-card-footer">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-[10px] font-bold text-white">
              {post.author.charAt(0)}
            </div>
            <div>
              <div className="text-white/60 text-xs font-medium">{post.author}</div>
              <div className="text-white/30 text-[10px]">{formatDate(post.createdAt)}</div>
            </div>
          </div>
          <span className="read-more text-[11px]">Read →</span>
        </div>
      </div>
    </Link>
  );
}

function HeroPost({ post }: { post: Post }) {
  const cat = CAT_META[post.category] || { label: post.category, color: "cat-tutorials", emoji: "📝" };
  return (
    <Link href={`/post/${post.slug}`} className="hero-post group block">
      <div className="hero-post-image">
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2563EB]/25 via-[#0F172A] to-[#1E293B] flex items-center justify-center overflow-hidden">
            <div className="grid-pattern absolute inset-0 opacity-30" />
            <span className="text-8xl relative z-10">{cat.emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080E1A] via-[#080E1A]/30 to-transparent" />
      </div>
      <div className="hero-post-content">
        <div className="flex items-center gap-3 mb-3">
          <span className={`tag-pill ${cat.color}`}>{cat.label}</span>
          <span className="text-white/40 text-xs">{post.readTime} min read</span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-[#60A5FA] transition-colors">
          {post.title}
        </h2>
        <p className="text-white/55 text-base leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-xs font-bold text-white">
            {post.author.charAt(0)}
          </div>
          <div>
            <div className="text-white/70 text-sm font-medium">{post.author}</div>
            <div className="text-white/35 text-xs">{formatDate(post.createdAt)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ClientHome({ posts }: { posts: Post[] }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  const handleScroll = () => setNavScrolled(window.scrollY > 20);
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  const featuredPosts = posts.filter((p) => p.featured);
  const heroPost = featuredPosts[0] || posts[0];
  const sidePosts = featuredPosts.slice(1, 3).length >= 2 ? featuredPosts.slice(1, 3) : posts.slice(1, 3);

  const filteredPosts = activeCategory === "all"
    ? posts.filter((p) => p.id !== heroPost?.id)
    : posts.filter((p) => p.category === activeCategory && p.id !== heroPost?.id);

  const categories = [
    { id: "all", label: "All", emoji: "🌐" },
    ...Object.entries(CAT_META).map(([id, m]) => ({ id, ...m })),
  ];

  return (
    <div className="min-h-screen" style={{ background: "#080E1A" }}>
      {/* ─── NAVBAR ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? "nav-blur" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-text.png" alt="UGET" width={100} height={28} className="object-contain" />
          </Link>

          {/* Desktop cats */}
          <div className="hidden lg:flex items-center gap-1">
            {categories.slice(0, 7).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.id);
                  document.getElementById("posts-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeCategory === c.id
                    ? "bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth" className="btn-outline text-xs px-4 py-2">Sign In</Link>
            <Link href="/auth" className="btn-primary text-xs px-4 py-2">Get Started</Link>
            <button className="lg:hidden text-white/70 p-1.5 ml-1" onClick={() => setMenuOpen(!menuOpen)}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden nav-blur border-t border-white/8 px-5 py-3 grid grid-cols-3 gap-2">
            {categories.map((c) => (
              <button key={c.id} onClick={() => { setActiveCategory(c.id); setMenuOpen(false); document.getElementById("posts-section")?.scrollIntoView({ behavior: "smooth" }); }}
                className={`px-2 py-2 rounded-lg text-xs font-medium text-center transition-all ${activeCategory === c.id ? "bg-[#2563EB]/20 text-[#60A5FA]" : "text-white/50 hover:text-white"}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ─── BREAKING TICKER ─── */}
      <div className="bg-[#2563EB] py-1.5 pt-14 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-content">
            {posts.slice(0, 6).map((p, i) => (
              <Link key={p.id} href={`/post/${p.slug}`} className="ticker-item">
                <span className="ticker-label">LATEST</span>
                <span className="ticker-text">{p.title}</span>
                {i < 5 && <span className="ticker-sep">•</span>}
              </Link>
            ))}
            {posts.slice(0, 6).map((p, i) => (
              <Link key={p.id + "-dup"} href={`/post/${p.slug}`} className="ticker-item">
                <span className="ticker-label">LATEST</span>
                <span className="ticker-text">{p.title}</span>
                {i < 5 && <span className="ticker-sep">•</span>}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HERO SECTION ─── */}
      {heroPost && (
        <section className="max-w-7xl mx-auto px-5 py-8">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Main hero */}
            <div className="lg:col-span-2">
              <HeroPost post={heroPost} />
            </div>
            {/* Side posts */}
            <div className="flex flex-col gap-4">
              {sidePosts.map((post) => {
                const cat = CAT_META[post.category] || { label: post.category, color: "cat-tutorials", emoji: "📝" };
                return (
                  <Link key={post.id} href={`/post/${post.slug}`} className="side-post group">
                    <div className="side-post-image">
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center">
                          <span className="text-2xl">{cat.emoji}</span>
                        </div>
                      )}
                    </div>
                    <div className="side-post-content">
                      <span className={`tag-pill ${cat.color} mb-2 inline-block`}>{cat.label}</span>
                      <h3 className="text-white text-sm font-semibold leading-snug group-hover:text-[#60A5FA] transition-colors line-clamp-2">{post.title}</h3>
                      <div className="text-white/35 text-xs mt-2">{formatDate(post.createdAt)}</div>
                    </div>
                  </Link>
                );
              })}

              {/* Ad / promo block */}
              <div className="promo-block">
                <div className="promo-content">
                  <div className="text-xs font-bold tracking-widest text-[#60A5FA]/70 uppercase mb-2">UGET Academy</div>
                  <h3 className="text-white font-bold text-base mb-1">Learn Tech. Build Skills.</h3>
                  <p className="text-white/50 text-xs mb-3">Join 12K+ African tech learners today.</p>
                  <Link href="/auth" className="promo-btn">Enroll Free →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── CATEGORY STRIP ─── */}
      <section className="border-y border-white/8 py-3">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`category-chip whitespace-nowrap transition-all duration-200 ${activeCategory === c.id ? "category-chip-active" : ""}`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POSTS GRID ─── */}
      <section id="posts-section" className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="section-line mb-3" />
            <h2 className="text-2xl font-bold text-white">
              {activeCategory === "all" ? "Latest Articles" : `${CAT_META[activeCategory]?.label || activeCategory}`}
            </h2>
            <p className="text-white/35 text-sm mt-1">{filteredPosts.length} article{filteredPosts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white/40 text-lg">No posts in this category yet.</p>
            <p className="text-white/25 text-sm mt-1">Check back soon or explore other categories.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="newsletter-section">
        <div className="max-w-2xl mx-auto text-center px-5 py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
            <span className="text-[#60A5FA] text-[11px] font-semibold tracking-widest uppercase">Newsletter</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Stay in the loop</h2>
          <p className="text-white/45 text-sm mb-8">Weekly digest of the best tech articles, tutorials, and career tips.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="your@email.com" className="newsletter-input flex-1" />
            <button className="btn-primary text-sm px-6 whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-text.png" alt="UGET" width={90} height={24} className="object-contain opacity-70" />
            <span className="text-white/20 text-xs">© 2025 UGET Technologies</span>
          </div>
          <div className="flex items-center gap-6">
            {["Frontend", "AI & Tech", "Career", "About"].map((l) => (
              <Link key={l} href="#" className="text-white/35 text-xs hover:text-white/70 transition-colors">{l}</Link>
            ))}
            <Link href="/admin" className="text-white/20 text-xs hover:text-white/50 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
