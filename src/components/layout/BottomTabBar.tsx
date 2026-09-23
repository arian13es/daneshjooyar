import React from "react";
import { motion } from "motion/react";
import { TabType } from "../../types";
import {
  HomeIcon as HomeOutline,
  CalendarIcon as CalendarOutline,
  ClockIcon as ClockOutline,
  DocumentTextIcon as DocumentOutline,
  ChatBubbleBottomCenterTextIcon as ChatOutline
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  CalendarIcon as CalendarSolid,
  ClockIcon as ClockSolid,
  DocumentTextIcon as DocumentSolid,
  ChatBubbleBottomCenterTextIcon as ChatSolid
} from "@heroicons/react/24/solid";

interface BottomTabBarProps {
  activeTab: TabType;
  onTabClick: (tab: TabType) => void;
}

const TAB_ITEMS: {
  id: TabType;
  iconOutline: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}[] = [
  { id: "dashboard", iconOutline: HomeOutline, iconSolid: HomeSolid, label: "خانه" },
  { id: "schedule", iconOutline: CalendarOutline, iconSolid: CalendarSolid, label: "برنامه" },
  { id: "exams", iconOutline: ClockOutline, iconSolid: ClockSolid, label: "امتحان" },
  { id: "projects", iconOutline: DocumentOutline, iconSolid: DocumentSolid, label: "پروژه" },
  { id: "assistant", iconOutline: ChatOutline, iconSolid: ChatSolid, label: "دستیار" }
];

export default function BottomTabBar({ activeTab, onTabClick }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 md:bottom-4 left-0 right-0 z-[80] flex justify-center pointer-events-none px-0 md:px-4">
      <nav className="pointer-events-auto w-full md:max-w-lg min-h-[5rem] sm:min-h-[5.5rem] pb-[env(safe-area-inset-bottom)] md:pb-0 bg-white dark:bg-slate-900 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] md:shadow-2xl border-t md:border border-slate-100 dark:border-slate-800 md:rounded-[2rem] flex items-center justify-around px-1.5 sm:px-6">
        {TAB_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabClick(item.id)}
              className="relative outline-none focus:outline-none [-webkit-tap-highlight-color:transparent] flex flex-col items-center justify-center gap-1 px-2 py-1.5 min-w-0 flex-1 cursor-pointer"
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative h-8 w-12 sm:w-16 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-indigo-100 dark:bg-indigo-900/70"
                  />
                )}
                <div
                  className={`relative z-10 flex items-center justify-center ${
                    isActive
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isActive ? (
                    <item.iconSolid className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <item.iconOutline className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                  )}
                </div>
              </div>
              <span
                className={`relative z-10 text-[10px] sm:text-[11px] font-bold tracking-tight transition-colors duration-200 ${
                  isActive
                    ? "text-indigo-800 dark:text-indigo-200"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
