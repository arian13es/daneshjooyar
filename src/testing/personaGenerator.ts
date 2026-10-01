/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: personaGenerator.ts (تولیدکننده ماتریس ۱۰۰ کاربر شبیه‌سازی‌شده)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import { StudentProfile, BudgetState, ClassItem, ExamItem, ProjectItem, BudgetExpense } from "../types";

export type PlatformTier = 
  | "android_legacy"      // Android 8.0 - 9.0 (Oreo/Pie, 320x568 - 360x640)
  | "android_mid"         // Android 10 - 12 (Q/S, 360x780 - 393x851)
  | "android_flagship"    // Android 13 - 15 (412x915 - 430x932)
  | "web_desktop"         // Chrome/Firefox on Windows/macOS (1366x768 - 1920x1080)
  | "tablet_foldable";    // iPad/Tab/Fold (280x653 - 800x1280)

export type ArchetypeId = 
  | "extreme_budgeter"    // اسپمر تراکنش، مبالغ ۵۰ میلیونی، ارقام صفر، برداشت بیش از سقف
  | "heavy_academic"      // برنامه‌های درسی مرزی، تداخل ساعت، اسامی فوق طولانی
  | "theme_switcher"      // جابجایی وسواسی دارک/لایت، تغییر تب سریع
  | "accessibility_scaled"// فونت مقیاس ۱.۳ تا ۱.۵، نمایشگر کوچک ۳۲۰px
  | "edge_offline";       // حافظه خراب، مقادیر Null، شرایط شبکه قطع

export interface PlatformProfile {
  tier: PlatformTier;
  osName: string;
  viewport: { width: number; height: number; dpr: number };
  fontScale: number;
  hasNotch: boolean;
  userAgent: string;
}

export interface SyntheticPersona {
  id: number;
  codeName: string;
  profile: StudentProfile;
  platform: PlatformProfile;
  archetypeId: ArchetypeId;
  archetypeTitle: string;
  budgetState: BudgetState;
  classes: ClassItem[];
  exams: ExamItem[];
  projects: ProjectItem[];
  isDarkMode: boolean;
  testScenarios: string[];
}

const FACULTIES = [
  "مهندسی برق و کامپیوتر",
  "مهندسی مکانیک",
  "مهندسی عمران",
  "علوم پایه و فیزیک",
  "حقوق و علوم سیاسی",
  "ادبیات و زبان‌های خارجی",
  "علوم تربیتی و روانشناسی",
  "شیمی و داروسازی",
  "کشاورزی و منابع طبیعی",
  "اقتصاد و مدیریت"
];

