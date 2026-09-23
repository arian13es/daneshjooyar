/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: ErrorBoundary
 * Description: Top-level React error boundary that intercepts render exceptions
 *   and provides a friendly, RTL Persian recovery interface with options to
 *   retry or reset corrupt local storage cache.
 * ============================================================================
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught render error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    const confirmed = window.confirm(
      "با بازنشانی حافظه، برنامه‌های درسی، امتحانات، پروژه‌ها و بودجه شما برای همیشه حذف می‌شوند. ابتدا یک نسخه پشتیبان ذخیره خواهد شد. ادامه می‌دهید؟"
    );
    if (!confirmed) return;

    const keysToRemove = [
      "tabriz_classes_v2",
      "tabriz_exams_v2",
      "tabriz_projects_v2",
      "tabriz_calendar_notes_v2",
      "tabriz_budget_v1",
      "food_reservation_plan",
      "gpa_calc_courses_v2",
    ];

    // Backup all user data before wiping (timestamped snapshot)
    const backup: Record<string, string | null> = {};
    let backupOk = true;
    keysToRemove.forEach((k) => {
      try {
        backup[k] = localStorage.getItem(k);
      } catch {
        backup[k] = null;
        backupOk = false;
      }
    });

    try {
      localStorage.setItem(
        `tabriz_backup_${Date.now()}`,
        JSON.stringify(backup)
      );
    } catch {
      backupOk = false;
    }

    if (!backupOk && Object.values(backup).some((v) => v !== null)) {
      window.alert(
        "ذخیره نسخه پشتیبان ممکن نشد (حافظه پر یا مسدود است). برای جلوگیری از از دست رفتن داده‌ها، پاک‌سازی انجام نشد."
      );
      return;
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 text-center select-none"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="text-xl font-bold mb-2">مشکلی در اجرای برنامه رخ داد</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
            متأسفانه برنامک با یک خطای غیرمنتظره مواجه شد. می‌توانید با بارگذاری مجدد برنامه را دوباره اجرا کنید.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-sm transition shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </button>

            <button
              onClick={this.handleResetStorage}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-medium text-sm transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              پاک‌سازی کامل داده‌ها
            </button>
          </div>

          {this.state.error && (
            <div className="mt-6 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs font-mono text-left max-w-sm overflow-auto text-rose-500">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
