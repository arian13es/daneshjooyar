import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClockIcon as ClockOutline } from "@heroicons/react/24/outline";
import {
  ClassItem,
  ExamItem,
  ProjectItem,
  StudentProfile,
  BudgetState
} from "../../types";
import ProfileModal from "../ProfileModal";
import ClassProfileModal from "../ClassProfileModal";
import ExamProfileModal from "../ExamProfileModal";
import ProjectProfileModal from "../ProjectProfileModal";
import BudgetModal from "../BudgetModal";
import ExamFocusMode from "../ExamFocusMode";

export interface GlobalModalsProps {
  showProfileEditor: boolean;
  setShowProfileEditor: (v: boolean) => void;
  profile: StudentProfile | null;
  handleSaveProfile: (p: StudentProfile) => void;

  selectedClassProfile: ClassItem | null;
  setSelectedClassProfile: (c: ClassItem | null) => void;
  selectedExamProfile: ExamItem | null;
  setSelectedExamProfile: (e: ExamItem | null) => void;
  selectedProjectProfile: ProjectItem | null;
  setSelectedProjectProfile: (p: ProjectItem | null) => void;

  setClasses: React.Dispatch<React.SetStateAction<ClassItem[]>>;
  exams: ExamItem[];
  setExams: React.Dispatch<React.SetStateAction<ExamItem[]>>;
  projects: ProjectItem[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectItem[]>>;

  setPendingAddExamCourse: (v: string | null) => void;
  setPendingAddProjectCourse: (v: string | null) => void;
  setActiveTab: (tab: "exams" | "projects" | "map") => void;
  setMapFocusBuildingId: (v: string | null) => void;

  showBudgetModal: boolean;
  setShowBudgetModal: (v: boolean) => void;
  budgetState: BudgetState;
  setBudgetState: React.Dispatch<React.SetStateAction<BudgetState>>;

  focusExam: ExamItem | null;
  setFocusExam: (e: ExamItem | null) => void;
  isFocusMinimized: boolean;
  setIsFocusMinimized: (v: boolean) => void;
}

export default function GlobalModals(props: GlobalModalsProps) {
  const {
    showProfileEditor,
    setShowProfileEditor,
    profile,
    handleSaveProfile,
    selectedClassProfile,
    setSelectedClassProfile,
    selectedExamProfile,
    setSelectedExamProfile,
    selectedProjectProfile,
    setSelectedProjectProfile,
    setClasses,
    exams,
    setExams,
    projects,
    setProjects,
    setPendingAddExamCourse,
    setPendingAddProjectCourse,
    setActiveTab,
    setMapFocusBuildingId,
    showBudgetModal,
    setShowBudgetModal,
    budgetState,
    setBudgetState,
    focusExam,
    setFocusExam,
    isFocusMinimized,
    setIsFocusMinimized
  } = props;

  return (
    <>
      {focusExam && isFocusMinimized && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          onClick={() => setIsFocusMinimized(false)}
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:bottom-28 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-indigo-600 text-white p-4 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 flex items-center justify-between z-[70] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ClockOutline className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-black">تمرکز در جریانه...</p>
              <p className="text-[10px] text-indigo-200 mt-0.5">{focusExam.courseName}</p>
            </div>
          </div>
          <div className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-xs font-black">
            باز کردن
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showProfileEditor && (
          <ProfileModal
            profile={profile}
            onSave={handleSaveProfile}
            onClose={() => setShowProfileEditor(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectedClassProfile && (
          <ClassProfileModal
            key={`class-profile-${selectedClassProfile.id}`}
            classItem={selectedClassProfile}
            onClose={() => setSelectedClassProfile(null)}
            onUpdateClass={(updated) => {
              setClasses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              setSelectedClassProfile(updated);
            }}
            relatedExams={exams.filter((e) => e.courseName === selectedClassProfile.courseName)}
            relatedProjects={projects.filter(
              (p) => p.courseName === selectedClassProfile.courseName
            )}
            onAddExam={(courseName) => {
              setPendingAddExamCourse(courseName);
              setActiveTab("exams");
              setSelectedClassProfile(null);
            }}
            onAddProject={(courseName) => {
              setPendingAddProjectCourse(courseName);
              setActiveTab("projects");
              setSelectedClassProfile(null);
            }}
            onOpenExamProfile={(e) => {
              setSelectedClassProfile(null);
              setSelectedExamProfile(e);
            }}
            onOpenProjectProfile={(p) => {
              setSelectedClassProfile(null);
              setSelectedProjectProfile(p);
            }}
            onFocusBuildingOnMap={(bldgId) => {
              setSelectedClassProfile(null);
              if (bldgId) setMapFocusBuildingId(bldgId);
              setActiveTab("map");
            }}
          />
        )}
        {selectedExamProfile && (
          <ExamProfileModal
            key={`exam-profile-${selectedExamProfile.id}`}
            exam={selectedExamProfile}
            onClose={() => setSelectedExamProfile(null)}
            onUpdateExam={(updated) => {
              setExams((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
              setSelectedExamProfile(updated);
            }}
            onStartFocus={() => {
              setFocusExam(selectedExamProfile);
              setIsFocusMinimized(false);
            }}
          />
        )}
        {selectedProjectProfile && (
          <ProjectProfileModal
            key={`project-profile-${selectedProjectProfile.id}`}
            project={selectedProjectProfile}
            onClose={() => setSelectedProjectProfile(null)}
            onUpdateProject={(updated) => {
              setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              setSelectedProjectProfile(updated);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBudgetModal && (
          <BudgetModal
            budgetState={budgetState}
            onUpdateBudget={setBudgetState}
            onClose={() => setShowBudgetModal(false)}
          />
        )}
      </AnimatePresence>

      <ExamFocusMode
        exam={focusExam}
        isMinimized={isFocusMinimized}
        onMinimize={() => setIsFocusMinimized(true)}
        onClose={() => {
          setFocusExam(null);
          setIsFocusMinimized(false);
        }}
        onComplete={(examId, minutes) => {
          setExams((prev) =>
            prev.map((e) =>
              e.id === examId
                ? { ...e, totalStudyMinutes: (e.totalStudyMinutes || 0) + minutes }
                : e
            )
          );
          if (selectedExamProfile?.id === examId) {
            setSelectedExamProfile({
              ...selectedExamProfile,
              totalStudyMinutes: (selectedExamProfile.totalStudyMinutes || 0) + minutes
            });
          }
        }}
      />
    </>
  );
}
