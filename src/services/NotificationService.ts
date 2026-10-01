import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { ClassItem, ExamItem, ProjectItem } from '../types';
import {
  getChronologicalTimestamp,
  parseJsDay,
  isEvenWeekAt,
  toEnglishDigits,
  datesForWeekdayInHorizon,
} from '../utils/dateUtils';
import { safeStorageGetString, safeStorageSet, safeStorageRemove } from '../utils/storageUtils';

export const NOTIFICATION_CHANNEL_ID = 'student_reminders_v2';

/** Set to "1" when Android refuses exact alarms, so the UI can warn the user. */
export const EXACT_ALARM_BLOCKED_KEY = 'tabriz_exact_alarm_blocked';

// ID ranges (avoid Food=1000, Focus=888/999, Test=777777)
const CLASS_ID_MIN = 100000;
const CLASS_ID_MAX = 199999;
const EXAM_ID_MIN = 200000;
const EXAM_ID_MAX = 299999;
const PROJECT_ID_MIN = 300000;
const PROJECT_ID_MAX = 399999;
const TEST_NOTIFICATION_ID = 777777;

const CLASS_HORIZON_DAYS = 28;
const DEFAULT_CLASS_LEAD_MIN = 30;
const MAX_BATCH = 40;

export interface NativeNotificationHelperPlugin {
  isIgnoringBatteryOptimizations(): Promise<{ isIgnoring: boolean }>;
  requestIgnoreBatteryOptimizations(): Promise<void>;
  openNotificationSettings(): Promise<void>;
  canScheduleExactAlarms(): Promise<{ canSchedule: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  openAutoStartSettings(): Promise<void>;
  openSystemMusicPlayer(): Promise<void>;
  vibrate(options?: { pattern?: number[] }): Promise<void>;
  setSystemAlarm(options: { hour: number; minute: number; message: string }): Promise<void>;
  saveImageToDownloads(options: {
    base64: string;
    fileName: string;
  }): Promise<{ uri: string; path: string }>;
  updateWidgetData(options: {
    classTitle: string;
    classTime: string;
    classLocation: string;
    examTitle: string;
    examDate: string;
    todayDate: string;
  }): Promise<void>;
}

const NATIVE_PLUGIN_NAME = 'NativeNotificationHelper';

export const NativeHelper =
  Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(NATIVE_PLUGIN_NAME)
    ? registerPlugin<NativeNotificationHelperPlugin>(NATIVE_PLUGIN_NAME)
    : ({} as Partial<NativeNotificationHelperPlugin>);

function hasNativeMethod(name: keyof NativeNotificationHelperPlugin): boolean {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.isPluginAvailable(NATIVE_PLUGIN_NAME) &&
    typeof (NativeHelper as Record<string, unknown>)[name] === 'function'
  );
}

/**
 * Parses a Shamsi/Gregorian date string (e.g. "۱۵ خرداد ۱۴۰۵") plus optional
 * "HH:mm" time into an absolute Date. Returns null when unparseable.
 */
export function parseUniversalShamsiDate(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const ts = getChronologicalTimestamp(dateStr, timeStr || '10:00');
    if (!Number.isFinite(ts)) return null;
    return new Date(ts);
  } catch {
    return null;
  }
}

/** Maps a reminder token to milliseconds before the event. */
function reminderOffsetMs(reminder: string): number | null {
  const r = (reminder || '').trim();
  if (r === '2days') return 2 * 24 * 60 * 60 * 1000;
  if (r === '1day') return 24 * 60 * 60 * 1000;
  if (r === '1hour') return 60 * 60 * 1000;
  if (r === '30min') return 30 * 60 * 1000;
  if (r.startsWith('custom_')) {
    const days = parseInt(r.slice('custom_'.length), 10);
    if (Number.isFinite(days) && days > 0) return days * 24 * 60 * 60 * 1000;
  }
  return null;
}

function parseClock(timeStr?: string): { h: number; m: number } {
  const parts = toEnglishDigits(timeStr || '').split(':');
  let h = parseInt(parts[0] ?? '', 10);
  let m = parseInt(parts[1] ?? '', 10);
  if (!Number.isFinite(h) || h < 0 || h > 23) h = 9;
  if (!Number.isFinite(m) || m < 0 || m > 59) m = 0;
  return { h, m };
}

function getClassLeadMinutes(): number {
  const raw = parseInt(toEnglishDigits(safeStorageGetString('class_lead_minutes', '30')), 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_CLASS_LEAD_MIN;
}

function isInRange(id: number, min: number, max: number): boolean {
  return id >= min && id <= max;
}

function belongsToScheduler(id: number): boolean {
  return (
    isInRange(id, CLASS_ID_MIN, CLASS_ID_MAX) ||
    isInRange(id, EXAM_ID_MIN, EXAM_ID_MAX) ||
    isInRange(id, PROJECT_ID_MIN, PROJECT_ID_MAX)
  );
}

interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  at: Date;
  extra?: Record<string, unknown>;
}

