export default function Newsletter() {
  return (
    <section className="py-16 max-w-7xl mx-auto px-6">
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/30 via-[#1E293B] to-[#0F172A]" />
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Decorative orb */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#60A5FA]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#2563EB]/15 blur-3xl pointer-events-none" />

        {/* Border */}
        <div className="absolute inset-0 border border-[#2563EB]/25 rounded-2xl pointer-events-none" />

        <div className="relative z-10 py-16 px-8 md:px-16 text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border border-[#60A5FA]/25 bg-[#2563EB]/10">
            <span className="text-sm">📩</span>
            <span className="text-[#60A5FA] text-xs font-semibold tracking-widest uppercase">Weekly Newsletter</span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Stay Ahead of the{" "}
            <span className="gradient-text">Tech Curve</span>
          </h2>
          <p className="text-white/55 text-base max-w-lg mx-auto mb-10">
            Join 12,000+ learners receiving weekly tutorials, career tips, and the latest opportunities in tech — delivered straight to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="newsletter-input flex-1"
            />
            <button className="btn-primary whitespace-nowrap">Subscribe Free</button>
          </div>

          <p className="text-white/30 text-xs mt-4">No spam, ever. Unsubscribe anytime.</p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex -space-x-2">
              {["A", "K", "T", "F"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-[#0F172A] flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, #2563EB, #60A5FA)`, zIndex: 4 - i }}
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="text-white/50 text-xs">+12,000 subscribers already joined</span>
          </div>
        </div>
      </div>
    </section>
  );
}