const PLATFORM_TIERS_CONFIG: Record<PlatformTier, { osName: string; viewports: { width: number; height: number; dpr: number }[]; userAgent: string; hasNotch: boolean }[]> = {
  android_legacy: [
    { osName: "Android 8.0 Oreo (Samsung Galaxy J5)", viewports: [{ width: 320, height: 568, dpr: 1.5 }, { width: 360, height: 640, dpr: 2.0 }], userAgent: "Mozilla/5.0 (Linux; Android 8.0.0; SM-J530F) Chrome/70.0.3538.110 Mobile", hasNotch: false },
    { osName: "Android 9.0 Pie (Huawei Y7)", viewports: [{ width: 360, height: 720, dpr: 2.0 }], userAgent: "Mozilla/5.0 (Linux; Android 9; DUB-LX1) Chrome/76.0.3809.111 Mobile", hasNotch: true }
  ],
  android_mid: [
    { osName: "Android 11 (Xiaomi Redmi Note 10)", viewports: [{ width: 393, height: 851, dpr: 2.75 }, { width: 360, height: 800, dpr: 2.5 }], userAgent: "Mozilla/5.0 (Linux; Android 11; M2101K7AG) Chrome/94.0.4606.85 Mobile", hasNotch: true },
    { osName: "Android 12 (Samsung Galaxy A52)", viewports: [{ width: 384, height: 854, dpr: 2.625 }], userAgent: "Mozilla/5.0 (Linux; Android 12; SM-A525F) Chrome/102.0.5005.125 Mobile", hasNotch: true }
  ],
  android_flagship: [
    { osName: "Android 14 (Samsung Galaxy S24 Ultra)", viewports: [{ width: 412, height: 915, dpr: 3.5 }], userAgent: "Mozilla/5.0 (Linux; Android 14; SM-S928B) Chrome/124.0.6367.113 Mobile", hasNotch: true },
    { osName: "Android 15 Preview (Google Pixel 8 Pro)", viewports: [{ width: 448, height: 998, dpr: 3.0 }], userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 8 Pro) Chrome/126.0.6478.71 Mobile", hasNotch: true }
  ],
  web_desktop: [
    { osName: "Windows 11 (Chrome 124, 1080p)", viewports: [{ width: 1920, height: 1080, dpr: 1.0 }, { width: 1366, height: 768, dpr: 1.0 }], userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36", hasNotch: false },
    { osName: "macOS Sonoma (Safari 17.4)", viewports: [{ width: 1440, height: 900, dpr: 2.0 }], userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/17.4 Safari/605.1.15", hasNotch: false }
  ],
  tablet_foldable: [
    { osName: "Samsung Galaxy Z Fold 5 (Cover Screen 280px)", viewports: [{ width: 280, height: 653, dpr: 2.5 }], userAgent: "Mozilla/5.0 (Linux; Android 14; SM-F946B) Chrome/124.0 Mobile", hasNotch: false },
    { osName: "Apple iPad Pro 11 (Tablet Mode)", viewports: [{ width: 834, height: 1194, dpr: 2.0 }], userAgent: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15", hasNotch: false }
  ]
};

const ARCHETYPES_DEF: { id: ArchetypeId; title: string; desc: string }[] = [
  { id: "extreme_budgeter", title: "بودجه‌گذار افراطی و اسپمر تراکنش", desc: "تست مقادیر سنگین، ارقام نامتعارف و دکمه‌های سریع" },
  { id: "heavy_academic", title: "دانشجوی پرمشغله با تداخل کلاسی", desc: "اسامی بسیار طولانی، تداخل زمان‌ها و امتحانات همزمان" },
  { id: "theme_switcher", title: "تغییردهنده مداوم تم و وضعیت", desc: "سوئیچ متناوب دارک/لایت، باز و بسته کردن مدال‌ها" },
  { id: "accessibility_scaled", title: "دسترسی‌پذیری و بزرگ‌نمایی فونت", desc: "فونت سیستم ۱.۴x و بررسی بیرون‌زدگی در صفحات فشرده" },
  { id: "edge_offline", title: "شرایط مرزی، حافظه مخدوش و آفلاین", desc: "تست تاب‌آوری در برابر کرپشن داده و مقادیر تهی" }
];

export function generate100Personas(): SyntheticPersona[] {
  const personas: SyntheticPersona[] = [];
  const platformKeys = Object.keys(PLATFORM_TIERS_CONFIG) as PlatformTier[];
  
  let idCounter = 1;

  for (let pIdx = 0; pIdx < platformKeys.length; pIdx++) {
    const platformTier = platformKeys[pIdx];
    const platformOptions = PLATFORM_TIERS_CONFIG[platformTier];

    for (let aIdx = 0; aIdx < ARCHETYPES_DEF.length; aIdx++) {
      const archetype = ARCHETYPES_DEF[aIdx];

      // Each platform tier + archetype combination gets 4 distinct personas = 5 * 5 * 4 = 100 personas!
      for (let variant = 1; variant <= 4; variant++) {
        const id = idCounter++;
        const platConfig = platformOptions[(variant - 1) % platformOptions.length];
        const viewport = platConfig.viewports[(variant - 1) % platConfig.viewports.length];
        const fontScale = archetype.id === "accessibility_scaled" ? (variant % 2 === 0 ? 1.4 : 1.3) : 1.0;
        const faculty = FACULTIES[(id * 3) % FACULTIES.length];

        const isDarkMode = (id % 2 === 0);

        // Build archetype-specific payloads
        let budgetState: BudgetState;
        let classes: ClassItem[] = [];
        let exams: ExamItem[] = [];
        let projects: ProjectItem[] = [];
        const testScenarios: string[] = [];

        if (archetype.id === "extreme_budgeter") {
          testScenarios.push("تست تراز مالی با سقف‌های سنگین و صفر", "تست دکمه‌های سریع مبالغ", "تست فرم ثبت با اسامی طولانی و کوتاه");
          if (variant === 1) {
            // High balance with 25 transactions
            const expenses: BudgetExpense[] = [];
            for (let i = 1; i <= 25; i++) {
              expenses.push({
                id: `exp-${id}-${i}`,
                title: `خرید روزانه شماره ${i} سلف و اسنپ`,
                amount: i * 15000,
                category: i % 2 === 0 ? "food" : "transport",
                date: new Date(Date.now() - i * 3600000 * 6).toISOString()
              });
            }
            budgetState = {
              monthlyLimit: 12000000,
              expenses,
              savings: 3500000,
              savingsGoal: 10000000,
              savingsGoalName: "خرید تبلت مهندسی"
            };
          } else if (variant === 2) {
            // Overspent scenario
            budgetState = {
              monthlyLimit: 2000000,
              expenses: [
                { id: `exp-${id}-1`, title: "شهریه دانشگاه آزاد/دولتی", amount: 2800000, category: "education", date: new Date().toISOString() }
              ],
              savings: 0
            };
          } else if (variant === 3) {
            // Zero limit scenario
            budgetState = {
              monthlyLimit: 0,
              expenses: [],
              savings: 0
            };
          } else {
            // Extreme numbers (50 Million Tomans)
            budgetState = {
              monthlyLimit: 50000000,
              expenses: [
                { id: `exp-${id}-1`, title: "اجاره مسکن دانشجویی تبریز", amount: 18500000, category: "dorm", date: new Date().toISOString() },
                { id: `exp-${id}-2`, title: "خرید لپ‌تاپ ایسوس زفیروس", amount: 26000000, category: "shopping", date: new Date().toISOString() }
              ],
              savings: 5000000,
              savingsGoal: 20000000,
              savingsGoalName: "تعویض گوشی"
            };
          }
        } else if (archetype.id === "heavy_academic") {
          testScenarios.push("تست نمایش ۱۵ کلاس متراکم", "تست شکست اسامی فوق‌العاده طولانی درس و استاد", "تست همپوشانی امتحانات");
          classes = [
            {
              id: `cls-${id}-1`,
              courseName: "آزمایشگاه اصول و مبانی مدارهای مجتمع و مخابراتی پیشرفته مهندسی کامپیوتر و برق",
              professor: "پروفسور سید محمدرضا علوی‌زاده تبریزی اصل",
              weekday: "شنبه",
              startTime: "08:00",
              endTime: "10:00",
              location: "دانشکده برق - طبقه ۳ - اتاق ۳۰۴",
              weekType: "all",
              hasSecondSession: true,
              secondWeekday: "سه‌شنبه",
              secondStartTime: "10:30",
              secondEndTime: "12:30",
              secondWeekType: "even"
            },
            {
              id: `cls-${id}-2`,
              courseName: "طراحی کامپیوتری سیستم‌های دیجیتال (VLSI)",
              professor: "دکتر مریم احمدی",
              weekday: "یکشنبه",
              startTime: "13:30",
              endTime: "15:30",
              weekType: "odd"
            },
            {
              id: `cls-${id}-3`,
              courseName: "معادلات دیفرانسیل و کاربرد در کنترل خطی",
              professor: "دکتر کاظمی",
              weekday: "شنبه",
              startTime: "10:00",
              endTime: "12:00",
              weekType: "all"
            }
          ];
          exams = [
            {
              id: `ex-${id}-1`,
              courseName: "طراحی کامپیوتری سیستم‌های دیجیتال",
              type: "میان‌ترم",
              date: "1403/08/20",
              time: "10:00",
              location: "سالن امتحانات شهید قاضی"
            },
            {
              id: `ex-${id}-2`,
              courseName: "معادلات دیفرانسیل و کاربرد در کنترل",
              type: "پایان‌ترم",
              date: "1403/10/15",
              time: "08:30"
            }
          ];
          budgetState = { monthlyLimit: 4000000, expenses: [] };
        } else if (archetype.id === "theme_switcher") {
          testScenarios.push("تست پایداری کنتراست در جابجایی دارک/لایت", "تست عدم باقی‌ماندن بافت تیره در روز", "تست هماهنگی فونت با رنگ زمینه");
          budgetState = {
            monthlyLimit: 3000000,
            expenses: [
              { id: `exp-${id}-1`, title: "کافه تریا فجر", amount: 45000, category: "cafe", date: new Date().toISOString() },
              { id: `exp-${id}-2`, title: "شارژ کارت تغذیه سماد", amount: 150000, category: "food", date: new Date().toISOString() }
            ],
            savings: 500000
          };
        } else if (archetype.id === "accessibility_scaled") {
          testScenarios.push("تست فونت بزرگ ۱.۴ برابری", "بررسی عدم بیرون‌زدگی دکمه‌های ۳۲۰ پیکسلی", "بررسی حداقل اندازه لمسی ۴۰ پیکسلی");
          budgetState = {
            monthlyLimit: 2500000,
            expenses: [
              { id: `exp-${id}-1`, title: "کتاب مهندسی نرم‌افزار پرسمن", amount: 320000, category: "education", date: new Date().toISOString() }
            ]
          };
        } else {
          // edge_offline
          testScenarios.push("تست ورودی‌های نال و رشته خالی", "تست مبالغ با کاراکترهای نامعتبر فارسی/لاتین", "تست ریست کلی سیستم");
          budgetState = {
            monthlyLimit: 1000000,
            expenses: [
              { id: `exp-${id}-1`, title: "تست با کاراکترهای خاص !@#$%^&*()_+", amount: 50000, category: "other", date: new Date().toISOString() }
            ],
            savings: 100000,
            savingsGoal: 500000,
            savingsGoalName: "تست هدف خالی"
          };
        }

        personas.push({
          id,
          codeName: `User-${id.toString().padStart(3, "0")}-${platformTier}-${archetype.id}`,
          profile: {
            firstName: `دانشجو_${id}`,
            lastName: `تبریزی_${id}`,
            faculty,
            major: `مهندسی و علوم ${id}`,
            studentId: `4010${id.toString().padStart(4, "0")}`,
            entryYear: "1401",
            gender: id % 2 === 0 ? "male" : "female"
          },
          platform: {
            tier: platformTier,
            osName: platConfig.osName,
            viewport,
            fontScale,
            hasNotch: platConfig.hasNotch,
            userAgent: platConfig.userAgent
          },
          archetypeId: archetype.id,
          archetypeTitle: archetype.title,
          budgetState,
          classes,
          exams,
          projects,
          isDarkMode,
          testScenarios
        });
      }
    }
  }

  return personas;
}
