import { useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { NotificationService } from "../services/NotificationService";
import { syncAndroidWidget } from "../utils/widgetSync";
import { TabType, ClassItem, ExamItem, ProjectItem } from "../types";

interface NativeIntegrationDeps {
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
  showProfileEditor: boolean;
  setShowProfileEditor: (v: boolean) => void;
  selectedClassProfile: unknown;
  setSelectedClassProfile: (v: null) => void;
  selectedExamProfile: unknown;
  setSelectedExamProfile: (v: null) => void;
  selectedProjectProfile: unknown;
  setSelectedProjectProfile: (v: null) => void;
  showBudgetModal: boolean;
  setShowBudgetModal: (v: boolean) => void;
  focusExam: unknown;
  isFocusMinimized: boolean;
  setIsFocusMinimized: (v: boolean) => void;
  setAssistantSubTab: (v: "chat" | "gpa" | "calendar" | "food" | undefined) => void;
  classes: ClassItem[];
  exams: ExamItem[];
  projects: ProjectItem[];
}

export function useNativeIntegration(deps: NativeIntegrationDeps): void {
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const { classes, exams, projects } = deps;

  /** Becomes true once the deferred (idle) sync has run at least once. */
  const initialSyncDoneRef = useRef(false);

  // Re-sync whenever the schedule/exam/project data actually changes, but only
  // after the first idle sync has happened. Debounced so typing in an edit form
  // does not rebuild the whole notification set on every keystroke.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!initialSyncDoneRef.current) return;
    const timer = setTimeout(() => {
      NotificationService.syncNotifications(classes, exams, projects).catch(() => {});
      syncAndroidWidget(classes, exams).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [classes, exams, projects]);

  // Android back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    let listener: { remove: () => void } | null = null;
    CapacitorApp.addListener("backButton", () => {
      import("../utils/backHandler").then(({ executeBackAction: runBack }) => {
        if (runBack()) {
          return;
        }
        const {
          focusExam,
          isFocusMinimized,
          setIsFocusMinimized,
          showBudgetModal,
          setShowBudgetModal,
          selectedClassProfile,
          setSelectedClassProfile,
          selectedExamProfile,
          setSelectedExamProfile,
          selectedProjectProfile,
          setSelectedProjectProfile,
          showProfileEditor,
          setShowProfileEditor,
          activeTab,
          setActiveTab
        } = depsRef.current;

        if (focusExam && !isFocusMinimized) {
          setIsFocusMinimized(true);
        } else if (showBudgetModal) {
          setShowBudgetModal(false);
        } else if (selectedClassProfile) {
          setSelectedClassProfile(null);
        } else if (selectedExamProfile) {
          setSelectedExamProfile(null);
        } else if (selectedProjectProfile) {
          setSelectedProjectProfile(null);
        } else if (showProfileEditor) {
          setShowProfileEditor(false);
        } else if (activeTab !== "dashboard") {
          setActiveTab("dashboard");
        } else {
          CapacitorApp.minimizeApp();
        }
      });
    })
      .then((l) => {
        if (cancelled) {
          l.remove();
        } else {
          listener = l;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (listener) listener.remove();
    };
  }, []);

  // Defer non-essential native work until the browser is idle or the user has
  // interacted. Previously this ran at fixed 2.5s/3.0s timers, which put a
  // system permission dialog and a full notification rebuild exactly on the
  // user's first taps (a large part of the reported startup slowness).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const runDeferredWork = () => {
      if (cancelled) return;
      NotificationService.requestPermission()
        .then((granted) => {
          if (!granted || cancelled) return;
          return NotificationService.syncNotifications(
            depsRef.current.classes,
            depsRef.current.exams,
            depsRef.current.projects
          );
        })
        .then(() => {
          if (cancelled) return;
          const { classes: c, exams: e } = depsRef.current;
          return syncAndroidWidget(c, e);
        })
        .then(() => {
          // From now on, data edits drive their own debounced re-sync.
          initialSyncDoneRef.current = true;
        })
        .catch(() => {});
    };

    const scheduleIdle = () => {
      const w = window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof w.requestIdleCallback === "function") {
        idleHandle = w.requestIdleCallback(runDeferredWork, { timeout: 5000 });
      } else {
        fallbackTimer = setTimeout(runDeferredWork, 4000);
      }
    };

    // Wait for the first real interaction, but never longer than 6 seconds.
    let interactionTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      cleanupInteraction();
      scheduleIdle();
    }, 6000);

    const onFirstInteraction = () => {
      cleanupInteraction();
      scheduleIdle();
    };

    function cleanupInteraction() {
      if (interactionTimer) {
        clearTimeout(interactionTimer);
        interactionTimer = undefined;
      }
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    }

    window.addEventListener("pointerdown", onFirstInteraction, { once: true, passive: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });

    return () => {
      cancelled = true;
      cleanupInteraction();
      const w = window as unknown as { cancelIdleCallback?: (h: number) => void };
      if (idleHandle !== undefined && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleHandle);
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  // Local notification tap → navigate
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listenerPromise: Promise<{ remove: () => void } | null> | null = null;
    try {
      listenerPromise = LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (notification) => {
          const { setIsFocusMinimized, setActiveTab, setAssistantSubTab } = depsRef.current;
          if (notification.notification.id === 999 || notification.notification.id === 888) {
            setIsFocusMinimized(false);
          }

          const extra = notification.notification.extra;
          if (extra && extra.tab) {
            if (extra.tab === "schedule") {
              setActiveTab("schedule");
            } else if (extra.tab === "exams") {
              setActiveTab("exams");
            } else if (extra.tab === "projects") {
              setActiveTab("projects");
            } else if (extra.tab === "food") {
              setAssistantSubTab("food");
              setActiveTab("assistant");
            } else if (extra.tab === "dashboard") {
              setActiveTab("dashboard");
            }
          }
        }
      ) as Promise<{ remove: () => void } | null>;
    } catch (e) {
      console.warn("LocalNotifications listener failed:", e);
    }

    return () => {
      listenerPromise?.then((l) => l?.remove()).catch(() => {});
    };
  }, []);
}
