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

  const {
    classes,
    exams,
    projects
  } = deps;

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

  // Request notification permission after UI loads
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const timer = setTimeout(() => {
      NotificationService.requestPermission().catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Sync notifications + widget
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const timer = setTimeout(() => {
      NotificationService.syncNotifications(classes, exams, projects).catch(() => {});
      syncAndroidWidget(classes, exams).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [classes, exams, projects]);

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
