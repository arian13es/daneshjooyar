/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ClassItem, StudentProfile } from "../types";
import { SHAMSI_WEEKDAYS } from "../data/initialData";
import { Plus, Trash, Clock, MapPin, Calendar as CalendarIcon, Edit3, Edit, AlertCircle, User, Image as ImageIcon, Check, X, Palette, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CustomSelect } from "./CustomSelect";
import { CAMPUS_BUILDINGS } from "../data/campusGisData";
import { FACULTY_BUILDINGS } from "../data/facultyBuildings";
import ScheduleExportModal from "./ScheduleExportModal";
import { getCourseColor, COURSE_PALETTES } from "../utils/courseColors";

function resolveCampusBuildingId(location?: string): string | undefined {
  if (!location || !location.trim()) return undefined;
  const loc = location.trim().toLowerCase();
  
  // 1. Direct match with faculty buildings
  const matchedFaculty = FACULTY_BUILDINGS.find(b => {
    const bn = b.name.toLowerCase();
    const shortName = bn.replace("دانشکده", "").trim();
    return loc.includes(shortName) || bn.includes(loc);
  });
  if (matchedFaculty) return matchedFaculty.id;

  // 2. Match with general campus buildings
  const matchedBldg = CAMPUS_BUILDINGS.find(b => {
    const bn = b.name.toLowerCase();
    return loc.includes(bn) || bn.includes(loc);
  });
  if (matchedBldg) return matchedBldg.id;

  return undefined;
}

interface ScheduleGridProps {
  classes: ClassItem[];
  profile?: StudentProfile | null;
  onAddClass: (newCls: Omit<ClassItem, "id">) => void;
  onEditClass: (id: string, updatedCls: Omit<ClassItem, "id">) => void;
  onDeleteClass: (id: string) => void;
  onClearSchedule: () => void;
  onOpenProfile?: (cls: ClassItem) => void;
  onFocusBuildingOnMap?: (buildingId?: string) => void;
}

const TIME_OPTIONS = Array.from({ length: 21 }, (_, i) => { const h = Math.floor(i / 2) + 8; const m = i % 2 === 0 ? "00" : "30"; return `${h < 10 ? '0' + h : h}:${m}`; });

