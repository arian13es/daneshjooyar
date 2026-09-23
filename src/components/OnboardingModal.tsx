import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import appLogo from "../assets/app_logo.jpg";
import { CustomSelect } from "./CustomSelect";
import { ENTRY_YEARS, FACULTIES_AND_MAJORS } from "../constants/universityData";
import { StudentProfile } from "../types";

interface OnboardingModalProps {
  onSave: (profile: StudentProfile) => void;
}

export default function OnboardingModal({ onSave }: OnboardingModalProps) {
  const defaultFaculty = "دانشکده مهندسی برق و کامپیوتر";
  const defaultMajor = "مهندسی برق";
  const defaultYear = "1403";

  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formFaculty, setFormFaculty] = useState(defaultFaculty);
  const [formMajor, setFormMajor] = useState(defaultMajor);
  const [formStudentId, setFormStudentId] = useState("");
  const [formEntryYear, setFormEntryYear] = useState(defaultYear);
  const [formGender, setFormGender] = useState<"male" | "female">("male");

  const toEnglishDigits = (str: string) => str.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName: formFirstName,
      lastName: formLastName,
      faculty: formFaculty,
      major: formMajor,
      studentId: formStudentId,
      entryYear: formEntryYear,
      gender: formGender
    });
  };

  return (
    <motion.div 
      key="onboarding" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col overflow-hidden" 
      dir="rtl"
    >
      <AnimatePresence mode="wait">
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col overflow-y-auto p-6 pb-12 sm:pb-6 scrollbar-hide"
          >
            <div className="flex flex-col items-center py-5 sm:py-8">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1.75rem] sm:rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center mb-3 sm:mb-4 overflow-hidden">
                <img src={appLogo} alt="لوگو" className="h-full w-full object-cover" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">دانشجویار دانشگاه تبریز</h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold opacity-70 uppercase tracking-widest">Digital Assistant</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 max-w-sm mx-auto w-full pb-10">
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 block text-right">نام</label>
                  <input required value={formFirstName} onChange={e => setFormFirstName(e.target.value)} placeholder="مثال: آرین" className="w-full h-[52px] px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors box-border placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 block text-right">نام خانوادگی</label>
                  <input required value={formLastName} onChange={e => setFormLastName(e.target.value)} placeholder="مثال: اسکندری" className="w-full h-[52px] px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors box-border placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal" />
                </div>
              </div>

              <CustomSelect 
                label="انتخاب دانشکده"
                value={formFaculty} 
                onChange={val => { setFormFaculty(val); setFormMajor(FACULTIES_AND_MAJORS[val][0]); }} 
                options={Object.keys(FACULTIES_AND_MAJORS)} 
              />

              <CustomSelect 
                label="انتخاب رشته تحصیلی"
                value={formMajor} 
                onChange={val => setFormMajor(val)} 
                options={FACULTIES_AND_MAJORS[formFaculty] || []} 
              />

              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 block text-right">شماره دانشجویی</label>
                  <input 
                    value={formStudentId} 
                    onChange={e => setFormStudentId(toEnglishDigits(e.target.value))} 
                    placeholder="اختیاری" 
                    className="w-full h-[52px] px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none text-right transition-colors focus:border-indigo-500 box-border tracking-wider" 
                    dir="rtl" 
                  />
                </div>
                <CustomSelect 
                  label="سال ورود"
                  value={formEntryYear} 
                  onChange={val => setFormEntryYear(val)} 
                  options={ENTRY_YEARS} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 mr-2">جنسیت</label>
                <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-200">
                  <button type="button" onClick={() => setFormGender("male")} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${formGender === "male" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}>پسرم</button>
                  <button type="button" onClick={() => setFormGender("female")} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${formGender === "female" ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-700"}`}>دخترم</button>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] text-sm font-black shadow-xl shadow-indigo-200 active:scale-95 transition-all mt-6">ورود به میزکار</button>
            </form>
            
            <div className="flex flex-col items-center justify-center pt-8 pb-4 border-t border-slate-100 dark:border-slate-800/50 mt-4 opacity-90">
              <p className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 mb-3">
                برنامه‌نویسی شده با <Heart className="h-3 w-3 fill-rose-500 text-rose-500 animate-pulse" /> برای دوستان عزیزم
              </p>
              
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <a href="https://t.me/arian13es" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-black tracking-widest text-indigo-400 hover:text-indigo-500 transition-colors">
                  <svg className="w-3.5 h-3.5 -mt-[1.5px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .25.02.36.12.1.08.13.19.14.27-.01.04.01.12 0 .22z" />
                  </svg>
                  Arian
                </a>
                
                <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700"></div>
                
                <a href="https://daramet.com/arian13es" target="_blank" rel="noreferrer" className="text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-1.5 group">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  حمایت از من
                </a>
              </div>
              
              <a href="https://t.me/daneshjooyartbz" target="_blank" rel="noreferrer" className="mt-4 flex items-baseline gap-1.5 text-[10px] font-black tracking-widest text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors uppercase group">
                <svg className="w-3 h-3 group-hover:scale-110 transition-transform relative top-[1px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .25.02.36.12.1.08.13.19.14.27-.01.04.01.12 0 .22z" />
                </svg>
                <span>Community Channel</span>
              </a>
            </div>
          </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
