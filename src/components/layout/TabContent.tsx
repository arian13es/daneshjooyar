import React from "react";
import {
  ClassItem,
  ExamItem,
  ProjectItem,
  StudentProfile,
  TabType,
  BudgetState
} from "../../types";

import Dashboard from "../Dashboard";
import ScheduleGrid from "../ScheduleGrid";
import ExamList from "../ExamList";
import ProjectBoard from "../ProjectBoard";
import ECEAssistant from "../ECEAssistant";

// CampusMap remains lazy-loaded because it includes Leaflet and 10k GIS coordinates
const CampusMap = React.lazy(() => import("../CampusMap"));

export interface TabContentProps {
  activeTab: TabType;
  classes: ClassItem[];
  exams: ExamItem[];
  projects: ProjectItem[];
  profile: StudentProfile | null;
  calendarNotes: Record<string, string[]>;
  isDarkMode: boolean;
  budgetState: BudgetState;
  assistantSubTab: "chat" | "gpa" | "calendar" | "food" | undefined;
  mapFocusBuildingId: string | null;
  pendingAddExamCourse: string | null;
  pendingAddProjectCourse: string | null;
  setActiveTab: (tab: TabType) => void;
  setShowProfileEditor: (v: boolean) => void;
  setShowBudgetModal: (v: boolean) => void;
  setIsDarkMode: (v: boolean) => void;
  setProfile: (p: StudentProfile) => void;
  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  setExams: React.Dispatch<React.SetStateAction<ExamItem[]>>;
  setProjects: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
  setCalendarNotes: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setSelectedClassProfile: (c: ClassItem | null) => void;
  setSelectedExamProfile: (e: ExamItem | null) => void;
  setSelectedProjectProfile: (p: ProjectItem | null) => void;
  setPendingAddExamCourse: (v: string | null) => void;
  setPendingAddProjectCourse: (v: string | null) => void;
  setMapFocusBuildingId: (v: string | null) => void;
  onAddStudyMinutes: (examId: string, minutes: number) => void;
}

