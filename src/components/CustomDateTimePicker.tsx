/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, X } from "lucide-react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import * as jalaali from "jalaali-js";
import { PERSIAN_MONTHS, toPersianDigits, toEnglishDigits } from "../utils/dateUtils";

interface CustomDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  triggerClassName?: string;
  themeColor?: "amber" | "rose" | "indigo";
}

/**
 * Returns the maximum days in a given Persian month for the given (or current) Persian year:
 * Months 1-6 (Farvardin-Shahrivar): 31 days
 * Months 7-11 (Mehr-Bahman): 30 days
 * Month 12 (Esfand): 30 in leap years, 29 otherwise
 */
function getDaysInPersianMonth(monthName: string, jy?: number): number {
  const idx = PERSIAN_MONTHS.indexOf(monthName as (typeof PERSIAN_MONTHS)[number]);
  const year =
    jy ??
    (() => {
      try {
        const now = new Date();
        return jalaali.toJalaali(
          now.getFullYear(),
          now.getMonth() + 1,
          now.getDate()
        ).jy;
      } catch {
        return 1404;
      }
    })();
  if (idx >= 0) {
    try {
      return jalaali.jalaaliMonthLength(year, idx + 1);
    } catch {
      /* fall through */
    }
  }
  if (idx >= 0 && idx <= 5) return 31;
  if (idx >= 6 && idx <= 10) return 30;
  return jalaali.isLeapJalaaliYear(year) ? 30 : 29;
}

/**
 * Returns the index of the item whose vertical center is closest to the
 * container's vertical center. More reliable than scrollTop / itemHeight
 * because sticky headers and spacer divs shift the actual layout.
 */
