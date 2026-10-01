/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: ExamProfileModal (داشبورد هوشمند مدیریت و اتاق آمادگی امتحان)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Paperclip, 
  Trash, 
  File, 
  Image as ImageIcon, 
  Headphones, 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Copy, 
  Check, 
  BookOpen, 
  AlertCircle,
  FileText,
  Award,
  ChevronLeft
} from "lucide-react";
import { ExamItem, Note, Attachment, ChecklistItem } from "../types";
import { FileStorageService } from "../services/FileStorageService";
import { openAttachmentSafely } from "../services/FileHelper";
import FilePreviewModal from "./FilePreviewModal";
import { getCourseColor } from "../utils/courseColors";
import { getChronologicalTimestamp, toPersianDigits } from "../utils/dateUtils";

interface ExamProfileModalProps {
  exam: ExamItem;
  onClose: () => void;
  onUpdateExam: (updated: ExamItem) => void;
  onStartFocus?: () => void;
}

const QUICK_TAGS = [
  { label: "نکته طلایی 🌟", prefix: "🌟 نکته طلایی: " },
  { label: "فرمول مهم 📐", prefix: "📐 فرمول: " },
  { label: "سوال احتمالی ❓", prefix: "❓ سوال احتمالی: " },
  { label: "خطای متداول ⚠️", prefix: "⚠️ خطای متداول: " }
];

