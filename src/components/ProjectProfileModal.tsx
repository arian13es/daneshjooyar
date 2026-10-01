/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: ProjectProfileModal (داشبورد فوق‌پیشرفته مدیریت پروژه و تکالیف)
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
  Loader2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Copy, 
  Check, 
  BookOpen, 
  AlertCircle,
  FileText,
  Briefcase,
  ChevronDown
} from "lucide-react";
import { ProjectItem, Note, Attachment, ChecklistItem } from "../types";
import { FileStorageService } from "../services/FileStorageService";
import { openAttachmentSafely } from "../services/FileHelper";
import FilePreviewModal from "./FilePreviewModal";
import { getCourseColor } from "../utils/courseColors";
import { getChronologicalTimestamp, toPersianDigits } from "../utils/dateUtils";

interface ProjectProfileModalProps {
  project: ProjectItem;
  onClose: () => void;
  onUpdateProject: (updated: ProjectItem) => void;
}

const QUICK_TAGS = [
  { label: "ایده و راهکار 💡", prefix: "💡 ایده: " },
  { label: "تسک بعدی 📌", prefix: "📌 اقدام بعدی: " },
  { label: "منبع و رفرنس 🔗", prefix: "🔗 رفرنس: " },
  { label: "نکته تحویل ⚠️", prefix: "⚠️ نکته تحویل: " }
];

const STATUS_CONFIG: Record<ProjectItem["status"], { label: string; color: string; bg: string; border: string }> = {
  not_started: {
    label: "شروع نشده",
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700"
  },
  in_progress: {
    label: "در حال انجام",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800"
  },
  submitted: {
    label: "تحویل داده شده ✓",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800"
  }
};

const PRIORITY_CONFIG: Record<ProjectItem["priority"], { label: string; dotColor: string; badgeClass: string }> = {
  high: {
    label: "اولویت بالا",
    dotColor: "bg-rose-500",
    badgeClass: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
  },
  medium: {
    label: "اولویت متوسط",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
  },
  low: {
    label: "اولویت عادی",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
  }
};

