/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: Faculty Visual Identities & Theming
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

export interface FacultyTheme {
  name: string;
  shortName: string;
  /** Tailwind border-t color for card top accent stripe */
  topBorder: string;
  /** Accent text color for icons and labels */
  accentText: string;
  /** Light tinted background for info bar and boxes */
  accentBg: string;
  /** Border color matching the accent */
  accentBorder: string;
  /** Avatar ring gradient */
  avatarRing: string;
  /** Badge styling */
  badgeClass: string;
  /** Edit button styling */
  editBtn: string;
}

export const FACULTY_THEMES: Record<string, FacultyTheme> = {
  "دانشکده مهندسی برق و کامپیوتر": {
    name: "دانشکده مهندسی برق و کامپیوتر",
    shortName: "مهندسی برق و کامپیوتر",
    topBorder: "border-t-blue-500",
    accentText: "text-blue-600 dark:text-blue-400",
    accentBg: "bg-blue-50/80 dark:bg-blue-950/40",
    accentBorder: "border-blue-200/80 dark:border-blue-800/60",
    avatarRing: "from-blue-500 to-indigo-600",
    badgeClass: "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    editBtn: "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60"
  },
  "دانشکده مهندسی مکانیک": {
    name: "دانشکده مهندسی مکانیک",
    shortName: "مهندسی مکانیک",
    topBorder: "border-t-amber-500",
    accentText: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-50/80 dark:bg-amber-950/40",
    accentBorder: "border-amber-200/80 dark:border-amber-800/60",
    avatarRing: "from-amber-500 to-orange-600",
    badgeClass: "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    editBtn: "bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60"
  },
  "دانشکده مهندسی عمران": {
    name: "دانشکده مهندسی عمران",
    shortName: "مهندسی عمران",
    topBorder: "border-t-sky-500",
    accentText: "text-sky-600 dark:text-sky-400",
    accentBg: "bg-sky-50/80 dark:bg-sky-950/40",
    accentBorder: "border-sky-200/80 dark:border-sky-800/60",
    avatarRing: "from-sky-500 to-cyan-600",
    badgeClass: "bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    editBtn: "bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/60"
  },
  "دانشکده مهندسی شیمی و نفت": {
    name: "دانشکده مهندسی شیمی و نفت",
    shortName: "مهندسی شیمی و نفت",
    topBorder: "border-t-orange-500",
    accentText: "text-orange-600 dark:text-orange-400",
    accentBg: "bg-orange-50/80 dark:bg-orange-950/40",
    accentBorder: "border-orange-200/80 dark:border-orange-800/60",
    avatarRing: "from-orange-500 to-red-600",
    badgeClass: "bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    editBtn: "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-800/60"
  },
  "دانشکده ریاضی، آمار و علوم کامپیوتر": {
    name: "دانشکده ریاضی، آمار و علوم کامپیوتر",
    shortName: "ریاضی و علوم کامپیوتر",
    topBorder: "border-t-purple-500",
    accentText: "text-purple-600 dark:text-purple-400",
    accentBg: "bg-purple-50/80 dark:bg-purple-950/40",
    accentBorder: "border-purple-200/80 dark:border-purple-800/60",
    avatarRing: "from-purple-500 to-violet-600",
    badgeClass: "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    editBtn: "bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60"
  },
  "دانشکده فیزیک": {
    name: "دانشکده فیزیک",
    shortName: "فیزیک",
    topBorder: "border-t-indigo-500",
    accentText: "text-indigo-600 dark:text-indigo-400",
    accentBg: "bg-indigo-50/80 dark:bg-indigo-950/40",
    accentBorder: "border-indigo-200/80 dark:border-indigo-800/60",
    avatarRing: "from-indigo-500 to-blue-600",
    badgeClass: "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    editBtn: "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60"
  },
  "دانشکده شیمی": {
    name: "دانشکده شیمی",
    shortName: "شیمی",
    topBorder: "border-t-pink-500",
    accentText: "text-pink-600 dark:text-pink-400",
    accentBg: "bg-pink-50/80 dark:bg-pink-950/40",
    accentBorder: "border-pink-200/80 dark:border-pink-800/60",
    avatarRing: "from-pink-500 to-rose-600",
    badgeClass: "bg-pink-50 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    editBtn: "bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 text-pink-600 dark:text-pink-400 border-pink-200/80 dark:border-pink-800/60"
  },
  "دانشکده علوم طبیعی": {
    name: "دانشکده علوم طبیعی",
    shortName: "علوم طبیعی",
    topBorder: "border-t-emerald-500",
    accentText: "text-emerald-600 dark:text-emerald-400",
    accentBg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    accentBorder: "border-emerald-200/80 dark:border-emerald-800/60",
    avatarRing: "from-emerald-500 to-teal-600",
    badgeClass: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    editBtn: "bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60"
  },
  "دانشکده ادبیات فارسی و زبان‌های خارجی": {
    name: "دانشکده ادبیات فارسی و زبان‌های خارجی",
    shortName: "ادبیات و زبان‌ها",
    topBorder: "border-t-amber-600",
    accentText: "text-amber-700 dark:text-amber-400",
    accentBg: "bg-amber-50/80 dark:bg-amber-950/40",
    accentBorder: "border-amber-200/80 dark:border-amber-800/60",
    avatarRing: "from-amber-600 to-yellow-600",
    badgeClass: "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    editBtn: "bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60"
  },
  "دانشکده علوم تربیتی و روانشناسی": {
    name: "دانشکده علوم تربیتی و روانشناسی",
    shortName: "علوم تربیتی و روانشناسی",
    topBorder: "border-t-violet-500",
    accentText: "text-violet-600 dark:text-violet-400",
    accentBg: "bg-violet-50/80 dark:bg-violet-950/40",
    accentBorder: "border-violet-200/80 dark:border-violet-800/60",
    avatarRing: "from-violet-500 to-purple-600",
    badgeClass: "bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    editBtn: "bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 border-violet-200/80 dark:border-violet-800/60"
  },
  "دانشکده حقوق و علوم اجتماعی": {
    name: "دانشکده حقوق و علوم اجتماعی",
    shortName: "حقوق و علوم اجتماعی",
    topBorder: "border-t-rose-600",
    accentText: "text-rose-600 dark:text-rose-400",
    accentBg: "bg-rose-50/80 dark:bg-rose-950/40",
    accentBorder: "border-rose-200/80 dark:border-rose-800/60",
    avatarRing: "from-rose-500 to-red-600",
    badgeClass: "bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    editBtn: "bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60"
  },
  "دانشکده اقتصاد، مدیریت و بازرگانی": {
    name: "دانشکده اقتصاد، مدیریت و بازرگانی",
    shortName: "اقتصاد و مدیریت",
    topBorder: "border-t-teal-500",
    accentText: "text-teal-600 dark:text-teal-400",
    accentBg: "bg-teal-50/80 dark:bg-teal-950/40",
    accentBorder: "border-teal-200/80 dark:border-teal-800/60",
    avatarRing: "from-teal-500 to-emerald-600",
    badgeClass: "bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    editBtn: "bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-800/60"
  },
  "دانشکده الهیات و علوم اسلامی": {
    name: "دانشکده الهیات و علوم اسلامی",
    shortName: "الهیات و علوم اسلامی",
    topBorder: "border-t-emerald-600",
    accentText: "text-emerald-700 dark:text-emerald-400",
    accentBg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    accentBorder: "border-emerald-200/80 dark:border-emerald-800/60",
    avatarRing: "from-emerald-600 to-green-600",
    badgeClass: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    editBtn: "bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60"
  },
  "دانشکده جغرافیا و برنامه‌ریزی": {
    name: "دانشکده جغرافیا و برنامه‌ریزی",
    shortName: "جغرافیا و برنامه‌ریزی",
    topBorder: "border-t-cyan-500",
    accentText: "text-cyan-600 dark:text-cyan-400",
    accentBg: "bg-cyan-50/80 dark:bg-cyan-950/40",
    accentBorder: "border-cyan-200/80 dark:border-cyan-800/60",
    avatarRing: "from-cyan-500 to-blue-500",
    badgeClass: "bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    editBtn: "bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/60"
  },
  "دانشکده کشاورزی": {
    name: "دانشکده کشاورزی",
    shortName: "کشاورزی",
    topBorder: "border-t-green-600",
    accentText: "text-green-600 dark:text-green-400",
    accentBg: "bg-green-50/80 dark:bg-green-950/40",
    accentBorder: "border-green-200/80 dark:border-green-800/60",
    avatarRing: "from-green-500 to-emerald-600",
    badgeClass: "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    editBtn: "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 border-green-200/80 dark:border-green-800/60"
  },
  "دانشکده دامپزشکی": {
    name: "دانشکده دامپزشکی",
    shortName: "دامپزشکی",
    topBorder: "border-t-teal-600",
    accentText: "text-teal-600 dark:text-teal-400",
    accentBg: "bg-teal-50/80 dark:bg-teal-950/40",
    accentBorder: "border-teal-200/80 dark:border-teal-800/60",
    avatarRing: "from-teal-500 to-cyan-600",
    badgeClass: "bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    editBtn: "bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-800/60"
  },
  "دانشکده تربیت بدنی و علوم ورزشی": {
    name: "دانشکده تربیت بدنی و علوم ورزشی",
    shortName: "تربیت بدنی",
    topBorder: "border-t-orange-600",
    accentText: "text-orange-600 dark:text-orange-400",
    accentBg: "bg-orange-50/80 dark:bg-orange-950/40",
    accentBorder: "border-orange-200/80 dark:border-orange-800/60",
    avatarRing: "from-orange-500 to-amber-600",
    badgeClass: "bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    editBtn: "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-800/60"
  },
  "دانشکده کشاورزی و منابع طبیعی اهر": {
    name: "دانشکده کشاورزی و منابع طبیعی اهر",
    shortName: "منابع طبیعی اهر",
    topBorder: "border-t-lime-600",
    accentText: "text-lime-700 dark:text-lime-400",
    accentBg: "bg-lime-50/80 dark:bg-lime-950/40",
    accentBorder: "border-lime-200/80 dark:border-lime-800/60",
    avatarRing: "from-lime-500 to-green-600",
    badgeClass: "bg-lime-50 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800",
    editBtn: "bg-lime-50 dark:bg-lime-900/30 hover:bg-lime-100 dark:hover:bg-lime-900/50 text-lime-700 dark:text-lime-400 border-lime-200/80 dark:border-lime-800/60"
  },
  "دانشکده فنی و مهندسی مرند": {
    name: "دانشکده فنی و مهندسی مرند",
    shortName: "فنی مرند",
    topBorder: "border-t-slate-500",
    accentText: "text-slate-600 dark:text-slate-300",
    accentBg: "bg-slate-100/80 dark:bg-slate-900/40",
    accentBorder: "border-slate-200/80 dark:border-slate-700/60",
    avatarRing: "from-slate-500 to-gray-600",
    badgeClass: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    editBtn: "bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60"
  },
  "دانشکده فنی و مهندسی میانه": {
    name: "دانشکده فنی و مهندسی میانه",
    shortName: "فنی میانه",
    topBorder: "border-t-amber-600",
    accentText: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-50/80 dark:bg-amber-950/40",
    accentBorder: "border-amber-200/80 dark:border-amber-800/60",
    avatarRing: "from-amber-500 to-orange-600",
    badgeClass: "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    editBtn: "bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60"
  }
};

export const DEFAULT_FACULTY_THEME: FacultyTheme = {
  name: "دانشگاه تبریز",
  shortName: "دانشگاه تبریز",
  topBorder: "border-t-indigo-500",
  accentText: "text-indigo-600 dark:text-indigo-400",
  accentBg: "bg-indigo-50/80 dark:bg-indigo-950/40",
  accentBorder: "border-indigo-200/80 dark:border-indigo-800/60",
  avatarRing: "from-indigo-500 to-blue-600",
  badgeClass: "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  editBtn: "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800/60"
};

export function getFacultyTheme(facultyName?: string): FacultyTheme {
  if (!facultyName) return DEFAULT_FACULTY_THEME;
  return FACULTY_THEMES[facultyName] || DEFAULT_FACULTY_THEME;
}
