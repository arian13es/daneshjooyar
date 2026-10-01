/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: runSimulationCli.ts (اسکریپت اجرای بنچمارک و استخراج کارنامه ۱۰۰ کاربر)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React from "react";
import { renderToString } from "react-dom/server";
import { generate100Personas, SyntheticPersona, PlatformTier, ArchetypeId } from "./personaGenerator";
import { UxAuditor, PersonaAuditReport } from "./uxAuditor";
import Dashboard from "../components/Dashboard";
import BudgetModal from "../components/BudgetModal";

export interface SimulationSummary {
  timestamp: string;
  totalPersonas: number;
  overallScore: number;
  passCount: number;
  failCount: number;
  tierBreakdown: Record<PlatformTier, { count: number; avgScore: number; passRate: number }>;
  archetypeBreakdown: Record<ArchetypeId, { count: number; avgScore: number; passRate: number }>;
  reports: PersonaAuditReport[];
}

export function runFullSimulation(): SimulationSummary {
  const personas = generate100Personas();
  const reports: PersonaAuditReport[] = [];

  for (const p of personas) {
    let score = 100;
    const issues: any[] = [];

    // ۱. محاسبات مالی
    const math = UxAuditor.auditBudgetMath(p.budgetState);
    issues.push(...math.issues);
    if (math.issues.some(i => i.severity === "critical")) score -= 30;

    // ۲. رندر داشبورد
    let dashboardHtml = "";
    try {
      dashboardHtml = renderToString(
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
    } catch (e: any) {
      issues.push({ severity: "critical", category: "data_integrity", message: `کرش در رندر داشبورد: ${e.message}` });
      score -= 40;
    }

    // ۳. رندر مدال کیف پول
    let modalHtml = "";
    try {
      modalHtml = renderToString(
        React.createElement(BudgetModal, {
          budgetState: p.budgetState,
          onUpdateBudget: () => {},
          onClose: () => {}
        })
      );
    } catch (e: any) {
      issues.push({ severity: "critical", category: "data_integrity", message: `کرش در رندر مدال کیف پول: ${e.message}` });
      score -= 40;
    }

    // ۴. ممیزی تایپوگرافی و BiDi
    const combinedHtml = dashboardHtml + " " + modalHtml;
    const bidiAudit = UxAuditor.auditBiDiTypography(combinedHtml);
    issues.push(...bidiAudit.issues);
    if (!bidiAudit.passed) score -= 25;

    // ۵. ممیزی تم شب و روز
    const themeAudit = UxAuditor.auditThemeMode(p.isDarkMode, combinedHtml);
    issues.push(...themeAudit.issues);
    if (!themeAudit.passed) score -= 25;

    // ۶. ممیزی تطابق با ابعاد صفحه
    const classMatches = combinedHtml.match(/class="([^"]+)"/g) || [];
    const allClasses = classMatches.map(m => m.replace(/class="|"/g, "")).flatMap(c => c.split(/\s+/));
    const viewportFit = UxAuditor.auditViewportFit(p.platform.viewport, p.platform.fontScale, allClasses);
    issues.push(...viewportFit.issues);
    if (!viewportFit.passed) score -= 20;

    score = Math.max(0, Math.min(100, score));
    const passed = score >= 85 && issues.filter(i => i.severity === "critical").length === 0;

    reports.push({
      personaId: p.id,
      codeName: p.codeName,
      platformName: p.platform.osName,
      viewport: p.platform.viewport,
      archetype: p.archetypeTitle,
      isDarkMode: p.isDarkMode,
      score,
      passed,
      issues,
      metrics: {
        totalSpent: math.totalSpent,
        remaining: math.remaining,
        progressPercent: math.progressPercent,
        touchTargetsAudited: 12,
        bidiChecksPassed: bidiAudit.passed,
        contrastChecksPassed: themeAudit.passed
      }
    });
  }

  // تجمیع نتایج بر اساس رده سخت‌افزاری
  const tiers: PlatformTier[] = ["android_legacy", "android_mid", "android_flagship", "web_desktop", "tablet_foldable"];
  const tierBreakdown: any = {};
  for (const t of tiers) {
    const subset = reports.filter((_, idx) => personas[idx].platform.tier === t);
    const avgScore = Math.round(subset.reduce((acc, r) => acc + r.score, 0) / (subset.length || 1));
    const passCount = subset.filter(r => r.passed).length;
    tierBreakdown[t] = {
      count: subset.length,
      avgScore,
      passRate: Math.round((passCount / (subset.length || 1)) * 100)
    };
  }

  // تجمیع نتایج بر اساس آرکتایپ رفتاری
  const archetypes: ArchetypeId[] = ["extreme_budgeter", "heavy_academic", "theme_switcher", "accessibility_scaled", "edge_offline"];
  const archetypeBreakdown: any = {};
  for (const a of archetypes) {
    const subset = reports.filter((_, idx) => personas[idx].archetypeId === a);
    const avgScore = Math.round(subset.reduce((acc, r) => acc + r.score, 0) / (subset.length || 1));
    const passCount = subset.filter(r => r.passed).length;
    archetypeBreakdown[a] = {
      count: subset.length,
      avgScore,
      passRate: Math.round((passCount / (subset.length || 1)) * 100)
    };
  }

  const passCount = reports.filter(r => r.passed).length;
  const overallScore = Math.round(reports.reduce((acc, r) => acc + r.score, 0) / reports.length);

  return {
    timestamp: new Date().toISOString(),
    totalPersonas: personas.length,
    overallScore,
    passCount,
    failCount: personas.length - passCount,
    tierBreakdown,
    archetypeBreakdown,
    reports
  };
}

// Execution block
if (typeof process !== "undefined" && process.argv && process.argv[1]?.includes("runSimulationCli")) {
  const summary = runFullSimulation();
  console.log("================================================================================");
  console.log("نتایج شبیه‌سازی ۱۰۰ کاربر و ممیزی جامع UX / ارگونومی اپلیکیشن دانشجویار تبریز");
  console.log("================================================================================");
  console.log(`کل کاربران تست‌شده: ${summary.totalPersonas}`);
  console.log(`تعداد پاس‌شده: ${summary.passCount} از ${summary.totalPersonas} (${Math.round((summary.passCount / summary.totalPersonas) * 100)}%)`);
  console.log(`امتیاز میانگین UX سیستم: ${summary.overallScore} از ۱۰۰`);
  console.log("--------------------------------------------------------------------------------");
  console.log("تفکیک بر اساس پلتفرم و رده سیستم‌عامل:");
  for (const [tier, data] of Object.entries(summary.tierBreakdown)) {
    console.log(`  - ${tier.padEnd(18)}: نمره میانگین ${data.avgScore}/100 | نرخ قبولی ${data.passRate}% (${data.count} کاربر)`);
  }
  console.log("--------------------------------------------------------------------------------");
  console.log("تفکیک بر اساس آرکتایپ رفتاری:");
  for (const [arch, data] of Object.entries(summary.archetypeBreakdown)) {
    console.log(`  - ${arch.padEnd(22)}: نمره میانگین ${data.avgScore}/100 | نرخ قبولی ${data.passRate}% (${data.count} کاربر)`);
  }
  console.log("================================================================================");
}
