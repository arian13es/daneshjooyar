/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Intelligence Engine: موتور جستجوی معنایی برای پایگاه دانش اصلی
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

import LOCAL_KNOWLEDGE_FAQ, { FaqItem } from "../data/originalFaq";

const PERSIAN_FILLERS = [
  "ایا", "آیا", "میشه", "می شه", "میتونم", "می تونم", "چطور", "چطوری", "چگونه", 
  "لطفا", "لطفاً", "درباره", "در مورد", "توضیح بده", "بهم بگو", "میخوام", "می خواهم",
  "چیست", "چیه", "کجاست", "کی", "کجا", "چه جوری", "هست", "هستش", "میدهند", "میدن", "داده", "میشود"
];

/**
 * Normalizes Persian and Arabic text:
 * - Unifies Yeh and Kaf
 * - Strips diacritics
 * - Normalizes ZWNJ and spaces
 * - Converts numerals to ASCII
 */
export function normalizeAssistantText(str: string): string {
  if (!str) return "";
  let s = str.toLowerCase();

  // Remove Arabic diacritics
  s = s.replace(/[\u064B-\u065F\u0670]/g, "");

  // Unify Yeh, Kaf and Heh
  s = s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ة/g, "ه").replace(/آ/g, "ا");

  // Convert digits to standard ASCII
  s = s.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
  s = s.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());

  // Replace ZWNJ, punctuation, brackets and hyphens with space
  s = s.replace(/[\u200C\u200E\u200F\-_/\\؟?.,،!؛;:()[\]{}"'«»]/g, " ");

  // Compress whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/**
 * High-precision, collision-resistant matching against LOCAL_KNOWLEDGE_FAQ.
 */
export function queryOriginalFaq(rawQuery: string): { match: FaqItem | null; score: number } {
  const normQuery = normalizeAssistantText(rawQuery);
  if (!normQuery) return { match: null, score: 0 };

  const queryTokens = normQuery
    .split(" ")
    .filter(t => t.length > 1 && !PERSIAN_FILLERS.includes(t));

  if (queryTokens.length === 0) return { match: null, score: 0 };

  const queryTokenSet = new Set(queryTokens);

  let bestMatch: FaqItem | null = null;
  let highestScore = 0;

  for (const item of LOCAL_KNOWLEDGE_FAQ) {
    let score = 0;
    const normKeywords = item.keywords.map(normalizeAssistantText);

    let bestKeywordScore = 0;

    for (const kw of normKeywords) {
      if (!kw) continue;
      const kwTokens = kw.split(" ").filter(t => t.length > 1 && !PERSIAN_FILLERS.includes(t));
      if (kwTokens.length === 0) continue;

      let kwScore = 0;

      // 1. Exact full query match
      if (normQuery === kw) {
        kwScore = 200;
      }
      // 2. Exact phrase match: the keyword appears verbatim in the query
      else if (normQuery.includes(kw)) {
        kwScore = 90 + kwTokens.length * 30;
      }
      // 3. User query is a subpart of the keyword
      else if (kw.includes(normQuery) && normQuery.length >= 4) {
        kwScore = 70 + kwTokens.length * 15;
      }
      // 4. Token-set containment: EVERY token of the keyword is present in the query
      else {
        const matchingTokensCount = kwTokens.filter(t => queryTokenSet.has(t)).length;
        if (matchingTokensCount === kwTokens.length && kwTokens.length >= 2) {
          // All tokens matched regardless of order!
          kwScore = 80 + kwTokens.length * 25;
        } else if (matchingTokensCount > 0) {
          kwScore = matchingTokensCount * 12;
        }
      }

      if (kwScore > bestKeywordScore) {
        bestKeywordScore = kwScore;
      }
    }

    score += bestKeywordScore;

    // Coverage ratio: how many unique query tokens are covered by this item
    let coveredTokens = 0;
    const allItemTokens = new Set(
      normKeywords.flatMap(kw => kw.split(" ").filter(t => t.length > 1))
    );

    for (const qt of queryTokens) {
      if (allItemTokens.has(qt)) {
        coveredTokens++;
      }
    }

    const coverageRatio = coveredTokens / queryTokens.length;
    score += Math.round(coverageRatio * 40);

    // Disambiguation & domain mismatch guards
    // If query asks about "خوابگاه" (dorm), but item has no dorm tokens, eliminate or strongly penalize
    if (queryTokenSet.has("خوابگاه") && !allItemTokens.has("خوابگاه") && !allItemTokens.has("اسکان")) {
      score = 0;
    }

    // If query asks about "سلف" / "غذا", but item has no food tokens
    if (
      (queryTokenSet.has("سلف") || queryTokenSet.has("غذا") || queryTokenSet.has("سماد") || queryTokenSet.has("رستوران")) &&
      !allItemTokens.has("سلف") && !allItemTokens.has("غذا") && !allItemTokens.has("سماد") && !allItemTokens.has("رستوران")
    ) {
      score = Math.max(0, score - 60);
    }

    // If query asks specifically about "تابستان" / "تابستون", but item does not belong to summer domain
    if (
      (queryTokenSet.has("تابستان") || queryTokenSet.has("تابستون")) &&
      !allItemTokens.has("تابستان") && !allItemTokens.has("تابستون") && !allItemTokens.has("تابستانه") && !allItemTokens.has("تابستانی")
    ) {
      score = Math.max(0, score - 80);
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (highestScore >= 10 && bestMatch) {
    return { match: bestMatch, score: highestScore };
  }

  return { match: null, score: 0 };
}
