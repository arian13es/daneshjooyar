/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: uxAuditor.ts (موتور ارزیابی جامع ارگونومی، خوانایی و سازگاری UX)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import { BudgetState } from "../types";
import { toEnglishDigits, toPersianDigits } from "../utils/dateUtils";

export interface AuditIssue {
  severity: "critical" | "warning" | "info";
  category: "clipping" | "typography_bidi" | "touch_target" | "theme_contrast" | "data_integrity";
  message: string;
  elementSelector?: string;
  context?: Record<string, unknown>;
}

export interface PersonaAuditReport {
  personaId: number;
  codeName: string;
  platformName: string;
  viewport: { width: number; height: number };
  archetype: string;
  isDarkMode: boolean;
  score: number; // 0 to 100
  passed: boolean;
  issues: AuditIssue[];
  metrics: {
    totalSpent: number;
    remaining: number;
    progressPercent: number;
    touchTargetsAudited: number;
    bidiChecksPassed: boolean;
    contrastChecksPassed: boolean;
  };
}

export class UxAuditor {
  /**
   * ارزیابی یکپارچگی محاسباتی و تراز مالی
   */
  public static auditBudgetMath(state: BudgetState): { 
    totalSpent: number; 
    remaining: number; 
    progressPercent: number; 
    issues: AuditIssue[] 
  } {
    const issues: AuditIssue[] = [];
    const totalSpent = state.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const savings = state.savings || 0;
    const limit = state.monthlyLimit || 0;
    const remaining = limit - totalSpent - savings;

    let progressPercent = 0;
    if (limit > 0) {
      progressPercent = Math.min(100, Math.max(0, Math.round(((totalSpent + savings) / limit) * 100)));
    }

    if (isNaN(remaining)) {
      issues.push({
        severity: "critical",
        category: "data_integrity",
        message: "مقدار باقیمانده بودجه با خطای NaN مواجه شده است."
      });
    }

    if (isNaN(progressPercent)) {
      issues.push({
        severity: "critical",
        category: "data_integrity",
        message: "درصد پیشرفت بودجه با خطای NaN مواجه شده است."
      });
    }

    // هشدار بودجه منفی در صورت عدم مدیریت
    if (remaining < 0) {
      issues.push({
        severity: "info",
        category: "data_integrity",
        message: `کاربر بیش از سقف تعیین شده خرج کرده است (تراز منفی: ${remaining.toLocaleString()} تومان).`
      });
    }

    return { totalSpent, remaining, progressPercent, issues };
  }

  /**
   * ممیزی تایپوگرافی، پایداری BiDi و عدم تداخل پرانتزها و واحد پول
   */
  public static auditBiDiTypography(htmlContent: string): { passed: boolean; issues: AuditIssue[] } {
    const issues: AuditIssue[] = [];

    // ۱. بررسی معکوس‌شدن پرانتز و درصد مانند (%5) یا (5%) با اعداد لاتین
    const bidiPercentBugRegex = /\(%[0-9]+\)|%\([0-9]+\)/;
    if (bidiPercentBugRegex.test(htmlContent)) {
      issues.push({
        severity: "critical",
        category: "typography_bidi",
        message: "باگ معکوس شدن علامت درصد و پرانتز (BiDi Flip) در رندر مشاهده شد."
      });
    }

    // ۲. بررسی استفاده مستقیم از نماد % انگلیسی در کنار عبارات فارسی بدون تبدیل به ارقام فارسی
    const unencodedPercentRegex = /[0-9]+%/;
    if (unencodedPercentRegex.test(htmlContent)) {
      issues.push({
        severity: "warning",
        category: "typography_bidi",
        message: "استفاده از درصد انگلیسی در متن فارسی ممکن است در برخی مرورگرهای موبایل جابجا شود."
      });
    }

    // ۳. بررسی حضور ارقام انگلیسی خام در ردیف مبالغ (باید به فونت فارسی وزیرمتن تبدیل شده باشد)
    // اگر در کنار کلمه تومان اعداد لاتین با فرمت 1,000 تومان آمده باشد
    const latinCurrencyRegex = /[0-9]+,[0-9]+ تومان/;
    if (latinCurrencyRegex.test(htmlContent)) {
      issues.push({
        severity: "warning",
        category: "typography_bidi",
        message: "مبالغ تومانی با ارقام انگلیسی رندر شده‌اند و به ارقام فارسی وزیرمتن تبدیل نشده‌اند."
      });
    }

    return {
      passed: issues.filter(i => i.severity === "critical").length === 0,
      issues
    };
  }

  /**
   * ممیزی ابعاد نمایشگر و بیرون‌زدگی دکمه‌ها (Screen Bounds & Button Clipping)
   */
  public static auditViewportFit(
    viewport: { width: number; height: number },
    fontScale: number,
    componentClasses: string[]
  ): { passed: boolean; issues: AuditIssue[] } {
    const issues: AuditIssue[] = [];

    // در نمایشگرهای با عرض کم (۳۲۰ پیکسل)، کلاس‌های با عرض ثابت زیاد (مانند w-96 یا min-w-[350px]) سرریز ایجاد می‌کنند
    if (viewport.width <= 360) {
      for (const cls of componentClasses) {
        if (cls.includes("min-w-[400px]") || cls.includes("w-[380px]")) {
          issues.push({
            severity: "critical",
            category: "clipping",
            message: `کلاس با عرض ثابت (${cls}) در نمایشگر ${viewport.width}px باعث سرریز افقی می‌شود.`
          });
        }
      }
    }

    // در فونت اسکیل بالا (۱.۴x)، طول متن‌ها ۴۰٪ افزایش می‌یابد
    if (fontScale >= 1.3 && viewport.width <= 360) {
      issues.push({
        severity: "info",
        category: "clipping",
        message: `شبیه‌سازی بزرگ‌نمایی فونت سیستم (${fontScale}x) در نمایشگر ${viewport.width}px فعال است.`
      });
    }

    return {
      passed: issues.filter(i => i.severity === "critical").length === 0,
      issues
    };
  }

  /**
   * ممیزی کنتراست تم شب و روز (Dark / Light Theme Compliance)
   */
  public static auditThemeMode(isDarkMode: boolean, htmlContent: string): { passed: boolean; issues: AuditIssue[] } {
    const issues: AuditIssue[] = [];

    // بررسی کلاس‌های نامعتبر پیشین که باعث باگ تم شده بودند
    if (htmlContent.includes("slate-850") || htmlContent.includes("slate-750") || htmlContent.includes("slate-650")) {
      issues.push({
        severity: "critical",
        category: "theme_contrast",
        message: "کلاس نامعتبر در پالت Tailwind کشف شد (مانند slate-850 یا slate-750) که در دارک‌مود استایل را از کار می‌اندازد."
      });
    }

    // در لایت مود نباید گرادیان مشکی تیره روی کارت‌های اصلی باشد
    if (!isDarkMode && htmlContent.includes("from-emerald-900 via-teal-950 to-slate-900")) {
      issues.push({
        severity: "warning",
        category: "theme_contrast",
        message: "کارت در تم روز از رنگ‌های شبانه بسیار تیره استفاده می‌کند که باعث عدم تفکیک دارک/لایت مود می‌شود."
      });
    }

    return {
      passed: issues.filter(i => i.severity === "critical").length === 0,
      issues
    };
  }
}
