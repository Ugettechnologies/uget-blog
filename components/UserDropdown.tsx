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
    <div 
      className="absolute mt-2 bg-white border border-gray-100 rounded-xl z-50 overflow-hidden" 
      style={{ right: 0, width: 260, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)" }}
    >
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 bg-white">
          {userProfile?.avatar_url ? (
            <Image src={userProfile.avatar_url} alt="" width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full font-bold text-[15px] flex items-center justify-center font-sans bg-violet-100 text-violet-700">
              {getInitials(userProfile?.full_name || user?.email || "?")}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[15px] text-gray-900 truncate font-sans leading-tight mb-0.5">{userProfile?.full_name || "Writer"}</div>
          <div className="text-[13px] text-gray-500 truncate font-sans leading-tight">{user?.email}</div>
        </div>
      </div>
      <div className="p-2">
        <Link href="/write" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors font-sans" style={{ textDecoration: "none" }} onClick={onClose}>
          <span className="text-gray-400 flex items-center justify-center w-5 h-5"><WriteIcon /></span> Write
        </Link>
        <button onClick={() => { onClose(); onOpenNotifs(); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors font-sans">
          <span className="text-gray-400 flex items-center justify-center w-5 h-5"><BellIcon /></span> Notifications
        </button>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors font-sans" style={{ textDecoration: "none" }} onClick={onClose}>
          <span className="text-gray-400 flex items-center justify-center w-5 h-5"><SettingsIcon /></span> Settings
        </Link>
        <button onClick={() => { onClose(); alert("Need help? Please send an email to support@uget.com or check our Help Center."); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors font-sans">
          <span className="text-gray-400 flex items-center justify-center w-5 h-5"><HelpIcon /></span> Help
        </button>
      </div>
      <div className="p-2 border-t border-gray-100 bg-gray-50/30">
        <button onClick={() => { onClose(); onSignOut(); }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold text-red-600 hover:bg-red-50 transition-colors font-sans">
          <span className="text-red-500 flex items-center justify-center w-5 h-5"><SignOutIcon /></span> Sign out
        </button>
      </div>
    </div>
  );
}
