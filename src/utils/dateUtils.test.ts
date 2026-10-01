/**
 * Tests for dateUtils — digit conversion, Persian weekday parsing, week parity, chronology.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  PERSIAN_MONTHS,
  toEnglishDigits,
  toPersianDigits,
  normalizeDay,
  normalizePersian,
  getChronologicalTimestamp,
  compareChronologicalTimestamps,
  parseJsDay,
  isEvenWeekAt,
  WEEK_PARITY_ANCHOR_MS,
  datesForWeekdayInHorizon
} from "./dateUtils";

describe("dateUtils digit helpers", () => {
  it("toEnglishDigits converts Persian digits", () => {
    expect(toEnglishDigits("۱۲۳۴۵۶۷۸۹")).toBe("123456789");
    expect(toEnglishDigits("۰")).toBe("0");
  });

  it("toEnglishDigits converts Arabic digits", () => {
    expect(toEnglishDigits("٠١٢٣")).toBe("0123");
  });

  it("toEnglishDigits passes English digits through", () => {
    expect(toEnglishDigits("1404")).toBe("1404");
    expect(toEnglishDigits("")).toBe("");
  });

  it("toPersianDigits converts number to Persian", () => {
    expect(toPersianDigits(15)).toBe("۱۵");
    expect(toPersianDigits("1404")).toBe("۱۴۰۴");
  });

  it("round-trips Persian digits", () => {
    expect(toEnglishDigits(toPersianDigits(98765))).toBe("98765");
  });

  it("normalizeDay strips whitespace and ZWNJ", () => {
    expect(normalizeDay("سه شنبه")).toBe("سهشنبه");
    expect(normalizeDay("سه‌شنبه")).toBe("سهشنبه");
  });

  it("normalizePersian strips whitespace and ZWNJ", () => {
    expect(normalizePersian("a b‌c")).toBe("abc");
  });
});

describe("parseJsDay", () => {
  it("maps Persian weekdays to JS day indices (Sunday=0)", () => {
    expect(parseJsDay("یکشنبه")).toBe(0);
    expect(parseJsDay("دوشنبه")).toBe(1);
    expect(parseJsDay("سهشنبه")).toBe(2);
    expect(parseJsDay("سه شنبه")).toBe(2);
    expect(parseJsDay("چهارشنبه")).toBe(3);
    expect(parseJsDay("پنجشنبه")).toBe(4);
    expect(parseJsDay("جمعه")).toBe(5);
    expect(parseJsDay("شنبه")).toBe(6);
  });

  it("returns -1 for missing or unknown", () => {
    expect(parseJsDay(undefined)).toBe(-1);
    expect(parseJsDay("")).toBe(-1);
    expect(parseJsDay("روز_x")).toBe(-1);
  });
});

describe("isEvenWeekAt", () => {
  it("anchor date (2026-09-26) is an even week", () => {
    expect(isEvenWeekAt(WEEK_PARITY_ANCHOR_MS, 0)).toBe(true);
  });

  it("one week after anchor is odd", () => {
    const oneWeekLater = WEEK_PARITY_ANCHOR_MS + 7 * 24 * 60 * 60 * 1000;
    expect(isEvenWeekAt(oneWeekLater, 0)).toBe(false);
  });

  it("two weeks after anchor is even again", () => {
    const twoWeeksLater = WEEK_PARITY_ANCHOR_MS + 14 * 24 * 60 * 60 * 1000;
    expect(isEvenWeekAt(twoWeeksLater, 0)).toBe(true);
  });

  it("offset=1 flips parity", () => {
    expect(isEvenWeekAt(WEEK_PARITY_ANCHOR_MS, 1)).toBe(false);
  });

  it("one day before anchor stays in same week (even)", () => {
    const dayBefore = WEEK_PARITY_ANCHOR_MS - 24 * 60 * 60 * 1000;
    // Anchor is Saturday; Friday before is previous week → odd
    expect(isEvenWeekAt(dayBefore, 0)).toBe(false);
  });
});

describe("getChronologicalTimestamp", () => {
  it("returns Infinity for empty or invalid input", () => {
    expect(getChronologicalTimestamp("")).toBe(Infinity);
    expect(getChronologicalTimestamp("not a date")).toBe(Infinity);
    expect(getChronologicalTimestamp("۹۹ ناموجود")).toBe(Infinity);
  });

  it("returns finite number for valid Persian date with explicit year", () => {
    const ts = getChronologicalTimestamp("15 خرداد 1405", "10:30");
    expect(Number.isFinite(ts)).toBe(true);
  });

  it("orders dates correctly across months with explicit year", () => {
    const a = getChronologicalTimestamp("1 فروردین 1405", "08:00");
    const b = getChronologicalTimestamp("15 خرداد 1405", "08:00");
    expect(a).toBeLessThan(b);
  });

  it("uses default time 10:00 when time missing", () => {
    const withDefault = getChronologicalTimestamp("15 خرداد 1405");
    const withExplicit = getChronologicalTimestamp("15 خرداد 1405", "10:00");
    expect(withDefault).toBe(withExplicit);
  });

  it("clamps invalid hour to 10", () => {
    const badHour = getChronologicalTimestamp("15 خرداد 1405", "99:00");
    const defaultHour = getChronologicalTimestamp("15 خرداد 1405", "10:00");
    expect(badHour).toBe(defaultHour);
  });

  it("returns Infinity for day out of month range", () => {
    expect(getChronologicalTimestamp("32 خرداد 1405", "10:00")).toBe(Infinity);
  });
});

describe("compareChronologicalTimestamps", () => {
  it("orders two valid dates", () => {
    const cmp = compareChronologicalTimestamps(
      "1 فروردین 1405",
      "08:00",
      "15 خرداد 1405",
      "08:00"
    );
    expect(cmp).toBeLessThan(0);
  });

  it("returns 0 when both invalid", () => {
    expect(compareChronologicalTimestamps("", "", undefined, undefined)).toBe(0);
  });

  it("pushes invalid A to bottom", () => {
    expect(
      compareChronologicalTimestamps("bad", "", "1 خرداد 1405", "10:00")
    ).toBeGreaterThan(0);
  });

  it("pushes invalid B to bottom", () => {
    expect(
      compareChronologicalTimestamps("1 خرداد 1405", "10:00", "bad", "")
    ).toBeLessThan(0);
  });
});

describe("datesForWeekdayInHorizon", () => {
  it("finds matching weekdays within horizon", () => {
    // 2026-09-19 is a Saturday (JS getDay() === 6)
    const from = new Date(2026, 8, 19);
    const saturdays = datesForWeekdayInHorizon(6, from, 13);
    // Day 0 = Sep 19, day 7 = Sep 26; day 14 = Oct 3 is outside horizon 13
    expect(saturdays.length).toBe(2);
    for (const d of saturdays) {
      expect(d.getDay()).toBe(6);
    }
  });

  it("returns empty for invalid jsDay", () => {
    const from = new Date(2026, 8, 19);
    expect(datesForWeekdayInHorizon(-1, from, 7)).toEqual([]);
    expect(datesForWeekdayInHorizon(7, from, 7)).toEqual([]);
  });

  it("returns only start day when horizon is 0", () => {
    const from = new Date(2026, 8, 19); // Saturday
    const result = datesForWeekdayInHorizon(6, from, 0);
    expect(result).toHaveLength(1);
  });
});

describe("PERSIAN_MONTHS", () => {
  it("has 12 months", () => {
    expect(PERSIAN_MONTHS).toHaveLength(12);
    expect(PERSIAN_MONTHS[0]).toBe("فروردین");
    expect(PERSIAN_MONTHS[11]).toBe("اسفند");
  });
});

describe("storage isolation between tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parity offset defaults to 0 when storage empty", () => {
    // getWeekParityOffset reads storage; with clear it should be 0
    expect(isEvenWeekAt(WEEK_PARITY_ANCHOR_MS)).toBe(true);
  });
});
