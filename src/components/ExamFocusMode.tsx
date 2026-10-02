import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, Pause, RotateCcw, Clock, Music, Check } from "lucide-react";
import { ExamItem } from "../types";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { NativeHelper } from "../services/NotificationService";
import { safeStorageGet, safeStorageSet, safeStorageRemove } from "../utils/storageUtils";

export const FOCUS_STORAGE_KEY = "tabriz_exam_focus_session_v2";
export const FOCUS_ALERT_CHANNEL_ID = "focus_timer_alerts_v1";
export const FOCUS_ALERT_SOUND = "alarm";

/**
 * A single, reused AudioContext. Android WebView blocks audio that is created
 * programmatically while the screen is off, so the context is created and
 * resumed on the user's first tap and kept alive for the whole session.
 */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (sharedAudioCtx) return sharedAudioCtx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    sharedAudioCtx = new Ctor();
  } catch {
    sharedAudioCtx = null;
  }
  return sharedAudioCtx;
}

/**
 * Must be called from a real user gesture. Unlocking here is what makes the
 * end-of-timer chime audible later, even after the screen was turned off.
 */
export function unlockFocusAudio(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    // A near-silent blip inside the gesture marks the context as user-activated.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  } catch {
    /* ignore */
  }
}

/** Plays the completion chime through the pre-unlocked context. */
function playChimeTone(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime + 0.02;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const noteStart = now + idx * 0.14;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.32, noteStart + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 1.0);
    });
    // The 3rd chord repeats so the alert is clearly noticeable.
    const repeatStart = now + freqs.length * 0.14 + 0.35;
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const noteStart = repeatStart + idx * 0.14;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 1.0);
    });
  } catch {
    /* ignore */
  }
}

const VIBRATION_PATTERN = [0, 400, 200, 400, 200, 700];

