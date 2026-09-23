/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 */

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  label, 
  className,
  dir = "rtl" 
}: { 
  value: string; 
  options: string[]; 
  onChange: (val: string) => void; 
  label?: string; 
  className?: string;
  dir?: "rtl" | "ltr";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`space-y-1.5 relative ${className || ""}`} dir={dir}>
      {label && (
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 mr-2 block text-right">
          {label}
        </label>
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[52px] px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white flex items-center justify-between cursor-pointer transition-colors box-border"
      >
        <span className="truncate text-right w-full font-bold" dir={dir}>
          {value || "انتخاب کنید"}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform shrink-0 mr-2 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl dark:shadow-none z-[120] overflow-hidden"
              dir={dir}
            >
              <div className="max-h-56 overflow-y-auto overflow-x-hidden scrollbar-none divide-y divide-slate-50 dark:divide-slate-700/30">
                {options.map(opt => (
                  <div 
                    key={opt}
                    onClick={() => { onChange(opt); setIsOpen(false); }}
                    className={`p-3 text-xs font-bold text-right cursor-pointer transition-colors ${value === opt ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    dir={dir}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
