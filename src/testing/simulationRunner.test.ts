/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: simulationRunner.test.ts (موتور جامع تست و شبیه‌سازی ۱۰۰ کاربر)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { generate100Personas, SyntheticPersona } from "./personaGenerator";
import { UxAuditor, PersonaAuditReport } from "./uxAuditor";
import { runFullSimulation } from "./runSimulationCli";
import Dashboard from "../components/Dashboard";
import BudgetModal from "../components/BudgetModal";

describe("موتور شبیه‌سازی ۱۰۰ کاربر و ممیزی جامع UX / ارگونومی / پلتفرم‌ها", () => {
  const personas: SyntheticPersona[] = generate100Personas();

  it("تولید دقیق ۱۰۰ کاربر در ماتریس ۲۵ گانه پلتفرم و رفتار", () => {
    expect(personas.length).toBe(100);

    const platformCounts: Record<string, number> = {};
    const archetypeCounts: Record<string, number> = {};

    personas.forEach(p => {
      platformCounts[p.platform.tier] = (platformCounts[p.platform.tier] || 0) + 1;
      archetypeCounts[p.archetypeId] = (archetypeCounts[p.archetypeId] || 0) + 1;
      expect(p.profile.firstName).toBeTruthy();
      expect(p.profile.faculty).toBeTruthy();
      expect(p.platform.viewport.width).toBeGreaterThanOrEqual(280);
    });

    // هر ۵ رده پلتفرم باید دقیقاً ۲۰ کاربر داشته باشند (۵ * ۲۰ = ۱۰۰)
    expect(platformCounts["android_legacy"]).toBe(20);
    expect(platformCounts["android_mid"]).toBe(20);
    expect(platformCounts["android_flagship"]).toBe(20);
    expect(platformCounts["web_desktop"]).toBe(20);
    expect(platformCounts["tablet_foldable"]).toBe(20);

    // هر ۵ آرکتایپ رفتاری باید دقیقاً ۲۰ کاربر داشته باشند
    expect(archetypeCounts["extreme_budgeter"]).toBe(20);
    expect(archetypeCounts["heavy_academic"]).toBe(20);
    expect(archetypeCounts["theme_switcher"]).toBe(20);
    expect(archetypeCounts["accessibility_scaled"]).toBe(20);
    expect(archetypeCounts["edge_offline"]).toBe(20);
  });

  it("ممیزی محاسباتی و تراز مالی بدون NaN برای ۱۰۰ کاربر", () => {
    let checkedCount = 0;
    personas.forEach(p => {
      const math = UxAuditor.auditBudgetMath(p.budgetState);
      expect(isNaN(math.totalSpent)).toBe(false);
      expect(isNaN(math.remaining)).toBe(false);
      expect(isNaN(math.progressPercent)).toBe(false);
      expect(math.progressPercent).toBeGreaterThanOrEqual(0);
      expect(math.progressPercent).toBeLessThanOrEqual(100);

      // عدم وجود خطای بحرانی در تراز ریاضی
      const criticalIssues = math.issues.filter(i => i.severity === "critical");
      expect(criticalIssues.length).toBe(0);
      checkedCount++;
    });
    expect(checkedCount).toBe(100);
  });

  it("ممیزی کارت کیف پول صفحه اصلی (Dashboard) در حالت‌های دارک و لایت برای تمام ۱۰۰ کاربر", () => {
    let successCount = 0;

    personas.forEach(p => {
      const html = renderToString(
        React.createElement(Dashboard, {
          classes: p.classes,
          exams: p.exams,
          projects: p.projects,
          profile: p.profile,
          onNavigate: () => {},
          onEditProfile: () => {},
          isDarkMode: p.isDarkMode,
          onToggleTheme: () => {},
          onUpdateProfile: () => {},
          budgetState: p.budgetState,
          onOpenBudget: () => {}
        })
      );

      // ۱. بررسی عدم وجود کلاس‌های نامعتبر Tailwind
      const themeAudit = UxAuditor.auditThemeMode(p.isDarkMode, html);
      expect(themeAudit.passed).toBe(true);

      // ۲. بررسی وجود کلاس‌های تم روز یا شب
      expect(html).toContain("from-emerald-");
      expect(html).toContain("to-teal-");

      // ۳. بررسی پایداری تایپوگرافی و BiDi
      const bidiAudit = UxAuditor.auditBiDiTypography(html);
      expect(bidiAudit.passed).toBe(true);

      // ۴. بررسی حضور تایل کیف پول
      expect(html).toContain("کیف پول من");

      successCount++;
    });

    expect(successCount).toBe(100);
  });

  it("ممیزی کامل داخل پنجره کیف پول (BudgetModal) برای تمامی حالات مرزی و سایزهای نمایشگر", () => {
    let successCount = 0;

    personas.forEach(p => {
      const html = renderToString(
        React.createElement(BudgetModal, {
          budgetState: p.budgetState,
          onUpdateBudget: () => {},
          onClose: () => {}
        })
      );

      // ۱. بررسی هدر و عدم وجود کلاس‌های نامعتبر
      const themeAudit = UxAuditor.auditThemeMode(p.isDarkMode, html);
      expect(themeAudit.passed).toBe(true);

      // ۲. بررسی عدم وجود باگ BiDi
      const bidiAudit = UxAuditor.auditBiDiTypography(html);
      expect(bidiAudit.passed).toBe(true);

      // ۳. بررسی حضور دکمه‌های تراکنش صندوق پس‌انداز
      expect(html).toContain("واریز به صندوق");
      expect(html).toContain("برداشت از صندوق");

      // ۴. بررسی وجود پدینگ امن در انتهای کادر جهت عدم بیرون‌زدگی دکمه ثبت
      expect(html).toContain("pb-32");
      expect(html).toContain("overflow-y-auto");

      // ۵. بررسی عناوین اصلاح‌شده دسته‌بندی‌ها (بدون سه‌نقطه و بدون برش)
      expect(html).toContain("رفت و آمد");
      expect(html).toContain("خوراک و سلف");
      expect(html).toContain("ثبت خرج جدید");

      successCount++;
    });

    expect(successCount).toBe(100);
  });

  it("سنجش ارگونومی و عدم بیرون‌زدگی در نمایشگرهای کوچک اندروید قدیمی (۳۲۰px و ۳۶۰px)", () => {
    const smallScreenPersonas = personas.filter(p => p.platform.viewport.width <= 360);
    expect(smallScreenPersonas.length).toBeGreaterThanOrEqual(15);

    smallScreenPersonas.forEach(p => {
      const html = renderToString(
        React.createElement(BudgetModal, {
          budgetState: p.budgetState,
          onUpdateBudget: () => {},
          onClose: () => {}
        })
      );

      // استخراج کلیه کلاس‌ها
      const classMatches = html.match(/class="([^"]+)"/g) || [];
      const allClasses = classMatches.map(m => m.replace(/class="|"/g, "")).flatMap(c => c.split(/\s+/));

      const viewportFit = UxAuditor.auditViewportFit(p.platform.viewport, p.platform.fontScale, allClasses);
      expect(viewportFit.passed).toBe(true);
    });
  });

  it("اجرای کامل بنچمارک و استخراج ماتریس نمرات ۱۰۰ کاربر", () => {
    const summary = runFullSimulation();
    expect(summary.totalPersonas).toBe(100);
    expect(summary.passCount).toBe(100);
    expect(summary.overallScore).toBeGreaterThanOrEqual(95);

    console.log("SIMULATION_RESULTS_START");
    console.log(JSON.stringify({
      totalPersonas: summary.totalPersonas,
      overallScore: summary.overallScore,
      passCount: summary.passCount,
      tierBreakdown: summary.tierBreakdown,
      archetypeBreakdown: summary.archetypeBreakdown
    }));
    console.log("SIMULATION_RESULTS_END");
  });
});
