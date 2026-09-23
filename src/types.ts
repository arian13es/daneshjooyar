/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

export type ReminderType = string; // e.g. "2days", "1day", "1hour", "custom_X"

export interface Note {
  id: string;
  text: string;
  timestamp: string; // ISO string
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string; // MIME type
  size: number; // Bytes
  timestamp: string; // ISO string
}

export interface Absence {
  id: string;
  date: string; // Text representation, e.g. "۱۴۰۳/۰۸/۱۲"
}

export interface ClassItem {
  id: string;
  courseName: string;
  professor?: string;
  weekday: string; // شنبه, یکشنبه, دوشنبه, سه‌شنبه, چهارشنبه, پنج‌شنبه
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  weekType?: "all" | "even" | "odd";
  notes?: Note[];
  attachments?: Attachment[];
  absences?: Absence[];
  color?: string; // Optional custom palette ID (e.g. 'indigo', 'emerald', 'amber', 'violet', 'rose', 'cyan', 'teal', 'sky')
  // Second session support (e.g. 2 sessions a week with alternating week parity)
  hasSecondSession?: boolean;
  secondWeekday?: string;
  secondStartTime?: string;
  secondEndTime?: string;
  secondWeekType?: "all" | "even" | "odd";
  secondLocation?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface ExamItem {
  id: string;
  courseName: string;
  type: "میان‌ترم" | "پایان‌ترم";
  date: string; // Shamsi or Gregorian, text
  time?: string; // HH:mm
  location?: string;
  notes?: string;
  notesList?: Note[];
  attachments?: Attachment[];
  checklist?: ChecklistItem[];
  completed?: boolean;
  reminders?: ReminderType[];
  totalStudyMinutes?: number;
}

export interface ProjectItem {
  id: string;
  courseName: string;
  title: string;
  description?: string;
  deadline: string;
  time?: string; // HH:mm
  status: "not_started" | "in_progress" | "submitted";
  priority: "low" | "medium" | "high";
  reminders?: ReminderType[];
  notes?: Note[];
  attachments?: Attachment[];
  tasks?: ChecklistItem[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  title?: string;
  category?: string;
  portalUrl?: string;
  portalName?: string;
  relatedQuestions?: string[];
}

export interface StudentProfile {
  firstName: string;
  lastName: string;
  faculty: string;
  major: string;
  studentId?: string;
  entryYear?: string;
  gender?: "male" | "female";
  avatarUrl?: string;
}

export type TabType = "dashboard" | "map" | "schedule" | "exams" | "projects" | "assistant";

export interface BudgetExpense {
  id: string;
  title: string;
  amount: number;
  category: "food" | "dorm" | "cafe" | "transport" | "shopping" | "entertainment" | "education" | "other";
  date: string;
}

export interface BudgetState {
  monthlyLimit: number;
  expenses: BudgetExpense[];
  savings?: number;
  savingsGoal?: number;
  savingsGoalName?: string;
}
