/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { ClassItem, ExamItem, ProjectItem, StudentProfile, BudgetState } from "../types";
import { BookOpen, Calendar, AlertCircle, CheckCircle2, Clock, MapPin, Award, User, Edit3, ChevronLeft, Heart, Moon, Sun, RefreshCw, Plus, Image as ImageIcon, PhoneCall, X, Bell, Compass, Navigation, Footprints, GraduationCap, Monitor, Building2, Globe, UtensilsCrossed, Home, CreditCard } from "lucide-react";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import ImageCropModal from "./ImageCropModal";
import NotificationSettingsModal from "./NotificationSettingsModal";
import EducationContactModal from "./EducationContactModal";
import OfficialWebsitesModal from "./OfficialWebsitesModal";
import SmartStudentCard from "./SmartStudentCard";
import { getFacultyTheme } from "../data/facultyThemes";
import { FACULTY_BUILDINGS } from "../data/facultyBuildings";
import logoTabriz from "../assets/logo_tabriz.png";
import { safeStorageGetString, safeStorageSet } from "../utils/storageUtils";
import { parseJsDay, isEvenWeekAt } from "../utils/dateUtils";
import { NotificationService } from "../services/NotificationService";
import { syncAndroidWidget } from "../utils/widgetSync";
import { Capacitor } from "@capacitor/core";
import { TabType } from "../types";

interface DashboardProps {
  classes: ClassItem[];
  exams: ExamItem[];
  projects: ProjectItem[];
  profile: StudentProfile | null;
  onNavigate: (tab: TabType) => void;
  onEditProfile: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onUpdateProfile: (profile: StudentProfile) => void;
  budgetState?: BudgetState;
  onOpenBudget?: () => void;
  onAddStudyMinutes?: (examId: string, minutes: number) => void;
  onFocusBuildingOnMap?: (buildingId?: string) => void;
}

