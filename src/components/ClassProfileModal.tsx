/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: ClassProfileModal (داشبورد فوق‌پیشرفته مدیریت درس، جلسات و فایل‌ها)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  FileText, 
  Paperclip, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Trash, 
  File, 
  Image as ImageIcon, 
  Loader2, 
  MapPin,
  Copy,
  Check,
  AlertCircle,
  Briefcase,
  Award,
  User
} from "lucide-react";
import { ClassItem, Note, Attachment, Absence, ExamItem, ProjectItem } from "../types";
import { FileStorageService } from "../services/FileStorageService";
import { openAttachmentSafely } from "../services/FileHelper";
import FilePreviewModal from "./FilePreviewModal";
import { getCourseColor } from "../utils/courseColors";
import { toPersianDigits } from "../utils/dateUtils";

interface ClassProfileModalProps {
  classItem: ClassItem;
  onClose: () => void;
  onUpdateClass: (updated: ClassItem) => void;
  relatedExams: ExamItem[];
  relatedProjects: ProjectItem[];
  onAddExam: (courseName: string) => void;
  onAddProject: (courseName: string) => void;
  onOpenExamProfile: (exam: ExamItem) => void;
  onOpenProjectProfile: (project: ProjectItem) => void;
  onFocusBuildingOnMap?: (buildingId?: string) => void;
}

const QUICK_TAGS = [
  { label: "نکته کلاسی 📝", prefix: "📝 نکته: " },
  { label: "تکلیف خانگی 📚", prefix: "📚 تکلیف: " },
  { label: "منابع امتحانی 📖", prefix: "📖 منبع: " },
  { label: "اطلاعیه استاد 📢", prefix: "📢 اطلاعیه: " }
];