export default function ExamProfileModal({ exam, onClose, onUpdateExam, onStartFocus }: ExamProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "notes" | "files">("checklist");
  
  // Checklist State
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  
  // Note State
  const [newNote, setNewNote] = useState("");
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // File State
  const [isUploading, setIsUploading] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [openProgress, setOpenProgress] = useState<number>(0);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Helper ID generator
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Course Color & Theme
  const coursePalette = useMemo(() => getCourseColor(exam.courseName), [exam.courseName]);

  // Live Countdown & Status Calculation
  const countdownInfo = useMemo(() => {
    const timestamp = getChronologicalTimestamp(exam.date, exam.time || "10:00");
    if (!Number.isFinite(timestamp)) {
      return { label: exam.date || "تاریخ اعلام‌نشده", isUrgent: false, isPast: false };
    }

    const diff = timestamp - Date.now();
    if (diff < 0) {
      return { label: "برگزار شده ✓", isUrgent: false, isPast: true };
    }

    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days === 0) {
      if (hours === 0) {
        return { label: "🔥 کمتر از ۱ ساعت مانده!", isUrgent: true, isPast: false };
      }
      return { label: `⚡ ${toPersianDigits(hours)} ساعت تا شروع`, isUrgent: true, isPast: false };
    }
    if (days === 1) {
      return { label: `🔥 فردا (${toPersianDigits(hours)} ساعت دیگر)`, isUrgent: true, isPast: false };
    }
    return { label: `⏳ ${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت`, isUrgent: days <= 3, isPast: false };
  }, [exam.date, exam.time]);

  // Checklist Calculations
  const checklist = exam.checklist || [];
  const completedCount = checklist.filter(c => c.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  // Checklist Actions
  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    const item: ChecklistItem = {
      id: generateId(),
      title: newChecklistTitle.trim(),
      completed: false
    };
    onUpdateExam({ ...exam, checklist: [...checklist, item] });
    setNewChecklistTitle("");
  };

  const handleToggleChecklistItem = (id: string) => {
    const updated = checklist.map(c => c.id === id ? { ...c, completed: !c.completed } : c);
    onUpdateExam({ ...exam, checklist: updated });
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter(c => c.id !== id);
    onUpdateExam({ ...exam, checklist: updated });
  };

  // Note Actions
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: generateId(),
      text: newNote.trim(),
      timestamp: new Date().toISOString()
    };
    onUpdateExam({ ...exam, notesList: [...(exam.notesList || []), note] });
    setNewNote("");
  };

  const handleDeleteNote = (id: string) => {
    onUpdateExam({ ...exam, notesList: (exam.notesList || []).filter(n => n.id !== id) });
  };

  const handleCopyNote = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNoteId(id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // File Upload & Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileId = generateId();
      await FileStorageService.saveFile(fileId, file);

      const attachment: Attachment = {
        id: fileId,
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        timestamp: new Date().toISOString()
      };
      onUpdateExam({ ...exam, attachments: [...(exam.attachments || []), attachment] });
    } catch (error) {
      console.error(error);
      alert("خطا در ذخیره فایل");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenFile = async (att: Attachment) => {
    if (openingFileId) return;
    setOpeningFileId(att.id);
    setOpenProgress(0);
    try {
      const blob = await FileStorageService.getFile(att.id);
      if (!blob) {
        alert("فایل پیدا نشد!");
        return;
      }
      await openAttachmentSafely(
        att,
        blob,
        (previewData) => setViewingFile(previewData),
        (progress) => setOpenProgress(progress)
      );
    } catch (e) {
      console.error(e);
      alert("خطا در باز کردن فایل");
    } finally {
      setOpeningFileId(null);
      setOpenProgress(0);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await FileStorageService.deleteFile(fileToDelete);
      onUpdateExam({ ...exam, attachments: (exam.attachments || []).filter(a => a.id !== fileToDelete) });
      setFileToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Study Time Stats
  const totalMins = exam.totalStudyMinutes || 0;
  const studyHours = Math.floor(totalMins / 60);
  const studyMins = totalMins % 60;
  const formattedStudyTime = studyHours > 0 
    ? `${toPersianDigits(studyHours)} ساعت و ${toPersianDigits(studyMins)} دقیقه`
    : `${toPersianDigits(totalMins)} دقیقه`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-[250] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 font-sans"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white dark:bg-slate-900 sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative border border-slate-200/90 dark:border-slate-800"
      >
        {/* ================================================================= */}
        {/* COMPACT & HARMONIOUS HERO HEADER (LIGHT & DARK ADAPTIVE)          */}
        {/* ================================================================= */}
        <div className="relative bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 pt-[calc(0.85rem+env(safe-area-inset-top,0px))] shrink-0 border-b border-slate-200/80 dark:border-slate-800">
          {/* Top Bar: Badges on the right, Single Close Button on the left */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs ${
                exam.type === "پایان‌ترم"
                  ? "bg-purple-100/90 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  : "bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
              }`}>
                {exam.type}
              </span>

              {/* Countdown Badge */}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs ${
                countdownInfo.isUrgent 
                  ? "bg-rose-100/90 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse" 
                  : countdownInfo.isPast
                  ? "bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                  : "bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
              }`}>
                {countdownInfo.label}
              </span>
            </div>

            {/* Single Clean Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title Row with generous vertical breathing room */}
          <div className="mb-3.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div 
                className="w-2.5 h-7 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: coursePalette.hex }}
              />
              <span className="truncate">امتحان {toPersianDigits(exam.courseName)}</span>
            </h2>
          </div>

          {/* Compact Metadata Strip (Unified Single Row) */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-3.5">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{toPersianDigits(exam.date)}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>{exam.time ? `ساعت ${toPersianDigits(exam.time)}` : "ساعت نامشخص"}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{exam.location || "مکان تعیین‌نشده"}</span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STREAMLINED DEEP FOCUS STATION CARD                              */}
          {/* =============================================================== */}
          {onStartFocus && (
            <div
              onClick={onStartFocus}
              className="p-3 sm:p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Headphones className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      حالت تمرکز شب امتحان
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                      پومودورو
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    زمان مطالعه: <span className="text-indigo-600 dark:text-indigo-300 font-black">{formattedStudyTime}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shrink-0 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>ورود</span>
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* MODERN SEGMENTED TABS                                             */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("checklist")}
              className={`py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "checklist"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>سرفصل‌ها</span>
              {checklist.length > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(completedCount)}/{toPersianDigits(checklist.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>یادداشت‌ها</span>
              {(exam.notesList?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(exam.notesList?.length || 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`py-2 px-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "files"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span>فایل‌ها</span>
              {(exam.attachments?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(exam.attachments?.length || 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB CONTENTS (SCROLLABLE)                                         */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100/50 dark:bg-slate-950/60">
          {/* TAB 1: CHECKLIST & SYLLABUS TRACKER */}
          {activeTab === "checklist" && (
            <div className="space-y-3.5">
              {/* Progress Summary Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-amber-500" />
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">میزان آمادگی برای امتحان</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {toPersianDigits(progressPercent)}٪ مطالعه شده
                  </span>
                </div>

                {/* Animated Progress Bar — scaleX keeps this on the compositor */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progressPercent / 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ transformOrigin: "right center", width: "100%" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2">
                  <span>{toPersianDigits(completedCount)} مبحث خوانده‌شده</span>
                  <span>{toPersianDigits(checklist.length - completedCount)} مبحث باقیمانده</span>
                </div>
              </div>

              {/* Add New Checklist Item Input */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                  placeholder="افزودن مبحث جدید (مثال: فصل ۱، نمونه سوالات...)"
                  className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  disabled={!newChecklistTitle.trim()}
                  className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>افزودن</span>
                </button>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2 mt-2">
                {checklist.length === 0 ? (
                  <div className="py-8 text-center bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-5">
                    <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-0.5">
                      هیچ سرفصلی تعریف نشده است
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      فصل‌ها و نمونه‌سوالات امتحانی را اضافه کنید تا روند مطالعه را قدم‌به‌قدم رصد کنید.
                    </p>
                  </div>
                ) : (
                  checklist.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        item.completed
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleChecklistItem(item.id)}
                        className="flex items-center gap-2.5 flex-1 text-right cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4.5 h-4.5 text-slate-300 dark:text-slate-600 shrink-0 hover:text-indigo-500 transition-colors" />
                        )}
                        <span className={`text-xs sm:text-sm font-black select-none ${item.completed ? "line-through opacity-70" : ""}`}>
                          {item.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                        title="حذف مبحث"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTES & FORMULAS */}
          {activeTab === "notes" && (
            <div className="space-y-3.5">
              {/* Quick Tag Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">تگ سریع:</span>
                {QUICK_TAGS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setNewNote((prev) => t.prefix + prev)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[10.5px] font-bold text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Note Input Composer */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-3 shadow-xs space-y-2.5">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="نکات طلایی، فرمول‌های مهم یا سوالات احتمالی این درس را یادداشت کنید..."
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs sm:text-sm font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-100 min-h-[80px] resize-y"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-bold">
                    {newNote.length > 0 ? `${toPersianDigits(newNote.length)} کاراکتر` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="h-8 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>ثبت یادداشت</span>
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-2.5 mt-3">
                {(exam.notesList || []).length === 0 ? (
                  <div className="py-8 text-center bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-5">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-0.5">
                      یادداشتی ثبت نشده است
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      فرمول‌ها و نکات مهم شب امتحان را اینجا بنویسید تا همیشه دم دستتان باشد.
                    </p>
                  </div>
                ) : (
                  (exam.notesList || []).map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                    >
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                        {note.text}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                        <span>
                          {note.timestamp
                            ? new Date(note.timestamp).toLocaleDateString("fa-IR")
                            : "یادداشت امتحان"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyNote(note.id, note.text)}
                            className="h-6 px-2 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="کپی متن"
                          >
                            {copiedNoteId === note.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-black">کپی شد</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>کپی</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-6 w-6 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="حذف یادداشت"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FILES & EXAM MATERIALS */}
          {activeTab === "files" && (
            <div className="space-y-3.5">
              {/* Dropzone Upload Button */}
              <label className="p-5 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 block">
                    {isUploading ? "در حال ذخیره‌سازی منبع..." : "افزودن جزوه، نمونه‌سوال یا تصویر"}
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-400 block mt-0.5">
                    ذخیره مستقیم در حافظه گوشی و نمایش آفلاین
                  </span>
                </div>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>

              {/* Files Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {(exam.attachments || []).length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-5">
                    <File className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200 mb-0.5">
                      هنوز فایلی ضمیمه نشده است
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      نمونه‌سوالات سال‌های قبل و خلاصه‌های کلاسی را اینجا بارگذاری کنید.
                    </p>
                  </div>
                ) : (
                  (exam.attachments || []).map((att) => {
                    const isOpening = openingFileId === att.id;
                    const isImg = att.fileType.includes("image");
                    const isPdf = att.fileType.includes("pdf") || att.fileName.endsWith(".pdf");

                    return (
                      <div
                        key={att.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          isOpening
                            ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2.5 flex-1 min-w-0 ${isOpening ? "cursor-wait" : "cursor-pointer"}`}
                          onClick={() => !openingFileId && handleOpenFile(att)}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isPdf
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                                : isImg
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                                : "bg-sky-50 dark:bg-sky-950/40 text-sky-500"
                            }`}
                          >
                            {isOpening ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isImg ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <File className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0 pr-0.5">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                              {att.fileName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-0.5">
                              <span>{formatSize(att.size)}</span>
                              <span>•</span>
                              {isOpening ? (
                                <span className="text-indigo-600 dark:text-indigo-400 font-black animate-pulse">
                                  {openProgress > 0 ? `آماده‌سازی (${toPersianDigits(openProgress)}٪)...` : "در حال باز کردن..."}
                                </span>
                              ) : (
                                <span className="text-indigo-600 dark:text-indigo-400">مشاهده فایل</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!!openingFileId}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(att.id);
                          }}
                          className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                          title="حذف فایل"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete File Confirmation Dialog */}
        <AnimatePresence>
          {fileToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-2.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">حذف فایل منبع</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-5">
                  آیا از حذف این فایل اطمینان دارید؟ این فایل از حافظه پاک خواهد شد.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFileToDelete(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-black text-xs transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={confirmDeleteFile}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    بله، حذف شود
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* In-App File Preview Modal */}
        {viewingFile && (
          <FilePreviewModal
            file={viewingFile}
            onClose={() => setViewingFile(null)}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
