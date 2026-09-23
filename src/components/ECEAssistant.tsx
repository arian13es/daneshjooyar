/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: ECEAssistant (دستیار هوشمند، محاسبه‌گر معدل، تقویم و سلف)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { Message, ExamItem, ProjectItem, StudentProfile } from "../types";
import { 
  Sparkles, Bot, ArrowUp, Trash2, Calculator, CalendarDays, 
  Utensils, Copy, Check, ChevronLeft, X, PhoneCall, ExternalLink,
  BookOpen, HelpCircle, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CalendarTab from "./CalendarTab";
import FoodReservation from "./FoodReservation";
import { safeStorageGet } from "../utils/storageUtils";
import { queryOriginalFaq } from "../utils/assistantEngine";
import { getConversationalReply } from "../utils/conversationalEngine";
import CumulativeGpaCalculator from "./CumulativeGpaCalculator";
import EducationContactModal from "./EducationContactModal";
import AssistantGuideModal from "./AssistantGuideModal";
import OfficialWebsitesModal from "./OfficialWebsitesModal";

interface QuickPrompt {
  id: string;
  title: string;
  query: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "faculty_sites",
    title: "وب‌سایت‌های رسمی دانشکده‌ها",
    query: "وب‌سایت‌های رسمی دانشکده‌های دانشگاه تبریز"
  },
  {
    id: "mashrooti",
    title: "شرایط مشروطی و سقف اخذ واحد",
    query: "شرایط مشروطی و سقف انتخاب واحد ترم بعد چیست؟"
  },
  {
    id: "hazf_ezterari",
    title: "قانون حذف اضطراری تک‌درس",
    query: "قانون حذف اضطراری تک درس چیست؟"
  },
  {
    id: "term_akhar",
    title: "معرفی به استاد در ترم آخر",
    query: "قوانین معرفی به استاد و شرایط ترم آخر چگونه است؟"
  },
  {
    id: "self_food",
    title: "رزرو تا ۴۸ ساعت قبل و لغو غذا در سماد",
    query: "شرایط رزرو و لغو غذای سلف دانشگاه تبریز"
  }
];

export interface ECEAssistantProps {
  profile?: StudentProfile | null;
  exams?: ExamItem[];
  projects?: ProjectItem[];
  calendarNotes?: Record<string, string[]>;
  onSaveNote?: (dateKey: string, note: string[]) => void;
  onDeleteNote?: (dateKey: string, index?: number) => void;
  initialSubTab?: "chat" | "gpa" | "calendar" | "food";
}

