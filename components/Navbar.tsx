"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#" },
    { label: "Tutorials", href: "#" },
    { label: "UI/UX", href: "#" },
    { label: "Frontend", href: "#" },
    { label: "AI & Tech", href: "#" },
    { label: "Career", href: "#" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "nav-blur" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo — small, clean, uses the backgroundless logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-text.png"
            alt="UGET Technologies"
            width={110}
            height={32}
            className="object-contain"
            style={{ filter: "brightness(1.05)" }}
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#60A5FA] group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button className="btn-outline text-sm">Sign In</button>
          <button className="btn-primary text-sm">Enroll Now</button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div
            className="w-5 h-0.5 bg-white mb-1.5 transition-all duration-300 origin-center"
            style={{ transform: menuOpen ? "rotate(45deg) translateY(6px)" : "" }}
          />
          <div
            className="w-5 h-0.5 bg-white mb-1.5 transition-all duration-300"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <div
            className="w-5 h-0.5 bg-white transition-all duration-300 origin-center"
            style={{ transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "" }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden nav-blur border-t border-white/10 px-6 py-5 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
            <button className="btn-outline text-sm w-full">Sign In</button>
            <button className="btn-primary text-sm w-full">Enroll Now</button>
          </div>
        </div>
      )}
    </nav>
  );
}
