const trending = [
  { num: "01", title: "How to Build a Portfolio That Gets You Hired", category: "Career" },
  { num: "02", title: "Tailwind CSS v4: Everything You Need to Know", category: "Frontend" },
  { num: "03", title: "The Best Free Tools for UI/UX Designers in 2025", category: "UI/UX" },
  { num: "04", title: "Freelancing in Tech: Getting Your First ₦50K Client", category: "Career" },
  { num: "05", title: "Understanding Responsive Design Principles", category: "Frontend" },
];

const courses = [
  { icon: "🎨", title: "UI/UX Design Bootcamp", students: "2.4k", weeks: "8 weeks" },
  { icon: "💻", title: "Frontend Development", students: "3.1k", weeks: "12 weeks" },
  { icon: "🤖", title: "AI & Prompt Engineering", students: "1.8k", weeks: "6 weeks" },
];

export default function Sidebar() {
  return (
    <aside className="space-y-8">
      {/* Trending */}
      <div className="bg-[#1E293B] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="section-line w-6" style={{ width: '24px' }} />
          <h3 className="text-white font-bold text-base">Trending Now</h3>
        </div>
        <div className="space-y-5">
          {trending.map((item) => (
            <div key={item.num} className="flex gap-3 cursor-pointer group">
              <span className="text-[#2563EB]/50 font-bold text-lg leading-none mt-0.5 shrink-0">{item.num}</span>
              <div>
                <p className="text-white/75 text-sm font-medium leading-snug group-hover:text-white transition-colors duration-200 line-clamp-2">
                  {item.title}
                </p>
                <span className="text-[#60A5FA] text-xs mt-1 inline-block">{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Courses CTA */}
      <div className="bg-[#1E293B] border border-white/8 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="section-line w-6" style={{ width: '24px' }} />
          <h3 className="text-white font-bold text-base">Popular Courses</h3>
        </div>
        <div className="space-y-4">
          {courses.map((c) => (
            <div key={c.title} className="flex items-start gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-[#2563EB]/15 flex items-center justify-center text-lg shrink-0">
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium leading-tight group-hover:text-[#60A5FA] transition-colors duration-200">
                  {c.title}
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-white/35 text-xs">{c.students} students</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/35 text-xs">{c.weeks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-primary w-full text-sm mt-6">
          View All Courses →
        </button>
      </div>

      {/* Tags cloud */}
      <div className="bg-[#1E293B] border border-white/8 rounded-2xl p-6">
        <h3 className="text-white font-bold text-base mb-4">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {["React", "CSS", "JavaScript", "Figma", "TypeScript", "Next.js", "AI", "Career", "Python", "API", "Git", "Portfolio"].map((tag) => (
            <span key={tag} className="tag-pill cursor-pointer hover:bg-[#2563EB]/25 transition-colors duration-200">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