export default function TabContent(props: TabContentProps) {
  const {
    activeTab,
    classes,
    exams,
    projects,
    profile,
    calendarNotes,
    isDarkMode,
    budgetState,
    assistantSubTab,
    mapFocusBuildingId,
    pendingAddExamCourse,
    pendingAddProjectCourse,
    setActiveTab,
    setShowProfileEditor,
    setShowBudgetModal,
    setIsDarkMode,
    setProfile,
    setClasses,
    setExams,
    setProjects,
    setCalendarNotes,
    setSelectedClassProfile,
    setSelectedExamProfile,
    setSelectedProjectProfile,
    setPendingAddExamCourse,
    setPendingAddProjectCourse,
    setMapFocusBuildingId,
    onAddStudyMinutes
  } = props;

  const focusBuilding = (bldgId?: string) => {
    setMapFocusBuildingId(bldgId ?? null);
    setActiveTab("map");
  };

  return (
    <div className="h-full w-full flex-1 flex flex-col min-h-0 relative">
      {/* 1. Dashboard Tab — Always mounted for instant 0ms home switching */}
      <div
        className={activeTab === "dashboard" ? "h-full w-full flex-1 flex flex-col min-h-0" : "hidden"}
        aria-hidden={activeTab !== "dashboard"}
      >
        <Dashboard
          classes={classes}
          exams={exams}
          projects={projects}
          profile={profile}
          onNavigate={setActiveTab}
          onEditProfile={() => setShowProfileEditor(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onUpdateProfile={setProfile}
          budgetState={budgetState}
          onOpenBudget={() => setShowBudgetModal(true)}
          onAddStudyMinutes={onAddStudyMinutes}
          onFocusBuildingOnMap={focusBuilding}
        />
      </div>

      {/* 2. Schedule Grid Tab — Always mounted */}
      <div
        className={activeTab === "schedule" ? "h-full w-full flex-1 flex flex-col min-h-0" : "hidden"}
        aria-hidden={activeTab !== "schedule"}
      >
        <ScheduleGrid
          classes={classes}
          profile={profile}
          onAddClass={(c) =>
            setClasses((prev) => [...prev, { ...c, id: Date.now().toString() }])
          }
          onEditClass={(id, c) =>
            setClasses((prev) => prev.map((cls) => (cls.id === id ? { ...c, id } : cls)))
          }
          onDeleteClass={(id) => setClasses((prev) => prev.filter((c) => c.id !== id))}
          onClearSchedule={() => setClasses([])}
          onOpenProfile={(cls) => setSelectedClassProfile(cls)}
          onFocusBuildingOnMap={focusBuilding}
        />
      </div>

      {/* 3. Exams Tab — Always mounted */}
      <div
        className={activeTab === "exams" ? "h-full w-full flex-1 flex flex-col min-h-0" : "hidden"}
        aria-hidden={activeTab !== "exams"}
      >
        <ExamList
          exams={exams}
          onAddExam={(e) => setExams((prev) => [...prev, { ...e, id: Date.now().toString() }])}
          onEditExam={(id, e) =>
            setExams((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...e } : ex)))
          }
          onToggleCompleted={(id) =>
            setExams((prev) =>
              prev.map((ex) => (ex.id === id ? { ...ex, completed: !ex.completed } : ex))
            )
          }
          onDeleteExam={(id) => setExams((prev) => prev.filter((ex) => ex.id !== id))}
          onOpenProfile={(e) => setSelectedExamProfile(e)}
          pendingAddCourse={pendingAddExamCourse}
          onClearPendingAdd={() => setPendingAddExamCourse(null)}
        />
      </div>

      {/* 4. Projects Tab — Always mounted */}
      <div
        className={activeTab === "projects" ? "h-full w-full flex-1 flex flex-col min-h-0" : "hidden"}
        aria-hidden={activeTab !== "projects"}
      >
        <ProjectBoard
          projects={projects}
          onAddProject={(p) =>
            setProjects((prev) => [...prev, { ...p, id: Date.now().toString() }])
          }
          onEditProject={(id, p) =>
            setProjects((prev) => prev.map((proj) => (proj.id === id ? { ...proj, ...p } : proj)))
          }
          onUpdateProjectStatus={(id, status) =>
            setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
          }
          onDeleteProject={(id) => setProjects((prev) => prev.filter((p) => p.id !== id))}
          onOpenProfile={(p) => setSelectedProjectProfile(p)}
          pendingAddCourse={pendingAddProjectCourse}
          onClearPendingAdd={() => setPendingAddProjectCourse(null)}
        />
      </div>

      {/* 5. Assistant Tab — Always mounted */}
      <div
        className={activeTab === "assistant" ? "h-full w-full flex-1 flex flex-col min-h-0" : "hidden"}
        aria-hidden={activeTab !== "assistant"}
      >
        <ECEAssistant
          profile={profile}
          initialSubTab={assistantSubTab}
          exams={exams}
          projects={projects}
          calendarNotes={calendarNotes}
          onSaveNote={(k, v) => setCalendarNotes((prev) => ({ ...prev, [k]: v }))}
          onDeleteNote={(k, idx) => {
            setCalendarNotes((prev) => {
              const newN = { ...prev };
              if (idx !== undefined && Array.isArray(newN[k])) {
                newN[k] = [...newN[k]];
                newN[k].splice(idx, 1);
                if (newN[k].length === 0) delete newN[k];
              } else {
                delete newN[k];
              }
              return newN;
            });
          }}
        />
      </div>

      {/* 6. Map Tab — Loaded on demand */}
      {activeTab === "map" && (
        <div className="h-full w-full flex-1 flex flex-col min-h-0">
          <React.Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-8 bg-slate-900">
                <div className="w-7 h-7 border-3 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></div>
              </div>
            }
          >
            <CampusMap
              profile={profile}
              classes={classes}
              initialFocusBuildingId={mapFocusBuildingId}
              onClearInitialFocus={() => setMapFocusBuildingId(null)}
              isDarkMode={isDarkMode}
              onBack={() => setActiveTab("dashboard")}
            />
          </React.Suspense>
        </div>
      )}
    </div>
  );
}
