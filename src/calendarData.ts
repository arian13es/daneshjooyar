import * as jalaali from "jalaali-js";
import holidaysData from "./holidays.json";

export const EXACT_OCCASIONS = holidaysData as Record<string, { isHoliday: boolean, title: string }>;

// Fixed solar (Shamsi) holidays that occur every year on the same day
const FIXED_SOLAR_HOLIDAYS: Record<string, string> = {
  "1-1": "آغاز عید نوروز",
  "1-2": "عید نوروز",
  "1-3": "عید نوروز",
  "1-4": "عید نوروز",
  "1-12": "روز جمهوری اسلامی ایران",
  "1-13": "روز طبیعت (سیزده‌بدر)",
  "3-14": "رحلت امام خمینی",
  "3-15": "قیام خونین ۱۵ خرداد",
  "11-22": "پیروزی انقلاب اسلامی ایران",
  "12-29": "روز ملی شدن صنعت نفت ایران"
};

/**
 * Calculates month starting day of week and days in month purely algorithmically.
 * Saturday = 0, Sunday = 1, ..., Friday = 6
 */
export const getCalendarMonthInfo = (jy: number, jm: number): { start: number, length: number } => {
  const length = jalaali.jalaaliMonthLength(jy, jm);
  const greg = jalaali.toGregorian(jy, jm, 1);
  const gDate = new Date(greg.gy, greg.gm - 1, greg.gd);
  const start = (gDate.getDay() + 1) % 7;
  return { start, length };
};

/**
 * Dynamic accessor to preserve backward compatibility for CALENDAR_GRID[jy][jm]
 */
export const CALENDAR_GRID = new Proxy({}, {
  get: (_, yearKey: string) => {
    const jy = parseInt(yearKey, 10);
    if (isNaN(jy)) return undefined;
    return new Proxy({}, {
      get: (__, monthKey: string) => {
        const jm = parseInt(monthKey, 10);
        if (isNaN(jm)) return undefined;
        return getCalendarMonthInfo(jy, jm);
      }
    });
  }
}) as Record<number, Record<number, { start: number, length: number }>>;

export const getOccasion = (jy: number, jm: number, jd: number) => {
  const key = `${jy}-${jm}-${jd}`;
  if (EXACT_OCCASIONS[key]) {
    const occ = EXACT_OCCASIONS[key];
    if (occ.title.includes("امام حسن عسکری") || occ.title.includes("هشتم ربیع الاول")) {
      return { ...occ, isHoliday: false };
    }
    return occ;
  }

  // Fallback to recurring solar holidays for any year beyond pre-indexed range
  const solarKey = `${jm}-${jd}`;
  if (FIXED_SOLAR_HOLIDAYS[solarKey]) {
    return {
      isHoliday: true,
      title: FIXED_SOLAR_HOLIDAYS[solarKey]
    };
  }

  // 30 Esfand is holiday on leap years
  if (jm === 12 && jd === 30 && jalaali.isLeapJalaaliYear(jy)) {
    return {
      isHoliday: true,
      title: "آخرین روز سال (کبیسه)"
    };
  }

  return null;
};
