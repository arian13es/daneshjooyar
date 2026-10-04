/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Utility: Widget Synchronization Bridge — هوشمندسازی و همگام‌سازی ویجت اندروید
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * ============================================================================
 */

import { Capacitor } from "@capacitor/core";
import { ClassItem, ExamItem } from "../types";
import { NativeHelper } from "../services/NotificationService";
import {
  parseJsDay,
  isEvenWeekAt,
  compareChronologicalTimestamps,
  getWeekParityOffset
} from "./dateUtils";

interface WidgetSession {
  courseName: string;
  jsDay: number;
  startTime: string;
  endTime: string;
  location?: string;
  weekType?: "all" | "even" | "odd";
}

export async function syncAndroidWidget(classes: ClassItem[], exams: ExamItem[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const now = new Date();
    const currentJsDay = now.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
    const currentHourMin = now.toTimeString().slice(0, 5); // "HH:MM"
    const weekParityOffset = getWeekParityOffset();

    // 1. Flatten all class sessions (session 1 and session 2)
    const allSessions: WidgetSession[] = [];
    (classes || []).forEach(c => {
      const day1 = parseJsDay(c.weekday);
      if (day1 >= 0) {
        allSessions.push({
          courseName: c.courseName,
          jsDay: day1,
          startTime: c.startTime,
          endTime: c.endTime,
          location: c.location,
          weekType: c.weekType
        });
      }
      if (c.hasSecondSession && c.secondWeekday) {
        const day2 = parseJsDay(c.secondWeekday);
        if (day2 >= 0) {
          allSessions.push({
            courseName: `${c.courseName} (جلسه ۲)`,
            jsDay: day2,
            startTime: c.secondStartTime || c.startTime,
            endTime: c.secondEndTime || c.endTime,
            location: c.secondLocation || c.location,
            weekType: c.secondWeekType || c.weekType
          });
        }
      }
    });

    const isEvenWeekNow = isEvenWeekAt(now.getTime(), weekParityOffset);
    const sessionParityOk = (weekType?: "all" | "even" | "odd", isEven: boolean = isEvenWeekNow): boolean => {
      if (!weekType || weekType === "all") return true;
      return weekType === "even" ? isEven : !isEven;
    };

    // Filter today's sessions
    const todaySessions = allSessions
      .filter(s => s.jsDay === currentJsDay && sessionParityOk(s.weekType, isEvenWeekNow))
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    // Check ongoing class vs next class vs tomorrow's class
    const ongoingClass = todaySessions.find(
      s => (s.startTime || "") <= currentHourMin && currentHourMin < (s.endTime || "")
    );
    const upcomingTodayClass = todaySessions.find(
      s => (s.startTime || "") > currentHourMin
    );

    let classTitle = "کلاس فعالی برای امروز نیست";
    let classTime = "--:--";
    let classLocation = "";

    if (ongoingClass) {
      classTitle = ongoingClass.courseName;
      classTime = `تا ${ongoingClass.endTime}`;
      classLocation = ongoingClass.location ? `📍 مکان: ${ongoingClass.location}` : "در حال برگزاری";
    } else if (upcomingTodayClass) {
      classTitle = upcomingTodayClass.courseName;
      classTime = `${upcomingTodayClass.startTime} - ${upcomingTodayClass.endTime}`;
      classLocation = upcomingTodayClass.location ? `📍 مکان: ${upcomingTodayClass.location}` : "";
    } else {
      // All classes today finished or no classes today: Look ahead to tomorrow / next days!
      let nextUpcoming: WidgetSession | undefined;
      let nextDayOffset = 0;

      for (let offset = 1; offset <= 7; offset++) {
        const checkJsDay = (currentJsDay + offset) % 7;
        const futureTime = now.getTime() + offset * 24 * 3600 * 1000;
        const isFutureEven = isEvenWeekAt(futureTime, weekParityOffset);

        const futureSessions = allSessions
          .filter(s => s.jsDay === checkJsDay && sessionParityOk(s.weekType, isFutureEven))
          .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

        if (futureSessions.length > 0) {
          nextUpcoming = futureSessions[0];
          nextDayOffset = offset;
          break;
        }
      }

      if (nextUpcoming) {
        classTitle = nextUpcoming.courseName;
        classTime = `${nextUpcoming.startTime} - ${nextUpcoming.endTime}`;
        const dayLabel = nextDayOffset === 1 ? "فردا" : "کلاس بعدی";
        classLocation = nextUpcoming.location ? `📍 ${dayLabel} • مکان: ${nextUpcoming.location}` : `📍 ${dayLabel}`;
      } else {
        classTitle = todaySessions.length === 0 ? "امروز کلاسی ندارید" : "کلاس‌های امروز پایان یافته است";
        classTime = "--:--";
        classLocation = "خسته نباشید!";
      }
    }

    // 2. Next upcoming exam
    const upcomingExams = (exams || [])
      .filter(ex => !ex.completed)
      .sort((a, b) => compareChronologicalTimestamps(a.date, a.time, b.date, b.time));

    const nextExam = upcomingExams.length > 0 ? upcomingExams[0] : null;
    const examTitle = nextExam ? `${nextExam.courseName} (${nextExam.type || "آزمون"})` : "امتحان نزدیکی ثبت‌نشده";
    const examDate = nextExam ? `${nextExam.date} • ${nextExam.time}` : "--";

    // 3. Format today date
    let todayDate = "امروز";
    try {
      const formatter = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "short" });
      todayDate = formatter.format(now);
    } catch {
      todayDate = "امروز";
    }

    // 4. Send both pre-calculated values AND full JSON datasets for autonomous real-time updates
    const classesJson = JSON.stringify(classes || []);
    const examsJson = JSON.stringify(exams || []);

    await NativeHelper.updateWidgetData?.({
      classTitle,
      classTime,
      classLocation,
      examTitle,
      examDate,
      todayDate,
      classesJson,
      examsJson,
      weekParityOffset
    });
  } catch (err) {
    console.warn("[WidgetSync] Widget sync failed:", err);
  }
}
