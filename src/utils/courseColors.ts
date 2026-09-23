/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: courseColors.ts (سیستم رنگ‌بندی تفکیک‌شده هوشمند کارت‌های دروس)
 * Author: Arian
 * ============================================================================
 */

export interface CourseColorPalette {
  id: string;
  name: string;
  hex: string;
  dotBg: string;
  // UI styling tokens (Tailwind classes)
  ui: {
    cardBg: string;
    cardBorder: string;
    stripe: string;
    badge: string;
    timeText: string;
  };
  // High-DPI Canvas styling tokens
  canvas: {
    light: {
      bg: string;
      border: string;
      stripe: string;
      badgeBg: string;
      badgeText: string;
      accentText: string;
      shadow: string;
    };
    dark: {
      bg: string;
      border: string;
      stripe: string;
      badgeBg: string;
      badgeText: string;
      accentText: string;
      shadow: string;
    };
  };
}

export const COURSE_PALETTES: CourseColorPalette[] = [
  {
    id: "indigo",
    name: "نیلگون",
    hex: "#4f46e5",
    dotBg: "bg-indigo-500",
    ui: {
      cardBg: "bg-gradient-to-l from-indigo-50/70 via-white to-white dark:from-indigo-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-indigo-100 dark:border-indigo-800/40 hover:border-indigo-400 dark:hover:border-indigo-500",
      stripe: "bg-indigo-500",
      badge: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      timeText: "text-indigo-600 dark:text-indigo-400"
    },
    canvas: {
      light: {
        bg: "#f5f8ff",
        border: "#818cf8",
        stripe: "#4f46e5",
        badgeBg: "#e0e7ff",
        badgeText: "#3730a3",
        accentText: "#4338ca",
        shadow: "rgba(79, 70, 229, 0.14)"
      },
      dark: {
        bg: "#0e1833",
        border: "#6366f1",
        stripe: "#818cf8",
        badgeBg: "#1e295d",
        badgeText: "#c7d2fe",
        accentText: "#a5b4fc",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "emerald",
    name: "زمردی",
    hex: "#059669",
    dotBg: "bg-emerald-500",
    ui: {
      cardBg: "bg-gradient-to-l from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-emerald-100 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-500",
      stripe: "bg-emerald-500",
      badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      timeText: "text-emerald-600 dark:text-emerald-400"
    },
    canvas: {
      light: {
        bg: "#f2fdf6",
        border: "#34d399",
        stripe: "#059669",
        badgeBg: "#dcfce7",
        badgeText: "#166534",
        accentText: "#047857",
        shadow: "rgba(5, 150, 105, 0.14)"
      },
      dark: {
        bg: "#092116",
        border: "#10b981",
        stripe: "#34d399",
        badgeBg: "#134e3a",
        badgeText: "#a7f3d0",
        accentText: "#6ee7b7",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "amber",
    name: "کهربایی",
    hex: "#d97706",
    dotBg: "bg-amber-500",
    ui: {
      cardBg: "bg-gradient-to-l from-amber-50/70 via-white to-white dark:from-amber-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-amber-100 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-500",
      stripe: "bg-amber-500",
      badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      timeText: "text-amber-600 dark:text-amber-400"
    },
    canvas: {
      light: {
        bg: "#fffdf5",
        border: "#fbbf24",
        stripe: "#d97706",
        badgeBg: "#fef3c7",
        badgeText: "#92400e",
        accentText: "#b45309",
        shadow: "rgba(217, 119, 6, 0.14)"
      },
      dark: {
        bg: "#241704",
        border: "#f59e0b",
        stripe: "#fbbf24",
        badgeBg: "#452a07",
        badgeText: "#fde68a",
        accentText: "#fcd34d",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "violet",
    name: "ارغوانی",
    hex: "#7c3aed",
    dotBg: "bg-violet-500",
    ui: {
      cardBg: "bg-gradient-to-l from-violet-50/70 via-white to-white dark:from-violet-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-violet-100 dark:border-violet-800/40 hover:border-violet-400 dark:hover:border-violet-500",
      stripe: "bg-violet-500",
      badge: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      timeText: "text-violet-600 dark:text-violet-400"
    },
    canvas: {
      light: {
        bg: "#faf7ff",
        border: "#a78bfa",
        stripe: "#7c3aed",
        badgeBg: "#ede9fe",
        badgeText: "#5b21b6",
        accentText: "#6d28d9",
        shadow: "rgba(124, 58, 237, 0.14)"
      },
      dark: {
        bg: "#170d2b",
        border: "#8b5cf6",
        stripe: "#a78bfa",
        badgeBg: "#321c5b",
        badgeText: "#ddd6fe",
        accentText: "#c4b5fd",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "rose",
    name: "یاقوتی",
    hex: "#e11d48",
    dotBg: "bg-rose-500",
    ui: {
      cardBg: "bg-gradient-to-l from-rose-50/70 via-white to-white dark:from-rose-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-rose-100 dark:border-rose-800/40 hover:border-rose-400 dark:hover:border-rose-500",
      stripe: "bg-rose-500",
      badge: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      timeText: "text-rose-600 dark:text-rose-400"
    },
    canvas: {
      light: {
        bg: "#fff5f6",
        border: "#fb7185",
        stripe: "#e11d48",
        badgeBg: "#ffe4e6",
        badgeText: "#9f1239",
        accentText: "#be123c",
        shadow: "rgba(225, 29, 72, 0.14)"
      },
      dark: {
        bg: "#260a13",
        border: "#f43f5e",
        stripe: "#fb7185",
        badgeBg: "#4a1122",
        badgeText: "#fecdd3",
        accentText: "#fda4af",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "cyan",
    name: "فیروزه‌ای",
    hex: "#0891b2",
    dotBg: "bg-cyan-500",
    ui: {
      cardBg: "bg-gradient-to-l from-cyan-50/70 via-white to-white dark:from-cyan-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-cyan-100 dark:border-cyan-800/40 hover:border-cyan-400 dark:hover:border-cyan-500",
      stripe: "bg-cyan-500",
      badge: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
      timeText: "text-cyan-600 dark:text-cyan-400"
    },
    canvas: {
      light: {
        bg: "#f2fbfd",
        border: "#22d3ee",
        stripe: "#0891b2",
        badgeBg: "#cffafe",
        badgeText: "#155e75",
        accentText: "#0e7490",
        shadow: "rgba(8, 145, 178, 0.14)"
      },
      dark: {
        bg: "#071f26",
        border: "#06b6d4",
        stripe: "#22d3ee",
        badgeBg: "#0e3d48",
        badgeText: "#a5f3fc",
        accentText: "#67e8f9",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "teal",
    name: "سدری",
    hex: "#0d9488",
    dotBg: "bg-teal-500",
    ui: {
      cardBg: "bg-gradient-to-l from-teal-50/70 via-white to-white dark:from-teal-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-teal-100 dark:border-teal-800/40 hover:border-teal-400 dark:hover:border-teal-500",
      stripe: "bg-teal-500",
      badge: "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      timeText: "text-teal-600 dark:text-teal-400"
    },
    canvas: {
      light: {
        bg: "#f2fdfa",
        border: "#2dd4bf",
        stripe: "#0d9488",
        badgeBg: "#ccfbf1",
        badgeText: "#115e59",
        accentText: "#0f766e",
        shadow: "rgba(13, 148, 136, 0.14)"
      },
      dark: {
        bg: "#08211e",
        border: "#14b8a6",
        stripe: "#2dd4bf",
        badgeBg: "#103e38",
        badgeText: "#99f6e4",
        accentText: "#5eead4",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  },
  {
    id: "sky",
    name: "آسمانی",
    hex: "#0284c7",
    dotBg: "bg-sky-500",
    ui: {
      cardBg: "bg-gradient-to-l from-sky-50/70 via-white to-white dark:from-sky-950/30 dark:via-slate-800 dark:to-slate-800",
      cardBorder: "border-sky-100 dark:border-sky-800/40 hover:border-sky-400 dark:hover:border-sky-500",
      stripe: "bg-sky-500",
      badge: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      timeText: "text-sky-600 dark:text-sky-400"
    },
    canvas: {
      light: {
        bg: "#f4faff",
        border: "#38bdf8",
        stripe: "#0284c7",
        badgeBg: "#e0f2fe",
        badgeText: "#0369a1",
        accentText: "#0284c7",
        shadow: "rgba(2, 132, 199, 0.14)"
      },
      dark: {
        bg: "#081d2e",
        border: "#38bdf8",
        stripe: "#7dd3fc",
        badgeBg: "#0c3b5e",
        badgeText: "#bae6fd",
        accentText: "#7dd3fc",
        shadow: "rgba(0, 0, 0, 0.45)"
      }
    }
  }
];

/**
 * Deterministically maps any course name string to a consistent palette index,
 * guaranteeing the exact same color identity across all sessions and components.
 */
export function getCourseColor(courseName: string, customColorId?: string): CourseColorPalette {
  if (customColorId) {
    const found = COURSE_PALETTES.find(p => p.id === customColorId);
    if (found) return found;
  }

  const normalized = (courseName || "").trim().toLowerCase();
  if (!normalized) return COURSE_PALETTES[0];

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COURSE_PALETTES.length;
  return COURSE_PALETTES[index];
}
