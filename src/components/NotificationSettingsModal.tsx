/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Bell, 
  BatteryCharging, 
  Clock, 
  Check, 
  AlertCircle, 
  Sparkles, 
  X, 
  ChevronLeft
} from "lucide-react";
import { NotificationService, NativeHelper } from "../services/NotificationService";
import { safeStorageGetString, safeStorageSet } from "../utils/storageUtils";

interface NotificationSettingsModalProps {
  onClose: () => void;
}

export default function NotificationSettingsModal({ onClose }: NotificationSettingsModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isBatteryIgnored, setIsBatteryIgnored] = useState<boolean | null>(null);
  const [canExactAlarm, setCanExactAlarm] = useState<boolean | null>(null);
  const [classLead, setClassLead] = useState(() => safeStorageGetString("class_lead_minutes") || "30");
  const [isTesting, setIsTesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const checkAllStatus = async () => {
    const perm = await NotificationService.checkPermission();
    setHasPermission(perm);

    const batt = await NotificationService.isBatteryOptimizationIgnored();
    setIsBatteryIgnored(batt);

    const exact = await NotificationService.canScheduleExactAlarms();
    setCanExactAlarm(exact);
  };

  useEffect(() => {
    checkAllStatus();
  }, []);

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setHasPermission(granted);
    if (!granted) {
      await NotificationService.openAppNotificationSettings();
    }
  };

  const handleRequestBatteryExemption = async () => {
    await NotificationService.requestBatteryOptimization();
    setTimeout(checkAllStatus, 1500);
  };

  const handleOpenExactAlarm = async () => {
    await NotificationService.openExactAlarmSettings();
    setTimeout(checkAllStatus, 1500);
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    try {
      const ok = await NotificationService.sendTestNotification();
      if (ok) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 4000);
      } else {
        alert("لطفاً ابتدا دسترسی ارسال اعلان را به برنامه بدهید.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 bg-slate-900/60 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-4 pb-6 sm:pb-4 font-sans" 
      dir="rtl"
    >
      <motion.div 
        initial={{ y: 30, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 30, opacity: 0 }} 
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-slate-800 w-full max-w-sm sm:max-w-md rounded-[2rem] p-5 sm:p-6 shadow-2xl dark:shadow-none overflow-y-auto max-h-[85vh] space-y-4 border border-slate-100 dark:border-slate-700/70"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                تنظیمات یادآورها و اعلان‌ها
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                کارکرد ۱۰۰٪ آفلاین و بدون تأخیر
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Instant Live Test Card */}
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-2xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 truncate">تست فوری اعلان</p>
              <p className="text-[9px] font-bold text-indigo-600/70 dark:text-indigo-400/80 truncate">تست آنی صدا و بنر روی گوشی</p>
            </div>
          </div>
          <button
            onClick={handleSendTest}
            disabled={isTesting}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm transition-all shrink-0 disabled:opacity-50"
          >
            {testSent ? "ارسال شد! ✓" : isTesting ? "..." : "ارسال تست 🔔"}
          </button>
        </div>

        {/* Diagnostic Grouped Container */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block px-1">
            وضعیت دسترسی‌های سیستم‌عامل
          </span>
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/40">
            
            {/* 1. Notification Permission */}
            <div className="p-2.5 px-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate">
                  مجوز ارسال اعلان
                </span>
              </div>
              {hasPermission ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                  <Check className="h-3 w-3" /> فعال
                </span>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg hover:bg-indigo-100 shrink-0"
                >
                  فعال‌سازی
                </button>
              )}
            </div>

            {/* 2. Battery Optimization */}
            <div className="p-2.5 px-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <BatteryCharging className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block truncate">
                    کارکرد آفلاین بدون بهینه‌ساز
                  </span>
                </div>
              </div>
              {isBatteryIgnored ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                  <Check className="h-3 w-3" /> بهینه
                </span>
              ) : (
                <button
                  onClick={handleRequestBatteryExemption}
                  className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1 rounded-lg hover:bg-amber-100 shrink-0"
                >
                  رفع محدودیت
                </button>
              )}
            </div>

            {/* 3. Exact Alarms */}
            <div className="p-2.5 px-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate">
                  زمان‌بندی دقیق ثانیه‌ای
                </span>
              </div>
              {canExactAlarm ? (
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                  <Check className="h-3 w-3" /> فعال
                </span>
              ) : (
                <button
                  onClick={handleOpenExactAlarm}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg hover:bg-indigo-100 shrink-0"
                >
                  تنظیم
                </button>
              )}
            </div>

            {/* 4. OEM AutoStart & Background Power Management (Xiaomi / Huawei / Samsung) */}
            <div className="p-2.5 px-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate">
                  شروع خودکار (شیائومی / هواوی)
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await NativeHelper.openAutoStartSettings?.();
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 rounded-lg hover:bg-indigo-100 shrink-0"
              >
                بررسی
              </button>
            </div>

            {/* Android 12+ silently drops every exact alarm when this is off,
                which is why reminders and the Pomodoro alert never fire while
                the screen is off. Make that consequence explicit. */}
            {canExactAlarm === false && (
              <div className="mx-3 mb-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-black text-amber-800 dark:text-amber-300 leading-relaxed">
                    بدون این مجوز، یادآورها و زنگ پایان تمرکز با تأخیر می‌رسند یا وقتی صفحه خاموش است اصلاً نمی‌رسند.
                  </p>
                  <button
                    onClick={handleOpenExactAlarm}
                    className="mt-1.5 text-[10px] font-black text-white bg-amber-600 hover:bg-amber-700 px-2.5 py-1 rounded-lg"
                  >
                    فعال‌سازی آلارم‌ها و یادآورها
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Class Lead Time */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 block px-1">
            زمان یادآوری قبل از شروع هر کلاس:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: "15", label: "۱۵ دقیقه" },
              { value: "30", label: "۳۰ دقیقه" },
              { value: "60", label: "۱ ساعت" }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setClassLead(opt.value);
                  safeStorageSet("class_lead_minutes", opt.value);
                }}
                className={`py-2 rounded-xl text-[10px] font-black transition-all border ${classLead === opt.value ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/50"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Close button */}
        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black transition-colors"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
