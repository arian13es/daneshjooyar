/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: OfficialWebsitesModal (پرتال مینیمال وب‌سایت‌های رسمی دانشکده‌ها)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  MapPin, 
  Building2
} from "lucide-react";
import { OFFICIAL_FACULTY_WEBSITES, FacultyWebsiteItem } from "../constants/officialWebsites";
import { safeStorageGet } from "../utils/storageUtils";

interface OfficialWebsitesModalProps {
  onClose: () => void;
  onNavigateToMap?: (buildingId: string) => void;
  userFaculty?: string;
}

type CategoryFilter = "all" | "engineering" | "basic_sciences" | "humanities" | "agriculture_veterinary" | "satellite";

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "engineering", label: "فنی و مهندسی" },
  { id: "basic_sciences", label: "علوم پایه" },
  { id: "humanities", label: "علوم انسانی" },
  { id: "agriculture_veterinary", label: "کشاورزی و دامپزشکی" },
  { id: "satellite", label: "اقماری" },
];

const FACULTY_TO_WEBSITE_ID_MAP: Record<string, string> = {
  "دانشکده مهندسی برق و کامپیوتر": "ece",
  "مهندسی برق و کامپیوتر": "ece",
  "برق و کامپیوتر": "ece",
  "دانشکده مهندسی مکانیک": "mechanic",
  "مهندسی مکانیک": "mechanic",
  "مکانیک": "mechanic",
  "دانشکده مهندسی عمران": "civil",
  "مهندسی عمران": "civil",
  "عمران": "civil",
  "دانشکده مهندسی شیمی و نفت": "chemeng",
  "مهندسی شیمی و نفت": "chemeng",
  "مهندسی شیمی": "chemeng",
  "دانشکده ریاضی، آمار و علوم کامپیوتر": "mathematic",
  "دانشکده ریاضی": "mathematic",
  "ریاضی": "mathematic",
  "علوم کامپیوتر": "mathematic",
  "دانشکده فیزیک": "physics",
  "فیزیک": "physics",
  "دانشکده شیمی": "chemistry",
  "شیمی": "chemistry",
  "دانشکده علوم طبیعی": "natural",
  "علوم طبیعی": "natural",
  "دانشکده ادبیات فارسی و زبان‌های خارجی": "literature",
  "دانشکده ادبیات": "literature",
  "ادبیات": "literature",
  "دانشکده اقتصاد، مدیریت و بازرگانی": "econ",
  "دانشکده اقتصاد و مدیریت": "econ",
  "دانشکده اقتصاد": "econ",
  "اقتصاد": "econ",
  "مدیریت": "econ",
  "دانشکده حقوق و علوم اجتماعی": "law_social",
  "دانشکده حقوق": "law_social",
  "حقوق": "law_social",
  "دانشکده الهیات و علوم اسلامی": "islamicscience",
  "دانشکده الهیات": "islamicscience",
  "الهیات": "islamicscience",
  "دانشکده جغرافیا و برنامه‌ریزی": "geography",
  "دانشکده برنامه‌ریزی و علوم محیطی": "geography",
  "دانشکده جغرافیا": "geography",
  "جغرافیا": "geography",
  "دانشکده علوم تربیتی و روانشناسی": "psychology",
  "دانشکده روانشناسی": "psychology",
  "روانشناسی": "psychology",
  "دانشکده تربیت بدنی و علوم ورزشی": "sport",
  "دانشکده تربیت بدنی": "sport",
  "تربیت بدنی": "sport",
  "دانشکده کشاورزی": "agricultur",
  "کشاورزی": "agricultur",
  "دانشکده دامپزشکی": "veterinary",
  "دامپزشکی": "veterinary",
  "دانشکده فنی و مهندسی مرند": "marandtech",
  "دانشکده مرند": "marandtech",
  "مرند": "marandtech",
  "دانشکده فنی و مهندسی میانه": "miyanehtech",
  "دانشکده میانه": "miyanehtech",
  "میانه": "miyanehtech",
  "دانشکده کشاورزی و منابع طبیعی اهر": "ahar",
  "دانشکده اهر": "ahar",
  "اهر": "ahar",
};

