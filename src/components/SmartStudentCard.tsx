import React, { useState } from "react";
import { StudentProfile } from "../types";
import { Bell, Sun, Moon, Edit3, Plus, Check, Copy, Wifi } from "lucide-react";
import logoTabriz from "../assets/logo_tabriz.png";
import FacultyArtwork from "./FacultyArtwork";
import { getFacultyTheme } from "../data/facultyThemes";

interface SmartStudentCardProps {
  profile: StudentProfile | null;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenNotifications: () => void;
  onEditProfile: () => void;
  onPickAvatar: () => void;
  renderAvatar: () => React.ReactNode;
  todayPersian: string;
}

/**
 * Realistic Metallic EMV Smart Chip Graphic
 */
const SmartChipGraphic: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => (
  <div className="relative w-11 h-8 sm:w-12 sm:h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-300 to-yellow-500 dark:from-amber-400 dark:via-yellow-500 dark:to-amber-600 p-[1.5px] shadow-md shrink-0 border border-amber-400/50">
    <div className="w-full h-full rounded-[6px] bg-gradient-to-br from-amber-300 via-amber-200 to-yellow-400 dark:from-amber-500 dark:via-amber-400 dark:to-yellow-600 flex flex-col justify-between p-1 overflow-hidden relative">
      <div className="absolute inset-0 border border-amber-600/30 rounded-[5px]" />
      <div className="h-[1px] w-full bg-amber-700/40 my-auto" />
      <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-amber-700/40" />
      <div className="absolute top-0 bottom-0 right-1/3 w-[1px] bg-amber-700/40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-2.5 rounded-[3px] border border-amber-700/40 bg-amber-300/30" />
    </div>
  </div>
);