export default function ProjectProfileModal({ project, onClose, onUpdateProject }: ProjectProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "notes" | "files">("tasks");
  
  // Task Checklist State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // Note State
  const [newNote, setNewNote] = useState("");
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // File State
  const [isUploading, setIsUploading] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [openProgress, setOpenProgress] = useState<number>(0);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Status Switcher Dropdown
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Helper ID generator
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Course Color & Theme
  const coursePalette = useMemo(() => getCourseColor(project.courseName), [project.courseName]);

  // Live Deadline Countdown & Urgency
  const deadlineInfo = useMemo(() => {
    const timestamp = getChronologicalTimestamp(project.deadline, project.time || "23:59");
    if (!Number.isFinite(timestamp)) {
      return { label: project.deadline || "موعد اعلام‌نشده", isUrgent: false, isPast: false };
    }

    const diff = timestamp - Date.now();
    if (diff < 0) {
      return { 
        label: project.status === "submitted" ? "تحویل داده شده ✓" : "مهلت گذشته است", 
        isUrgent: false, 
        isPast: true 
      };
    }

    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days === 0) {
      if (hours === 0) {
        return { label: "🚨 کمتر از ۱ ساعت تا پایان مهلت!", isUrgent: true, isPast: false };
      }
      return { label: `⚡ ${toPersianDigits(hours)} ساعت تا پایان مهلت`, isUrgent: true, isPast: false };
    }
    if (days === 1) {
      return { label: `⚠️ فردا (${toPersianDigits(hours)} ساعت دیگر)`, isUrgent: true, isPast: false };
    }
    return { label: `⏳ ${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت`, isUrgent: days <= 3, isPast: false };
  }, [project.deadline, project.time, project.status]);

  // Tasks & Milestones Calculations
  const tasks = project.tasks || [];
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // Task Actions
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const taskItem: ChecklistItem = {
      id: generateId(),
      title: newTaskTitle.trim(),
      completed: false
    };
    onUpdateProject({ ...project, tasks: [...tasks, taskItem] });
    setNewTaskTitle("");
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    onUpdateProject({ ...project, tasks: updated });
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    onUpdateProject({ ...project, tasks: updated });
  };

  // Status Change
  const handleSetStatus = (newStatus: ProjectItem["status"]) => {
    onUpdateProject({ ...project, status: newStatus });
    setShowStatusMenu(false);
  };

  // Note Actions
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: generateId(),
      text: newNote.trim(),
      timestamp: new Date().toISOString()
    };
    onUpdateProject({ ...project, notes: [...(project.notes || []), note] });
    setNewNote("");
  };

  const handleDeleteNote = (id: string) => {
    onUpdateProject({ ...project, notes: (project.notes || []).filter(n => n.id !== id) });
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
      onUpdateProject({ ...project, attachments: [...(project.attachments || []), attachment] });
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
      onUpdateProject({ ...project, attachments: (project.attachments || []).filter(a => a.id !== fileToDelete) });
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

  const currentStatus = STATUS_CONFIG[project.status || "not_started"];
  const currentPriority = PRIORITY_CONFIG[project.priority || "medium"];

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
          {/* Top Bar: Badges, Status Switcher on the right, Single Close Button on the left */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center flex-wrap gap-2">
              {/* Course Name */}
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                {project.courseName}
              </span>

              {/* Priority */}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shadow-2xs flex items-center gap-1.5 ${currentPriority.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentPriority.dotColor}`} />
                <span>{currentPriority.label}</span>
              </span>

              {/* Status Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-black inline-flex items-center gap-1 border shadow-2xs transition-all cursor-pointer ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}
                >
                  <span>{currentStatus.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute top-full right-0 mt-1 z-30 w-44 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-1 space-y-0.5">
                      {(Object.keys(STATUS_CONFIG) as Array<ProjectItem["status"]>).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleSetStatus(st)}
                          className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-black transition-colors flex items-center justify-between ${
                            project.status === st
                              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span>{STATUS_CONFIG[st].label}</span>
                          {project.status === st && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
              <span className="truncate">{project.title}</span>
            </h2>
          </div>

          {/* Compact Metadata Strip (Unified Single Row) */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-3.5">
            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>موعد تحویل: {toPersianDigits(project.deadline)}</span>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border shadow-2xs ${
              deadlineInfo.isUrgent
                ? "bg-rose-100/90 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse"
                : deadlineInfo.isPast
                ? "bg-slate-150 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                : "bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}>
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{deadlineInfo.label}</span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODERN SEGMENTED TABS                                             */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-2 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>مراحل پروژه</span>
              {tasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(completedTasksCount)}/{toPersianDigits(tasks.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`py-2 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>یادداشت‌ها</span>
              {(project.notes?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(project.notes?.length || 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`py-2 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                activeTab === "files"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span>فایل‌ها</span>
              {(project.attachments?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(project.attachments?.length || 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB CONTENTS (SCROLLABLE)                                         */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-20 sm:pb-8 bg-slate-100/60 dark:bg-slate-950/70">
          {/* TAB 1: TASKS & MILESTONES */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* Progress Summary Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4.5 h-4.5 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">پیشرفت مراحل پروژه</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {toPersianDigits(progressPercent)}٪ تکمیل شده
                  </span>
                </div>

                {/* Animated Progress Bar — scaleX keeps this on the compositor */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: progressPercent / 100 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ transformOrigin: "right center", width: "100%" }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2">
                  <span>{toPersianDigits(completedTasksCount)} مرحله تمام‌شده</span>
                  <span>{toPersianDigits(tasks.length - completedTasksCount)} مرحله باقیمانده</span>
                </div>
              </div>

              {/* Add New Task Input */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="افزودن مرحله جدید (مثال: طراحی دیاگرام، پیاده‌سازی بک‌اند، گزارش نهایی...)"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>افزودن</span>
                </button>
              </div>

              {/* Task Items */}
              <div className="space-y-2 mt-3">
                {tasks.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                      هیچ فازی برای پروژه تعریف نشده است
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      پروژه را به مراحل کوچک‌تر تقسیم کنید تا سریع‌تر و بدون استرس به اتمام برسد.
                    </p>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        task.completed
                          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200"
                          : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className="flex items-center gap-2.5 flex-1 text-right cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0 hover:text-emerald-500 transition-colors" />
                        )}
                        <span className={`text-xs sm:text-sm font-black select-none ${task.completed ? "line-through opacity-70" : ""}`}>
                          {task.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                        title="حذف مرحله"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NOTES & IDEAS */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Quick Tag Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <span className="text-[11px] font-bold text-slate-400 shrink-0">تگ سریع:</span>
                {QUICK_TAGS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setNewNote((prev) => t.prefix + prev)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Note Input Composer */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4 shadow-xs space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="ایده‌ها، راه‌حل‌های فنی، لینک‌ها و نکات تحویل پروژه را بنویسید..."
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-bold outline-none focus:border-emerald-500 dark:focus:border-emerald-400 text-slate-800 dark:text-slate-100 min-h-[90px] resize-y"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-bold">
                    {newNote.length > 0 ? `${toPersianDigits(newNote.length)} کاراکتر` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>ثبت یادداشت</span>
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3 mt-4">
                {(project.notes || []).length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                      یادداشتی ثبت نشده است
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      هر ایده، رفرنس علمی یا نیازمندی پروژه را اینجا ثبت کنید تا فراموش نشود.
                    </p>
                  </div>
                ) : (
                  (project.notes || []).map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2.5"
                    >
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                        {note.text}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                        <span>
                          {note.timestamp
                            ? new Date(note.timestamp).toLocaleDateString("fa-IR")
                            : "یادداشت پروژه"}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyNote(note.id, note.text)}
                            className="h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="کپی متن"
                          >
                            {copiedNoteId === note.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-black">کپی شد</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>کپی</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center justify-center cursor-pointer"
                            title="حذف یادداشت"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FILES & DELIVERABLES */}
          {activeTab === "files" && (
            <div className="space-y-4">
              {/* Dropzone Upload Button */}
              <label className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-dashed border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xs group">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 block">
                    {isUploading ? "در حال ذخیره‌سازی فایل..." : "افزودن مستندات، فایل‌ها یا سورس‌کد"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                    ذخیره امن فایل‌ها و اسناد در حافظه دستگاه
                  </span>
                </div>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>

              {/* Files Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {(project.attachments || []).length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <File className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-1">
                      هنوز فایلی برای پروژه ضمیمه نشده است
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      فایل‌های گزارش، ارائه‌ها، دیاگرام‌ها یا کدهای پروژه را اینجا ذخیره کنید.
                    </p>
                  </div>
                ) : (
                  (project.attachments || []).map((att) => {
                    const isOpening = openingFileId === att.id;
                    const isImg = att.fileType.includes("image");
                    const isPdf = att.fileType.includes("pdf") || att.fileName.endsWith(".pdf");

                    return (
                      <div
                        key={att.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isOpening
                            ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md"
                            : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2.5 flex-1 min-w-0 ${isOpening ? "cursor-wait" : "cursor-pointer"}`}
                          onClick={() => !openingFileId && handleOpenFile(att)}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isPdf
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500"
                                : isImg
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                                : "bg-sky-50 dark:bg-sky-950/40 text-sky-500"
                            }`}
                          >
                            {isOpening ? (
                              <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            ) : isImg ? (
                              <ImageIcon className="w-4.5 h-4.5" />
                            ) : (
                              <File className="w-4.5 h-4.5" />
                            )}
                          </div>

                          <div className="min-w-0 pr-1">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                              {att.fileName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-0.5">
                              <span>{formatSize(att.size)}</span>
                              <span>•</span>
                              {isOpening ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-black animate-pulse">
                                  {openProgress > 0 ? `آماده‌سازی (${toPersianDigits(openProgress)}٪)...` : "در حال باز کردن..."}
                                </span>
                              ) : (
                                <span className="text-emerald-600 dark:text-emerald-400">مشاهده فایل</span>
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
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">حذف فایل پروژه</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6">
                  آیا از حذف این فایل اطمینان دارید؟ این فایل از حافظه پاک خواهد شد.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFileToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-black text-xs transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={confirmDeleteFile}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs transition-colors cursor-pointer shadow-xs"
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
