/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: AssistantGuideModal (راهنمای جامع پایگاه دانش و موضوعات دستیار هوشمند)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React from "react";
import { motion } from "motion/react";
import { 
  X, 
  BookOpen, 
  Scale, 
  Utensils, 
  Home, 
  Coins, 
  HeartPulse, 
  Award, 
  PhoneCall,
  Sparkles,
  ChevronLeft,
  Bot
} from "lucide-react";

interface GuideTopic {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  sampleQuestions: string[];
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "rules",
    title: "آموزش و آیین‌نامه‌ها",
    icon: Scale,
    description: "قوانین مشروطی و سقف واحد، حذف اضطراری تک‌درس، تک‌درس معرفی به استاد، سقف غیبت کلاسی و حداقل واحد مجاز.",
    sampleQuestions: [
      "شرایط مشروطی و سقف انتخاب واحد ترم بعد چیست؟",
      "قانون حذف اضطراری تک درس چگونه است؟",
      "قوانین معرفی به استاد در ترم آخر"
    ]
  },
  {
    id: "food",
    title: "سلف و اتوماسیون تغذیه",
    icon: Utensils,
    description: "رزرو تا ۴۸ ساعت قبل و لغو وعده‌ها در سماد، سلف مرکزی، سلف برق، خوابگاه‌ها و رستوران‌های رسمی دانشگاه تبریز.",
    sampleQuestions: [
      "قوانین رزرو تا ۴۸ ساعت قبل و لغو غذا در سماد",
      "لیست سلف‌ها و رستوران‌های دانشگاه تبریز",
      "خرید غذای روزفروش سلف چگونه است؟"
    ]
  },
  {
    id: "dorm",
    title: "خوابگاه و امور اسکان",
    icon: Home,
    description: "ثبت‌نام در سامانه صندوق رفاه، خوابگاه‌های فجر، شهدا، ولیعصر و عدم واگذاری خوابگاه در ترم تابستان.",
    sampleQuestions: [
      "شرایط و نحوه ثبت نام خوابگاه دانشجویی",
      "خوابگاه‌های خواهران و برادران دانشگاه تبریز",
      "آیا در ترم تابستان خوابگاه داده می‌شود؟"
    ]
  },
  {
    id: "loans",
    title: "انواع وام‌های دانشجویی",
    icon: Coins,
    description: "وام‌های تحصیلی، شهریه نوبت دوم، ودیعه مسکن متأهلی، وام ضروری، سند تعهد محضری و بازپرداخت اقساط.",
    sampleQuestions: [
      "انواع وام‌های دانشجویی صندوق رفاه و شرایط آن",
      "مدارک ضامن و سند تعهد محضری وام",
      "شرایط دریافت وام ودیعه مسکن متأهلی"
    ]
  },
  {
    id: "talented",
    title: "پذیرش استعداد درخشان",
    icon: Award,
    description: "ضوابط پذیرش بدون کنکور در مقاطع کارشناسی‌ارشد، شرط ۲۰ درصد برتر و تسهیلات نخبگان دانشگاه تبریز.",
    sampleQuestions: [
      "شرایط سهمیه استعداد درخشان ارشد بدون کنکور",
      "ضوابط پذیرش بدون آزمون دانشگاه تبریز"
    ]
  },
  {
    id: "health",
    title: "مرکز بهداشت، درمان و مشاوره",
    icon: HeartPulse,
    description: "پایش و کارنامه سلامت جسم و روان، تایید گواهی استعلاجی جهت حذف پزشکی، خدمات مشاوره تخصصی و محرمانه.",
    sampleQuestions: [
      "نحوه تایید گواهی و حذف پزشکی امتحانات",
      "طرح پایش سلامت و کارنامه سلامت دانشجویان",
      "خدمات مرکز مشاوره و سبک زندگی دانشگاه"
    ]
  },
  {
    id: "graduation",
    title: "فارغ‌التحصیلی و نظام وظیفه",
    icon: BookOpen,
    description: "مراحل تسویه حساب الکترونیکی در سما، صدور گواهی موقت، لغو تعهد آموزش رایگان، عدم کاریابی و فرجه سربازی.",
    sampleQuestions: [
      "مراحل تسویه حساب و فارغ‌التحصیلی در سما",
      "نحوه آزادسازی دانشنامه و لغو تعهد خدمت",
      "فرجه نظام وظیفه و معافیت تحصیلی دانشجویان"
    ]
  },
  {
    id: "contacts",
    title: "شماره‌های تماس و پورتال‌ها",
    icon: PhoneCall,
    description: "شماره مدیر امور آموزشی دانشگاه، دسترسی اختصاصی به شماره تمامی دانشکده‌ها و لینک سایت‌های دانشگاه.",
    sampleQuestions: [
      "شماره تماس مدیریت امور آموزشی دانشگاه تبریز",
      "آدرس وب‌سایت‌های رسمی دانشکده‌های دانشگاه تبریز"
    ]
  },
  {
    id: "bot_info",
    title: "درباره دستیار و اپلیکیشن",
    icon: Bot,
    description: "اطلاعات درباره هویت، سازنده اپلیکیشن (آرین - دانشجوی مهندسی برق)، کارکرد کاملاً آفلاین، حفظ حریم خصوصی و امنیت پیام‌ها.",
    sampleQuestions: [
      "تو کی هستی و چه کمکی می‌تونی به من بکنی؟",
      "برنامه‌نویس و سازنده برنامه کیست؟",
      "آیا دستیار هوشمند به اینترنت نیاز دارد؟"
    ]
  }
];

interface AssistantGuideModalProps {
  onClose: () => void;
  onSelectPrompt: (promptQuery: string) => void;
}

export default function AssistantGuideModal({ onClose, onSelectPrompt }: AssistantGuideModalProps) {
  const handlePickQuestion = (q: string) => {
    onSelectPrompt(q);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[210] bg-slate-900/70 flex items-end sm:items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4 font-sans text-right"
      dir="rtl"
    >
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2rem] p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-700/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                راهنمای پایگاه دانش دستیار هوشمند
              </h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                موضوعات، آیین‌نامه‌ها و پرسش‌های قابل پاسخگویی (کاملاً آفلاین)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Topics List */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 min-h-0 pl-1">
          {GUIDE_TOPICS.map(topic => {
            const Icon = topic.icon;
            return (
              <div
                key={topic.id}
                className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                    {topic.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
                  {topic.description}
                </p>

                {/* Sample clickable prompts */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block">
                    پرسش‌های نمونه (لمس برای پرسیدن مستقیم):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {topic.sampleQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePickQuestion(q)}
                        className="inline-flex items-center gap-1.5 text-right px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-black transition-all active:scale-95 shadow-sm group cursor-pointer"
                      >
                        <span className="truncate max-w-[280px]">{q}</span>
                        <ChevronLeft className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            دانشگاه تبریز • مصوبات شورای آموزشی
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            بستن راهنما
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
