const categories = [
  {
    icon: "⚡",
    label: "Tech Tutorials",
    count: "24 articles",
    color: "cat-tutorials",
    desc: "Step-by-step guides",
  },
  {
    icon: "🎨",
    label: "UI/UX Design",
    count: "18 articles",
    color: "cat-uiux",
    desc: "Design systems & tools",
  },
  {
    icon: "💻",
    label: "Frontend Dev",
    count: "31 articles",
    color: "cat-frontend",
    desc: "HTML, CSS, JS & React",
  },
  {
    icon: "🔐",
    label: "Cybersecurity",
    count: "12 articles",
    color: "cat-cyber",
    desc: "Security & hacking basics",
  },
  {
    icon: "🤖",
    label: "AI & Emerging Tech",
    count: "20 articles",
    color: "cat-ai",
    desc: "Machine learning & AI tools",
  },
  {
    icon: "🚀",
    label: "Career Guides",
    count: "16 articles",
    color: "cat-career",
    desc: "Jobs, freelance & growth",
  },
];

export default function Categories() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-6">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="section-line mb-4" />
          <h2 className="text-3xl font-bold text-white">Browse by Category</h2>
          <p className="text-white/50 text-sm mt-2">Find content that matches your learning path</p>
        </div>
        <button className="read-more hidden md:inline-flex">All Categories →</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.label}
            className="bg-[#1E293B] border border-white/8 rounded-xl p-5 cursor-pointer card-hover group text-center"
          >
            <div className="text-3xl mb-3">{cat.icon}</div>
            <div className={`tag-pill ${cat.color} mb-2 inline-block`}>
              {cat.count}
            </div>
            <div className="text-white font-semibold text-sm mt-2 mb-1 leading-tight">{cat.label}</div>
            <div className="text-white/40 text-xs">{cat.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