export default function Dashboard({ 
  classes, 
  exams, 
  projects, 
  profile, 
  onNavigate, 
  onEditProfile, 
  isDarkMode, 
  onToggleTheme, 
  onUpdateProfile, 
  budgetState, 
  onOpenBudget,
  onAddStudyMinutes,
  onFocusBuildingOnMap
}: DashboardProps) {
  const [unCroppedImage, setUnCroppedImage] = useState<string | null>(null);
  const [showImageCropModal, setShowImageCropModal] = useState(false);
  const [showEducationContactModal, setShowEducationContactModal] = useState(false);
  const [showWebsitesModal, setShowWebsitesModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const facultyTheme = React.useMemo(() => getFacultyTheme(profile?.faculty), [profile?.faculty]);

  const userFacultyBuilding = React.useMemo(() => {
    if (!profile?.faculty) return null;
    const f = profile.faculty.toLowerCase().trim();
    return FACULTY_BUILDINGS.find(b => {
      const bn = b.name.toLowerCase();
      return bn.includes(f) || f.includes(bn.replace("دانشکده", "").trim());
    });
  }, [profile?.faculty]);

  const [nowTick, setNowTick] = useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const todayKey = new Date(nowTick).toDateString();

  const todayPersianFull = React.useMemo(() => {
    try {
      const d = new Date();
      const formatter = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const parts = formatter.formatToParts(d);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";
      return `${getPart("weekday")} ${getPart("day")} ${getPart("month")} ${getPart("year")}`;
    } catch (e) {
      return new Date().toLocaleDateString("fa-IR");
    }
  }, [todayKey]);

  const weekdayName = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long" }).format(new Date());
    } catch (e) { return "جمعه"; }
  }, [todayKey]);

  const todayDateShort = React.useMemo(() => {
    try {
      const d = new Date();
      const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long" });
      const parts = formatter.formatToParts(d);
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";
      let day = getPart("day");
      let month = getPart("month");
      // Ensure Persian digits for comparison
      day = day.replace(/\d/g, (d: string) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
      return `${day} ${month}`;
    } catch (e) { return ""; }
  }, [todayKey]);

  const [weekParityOffset, setWeekParityOffset] = useState<number>(() => {
    const n = parseInt(safeStorageGetString("tabriz_week_parity", "0"), 10);
    return Number.isFinite(n) ? n : 0;
  });

  const toggleWeekParity = () => {
    const newOffset = weekParityOffset === 0 ? 1 : 0;
    setWeekParityOffset(newOffset);
    safeStorageSet("tabriz_week_parity", newOffset.toString());
    if (Capacitor.isNativePlatform()) {
      NotificationService.syncNotifications(classes, exams, projects).catch(() => {});
      syncAndroidWidget(classes, exams).catch(() => {});
    }
  };

  const isEvenWeek = React.useMemo(() => {
    // Anchor: Saturday 2026-09-26 (۴ مهر ۱۴۰۵) is an EVEN week (شروع نیم‌سال تحصیلی).
    // Shared with notification scheduler via dateUtils.isEvenWeekAt.
    return isEvenWeekAt(Date.now(), weekParityOffset);
  }, [weekParityOffset, todayKey]);

  const todayClasses = React.useMemo(() => {
    const currentJsDay = new Date().getDay();

    interface TodayClassSession {
      id: string;
      courseName: string;
      professor?: string;
      location?: string;
      startTime: string;
      endTime: string;
      isSecond?: boolean;
    }

    const sessions: TodayClassSession[] = [];

    classes.forEach(cls => {
      // Primary session
      const day1 = parseJsDay(cls.weekday);
      if (day1 === currentJsDay) {
        const parityOk1 = (cls.weekType === 'even' && isEvenWeek) || (cls.weekType === 'odd' && !isEvenWeek) || (!cls.weekType || cls.weekType === 'all');
        if (parityOk1) {
          sessions.push({
            id: `${cls.id}-s1`,
            courseName: cls.courseName,
            professor: cls.professor,
            location: cls.location,
            startTime: cls.startTime,
            endTime: cls.endTime,
            isSecond: false
          });
        }
      }

      // Second session
      if (cls.hasSecondSession && cls.secondWeekday) {
        const day2 = parseJsDay(cls.secondWeekday);
        if (day2 === currentJsDay) {
          const wType2 = cls.secondWeekType || "even";
          const parityOk2 = (wType2 === 'even' && isEvenWeek) || (wType2 === 'odd' && !isEvenWeek) || (wType2 === 'all');
          if (parityOk2) {
            sessions.push({
              id: `${cls.id}-s2`,
              courseName: cls.courseName,
              professor: cls.professor,
              location: cls.secondLocation || cls.location,
              startTime: cls.secondStartTime || cls.startTime,
              endTime: cls.secondEndTime || cls.endTime,
              isSecond: true
            });
          }
        }
      }
    });

    return sessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [classes, isEvenWeek, todayKey]);

  const todayExams = React.useMemo(() => {
    return exams.filter(ex => ex.date === todayDateShort).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [exams, todayDateShort]);

  const todayProjects = React.useMemo(() => {
    return projects.filter(pr => pr.deadline === todayDateShort && pr.status !== "submitted");
  }, [projects, todayDateShort]);

  const stats = React.useMemo(() => ({
    classesTodayCount: todayClasses.length,
    midtermCount: exams.filter(ex => ex.type === "میان‌ترم" && !ex.completed).length,
    finalCount: exams.filter(ex => ex.type === "پایان‌ترم" && !ex.completed).length,
    projectCount: projects.filter(p => p.status !== "submitted").length
  }), [exams, projects, todayClasses]);

  const handlePickAvatar = async () => {
    if (!profile || !onUpdateProfile) return;
    try {
      const image = await Camera.getPhoto({
        quality: 80, // Optimized for crop without lag
        allowEditing: false, // Turn off OS cropper
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 600
      });

      if (image.dataUrl) {
        setUnCroppedImage(image.dataUrl);
      }
    } catch (e) {
      console.log("User cancelled photo picker or error occurred", e);
    }
  };

  const handleSaveCrop = (croppedImage: string) => {
    if (!profile || !onUpdateProfile) return;
    onUpdateProfile({
      ...profile,
      avatarUrl: croppedImage
    });
    setUnCroppedImage(null);
  };

  const handleRemoveAvatar = () => {
    if (!profile || !onUpdateProfile) return;
    onUpdateProfile({
      ...profile,
      avatarUrl: undefined
    });
  };

  const renderAvatar = () => {
    if (profile?.avatarUrl) {
      return <img src={profile.avatarUrl} alt="پروفایل" className="h-full w-full object-cover" />;
    }
    
    if (profile?.gender === "female") {
      return (
        <div className="h-full w-full rounded-[18px] bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
          <User className="h-5 w-5 text-pink-500" />
        </div>
      );
    }

    return (
      <div className="h-full w-full rounded-[18px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
        <User className="h-5 w-5 text-blue-500" />
      </div>
    );
  };

  // Keep dashboard cards immediately painted at full opacity so the cold start
  // does not execute multiple concurrent JS animation loops under the splash screen.
  const sectionVariants: Variants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  };

  return (
    <div className="px-2.5 sm:px-4 space-y-4 sm:space-y-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] text-right" dir="rtl">
      {/* Smart Student Identity Card with Full-Bleed Atmospheric Faculty Theming */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
        <SmartStudentCard
          profile={profile}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          onOpenNotifications={() => setShowNotificationSettings(true)}
          onEditProfile={onEditProfile}
          onPickAvatar={handlePickAvatar}
          renderAvatar={renderAvatar}
          todayPersian={todayPersianFull}
        />
      </motion.div>

      {/* Grid Stats - Adaptive 2 cols on phones, 4 cols on tablets */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants} className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: "کلاس‌های امروز", val: stats.classesTodayCount, icon: Clock, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100/50 dark:bg-blue-900/30", tab: "schedule" as const },
          { label: "امتحانات میان‌دوره", val: stats.midtermCount, icon: Edit3, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100/50 dark:bg-amber-900/30", tab: "exams" as const },
          { label: "آزمون پایان‌ترم", val: stats.finalCount, icon: BookOpen, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100/50 dark:bg-rose-900/30", tab: "exams" as const },
          { label: "پروژه‌های درسی", val: stats.projectCount, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100/50 dark:bg-emerald-900/30", tab: "projects" as const }
        ].map((item, i) => (
          <div key={i} onClick={() => onNavigate(item.tab)} className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-2.5 sm:gap-3 active:scale-95 transition-all cursor-pointer">
            <div className="flex items-center justify-between">
              <div className={`h-9 w-9 sm:h-10 sm:w-10 ${item.bg} rounded-xl sm:rounded-[14px] inline-flex items-center justify-center shrink-0`}>
                <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${item.color}`} />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono leading-none">{item.val}</p>
            </div>
            <p className="text-[10px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 truncate">{item.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Wallet Widget — Premium Credit Card Design */}
      <motion.div 
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        onClick={onOpenBudget}
        className="relative bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[1.5rem] p-4 sm:p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 overflow-hidden text-white"
      >
        {/* Subtle decorative circles for a credit card feel */}
        
        <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-[0.875rem] sm:rounded-[1rem] bg-white/20 shadow-inner shadow-white/30 border border-white/20 inline-flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-xs sm:text-base leading-tight whitespace-nowrap">کیف پول من</h3>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-100 mt-0.5 leading-tight whitespace-nowrap">مدیریت بودجه و هزینه‌ها</p>
          </div>
        </div>
        <div className="text-left flex flex-col items-end justify-center relative z-10 shrink-0" dir="ltr">
          {budgetState?.monthlyLimit ? (
            <>
              <p className="text-base sm:text-2xl font-black font-sans tracking-tight leading-tight flex items-baseline gap-1 sm:gap-1.5 drop-shadow-sm whitespace-nowrap" dir="ltr">
                <span className="text-[10px] sm:text-xs font-bold text-emerald-200">تومان</span>
                {(budgetState.monthlyLimit - budgetState.expenses.reduce((s, e) => s + e.amount, 0) - (budgetState.savings || 0)).toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-100 font-bold mt-0.5 sm:mt-1 leading-tight flex items-center gap-1" dir="rtl">
                باقیمانده <ChevronLeft className="w-3 h-3 opacity-70" />
              </p>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-white bg-black/20 hover:bg-black/30 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/10 transition-colors">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs font-black whitespace-nowrap">تعیین بودجه</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Campus Map & Navigator Quick Card — Gradient banner (Light & Dark) */}
      <motion.div 
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-sky-200/70 dark:border-sky-900/50 shadow-sm bg-gradient-to-l from-sky-600 via-sky-500 to-cyan-500 dark:from-sky-700 dark:via-sky-600 dark:to-cyan-700 transition-colors"
      >
        {/* Decorative map-grid texture */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        {/* Glowing pin accent */}

        <div className="relative z-10 p-4 sm:p-5">
          {/* Header: Icon + Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 inline-flex items-center justify-center shrink-0 text-white">
              <Navigation className="w-6 h-6 rotate-45" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight leading-tight">
                  نقشه هوشمند دانشگاه
                </h3>
              </div>
              <p className="text-sky-50/90 text-[11px] sm:text-xs font-medium truncate mt-0.5">
                مسیریابی دانشکده‌ها، کتابخانه و اماکن رفاهی
              </p>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate("map")}
              className="flex-1 h-14 sm:h-16 px-6 bg-white text-sky-700 hover:bg-sky-50 rounded-2xl text-base sm:text-lg font-black inline-flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-6 h-6 shrink-0" />
              <span>ورود به نقشه</span>
            </button>

            {userFacultyBuilding ? (
              <button
                type="button"
                onClick={() => {
                  if (onFocusBuildingOnMap) {
                    onFocusBuildingOnMap(userFacultyBuilding.id);
                  } else {
                    onNavigate("map");
                  }
                }}
                className="h-12 sm:h-13 px-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-2xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title={`مسیریابی مستقیم به ${profile?.faculty || 'دانشکده'}`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>دانشکده من</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate("map")}
                className="h-12 sm:h-13 px-4 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-2xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>اماکن دانشگاه</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Daily Class Card */}
      <motion.div 
        custom={4}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-3">
            <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            برنامه امروز ({weekdayName})
          </h3>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-indigo-100 dark:border-slate-600">
               <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                 هفته {isEvenWeek ? "زوج" : "فرد"}
               </span>
               <button onClick={toggleWeekParity} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors shrink-0">
                 <RefreshCw className="h-3 w-3" />
               </button>
            </div>
            <button onClick={() => onNavigate("schedule")} className="h-9 px-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all">مشاهده <ChevronLeft className="h-4 w-4" /></button>
          </div>
        </div>
        
        {/* Mobile Week Parity (visible only on small screens) */}
        <div className="sm:hidden flex items-center justify-between bg-indigo-50 dark:bg-slate-700/50 px-3 py-2 rounded-xl border border-indigo-100 dark:border-slate-600 mb-4">
           <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
             تقویم آموزشی: هفته {isEvenWeek ? "زوج" : "فرد"}
           </span>
           <button onClick={toggleWeekParity} className="h-8 px-2.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 rounded-lg shadow-sm border border-indigo-100 dark:border-slate-600 inline-flex items-center gap-1 text-[11px] font-black transition-all active:scale-95 shrink-0 cursor-pointer" title="تغییر زوج/فرد هفته">
             <RefreshCw className="h-3.5 w-3.5" />
             <span>تغییر</span>
           </button>
        </div>

        {todayClasses.length === 0 && todayExams.length === 0 && todayProjects.length === 0 ? (
          <div className="py-10 px-4 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[1.75rem] border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-black text-slate-600 dark:text-slate-300">امروز برنامه‌ای نداری 🎉</p>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">هیچ کلاس، امتحان یا پروژه‌ای برای امروز ثبت نشده است.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none -mx-2 px-2">
            {todayClasses.map((cls, idx) => (
              <div key={`class-${idx}`} className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 border-r-4 border-r-blue-500 shadow-sm min-w-[170px] shrink-0">
                <div className="flex justify-between items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono shrink-0">{cls.startTime}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {cls.isSecond && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black">جلسه ۲</span>
                    )}
                    <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-black">کلاس</div>
                  </div>
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">{cls.courseName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">{cls.professor || "نامشخص"}</p>
                </div>
              </div>
            ))}
            {todayExams.map((ex, idx) => (
              <div key={`exam-${idx}`} className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 border-r-4 border-r-rose-500 shadow-sm min-w-[170px] shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{ex.time || "نامشخص"}</span>
                  <div className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[9px] font-black">امتحان</div>
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">{ex.courseName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">{ex.type}</p>
                </div>
              </div>
            ))}
            {todayProjects.map((pr, idx) => (
              <div key={`proj-${idx}`} className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 border-r-4 border-r-emerald-500 shadow-sm min-w-[170px] shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 dark:text-white">تحویل امروز</span>
                  <div className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">پروژه</div>
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug mb-1">{pr.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">{pr.courseName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Useful Links */}
      <motion.div 
        custom={5}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="bg-indigo-600 dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 text-white shadow-xl dark:shadow-none border border-transparent dark:border-slate-700 relative overflow-hidden"
      >
        <h3 className="font-black text-base sm:text-lg relative z-10 flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          <Award className="h-6 w-6 sm:h-7 sm:w-7 text-amber-400" />
          سامانه‌های دانشجویی
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
          {[
            { label: "پورتال سما (نمره)", icon: GraduationCap, url: "https://amozesh.tabrizu.ac.ir" },
            { label: "آموزش مجازی جدید", icon: Monitor, url: "https://tulms.tabrizu.ac.ir" },
            { label: "پورتال اصلی دانشگاه", icon: Building2, url: "https://tabrizu.ac.ir" },
            { label: "وبگاه دانشکده‌ها", icon: Globe, action: () => setShowWebsitesModal(true) },
            { label: "رزرو غذا", icon: UtensilsCrossed, url: "https://samad.app" },
            { label: "امور خوابگاه", icon: Home, url: "https://samad.app" },
            { label: "شهریه رفاه", icon: CreditCard, url: "https://refah.swf.ir" },
            { label: "تماس با آموزش", icon: PhoneCall, action: () => setShowEducationContactModal(true) }
          ].map((item, i) => (
            item.url ? (
              <a 
                key={i} 
                href={item.url} 
                target="_blank" 
                rel="noreferrer" 
                className="bg-white/15 hover:bg-white/25 text-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black text-center border border-white/10 transition-all active:scale-95 inline-flex items-center justify-center gap-2 min-h-[48px]"
              >
                <item.icon className="w-4 h-4 shrink-0 text-white/90" />
                <span>{item.label}</span>
              </a>
            ) : (
              <button 
                key={i} 
                type="button" 
                onClick={item.action} 
                className="bg-white/20 hover:bg-white/30 text-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black text-center border border-white/20 transition-all active:scale-95 inline-flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
              >
                <item.icon className="w-4 h-4 shrink-0 text-white/90" />
                <span>{item.label}</span>
              </button>
            )
          ))}
        </div>
      </motion.div>

      {/* Footer Credits */}
      <motion.div 
        custom={6}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="flex flex-col items-center justify-center mt-3 py-4 border-t border-slate-100 dark:border-slate-800/50"
      >
        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 inline-flex items-center justify-center gap-1.5 mb-2">
          <span>برنامه‌نویسی شده با</span>
          <Heart className="h-3 w-3 fill-rose-500 text-rose-500 animate-pulse inline-block" />
          <span>برای دوستان عزیزم</span>
        </p>
        
        <div className="inline-flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <a href="https://t.me/arian13es" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .25.02.36.12.1.08.13.19.14.27-.01.04.01.12 0 .22z" />
            </svg>
            <span>Arian</span>
          </a>
          
          <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700"></div>
          
          <a href="https://daramet.com/arian13es" target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group">
            <span className="flex h-2 w-2 relative self-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>حمایت از من</span>
          </a>
        </div>
        
        <a href="https://t.me/daneshjooyartbz" target="_blank" rel="noreferrer" className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors uppercase group">
          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .25.02.36.12.1.08.13.19.14.27-.01.04.01.12 0 .22z" />
          </svg>
          <span>Community Channel</span>
        </a>
      </motion.div>

      {unCroppedImage && (
        <ImageCropModal 
          imageSrc={unCroppedImage} 
          onClose={() => setUnCroppedImage(null)} 
          onSave={handleSaveCrop}
          hasExistingAvatar={!!profile?.avatarUrl}
          onRemove={handleRemoveAvatar}
        />
      )}

      {/* Contact Education Office Modal */}
      <AnimatePresence>
        {showEducationContactModal && (
          <EducationContactModal 
            userFaculty={profile?.faculty} 
            onClose={() => setShowEducationContactModal(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWebsitesModal && (
          <OfficialWebsitesModal 
            userFaculty={profile?.faculty}
            onClose={() => setShowWebsitesModal(false)} 
            onNavigateToMap={(bId) => {
              setShowWebsitesModal(false);
              onFocusBuildingOnMap?.(bId);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotificationSettings && (
          <NotificationSettingsModal onClose={() => setShowNotificationSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