function getCenteredIndex(container: HTMLElement, idPrefix: string): number {
  const items = Array.from(container.querySelectorAll<HTMLElement>(`[id^="${idPrefix}"]`));
  if (items.length === 0) return -1;
  const cRect = container.getBoundingClientRect();
  const centerY = cRect.top + cRect.height / 2;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    const mid = r.top + r.height / 2;
    const d = Math.abs(mid - centerY);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export const CustomDatePicker = ({ value, onChange, label }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [day, setDay] = useState("۱");
  const [month, setMonth] = useState("فروردین");

  const daysScrollRef = useRef<HTMLDivElement>(null);
  const monthsScrollRef = useRef<HTMLDivElement>(null);

  const getTehranDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  };

  const getTodayJalali = () => {
    const today = getTehranDate();
    const dateObj = new DateObject({ date: today, calendar: persian, locale: persian_fa });
    return {
      day: toPersianDigits(dateObj.day),
      month: PERSIAN_MONTHS[dateObj.month.number - 1]
    };
  };

  const maxDays = getDaysInPersianMonth(month);
  const daysList = Array.from({ length: maxDays }, (_, i) => toPersianDigits(i + 1));

  // Clamp selected day if it exceeds the new month's maximum days
  const handleSelectMonth = (newMonth: string) => {
    setMonth(newMonth);
    const newMax = getDaysInPersianMonth(newMonth);
    const currentDayNum = parseInt(toEnglishDigits(day), 10);
    if (currentDayNum > newMax) {
      setDay(toPersianDigits(newMax));
    }
  };

  const handleConfirm = () => {
    onChange(`${day} ${month}`);
    setIsOpen(false);
  };

  const handleOpen = () => {
    if (value) {
      const parts = value.split(" ");
      if (parts.length >= 2) {
        setDay(parts[0]);
        setMonth(parts[1]);
      }
    } else {
      const today = getTodayJalali();
      setDay(today.day);
      setMonth(today.month);
    }
    setIsOpen(true);
  };

  // Scroll synchronization: update state when snapping
  const handleDaysScroll = () => {
    if (!daysScrollRef.current) return;
    const index = getCenteredIndex(daysScrollRef.current, "picker-day-");
    if (index >= 0 && daysList[index] && daysList[index] !== day) {
      setDay(daysList[index]);
    }
  };

  const handleMonthsScroll = () => {
    if (!monthsScrollRef.current) return;
    const index = getCenteredIndex(monthsScrollRef.current, "picker-month-");
    if (index >= 0 && PERSIAN_MONTHS[index] && PERSIAN_MONTHS[index] !== month) {
      handleSelectMonth(PERSIAN_MONTHS[index]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay scrolling until spring animation finishes for accurate offsets
      const timer = setTimeout(() => {
        document.getElementById(`picker-day-${day}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(`picker-month-${month}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative">
        {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 mb-1.5">{label}</label>}
        <div
          onClick={handleOpen}
          className="w-full h-[52px] px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-[11px] font-black cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>{value || "انتخاب تاریخ"}</span>
          <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/80 z-[300] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
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
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] sm:rounded-[3rem] p-6 shadow-2xl dark:shadow-none overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">انتخاب تاریخ</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="بستن"
                  className="h-9 w-9 bg-slate-100 dark:bg-slate-700/60 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-4 mb-6 h-48">
                {/* Days Column */}
                <div
                  ref={daysScrollRef}
                  onScroll={handleDaysScroll}
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-y-auto scrollbar-hide border border-slate-100 dark:border-slate-700 snap-y snap-mandatory relative"
                >
                  <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 py-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 z-10 border-b border-slate-200 dark:border-slate-700">روز</div>
                  <div className="h-[72px]"></div>
                  {daysList.map(d => (
                    <div
                      key={d}
                      id={`picker-day-${d}`}
                      onClick={() => setDay(d)}
                      className={`py-3 text-center text-xs font-black cursor-pointer snap-center transition-all ${day === d ? "bg-indigo-500 text-white shadow-md scale-105 rounded-xl m-1" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 m-1 rounded-xl"}`}
                    >
                      {d}
                    </div>
                  ))}
                  <div className="h-[72px]"></div>
                </div>

                {/* Months Column */}
                <div
                  ref={monthsScrollRef}
                  onScroll={handleMonthsScroll}
                  className="flex-[2] bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-y-auto scrollbar-hide border border-slate-100 dark:border-slate-700 snap-y snap-mandatory relative"
                >
                  <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 py-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 z-10 border-b border-slate-200 dark:border-slate-700">ماه</div>
                  <div className="h-[72px]"></div>
                  {PERSIAN_MONTHS.map(m => (
                    <div
                      key={m}
                      id={`picker-month-${m}`}
                      onClick={() => handleSelectMonth(m)}
                      className={`py-3 text-center text-xs font-black cursor-pointer snap-center transition-all ${month === m ? "bg-indigo-500 text-white shadow-md scale-105 rounded-xl m-1" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 m-1 rounded-xl"}`}
                    >
                      {m}
                    </div>
                  ))}
                  <div className="h-[72px]"></div>
                </div>
              </div>

              <button type="button" onClick={handleConfirm} className="w-full py-4 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-2xl shadow-xl dark:shadow-none shadow-indigo-200 dark:shadow-none transition-all cursor-pointer">تایید تاریخ</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const CustomTimePicker = ({ value, onChange, label, triggerClassName, themeColor = "amber" }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");

  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);

  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const colorClasses = {
    amber: { bg: "bg-amber-500", text: "text-amber-500", shadow: "shadow-amber-200", hover: "hover:bg-amber-600" },
    rose: { bg: "bg-rose-500", text: "text-rose-500", shadow: "shadow-rose-200", hover: "hover:bg-rose-600" },
    indigo: { bg: "bg-indigo-600", text: "text-indigo-600", shadow: "shadow-indigo-200", hover: "hover:bg-indigo-700" }
  };
  const theme = colorClasses[themeColor] || colorClasses.amber;

  const handleOpen = () => {
    if (value) {
      const [h, m] = value.split(":");
      setHour(h || "08");
      setMinute(m || "00");
    }
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  const handleHoursScroll = () => {
    if (!hoursScrollRef.current) return;
    const index = getCenteredIndex(hoursScrollRef.current, "picker-hour-");
    if (index >= 0 && hoursList[index] && hoursList[index] !== hour) {
      setHour(hoursList[index]);
    }
  };

  const handleMinutesScroll = () => {
    if (!minutesScrollRef.current) return;
    const index = getCenteredIndex(minutesScrollRef.current, "picker-minute-");
    if (index >= 0 && minutesList[index] && minutesList[index] !== minute) {
      setMinute(minutesList[index]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById(`picker-hour-${hour}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(`picker-minute-${minute}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative">
        {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 mb-1.5">{label}</label>}
        <div
          onClick={handleOpen}
          className={triggerClassName || "w-full h-[52px] px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-[11px] font-black cursor-pointer flex items-center justify-between text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"}
        >
          {value ? <span className="font-mono">{value}</span> : <span>انتخاب ساعت</span>}
          <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/80 z-[300] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
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
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] sm:rounded-[3rem] p-6 shadow-2xl dark:shadow-none overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">انتخاب ساعت</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="بستن"
                  className="h-9 w-9 bg-slate-100 dark:bg-slate-700/60 rounded-xl inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-4 mb-6 h-48" dir="ltr">
                {/* Hours */}
                <div
                  ref={hoursScrollRef}
                  onScroll={handleHoursScroll}
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-y-auto scrollbar-hide border border-slate-100 dark:border-slate-700 snap-y snap-mandatory relative"
                >
                  <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 py-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 z-10 border-b border-slate-200 dark:border-slate-700">ساعت</div>
                  <div className="h-[72px]"></div>
                  {hoursList.map(h => (
                    <div
                      key={h}
                      id={`picker-hour-${h}`}
                      onClick={() => setHour(h)}
                      className={`py-3 text-center text-xs font-black font-mono cursor-pointer snap-center transition-all ${hour === h ? `${theme.bg} text-white shadow-md scale-105 rounded-xl m-1` : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 m-1 rounded-xl"}`}
                    >
                      {h}
                    </div>
                  ))}
                  <div className="h-[72px]"></div>
                </div>

                <div className="flex items-center justify-center text-2xl font-black text-slate-300">:</div>

                {/* Minutes */}
                <div
                  ref={minutesScrollRef}
                  onScroll={handleMinutesScroll}
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-y-auto scrollbar-hide border border-slate-100 dark:border-slate-700 snap-y snap-mandatory relative"
                >
                  <div className="sticky top-0 bg-slate-100 dark:bg-slate-800 py-1 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 z-10 border-b border-slate-200 dark:border-slate-700">دقیقه</div>
                  <div className="h-[72px]"></div>
                  {minutesList.map(m => (
                    <div
                      key={m}
                      id={`picker-minute-${m}`}
                      onClick={() => setMinute(m)}
                      className={`py-3 text-center text-xs font-black font-mono cursor-pointer snap-center transition-all ${minute === m ? `${theme.bg} text-white shadow-md scale-105 rounded-xl m-1` : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 m-1 rounded-xl"}`}
                    >
                      {m}
                    </div>
                  ))}
                  <div className="h-[72px]"></div>
                </div>
              </div>

              <button type="button" onClick={handleConfirm} className={`w-full py-4 text-xs font-black text-white ${theme.bg} ${theme.hover} active:scale-[0.98] rounded-2xl shadow-xl dark:shadow-none ${theme.shadow} transition-all cursor-pointer`}>تایید ساعت</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
