/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  PhoneCall, 
  Search, 
  X, 
  Copy, 
  Check, 
  Building2, 
  GraduationCap, 
  Phone,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { EDUCATION_CONTACTS } from "../constants/educationContacts";

interface EducationContactModalProps {
  userFaculty?: string;
  onClose: () => void;
}

export default function EducationContactModal({ userFaculty, onClose }: EducationContactModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [expandedFaculties, setExpandedFaculties] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (userFaculty) initial[userFaculty] = true;
    initial["دانشکده مهندسی برق و کامپیوتر"] = true;
    return initial;
  });

  const toggleExpand = (facultyName: string) => {
    setExpandedFaculties(prev => ({
      ...prev,
      [facultyName]: !prev[facultyName]
    }));
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    } catch (e) {
      console.warn("Fallback copy failed", e);
    }
  };

  const handleCopy = (phone: string) => {
    const rawNumber = phone.replace(/[^0-9]/g, "");
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(rawNumber).catch(() => {
          fallbackCopyText(rawNumber);
        });
      } else {
        fallbackCopyText(rawNumber);
      }
    } catch {
      fallbackCopyText(rawNumber);
    }
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Strictly isolate LTR phone number to guarantee 041 is on the left
  const formatLtrPhone = (phone: string) => {
    return `\u200E${phone}\u200E`;
  };

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (userFaculty) {
        return [...EDUCATION_CONTACTS].sort((a, b) => {
          if (a.facultyName === userFaculty) return -1;
          if (b.facultyName === userFaculty) return 1;
          return 0;
        });
      }
      return EDUCATION_CONTACTS;
    }

    return EDUCATION_CONTACTS.filter(item => {
      const matchFaculty = item.facultyName.toLowerCase().includes(q);
      const matchCentral = item.centralPhone?.includes(q);
      const matchPeople = item.contacts.some(c => 
        c.role.toLowerCase().includes(q) || 
        (c.name && c.name.toLowerCase().includes(q)) || 
        c.phone.includes(q) || 
        (c.extension && c.extension.includes(q))
      );
      return matchFaculty || matchCentral || matchPeople;
    });
  }, [searchQuery, userFaculty]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-[200] bg-slate-900/60 flex items-end sm:items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4 font-sans" 
      dir="rtl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: 30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 30, opacity: 0 }} 
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2rem] p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-700 space-y-3 sm:space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                شماره آموزش دانشکده‌ها
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                دفترچه تلفن مستقیم اداره آموزش دانشگاه تبریز
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="بستن"
          >
            <X className="h-4 w-4 shrink-0" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام دانشکده، کارشناس، مسئول یا شماره..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-0.5 scrollbar-none">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">موردی یافت نشد</p>
            </div>
          ) : (
            filteredContacts.map(faculty => {
              const isUserFaculty = faculty.facultyName === userFaculty;
              const isExpanded = searchQuery.trim().length > 0 || !!expandedFaculties[faculty.facultyName];
              return (
                <div 
                  key={faculty.facultyName}
                  className={`rounded-2xl border transition-colors overflow-hidden ${
                    isUserFaculty 
                      ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 shadow-xs" 
                      : "bg-slate-50 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-700/60"
                  }`}
                >
                  {/* Faculty Header (Clickable Accordion Trigger) */}
                  <div 
                    onClick={() => toggleExpand(faculty.facultyName)}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Building2 className={`w-4 h-4 shrink-0 ${isUserFaculty ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`} />
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {faculty.facultyName}
                      </h4>
                      {isUserFaculty && (
                        <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <GraduationCap className="w-3 h-3" /> شما
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {faculty.contacts.length > 0 ? `${faculty.contacts.length} شماره` : 'مرکزی'}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-200/50 dark:border-slate-700/40 space-y-2">
                      {/* Note (Only for Civil Engineering) */}
                      {faculty.note && (
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                          <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                          <span>{faculty.note}</span>
                        </div>
                      )}

                      {/* Contact List */}
                      <div className="space-y-1.5">
                        {/* Dedicated Central Phone Card if available */}
                        {faculty.centralPhone && (
                          <div className="bg-white dark:bg-slate-800/90 rounded-xl p-2 px-2.5 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between gap-2 shadow-xs">
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                تلفن مرکزی دانشکده
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div 
                                dir="ltr" 
                                style={{ direction: "ltr", unicodeBidi: "isolate" }}
                                className="h-7 sm:h-8 px-2 rounded-lg inline-flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-700/50 shrink-0"
                              >
                                <span 
                                  dir="ltr"
                                  style={{ direction: "ltr", unicodeBidi: "isolate" }}
                                  className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 tracking-tight select-all leading-none"
                                >
                                  {formatLtrPhone(faculty.centralPhone)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopy(faculty.centralPhone!)}
                                title="کپی شماره"
                                aria-label="کپی شماره"
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg inline-flex items-center justify-center bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                              >
                                {copiedPhone === faculty.centralPhone ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 shrink-0" />
                                )}
                              </button>

                              <a
                                href={`tel:${faculty.centralPhone}`}
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xs transition-transform inline-flex items-center justify-center shrink-0 cursor-pointer"
                                title="تماس با تلفن مرکزی"
                                aria-label="تماس با تلفن مرکزی"
                              >
                                <Phone className="w-3.5 h-3.5 fill-current shrink-0" />
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Faculty Personnel Contacts */}
                        {faculty.contacts.map((c, idx) => (
                          <div 
                            key={idx}
                            className="bg-white dark:bg-slate-800/90 rounded-xl p-2 px-2.5 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2 shadow-xs"
                          >
                            {/* Title & Name */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                  {c.role}
                                </span>
                                {c.extension && (
                                  <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/40 px-1.5 py-0.2 rounded-md">
                                    داخلی {c.extension}
                                  </span>
                                )}
                              </div>
                              {c.name && (
                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                  {c.name}
                                </p>
                              )}
                            </div>

                            {/* Phone Display (Strict LTR) & Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Pure LTR Phone Pill */}
                              <div 
                                dir="ltr" 
                                style={{ direction: "ltr", unicodeBidi: "isolate" }}
                                className="h-7 sm:h-8 px-2 rounded-lg inline-flex items-center justify-center bg-slate-50 dark:bg-slate-700/50 border border-slate-200/60 dark:border-slate-700/50 shrink-0"
                              >
                                <span 
                                  dir="ltr"
                                  style={{ direction: "ltr", unicodeBidi: "isolate" }}
                                  className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 tracking-tight select-all leading-none"
                                >
                                  {formatLtrPhone(c.phone)}
                                </span>
                              </div>

                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => handleCopy(c.phone)}
                                title="کپی شماره"
                                aria-label="کپی شماره"
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg inline-flex items-center justify-center bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                              >
                                {copiedPhone === c.phone ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 shrink-0" />
                                )}
                              </button>

                              {/* Direct Call Button */}
                              <a
                                href={`tel:${c.phone}`}
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xs transition-transform inline-flex items-center justify-center shrink-0 cursor-pointer"
                                title="تماس مستقیم"
                                aria-label="تماس مستقیم"
                              >
                                <Phone className="w-3.5 h-3.5 fill-current shrink-0" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-black transition-colors"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
