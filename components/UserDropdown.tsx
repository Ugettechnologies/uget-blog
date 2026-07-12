import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getInitials } from "@/lib/types";

// ── Outlined SVG Icons matching premium design language ──
const DashboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const NewStoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ProfileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const AdminIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

interface MenuItemProps {
  href?: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
}

function MenuItem({ href, onClick, icon, label, shortcut, danger }: MenuItemProps) {
  const content = (
    <>
      <span style={{ 
        display: "flex", 
        alignItems: "center", 
        color: danger ? "var(--red)" : "var(--muted)", 
        transition: "color 0.15s" 
      }}>
        {icon}
      </span>
      <span style={{ 
        flex: 1, 
        color: danger ? "var(--red)" : "var(--ink-2)", 
        fontWeight: 500 
      }}>{label}</span>
      {shortcut && (
        <span className="dropdown-shortcut" style={{ 
          fontSize: 9.5, 
          color: "var(--muted-2)", 
          fontFamily: "var(--sans)", 
          fontWeight: 600,
          background: "var(--bg-3)", 
          padding: "2px 6px", 
          borderRadius: 4,
          border: "1px solid var(--border)",
          letterSpacing: "0.03em",
          opacity: 0.8
        }}>
          {shortcut}
        </span>
      )}
    </>
  );

  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    margin: "2px 6px",
    borderRadius: 8,
    fontFamily: "var(--sans)",
    fontSize: 13.5,
    textDecoration: "none",
    background: "transparent",
    border: "none",
    width: "calc(100% - 12px)",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  if (href) {
    return (
      <Link href={href} onClick={onClick} style={style}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = danger ? "rgba(239, 68, 68, 0.08)" : "var(--bg-3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? "rgba(239, 68, 68, 0.08)" : "var(--bg-3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {content}
    </button>
  );
}

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
      position: "absolute", 
      right: 0, 
      top: "calc(100% + 8px)", 
      background: "var(--bg-2)",
      border: "1px solid var(--border)", 
      borderRadius: 12, 
      boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.03)",
      minWidth: 240, 
      zIndex: 200, 
      padding: "6px 0",
      display: "flex",
      flexDirection: "column",
      gap: 1,
      animation: "fadeIn 0.15s ease",
    }}>
      {/* User Header Details */}
      <div style={{ 
        padding: "10px 16px 12px", 
        borderBottom: "1px solid var(--border-2)", 
        display: "flex", 
        alignItems: "center", 
        gap: 10,
        marginBottom: 4
      }}>
        {userProfile?.avatar_url ? (
          <Image 
            src={userProfile.avatar_url} 
            alt="" 
            width={32} 
            height={32} 
            style={{ borderRadius: "50%", objectFit: "cover" }} 
          />
        ) : (
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: "50%", 
            background: "var(--brand-light)", 
            color: "var(--brand)", 
            fontWeight: 700, 
            fontSize: 11, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            {getInitials(userProfile?.full_name || user?.email || "?")}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ 
            fontFamily: "var(--sans)", 
            fontSize: 13.5, 
            fontWeight: 700, 
            color: "var(--black)", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap" 
          }}>
            {userProfile?.full_name || "Writer"}
          </div>
          <div style={{ 
            fontFamily: "var(--sans)", 
            fontSize: 11.5, 
            color: "var(--muted)", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap", 
            marginTop: 1 
          }}>
            {user?.email}
          </div>
        </div>
      </div>

      {/* Main Menu Links */}
      <MenuItem 
        href="/dashboard" 
        onClick={onClose} 
        icon={<DashboardIcon />} 
        label="Dashboard" 
        shortcut="⌘D" 
      />
      <MenuItem 
        href="/write" 
        onClick={onClose} 
        icon={<NewStoryIcon />} 
        label="New story" 
        shortcut="⌘N" 
      />
      <MenuItem 
        href={`/profile/${userProfile?.username || user?.id || ""}`} 
        onClick={onClose} 
        icon={<ProfileIcon />} 
        label="Profile" 
        shortcut="⌘K→P" 
      />
      <MenuItem 
        href="/settings" 
        onClick={onClose} 
        icon={<SettingsIcon />} 
        label="Settings" 
        shortcut="⌘S" 
      />

      {userProfile?.role === "admin" && (
        <>
          <div style={{ height: 1, background: "var(--border-2)", margin: "4px 0" }} />
          <MenuItem 
            href="/admin" 
            onClick={onClose} 
            icon={<AdminIcon />} 
            label="Admin panel" 
            shortcut="⌘A" 
          />
        </>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "var(--border-2)", margin: "4px 0" }} />

      {/* Sign Out Action */}
      <MenuItem 
        onClick={() => { onClose(); onSignOut(); }} 
        icon={<SignOutIcon />} 
        label="Sign out" 
        shortcut="⌥⇧Q" 
        danger 
      />
    </div>
  );
}