export default function SmartStudentCard({
  profile,
  isDarkMode,
  onToggleTheme,
  onOpenNotifications,
  onEditProfile,
  onPickAvatar,
  renderAvatar,
  todayPersian
}: SmartStudentCardProps) {
  const facultyTheme = getFacultyTheme(profile?.faculty);
  const [copied, setCopied] = useState(false);

  // Format student ID like a smart card number: 1403 • 514 • 1010
  const formatCardNumber = (id?: string) => {
    if (!id) return "--- • --- • ---";
    const clean = id.replace(/\s+/g, "");
    if (clean.length >= 8) {
      return `${clean.slice(0, 4)} • ${clean.slice(4, 7)} • ${clean.slice(7)}`;
    }
    return clean;
  };

  const handleCopyId = () => {
    if (!profile?.studentId) return;
    navigator.clipboard?.writeText(profile.studentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full rounded-[2.25rem] sm:rounded-[2.75rem] overflow-hidden shadow-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 transition-all duration-300 select-none">
      {/* 1. Full-Bleed Atmospheric Faculty Vector Artwork */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-95 dark:opacity-85">
        <FacultyArtwork facultyName={profile?.faculty} isDarkMode={isDarkMode} />
      </div>

      {/* 2. Glassmorphic Gradient Wash - Vertical */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent dark:from-slate-900/90 dark:via-slate-900/50 dark:to-slate-900/20 pointer-events-none" />

      {/* 3. Horizontal Protective Dissolve for Student Identity & Readability */}
      <div className="absolute inset-y-0 right-0 w-[58%] sm:w-[52%] bg-gradient-to-l from-white via-white/90 to-transparent dark:from-slate-900 dark:via-slate-900/90 dark:to-transparent pointer-events-none z-0" />
      {/* Left Protective Dissolve for EMV Smart Chip & NFC Badge */}
      <div className="absolute inset-y-0 left-0 w-[42%] sm:w-[35%] bg-gradient-to-r from-white/95 via-white/70 to-transparent dark:from-slate-900/95 dark:via-slate-900/70 dark:to-transparent pointer-events-none z-0" />

      {/* 4. Card Content Layer */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-5" dir="rtl">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* University Identity & Seal with Minimal Persian Date */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-white/95 dark:bg-slate-800/95 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-sm">
            <img src={logoTabriz} alt="لوگوی دانشگاه تبریز" className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0 dark:brightness-150" />
            <div className="flex flex-col text-right">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-tight">دانشگاه تبریز</span>
              {todayPersian && (
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  {todayPersian}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions (Notifications & Theme Switcher) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenNotifications}
              title="تنظیمات اعلان‌ها"
              className="h-9 w-9 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 rounded-xl sm:rounded-2xl inline-flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 shadow-sm active:scale-95 transition-all"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={onToggleTheme}
              title="تغییر حالت شب و روز"
              className="h-9 w-9 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-700 rounded-xl sm:rounded-2xl inline-flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 shadow-sm active:scale-95 transition-all"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Middle Row: Student Avatar + Details & Smart Chip */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {/* Avatar + Student Details */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Avatar with Status Ring */}
            <div className="relative shrink-0">
              <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-[1.35rem] sm:rounded-[1.6rem] bg-gradient-to-br ${facultyTheme.avatarRing} p-[2.5px] shadow-lg shrink-0 border-2 border-white dark:border-slate-800`}>
                <div className="h-full w-full bg-white dark:bg-slate-900 rounded-[16px] sm:rounded-[20px] flex items-center justify-center overflow-hidden">
                  {renderAvatar()}
                </div>
              </div>
              <button
                onClick={onPickAvatar}
                title="تغییر عکس پروفایل"
                className={`absolute -bottom-1 -right-1 h-7 w-7 sm:h-8 sm:w-8 bg-white dark:bg-slate-800 rounded-full inline-flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700 ${facultyTheme.accentText} hover:scale-110 active:scale-95 transition-transform cursor-pointer`}
                aria-label="تغییر عکس پروفایل"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Student Name & Card Number with High Contrast & Aura Protection */}
            <div className="min-w-0 text-right">
              <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white leading-tight truncate">
                  {profile ? `${profile.firstName} ${profile.lastName}` : "دانشجوی گرامی"}
                </h2>
                <span className="flex h-2 w-2 relative shrink-0" title="وضعیت فعال">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>

              {/* Student Card Number with Copy Action */}
              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group cursor-pointer whitespace-nowrap"
                title="برای کپی شماره دانشجویی کلیک کنید"
              >
                <span className="text-[10px] sm:text-xs font-black font-mono tracking-wide sm:tracking-wider text-slate-800 dark:text-slate-200" dir="ltr">
                  {formatCardNumber(profile?.studentId)}
                </span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-50 group-hover:opacity-100 transition-opacity shrink-0 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Smart Chip & NFC Graphic */}
          <div className="flex flex-col items-end gap-1.5 shrink-0 pl-1">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-slate-400 dark:text-slate-500 rotate-90 shrink-0 opacity-80" />
              <SmartChipGraphic isDarkMode={isDarkMode} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-widest uppercase">SMART PASS</span>
          </div>
        </div>

        {/* Bottom Credentials Pill: Faculty, Major, and Edit Button */}
        <div className="flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-800/95 rounded-2xl p-3 sm:p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black truncate">
              <span className={`h-1.5 w-1.5 rounded-full ${facultyTheme.accentText} bg-current shrink-0 self-center`} />
              <span className="text-slate-500 dark:text-slate-400">دانشکده:</span>
              <span className="text-slate-900 dark:text-white font-black truncate">{profile?.faculty || "تعیین نشده"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 self-center" />
              <span className="text-slate-500 dark:text-slate-400">رشته:</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold truncate">{profile?.major || "در حال تکمیل..."}</span>
            </div>
          </div>

          {/* Edit Profile Action */}
          <button
            onClick={onEditProfile}
            className="h-9 w-9 sm:h-10 sm:w-10 bg-slate-100/80 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl sm:rounded-2xl inline-flex items-center justify-center transition-all border border-slate-200/70 dark:border-slate-600/70 active:scale-95 shadow-sm shrink-0"
            title="ویرایش مشخصات دانشجویی"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
