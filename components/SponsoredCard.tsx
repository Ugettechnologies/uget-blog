"use client";

interface SponsoredCardProps {
  variant?: "feed" | "sidebar" | "banner";
}

const SPONSORED_OFFERS = [
  {
    title: "🔥 Discover Top Daily Deals & Trending Stories",
    description: "Explore curated exclusive offers, viral stories, and special rewards today.",
    tag: "Sponsored",
    link: "https://omg10.com/4/11623443",
    cta: "Check It Out",
  },
  {
    title: "🎁 Exclusive Member Offers & Bonus Content",
    description: "Claim special access to trending tools, rewards, and featured partner content.",
    tag: "Partner Deal",
    link: "https://omg10.com/4/11623466",
    cta: "Claim Now",
  },
];

export default function SponsoredCard({ variant = "feed" }: SponsoredCardProps) {
  // Pick random offer
  const offer = SPONSORED_OFFERS[Math.floor(Math.random() * SPONSORED_OFFERS.length)];

  if (variant === "sidebar") {
    return (
      <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-purple-900/30 to-amber-900/20 border border-purple-500/30 text-zinc-100 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
            {offer.tag}
          </span>
          <span className="text-[10px] text-zinc-400">Ad</span>
        </div>
        <h4 className="text-sm font-semibold text-white leading-snug mb-1">{offer.title}</h4>
        <p className="text-xs text-zinc-300 mb-3">{offer.description}</p>
        <a
          href={offer.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full py-1.5 px-3 text-xs font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-lg transition-all shadow-sm"
        >
          {offer.cta} &rarr;
        </a>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="my-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-zinc-900 border border-purple-500/40 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-block text-[11px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
            {offer.tag}
          </div>
          <h3 className="text-base font-bold text-white">{offer.title}</h3>
          <p className="text-xs text-zinc-300 max-w-xl">{offer.description}</p>
        </div>
        <a
          href={offer.link}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-5 py-2.5 text-xs font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-xl transition-all shadow-lg transform hover:-translate-y-0.5"
        >
          {offer.cta} &rarr;
        </a>
      </div>
    );
  }

  // Feed card variant
  return (
    <article className="post-card border border-purple-500/30 bg-purple-950/10 hover:bg-purple-950/20 transition-all rounded-xl p-4 my-3">
      <div className="post-card-content w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
            {offer.tag}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">Sponsored</span>
        </div>
        <a
          href={offer.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
          style={{ textDecoration: "none" }}
        >
          <h3 className="post-card-title text-base font-bold text-zinc-100 group-hover:text-purple-300 transition-colors">
            {offer.title}
          </h3>
          <p className="post-card-excerpt text-xs text-zinc-400 mt-1">{offer.description}</p>
        </a>
        <div className="mt-3 flex items-center justify-between">
          <a
            href={offer.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>{offer.cta}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
