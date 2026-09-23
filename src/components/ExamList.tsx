/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { ExamItem } from "../types";
import { Plus, Trash, Clock, MapPin, FileText, CheckCircle2, Edit, AlertCircle, Calendar, User, Edit3, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CustomDatePicker, CustomTimePicker } from "./CustomDateTimePicker";
import { ReminderType } from "../types";
import { getChronologicalTimestamp, compareChronologicalTimestamps, toEnglishDigits } from "../utils/dateUtils";

interface ExamListProps {
  exams: ExamItem[];
  onAddExam: (newEx: Omit<ExamItem, "id">) => void;
  onEditExam: (id: string, updatedExam: Omit<ExamItem, "id">) => void;
  onToggleCompleted: (id: string) => void;
  onDeleteExam: (id: string) => void;
  onOpenProfile?: (exam: ExamItem) => void;
  pendingAddCourse?: string | null;
  onClearPendingAdd?: () => void;
}

export default function ExamList({ exams, onAddExam, onEditExam, onToggleCompleted, onDeleteExam, onOpenProfile, pendingAddCourse, onClearPendingAdd }: ExamListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [courseName, setCourseName] = useState("");
  const [type, setType] = useState<"میان‌ترم" | "پایان‌ترم">("میان‌ترم");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminders, setReminders] = useState<ReminderType[]>(["2days", "1day"]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("");
  const [completed, setCompleted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      setFormError("نام درس را وارد کنید.");
      return;
    }
    if (!date) {
      setFormError("تاریخ امتحان را انتخاب کنید.");
      return;
    }
    setFormError(null);
    if (editingId) {
      onEditExam(editingId, { courseName, type, date, time, location, notes, completed, reminders });
    } else {
      onAddExam({ courseName, type, date, time, location, notes, reminders, completed: false });
    }
    closeModal();
  };

  useEffect(() => {
    if (pendingAddCourse) {
      setEditingId(null);
      setCourseName(pendingAddCourse); 
      setDate(""); setTime(""); setLocation(""); setNotes("");
      setType("میان‌ترم");
      setReminders(["2days", "1day"]);
      setShowCustomInput(false); setCustomDaysInput("");
      setShowAddModal(true);
      if (onClearPendingAdd) onClearPendingAdd();
    }
  }, [pendingAddCourse, onClearPendingAdd]);

  const openEditModal = (ex: ExamItem) => {
    setEditingId(ex.id);
    setCourseName(ex.courseName);
    setType(ex.type);
    setDate(ex.date);
    setTime(ex.time || "");
    setLocation(ex.location || "");
    setNotes(ex.notes || "");
    setReminders(ex.reminders || ["2days", "1day"]);
    setCompleted(!!ex.completed);
    setShowCustomInput(false);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setCourseName(""); setDate(""); setTime(""); setLocation(""); setNotes("");
    setType("میان‌ترم");
    setReminders(["2days", "1day"]);
    setCompleted(false);
    setShowCustomInput(false);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormError(null);
    setTimeout(() => {
      setEditingId(null);
      setCourseName(""); setDate(""); setTime(""); setLocation(""); setNotes("");
      setCompleted(false);
    }, 200);
  };

  const sortedExams = [...exams].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return compareChronologicalTimestamps(a.date, a.time, b.date, b.time);
  });

  return (
    <div className="px-2.5 sm:px-4 pt-2.5 sm:pt-4 space-y-4 sm:space-y-6 text-right pb-36" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl flex items-center gap-2.5 sm:gap-3">
           <div className="w-1.5 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" /> 
           لیست امتحانات
        </h2>
        <button onClick={openAddModal} className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-900 text-white rounded-xl sm:rounded-[1.25rem] flex items-center justify-center shadow-xl dark:shadow-none shadow-slate-900/20 active:scale-95 transition-all"><Plus className="h-5 w-5 sm:h-6 sm:w-6" /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start">
        {sortedExams.length === 0 ? (
          <div className="col-span-full py-16 sm:py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 border-dashed">
            <Clock className="h-12 w-12 sm:h-14 sm:w-14 mx-auto text-slate-300 mb-4" />
            <p className="text-xs sm:text-sm font-black text-slate-400 dark:text-slate-500">امتحانی ثبت نشده است.</p>
          </div>
        ) : (
          sortedExams.map((exam, index) => {
            const isMidterm = exam.type === "میان‌ترم";
            const accentColor = isMidterm ? "bg-amber-500" : "bg-rose-500";
            return (
              <div 
                key={exam.id} 
                className={`relative transition-all ${exam.completed ? "opacity-50" : ""} cursor-pointer`}
                onClick={() => onOpenProfile && onOpenProfile(exam)}
              >
                
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm dark:shadow-none flex flex-col gap-3 sm:gap-4 relative z-10 overflow-hidden hover:shadow-md">
                  <div className={`absolute top-0 right-0 w-1.5 h-full ${accentColor}`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 sm:gap-4 min-w-0">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center shrink-0 ${isMidterm ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-500"}`}>
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">{exam.courseName}</p>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1">{exam.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-20" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditModal(exam)} aria-label="ویرایش" className="h-9 w-9 sm:h-10 sm:w-10 text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 rounded-xl transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"><Edit className="h-4.5 w-4.5 shrink-0" /></button>
                      <button onClick={() => setDeleteConfirmId(exam.id)} aria-label="حذف" className="h-9 w-9 sm:h-10 sm:w-10 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-900/50 hover:bg-rose-50 rounded-xl transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"><Trash className="h-4.5 w-4.5 shrink-0" /></button>
                    </div>
                  </div>

                  {onOpenProfile && (
                    <div className="mt-1 pt-3 border-t border-slate-50 dark:border-slate-700/50 relative z-20">
                      <button onClick={(e) => { e.stopPropagation(); onOpenProfile(exam); }} className="w-full h-9 bg-amber-50/50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-black rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        مشاهده پروفایل امتحان
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex-wrap sm:flex-nowrap gap-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center flex-wrap gap-2.5 text-[10px] font-black text-slate-500 dark:text-slate-400 min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {exam.date} • {exam.time || "؟"}</span>
                      {exam.location && <span className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 shrink-0"><MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {exam.location}</span>}
                    </div>
                    <button onClick={() => onToggleCompleted(exam.id)} aria-label="تغییر وضعیت انجام" className={`h-9 w-9 rounded-xl inline-flex items-center justify-center transition-all shrink-0 cursor-pointer ${exam.completed ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-300 hover:text-emerald-500 hover:border-emerald-200"}`}><CheckCircle2 className="h-4.5 w-4.5 shrink-0" /></button>
                  </div>
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
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
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
                  <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-500 shrink-0"><Edit3 className="h-6 w-6" /></div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white truncate">{editingId ? "ویرایش امتحان" : "افزودن امتحان جدید"}</h3>
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
                <input required value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="نام درس (مثلا: فیزیک ۲)" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black focus:border-amber-500 outline-none transition-colors" />
                <div className="flex p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <button type="button" onClick={() => setType("میان‌ترم")} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${type === "میان‌ترم" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>میان‌ترم</button>
                  <button type="button" onClick={() => setType("پایان‌ترم")} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${type === "پایان‌ترم" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>پایان‌ترم</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomDatePicker label="تاریخ امتحان" value={date} onChange={setDate} />
                  <CustomTimePicker label="ساعت برگزاری" value={time} onChange={setTime} />
                </div>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="مکان برگزاری (کلاس/سایت)" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black outline-none focus:border-amber-500 transition-colors" />
                
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
                          className={`py-2.5 rounded-xl text-[10px] font-black transition-all border ${isActive ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80"}`}
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
                          className="py-2.5 rounded-xl text-[10px] font-black transition-all border bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50"
                        >
                          {days} روز قبل <span className="text-amber-600/70 dark:text-amber-400/70 mr-1">(حذف)</span>
                        </button>
                      );
                    })}

                    {showCustomInput ? (
                      <div className="flex bg-slate-50 dark:bg-slate-900 border border-amber-500 rounded-xl overflow-hidden col-span-2">
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
                          className="bg-amber-500 text-white px-4 font-black text-[10px] transition-colors hover:bg-amber-600"
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
                  <button type="submit" className="flex-1 py-5 text-xs font-black text-white bg-amber-500 rounded-2xl shadow-xl dark:shadow-none shadow-amber-100 dark:shadow-none hover:bg-amber-600 transition-colors">{editingId ? "ذخیره تغییرات" : "ثبت امتحان"}</button>
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
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
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
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white mb-2">حذف امتحان</h3>
              <p className="text-sm font-bold text-center text-slate-500 dark:text-slate-400 mb-6">آیا از حذف این امتحان اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">انصراف</button>
                <button onClick={() => { onDeleteExam(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 py-3.5 bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-colors">بله، حذف شود</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
