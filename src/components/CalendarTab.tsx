import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Edit3, Clock, FileText, CheckCircle, Plus, Trash2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExamItem, ProjectItem } from "../types";
import { getOccasion, getCalendarMonthInfo } from "../calendarData";
import * as jalaali from "jalaali-js";

const getTehranDate = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
};

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export interface CalendarTabProps {
  notes: Record<string, string[]>;
  onSaveNote: (dateKey: string, note: string[]) => void;
  onDeleteNote: (dateKey: string, index?: number) => void;
  exams?: ExamItem[];
  projects?: ProjectItem[];
}

export default function CalendarTab({ notes, onSaveNote, onDeleteNote, exams = [], projects = [] }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const todayTehran = getTehranDate();
    const todayJ = jalaali.toJalaali(todayTehran.getFullYear(), todayTehran.getMonth() + 1, todayTehran.getDate());
    return { jy: todayJ.jy, jm: todayJ.jm, jd: 1 };
  });
  
  const [selectedDate, setSelectedDate] = useState<{ jy: number; jm: number; jd: number } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState<{ key: string; index: number } | null>(null);
  const [direction, setDirection] = useState(0);

  const gridInfo = getCalendarMonthInfo(currentDate.jy, currentDate.jm);
  const daysInMonth = gridInfo.length;
  const startingDayOfWeek = gridInfo.start;

  // Cache today's date so it's not calculated 30 times in the render loop
  const todayTehran = getTehranDate();
  const todayDate = jalaali.toJalaali(todayTehran.getFullYear(), todayTehran.getMonth() + 1, todayTehran.getDate());

  const prevMonth = () => {
    let { jy, jm } = currentDate;
    if (jm === 1) { 
      jm = 12;
      jy -= 1;
    } else {
      jm -= 1;
    }
    setDirection(-1);
    setCurrentDate({ jy, jm, jd: 1 });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    let { jy, jm } = currentDate;
    if (jm === 12) { 
      jm = 1;
      jy += 1;
    } else {
      jm += 1;
    }
    setDirection(1);
    setCurrentDate({ jy, jm, jd: 1 });
    setSelectedDate(null);
  };
  
  const toPersianNum = (num: number) => num.toString().replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  const getDateKey = (jy: number, jm: number, jd: number) => `${jy}-${jm}-${jd}`;
  
  const getFormattedDateString = (jd: number, jm: number) => {
    return `${toPersianNum(jd)} ${PERSIAN_MONTHS[jm - 1]}`;
  };

  const getSafeNotes = (key: string): string[] => {
    const val = (notes || {})[key];
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [String(val)];
  };

  const getDayEvents = (jd: number, jm: number) => {
    const dateStr = getFormattedDateString(jd, jm);
    const dayExams = exams.filter(e => e.date === dateStr);
    const dayProjects = projects.filter(p => p.deadline === dateStr);
    return { dayExams, dayProjects };
  };

  const handleDayClick = (jd: number) => {
    setSelectedDate({ jy: currentDate.jy, jm: currentDate.jm, jd });
    setNoteText("");
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };
  
  const handleAddNote = () => {
    if (!selectedDate || !noteText.trim()) return;
    const key = getDateKey(selectedDate.jy, selectedDate.jm, selectedDate.jd);
    const currentNotes = getSafeNotes(key);
    
    if (editingNote && editingNote.key === key) {
      const updatedNotes = [...currentNotes];
      updatedNotes[editingNote.index] = noteText.trim();
      onSaveNote(key, updatedNotes);
      setEditingNote(null);
    } else {
      onSaveNote(key, [...currentNotes, noteText.trim()]);
    }
    setNoteText("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 text-right pb-32 pt-1 sm:pt-2" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Calendar Grid Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button onClick={prevMonth} className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center transition-colors">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                {PERSIAN_MONTHS[currentDate.jm - 1]} {toPersianNum(currentDate.jy)}
              </h3>
            </div>
            <button onClick={nextMonth} className="h-8 w-8 sm:h-10 sm:w-10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500">{d}</div>
            ))}
          </div>

          <div className="-m-1 sm:-m-2 p-1 sm:p-2 overflow-hidden">
            <div className="relative min-h-[290px] sm:min-h-[320px]">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={`${currentDate.jy}-${currentDate.jm}`}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({ x: dir > 0 ? -250 : 250, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (dir: number) => ({ x: dir < 0 ? -250 : 250, opacity: 0 })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className="grid grid-cols-7 gap-1 sm:gap-2 absolute top-0 left-0 w-full"
                >
                  {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-full max-w-[44px] h-10 sm:h-11 mx-auto"></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const jd = i + 1;
                    const dateKey = getDateKey(currentDate.jy, currentDate.jm, jd);
                    const dayNotes = getSafeNotes(dateKey);
                    const hasNote = dayNotes.length > 0;
                    const occasion = getOccasion(currentDate.jy, currentDate.jm, jd);
                    const isFriday = (startingDayOfWeek + i) % 7 === 6;
                    const isHoliday = isFriday || (occasion?.isHoliday);
                    const isNonHolidayEvent = occasion && !occasion.isHoliday && !isFriday;
                    
                    const { dayExams, dayProjects } = getDayEvents(jd, currentDate.jm);
                    const hasExam = dayExams.length > 0;
                    const hasProject = dayProjects.length > 0;
                    
                    const isToday = todayDate.jy === currentDate.jy && todayDate.jm === currentDate.jm && todayDate.jd === jd;
                    const isSelected = selectedDate?.jy === currentDate.jy && selectedDate?.jm === currentDate.jm && selectedDate?.jd === jd;

                    let bgColor = "bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
                    if (isToday) bgColor = "bg-purple-600 text-white shadow-md shadow-purple-500/30";
                    else if (isHoliday) bgColor = "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400";
                    else if (isNonHolidayEvent) bgColor = "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";

                    return (
                      <button 
                        key={jd} 
                        onClick={() => handleDayClick(jd)}
                        className={`relative w-full max-w-[44px] h-10 sm:h-11 mx-auto flex flex-col items-center justify-center rounded-xl transition-all active:scale-90
                          ${isSelected ? "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900 bg-purple-50 dark:bg-purple-900/20" : ""}
                          ${bgColor}`}
                      >
                        <span className={`text-xs sm:text-sm font-black ${isToday ? "text-white" : ""}`}>{toPersianNum(jd)}</span>
                        
                        <div className="absolute bottom-1 flex gap-0.5 justify-center w-full">
                          {hasNote && <div className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-purple-500"}`}></div>}
                          {hasExam && <div className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-amber-500"}`}></div>}
                          {hasProject && <div className={`w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-emerald-500"}`}></div>}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Selected Date Details / Empty Placeholder on iPad */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedDate ? (
              <motion.div 
                key={`${selectedDate.jy}-${selectedDate.jm}-${selectedDate.jd}`}
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 15 }}
                className="bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl shadow-purple-900/5 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden"
              >
                {/* Background Decorative Blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-bl-[100px] -z-10 opacity-50 pointer-events-none"></div>

                <div className="flex items-start justify-between mb-4 sm:mb-6 relative z-10">
                  <div>
                    <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                      {toPersianNum(selectedDate.jd)} {PERSIAN_MONTHS[selectedDate.jm - 1]}
                    </h3>
                  </div>
                  {(() => {
                    const occasion = getOccasion(selectedDate.jy, selectedDate.jm, selectedDate.jd);
                    if (!occasion) return null;
                    return (
                      <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-black border flex items-center gap-1.5 ${
                        occasion.isHoliday 
                          ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800/30 dark:text-rose-400" 
                          : "bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800/30 dark:text-indigo-400"
                      }`}>
                        {occasion.isHoliday ? <CheckCircle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                        {occasion.title}
                      </span>
                    );
                  })()}
                </div>

                {/* Events List */}
                {(() => {
                  const { dayExams, dayProjects } = getDayEvents(selectedDate.jd, selectedDate.jm);
                  if (dayExams.length === 0 && dayProjects.length === 0) return null;
                  
                  return (
                    <div className="mb-6 space-y-2.5 relative z-10">
                      {dayExams.map(ex => (
                        <div key={ex.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center">
                              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-900 dark:text-amber-500">امتحان {ex.courseName}</p>
                              <p className="text-[9px] text-amber-700 dark:text-amber-600/80 mt-0.5">ساعت {ex.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dayProjects.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
                              <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-emerald-900 dark:text-emerald-500">پروژه {p.courseName}</p>
                              <p className="text-[9px] text-emerald-700 dark:text-emerald-600/80 mt-0.5">{p.title}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Note Section */}
                <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Edit3 className="h-3.5 w-3.5 text-purple-500" />
                    یادداشت‌های شخصی
                  </h4>

                  {/* Render Existing Notes */}
                  <div className="space-y-2.5 mb-3">
                    {(() => {
                      const key = getDateKey(selectedDate.jy, selectedDate.jm, selectedDate.jd);
                      const dayNotes = getSafeNotes(key);
                      if (dayNotes.length === 0) {
                        return (
                          <div className="text-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">یادداشتی ثبت نشده است</p>
                          </div>
                        );
                      }
                      return dayNotes.map((note, idx) => (
                        <div key={idx} className="group flex items-start justify-between gap-2.5 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium mt-0.5">{note}</p>
                          <div className="flex items-center gap-1 transition-all shrink-0">
                            <button 
                              onClick={() => {
                                setEditingNote({ key, index: idx });
                                setNoteText(note);
                              }}
                              className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                if (editingNote?.key === key && editingNote?.index === idx) {
                                  setEditingNote(null);
                                  setNoteText("");
                                }
                                onDeleteNote(key, idx);
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Add New Note */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                      placeholder="یادداشت جدید..."
                      className="flex-1 px-3.5 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-purple-500 outline-none transition-colors text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                    />
                    {editingNote && (
                      <button
                        onClick={() => {
                          setEditingNote(null);
                          setNoteText("");
                        }}
                        className="h-10 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        انصراف
                      </button>
                    )}
                    <button 
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                      className={`h-10 px-3.5 text-white rounded-xl font-black text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer ${editingNote ? 'bg-indigo-600 hover:bg-indigo-700 disabled:hover:bg-indigo-600' : 'bg-purple-600 hover:bg-purple-700 disabled:hover:bg-purple-600'}`}
                    >
                      {editingNote ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      <span>{editingNote ? "ذخیره" : "ثبت"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 text-center min-h-[360px] shadow-sm">
                <div className="h-12 w-12 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <h4 className="font-black text-sm text-slate-800 dark:text-slate-200 mb-1">مشاهده جزئیات تقویم</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold max-w-xs">یک روز را از تقویم انتخاب کنید تا مناسبت‌ها، امتحانات، پروژه‌ها و یادداشت‌های آن نمایش داده شود.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
