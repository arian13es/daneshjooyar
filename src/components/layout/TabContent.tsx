import React from "react";
import {
  ClassItem,
  ExamItem,
  ProjectItem,
  StudentProfile,
  TabType,
  BudgetState
} from "../../types";

const ScheduleGrid = React.lazy(() => import("../ScheduleGrid"));
const ExamList = React.lazy(() => import("../ExamList"));
const ProjectBoard = React.lazy(() => import("../ProjectBoard"));
const ECEAssistant = React.lazy(() => import("../ECEAssistant"));
const CampusMap = React.lazy(() => import("../CampusMap"));
const Dashboard = React.lazy(() => import("../Dashboard"));

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

  if (activeTab === "dashboard") {
    return (
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
    );
  }

  if (activeTab === "schedule") {
    return (
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
    );
  }

  if (activeTab === "map") {
    return (
      <CampusMap
        profile={profile}
        classes={classes}
        initialFocusBuildingId={mapFocusBuildingId}
        onClearInitialFocus={() => setMapFocusBuildingId(null)}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab("dashboard")}
      />
    );
  }

  if (activeTab === "exams") {
    return (
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
    );
  }

  if (activeTab === "projects") {
    return (
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
    );
  }

  if (activeTab === "assistant") {
    return (
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
    );
  }

  return null;
}
