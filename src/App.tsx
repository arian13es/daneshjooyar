/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { ClassItem, ExamItem, ProjectItem, StudentProfile, TabType, BudgetState } from "./types";
import { INITIAL_CLASSES, INITIAL_EXAMS, INITIAL_PROJECTS } from "./data/initialData";
import { motion } from "motion/react";
import OnboardingModal from "./components/OnboardingModal";
import BottomTabBar from "./components/layout/BottomTabBar";
import TabContent from "./components/layout/TabContent";
import GlobalModals from "./components/layout/GlobalModals";
import { safeStorageGet, safeStorageSet } from "./utils/storageUtils";
import { usePersistentState } from "./hooks/usePersistentState";
import { useAppTheme } from "./hooks/useAppTheme";
import { useAppReady } from "./hooks/useAppReady";
import { useNativeIntegration } from "./hooks/useNativeIntegration";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [classes, setClasses] = usePersistentState<ClassItem[]>(
    "tabriz_classes_v2",
    INITIAL_CLASSES
  );
  const [exams, setExams] = usePersistentState<ExamItem[]>("tabriz_exams_v2", INITIAL_EXAMS);
  const [projects, setProjects] = usePersistentState<ProjectItem[]>(
    "tabriz_projects_v2",
    INITIAL_PROJECTS
  );
  const [calendarNotes, setCalendarNotes] = usePersistentState<Record<string, string[]>>(
    "tabriz_calendar_notes_v2",
    {}
  );
  const [budgetState, setBudgetState] = usePersistentState<BudgetState>("tabriz_budget_v1", {
    monthlyLimit: 0,
    expenses: []
  });

  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    return safeStorageGet<StudentProfile | null>("tabriz_profile_v2", null);
  });

  const { isAppReady, hasProfile, setHasProfile } = useAppReady();
  const [isDarkMode, setIsDarkMode] = useAppTheme();

  const [showProfileEditor, setShowProfileEditor] = useState<boolean>(false);
  const [selectedClassProfile, setSelectedClassProfile] = useState<ClassItem | null>(null);
  const [selectedExamProfile, setSelectedExamProfile] = useState<ExamItem | null>(null);
  const [selectedProjectProfile, setSelectedProjectProfile] = useState<ProjectItem | null>(null);
  const [pendingAddExamCourse, setPendingAddExamCourse] = useState<string | null>(null);
  const [pendingAddProjectCourse, setPendingAddProjectCourse] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [focusExam, setFocusExam] = useState<ExamItem | null>(null);
  const [isFocusMinimized, setIsFocusMinimized] = useState(false);
  const [assistantSubTab, setAssistantSubTab] = useState<
    "chat" | "gpa" | "calendar" | "food" | undefined
  >(undefined);
  const [mapFocusBuildingId, setMapFocusBuildingId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      safeStorageSet("tabriz_profile_v2", profile);
    }
  }, [profile]);

  useNativeIntegration({
    activeTab,
    setActiveTab,
    showProfileEditor,
    setShowProfileEditor,
    selectedClassProfile,
    setSelectedClassProfile,
    selectedExamProfile,
    setSelectedExamProfile,
    selectedProjectProfile,
    setSelectedProjectProfile,
    showBudgetModal,
    setShowBudgetModal,
    focusExam,
    isFocusMinimized,
    setIsFocusMinimized,
    setAssistantSubTab,
    classes,
    exams,
    projects
  });

  const currentScrollElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = currentScrollElRef.current;
    if (el && activeTab !== "assistant" && activeTab !== "map") {
      el.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    setSelectedClassProfile(null);
    setSelectedExamProfile(null);
    setSelectedProjectProfile(null);
    if (activeTab !== "assistant") {
      setAssistantSubTab(undefined);
    }
  }, [activeTab]);

  const handleTabClick = (tabId: TabType) => {
    if (activeTab === tabId) {
      currentScrollElRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setActiveTab(tabId);
    }
  };

  const handleSaveProfile = (p: StudentProfile) => {
    setProfile(p);
    safeStorageSet("tabriz_profile_v2", p);
    setHasProfile(true);
    setShowProfileEditor(false);
  };

  const handleAddStudyMinutes = (examId: string, minutes: number) => {
    setExams((prev) =>
      prev.map((ex) => {
        if (ex.id === examId) {
          return {
            ...ex,
            totalStudyMinutes: (ex.totalStudyMinutes || 0) + minutes
          };
        }
        return ex;
      })
    );
  };

  return (
    <div
      style={{
        isolation: "isolate",
        zIndex: 0,
        transform: "translateZ(0)",
      }}
      className="w-full h-full bg-slate-50 dark:bg-slate-900 flex flex-col font-sans overflow-hidden"
      dir="rtl"
    >
      {!hasProfile ? (
        <OnboardingModal onSave={handleSaveProfile} />
      ) : (
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            activeTab === "map"
              ? "p-0 max-w-none"
              : activeTab === "assistant"
              ? "pt-[calc(0.25rem+env(safe-area-inset-top,0px))] max-w-2xl lg:max-w-4xl"
              : "pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(1rem+env(safe-area-inset-top,0px))] max-w-2xl lg:max-w-4xl"
          } w-full mx-auto relative h-full`}
        >
          <main className="flex-1 flex flex-col min-h-0 relative w-full h-full overflow-hidden">
            <div
              className={`flex-1 flex flex-col min-h-0 w-full ${
                activeTab === "assistant" || activeTab === "map"
                  ? "overflow-hidden h-full"
                  : "overflow-y-auto overscroll-contain"
              }`}
              ref={(el) => {
                currentScrollElRef.current = el;
              }}
            >
              <motion.div
                key={activeTab}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex-1 flex flex-col min-h-0 w-full h-full"
              >
                <React.Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                  }
                >
                  <TabContent
                    activeTab={activeTab}
                    classes={classes}
                    exams={exams}
                    projects={projects}
                    profile={profile}
                    calendarNotes={calendarNotes}
                    isDarkMode={isDarkMode}
                    budgetState={budgetState}
                    assistantSubTab={assistantSubTab}
                    mapFocusBuildingId={mapFocusBuildingId}
                    pendingAddExamCourse={pendingAddExamCourse}
                    pendingAddProjectCourse={pendingAddProjectCourse}
                    setActiveTab={setActiveTab}
                    setShowProfileEditor={setShowProfileEditor}
                    setShowBudgetModal={setShowBudgetModal}
                    setIsDarkMode={setIsDarkMode}
                    setProfile={setProfile}
                    setClasses={setClasses}
                    setExams={setExams}
                    setProjects={setProjects}
                    setCalendarNotes={setCalendarNotes}
                    setSelectedClassProfile={setSelectedClassProfile}
                    setSelectedExamProfile={setSelectedExamProfile}
                    setSelectedProjectProfile={setSelectedProjectProfile}
                    setPendingAddExamCourse={setPendingAddExamCourse}
                    setPendingAddProjectCourse={setPendingAddProjectCourse}
                    setMapFocusBuildingId={setMapFocusBuildingId}
                    onAddStudyMinutes={handleAddStudyMinutes}
                  />
                </React.Suspense>
              </motion.div>
            </div>
          </main>

          <BottomTabBar activeTab={activeTab} onTabClick={handleTabClick} />
        </div>
      )}

      <GlobalModals
        showProfileEditor={showProfileEditor}
        setShowProfileEditor={setShowProfileEditor}
        profile={profile}
        handleSaveProfile={handleSaveProfile}
        selectedClassProfile={selectedClassProfile}
        setSelectedClassProfile={setSelectedClassProfile}
        selectedExamProfile={selectedExamProfile}
        setSelectedExamProfile={setSelectedExamProfile}
        selectedProjectProfile={selectedProjectProfile}
        setSelectedProjectProfile={setSelectedProjectProfile}
        setClasses={setClasses}
        exams={exams}
        setExams={setExams}
        projects={projects}
        setProjects={setProjects}
        setPendingAddExamCourse={setPendingAddExamCourse}
        setPendingAddProjectCourse={setPendingAddProjectCourse}
        setActiveTab={setActiveTab}
        setMapFocusBuildingId={setMapFocusBuildingId}
        showBudgetModal={showBudgetModal}
        setShowBudgetModal={setShowBudgetModal}
        budgetState={budgetState}
        setBudgetState={setBudgetState}
        focusExam={focusExam}
        setFocusExam={setFocusExam}
        isFocusMinimized={isFocusMinimized}
        setIsFocusMinimized={setIsFocusMinimized}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