export default function OfficialWebsitesModal({ onClose, onNavigateToMap, userFaculty }: OfficialWebsitesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Retrieve user's faculty from prop or safe storage
  const resolvedFaculty = useMemo(() => {
    if (userFaculty?.trim()) return userFaculty.trim();
    try {
      const saved = safeStorageGet< { faculty?: string } | null >("tabriz_profile_v2", null);
      if (saved?.faculty?.trim()) return saved.faculty.trim();
    } catch (err) {
      console.warn("[OfficialWebsites] failed to read faculty from storage", err);
    }
    return "";
  }, [userFaculty]);

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

  const handleCopy = (id: string, url: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => fallbackCopyText(url));
      } else {
        fallbackCopyText(url);
      }
    } catch {
      fallbackCopyText(url);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const { myFacultyItem, otherWebsites } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. First find the user's faculty website reliably
    let myItem: FacultyWebsiteItem | undefined;
    if (resolvedFaculty) {
      const cleanUser = resolvedFaculty.replace(/[\u200c\s،,-]+/g, " ").trim().toLowerCase();
      
      // Direct dictionary lookup
      for (const [key, webId] of Object.entries(FACULTY_TO_WEBSITE_ID_MAP)) {
        const cleanKey = key.replace(/[\u200c\s،,-]+/g, " ").trim().toLowerCase();
        if (cleanUser.includes(cleanKey) || cleanKey.includes(cleanUser)) {
          myItem = OFFICIAL_FACULTY_WEBSITES.find(f => f.id === webId);
          if (myItem) break;
        }
      }

      // Fallback substring matching
      if (!myItem) {
        myItem = OFFICIAL_FACULTY_WEBSITES.find(item => {
          const cleanItem = item.name.replace(/[\u200c\s،,-]+/g, " ").trim().toLowerCase();
          return cleanUser.includes(cleanItem) || cleanItem.includes(cleanUser);
        });
      }
    }

    // 2. Filter list by category and search
    const list = OFFICIAL_FACULTY_WEBSITES.filter(item => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });

    // Check if myItem matches current search query (if search is active)
    const myItemMatchesSearch = myItem && (!q || (
      myItem.name.toLowerCase().includes(q) ||
      myItem.description.toLowerCase().includes(q) ||
      myItem.url.toLowerCase().includes(q)
    ));

    const finalMyItem = myItemMatchesSearch ? myItem : null;
    const others = list.filter(item => item.id !== finalMyItem?.id);

    return { myFacultyItem: finalMyItem, otherWebsites: others };
  }, [searchQuery, activeCategory, resolvedFaculty]);

  const renderFacultyRow = (item: FacultyWebsiteItem, isFeatured = false) => {
    return (
      <div 
        key={item.id}
        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
          isFeatured
            ? "bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/90 dark:border-sky-800/70 border-r-[3px] border-r-sky-500 shadow-xs"
            : "bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800/80"
        }`}
      >
        {/* Faculty Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-xs sm:text-sm font-black truncate ${isFeatured ? "text-sky-950 dark:text-sky-100" : "text-slate-900 dark:text-white"}`}>
              {item.name}
            </h3>
            {isFeatured && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-100/90 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[10px] font-black border border-sky-200 dark:border-sky-800/70 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                دانشکده شما
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mt-0.5">
            {item.categoryLabel}
          </span>
        </div>

        {/* Standardized Actions (Strictly level h-8 row) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Map Pin (on-campus only) */}
          {item.buildingId && onNavigateToMap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToMap(item.buildingId!);
              }}
              className="h-8 px-2 sm:px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-bold inline-flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer"
              title="موقعیت روی نقشه دانشگاه"
              aria-label="موقعیت روی نقشه دانشگاه"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline text-[11px]">نقشه</span>
            </button>
          )}

          {/* Copy Link */}
          <button
            type="button"
            onClick={() => handleCopy(item.id, item.url)}
            className="h-8 px-2 sm:px-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold inline-flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer"
            title="کپی نشانی وب‌سایت"
            aria-label="کپی نشانی وب‌سایت"
          >
            {copiedId === item.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[10px] text-emerald-500 font-bold hidden sm:inline">کپی شد</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline text-[11px]">کپی</span>
              </>
            )}
          </button>

          {/* Enter Website */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`h-8 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 text-white shrink-0 cursor-pointer ${
              isFeatured
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-sky-500 hover:bg-sky-600"
            }`}
            title="ورود مستقیم به وب‌سایت"
            aria-label="ورود مستقیم به وب‌سایت"
          >
            <span>ورود</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>
    );
  };

  const hasAnyItems = myFacultyItem || otherWebsites.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 pb-[env(safe-area-inset-bottom,0px)] sm:pb-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Minimal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              وبگاه رسمی دانشکده‌ها
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              دانشگاه تبریز • درگاه‌های اینترنتی
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
            title="بستن"
            aria-label="بستن"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام دانشکده یا رشته..."
              className="w-full pr-9 pl-8 py-2 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-sky-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal List with Pinned User Faculty */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2">
          {!hasAnyItems ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">دانشکده‌ای با این عنوان یافت نشد.</p>
            </div>
          ) : (
            <>
              {/* Pinned User Faculty at the very top */}
              {myFacultyItem && (
                <div className="space-y-1 mb-3">
                  {renderFacultyRow(myFacultyItem, true)}
                </div>
              )}

              {/* Divider if both exist */}
              {myFacultyItem && otherWebsites.length > 0 && (
                <div className="pt-1 pb-1 flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    سایر دانشکده‌ها
                  </span>
                  <div className="flex-1 h-[1px] bg-slate-200/60 dark:bg-slate-800" />
                </div>
              )}

              {/* Other Faculties */}
              {otherWebsites.map((item) => renderFacultyRow(item, false))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
