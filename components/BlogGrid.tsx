const posts = [
  {
    id: 1,
    category: "UI/UX Design",
    catClass: "cat-uiux",
    title: "10 Figma Tricks Every UI Designer Should Know in 2025",
    excerpt: "Master these advanced Figma techniques to design faster, collaborate better, and impress your clients every time.",
    author: "Amara Johnson",
    readTime: "6 min read",
    date: "May 20, 2025",
    emoji: "🎨",
    featured: false,
  },
  {
    id: 2,
    category: "Cybersecurity",
    catClass: "cat-cyber",
    title: "How Hackers Think: A Beginner's Guide to Ethical Hacking",
    excerpt: "Understanding the attacker's mindset is the first step to building impenetrable systems. Here's where to start.",
    author: "Kelechi Obi",
    readTime: "9 min read",
    date: "May 17, 2025",
    emoji: "🔐",
    featured: false,
  },
  {
    id: 3,
    category: "AI & Tech",
    catClass: "cat-ai",
    title: "ChatGPT vs Claude vs Gemini: Which AI Should You Use for Coding?",
    excerpt: "We tested all three major AI assistants on 20 real-world coding tasks. Here are the surprising results.",
    author: "UGET Editorial",
    readTime: "11 min read",
    date: "May 14, 2025",
    emoji: "🤖",
    featured: true,
  },
  {
    id: 4,
    category: "Frontend Dev",
    catClass: "cat-frontend",
    title: "Mastering CSS Grid in 2025: Layouts That Actually Work",
    excerpt: "Stop fighting with flexbox for every layout. CSS Grid is your missing superpower — and it's easier than you think.",
    author: "Tunde Adeyemi",
    readTime: "7 min read",
    date: "May 11, 2025",
    emoji: "💻",
    featured: false,
  },
  {
    id: 5,
    category: "Career Guides",
    catClass: "cat-career",
    title: "How to Land Your First Tech Job with No Experience",
    excerpt: "A practical, no-BS guide to breaking into tech in Nigeria and beyond — portfolio tips, networking, and more.",
    author: "Fatima Bello",
    readTime: "10 min read",
    date: "May 8, 2025",
    emoji: "🚀",
    featured: false,
  },
  {
    id: 6,
    category: "Tutorials",
    catClass: "cat-tutorials",
    title: "Build a Full-Stack App with Next.js 15 & Supabase",
    excerpt: "From zero to deployed in one weekend. This step-by-step tutorial covers auth, database, and hosting.",
    author: "Samuel Eze",
    readTime: "14 min read",
    date: "May 5, 2025",
    emoji: "⚡",
    featured: false,
  },
];

function PostCard({ post }: { post: typeof posts[0] }) {
  return (
    <article className="bg-[#1E293B] border border-white/8 rounded-2xl overflow-hidden card-hover cursor-pointer group">
      {/* Image area */}
      <div className="h-44 bg-gradient-to-br from-[#0F172A] to-[#1E293B] relative flex items-center justify-center overflow-hidden">
        <div className="grid-pattern absolute inset-0 opacity-30" />
        <span className="text-5xl relative z-10 group-hover:scale-110 transition-transform duration-300">{post.emoji}</span>
        {post.featured && (
          <div className="absolute top-3 left-3">
            <span className="featured-badge text-white text-[10px]">TRENDING</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`tag-pill ${post.catClass}`}>{post.category}</span>
          <span className="text-white/30 text-xs">{post.readTime}</span>
        </div>

        <h3 className="text-white font-semibold text-base leading-snug mb-2 group-hover:text-[#60A5FA] transition-colors duration-200 line-clamp-2">
          {post.title}
        </h3>

        <p className="text-white/45 text-sm leading-relaxed mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-[10px] font-bold text-white">
              {post.author.charAt(0)}
            </div>
            <div>
              <div className="text-white/60 text-xs font-medium">{post.author}</div>
              <div className="text-white/30 text-[10px]">{post.date}</div>
            </div>
          </div>
          <span className="read-more text-[11px]">Read →</span>
        </div>
      </div>
    </article>
  );
}

export default function BlogGrid() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-6">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="section-line mb-4" />
          <h2 className="text-3xl font-bold text-white">Latest Articles</h2>
          <p className="text-white/50 text-sm mt-2">Fresh content published every week</p>
        </div>
        <div className="hidden md:flex gap-2">
          {["All", "Tutorials", "Design", "Career"].map((f) => (
            <button
              key={f}
              className={`text-xs font-medium px-4 py-1.5 rounded-full border transition-all duration-200 ${
                f === "All"
                  ? "bg-[#2563EB] border-[#2563EB] text-white"
                  : "border-white/15 text-white/50 hover:border-[#60A5FA]/40 hover:text-white/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div className="text-center mt-12">
        <button className="btn-outline px-10 py-3">Load More Articles</button>
      </div>
    </section>
  );
}
