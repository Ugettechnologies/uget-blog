import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getInitials } from "@/lib/types";
import { WriteIcon, BellIcon, SettingsIcon, HelpIcon, SignOutIcon } from "@/components/SidebarNav";

interface UserDropdownProps {
  isOpen: boolean;
  user: any;
  userProfile: any;
  onClose: () => void;
  onOpenNotifs: () => void;
  onSignOut: () => void;
}

export function UserDropdown({ isOpen, user, userProfile, onClose, onOpenNotifs, onSignOut }: UserDropdownProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--bg-2)",
      border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)",
      minWidth: 220, zIndex: 200, overflow: "hidden", animation: "fadeIn 0.15s ease",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-2)" }}>
        <div style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: "var(--black)" }}>{userProfile?.full_name || "Writer"}</div>
        <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--muted-2)", marginTop: 2 }}>{user?.email}</div>
      </div>
      {[
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/write", label: "New story", icon: "✍️" },
        { href: `/profile/${userProfile?.username || user?.id || ""}`, label: "Profile", icon: "👤" },
        { href: "/settings", label: "Settings", icon: "⚙️" },
      ].map((item) => (
        <Link key={item.href} href={item.href} onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
            fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
          <span>{item.icon}</span>{item.label}
        </Link>
      ))}
      {userProfile?.role === "admin" && (
        <Link href="/admin" onClick={onClose}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
            fontFamily: "var(--sans)", fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
          <span>🛠️</span>Admin panel
        </Link>
      )}
      <div style={{ borderTop: "1px solid var(--border-2)" }} />
      <button onClick={() => { onClose(); onSignOut(); }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
          fontFamily: "var(--sans)", fontSize: 14, color: "var(--muted)", cursor: "pointer",
          border: "none", background: "none", textAlign: "left" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-3)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
        <span>🚪</span>Sign out
      </button>
    </div>
  );
}
