import Image from "next/image";

const footerLinks = {
  "Content": ["Tech Tutorials", "UI/UX Design", "Frontend Dev", "Cybersecurity", "AI & Tech", "Career Guides"],
  "Academy": ["All Courses", "Mentorship", "Certification", "Workshops", "Scholarships"],
  "Company": ["About UGET", "Our Team", "Write for Us", "Advertise", "Privacy Policy"],
};

export default function Footer() {
  return (
    <footer className="bg-[#0A1120] border-t border-white/8 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Image
              src="/logo-purple.png"
              alt="UGET Technologies"
              width={50}
              height={50}
              className="object-contain mb-5"
              style={{ mixBlendMode: "screen" }}
            />
            <p className="text-white/45 text-sm leading-relaxed max-w-xs mb-6">
              UGET Technology Academy empowers the next generation of African tech professionals through world-class education and mentorship.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {[
                { icon: "𝕏", label: "Twitter" },
                { icon: "in", label: "LinkedIn" },
                { icon: "▶", label: "YouTube" },
                { icon: "📷", label: "Instagram" },
              ].map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-[#1E293B] border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-[#60A5FA]/40 hover:bg-[#2563EB]/15 transition-all duration-200 text-sm"
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/45 text-sm hover:text-white/80 transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © 2025 UGET Technology Academy. All rights reserved.
          </p>
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/30 text-xs">All systems operational</span>
          </div>
          <p className="text-white/30 text-xs">
            Built with ❤️ for African tech talent
          </p>
        </div>
      </div>
    </footer>
  );
}
