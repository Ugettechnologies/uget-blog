"use client";
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
  readTime: number;
  views: number;
  createdAt: string;
  featured: boolean;
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
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Simple markdown-to-HTML renderer
function renderContent(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="post-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="post-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="post-h1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="post-code">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="post-blockquote">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="post-li">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="post-ul">$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li class="post-li">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="post-link" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, '</p><p class="post-p">')
    .replace(/^(?!<[hublap])(.+)$/gm, (line) => line.trim() ? line : "")
    .trim();
}

export default function PostDetail({ post, related }: { post: Post; related: Post[] }) {
  const cat = CAT_META[post.category] || { label: post.category, color: "cat-tutorials", emoji: "📝" };
  const tags = post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const htmlContent = renderContent(post.content);

  return (
    <div className="min-h-screen" style={{ background: "#080E1A" }}>
      {/* Nav */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50 h-14 flex items-center">
        <div className="max-w-7xl mx-auto px-5 w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-text.png" alt="UGET" width={90} height={24} className="object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1">
              ← Back
            </Link>
            <Link href="/auth" className="btn-primary text-xs px-4 py-2">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-14">
        <div className="relative h-72 md:h-96 overflow-hidden">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2563EB]/20 via-[#0F172A] to-[#080E1A] flex items-center justify-center">
              <div className="grid-pattern absolute inset-0 opacity-20" />
              <span className="text-9xl opacity-30">{cat.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080E1A] via-[#080E1A]/60 to-transparent" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 -mt-24 relative z-10 pb-16">
        {/* Post header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={`tag-pill ${cat.color}`}>{cat.emoji} {cat.label}</span>
            <span className="text-white/35 text-xs">{post.readTime} min read</span>
            <span className="text-white/35 text-xs">·</span>
            <span className="text-white/35 text-xs">{post.views} views</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">{post.title}</h1>
          <p className="text-white/55 text-lg leading-relaxed mb-6">{post.excerpt}</p>
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center font-bold text-sm text-white">
                {post.author.charAt(0)}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{post.author}</div>
                <div className="text-white/35 text-xs">{formatDate(post.createdAt)}</div>
              </div>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Article body */}
        <article className="post-body">
          <p className="post-p"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-white/8">
            <div className="section-line mb-4" />
            <h2 className="text-xl font-bold text-white mb-6">More in {cat.label}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => {
                const rc = CAT_META[r.category] || { label: r.category, color: "cat-tutorials", emoji: "📝" };
                return (
                  <Link key={r.id} href={`/post/${r.slug}`} className="blog-card group">
                    <div className="blog-card-image" style={{ height: "120px" }}>
                      {r.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverImage} alt={r.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center">
                          <span className="text-2xl">{rc.emoji}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white text-sm font-semibold leading-snug group-hover:text-[#60A5FA] transition-colors line-clamp-2">{r.title}</h3>
                      <div className="text-white/35 text-xs mt-1">{r.readTime} min read</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/" className="btn-outline px-8 py-3">← Back to All Articles</Link>
        </div>
      </div>
    </div>
  );
}