export default function ScheduleGrid({ classes, profile, onAddClass, onEditClass, onDeleteClass, onClearSchedule, onOpenProfile, onFocusBuildingOnMap }: ScheduleGridProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [courseName, setCourseName] = useState("");
  const [professor, setProfessor] = useState("");
  const [formDay, setFormDay] = useState("شنبه");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [weekType, setWeekType] = useState<"all" | "even" | "odd">("all");
  const [formColor, setFormColor] = useState<string>("");
  
  // Second Session State
  const [hasSecondSession, setHasSecondSession] = useState<boolean>(false);
  const [secondDay, setSecondDay] = useState<string>("دوشنبه");
  const [secondStartTime, setSecondStartTime] = useState<string>("08:00");
  const [secondEndTime, setSecondEndTime] = useState<string>("10:00");
  const [secondWeekType, setSecondWeekType] = useState<"all" | "even" | "odd">("even");
  const [secondLocation, setSecondLocation] = useState<string>("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const normalizeDay = (s: string) => (s || "").replace(/[\s‌]/g, "");

  const sessionsOverlap = (
    dayA: string,
    startA: string,
    endA: string,
    weekA: "all" | "even" | "odd",
    dayB: string,
    startB: string,
    endB: string,
    weekB: "all" | "even" | "odd"
  ): boolean => {
    if (normalizeDay(dayA) !== normalizeDay(dayB)) return false;
    const weeksCompatible =
      weekA === "all" || weekB === "all" || weekA === weekB;
    if (!weeksCompatible) return false;
    return startA < endB && startB < endA;
  };

  const findConflict = (
    payload: {
      weekday: string;
      startTime: string;
      endTime: string;
      weekType: "all" | "even" | "odd";
      hasSecondSession: boolean;
      secondWeekday?: string;
      secondStartTime?: string;
      secondEndTime?: string;
      secondWeekType?: "all" | "even" | "odd";
    },
    excludeId?: string
  ): string | null => {
    for (const existing of classes) {
      if (excludeId && existing.id === excludeId) continue;

      const existingPairs: Array<[string, string, string, "all" | "even" | "odd"]> = [
        [existing.weekday, existing.startTime, existing.endTime, existing.weekType || "all"],
      ];
      if (existing.hasSecondSession && existing.secondWeekday) {
        existingPairs.push([
          existing.secondWeekday,
          existing.secondStartTime || existing.startTime,
          existing.secondEndTime || existing.endTime,
          existing.secondWeekType || "all",
        ]);
      }

      const newPairs: Array<[string, string, string, "all" | "even" | "odd"]> = [
        [payload.weekday, payload.startTime, payload.endTime, payload.weekType],
      ];
      if (payload.hasSecondSession && payload.secondWeekday) {
        newPairs.push([
          payload.secondWeekday,
          payload.secondStartTime || payload.startTime,
          payload.secondEndTime || payload.endTime,
          payload.secondWeekType || "all",
        ]);
      }

      for (const [d1, s1, e1, w1] of newPairs) {
        for (const [d2, s2, e2, w2] of existingPairs) {
          if (sessionsOverlap(d1, s1, e1, w1, d2, s2, e2, w2)) {
            return `زمان «${existing.courseName}» با این کلاس تداخل دارد.`;
          }
        }
      }
    }
    return null;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    if (startTime >= endTime) {
      setFormError("ساعت پایان کلاس باید بعد از ساعت شروع باشد.");
      return;
    }
    if (hasSecondSession && secondStartTime >= secondEndTime) {
      setFormError("ساعت پایان جلسه دوم باید بعد از ساعت شروع باشد.");
      return;
    }

    const classPayload = {
      courseName,
      professor,
      weekday: formDay,
      startTime,
      endTime,
      location,
      weekType,
      color: formColor || undefined,
      hasSecondSession,
      secondWeekday: hasSecondSession ? secondDay : undefined,
      secondStartTime: hasSecondSession ? secondStartTime : undefined,
      secondEndTime: hasSecondSession ? secondEndTime : undefined,
      secondWeekType: hasSecondSession ? secondWeekType : undefined,
      secondLocation: hasSecondSession ? secondLocation : undefined
    };

    const conflict = findConflict(
      {
        weekday: formDay,
        startTime,
        endTime,
        weekType,
        hasSecondSession,
        secondWeekday: hasSecondSession ? secondDay : undefined,
        secondStartTime: hasSecondSession ? secondStartTime : undefined,
        secondEndTime: hasSecondSession ? secondEndTime : undefined,
        secondWeekType: hasSecondSession ? secondWeekType : undefined,
      },
      editingId ?? undefined
    );
    if (conflict) {
      setFormError(conflict);
      return;
    }
    setFormError(null);

    if (editingId) {
      onEditClass(editingId, classPayload);
    } else {
      onAddClass(classPayload);
    }
    closeModal();
  };

  const openEditModal = (cls: ClassItem) => {
    setEditingId(cls.id);
    setCourseName(cls.courseName);
    setProfessor(cls.professor || "");
    setFormDay(cls.weekday);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setLocation(cls.location || "");
    setWeekType(cls.weekType || "all");
    setFormColor(cls.color || "");

    setHasSecondSession(!!cls.hasSecondSession);
    setSecondDay(cls.secondWeekday || "دوشنبه");
    setSecondStartTime(cls.secondStartTime || "08:00");
    setSecondEndTime(cls.secondEndTime || "10:00");
    setSecondWeekType(cls.secondWeekType || "even");
    setSecondLocation(cls.secondLocation || "");

    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setCourseName(""); setProfessor(""); setLocation("");
    setFormDay("شنبه");
    setStartTime("08:00"); setEndTime("10:00");
    setWeekType("all");
    setFormColor("");

    setHasSecondSession(false);
    setSecondDay("دوشنبه");
    setSecondStartTime("08:00");
    setSecondEndTime("10:00");
    setSecondWeekType("even");
    setSecondLocation("");

    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormError(null);
    setTimeout(() => {
      setEditingId(null);
      setCourseName(""); setProfessor(""); setLocation("");
      setWeekType("all");
      setFormColor("");
      setHasSecondSession(false);
      setSecondDay("دوشنبه");
      setSecondStartTime("08:00");
      setSecondEndTime("10:00");
      setSecondWeekType("even");
      setSecondLocation("");
    }, 200);
  };

  return (
    <div className="px-2.5 sm:px-4 pt-2.5 sm:pt-4 space-y-4 sm:space-y-6 text-right pb-36" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5 sm:gap-3">
           <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" /> 
           برنامه هفتگی
        </h2>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setShowExportModal(true)} 
            className="h-10 sm:h-12 px-3.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-700 rounded-xl sm:rounded-[1.25rem] inline-flex items-center justify-center gap-2 text-xs font-black transition-all active:scale-95 shadow-xs border border-indigo-100 dark:border-slate-700 cursor-pointer"
            title="خروجی تصویر باکیفیت برنامه هفتگی"
          >
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 shrink-0" />
            <span>خروجی تصویر</span>
          </button>
          <button 
            type="button"
            onClick={openAddModal} 
            className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-900 text-white rounded-xl sm:rounded-[1.25rem] inline-flex items-center justify-center shadow-xl dark:shadow-none shadow-slate-900/20 active:scale-95 transition-all cursor-pointer shrink-0"
            title="افزودن کلاس جدید"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
        {classes.length === 0 ? (
          <div className="col-span-full py-12 sm:py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 border-dashed">
            <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500">کلاسی ندارید. با دکمه بالا اضافه کنید!</p>
          </div>
        ) : (
          SHAMSI_WEEKDAYS.map(day => {
            const normDay = normalizeDay(day);
            // Collect all sessions for this day (both primary and second session if configured)
            interface DaySessionItem {
              cls: ClassItem;
              isSecond: boolean;
              startTime: string;
              endTime: string;
              weekType?: "all" | "even" | "odd";
              location?: string;
            }

            const sessions: DaySessionItem[] = [];

            classes.forEach(c => {
              // Primary session
              if (normalizeDay(c.weekday) === normDay) {
                sessions.push({
                  cls: c,
                  isSecond: false,
                  startTime: c.startTime,
                  endTime: c.endTime,
                  weekType: c.weekType,
                  location: c.location
                });
              }
              // Second session (if active and matches this day)
              if (c.hasSecondSession && c.secondWeekday && normalizeDay(c.secondWeekday) === normDay) {
                sessions.push({
                  cls: c,
                  isSecond: true,
                  startTime: c.secondStartTime || c.startTime,
                  endTime: c.secondEndTime || c.endTime,
                  weekType: c.secondWeekType || "even",
                  location: c.secondLocation || c.location
                });
              }
            });

            if (sessions.length === 0) return null;
            sessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
            
            return (
              <div key={day} className="space-y-3 sm:space-y-4 bg-white/40 dark:bg-slate-900/40 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-800/80">
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg pr-2 border-r-2 border-indigo-500">برنامه {day}</h3>
                {sessions.map((sess) => {
                  const cls = sess.cls;
                  const coursePalette = getCourseColor(cls.courseName, cls.color);
                  return (
                    <div 
                      key={`${cls.id}-${sess.isSecond ? 's2' : 's1'}`}
                      className={`group ${coursePalette.ui.cardBg} p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border ${coursePalette.ui.cardBorder} shadow-2xs dark:shadow-none transition-all hover:shadow-md relative z-10 overflow-hidden cursor-pointer flex flex-col`}
                      onClick={() => onOpenProfile && onOpenProfile(cls)}
                    >
                      {/* Signature Vertical Accent Pillar */}
                      <div className={`absolute top-0 right-0 w-2 h-full rounded-r-[1.5rem] sm:rounded-r-[2rem] ${coursePalette.ui.stripe}`}></div>
                      
                      <div className="flex items-center justify-between gap-3 sm:gap-5 pr-1 sm:pr-1.5">
                        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                          <div className="flex flex-col items-center justify-center min-w-[55px] sm:min-w-[70px] shrink-0">
                            <span className={`text-xs sm:text-sm font-black font-mono tracking-tight ${coursePalette.ui.timeText}`}>{sess.startTime}</span>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{sess.endTime}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0 py-0.5 sm:py-1">
                            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                              <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">{cls.courseName}</p>
                              {sess.isSecond && (
                                <span className={`shrink-0 text-[8.5px] font-black px-1.5 py-0.5 rounded border ${coursePalette.ui.badge}`}>
                                  جلسه ۲
                                </span>
                              )}
                              {sess.weekType && sess.weekType !== "all" && (
                                <span className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                  {sess.weekType === "even" ? "فقط هفته زوج" : "فقط هفته فرد"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center flex-wrap gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                              <span className="truncate flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${coursePalette.ui.stripe}`}></div> 
                                <span>{cls.professor || "استاد نامشخص"}</span>
                              </span>
                              {sess.location && (
                                <span 
                                  onClick={(e) => {
                                    if (onFocusBuildingOnMap) {
                                      e.stopPropagation();
                                      const bId = resolveCampusBuildingId(sess.location);
                                      onFocusBuildingOnMap(bId);
                                    }
                                  }}
                                  className="flex items-center gap-1 shrink-0 bg-white/70 dark:bg-slate-900/60 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 cursor-pointer transition-colors"
                                  title="مشاهده روی نقشه دانشگاه"
                                >
                                  <MapPin className="h-3 w-3 text-sky-500" /> {sess.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 relative z-20" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditModal(cls)} className="h-9 w-9 sm:h-10 sm:w-10 bg-white/70 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700/80 rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs border border-slate-100 dark:border-slate-700" title="ویرایش"><Edit className="h-4.5 w-4.5" /></button>
                          <button onClick={() => setDeleteConfirmId(cls.id)} className="h-9 w-9 sm:h-10 sm:w-10 bg-white/70 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700/80 rounded-xl transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs border border-slate-100 dark:border-slate-700" title="حذف"><Trash className="h-4.5 w-4.5" /></button>
                        </div>
                      </div>
                      
                      {onOpenProfile && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-100/80 dark:border-slate-700/50 relative z-20">
                          <button onClick={(e) => { e.stopPropagation(); onOpenProfile(cls); }} className="w-full h-9 bg-white/80 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-xl hover:bg-white dark:hover:bg-indigo-900/40 border border-slate-100 dark:border-indigo-800/40 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                            <User className="w-4 h-4 shrink-0" />
                            <span>مشاهده پروفایل درس</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {typeof document !== "undefined" && createPortal(
        <>
          <AnimatePresence>
            {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 bg-slate-950/80 z-[200] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4 font-sans"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 300,
                opacity: { duration: 0.22, ease: [0.25, 1, 0.5, 1] }
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl dark:shadow-none max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between gap-3 mb-8 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"><Edit3 className="h-6 w-6" /></div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white truncate">{editingId ? "ویرایش کلاس" : "افزودن کلاس جدید"}</h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="بستن"
                  className="h-9 w-9 sm:h-10 sm:w-10 bg-slate-100 dark:bg-slate-700/60 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-5">
                <input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="نام درس (مثلا: مدار ۱)" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black focus:border-blue-500 outline-none transition-colors" />
                <input value={professor} onChange={e => setProfessor(e.target.value)} placeholder="استاد" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black focus:border-blue-500 outline-none transition-colors" />
                <div className="relative z-[60]">
                  <CustomSelect 
                    label="روز برگزاری"
                    value={formDay}
                    onChange={setFormDay}
                    options={SHAMSI_WEEKDAYS}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 relative z-50">
                  <CustomSelect 
                    label="ساعت شروع"
                    value={startTime}
                    onChange={setStartTime}
                    options={TIME_OPTIONS}
                  />
                  <CustomSelect 
                    label="ساعت پایان"
                    value={endTime}
                    onChange={setEndTime}
                    options={TIME_OPTIONS}
                  />
                </div>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="مکان (کلاس/سایت)" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black focus:border-blue-500 outline-none transition-colors" />

                {/* 2nd Session Collapsible Section */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/40 cursor-pointer select-none transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                    <input 
                      type="checkbox" 
                      checked={hasSecondSession} 
                      onChange={(e) => setHasSecondSession(e.target.checked)} 
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <div className="flex-1 text-right">
                      <span className="text-xs font-black text-indigo-950 dark:text-indigo-200">این کلاس ۲ جلسه در هفته است</span>
                      <p className="text-[10px] text-indigo-500/90 dark:text-indigo-400 font-bold mt-0.5">تنظیم روز دوم، ساعت مستقل و برگزاری زوج/فرد</p>
                    </div>
                  </label>

                  {hasSecondSession && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 pr-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>مشخصات جلسه دوم</span>
                      </div>

                      <div className="relative z-[35]">
                        <CustomSelect 
                          label="روز برگزاری جلسه دوم"
                          value={secondDay}
                          onChange={setSecondDay}
                          options={SHAMSI_WEEKDAYS}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 relative z-[30]">
                        <CustomSelect 
                          label="ساعت شروع جلسه ۲"
                          value={secondStartTime}
                          onChange={setSecondStartTime}
                          options={TIME_OPTIONS}
                        />
                        <CustomSelect 
                          label="ساعت پایان جلسه ۲"
                          value={secondEndTime}
                          onChange={setSecondEndTime}
                          options={TIME_OPTIONS}
                        />
                      </div>

                      <input 
                        value={secondLocation} 
                        onChange={e => setSecondLocation(e.target.value)} 
                        placeholder="مکان جلسه دوم (در صورت تفاوت با جلسه اول)" 
                        className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black focus:border-indigo-500 outline-none transition-colors" 
                      />

                      <div className="space-y-1 relative z-[20]">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-1">تکرار جلسه دوم (هفته زوج / فرد)</label>
                        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          {(["even", "odd", "all"] as const).map(wt => (
                            <button 
                              key={wt} 
                              type="button" 
                              onClick={() => setSecondWeekType(wt)} 
                              className={`flex-1 py-2 rounded-lg text-[11px] font-black transition-all ${
                                secondWeekType === wt 
                                  ? "bg-indigo-600 text-white shadow-xs" 
                                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                              }`}
                            >
                              {wt === "even" ? "فقط هفته زوج" : wt === "odd" ? "فقط هفته فرد" : "هر هفته"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Course Accent Color Picker */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />
                      <span>رنگ شاخص درس</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {formColor ? COURSE_PALETTES.find(p => p.id === formColor)?.name : "خودکار (هوشمند)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/80 overflow-x-auto">
                    {/* Auto Button */}
                    <button
                      type="button"
                      onClick={() => setFormColor("")}
                      className={`h-8 px-2.5 rounded-xl text-[10px] font-black inline-flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                        !formColor
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                      }`}
                      title="انتخاب خودکار رنگ بر اساس نام درس"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>هوشمند</span>
                    </button>

                    {/* Palette Swatches */}
                    {COURSE_PALETTES.map((pal) => (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => setFormColor(pal.id)}
                        className={`w-7 h-7 rounded-full shrink-0 transition-transform flex items-center justify-center cursor-pointer ${pal.dotBg} ${
                          formColor === pal.id ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                        }`}
                        title={pal.name}
                      >
                        {formColor === pal.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-rose-500 text-center bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    {formError}
                  </p>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-5 text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">انصراف</button>
                  <button type="submit" className="flex-1 py-5 text-xs font-black text-white bg-blue-600 rounded-2xl shadow-xl dark:shadow-none shadow-blue-100 dark:shadow-none">{editingId ? "ذخیره تغییرات" : "ثبت کلاس"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="fixed inset-0 bg-slate-950/80 z-[250] flex items-center justify-center p-4 font-sans"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }} 
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white mb-2">حذف کلاس</h3>
              <p className="text-sm font-bold text-center text-slate-500 dark:text-slate-400 mb-6">آیا از حذف این کلاس اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">انصراف</button>
                <button onClick={() => { onDeleteClass(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-3.5 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors">بله، حذف شود</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )}

  <AnimatePresence>
        {showExportModal && (
          <ScheduleExportModal
            classes={classes}
            profile={profile}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
