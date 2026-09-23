import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Bell, X } from "lucide-react";
import { CustomSelect } from "./CustomSelect";
import { FACULTIES_AND_MAJORS } from "../constants/universityData";
import { StudentProfile } from "../types";
import { NotificationService } from "../services/NotificationService";
import { safeStorageGetString, safeStorageSet } from "../utils/storageUtils";

interface ProfileModalProps {
  profile: StudentProfile | null;
  onSave: (profile: StudentProfile) => void;
  onClose: () => void;
}

export default function ProfileModal({ profile, onSave, onClose }: ProfileModalProps) {
  const [formFirstName, setFormFirstName] = useState(profile?.firstName || "");
  const [formLastName, setFormLastName] = useState(profile?.lastName || "");
  const [formFaculty, setFormFaculty] = useState(profile?.faculty || "دانشکده مهندسی برق و کامپیوتر");
  const [formMajor, setFormMajor] = useState(profile?.major || "مهندسی کامپیوتر");
  const [formStudentId, setFormStudentId] = useState(profile?.studentId || "");
  const [formEntryYear, setFormEntryYear] = useState(profile?.entryYear || "1401");
  const [formGender, setFormGender] = useState<"male" | "female">(profile?.gender || "male");
  const [classLead, setClassLead] = useState(() => safeStorageGetString("class_lead_minutes") || "30");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [testStatus, setTestStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    setTestStatus(null);
    try {
      const ok = await NotificationService.sendTestNotification();
      if (ok) {
        setTestStatus({ message: "اعلان تستی ارسال شد! نوار بالای گوشی را بررسی کنید.", isError: false });
      } else {
        setTestStatus({ message: "دسترسی اعلان‌ها فعال نیست. لطفاً دسترسی را در تنظیمات فعال کنید.", isError: true });
      }
      setTimeout(() => setTestStatus(null), 4000);
    } catch (e) {
      console.error(e);
      setTestStatus({ message: "خطا در ارسال اعلان تستی.", isError: true });
      setTimeout(() => setTestStatus(null), 4000);
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormFirstName(profile.firstName || "");
      setFormLastName(profile.lastName || "");
      setFormFaculty(profile.faculty || "دانشکده مهندسی برق و کامپیوتر");
      setFormMajor(profile.major || "مهندسی کامپیوتر");
      setFormStudentId(profile.studentId || "");
      setFormEntryYear(profile.entryYear || "1401");
      setFormGender(profile.gender || "male");
    }
  }, [profile]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 bg-slate-900/60 z-[200] flex items-end sm:items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
      dir="rtl"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-6 sm:p-7 shadow-2xl dark:shadow-none overflow-y-auto max-h-[88vh]"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <User className="h-5 w-5 shrink-0" />
            </div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white">ویرایش پروفایل</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="بستن"
          >
            <X className="h-5 w-5 shrink-0" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 pb-1">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mr-1">اطلاعات هویتی</label>
            <div className="grid grid-cols-2 gap-4">
              <input required value={formFirstName} onChange={e => setFormFirstName(e.target.value)} placeholder="نام" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors" />
              <input required value={formLastName} onChange={e => setFormLastName(e.target.value)} placeholder="نام خانوادگی" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mr-1">شماره دانشجویی و سال ورود</label>
            <div className="grid grid-cols-2 gap-4">
              <input value={formStudentId} onChange={e => setFormStudentId(e.target.value.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString()))} placeholder="شماره دانشجویی" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors" />
              <input value={formEntryYear} onChange={e => setFormEntryYear(e.target.value)} placeholder="سال ورود (مثال: 1401)" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 mr-2">جنسیت</label>
            <div className="flex bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => setFormGender("male")} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${formGender === "male" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>پسرم</button>
              <button type="button" onClick={() => setFormGender("female")} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${formGender === "female" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>دخترم</button>
            </div>
          </div>

          <CustomSelect 
            label="دانشکده"
            value={formFaculty} 
            onChange={val => { setFormFaculty(val); setFormMajor(FACULTIES_AND_MAJORS[val][0]); }} 
            options={Object.keys(FACULTIES_AND_MAJORS)} 
          />
          <CustomSelect 
            label="رشته تحصیلی"
            value={formMajor} 
            onChange={val => setFormMajor(val)} 
            options={FACULTIES_AND_MAJORS[formFaculty] || []} 
          />
          {/* Notification Settings */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-500" />
                تنظیمات یادآور و اعلان‌ها
              </span>
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={isSendingTest}
                className="h-8 px-3 rounded-xl text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 inline-flex items-center justify-center shrink-0 cursor-pointer"
              >
                {isSendingTest ? "در حال ارسال..." : "ارسال اعلان تستی 🔔"}
              </button>
            </div>

            {testStatus && (
              <div className={`p-2.5 rounded-xl text-[11px] font-black text-center ${testStatus.isError ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"}`}>
                {testStatus.message}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 block">
                زمان یادآوری قبل از شروع هر کلاس:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "15", label: "۱۵ دقیقه قبل" },
                  { value: "30", label: "۳۰ دقیقه قبل" },
                  { value: "60", label: "۱ ساعت قبل" }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setClassLead(opt.value);
                      safeStorageSet("class_lead_minutes", opt.value);
                    }}
                    className={`h-9 rounded-xl text-[10px] font-black transition-all border inline-flex items-center justify-center ${classLead === opt.value ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-12 text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center">انصراف</button>
            <button type="submit" className="flex-1 h-12 text-xs font-black text-white bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 transition-all hover:bg-indigo-700 inline-flex items-center justify-center">ذخیره</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