/** Fires the end-of-timer alert through every channel available on the device. */
export function triggerFocusAlert(): void {
  // Only play the synthesized Web Audio chime on web browsers.
  // On Android, FocusAlarmService + FocusAlarmSound manage the exclusive Clock-style alarm audio.
  if (!Capacitor.isNativePlatform()) {
    playChimeTone();
  }

  // Web vibration (works in the browser; ignored by most Android WebViews).
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && !Capacitor.isNativePlatform()) {
      navigator.vibrate(VIBRATION_PATTERN);
    }
  } catch {
    /* ignore */
  }

  // Native vibration – managed by native alarm service on Android, fallback for webview if not ringing
  try {
    if (!Capacitor.isNativePlatform()) {
      void NativeHelper.vibrate?.({ pattern: VIBRATION_PATTERN }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export interface FocusSessionState {
  examId: string;
  courseName: string;
  targetEndTime: number;
  totalDurationSeconds: number;
  isBreak: boolean;
  sessionStartedAt: number;
  baseStudiedSeconds: number;
  isActive: boolean;
}

interface ExamFocusModeProps {
  exam: ExamItem | null;
  onClose: () => void;
  onComplete: (examId: string, minutesStudied: number) => void;
  isMinimized: boolean;
  onMinimize: () => void;
  isDarkMode?: boolean;
}

export default function ExamFocusMode({
  exam,
  onClose,
  onComplete,
  isMinimized,
  onMinimize,
  isDarkMode: propIsDarkMode,
}: ExamFocusModeProps) {
  const isDarkMode =
    propIsDarkMode ??
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (!exam || isMinimized) return;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    const targetBg = isDarkMode ? "#020617" : "#f8fafc";
    document.documentElement.style.backgroundColor = targetBg;
    document.body.style.backgroundColor = targetBg;
    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, [exam, isMinimized, isDarkMode]);

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [studiedSeconds, setStudiedSeconds] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Local Music Player
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [currentSongName, setCurrentSongName] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isMinimized || !exam) {
      audioRef.current?.pause();
      setIsPlayingMusic(false);
    }
  }, [isMinimized, exam]);

  /**
   * The native full-screen alarm has done its job once a session ends, so it is
   * cancelled at every terminal transition to keep a stale alarm from firing.
   */
  const clearNativeAlarm = useCallback(() => {
    if (!Capacitor.isNativePlatform()) return;
    NativeHelper.cancelFocusAlarm?.().catch(() => {});
    LocalNotifications.cancel({ notifications: [{ id: 888 }] }).catch(() => {});
  }, []);

  // Wall-Clock Synchronization Function
  const syncWithWallClock = useCallback(() => {
    const session = safeStorageGet<FocusSessionState | null>(FOCUS_STORAGE_KEY, null);
    if (!session || !session.isActive || session.examId !== exam?.id) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.round((session.targetEndTime - now) / 1000));
    setTimeLeft(remaining);

    if (!session.isBreak) {
      const elapsed = Math.floor(
        (Math.min(now, session.targetEndTime) - session.sessionStartedAt) / 1000
      );
      setStudiedSeconds(session.baseStudiedSeconds + elapsed);
    }

    if (remaining <= 0) {
      triggerFocusAlert();
      setIsActive(false);
      // DO NOT call clearNativeAlarm() here!
      // The native alarm (sound, notification, screen) is ringing right now
      // and must stay active until the user taps "Stop" on the alarm screen or notification!

      if (!session.isBreak) {
        const totalStudied = session.baseStudiedSeconds + session.totalDurationSeconds;
        setStudiedSeconds(totalStudied);
        setIsBreak(true);
        setTimeLeft(5 * 60);
      } else {
        setIsBreak(false);
        setTimeLeft(selectedMinutes * 60);
      }
      safeStorageRemove(FOCUS_STORAGE_KEY);
    }
  }, [exam?.id, selectedMinutes]);

  // Initial Session Restoration — runs once per exam, not on every render.
  // selectedMinutes is read through a ref so it never re-triggers this effect.
  const selectedMinutesRef = useRef(selectedMinutes);
  selectedMinutesRef.current = selectedMinutes;
  const restoredExamIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!exam) return;
    if (restoredExamIdRef.current === exam.id) return;
    restoredExamIdRef.current = exam.id;

    const session = safeStorageGet<FocusSessionState | null>(FOCUS_STORAGE_KEY, null);
    if (session && session.examId === exam.id && session.isActive) {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((session.targetEndTime - now) / 1000));
      setIsBreak(session.isBreak);
      setSelectedMinutes(Math.round(session.totalDurationSeconds / 60) || 25);

      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsActive(true);
        if (!session.isBreak) {
          const elapsed = Math.floor((now - session.sessionStartedAt) / 1000);
          setStudiedSeconds(session.baseStudiedSeconds + elapsed);
        } else {
          setStudiedSeconds(session.baseStudiedSeconds);
        }
      } else {
        // Expired while app was closed or device was sleeping
        triggerFocusAlert();
        setIsActive(false);
        // Do NOT call clearNativeAlarm() here so the native alarm keeps ringing
        if (!session.isBreak) {
          setStudiedSeconds(session.baseStudiedSeconds + session.totalDurationSeconds);
          setIsBreak(true);
          setTimeLeft(5 * 60);
        } else {
          setIsBreak(false);
          setTimeLeft((Math.round(session.totalDurationSeconds / 60) || 25) * 60);
        }
        safeStorageRemove(FOCUS_STORAGE_KEY);
      }
    } else {
      // No session belongs to this exam: clear any timer left over from a
      // previously focused exam so the countdown cannot appear frozen.
      setIsActive(false);
      setIsBreak(false);
      setStudiedSeconds(0);
      setTimeLeft(selectedMinutesRef.current * 60);
    }
  }, [exam?.id]);

  // Active Wall-Clock Tick (Runs every 1000ms, does not tear down interval)
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      syncWithWallClock();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, syncWithWallClock]);

  // App Wake / Screen-On Listeners (Instant Catch-up on Screen Wake)
  useEffect(() => {
    const handleWakeup = () => {
      syncWithWallClock();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleWakeup();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    let appStateListener: { remove: () => void } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener("appStateChange", (state) => {
        if (state.isActive) {
          handleWakeup();
        }
      })
        .then((l) => {
          appStateListener = l;
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      appStateListener?.remove();
    };
  }, [syncWithWallClock]);

  const toggleTimer = async () => {
    if (isActive) {
      // PAUSING:
      const session = safeStorageGet<FocusSessionState | null>(FOCUS_STORAGE_KEY, null);
      if (session) {
        const now = Date.now();
        const elapsed = session.isBreak
          ? 0
          : Math.floor((Math.min(now, session.targetEndTime) - session.sessionStartedAt) / 1000);
        setStudiedSeconds(session.baseStudiedSeconds + elapsed);
      }
      safeStorageRemove(FOCUS_STORAGE_KEY);
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.cancel({ notifications: [{ id: 888 }] }).catch(() => {});
        NativeHelper.cancelFocusAlarm?.().catch(() => {});
      }
      setIsActive(false);
      return;
    }

    // STARTING TIMER
    const now = Date.now();
    const durationSeconds = timeLeft;
    const targetEndTime = now + durationSeconds * 1000;

    const newSession: FocusSessionState = {
      examId: exam?.id || "unknown",
      courseName: exam?.courseName || "مطالعه",
      targetEndTime,
      totalDurationSeconds: durationSeconds,
      isBreak,
      sessionStartedAt: now,
      baseStudiedSeconds: studiedSeconds,
      isActive: true,
    };
    safeStorageSet(FOCUS_STORAGE_KEY, newSession);

    if (Capacitor.isNativePlatform()) {
      try {
        // The primary alert: a native full-screen alarm that wakes the screen
        // and sounds loudly on the ALARM stream via setAlarmClock, so it still
        // fires when the phone is asleep, silenced, or the app has been killed.
        const alarmRes = await NativeHelper.scheduleFocusAlarm?.({
          triggerAtMillis: targetEndTime,
          title: isBreak ? "پایان زمان استراحت" : "پایان زمان تمرکز",
          body: isBreak
            ? "زمان استراحت به پایان رسید. آماده شروع مجدد هستید؟"
            : `دوره «${exam?.courseName || "مطالعه"}» به پایان رسید. خسته نباشید!`,
          isDarkMode,
        });
        if (alarmRes && !alarmRes.scheduled) {
          throw new Error("Native alarm scheduling unconfirmed");
        }
      } catch (e) {
        console.warn("Native focus alarm scheduling failed:", e);
        // Fallback to local notification only if native alarm scheduling failed
        try {
          const endDate = new Date(targetEndTime);
          await LocalNotifications.schedule({
            notifications: [
              {
                id: 888,
                title: isBreak ? "پایان زمان استراحت!" : "پایان زمان تمرکز!",
                body: isBreak
                  ? "زمان استراحت به پایان رسید. آماده شروع مجدد هستید؟"
                  : "زمان مطالعه به پایان رسید. خسته نباشید!",
                schedule: { at: endDate, allowWhileIdle: true },
                smallIcon: "ic_launcher",
              },
            ],
          });
        } catch (err) {
          console.warn("Fallback local notification failed:", err);
        }
      }
    }
    setIsActive(true);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(selectedMinutes * 60);
    setStudiedSeconds(0);
    safeStorageRemove(FOCUS_STORAGE_KEY);
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.cancel({ notifications: [{ id: 888 }] }).catch(() => {});
      NativeHelper.cancelFocusAlarm?.().catch(() => {});
    }
  };

  const changeTime = (mins: number) => {
    if (isActive) return;
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    setIsBreak(false);
    safeStorageRemove(FOCUS_STORAGE_KEY);
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes);
    if (mins > 0 && mins <= 300) {
      changeTime(mins);
      setShowSettings(false);
      setCustomMinutes("");
    }
  };

  // Music Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      audioRef.current.src = url;
      setCurrentSongName(file.name);
      audioRef.current.play();
      setIsPlayingMusic(true);
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current || !currentSongName) {
      fileInputRef.current?.click();
      return;
    }
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play();
      setIsPlayingMusic(true);
    }
  };

  // Format Time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  };

  const toPersianDigits = (num: string | number) => {
    return num.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
  };

  const progress = 1 - timeLeft / (isBreak ? 5 * 60 : selectedMinutes * 60);
  const circleCircumference = 2 * Math.PI * 120;
  const strokeDashoffset = circleCircumference - progress * circleCircumference;

  if (!exam && !isMinimized) return null;

  const content = (
    <>
      <audio ref={audioRef} loop onEnded={() => setIsPlayingMusic(false)} />
      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onPointerDown={unlockFocusAudio}
            className={`fixed inset-0 w-full h-full z-[999999] flex flex-col items-center justify-center overflow-hidden transition-colors duration-200 ${
              isDarkMode ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-900"
            }`}
            style={{ backgroundColor: isDarkMode ? "#020617" : "#f8fafc" }}
          >
            {/* Ambient background glow */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                background: isDarkMode
                  ? "radial-gradient(60% 45% at 12% 8%, rgba(49,46,129,0.55) 0%, rgba(2,6,23,0) 70%)," +
                    "radial-gradient(55% 40% at 92% 95%, rgba(30,58,138,0.45) 0%, rgba(2,6,23,0) 70%)"
                  : "radial-gradient(60% 45% at 12% 8%, rgba(99,102,241,0.12) 0%, rgba(248,250,252,0) 70%)," +
                    "radial-gradient(55% 40% at 92% 95%, rgba(59,130,246,0.08) 0%, rgba(248,250,252,0) 70%)",
              }}
            />

            {/* Top Navigation with Safe Area Top Inset */}
            <div className="absolute top-0 inset-x-0 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] px-6 pb-4 flex items-center justify-between z-10">
              <button
                onClick={onMinimize}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors border ${
                  isDarkMode
                    ? "bg-white/10 hover:bg-white/15 border-white/10 text-white/70"
                    : "bg-white hover:bg-slate-100 border-slate-200/80 text-slate-700 shadow-sm"
                }`}
                title="کوچک کردن"
                aria-label="کوچک کردن"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors border ${
                    showSettings
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                      : isDarkMode
                      ? "bg-white/10 text-white/70 hover:bg-white/15 border-white/10"
                      : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200/80 shadow-sm"
                  }`}
                  title="تنظیمات زمان"
                  aria-label="تنظیمات زمان"
                >
                  <Clock className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6">
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-black mb-2 tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {isBreak ? "زمان استراحت" : "تمرکز عمیق"}
                </h2>
                <p className={`font-bold text-sm ${isDarkMode ? "text-indigo-200/70" : "text-indigo-600"}`}>
                  {exam?.courseName || "در حال مطالعه"}
                </p>
              </div>

              {/* Radial Timer */}
              <div className="relative w-[280px] h-[280px] flex items-center justify-center mb-10">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    className={`fill-none ${isDarkMode ? "stroke-white/10" : "stroke-slate-200"}`}
                    strokeWidth="8"
                  />
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    className={`${isBreak ? "stroke-emerald-500" : "stroke-indigo-600"} fill-none transition-all duration-1000 ease-linear`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>

                <div className="flex flex-col items-center justify-center">
                  <span
                    className={`text-6xl sm:text-7xl font-black font-sans tracking-tight tabular-nums select-none ${
                      isDarkMode ? "text-white drop-shadow-md" : "text-slate-900"
                    }`}
                    dir="ltr"
                  >
                    {formatTime(timeLeft)}
                  </span>
                  <span className={`text-sm font-black mt-2 ${isBreak ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-300"}`}>
                    {isBreak ? "استراحت کن!" : "فوکوس"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-end justify-center gap-6 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={resetTimer}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 border ${
                      isDarkMode
                        ? "bg-white/10 hover:bg-white/15 border-white/10 text-white/80"
                        : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                    }`}
                    title="بازنشانی"
                    aria-label="بازنشانی"
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                  <span className={`text-[10px] font-bold ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>بازنشانی</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={toggleTimer}
                    className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shadow-[0_8px_30px_rgba(79,70,229,0.35)] transition-transform active:scale-95"
                    title={isActive ? "توقف" : "شروع"}
                    aria-label={isActive ? "توقف" : "شروع"}
                  >
                    {isActive ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 fill-current ml-1" />
                    )}
                  </button>
                  <span className={`text-[10px] font-bold ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
                    {isActive ? "توقف" : "شروع"}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      if (studiedSeconds > 0 && exam) {
                        onComplete(exam.id, Math.floor(studiedSeconds / 60));
                      }
                      resetTimer();
                      onClose();
                    }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-emerald-500 transition-transform active:scale-95 border ${
                      isDarkMode
                        ? "bg-white/10 hover:bg-white/15 border-white/10"
                        : "bg-white hover:bg-slate-100 border-slate-200 shadow-sm"
                    }`}
                    title="ثبت و خروج"
                    aria-label="ثبت و خروج"
                  >
                    <Check className="w-6 h-6" />
                  </button>
                  <span className={`text-[10px] font-bold ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>ثبت و خروج</span>
                </div>
              </div>

              {/* Local Music Player */}
              <div className={`w-full rounded-3xl p-4 flex items-center gap-4 border transition-colors ${
                isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
              }`}>
                <button
                  onClick={toggleMusic}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    isPlayingMusic
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : isDarkMode
                      ? "bg-white/10 text-white/80 hover:bg-white/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="پخش موسیقی"
                  aria-label="پخش موسیقی"
                >
                  {isPlayingMusic ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {currentSongName || "پخش آهنگ"}
                  </h4>
                  <p className={`text-xs truncate ${isDarkMode ? "text-white/50" : "text-slate-500"}`}>
                    {currentSongName ? "در حال پخش از گوشی" : "یک آهنگ از گوشی انتخاب کنید"}
                  </p>
                </div>
                {!currentSongName && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer border ${
                      isDarkMode
                        ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                    }`}
                  >
                    انتخاب
                  </button>
                )}
                {currentSongName && (
                  <button
                    onClick={() => {
                      audioRef.current?.pause();
                      audioRef.current?.removeAttribute("src");
                      if (objectUrlRef.current) {
                        URL.revokeObjectURL(objectUrlRef.current);
                        objectUrlRef.current = null;
                      }
                      setIsPlayingMusic(false);
                      setCurrentSongName(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className={`px-2 py-2 transition-colors ${isDarkMode ? "text-white/50 hover:text-white/80" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Custom Time Settings Panel with Safe Area Bottom Inset */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  className={`absolute bottom-0 inset-x-0 border-t rounded-t-3xl p-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.25)] max-w-lg mx-auto ${
                    isDarkMode ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className={`text-lg font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>زمان‌بندی</h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className={`p-1 rounded-lg transition-colors ${isDarkMode ? "text-white/50 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex gap-2.5 mb-5">
                    {[15, 25, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          changeTime(mins);
                          setShowSettings(false);
                        }}
                        className={`flex-1 py-3 rounded-2xl font-black text-sm transition-colors border ${
                          selectedMinutes === mins && !isBreak
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                            : isDarkMode
                            ? "bg-white/5 text-white/70 hover:bg-white/10 border-white/5"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200/80"
                        }`}
                      >
                        {toPersianDigits(mins)} دقیقه
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleCustomTimeSubmit} className="flex gap-2.5">
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="زمان سفارشی (دقیقه)"
                      className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold outline-none border transition-colors text-left ${
                        isDarkMode
                          ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500"
                          : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                      }`}
                      dir="ltr"
                    />
                    <button
                      type="submit"
                      disabled={!customMinutes}
                      className="px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl transition-colors cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
                    >
                      تایید
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