async function cancelSchedulerNotifications(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter((n) => belongsToScheduler(n.id))
      .map((n) => ({ id: n.id }));
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  } catch (e) {
    console.warn('Failed to cancel pending scheduler notifications:', e);
  }
}

function buildClassNotifications(
  classes: ClassItem[],
  now: Date,
  leadMinutes: number,
  parityOffset: number
): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  const nowMs = now.getTime();
  let nextId = CLASS_ID_MIN;

  for (const cls of classes) {
    const sessions: Array<{
      weekday?: string;
      start?: string;
      end?: string;
      location?: string;
      weekType?: 'all' | 'even' | 'odd';
      label: string;
    }> = [
      {
        weekday: cls.weekday,
        start: cls.startTime,
        end: cls.endTime,
        location: cls.location,
        weekType: cls.weekType,
        label: cls.courseName,
      },
    ];
    if (cls.hasSecondSession && cls.secondWeekday) {
      sessions.push({
        weekday: cls.secondWeekday,
        start: cls.secondStartTime || cls.startTime,
        end: cls.secondEndTime || cls.endTime,
        location: cls.secondLocation || cls.location,
        weekType: cls.secondWeekType,
        label: `${cls.courseName} (جلسه ۲)`,
      });
    }

    for (const session of sessions) {
      const jsDay = parseJsDay(session.weekday);
      if (jsDay < 0) continue;

      const { h, m } = parseClock(session.start);
      const days = datesForWeekdayInHorizon(jsDay, now, CLASS_HORIZON_DAYS);

      for (const day of days) {
        if (session.weekType === 'even' && !isEvenWeekAt(day.getTime(), parityOffset)) continue;
        if (session.weekType === 'odd' && isEvenWeekAt(day.getTime(), parityOffset)) continue;

        const classAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
        const fireAt = new Date(classAt.getTime() - leadMinutes * 60 * 1000);
        if (fireAt.getTime() <= nowMs) continue;
        if (nextId > CLASS_ID_MAX) break;

        const startStr = session.start || '';
        const endStr = session.end || '';
        const loc = session.location ? `\nمکان: ${session.location}` : '';
        const leadLabel =
          leadMinutes >= 60
            ? `${Math.round(leadMinutes / 60)} ساعت`
            : `${leadMinutes} دقیقه`;

        out.push({
          id: nextId++,
          title: `یادآوری کلاس ${session.label}`,
          body: `شروع کلاس تا ${leadLabel} دیگر (${startStr} - ${endStr})${loc}`,
          at: fireAt,
          extra: { tab: 'schedule' },
        });
      }
    }
  }
  return out;
}

function buildEventNotifications(
  exams: ExamItem[],
  projects: ProjectItem[],
  now: Date
): ScheduledNotification[] {
  const out: ScheduledNotification[] = [];
  const nowMs = now.getTime();
  let examId = EXAM_ID_MIN;
  let projectId = PROJECT_ID_MIN;

  for (const ex of exams) {
    if (ex.completed) continue;
    const eventAt = parseUniversalShamsiDate(ex.date, ex.time);
    if (!eventAt) continue;
    const reminders = ex.reminders && ex.reminders.length > 0 ? ex.reminders : ['1day'];
    for (const rem of reminders) {
      const offset = reminderOffsetMs(rem);
      if (offset === null) continue;
      const fireAt = new Date(eventAt.getTime() - offset);
      if (fireAt.getTime() <= nowMs) continue;
      if (examId > EXAM_ID_MAX) break;
      out.push({
        id: examId++,
        title: `یادآوری امتحان ${ex.courseName}`,
        body: `${ex.type} — ${ex.date}${ex.time ? ` ساعت ${ex.time}` : ''}${ex.location ? `\nمکان: ${ex.location}` : ''}`,
        at: fireAt,
        extra: { tab: 'exams' },
      });
    }
  }

  for (const pr of projects) {
    if (pr.status === 'submitted') continue;
    const eventAt = parseUniversalShamsiDate(pr.deadline, pr.time);
    if (!eventAt) continue;
    const reminders = pr.reminders && pr.reminders.length > 0 ? pr.reminders : ['1day'];
    for (const rem of reminders) {
      const offset = reminderOffsetMs(rem);
      if (offset === null) continue;
      const fireAt = new Date(eventAt.getTime() - offset);
      if (fireAt.getTime() <= nowMs) continue;
      if (projectId > PROJECT_ID_MAX) break;
      out.push({
        id: projectId++,
        title: `یادآوری پروژه ${pr.title}`,
        body: `${pr.courseName} — مهلت: ${pr.deadline}${pr.time ? ` ساعت ${pr.time}` : ''}`,
        at: fireAt,
        extra: { tab: 'projects' },
      });
    }
  }

  return out;
}

