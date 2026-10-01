/**
 * Regression tests for the GPA score parser.
 *
 * The component previously mapped only ASCII "," and "/" to ".", so a score
 * typed with the standard Persian decimal separator (U+066B ٫) was silently
 * truncated by parseFloat: "۱۲٫۵" became 12 and passed the validity check.
 */
import { describe, it, expect } from "vitest";
import { normalizeNum } from "./CumulativeGpaCalculator";

const parseScore = (input: string) => parseFloat(normalizeNum(input));

describe("CumulativeGpaCalculator.normalizeNum", () => {
  it("accepts the Persian decimal separator U+066B", () => {
    expect(parseScore("\u06F1\u06F2\u066B\u06F5")).toBe(12.5);
    expect(parseScore("\u06F1\u06F8\u066B\u06F7\u06F5")).toBe(18.75);
  });

  it("accepts ASCII, comma and slash decimals", () => {
    expect(parseScore("12.5")).toBe(12.5);
    expect(parseScore("12,5")).toBe(12.5);
    expect(parseScore("12/5")).toBe(12.5);
  });

  it("converts Persian and Arabic-Indic integers", () => {
    expect(parseScore("\u06F2\u06F0")).toBe(20);
    expect(parseScore("\u0661\u0662")).toBe(12);
  });

  it("strips Persian thousands separators before parsing", () => {
    // U+066C is a thousands separator -> removed, not treated as a decimal point
    expect(parseScore("\u06F1\u066C\u06F2\u06F3\u06F4")).toBe(1234);
    expect(parseScore("\u06F1\u066C\u06F2\u06F3\u06F4\u066B\u06F5")).toBe(1234.5);
  });

  it("returns NaN for genuinely unparseable input", () => {
    expect(Number.isNaN(parseScore("نامعتبر"))).toBe(true);
    expect(Number.isNaN(parseScore(""))).toBe(true);
  });

  it("never silently truncates a Persian decimal score to its integer part", () => {
    // This is the exact regression: 12.5 must not become 12.
    const value = parseScore("\u06F1\u06F2\u066B\u06F5");
    expect(value).not.toBe(12);
    expect(value).toBe(12.5);
  });
});
