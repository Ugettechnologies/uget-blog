"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";

// ── Shared premium sidebar navigation ──
// Used by: HomePage, LibraryPage, ProfilePage, DashboardPage, FollowingPage, SettingsPage

// ── Icons (solid/duotone, active-aware) ──
const HomeIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a3 3 0 003 3h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a3 3 0 003-3v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    ) : (
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    )}
  </svg>
);

const LibraryIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
    {active && <path d="M9 7h6M9 11h4" strokeWidth={1.5} />}
  </svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 8a7 7 0 1 1 14 0H5z" />
    ) : (
      <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>
    )}
  </svg>
);

const StoriesIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} />
    <path d="M8 10h8M8 14h5" />
  </svg>
);

const StatsIcon = ({ active }: { active?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="12" width="4" height="9" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.8 : 0} />
    <rect x="9" y="7" width="4" height="14" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.6 : 0} />
    <rect x="16" y="3" width="4" height="18" rx="1" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.9 : 0} />
    {!active && <><path d="M4 12v9M10 7v14M16 3v18" /></>}
  </svg>
);

// ── Link style helper ──
const getLinkStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 11,
  padding: "10px 12px 10px 10px",
  borderRadius: 10,
  textDecoration: "none",
  fontFamily: "var(--sans, 'Inter', sans-serif)",
  fontSize: 14,
  fontWeight: active ? 700 : 500,
  color: active ? "#5b21b6" : "#4b5563",
  background: active ? "#f5f3ff" : "transparent",
  borderLeft: active ? "3px solid #7c3aed" : "3px solid transparent",
  letterSpacing: active ? "-0.01em" : "normal",
  transition: "all 0.15s ease",
  cursor: "pointer",
});

// ── Following list shared section ──
interface FollowingListProps {
  followingProfiles: any[];
  userProfileId?: string;
}

export function SidebarFollowingList({ followingProfiles, userProfileId }: FollowingListProps) {
  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ marginTop: 24, borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
      <Link
        href="/dashboard?tab=followers"
        style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}
      >
        <span style={{ fontSize: 11, fontFamily: "var(--sans)", fontWeight: 700, color: "#9b9b9b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Following
        </span>
        <span style={{ fontSize: 11, fontFamily: "var(--sans)", color: "#7c3aed", fontWeight: 600 }}>
          View all →
        </span>
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {followingProfiles.length === 0 ? (
          <Link
            href="/profile/admin"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "6px 4px", borderRadius: 8, transition: "background 0.15s" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f9fafb")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              UG
            </div>
            <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>UGET Staff</span>
          </Link>
        ) : (
          followingProfiles.map((prof) => (
            <Link
              key={prof.id}
              href={`/profile/${prof.username || prof.id}`}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "6px 4px", borderRadius: 8, transition: "background 0.15s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f9fafb")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", background: "#e5e7eb", flexShrink: 0 }}>
                {prof.avatar_url ? (
                  <Image src={prof.avatar_url} alt="" width={28} height={28} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#ede9fe", color: "#7c3aed", fontWeight: 700, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getInitials(prof.full_name || "?")}
                  </div>
                )}
              </div>
              <span style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prof.full_name}</span>
            </Link>
          ))
        )}

        <Link
          href="/dashboard?tab=followers"
          style={{ textDecoration: "none", marginTop: 8, padding: "6px 4px", display: "flex", alignItems: "center", gap: 8 }}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#9ca3af", fontSize: 14, fontWeight: 600 }}>+</div>
          <div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 12, color: "#6b7280", fontWeight: 500, lineHeight: 1.3 }}>Find writers to follow</div>
            <div style={{ fontFamily: "var(--sans)", fontSize: 11, color: "#7c3aed", fontWeight: 600, marginTop: 1 }}>See suggestions</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── Main shared sidebar nav ──
interface SidebarNavProps {
  /** Which page is currently active: "home" | "library" | "profile" | "stories" | "stats" | "settings" */
  activePage: "home" | "library" | "profile" | "stories" | "stats" | "settings" | string;
  profileHref?: string;
  onItemClick?: () => void;
}

export function SidebarNav({ activePage, profileHref = "/profile", onItemClick }: SidebarNavProps) {
  const items = [
    { key: "home",    href: "/",                        label: "Home",    Icon: HomeIcon },
    { key: "library", href: "/library",                 label: "Library", Icon: LibraryIcon },
    { key: "profile", href: profileHref,                label: "Profile", Icon: ProfileIcon },
    { key: "stories", href: "/dashboard?tab=stories",   label: "Stories", Icon: StoriesIcon },
    { key: "stats",   href: "/dashboard?tab=stats",     label: "Stats",   Icon: StatsIcon },
  ];

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {items.map(({ key, href, label, Icon }) => {
        const active = activePage === key;
        return (
          <Link
            key={key}
            href={href}
            style={getLinkStyle(active)}
            onClick={onItemClick}
            onMouseEnter={(e) => {
              if (!active) Object.assign((e.currentTarget as HTMLElement).style, { background: "#f9fafb", color: "#111827" });
            }}
            onMouseLeave={(e) => {
              if (!active) Object.assign((e.currentTarget as HTMLElement).style, getLinkStyle(false));
            }}
          >
            <span style={{ display: "flex", alignItems: "center", color: active ? "#7c3aed" : "#9ca3af", transition: "color 0.15s" }}>
              <Icon active={active} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export const WriteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="15" y2="18" />
  </svg>
);

export const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const OptionsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const HelpIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const SignOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