export default function ECEAssistant({ 
  profile,
  exams = [], 
  projects = [], 
  calendarNotes = {}, 
  onSaveNote = () => {}, 
  onDeleteNote = () => {},
  initialSubTab
}: ECEAssistantProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "gpa" | "calendar" | "food">(() => {
    return initialSubTab || "chat";
  });

  const userName = profile?.firstName?.trim() || (() => {
    const saved = safeStorageGet<StudentProfile | null>("tabriz_profile_v2", null);
    return saved?.firstName?.trim() || "";
  })();

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // ==========================================
  // Chat State
  // ==========================================
  const [messages, setMessages] = useState<Message[]>(() => {
    const greeting = userName ? `سلام ${userName} جان!` : "سلام دانشجو جان!";
    return [
      {
        id: "welcome",
        role: "assistant",
        timestamp: "هم‌اکنون",
        content: `${greeting} من دستیار هوشمند و آفلاین دانشگاه تبریز هستم. در مورد قوانین آموزشی، سقف واحد، حذف تک‌درس، سنوات، خوابگاه، سلف و سامانه‌های دانشگاه هر سوالی داری بپرس.`
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showWebsitesModal, setShowWebsitesModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userName && messages.length === 1 && messages[0].id === "welcome") {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          timestamp: "هم‌اکنون",
          content: `سلام ${userName} جان! من دستیار هوشمند و آفلاین دانشگاه تبریز هستم. در مورد قوانین آموزشی، سقف واحد، حذف درس، سنوات، خوابگاه، سلف و تقویم دانشگاه هر سوالی داری بپرس.`
        }
      ]);
    }
  }, [userName]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const toPersianDigits = (val: number | string): string => {
    return String(val ?? "").replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  };

  const renderMessageContent = (content: string) => {
    const hasEducationAction = content.includes("[ACTION:OPEN_EDUCATION_CONTACTS]");
    const hasGuideAction = content.includes("[ACTION:OPEN_KNOWLEDGE_GUIDE]");
    const cleanText = content
      .replace("[ACTION:OPEN_EDUCATION_CONTACTS]", "")
      .replace("[ACTION:OPEN_KNOWLEDGE_GUIDE]", "")
      .trim();

    // Match markdown links: [Link Title](https://...)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(cleanText)) !== null) {
      const [fullMatch, linkTitle, linkUrl] = match;
      const matchStart = match.index;

      if (matchStart > lastIndex) {
        elements.push(cleanText.substring(lastIndex, matchStart));
      }

      elements.push(
        <a
          key={`${matchStart}-${linkUrl}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-black hover:underline hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mx-1"
        >
          <span>{linkTitle}</span>
          <ExternalLink className="w-3 h-3 inline-block shrink-0" />
        </a>
      );

      lastIndex = matchStart + fullMatch.length;
    }

    if (lastIndex < cleanText.length) {
      elements.push(cleanText.substring(lastIndex));
    }

    return (
      <div className="space-y-3">
        <div className="text-xs sm:text-sm leading-relaxed font-bold text-slate-800 dark:text-slate-100 select-text whitespace-pre-wrap">
          {elements.length > 0 ? elements : cleanText}
        </div>

        {hasEducationAction && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowEducationModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>مشاهده لیست کامل شماره‌های آموزش دانشکده‌ها</span>
            </button>
          </div>
        )}

        {hasGuideAction && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>مشاهده راهنمای کامل موضوعات و سوالات</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    executePrompt(userText);
  };

  const executePrompt = (promptQuery: string) => {
    if (isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: promptQuery,
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const normQ = promptQuery.trim().toLowerCase();
      let reply = "";

      // 1. Check Conversational / Chit-Chat Engine (Greetings, How are you, Thanks, Goodbye, Turkish, Banter)
      const chitChatReply = getConversationalReply(promptQuery, userName);

      // 2. Guide Intent
      if (
        normQ === "راهنما" ||
        normQ.includes("راهنما") ||
        normQ.includes("چه اطلاعاتی") ||
        normQ.includes("درباره چی") ||
        normQ.includes("چی بلدی") ||
        normQ.includes("چه چیزهایی") ||
        normQ.includes("چه سوالاتی") ||
        normQ === "help"
      ) {
        reply = `${userName ? `${userName} عزیز، ` : ""}من به عنوان دستیار هوشمند و آفلاین دانشگاه تبریز به موضوعات زیر کاملاً مسلط هستم:\n\n` +
          `• 📋 آیین‌نامه‌ها (مشروطی، سقف واحد، حذف اضطراری تک‌درس، معرفی به استاد، غیبت)\n` +
          `• 🍲 سلف و تغذیه (رزرو تا ۴۸ ساعت قبل، لغو سماد، ۱۰ سلف و رستوران رسمی دانشگاه شامل سلف برق)\n` +
          `• 🏢 خوابگاه و اسکان (خوابگاه‌های فجر، شهدا، ولیعصر و عدم واگذاری خوابگاه تابستان)\n` +
          `• 💰 وام‌های دانشجویی (تحصیلی، شهریه، ودیعه مسکن، ضروری، سند تعهد محضری)\n` +
          `• 🌟 استعداد درخشان (پذیرش بدون آزمون و سهمیه شاگرد اولی)\n` +
          `• 🏥 بهداشت و مشاوره (پایش سلامت، مرکز مشاوره محرمانه، تایید حذف پزشکی)\n` +
          `• 📜 فارغ‌التحصیلی و نظام وظیفه (تسویه حساب، دانشنامه، معافیت تحصیلی، فرجه سربازی)\n` +
          `• 📞 شماره مستقیم مدیر آموزش، پورتال و شماره تمامی دانشکده‌ها\n` +
          `• 🤖 هویت، سازنده ([آرین](https://t.me/arian13es) - دانشجوی مهندسی برق) و کارکرد آفلاین دستیار\n\n` +
          `برای مشاهده جزئیات و لمس پرسش‌های نمونه هر بخش، دکمه زیر را لمس کنید:\n\n[ACTION:OPEN_KNOWLEDGE_GUIDE]`;
      }
      // 3. User asks their name
      else if (
        normQ.includes("اسم من") || normQ.includes("اسمم چیه") || normQ.includes("نام کاربری")
      ) {
        reply = userName 
          ? `ارادت! شما ${userName} هستید${profile?.major ? ` دانشجوی رشته ${profile.major}` : ""} دانشگاه تبریز.`
          : "هنوز اسمت رو به من نگفتی! میتونی از طریق منوی پروفایل در داشبورد اطلاعاتت رو تکمیل کنی!";
      }
      else {
        // Query FAQ Engine first
        const faqResult = queryOriginalFaq(promptQuery);
        
        // If FAQ has a very strong match, prioritize it
        if (faqResult.match && faqResult.score >= 10) {
          reply = faqResult.match.answer;
        }
        // Otherwise, if it's chit-chat (like greetings, tiredness, banter), let Chit-Chat handle it
        else if (chitChatReply) {
          reply = chitChatReply;
        }
        // If no chit-chat but there is a weak FAQ match, use FAQ
        else if (faqResult.match) {
          reply = faqResult.match.answer;
        }
        // Ultimate Fallback
        else {
          reply = `${userName ? `${userName} جان، ` : ""}من متوجه منظورت نشدم. میشه یه کم واضح‌تر سوالت رو بپرسی یا از راهنمای بالا استفاده کنی؟`;
        }
      }

      setMessages(prev => [
        ...prev, 
        { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: reply, 
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) 
        }
      ]);
      setIsLoading(false);
    }, 400);
  };

  const handleCopy = (id: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => fallbackCopy(id, text));
    } else {
      fallbackCopy(id, text);
    }
  };

  const fallbackCopy = (id: string, text: string) => {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn("[ECEAssistant] copy failed", e);
    }
  };

  const handleConfirmClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        timestamp: "هم‌اکنون",
        content: "سلام دانشجو جان! من دستیار هوشمند و آفلاین دانشگاه تبریز هستم. در مورد قوانین آموزشی، سقف واحد، حذف تک‌درس، سنوات، خوابگاه، سلف و سامانه‌های دانشگاه هر سوالی داری بپرس."
      }
    ]);
    setShowClearConfirm(false);
  };

  const isInitialState = messages.length <= 1;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-900 text-right font-sans" dir="rtl">
      {/* 1. Subtab Segmented Navigation (Spacious, native feel) */}
      <div className="px-3 sm:px-5 pt-2.5 sm:pt-3 pb-1 shrink-0">
        <nav 
          aria-label="بخش‌های دستیار"
          className="bg-slate-200/60 dark:bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl flex max-w-lg md:mx-auto w-full border border-slate-300/60 dark:border-slate-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
        >
          {([
            { id: "chat" as const, icon: Sparkles, shortLabel: "دستیار", fullLabel: "دستیار هوشمند" },
            { id: "gpa" as const, icon: Calculator, shortLabel: "معدل", fullLabel: "محاسبه معدل" },
            { id: "calendar" as const, icon: CalendarDays, shortLabel: "تقویم", fullLabel: "تقویم ترم" },
            { id: "food" as const, icon: Utensils, shortLabel: "سلف", fullLabel: "رزرو سلف" }
          ]).map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group flex-1 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11.5px] sm:text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 relative z-10 select-none active:scale-[0.97] outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] ${
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSubTabIndicator"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 -z-10"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <tab.icon 
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-colors duration-200 ${
                    isActive 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  }`} 
                />
                <span className="truncate">
                  <span className="inline sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
            className="h-full w-full flex flex-col min-h-0"
          >
            {activeTab === "chat" ? (
              <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
                {/* Chat Top Header (Minimal & Uncluttered) */}
                <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0 z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">دستیار هوشمند دانشگاه</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">آفلاین • آیین‌نامه‌ها و قوانین</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowWebsitesModal(true)}
                      className="h-8 w-8 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:text-slate-400 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 rounded-xl transition-colors active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0"
                      title="وب‌سایت‌های رسمی دانشکده‌ها"
                      aria-label="وب‌سایت‌های رسمی دانشکده‌ها"
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(true)}
                      className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 rounded-xl transition-colors active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0"
                      title="راهنمای موضوعات دستیار"
                      aria-label="راهنمای موضوعات دستیار"
                    >
                      <HelpCircle className="h-4 w-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0"
                      title="پاک‌سازی گفتگو"
                      aria-label="پاک‌سازی گفتگو"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Messages Container (Natural smooth scrolling) */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 pt-2 pb-3 touch-pan-y">
                  {/* Clean Centered Initial State */}
                  {isInitialState ? (
                    <div className="min-h-full flex flex-col justify-center py-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4 max-w-md mx-auto w-full"
                      >
                        <div className="space-y-1.5">
                          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-sm mx-auto mb-1">
                            <Bot className="h-6 w-6" />
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                            {userName ? `سلام ${userName} عزیز!` : "دستیار هوشمند دانشگاه تبریز"}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">
                            {userName ? "در خدمت شما هستم؛ سوال آموزشی یا دانشگاهی‌تان را بپرسید" : "پاسخگوی سریع به سوالات مشروطی، سقف واحد، حذف درس و سلف"}
                          </p>
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setShowGuideModal(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-black hover:bg-indigo-100 transition-colors mx-auto active:scale-95 shadow-sm cursor-pointer"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              <span>راهنمای جامع: دستیار چه می‌داند؟</span>
                            </button>
                          </div>
                        </div>

                        {/* 4 Clean Essential Prompt Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right pt-1">
                          {QUICK_PROMPTS.map(prompt => (
                            <button
                              key={prompt.id}
                              onClick={() => executePrompt(prompt.query)}
                              className="bg-white dark:bg-slate-800 hover:bg-indigo-50/60 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl transition-all group flex items-center justify-between gap-2 shadow-sm active:scale-98 cursor-pointer"
                            >
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {prompt.title}
                              </span>
                              <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    /* Active Message History - Standard top-to-bottom flow without justify-end scroll lock */
                    <div className="space-y-3 max-w-xl mx-auto w-full py-2">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.role === "user" ? "items-start" : "items-end"}`}
                        >
                          {msg.role === "user" ? (
                            /* User Query Capsule (Aligned to Right, like sent messages in Telegram/Instagram) */
                            <div className="max-w-[85%] sm:max-w-[80%] flex flex-col items-start">
                              <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm leading-relaxed select-text">
                                {msg.content}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-1 px-1 tabular-nums">
                                {toPersianDigits(msg.timestamp)}
                              </span>
                            </div>
                          ) : (
                            /* Assistant Response Card (Aligned to Left, like incoming messages) */
                            <div className="w-full max-w-[94%] sm:max-w-[88%] bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2.5 text-right">
                              {renderMessageContent(msg.content)}

                              {msg.id !== "welcome" && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 tabular-nums">
                                    {toPersianDigits(msg.timestamp)}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(msg.id, msg.content.replace("[ACTION:OPEN_EDUCATION_CONTACTS]", "").replace("[ACTION:OPEN_KNOWLEDGE_GUIDE]", "").trim())}
                                    className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors active:scale-95 cursor-pointer"
                                  >
                                    {copiedId === msg.id ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-emerald-600 dark:text-emerald-400">کپی شد</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>کپی متن</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Clean Loading Indicator */}
                      {isLoading && (
                        <div className="flex flex-col items-end w-full pt-1">
                          <div className="max-w-[85%] bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-3.5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2.5 my-1">
                            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                              <Sparkles className="h-3.5 w-3.5 animate-spin" />
                            </div>
                            <p className="text-xs font-black text-slate-600 dark:text-slate-300">در حال جستجو در آیین‌نامه‌ها...</p>
                          </div>
                        </div>
                      )}

                      <div ref={scrollRef} className="h-2" />
                    </div>
                  )}
                </div>

                {/* Floating Command Bar - Adjusted with balanced 10px spacing above the fixed bottom navigation bar */}
                <div className="px-3 sm:px-4 pt-2 pb-[calc(5rem+env(safe-area-inset-bottom,0px)+10px)] sm:pb-24 md:pb-20 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 shrink-0 relative z-30">
                  <form 
                    onSubmit={handleSend}
                    className="max-w-xl mx-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 flex items-center gap-2 ring-1 ring-slate-900/5 dark:ring-white/5"
                  >
                    <input
                      type="text" 
                      value={input} 
                      onChange={e => setInput(e.target.value)}
                      placeholder="سوال خود را بپرسید (مشروطی، حذف درس، سلف...)"
                      className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                    />

                    {input.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInput("")}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center justify-center shrink-0 cursor-pointer"
                        title="پاک کردن متن"
                        aria-label="پاک کردن متن"
                      >
                        <X className="h-4 w-4 shrink-0" />
                      </button>
                    )}

                    <button 
                      type="submit" 
                      disabled={!input.trim() || isLoading} 
                      title="ارسال پیام"
                      aria-label="ارسال پیام"
                      className={`h-10 w-10 rounded-xl inline-flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer ${
                        input.trim() && !isLoading
                          ? "bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/25 active:scale-90"
                          : "bg-slate-100 dark:bg-slate-700/60 text-slate-300 dark:text-slate-500 shadow-none cursor-not-allowed"
                      }`}
                    >
                      <ArrowUp className="h-5 w-5 stroke-[2.5] shrink-0" />
                    </button>
                  </form>
                </div>
              </div>
            ) : activeTab === "gpa" ? (
              <CumulativeGpaCalculator />
            ) : activeTab === "calendar" ? (
              <div className="h-full overflow-y-auto px-2.5 sm:px-4 pb-36 w-full max-w-5xl mx-auto">
                <CalendarTab 
                  notes={calendarNotes}
                  onSaveNote={onSaveNote}
                  onDeleteNote={onDeleteNote}
                  exams={exams}
                  projects={projects}
                />
              </div>
            ) : activeTab === "food" ? (
              <FoodReservation />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Clear Chat Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-right"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">پاک‌سازی گفتگو</h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">حذف تاریخچه مکالمات</p>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                آیا از حذف تاریخچه پیام‌ها و شروع مجدد گفتگو اطمینان دارید؟
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="flex-1 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  پاک‌سازی
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Education Contacts Modal */}
      <AnimatePresence>
        {showEducationModal && (
          <EducationContactModal onClose={() => setShowEducationModal(false)} />
        )}
      </AnimatePresence>

      {/* Knowledge Guide Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <AssistantGuideModal
            onClose={() => setShowGuideModal(false)}
            onSelectPrompt={(q) => executePrompt(q)}
          />
        )}
      </AnimatePresence>

      {/* Official Faculty Websites Modal */}
      <AnimatePresence>
        {showWebsitesModal && (
          <OfficialWebsitesModal 
            userFaculty={profile?.faculty} 
            onClose={() => setShowWebsitesModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