async function scheduleInBatches(items: ScheduledNotification[]): Promise<void> {
  for (let i = 0; i < items.length; i += MAX_BATCH) {
    const chunk = items.slice(i, i + MAX_BATCH);
    await LocalNotifications.schedule({
      notifications: chunk.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: n.at, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL_ID,
        extra: n.extra,
      })),
    });
  }
}

async function scheduleAll(
  classes: ClassItem[],
  exams: ExamItem[],
  projects: ProjectItem[]
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const granted = await NotificationService.requestPermission();
    if (!granted) return;

    await NotificationService.init();
    await cancelSchedulerNotifications();

    // Android 12+ can silently drop every exact alarm when the user revoked
    // "Alarms & reminders". Surface that instead of failing invisibly.
    const exactAlarmsAllowed = await NotificationService.canScheduleExactAlarms();
    if (!exactAlarmsAllowed) {
      safeStorageSet(EXACT_ALARM_BLOCKED_KEY, '1');
      console.warn(
        '[Notifications] Exact alarms are not permitted; reminders were scheduled but may be delayed. ' +
          'The user must enable "Alarms & reminders" in system settings.'
      );
    } else {
      safeStorageRemove(EXACT_ALARM_BLOCKED_KEY);
    }

    const now = new Date();
    const leadMinutes = getClassLeadMinutes();
    let parityOffset = 0;
    try {
      parityOffset = parseInt(safeStorageGetString('tabriz_week_parity', '0'), 10) || 0;
    } catch {
      parityOffset = 0;
    }

    const items = [
      ...buildClassNotifications(classes, now, leadMinutes, parityOffset),
      ...buildEventNotifications(exams, projects, now),
    ];

    if (items.length > 0) {
      await scheduleInBatches(items);
    }
  } catch (e) {
    console.error('scheduleAll failed:', e);
  }
}

export const NotificationService = {
  async init() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.requestPermissions();
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Student Notifications',
        description: 'Class and exam reminders',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#4f46e5',
      });
    } catch (e) {
      console.error('Create channel error:', e);
    }
  },

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const res = await LocalNotifications.requestPermissions();
      return res.display === 'granted';
    } catch {
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    try {
      const res = await LocalNotifications.checkPermissions();
      return res.display === 'granted';
    } catch {
      return false;
    }
  },

  async isIgnoringBatteryOptimizations(): Promise<boolean> {
    if (!hasNativeMethod('isIgnoringBatteryOptimizations')) return true;
    try {
      const res = await NativeHelper.isIgnoringBatteryOptimizations!();
      return !!res?.isIgnoring;
    } catch {
      return true;
    }
  },

  async canScheduleExactAlarms(): Promise<boolean> {
    if (!hasNativeMethod('canScheduleExactAlarms')) return true;
    try {
      const res = await NativeHelper.canScheduleExactAlarms!();
      return !!res?.canSchedule;
    } catch {
      return true;
    }
  },

  /** True when the last scheduling pass found that exact alarms are not permitted. */
  isExactAlarmBlocked(): boolean {
    return safeStorageGetString(EXACT_ALARM_BLOCKED_KEY, '') === '1';
  },

  scheduleAll,

  async syncNotifications(c: ClassItem[], e: ExamItem[], p: ProjectItem[]): Promise<void> {
    return scheduleAll(c, e, p);
  },

  async checkPermission(): Promise<boolean> {
    return NotificationService.checkPermissions();
  },

  async isBatteryOptimizationIgnored(): Promise<boolean> {
    return NotificationService.isIgnoringBatteryOptimizations();
  },

  async openAppNotificationSettings(): Promise<void> {
    if (!hasNativeMethod('openNotificationSettings')) return;
    try {
      await NativeHelper.openNotificationSettings!();
    } catch (e) {
      console.warn('openNotificationSettings failed:', e);
    }
  },

  async requestBatteryOptimization(): Promise<void> {
    if (!hasNativeMethod('requestIgnoreBatteryOptimizations')) return;
    try {
      await NativeHelper.requestIgnoreBatteryOptimizations!();
    } catch (e) {
      console.warn('requestIgnoreBatteryOptimizations failed:', e);
    }
  },

  async openExactAlarmSettings(): Promise<void> {
    if (!hasNativeMethod('openExactAlarmSettings')) return;
    try {
      await NativeHelper.openExactAlarmSettings!();
    } catch (e) {
      console.warn('openExactAlarmSettings failed:', e);
    }
  },

  async sendTestNotification(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const granted = await NotificationService.requestPermission();
      if (!granted) return false;
      await NotificationService.init();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_ID,
            title: 'تست اعلان دانشجویار',
            body: 'اگر این پیام را می‌بینید، اعلان‌ها به‌درستی کار می‌کنند.',
            schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true },
            channelId: NOTIFICATION_CHANNEL_ID,
            extra: { tab: 'dashboard' },
          },
        ],
      });
      return true;
    } catch (e) {
      console.error('sendTestNotification failed:', e);
      return false;
    }
  },
};
