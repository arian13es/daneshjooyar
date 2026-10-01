import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Plus, Minus, Wallet, Coffee, Home, Utensils, MoreHorizontal, 
  Trash, AlertTriangle, PiggyBank, RefreshCcw, Car, ShoppingBag, 
  Gamepad2, Target, Check, Book, Search, PieChart, Calendar, 
  ArrowDownRight, ArrowUpLeft, TrendingDown, Sparkles 
} from "lucide-react";
import * as jalaali from "jalaali-js";
import { BudgetState, BudgetExpense } from "../types";
import { PERSIAN_MONTHS, toEnglishDigits, toPersianDigits } from "../utils/dateUtils";

const EXPENSE_CATEGORIES = [
  { id: "food", name: "خوراک و سلف", color: "bg-rose-500", text: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/30" },
  { id: "transport", name: "رفت و آمد", color: "bg-blue-500", text: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
  { id: "education", name: "کتاب و آموزش", color: "bg-indigo-500", text: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/30" },
  { id: "entertainment", name: "تفریح و کافه", color: "bg-amber-500", text: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
  { id: "other", name: "سایر هزینه‌ها", color: "bg-slate-500", text: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/30" },
] as const;

const getCategoryColor = (categoryId: string) => {
  return EXPENSE_CATEGORIES.find(c => c.id === categoryId)?.color || "bg-slate-500";
};

const getCategoryName = (categoryId: string) => {
  return EXPENSE_CATEGORIES.find(c => c.id === categoryId)?.name || "سایر";
};

interface BudgetModalProps {
  budgetState: BudgetState;
  onUpdateBudget: (updated: BudgetState) => void;
  onClose: () => void;
}

function parseAmount(displayStr: string): number {
  const normalized = toEnglishDigits(displayStr).replace(/\D/g, "");
  const parsed = parseInt(normalized, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function formatShamsiDate(isoDateString?: string): string {
  if (!isoDateString) return "ثبت شده";
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return "ثبت شده";

    const tehranTime = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
    const nowTehran = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));

    const jDate = jalaali.toJalaali(tehranTime.getFullYear(), tehranTime.getMonth() + 1, tehranTime.getDate());
    const jNow = jalaali.toJalaali(nowTehran.getFullYear(), nowTehran.getMonth() + 1, nowTehran.getDate());

    // Accurately compute yesterday in Tehran time across month and year boundaries
    const yesterdayTehran = new Date(nowTehran.getFullYear(), nowTehran.getMonth(), nowTehran.getDate() - 1);
    const jYesterday = jalaali.toJalaali(yesterdayTehran.getFullYear(), yesterdayTehran.getMonth() + 1, yesterdayTehran.getDate());

    const hours = tehranTime.getHours().toString().padStart(2, "0");
    const minutes = tehranTime.getMinutes().toString().padStart(2, "0");
    const timeStr = toPersianDigits(`${hours}:${minutes}`);

    if (jDate.jy === jNow.jy && jDate.jm === jNow.jm && jDate.jd === jNow.jd) {
      return `امروز، ${timeStr}`;
    }
    if (jDate.jy === jYesterday.jy && jDate.jm === jYesterday.jm && jDate.jd === jYesterday.jd) {
      return `دیروز، ${timeStr}`;
    }
    return `${toPersianDigits(String(jDate.jd))} ${PERSIAN_MONTHS[jDate.jm - 1]}، ${timeStr}`;
  } catch {
    return "ثبت شده";
  }
}

export default function BudgetModal({ budgetState, onUpdateBudget, onClose }: BudgetModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newAmountDisplay, setNewAmountDisplay] = useState("");
  const [newCategory, setNewCategory] = useState<BudgetExpense["category"]>("food");

  // NOTE: the previous StatusBar.setBackgroundColor() calls here were no-ops on
  // this app: targetSdkVersion is 36 and @capacitor/status-bar refuses to set
  // the bar colour on Android 15+. Removing them also avoids a needless
  // icon-contrast flip when the wallet opens and closes.
  
  const [limitInputDisplay, setLimitInputDisplay] = useState(
    budgetState.monthlyLimit ? budgetState.monthlyLimit.toLocaleString() : ""
  );
  const [isEditingLimit, setIsEditingLimit] = useState(!budgetState.monthlyLimit);

  // Keep limit input in sync when budget is reset/changed from parent
  useEffect(() => {
    setLimitInputDisplay(budgetState.monthlyLimit ? budgetState.monthlyLimit.toLocaleString() : "");
    if (!budgetState.monthlyLimit) {
      setIsEditingLimit(true);
    }
  }, [budgetState.monthlyLimit]);

  // Savings State
  const [isAddingSavings, setIsAddingSavings] = useState(false);
  const [savingsInputDisplay, setSavingsInputDisplay] = useState("");
  const [isWithdrawingSavings, setIsWithdrawingSavings] = useState(false);
  const [withdrawInputDisplay, setWithdrawInputDisplay] = useState("");

  // Goal State
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalNameInput, setGoalNameInput] = useState(budgetState.savingsGoalName || "");
  const [goalInputDisplay, setGoalInputDisplay] = useState(
    budgetState.savingsGoal ? budgetState.savingsGoal.toLocaleString() : ""
  );

  useEffect(() => {
    setGoalNameInput(budgetState.savingsGoalName || "");
    setGoalInputDisplay(budgetState.savingsGoal ? budgetState.savingsGoal.toLocaleString() : "");
    if (!budgetState.savingsGoal) {
      setIsEditingGoal(false);
    }
  }, [budgetState.savingsGoal, budgetState.savingsGoalName]);

  // Confirm Modal State
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3500);
  };

  const totalSpent = budgetState.expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentSavings = budgetState.savings || 0;
  const currentGoal = budgetState.savingsGoal || 0;
  
  const remaining = budgetState.monthlyLimit - totalSpent - currentSavings;
  const progress = budgetState.monthlyLimit > 0 ? ((totalSpent + currentSavings) / budgetState.monthlyLimit) * 100 : 0;
  const goalProgress = currentGoal > 0 ? (currentSavings / currentGoal) * 100 : 0;

  // Daily Burn Rate Calculation
  const burnRateInfo = useMemo(() => {
    try {
      const nowTehran = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
      const jNow = jalaali.toJalaali(nowTehran.getFullYear(), nowTehran.getMonth() + 1, nowTehran.getDate());
      const monthLength = jalaali.jalaaliMonthLength(jNow.jy, jNow.jm);
      const daysRemaining = Math.max(1, monthLength - jNow.jd + 1);
      const dailyAllowed = remaining > 0 ? Math.floor(remaining / daysRemaining) : 0;
      return { daysRemaining, dailyAllowed, monthName: PERSIAN_MONTHS[jNow.jm - 1] };
    } catch {
      return { daysRemaining: 30, dailyAllowed: 0, monthName: "" };
    }
  }, [remaining]);

  // Category Analytics
  const categoryAnalytics = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of budgetState.expenses) {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    }
    return Object.entries(map)
      .map(([cat, amount]) => ({
        category: cat as BudgetExpense["category"],
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [budgetState.expenses, totalSpent]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return budgetState.expenses.filter(exp => {
      const matchCat = selectedFilterCategory === "all" || exp.category === selectedFilterCategory;
      const matchSearch = !searchQuery.trim() || exp.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [budgetState.expenses, selectedFilterCategory, searchQuery]);

  const handleAmountChange = (val: string, setter: (val: string) => void) => {
    const num = parseAmount(val);
    if (num === 0 && !toEnglishDigits(val).replace(/\D/g, "")) {
      setter("");
      return;
    }
    setter(num.toLocaleString());
  };

  const handleSaveLimit = () => {
    const val = parseAmount(limitInputDisplay);
    if (val > 0) {
      onUpdateBudget({ ...budgetState, monthlyLimit: val });
      setIsEditingLimit(false);
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAmount(goalInputDisplay);
    if (val > 0 && goalNameInput.trim()) {
      onUpdateBudget({ ...budgetState, savingsGoal: val, savingsGoalName: goalNameInput.trim() });
      setIsEditingGoal(false);
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAmount(newAmountDisplay);
    
    if (!newTitle.trim()) {
      showErrorToast("لطفاً عنوان خرج را وارد کنید!");
      return;
    }
    if (val <= 0) {
      showErrorToast("لطفاً مبلغ معتبری وارد کنید!");
      return;
    }

    const expense: BudgetExpense = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      amount: val,
      category: newCategory,
      date: new Date().toISOString()
    };

    onUpdateBudget({
      ...budgetState,
      expenses: [expense, ...budgetState.expenses]
    });

    setNewTitle("");
    setNewAmountDisplay("");
  };

  const handleAddSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAmount(savingsInputDisplay);
    if (val <= 0) return;

    onUpdateBudget({
      ...budgetState,
      savings: currentSavings + val
    });

    setSavingsInputDisplay("");
    setIsAddingSavings(false);
  };

  const handleWithdrawSavings = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAmount(withdrawInputDisplay);
    if (val <= 0) return;

    if (val > currentSavings) {
      showErrorToast("مبلغ برداشت نمی‌تواند بیشتر از موجودی صندوق پس‌انداز باشد.");
      return;
    }

    onUpdateBudget({
      ...budgetState,
      savings: Math.max(0, currentSavings - val)
    });

    setWithdrawInputDisplay("");
    setIsWithdrawingSavings(false);
  };

  const executeStartNewMonth = () => {
    onUpdateBudget({
      ...budgetState,
      expenses: []
    });
    setShowConfirmReset(false);
  };

  const executeFullReset = () => {
    onUpdateBudget({
      monthlyLimit: 0,
      expenses: [],
      savings: 0,
      savingsGoal: 0,
      savingsGoalName: ""
    });
    setLimitInputDisplay("");
    setIsEditingLimit(true);
    setGoalNameInput("");
    setGoalInputDisplay("");
    setIsEditingGoal(false);
    setSearchQuery("");
    setSelectedFilterCategory("all");
    setShowConfirmReset(false);
  };

  const handleDelete = (id: string) => {
    onUpdateBudget({
      ...budgetState,
      expenses: budgetState.expenses.filter(e => e.id !== id)
    });
  };

  const formatMoney = (n: number) => {
    return n.toLocaleString() + " تومان";
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === "food") return <Utensils className="w-5 h-5 text-orange-500" />;
    if (cat === "dorm") return <Home className="w-5 h-5 text-indigo-500" />;
    if (cat === "cafe") return <Coffee className="w-5 h-5 text-amber-500" />;
    if (cat === "transport") return <Car className="w-5 h-5 text-blue-500" />;
    if (cat === "shopping") return <ShoppingBag className="w-5 h-5 text-pink-500" />;
    if (cat === "entertainment") return <Gamepad2 className="w-5 h-5 text-purple-500" />;
    if (cat === "education") return <Book className="w-5 h-5 text-teal-500" />;
    return <MoreHorizontal className="w-5 h-5 text-slate-500" />;
  };

  const getCategoryColor = (cat: string) => {
    if (cat === "food") return "bg-orange-500";
    if (cat === "dorm") return "bg-indigo-500";
    if (cat === "cafe") return "bg-amber-500";
    if (cat === "transport") return "bg-blue-500";
    if (cat === "shopping") return "bg-pink-500";
    if (cat === "entertainment") return "bg-purple-500";
    if (cat === "education") return "bg-teal-500";
    return "bg-slate-500";
  };

  const getCategoryName = (cat: string) => {
    if (cat === "food") return "سلف و غذا";
    if (cat === "dorm") return "خوابگاه";
    if (cat === "cafe") return "کافه";
    if (cat === "transport") return "رفت و آمد";
    if (cat === "shopping") return "خرید";
    if (cat === "entertainment") return "تفریح";
    if (cat === "education") return "کتاب و جزوه";
    return "متفرقه";
  };

  const renderStatusMessage = () => {
    if (budgetState.monthlyLimit === 0) return null;
    
    if (progress < 30) {
      return (
        <div className="flex items-center gap-2 mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-800/50">
          <span>وضعیت عالیه! فعلاً پادشاهی کن 👑</span>
        </div>
      );
    } else if (progress < 75) {
      return (
        <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-100 dark:border-amber-800/50">
          <span>داری به نیمه میرسی، یه کم حواست به خرج‌هات باشه 🧐</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-800/50">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>خطر! هشدار! به زودی باید فقط نودل بخوری 🍜🚨</span>
        </div>
      );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 p-0 md:p-6 font-sans pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      dir="rtl"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex-1 flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl lg:max-w-3xl md:rounded-[3rem] bg-slate-50 dark:bg-slate-900 shadow-2xl relative overflow-hidden border border-white/20 dark:border-slate-700/50"
      >
        
        {/* Ultra-Premium Glassy Header */}
        <div className="bg-emerald-600 dark:bg-emerald-700 p-6 sm:p-8 pt-8 sm:pt-10 text-white relative shrink-0 shadow-sm overflow-hidden">
          {errorToast && (
            <div className="absolute top-2 left-4 right-4 z-[200] max-w-sm mx-auto bg-rose-500 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-black text-center border border-rose-400/50">
              {errorToast}
            </div>
          )}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/30 shrink-0">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm">کیف پول هوشمند من</h2>
                <p className="text-emerald-100 text-[11px] sm:text-xs font-bold mt-1 opacity-95">مدیریت مخارج، پس‌انداز و کنترل روزانه</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowConfirmReset(true)} 
                title="مدیریت دوره و پاکسازی"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10 shadow-sm active:scale-95"
              >
                <RefreshCcw className="w-5 h-5 text-white" />
              </button>
              <button 
                onClick={onClose} 
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10 shadow-sm active:scale-95"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-32 space-y-4 sm:space-y-5 scrollbar-hide">
          
          {/* Main Budget Card — Premium Design */}
          <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden border border-slate-100/50 dark:border-slate-700/50">
            <div className="relative z-10">
              {isEditingLimit ? (
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400">کل بودجه این ماه چقدره؟ (تومان)</label>
                  <div className="flex gap-2">
                    <input 
                      type="tel"
                      inputMode="numeric"
                      value={limitInputDisplay}
                      onChange={e => handleAmountChange(e.target.value, setLimitInputDisplay)}
                      placeholder="مثلاً ۵,۰۰۰,۰۰۰"
                      className="flex-1 bg-slate-50 dark:bg-slate-900/60 rounded-2xl px-4 py-3.5 font-sans font-bold text-sm outline-none focus:border-emerald-500 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-right shadow-inner"
                      dir="ltr"
                    />
                    <button onClick={handleSaveLimit} className="px-5 sm:px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all shrink-0">ثبت</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 tracking-wider">باقیمانده برای خرج کردن</p>
                      <p className={`text-3xl sm:text-4xl font-black mt-1.5 tracking-tight flex items-baseline gap-1.5 ${remaining < 0 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
                        {remaining.toLocaleString()} <span className="text-sm font-bold text-slate-400">تومان</span>
                      </p>
                    </div>
                    <button onClick={() => setIsEditingLimit(true)} className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 px-3.5 py-2 rounded-xl transition-all active:scale-95 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">تغییر بودجه</button>
                  </div>
                  
                  <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-900/80 rounded-full overflow-hidden mb-3 shadow-inner relative border border-slate-200/50 dark:border-slate-700/50">
                    <div 
                      className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ease-out ${progress > 90 ? "bg-gradient-to-r from-rose-400 to-rose-500" : progress > 75 ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    <span>خرج و پس‌انداز: {formatMoney(totalSpent + currentSavings)}</span>
                    <span>کل بودجه: {formatMoney(budgetState.monthlyLimit)}</span>
                  </div>

                  {/* Smart Daily Burn Rate Badge */}
                  {budgetState.monthlyLimit > 0 && remaining > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100/80 dark:border-slate-700/50 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                        </div>
                        سقف مجاز روزانه:
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                        {burnRateInfo.dailyAllowed.toLocaleString()} <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">تومان/روز</span>
                        <span className="text-[9px] text-slate-400 font-normal mr-1.5">({burnRateInfo.daysRemaining} روز مانده)</span>
                      </span>
                    </div>
                  )}

                  {renderStatusMessage()}
                </div>
              )}
            </div>
          </div>

          {/* Savings Section (Premium Golden Card) */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-[1.75rem] sm:rounded-[2rem] p-5 sm:p-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex items-start justify-between relative z-10 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg">صندوق پس‌انداز</h3>
                  <p className="text-amber-50 text-[10px] sm:text-[11px] font-bold mt-0.5 truncate">
                    {budgetState.savingsGoalName ? `هدف: ${budgetState.savingsGoalName}` : "برای روز مبادا"}
                  </p>
                </div>
              </div>
              <div className="text-left flex flex-col items-end shrink-0 pl-1">
                <p className="text-xl sm:text-2xl font-black tracking-tight">{currentSavings.toLocaleString()}</p>
                <p className="text-[9px] sm:text-[10px] text-amber-100 font-bold mt-0.5">تومان موجودی</p>
              </div>
            </div>

            {/* Savings Goal Progress UI */}
            {currentGoal > 0 && !isEditingGoal && (
              <div className="relative z-10 mb-4 bg-white/10 p-3 sm:p-3.5 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between text-xs font-black text-white mb-2">
                  <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> پیشرفت هدف</span>
                  <span className="text-amber-100">{Math.min(Math.round(goalProgress), 100)}%</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden shadow-inner mb-2">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.8)] relative"
                    style={{ width: `${Math.min(goalProgress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-100">
                  <span>{formatMoney(currentSavings)}</span>
                  <span>{formatMoney(currentGoal)}</span>
                </div>
              </div>
            )}

            {!isEditingGoal && (
               <button onClick={() => setIsEditingGoal(true)} className="relative z-10 text-[10px] text-amber-100 font-bold mb-3.5 bg-white/10 px-3 py-1.5 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-1.5 w-max">
                  <Target className="w-3.5 h-3.5" />
                  {currentGoal > 0 ? "ویرایش هدف پس‌انداز" : "تعیین یک هدف جدید"}
               </button>
            )}

            {isEditingGoal ? (
              <form onSubmit={handleSaveGoal} className="mt-3 flex flex-col gap-2.5 relative z-10 mb-2 bg-black/10 p-3.5 rounded-2xl border border-white/10">
                <p className="text-xs font-black">تنظیم هدف پس‌انداز</p>
                <input 
                  autoFocus
                  required
                  type="text"
                  value={goalNameInput}
                  onChange={e => setGoalNameInput(e.target.value)}
                  placeholder="اسم هدف (مثلاً لپ‌تاپ)"
                  className="w-full bg-white/20 placeholder-white/60 rounded-xl px-3.5 py-2.5 font-sans font-bold text-xs text-white outline-none border border-white/20 focus:border-white/50"
                />
                <input 
                  required
                  type="tel"
                  inputMode="numeric"
                  value={goalInputDisplay}
                  onChange={e => handleAmountChange(e.target.value, setGoalInputDisplay)}
                  placeholder="مبلغ هدف (تومان)"
                  className="w-full bg-white/20 placeholder-white/60 rounded-xl px-3.5 py-2.5 font-sans font-bold text-xs text-white outline-none border border-white/20 focus:border-white/50 text-right"
                  dir="ltr"
                />
                <div className="flex gap-2 mt-1">
                  <button type="submit" className="flex-1 bg-white text-orange-500 rounded-xl py-2.5 font-black text-xs hover:bg-amber-50 transition-colors shadow-sm">ذخیره</button>
                  <button type="button" onClick={() => setIsEditingGoal(false)} className="flex-1 bg-white/10 border border-white/20 text-white rounded-xl py-2.5 font-black hover:bg-white/20 transition-colors text-xs">لغو</button>
                </div>
              </form>
            ) : isAddingSavings ? (
              <form onSubmit={handleAddSavings} className="mt-3 flex gap-2 relative z-10">
                <input 
                  autoFocus
                  type="tel"
                  inputMode="numeric"
                  value={savingsInputDisplay}
                  onChange={e => handleAmountChange(e.target.value, setSavingsInputDisplay)}
                  placeholder="مبلغ واریز به پس‌انداز"
                  className="flex-1 min-w-0 bg-white/20 placeholder-white/60 rounded-xl px-3.5 py-2.5 font-sans font-bold text-xs text-white outline-none border border-white/20 focus:border-white/50 text-right"
                  dir="ltr"
                />
                <button type="submit" className="px-4 shrink-0 bg-white text-orange-500 rounded-xl font-black text-xs hover:bg-amber-50 transition-colors shadow-sm">واریز</button>
                <button type="button" onClick={() => setIsAddingSavings(false)} className="px-3 shrink-0 bg-black/10 text-white rounded-xl font-black hover:bg-black/20 transition-colors text-xs">لغو</button>
              </form>
            ) : isWithdrawingSavings ? (
              <form onSubmit={handleWithdrawSavings} className="mt-3 flex gap-2 relative z-10">
                <input 
                  autoFocus
                  type="tel"
                  inputMode="numeric"
                  value={withdrawInputDisplay}
                  onChange={e => handleAmountChange(e.target.value, setWithdrawInputDisplay)}
                  placeholder="مبلغ برداشت از پس‌انداز"
                  className="flex-1 min-w-0 bg-white/20 placeholder-white/60 rounded-xl px-3.5 py-2.5 font-sans font-bold text-xs text-white outline-none border border-white/20 focus:border-white/50 text-right"
                  dir="ltr"
                />
                <button type="submit" className="px-4 shrink-0 bg-white text-orange-500 rounded-xl font-black text-xs hover:bg-amber-50 transition-colors shadow-sm">برداشت</button>
                <button type="button" onClick={() => setIsWithdrawingSavings(false)} className="px-3 shrink-0 bg-black/10 text-white rounded-xl font-black hover:bg-black/20 transition-colors text-xs">لغو</button>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-2 relative z-10">
                <button 
                  onClick={() => { setIsAddingSavings(true); setIsWithdrawingSavings(false); }}
                  className="py-3 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/20 text-xs font-black"
                >
                  <Plus className="w-3.5 h-3.5" /> واریز به صندوق
                </button>
                <button 
                  onClick={() => { setIsWithdrawingSavings(true); setIsAddingSavings(false); }}
                  disabled={currentSavings <= 0}
                  className="py-3 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/20 text-xs font-black"
                >
                  <Minus className="w-3.5 h-3.5" /> برداشت از صندوق
                </button>
              </div>
            )}
          </div>

          {/* Category Spending Analytics (if any expenses exist) */}
          {totalSpent > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-[1.75rem] sm:rounded-[2rem] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-500" /> تحلیل مخارج ماه جاری
                </h4>
                <span className="text-[10px] font-bold text-slate-400">مجموع: {formatMoney(totalSpent)}</span>
              </div>

              {/* Multi-segmented Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex mb-3.5 shadow-inner">
                {categoryAnalytics.map(c => (
                  <div 
                    key={c.category}
                    className={`h-full ${getCategoryColor(c.category)} transition-all`}
                    style={{ width: `${c.percentage}%` }}
                    title={`${getCategoryName(c.category)}: ${c.percentage}%`}
                  />
                ))}
              </div>

              {/* Category Pills with percentages */}
              <div className="flex flex-wrap gap-2">
                {categoryAnalytics.map(c => (
                  <div 
                    key={c.category}
                    onClick={() => setSelectedFilterCategory(selectedFilterCategory === c.category ? "all" : c.category)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition-colors ${selectedFilterCategory === c.category ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(c.category)}`} />
                    <span>{getCategoryName(c.category)}</span>
                    <span className="font-mono text-slate-400 mr-0.5">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Expense Form (Floating Premium Card) */}
          <form onSubmit={handleAddExpense} className="relative bg-white dark:bg-slate-800 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden border border-slate-100/50 dark:border-slate-700/50 space-y-5">
            <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              ثبت خرج جدید
            </h3>
            
            <div className="flex flex-col gap-4">
              <input 
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="بابت چی پول دادی؟ (مثلاً ناهار سلف، اسنپ...)"
                className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-inner transition-colors"
              />
              <div className="flex gap-3">
                <input 
                  required
                  type="tel"
                  inputMode="numeric"
                  value={newAmountDisplay}
                  onChange={e => handleAmountChange(e.target.value, setNewAmountDisplay)}
                  placeholder="مبلغ (تومان)"
                  className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-500 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-inner transition-colors text-right"
                  dir="ltr"
                />
                <button type="submit" className="px-6 sm:px-8 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0">ثبت</button>
              </div>
              
              <div className="mt-2">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 mb-3 block">دسته‌بندی</label>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id)}
                      className={`snap-start shrink-0 h-10 px-4 rounded-xl text-xs font-black transition-all border ${newCategory === cat.id ? `${cat.bg} ${cat.text} border-${cat.color.split('-')[1]}-500 shadow-sm` : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Expenses List & Filter Section */}
          <div>
            <div className="flex items-center justify-between mb-3 pr-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                تاریخچه خرج‌ها
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                  {filteredExpenses.length} مورد
                </span>
              </h3>
            </div>

            {/* Search & Filter Bar */}
            <div className="space-y-2.5 mb-3.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="جستجو در نام هزینه‌ها..."
                  className="w-full pr-9 pl-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-400 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setSelectedFilterCategory("all")}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-colors ${selectedFilterCategory === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"}`}
                >
                  همه ({budgetState.expenses.length})
                </button>
                {(['food', 'dorm', 'transport', 'cafe', 'shopping', 'entertainment', 'education', 'other'] as const).map(cat => {
                  const count = budgetState.expenses.filter(e => e.category === cat).length;
                  if (count === 0 && selectedFilterCategory !== cat) return null;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFilterCategory(selectedFilterCategory === cat ? "all" : cat)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-colors flex items-center gap-1 ${selectedFilterCategory === cat ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"}`}
                    >
                      {getCategoryName(cat)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Content */}
            {filteredExpenses.length === 0 ? (
              <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-[1.75rem] sm:rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                  {searchQuery || selectedFilterCategory !== "all" ? "هیچ هزینه‌ای با این مشخصات یافت نشد." : "هنوز پولی خرج نکردی!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredExpenses.map(exp => (
                  <div key={exp.id} className="bg-white dark:bg-slate-800 p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        {getCategoryIcon(exp.category)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate">{exp.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{getCategoryName(exp.category)}</span>
                          <span className="text-slate-300 dark:text-slate-600 text-xs">•</span>
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                            {formatShamsiDate(exp.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 pl-1">
                      <p className="text-xs sm:text-sm font-black font-sans text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {exp.amount.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">تومان</span>
                      </p>
                      <button 
                        onClick={() => handleDelete(exp.id)} 
                        title="حذف هزینه"
                        className="p-1.5 sm:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </motion.div>

      {/* Smart Confirm Modal for Reset / Month Renewal */}
      <AnimatePresence>
        {showConfirmReset && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-0 z-[200] bg-slate-900/60 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <RefreshCcw className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-center text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1.5">مدیریت دوره کیف پول</h3>
              <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                برای شروع دوره مالی جدید یا صفر کردن داده‌ها یکی از گزینه‌های زیر را انتخاب کنید:
              </p>
              
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={executeStartNewMonth}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl py-3 font-black text-xs transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" />
                  شروع ماه جدید (با حفظ موجودی صندوق)
                </button>

                <button 
                  onClick={executeFullReset}
                  className="w-full bg-rose-50 hover:bg-rose-100 active:scale-98 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl py-3 font-black text-xs transition-all"
                >
                  ریست کامل (صفر کردن بودجه، مخارج و پس‌انداز)
                </button>

                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl py-2.5 font-black text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors mt-1"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
