/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { ProjectItem } from "../types";
import { Plus, Trash, Clock, Layout, AlertCircle, Edit, User, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CustomDatePicker, CustomTimePicker } from "./CustomDateTimePicker";
import { ReminderType } from "../types";
import { compareChronologicalTimestamps, toEnglishDigits } from "../utils/dateUtils";

interface ProjectBoardProps {
  projects: ProjectItem[];
  onAddProject: (newProj: Omit<ProjectItem, "id">) => void;
  onUpdateProjectStatus: (id: string, status: ProjectItem["status"]) => void;
  onEditProject: (id: string, updatedProj: Omit<ProjectItem, "id">) => void;
  onDeleteProject: (id: string) => void;
  onOpenProfile?: (project: ProjectItem) => void;
  pendingAddCourse?: string | null;
  onClearPendingAdd?: () => void;
}

export default function ProjectBoard({ projects, onAddProject, onUpdateProjectStatus, onEditProject, onDeleteProject, onOpenProfile, pendingAddCourse, onClearPendingAdd }: ProjectBoardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<ProjectItem["priority"]>("medium");
  const [status, setStatus] = useState<ProjectItem["status"]>("not_started");
  const [reminders, setReminders] = useState<ReminderType[]>(["2days", "1day"]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingAddCourse) {
      setEditingId(null);
      setCourseName(pendingAddCourse);
      setTitle(""); setDeadline(""); setTime("");
      setPriority("medium"); setStatus("not_started"); setReminders(["2days", "1day"]);
      setShowCustomInput(false);
      setShowAddModal(true);
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAddCourse, onClearPendingAdd]);

  const openEditModal = (p: ProjectItem) => {
    setEditingId(p.id);
    setTitle(p.title);
    setCourseName(p.courseName);
    setDeadline(p.deadline);
    setTime(p.time || "");
    setPriority(p.priority);
    setStatus(p.status);
    setReminders(p.reminders || ["2days", "1day"]);
    setShowCustomInput(false);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle(""); setCourseName(""); setDeadline(""); setTime("");
    setPriority("medium");
    setStatus("not_started");
    setReminders(["2days", "1day"]);
    setShowCustomInput(false);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormError(null);
    setTimeout(() => {
      setEditingId(null);
      setTitle(""); setCourseName(""); setDeadline(""); setTime("");
      setPriority("medium");
      setStatus("not_started");
    }, 200);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("عنوان پروژه را وارد کنید.");
      return;
    }
    if (!deadline) {
      setFormError("مهلت تحویل را انتخاب کنید.");
      return;
    }
    setFormError(null);
    if (editingId) {
      onEditProject(editingId, { title, courseName, deadline, time, priority, status, reminders });
    } else {
      onAddProject({ title, courseName, deadline, time, priority, status: "not_started", reminders });
    }
    closeModal();
  };

  const sortedProjects = [...projects].sort((a, b) => {
    const statusOrder = { "not_started": 0, "in_progress": 1, "submitted": 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return compareChronologicalTimestamps(a.deadline, a.time, b.deadline, b.time);
  });

  return (
    <div className="px-2.5 sm:px-4 pt-2.5 sm:pt-4 space-y-4 sm:space-y-6 text-right pb-36" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5 sm:gap-3">
           <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" /> 
           پروژه‌های درسی
        </h2>
        <button onClick={openAddModal} className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-900 text-white rounded-xl sm:rounded-[1.25rem] flex items-center justify-center shadow-xl dark:shadow-none shadow-slate-900/20 active:scale-95 transition-all"><Plus className="h-5 w-5 sm:h-6 sm:w-6" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
        {sortedProjects.length === 0 ? (
          <div className="col-span-full py-16 sm:py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 border-dashed">
            <Layout className="h-12 w-12 sm:h-14 sm:w-14 mx-auto text-slate-300 mb-4" />
            <p className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500">پروژه‌ای ثبت نشده است.</p>
          </div>
        ) : (
          sortedProjects.map((p, index) => {
            const priorityColor = p.priority === "high" ? "bg-rose-500" : p.priority === "medium" ? "bg-amber-500" : "bg-emerald-500";
            return (
              <div key={p.id} className={`relative transition-all ${p.status === "submitted" ? "opacity-50" : ""}`}>
                <div 
                  className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none flex flex-col gap-3 sm:gap-4 relative z-10 overflow-hidden transition-all hover:shadow-md cursor-pointer"
                  onClick={() => onOpenProfile && onOpenProfile(p)}
                >
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${priorityColor}`}></div>
                  
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base mb-1 truncate">{p.title}</p>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 opacity-80 uppercase tracking-widest mb-2 sm:mb-3 truncate">{p.courseName}</p>
                      
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl whitespace-nowrap">
                        <Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-400" /> 
                        <span>{p.deadline}</span>
                        {p.time && <span className="text-slate-300 dark:text-slate-600">•</span>}
                        {p.time && <span>{p.time}</span>}
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-[10px] text-[10px] font-black shrink-0 ${p.priority === "high" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : p.priority === "medium" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"}`}>
                      {p.priority === "high" ? "اولویت بالا" : p.priority === "medium" ? "اولویت متوسط" : "اولویت کم"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-50 dark:border-slate-700/50" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 flex-1">
                      {(["not_started", "in_progress", "submitted"] as const).map(s => (
                        <button key={s} onClick={() => onUpdateProjectStatus(p.id, s)} className={`flex-1 h-9 rounded-xl text-[10px] font-black transition-all inline-flex items-center justify-center cursor-pointer ${p.status === s ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:text-emerald-500"}`}>
                          {s === "not_started" ? "شروع" : s === "in_progress" ? "اجرا" : "پایان"}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 relative z-20" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditModal(p)} aria-label="ویرایش" className="h-9 w-9 sm:h-10 sm:w-10 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 transition-colors inline-flex items-center justify-center rounded-xl shrink-0 cursor-pointer"><Edit className="h-4.5 w-4.5 shrink-0" /></button>
                      <button onClick={() => setDeleteConfirmId(p.id)} aria-label="حذف" className="h-9 w-9 sm:h-10 sm:w-10 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-900/50 hover:bg-rose-50 transition-colors inline-flex items-center justify-center rounded-xl shrink-0 cursor-pointer"><Trash className="h-4.5 w-4.5 shrink-0" /></button>
                    </div>
                  </div>
                  
                  {onOpenProfile && (
                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-700/50 relative z-20">
                      <button onClick={(e) => { e.stopPropagation(); onOpenProfile(p); }} className="w-full h-9 bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors inline-flex items-center justify-center gap-2">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        مشاهده پروفایل پروژه
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 bg-slate-950/80 z-[200] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
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
                  <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0"><Layout className="h-6 w-6" /></div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white truncate">{editingId ? "ویرایش پروژه" : "افزودن پروژه جدید"}</h3>
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
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان پروژه (مثلا: گزارش آزمایشگاه)" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black outline-none focus:border-emerald-500 transition-colors" />
                <input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="نام درس" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black outline-none focus:border-emerald-500 transition-colors" />
                <div className="grid grid-cols-2 gap-4">
                  <CustomDatePicker label="موعد تحویل" value={deadline} onChange={setDeadline} />
                  <CustomTimePicker label="ساعت تحویل" value={time} onChange={setTime} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2">اهمیت پروژه</label>
                  <div className="flex p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {(["low", "medium", "high"] as const).map(pr => (
                      <button key={pr} type="button" onClick={() => setPriority(pr)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${priority === pr ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600" : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80"}`}>{pr === "low" ? "کم" : pr === "medium" ? "متوسط" : "بالا"}</button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2">زمان‌های یادآوری</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["2days", "1day", "1hour"] as const).map(r => {
                      const isActive = reminders.includes(r);
                      const label = r === "2days" ? "۲ روز قبل" : r === "1day" ? "۱ روز قبل" : "۱ ساعت قبل";
                      return (
                        <button 
                          key={r} type="button" 
                          onClick={() => {
                            if (isActive) setReminders(reminders.filter(x => x !== r));
                            else setReminders([...reminders, r]);
                          }} 
                          className={`py-2.5 rounded-xl text-[10px] font-black transition-all border ${isActive ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                    
                    {reminders.filter(r => r.startsWith("custom_")).map(r => {
                      const days = r.replace("custom_", "");
                      return (
                        <button 
                          key={r} type="button" 
                          onClick={() => setReminders(reminders.filter(x => x !== r))} 
                          className="py-2.5 rounded-xl text-[10px] font-black transition-all border bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50"
                        >
                          {days} روز قبل <span className="text-emerald-600/70 dark:text-emerald-400/70 mr-1">(حذف)</span>
                        </button>
                      );
                    })}

                    {showCustomInput ? (
                      <div className="flex bg-slate-50 dark:bg-slate-900 border border-emerald-500 rounded-xl overflow-hidden col-span-2">
                        <input 
                          type="number" 
                          min="1"
                          autoFocus
                          value={customDaysInput} 
                          onChange={e => setCustomDaysInput(e.target.value)} 
                          placeholder="چند روز؟" 
                          className="w-full bg-transparent text-[10px] font-black text-center outline-none px-2 py-2.5 text-slate-700 dark:text-slate-300"
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const days = parseInt(toEnglishDigits(customDaysInput));
                            if (!isNaN(days) && days > 0) {
                              const r = `custom_${days}`;
                              if (!reminders.includes(r)) setReminders([...reminders, r]);
                            }
                            setShowCustomInput(false);
                            setCustomDaysInput("");
                          }} 
                          className="bg-emerald-500 text-white px-4 font-black text-[10px] transition-colors hover:bg-emerald-600"
                        >
                          تأیید
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setShowCustomInput(true)} 
                        className="py-2.5 rounded-xl text-[10px] font-black transition-all border bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-dashed border-slate-300 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        + دلخواه
                      </button>
                    )}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-rose-500 text-center bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    {formError}
                  </p>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-5 text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl hover:bg-slate-100 dark:bg-slate-800 transition-colors">انصراف</button>
                  <button type="submit" className="flex-1 py-5 text-xs font-black text-white bg-emerald-500 rounded-2xl shadow-xl dark:shadow-none shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 transition-colors">{editingId ? "ذخیره تغییرات" : "ثبت پروژه"}</button>
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
            className="fixed inset-0 bg-slate-950/80 z-[250] flex items-center justify-center p-4"
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
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white mb-2">حذف پروژه</h3>
              <p className="text-sm font-bold text-center text-slate-500 dark:text-slate-400 mb-6">آیا از حذف این پروژه اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">انصراف</button>
                <button onClick={() => { onDeleteProject(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-3.5 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors">بله، حذف شود</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
