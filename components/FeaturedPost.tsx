export default function FeaturedPost() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-6">
      <div className="section-line mb-4" />
      <h2 className="text-3xl font-bold text-white mb-10">Editor's Pick</h2>

      <div className="bg-[#1E293B] border border-[#2563EB]/20 rounded-2xl overflow-hidden grid lg:grid-cols-5 gap-0 card-hover cursor-pointer group glow">
        {/* Left: Image area */}
        <div className="lg:col-span-2 relative min-h-72 bg-gradient-to-br from-[#2563EB]/25 via-[#0F172A] to-[#1E293B] flex items-center justify-center overflow-hidden">
          <div className="grid-pattern absolute inset-0 opacity-40" />
          <div className="relative z-10 text-center p-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center mx-auto mb-4 shadow-2xl group-hover:scale-105 transition-transform duration-300">
              <span className="text-4xl">🚀</span>
            </div>
            <div className="flex justify-center gap-2 flex-wrap">
              <span className="tag-pill cat-career">Career</span>
              <span className="tag-pill">12 min read</span>
            </div>
          </div>

          {/* Accent line */}
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#2563EB]/40 to-transparent" />
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-3 p-10 flex flex-col justify-center">
          <span className="featured-badge text-white text-xs inline-block mb-5 self-start">EDITOR'S PICK</span>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4 group-hover:text-[#60A5FA] transition-colors duration-300">
            From Bootcamp to ₦500K/Month: A Nigerian Developer's Journey
          </h2>

          <p className="text-white/55 text-base leading-relaxed mb-8 max-w-xl">
            Chidi went from selling electronics in Onitsha to earning over half a million naira monthly as a remote frontend developer. Here's the unfiltered story of how he did it — and how you can too.
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center font-bold text-sm text-white">
                C
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Chidi Okonkwo</div>
                <div className="text-white/40 text-xs">May 22, 2025 · Verified Story</div>
              </div>
            </div>

            <button className="btn-primary text-sm ml-auto">
              Read Full Story →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
