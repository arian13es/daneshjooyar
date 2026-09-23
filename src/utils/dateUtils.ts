import * as jalaali from "jalaali-js";
import { safeStorageGetString } from "./storageUtils";

export const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
] as const;

export const WEEKDAYS_MAP: Record<string, number> = {
  "یکشنبه": 1,
  "دوشنبه": 2,
  "سهشنبه": 3,
  "سه شنبه": 3,
  "چهارشنبه": 4,
  "پنجشنبه": 5,
  "جمعه": 6,
  "شنبه": 7
};

/**
 * Converts Persian and Arabic digits to standard ASCII English digits.
 */
export const toEnglishDigits = (str: string): string => {
  return (str || "")
    .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
};

/**
 * Converts English digits to Persian digits.
 */
export const toPersianDigits = (num: number | string): string => {
  return String(num).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
};

/**
 * Normalizes Persian day string by removing whitespaces and zero-width non-joiners (ZWNJ).
 */
export const normalizeDay = (str: string): string => {
  return (str || "").replace(/[\s‌]/g, "");
};

/**
 * Normalizes Persian text by removing whitespaces and zero-width non-joiners (ZWNJ).
 */
export const normalizePersian = (str: string): string => {
  return (str || "").replace(/[\s‌]/g, "");
};

/**
 * Resolves an event's date string (e.g. "۱۵ خرداد") and optional time string (e.g. "10:30")
 * into a full chronological absolute millisecond timestamp, correctly handling semester
 * boundaries and cross-year transitions.
 */
export const getChronologicalTimestamp = (dateStr: string, timeStr: string = "10:00"): number => {
  if (!dateStr || typeof dateStr !== "string") return Infinity;

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return Infinity;

  const dayParsed = parseInt(toEnglishDigits(parts[0]), 10);
  const monthIdx = PERSIAN_MONTHS.indexOf(parts[1] as (typeof PERSIAN_MONTHS)[number]);
  if (isNaN(dayParsed) || monthIdx === -1) return Infinity;

  const jm = monthIdx + 1;
  const jd = dayParsed;

  const now = new Date();
  const jNow = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());

  let jy = jNow.jy;
  let hasExplicitYear = false;
  if (parts.length >= 3) {
    const parsedYear = parseInt(toEnglishDigits(parts[2]), 10);
    if (!isNaN(parsedYear) && parsedYear > 1300 && parsedYear < 1500) {
      jy = parsedYear;
      hasExplicitYear = true;
    }
  }

  let [h, m] = (timeStr || "10:00").split(":").map(s => parseInt(toEnglishDigits(s), 10));
  if (!Number.isFinite(h) || h < 0 || h > 23) h = 10;
  if (!Number.isFinite(m) || m < 0 || m > 59) m = 0;

  try {
    const maxDay = jalaali.jalaaliMonthLength(jy, jm);
    if (jd < 1 || jd > maxDay) return Infinity;
  } catch {
    return Infinity;
  }

  let gDate = jalaali.toGregorian(jy, jm, jd);
  let finalDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd, h, m);

  // If no explicit year was provided and the date is more than 14 days in the past,
  // it belongs to the upcoming academic cycle/year
  if (!hasExplicitYear && finalDate.getTime() < now.getTime() - 14 * 24 * 3600 * 1000) {
    try {
      const maxDayNext = jalaali.jalaaliMonthLength(jNow.jy + 1, jm);
      if (jd >= 1 && jd <= maxDayNext) {
        gDate = jalaali.toGregorian(jNow.jy + 1, jm, jd);
        finalDate = new Date(gDate.gy, gDate.gm - 1, gDate.gd, h, m);
      }
    } catch {
      /* keep current-year interpretation */
    }
  }

  return finalDate.getTime();
};

/**
 * Safe comparator that guarantees strict ordering and never produces NaN
 * even when dates are missing, custom, or invalid.
 */
export const compareChronologicalTimestamps = (
  dateA: string | undefined,
  timeA: string | undefined,
  dateB: string | undefined,
  timeB: string | undefined
): number => {
  const tA = getChronologicalTimestamp(dateA || "", timeA || "10:00");
  const tB = getChronologicalTimestamp(dateB || "", timeB || "10:00");

  const validA = Number.isFinite(tA);
  const validB = Number.isFinite(tB);

  if (!validA && !validB) return 0;
  if (!validA) return 1; // items with unknown dates pushed to bottom
  if (!validB) return -1;
  return tA - tB;
};

/**
 * Parses a Persian weekday string to a JS day index (0=Sunday … 6=Saturday).
 * Returns -1 when the input is missing/unrecognized.
 */
export const parseJsDay = (wDay?: string): number => {
  if (!wDay) return -1;
  const d = wDay.replace(/[\s‌]/g, "");
  if (d.includes("یک")) return 0;
  if (d.includes("دو")) return 1;
  if (d.includes("سه")) return 2;
  if (d.includes("چهار")) return 3;
  if (d.includes("پنج")) return 4;
  if (d.includes("جمعه")) return 5;
  if (d.includes("شنبه")) return 6;
  return -1;
};

/**
 * Week-parity anchor: Saturday 2026-09-19 (۲۸ شهریور ۱۴۰۵) is an EVEN week.
 * The optional user offset (tabriz_week_parity) flips parity when the
 * university schedule drifts from this anchor.
 */
export const WEEK_PARITY_ANCHOR_MS = new Date(2026, 8, 19, 0, 0, 0, 0).getTime();

export const getWeekParityOffset = (): number => {
  const raw = safeStorageGetString("tabriz_week_parity", "0");
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
};

/** True when the week containing `timestampMs` is an even week. */
export const isEvenWeekAt = (timestampMs: number, offset?: number): boolean => {
  const parityOffset = offset ?? getWeekParityOffset();
  const startOfAnchorDay = WEEK_PARITY_ANCHOR_MS;
  const startOfTargetDay = (() => {
    const d = new Date(timestampMs);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  })();
  const diffDays = Math.round((startOfTargetDay - startOfAnchorDay) / (24 * 60 * 60 * 1000));
  const weekNum = Math.floor(diffDays / 7) + parityOffset;
  return weekNum % 2 === 0;
};

/**
 * Returns local-midnight dates within `horizonDays` (inclusive) from `from`
 * whose JS weekday equals `jsDay`.
 */
export const datesForWeekdayInHorizon = (
  jsDay: number,
  from: Date,
  horizonDays: number
): Date[] => {
  const result: Date[] = [];
  if (jsDay < 0 || jsDay > 6) return result;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i <= horizonDays; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    if (d.getDay() === jsDay) result.push(d);
  }
  return result;
};
