/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Utility: Widget Synchronization Bridge
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

import { Capacitor } from "@capacitor/core";
import { ClassItem, ExamItem } from "../types";
import { NativeHelper } from "../services/NotificationService";
import { parseJsDay, isEvenWeekAt, compareChronologicalTimestamps } from "./dateUtils";

export async function syncAndroidWidget(classes: ClassItem[], exams: ExamItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const now = new Date();
    const currentJsDay = now.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
    const currentHourMin = now.toTimeString().slice(0, 5); // "HH:MM"

    // 1. Find today's classes (session 1 and session 2)
    interface WidgetSession {
      courseName: string;
      startTime: string;
      endTime: string;
      location?: string;
    }

    const todaySessions: WidgetSession[] = [];
    const isEvenWeek = isEvenWeekAt(now.getTime());

    const sessionParityOk = (weekType?: 'all' | 'even' | 'odd'): boolean => {
      if (!weekType || weekType === 'all') return true;
      if (weekType === 'even') return isEvenWeek;
      return !isEvenWeek;
    };

    classes.forEach(c => {
      if (parseJsDay(c.weekday) === currentJsDay && sessionParityOk(c.weekType)) {
        todaySessions.push({
          courseName: c.courseName,
          startTime: c.startTime,
          endTime: c.endTime,
          location: c.location
        });
      }
      if (
        c.hasSecondSession &&
        c.secondWeekday &&
        parseJsDay(c.secondWeekday) === currentJsDay &&
        sessionParityOk(c.secondWeekType)
      ) {
        todaySessions.push({
          courseName: `${c.courseName} (جلسه ۲)`,
          startTime: c.secondStartTime || c.startTime,
          endTime: c.secondEndTime || c.endTime,
          location: c.secondLocation || c.location
        });
      }
    });

    todaySessions.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    // Find next upcoming class or current
    let nextClass = todaySessions.find(c => (c.endTime || c.startTime) >= currentHourMin);
    if (!nextClass && todaySessions.length > 0) {
      // If all classes ended today, show last one or note
      nextClass = undefined;
    }

    const classTitle = nextClass ? nextClass.courseName : (todaySessions.length === 0 ? "امروز کلاسی ندارید" : "کلاس‌های امروز پایان یافته");
    const classTime = nextClass ? `${nextClass.startTime} - ${nextClass.endTime}` : "--:--";
    const classLocation = nextClass ? (nextClass.location ? `مکان: ${nextClass.location}` : "") : "";

    // 2. Find next upcoming exam (chronological, not lexicographic)
    const upcomingExams = exams
      .filter(ex => !ex.completed)
      .sort((a, b) => compareChronologicalTimestamps(a.date, a.time, b.date, b.time));

    const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;
    const examTitle = nextExam ? `${nextExam.courseName} (${nextExam.type})` : "امتحان نزدیکی ثبت‌نشده";
    const examDate = nextExam ? `${nextExam.date} • ${nextExam.time}` : "--";

    // 3. Format today date
    let todayDate = "امروز";
    try {
      const formatter = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "short" });
      todayDate = formatter.format(now);
    } catch {
      todayDate = "امروز";
    }

    await NativeHelper.updateWidgetData?.({
      classTitle,
      classTime,
      classLocation,
      examTitle,
      examDate,
      todayDate
    });
  } catch (err) {
    console.warn("Widget sync failed or not available:", err);
  }
}
