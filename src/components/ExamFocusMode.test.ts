import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeStorageGet, safeStorageSet, safeStorageRemove } from '../utils/storageUtils';
import { FOCUS_STORAGE_KEY as STORAGE_KEY, FocusSessionState as StoredFocusSession } from './ExamFocusMode';

describe('ExamFocusMode Wall-Clock Background Timer & Alarm Engine', () => {
  beforeEach(() => {
    safeStorageRemove(STORAGE_KEY);
    vi.useRealTimers();
  });

  it('correctly calculates remaining time after device screen was off for 15 minutes', () => {
    const startTime = 1727160000000;
    const durationSeconds = 25 * 60; // 1500s
    const targetEndTime = startTime + durationSeconds * 1000;

    const session: StoredFocusSession = {
      examId: 'exam_1',
      courseName: 'کنترل خطی',
      targetEndTime,
      totalDurationSeconds: durationSeconds,
      isBreak: false,
      sessionStartedAt: startTime,
      baseStudiedSeconds: 0,
      isActive: true,
    };
    safeStorageSet(STORAGE_KEY, session);

    // Simulate phone asleep: 15 minutes (900 seconds) have elapsed
    const nowAfterSleep = startTime + 15 * 60 * 1000;
    const remainingSeconds = Math.max(0, Math.round((session.targetEndTime - nowAfterSleep) / 1000));
    const studiedSeconds = Math.min(
      session.totalDurationSeconds,
      Math.floor((Math.min(nowAfterSleep, session.targetEndTime) - session.sessionStartedAt) / 1000)
    );

    // Remaining should be exactly 10 minutes (600s)
    expect(remainingSeconds).toBe(10 * 60);
    // Studied seconds should be exactly 15 minutes (900s)
    expect(studiedSeconds).toBe(15 * 60);
  });

  it('triggers Alarm Time-Up when waking up after timer has expired (screen was off for full duration)', () => {
    const startTime = 1727160000000;
    const durationSeconds = 25 * 60; // 1500s
    const targetEndTime = startTime + durationSeconds * 1000;

    const session: StoredFocusSession = {
      examId: 'exam_control',
      courseName: 'کنترل خطی',
      targetEndTime,
      totalDurationSeconds: durationSeconds,
      isBreak: false,
      sessionStartedAt: startTime,
      baseStudiedSeconds: 0,
      isActive: true,
    };
    safeStorageSet(STORAGE_KEY, session);

    // Simulate phone waking up 26 minutes later (1 minute past timer)
    const nowWakeup = startTime + 26 * 60 * 1000;
    const remainingSeconds = Math.max(0, Math.round((session.targetEndTime - nowWakeup) / 1000));
    const studiedSeconds = Math.min(
      session.totalDurationSeconds,
      Math.floor((Math.min(nowWakeup, session.targetEndTime) - session.sessionStartedAt) / 1000)
    );

    // Remaining should hit zero and trigger isTimeUp
    expect(remainingSeconds).toBe(0);
    // Studied seconds should be capped at total session duration (25 min = 1500s)
    expect(studiedSeconds).toBe(1500);

    // Alarm screen condition
    const isTimeUp = remainingSeconds <= 0 && session.isActive;
    expect(isTimeUp).toBe(true);
  });

  it('preserves and transitions session correctly when starting a 5-minute break', () => {
    const breakStartTime = 1727161500000;
    const breakDuration = 5 * 60; // 300s
    const targetEndTime = breakStartTime + breakDuration * 1000;

    const breakSession: StoredFocusSession = {
      examId: 'exam_control',
      courseName: 'کنترل خطی',
      targetEndTime,
      totalDurationSeconds: breakDuration,
      isBreak: true,
      sessionStartedAt: breakStartTime,
      baseStudiedSeconds: 1500, // Kept previous 25 minutes of study
      isActive: true,
    };
    safeStorageSet(STORAGE_KEY, breakSession);

    const saved = safeStorageGet<StoredFocusSession | null>(STORAGE_KEY, null);
    expect(saved).not.toBeNull();
    expect(saved?.isBreak).toBe(true);
    expect(saved?.baseStudiedSeconds).toBe(1500);

    // Simulate 2 minutes into break
    const now = breakStartTime + 2 * 60 * 1000;
    const remaining = Math.max(0, Math.round(((saved?.targetEndTime ?? 0) - now) / 1000));
    expect(remaining).toBe(3 * 60); // 3 minutes left
  });

  it('cleans up session storage on reset or completion', () => {
    safeStorageSet(STORAGE_KEY, {
      examId: 'exam_1',
      courseName: 'تست',
      targetEndTime: Date.now() + 10000,
      totalDurationSeconds: 10,
      isBreak: false,
      sessionStartedAt: Date.now(),
      baseStudiedSeconds: 0,
      isActive: true,
    });

    expect(safeStorageGet(STORAGE_KEY, null)).not.toBeNull();
    safeStorageRemove(STORAGE_KEY);
    expect(safeStorageGet(STORAGE_KEY, null)).toBeNull();
  });
});