export default function ClassProfileModal({ 
  classItem, 
  onClose, 
  onUpdateClass, 
  relatedExams, 
  relatedProjects, 
  onAddExam, 
  onAddProject, 
  onOpenExamProfile, 
  onOpenProjectProfile,
  onFocusBuildingOnMap
}: ClassProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"notes" | "files" | "absences" | "tasks">("notes");
  
  // Note state
  const [newNote, setNewNote] = useState("");
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // File state
  const [isUploading, setIsUploading] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);
  const [openProgress, setOpenProgress] = useState<number>(0);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Helper ID generator
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Course Color & Theme
  const coursePalette = useMemo(() => getCourseColor(classItem.courseName), [classItem.courseName]);

  // Notes
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: generateId(),
      text: newNote.trim(),
      timestamp: new Date().toISOString()
    };
    onUpdateClass({ ...classItem, notes: [...(classItem.notes || []), note] });
    setNewNote("");
  };

  const handleDeleteNote = (id: string) => {
    onUpdateClass({ ...classItem, notes: (classItem.notes || []).filter(n => n.id !== id) });
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

  // Files
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
      onUpdateClass({ ...classItem, attachments: [...(classItem.attachments || []), attachment] });
    } catch (error) {
      console.error("Error uploading file:", error);
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
      if (blob) {
        await openAttachmentSafely(
          att, 
          blob, 
          (previewData) => setViewingFile(previewData),
          (progress) => setOpenProgress(progress)
        );
      } else {
        alert("فایل پیدا نشد!");
      }
    } catch (e) {
      console.error(e);
      alert("خطا در باز کردن فایل با برنامه‌های گوشی");
    } finally {
      setOpeningFileId(null);
      setOpenProgress(0);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await FileStorageService.deleteFile(fileToDelete);
      onUpdateClass({ ...classItem, attachments: (classItem.attachments || []).filter(a => a.id !== fileToDelete) });
      setFileToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Absences
  const handleAddAbsence = () => {
    const dateStr = new Date().toLocaleDateString("fa-IR");
    const abs: Absence = { id: generateId(), date: dateStr };
    onUpdateClass({ ...classItem, absences: [...(classItem.absences || []), abs] });
  };

  const handleDeleteAbsence = (id: string) => {
    onUpdateClass({ ...classItem, absences: (classItem.absences || []).filter(a => a.id !== id) });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const absences = classItem.absences || [];
  const maxAbsences = 3;
  const isAbsenceExceeded = absences.length > maxAbsences;

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
              {/* Professor badge */}
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{classItem.professor || "استاد نامشخص"}</span>
              </span>

              {/* Week Type Badge */}
              {classItem.weekType && classItem.weekType !== "all" && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  {classItem.weekType === "even" ? "هفته زوج" : "هفته فرد"}
                </span>
              )}

              {/* Second Session indicator */}
              {classItem.hasSecondSession && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                  ۲ جلسه در هفته
                </span>
              )}
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
              <span className="truncate">{classItem.courseName}</span>
            </h2>
          </div>

          {/* Compact Metadata Strip (Unified Single Row) */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 mb-3.5">
            {/* Session 1 */}
            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{classItem.weekday} ساعت {toPersianDigits(classItem.startTime)} تا {toPersianDigits(classItem.endTime)}</span>
            </div>

            {/* Location */}
            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {onFocusBuildingOnMap && classItem.location ? (
                <button
                  type="button"
                  onClick={() => onFocusBuildingOnMap(classItem.location)}
                  className="hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  title="مشاهده روی نقشه دانشگاه"
                >
                  {classItem.location}
                </button>
              ) : (
                <span className="truncate">{classItem.location || "مکان تعیین‌نشده"}</span>
              )}
            </div>

            {/* Session 2 (if active) */}
            {classItem.hasSecondSession && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/80 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>جلسه ۲: {classItem.secondWeekday} ساعت {toPersianDigits(classItem.secondStartTime || classItem.startTime)} تا {toPersianDigits(classItem.secondEndTime || classItem.endTime)}</span>
                {classItem.secondLocation && <span>({classItem.secondLocation})</span>}
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODERN SEGMENTED TABS (STRICTLY SINGLE LINE)                      */}
        {/* ================================================================= */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("notes")}
              className={`py-2 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "notes"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>یادداشت‌ها</span>
              {(classItem.notes?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(classItem.notes?.length || 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("files")}
              className={`py-2 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "files"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0" />
              <span>فایل‌ها</span>
              {(classItem.attachments?.length || 0) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(classItem.attachments?.length || 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("absences")}
              className={`py-2 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "absences"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>غیبت‌ها</span>
              {absences.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isAbsenceExceeded ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200" : "bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200"}`}>
                  {toPersianDigits(absences.length)}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`py-2 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-black whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>ارزیابی</span>
              {(relatedExams.length + relatedProjects.length) > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                  {toPersianDigits(relatedExams.length + relatedProjects.length)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB CONTENTS (SCROLLABLE)                                         */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-20 sm:pb-8 bg-slate-100/60 dark:bg-slate-950/70">
          
          {/* TAB 1: NOTES */}
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

              {/* Note Composer Box */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-3 sm:p-4 shadow-xs space-y-3">
                <textarea 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  placeholder="نکات مهم درس، منابع امتحانی و توضیحات تکالیف را بنویسید..." 
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-100 min-h-[90px] resize-y" 
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-bold">
                    {newNote.length > 0 ? `${toPersianDigits(newNote.length)} کاراکتر` : ""}
                  </span>
                  <button 
                    type="button"
                    onClick={handleAddNote} 
                    disabled={!newNote.trim()}
                    className="h-9 px-5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>ثبت یادداشت</span>
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3 mt-4">
                {(classItem.notes || []).length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-1">یادداشتی برای این درس ثبت نشده است</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">نکات کلاسی و منابع اعلام‌شده توسط استاد را اینجا یادداشت کنید.</p>
                  </div>
                ) : (
                  (classItem.notes || []).map(note => (
                    <div 
                      key={note.id} 
                      className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2.5"
                    >
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                        {note.text}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                        <span>
                          {note.timestamp ? new Date(note.timestamp).toLocaleDateString("fa-IR") : "یادداشت کلاسی"}
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
                            <Trash className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FILES & SYLLABI */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <label className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-xs group">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 block">
                    {isUploading ? "در حال ذخیره‌سازی فایل..." : "افزودن جزوه، فایل صوتی یا اسلاید درس"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                    ذخیره امن جزوات و اسناد کلاسی در دستگاه شما
                  </span>
                </div>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {(classItem.attachments || []).length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <File className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-1">هنوز فایلی برای این درس ثبت نشده است</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">جزوات، خلاصه‌ها و نمونه سوالات استاد را اینجا آپلود کنید.</p>
                  </div>
                ) : (
                  (classItem.attachments || []).map(att => {
                    const isOpening = openingFileId === att.id;
                    const isImg = att.fileType.includes("image");
                    const isPdf = att.fileType.includes("pdf") || att.fileName.endsWith(".pdf");

                    return (
                      <div 
                        key={att.id} 
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isOpening 
                            ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-md" 
                            : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div 
                          className={`flex items-center gap-2.5 flex-1 min-w-0 ${isOpening ? "cursor-wait" : "cursor-pointer"}`} 
                          onClick={() => !openingFileId && handleOpenFile(att)}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPdf 
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500" 
                              : isImg 
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" 
                              : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500"
                          }`}>
                            {isOpening ? (
                              <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            ) : isImg ? (
                              <ImageIcon className="w-4.5 h-4.5" />
                            ) : (
                              <File className="w-4.5 h-4.5" />
                            )}
                          </div>
                          <div className="min-w-0 pr-1">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{att.fileName}</p>
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
                          onClick={(e) => { e.stopPropagation(); setFileToDelete(att.id); }} 
                          className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                          title="حذف فایل"
                        >
                          <Trash className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ABSENCES */}
          {activeTab === "absences" && (
            <div className="space-y-4">
              {/* Absences Counter Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs text-center space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200">وضعیت حضور و غیاب</span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    isAbsenceExceeded 
                      ? "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800" 
                      : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                  }`}>
                    {isAbsenceExceeded ? "⚠️ بیش از حد مجاز غیبت" : "مجاز (حداکثر ۳ جلسه)"}
                  </span>
                </div>

                <div className="py-2">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
                    <span className={isAbsenceExceeded ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"}>
                      {toPersianDigits(absences.length)}
                    </span>
                    <span className="text-base text-slate-400 font-bold">از ۳ جلسه مجاز</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleAddAbsence} 
                  className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>ثبت یک جلسه غیبت برای امروز</span>
                </button>
              </div>

              {/* Absences History List */}
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 px-1">تاریخچه‌ غیبت‌های ثبت‌شده:</h4>
                {absences.length === 0 ? (
                  <div className="py-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">بدون هیچ غیبت ثبت‌شده</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">شما در تمامی جلسات این درس حضور داشته‌اید.</p>
                  </div>
                ) : (
                  absences.map((abs, idx) => (
                    <div 
                      key={abs.id} 
                      className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-black flex items-center justify-center">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                          تاریخ غیبت: {toPersianDigits(abs.date)}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleDeleteAbsence(abs.id)} 
                        className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center justify-center cursor-pointer shrink-0"
                        title="حذف غیبت"
                      >
                        <Trash className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EVALUATIONS (EXAMS & PROJECTS) */}
          {activeTab === "tasks" && (
            <div className="space-y-5">
              {/* Exams Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-500 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">امتحانات این درس</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onAddExam(classItem.courseName)} 
                    className="h-7 px-3 text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded-lg inline-flex items-center gap-1 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>امتحان جدید</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {relatedExams.length === 0 ? (
                    <div className="py-6 text-center bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                      <p className="text-xs font-bold text-slate-400">هیچ امتحانی برای این درس تعریف نشده است.</p>
                    </div>
                  ) : (
                    relatedExams.map(exam => (
                      <div 
                        key={exam.id} 
                        onClick={() => onOpenExamProfile(exam)} 
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-all flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            exam.type === "پایان‌ترم"
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                          }`}>
                            {exam.type}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
                            {toPersianDigits(exam.date)}
                          </span>
                          {exam.time && (
                            <span className="text-[11px] text-slate-400 font-bold">
                              ساعت {toPersianDigits(exam.time)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-purple-600 dark:text-purple-400 group-hover:translate-x-[-2px] transition-transform">
                            مشاهده پروفایل ‹
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Projects Section */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">پروژه‌های این درس</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onAddProject(classItem.courseName)} 
                    className="h-7 px-3 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span>پروژه جدید</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {relatedProjects.length === 0 ? (
                    <div className="py-6 text-center bg-white dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                      <p className="text-xs font-bold text-slate-400">هیچ پروژه‌ای برای این درس تعریف نشده است.</p>
                    </div>
                  ) : (
                    relatedProjects.map(proj => (
                      <div 
                        key={proj.id} 
                        onClick={() => onOpenProjectProfile(proj)} 
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex justify-between items-center group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                            {proj.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                            موعد: {toPersianDigits(proj.deadline)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-[-2px] transition-transform">
                            مشاهده پروفایل ‹
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Delete Confirmation Modal */}
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
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1.5">حذف فایل درس</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6">آیا از حذف این فایل اطمینان دارید؟ این فایل از حافظه دستگاه پاک خواهد شد.</p>
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
