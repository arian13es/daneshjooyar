/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: CumulativeGpaCalculator (محاسبه‌گر پیشرفته معدل ترم دانشگاه تبریز)
 * Author: Arian
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from "react";
import { Calculator, Plus, Trash2, RotateCcw, BookOpen, X, Check, GraduationCap, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { safeStorageGet, safeStorageSet, safeStorageRemove } from "../utils/storageUtils";

export interface CalculatorCourse {
  id: string;
  name: string;
  credits: number;
  score: string;
}

const DEFAULT_COURSES: CalculatorCourse[] = [];

export default function CumulativeGpaCalculator() {
  const [courses, setCourses] = useState<CalculatorCourse[]>(() => {
    const savedV2 = safeStorageGet<CalculatorCourse[] | null>("gpa_calc_courses_v2", null);
    if (Array.isArray(savedV2)) {
      return savedV2;
    }
    const oldSaved = safeStorageGet<unknown[] | null>("gpa_calc_courses", null);
    if (Array.isArray(oldSaved)) {
      const isDummyDefaults = oldSaved.length === 6 &&
        oldSaved.every((c) => {
          const course = c as { score?: string; name?: string };
          return !course.score && ["ریاضی عمومی ۱", "فیزیک ۱", "آزمایشگاه فیزیک ۱", "مبانی برنامه‌نویسی", "کارگاه کامپیوتر", "فارسی عمومی"].includes(course.name ?? "");
        });
      if (isDummyDefaults) {
        safeStorageRemove("gpa_calc_courses");
        return [];
      }
      if (oldSaved.length > 0) {
        return oldSaved as CalculatorCourse[];
      }
    }
    return DEFAULT_COURSES;
  });

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCredits, setNewCourseCredits] = useState<number>(3);
  const [customCreditsInput, setCustomCreditsInput] = useState<string>("");

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    safeStorageSet("gpa_calc_courses_v2", courses);
    safeStorageRemove("gpa_calc_courses");
  }, [courses]);

  const normalizeNum = (val: string) => {
    return String(val || "")
      .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .replace(/[,/]/g, ".");
  };

  const toPersianDigits = (val: number | string): string => {
    return String(val ?? "").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  };

  // Academic Term Statistics
  const termStats = useMemo(() => {
    let totalCredits = 0;
    let currentPoints = 0;

    courses.forEach(c => {
      const cr = Number(c.credits) || 0;
      const sc = parseFloat(normalizeNum(c.score));
      if (!isNaN(sc) && sc >= 0 && sc <= 20 && cr > 0) {
        totalCredits += cr;
        currentPoints += sc * cr;
      }
    });

    const termGpaNum = totalCredits > 0 ? currentPoints / totalCredits : 0;
    const termGpaStr = totalCredits > 0 ? termGpaNum.toFixed(2) : "۰.۰۰";
    const allEnrolledUnits = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);

    let statusText = "در انتظار نمرات";
    let badgeDotColor = "bg-slate-400";
    let badgeTextColor = "text-slate-300";

    if (totalCredits > 0) {
      if (termGpaNum >= 17) {
        statusText = "ممتاز (الف)";
        badgeDotColor = "bg-emerald-400";
        badgeTextColor = "text-emerald-300";
      } else if (termGpaNum >= 14) {
        statusText = "بسیار خوب (ب)";
        badgeDotColor = "bg-cyan-400";
        badgeTextColor = "text-cyan-300";
      } else if (termGpaNum >= 12) {
        statusText = "عادی (ج)";
        badgeDotColor = "bg-amber-400";
        badgeTextColor = "text-amber-300";
      } else {
        statusText = "مشروط";
        badgeDotColor = "bg-rose-400";
        badgeTextColor = "text-rose-300";
      }
    }

    return {
      totalCredits,
      allEnrolledUnits,
      currentPoints,
      termGpaNum,
      termGpaStr,
      statusText,
      badgeDotColor,
      badgeTextColor
    };
  }, [courses]);

  const handleClearScores = () => {
    setConfirmDialog({
      title: "پاک‌سازی نمرات",
      description: "آیا از پاک کردن نمرات تمام دروس اطمینان دارید؟",
      confirmText: "بله، نمرات پاک شوند",
      isDanger: false,
      onConfirm: () => {
        setCourses(courses.map(c => ({ ...c, score: "" })));
        setConfirmDialog(null);
      }
    });
  };

  const handleResetDefault = () => {
    setConfirmDialog({
      title: "حذف تمام دروس",
      description: "آیا از حذف تمام دروس این ترم اطمینان دارید؟ این عمل قابل بازگشت نیست.",
      confirmText: "بله، همه حذف شوند",
      isDanger: true,
      onConfirm: () => {
        safeStorageRemove("gpa_calc_courses_v2");
        safeStorageRemove("gpa_calc_courses");
        setCourses([]);
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteCourse = (id: string, courseName?: string) => {
    setConfirmDialog({
      title: "حذف درس",
      description: courseName ? `آیا از حذف درس «${courseName}» اطمینان دارید؟` : "آیا از حذف این درس اطمینان دارید؟",
      confirmText: "بله، حذف شود",
      isDanger: true,
      onConfirm: () => {
        setCourses(prev => prev.filter(c => c.id !== id));
        setConfirmDialog(null);
      }
    });
  };

  const handleScoreChange = (id: string, val: string) => {
    setCourses(courses.map(c => (c.id === id ? { ...c, score: val } : c)));
  };

  return (
    <div className="h-full overflow-y-auto px-2.5 sm:px-4 space-y-4 pb-36 text-right font-sans select-none" dir="rtl">
      {/* 1. Hero GPA Status Card (Unified Palette & High-Contrast Typography) */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-[2rem] p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-indigo-500/30">
        {/* Ambient atmospheric lighting */}
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Actions Row */}
        <div className="flex items-center justify-between relative z-10 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">محاسبه‌گر معدل ترم</h3>
              <p className="text-[11px] text-indigo-200/80 font-bold">دانشگاه تبریز</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearScores}
              title="پاک‌سازی نمرات"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-[11px] font-bold text-indigo-100 hover:text-white transition-all flex items-center gap-1 backdrop-blur-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>پاک‌سازی نمرات</span>
            </button>
            <button
              onClick={handleResetDefault}
              title="بازنشانی به دروس اولیه"
              className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-indigo-200 hover:text-white transition-all backdrop-blur-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Focal Center: GPA Metric */}
        <div className="text-center py-3 relative z-10">
          <span className="text-[11px] font-bold text-indigo-200/80 block mb-1">معدل ترم جاری</span>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums inline-block">
            {termStats.totalCredits > 0 ? toPersianDigits(termStats.termGpaStr) : "--.--"}
          </div>

          {/* Academic Standing Status Pill */}
          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black backdrop-blur-md border border-white/15 bg-white/10">
              <span className={`h-2 w-2 rounded-full ${termStats.badgeDotColor}`} />
              <span className={termStats.badgeTextColor}>{termStats.statusText}</span>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-white/10 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 text-center">
            <p className="text-[10px] text-indigo-200 font-bold mb-0.5">واحدهای ثبت‌شده</p>
            <p className="text-sm sm:text-base font-black text-white tabular-nums">
              {toPersianDigits(termStats.totalCredits % 1 === 0 ? termStats.totalCredits : termStats.totalCredits.toFixed(1))}
              <span className="text-[10px] text-indigo-200 font-bold mr-1">
                از {toPersianDigits(termStats.allEnrolledUnits % 1 === 0 ? termStats.allEnrolledUnits : termStats.allEnrolledUnits.toFixed(1))}
              </span>
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 text-center">
            <p className="text-[10px] text-indigo-200 font-bold mb-0.5">مجموع نمره × واحد</p>
            <p className="text-sm sm:text-base font-black text-amber-300 tabular-nums">
              {toPersianDigits(termStats.currentPoints.toFixed(1))}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Course List Section Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>دروس ترم جاری ({toPersianDigits(courses.length)} درس)</span>
        </span>
        <button
          onClick={() => {
            setNewCourseName("");
            setNewCourseCredits(3);
            setCustomCreditsInput("");
            setShowAddCourseModal(true);
          }}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} />
          <span>افزودن درس</span>
        </button>
      </div>

      {/* 3. Compact & Harmonized Course Cards */}
      <div className="space-y-2.5">
        {courses.length === 0 ? (
          <div className="py-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 border-dashed">
            <BookOpen className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">درسی ثبت نشده است. با دکمه زیر درس‌های خود را اضافه کنید.</p>
          </div>
        ) : (
          courses.map(course => {
          const numScore = parseFloat(normalizeNum(course.score));
          const hasScore = !isNaN(numScore) && course.score.trim() !== "";
          const isValidScore = hasScore && numScore >= 0 && numScore <= 20;
          const isPass = isValidScore && numScore >= 10;
          const isExcellent = isValidScore && numScore >= 17;

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-800/90 rounded-2xl p-3 sm:p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-between gap-3"
            >
              {/* Right Side: Course Title & Units */}
              <div className="min-w-0 flex-1 flex flex-col gap-1">
                <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {course.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    {toPersianDigits(course.credits % 1 === 0 ? course.credits : course.credits.toFixed(1))} واحد
                  </span>
                  {hasScore && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        !isValidScore
                          ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60"
                          : isExcellent
                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60"
                          : isPass
                          ? "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60"
                          : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60"
                      }`}
                    >
                      {!isValidScore ? "نامعتبر" : isExcellent ? "ممتاز" : isPass ? "قبول" : "افتاده"}
                    </span>
                  )}
                </div>
              </div>

              {/* Left Side: Score Input & Trash Action */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  inputMode="decimal"
                  value={course.score}
                  onChange={e => handleScoreChange(course.id, e.target.value)}
                  placeholder="نمره"
                  className="w-16 sm:w-20 text-center py-2 px-2 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white tabular-nums outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all"
                />
                <button
                  onClick={() => handleDeleteCourse(course.id, course.name)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors active:scale-95"
                  title="حذف درس"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* 4. Add Course Button */}
      <button
        onClick={() => {
          setNewCourseName("");
          setNewCourseCredits(3);
          setCustomCreditsInput("");
          setShowAddCourseModal(true);
        }}
        className="w-full py-3.5 bg-white dark:bg-slate-800/80 border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-500 dark:text-slate-400 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
      >
        <Plus className="h-4 w-4 text-indigo-500" />
        <span>افزودن درس جدید</span>
      </button>

      {/* 5. Minimal Modal to Add New Course */}
      <AnimatePresence>
        {showAddCourseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[220] flex items-end sm:items-center justify-center p-4 text-right"
            dir="rtl"
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">افزودن درس جدید</h3>
                </div>
                <button
                  onClick={() => setShowAddCourseModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (newCourseName.trim()) {
                    let finalCredits = newCourseCredits;
                    if (customCreditsInput.trim()) {
                      const parsed = parseFloat(normalizeNum(customCreditsInput));
                      if (!isNaN(parsed) && parsed > 0) {
                        finalCredits = parsed;
                      }
                    }
                    setCourses([
                      ...courses,
                      {
                        id: Date.now().toString(),
                        name: newCourseName.trim(),
                        credits: finalCredits,
                        score: ""
                      }
                    ]);
                    setShowAddCourseModal(false);
                    setNewCourseName("");
                    setNewCourseCredits(3);
                    setCustomCreditsInput("");
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400">نام درس</label>
                  <input
                    required
                    autoFocus
                    value={newCourseName}
                    onChange={e => setNewCourseName(e.target.value)}
                    placeholder="مثال: طراحی الگوریتم"
                    className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400">تعداد واحد</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[0.5, 1, 1.5, 2, 3, 4].map(cr => (
                      <button
                        type="button"
                        key={cr}
                        onClick={() => {
                          setNewCourseCredits(cr);
                          setCustomCreditsInput("");
                        }}
                        className={`py-2 rounded-xl text-xs font-black transition-all border tabular-nums ${
                          newCourseCredits === cr && !customCreditsInput
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {toPersianDigits(cr)}
                      </button>
                    ))}
                  </div>

                  {/* Custom fractional unit input */}
                  <div className="pt-1 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">واحد سفارشی:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="12"
                      value={customCreditsInput}
                      onChange={e => setCustomCreditsInput(e.target.value)}
                      placeholder="۰.۵"
                      className="w-16 bg-white dark:bg-slate-800 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-black tabular-nums text-center outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCourseModal(false)}
                    className="flex-1 py-2.5 text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    ثبت درس
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. In-App Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 select-none"
            dir="rtl"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.92, opacity: 0, y: 10 }} 
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-700/80 text-center"
            >
              <div className={`w-14 h-14 ${confirmDialog.isDanger ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2">
                {confirmDialog.title}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {confirmDialog.description}
              </p>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setConfirmDialog(null)} 
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition-all text-xs"
                >
                  انصراف
                </button>
                <button 
                  type="button"
                  onClick={confirmDialog.onConfirm} 
                  className={`flex-1 py-3 ${confirmDialog.isDanger ? 'bg-rose-500 shadow-rose-500/25 hover:bg-rose-600' : 'bg-indigo-600 shadow-indigo-500/25 hover:bg-indigo-700'} text-white font-black rounded-xl shadow-md active:scale-95 transition-all text-xs`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
