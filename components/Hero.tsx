import Image from "next/image";

const stats = [
  { value: "50+", label: "Expert Articles" },
  { value: "12K+", label: "Monthly Readers" },
  { value: "8", label: "Tech Categories" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen hero-gradient grid-pattern flex items-center overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#2563EB]/10 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full bg-[#60A5FA]/8 blur-3xl pointer-events-none" style={{ animationDelay: '3s' }} />
      
      {/* Thin accent line top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div className="animate-fade-up">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10">
              <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-pulse" />
              <span className="text-[#60A5FA] text-xs font-semibold tracking-widest uppercase">UGET Technology Academy</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Learn Tech.{" "}
              <span className="gradient-text">Build Skills.</span>{" "}
              Shape Your{" "}
              <span className="gradient-text">Future.</span>
            </h1>

            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xl font-light">
              Expert-curated tutorials, career guides, and deep dives into UI/UX, Frontend Development, Cybersecurity, and AI — crafted for the next generation of African tech talent.
            </p>

            <div className="flex flex-wrap gap-4 mb-14">
              <button className="btn-primary text-sm px-8 py-3">
                Start Reading →
              </button>
              <button className="btn-outline text-sm px-8 py-3">
                Explore Courses
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-10">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold gradient-text">{s.value}</div>
                  <div className="text-white/40 text-xs font-medium tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Featured article card */}
          <div className="animate-fade-up-delay">
            <div className="relative">
              {/* Main card */}
              <div className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden glow card-hover cursor-pointer">
                {/* Card header image area */}
                <div className="relative h-52 bg-gradient-to-br from-[#2563EB]/30 to-[#0F172A] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 grid-pattern opacity-40" />
                  <div className="relative z-10 text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                    </div>
                    <span className="text-white/50 text-sm">Featured Article</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="featured-badge text-white text-xs">FEATURED</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex gap-2 mb-3">
                    <span className="tag-pill cat-frontend">Frontend</span>
                    <span className="tag-pill">8 min read</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                    The Complete Frontend Roadmap for 2025: From Zero to Job-Ready
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-4">
                    A step-by-step guide to becoming a frontend developer in today's competitive market — covering HTML, CSS, JavaScript, React, and beyond.
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-xs font-bold">U</div>
                      <span className="text-white/50 text-xs">UGET Editorial Team</span>
                    </div>
                    <span className="read-more">Read More →</span>
                  </div>
                </div>
              </div>

              {/* Floating mini cards */}
              <div className="absolute -bottom-5 -left-5 bg-[#1E293B] border border-[#2563EB]/30 rounded-xl p-3 shadow-xl animate-float hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#60A5FA" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">+340%</div>
                    <div className="text-white/40 text-[10px]">Traffic Growth</div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-[#1E293B] border border-[#60A5FA]/20 rounded-xl p-3 shadow-xl hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/10 flex items-center justify-center text-lg">🎓</div>
                  <div>
                    <div className="text-white text-xs font-semibold">500+ Students</div>
                    <div className="text-white/40 text-[10px]">Enrolled This Month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0F172A] to-transparent pointer-events-none" />
    </section>
  );
}
