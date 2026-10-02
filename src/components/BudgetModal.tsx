import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plus, Minus, Wallet, Coffee, Utensils, MoreHorizontal,
  Trash2, PiggyBank, RotateCcw, Car, BookOpen, AlertCircle
} from "lucide-react";
import * as jalaali from "jalaali-js";
import { BudgetState, BudgetExpense } from "../types";
import { PERSIAN_MONTHS, toEnglishDigits, toPersianDigits } from "../utils/dateUtils";

const EXPENSE_CATEGORIES = [
  { id: "food", name: "خوراک و سلف", icon: Utensils, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50" },
  { id: "transport", name: "رفت و آمد", icon: Car, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50" },
  { id: "education", name: "کتاب و آموزش", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50" },
  { id: "entertainment", name: "تفریح و کافه", icon: Coffee, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50" },
  { id: "other", name: "سایر هزینه‌ها", icon: MoreHorizontal, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50" },
] as const;

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

    const hours = tehranTime.getHours().toString().padStart(2, "0");
    const minutes = tehranTime.getMinutes().toString().padStart(2, "0");
    const timeStr = toPersianDigits(`${hours}:${minutes}`);

    if (jDate.jy === jNow.jy && jDate.jm === jNow.jm && jDate.jd === jNow.jd) {
      return `امروز، ${timeStr}`;
    }
    return `${toPersianDigits(String(jDate.jd))} ${PERSIAN_MONTHS[jDate.jm - 1]}، ${timeStr}`;
  } catch {
    return "ثبت شده";
  }
}

export default function BudgetModal({ budgetState, onUpdateBudget, onClose }: BudgetModalProps) {
  // New Expense Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAmountDisplay, setNewAmountDisplay] = useState("");
  const [newCategory, setNewCategory] = useState<BudgetExpense["category"]>("food");

  // Monthly Limit State
  const [limitInputDisplay, setLimitInputDisplay] = useState(
    budgetState.monthlyLimit ? budgetState.monthlyLimit.toLocaleString() : ""
  );
  const [isEditingLimit, setIsEditingLimit] = useState(!budgetState.monthlyLimit);

  useEffect(() => {
    setLimitInputDisplay(budgetState.monthlyLimit ? budgetState.monthlyLimit.toLocaleString() : "");
    if (!budgetState.monthlyLimit) {
      setIsEditingLimit(true);
    }
  }, [budgetState.monthlyLimit]);

  // Savings Box Actions State
  const [savingsMode, setSavingsMode] = useState<"none" | "deposit" | "withdraw">("none");
  const [savingsInputDisplay, setSavingsInputDisplay] = useState("");

  // Reset Confirmation State
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 3500);
  };

  const totalSpent = useMemo(
    () => budgetState.expenses.reduce((sum, e) => sum + e.amount, 0),
    [budgetState.expenses]
  );
  const currentSavings = budgetState.savings || 0;
  const remaining = budgetState.monthlyLimit - totalSpent - currentSavings;
  const progressPercent = budgetState.monthlyLimit > 0
    ? Math.min(100, Math.round(((totalSpent + currentSavings) / budgetState.monthlyLimit) * 100))
    : 0;

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
    } else {
      showErrorToast("لطفاً یک سقف بودجه معتبر وارد کنید.");
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAmount(newAmountDisplay);

    if (!newTitle.trim()) {
      showErrorToast("لطفاً شرح هزینه را وارد کنید.");
      return;
    }
    if (val <= 0) {
      showErrorToast("لطفاً مبلغ هزینه را وارد کنید.");
      return;
    }

    const expense: BudgetExpense = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      amount: val,
      category: newCategory,
      date: new Date().toISOString(),
    };

    onUpdateBudget({
      ...budgetState,
      expenses: [expense, ...budgetState.expenses],
    });

    setNewTitle("");
    setNewAmountDisplay("");
  };

  const handleSavingsAction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseAmount(savingsInputDisplay);
    if (val <= 0) {
      showErrorToast("لطفاً مبلغ معتبری وارد کنید.");
      return;
    }

    if (savingsMode === "deposit") {
      onUpdateBudget({
        ...budgetState,
        savings: currentSavings + val,
      });
    } else if (savingsMode === "withdraw") {
      if (val > currentSavings) {
        showErrorToast("مبلغ برداشت نمی‌تواند بیشتر از موجودی صندوق باشد.");
        return;
      }
      onUpdateBudget({
        ...budgetState,
        savings: Math.max(0, currentSavings - val),
      });
    }

    setSavingsInputDisplay("");
    setSavingsMode("none");
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateBudget({
      ...budgetState,
      expenses: budgetState.expenses.filter((e) => e.id !== id),
    });
  };

  const handleResetMonth = () => {
    onUpdateBudget({
      ...budgetState,
      expenses: [],
    });
    setShowConfirmReset(false);
  };

  const handleFullReset = () => {
    onUpdateBudget({
      monthlyLimit: 0,
      expenses: [],
      savings: 0,
      savingsGoal: 0,
      savingsGoalName: "",
    });
    setLimitInputDisplay("");
    setIsEditingLimit(true);
    setShowConfirmReset(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-0 md:p-6 font-sans pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      dir="rtl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex-1 flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 shadow-2xl relative overflow-hidden border border-slate-200/80 dark:border-slate-800"
      >
        {/* Minimal Header */}
        <div className="bg-white dark:bg-slate-900 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">کیف پول من</h2>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">مدیریت بودجه و مخارج ماهانه</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowConfirmReset(true)}
              title="بازنشانی دوره"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="بستن"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {errorToast && (
          <div className="absolute top-16 inset-x-4 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold text-center shadow-lg flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Scrollable Body with Required Responsive Classes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-32 space-y-4 scrollbar-hide">
          {/* 1. Main Budget Overview Card */}
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            {isEditingLimit ? (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-600 dark:text-slate-300">
                  سقف بودجه این ماه چقدر است؟ (تومان)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={limitInputDisplay}
                    onChange={(e) => handleAmountChange(e.target.value, setLimitInputDisplay)}
                    placeholder="مثلاً ۳,۰۰۰,۰۰۰"
                    className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 text-right"
                    dir="ltr"
                  />
                  <button
                    onClick={handleSaveLimit}
                    className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-colors active:scale-95 shrink-0"
                  >
                    ثبت
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      باقیمانده برای خرج کردن
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span
                        className={`text-2xl sm:text-3xl font-black font-sans tracking-tight ${
                          remaining < 0 ? "text-rose-500" : "text-slate-900 dark:text-white"
                        }`}
                        dir="ltr"
                      >
                        {remaining.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400">تومان</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingLimit(true)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40"
                  >
                    تغییر بودجه
                  </button>
                </div>

                {/* Clean Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercent >= 90
                        ? "bg-rose-500"
                        : progressPercent >= 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/40">
                  <span>کل بودجه: {budgetState.monthlyLimit.toLocaleString()} تومان</span>
                  <span>خرج‌شده: {totalSpent.toLocaleString()} تومان</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Minimalist Savings Box */}
          <div className="bg-white dark:bg-slate-800/80 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">صندوق پس‌انداز</h4>
                  <p className="text-[10px] font-bold text-slate-400">ذخیره و مدیریت مازاد بودجه</p>
                </div>
              </div>

              <div className="text-left font-sans font-black text-sm text-slate-900 dark:text-white" dir="ltr">
                {currentSavings.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">تومان</span>
              </div>
            </div>

            {/* Savings Action Triggers */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSavingsMode(savingsMode === "deposit" ? "none" : "deposit");
                  setSavingsInputDisplay("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                  savingsMode === "deposit"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>واریز به صندوق</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSavingsMode(savingsMode === "withdraw" ? "none" : "withdraw");
                  setSavingsInputDisplay("");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border ${
                  savingsMode === "withdraw"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>برداشت از صندوق</span>
              </button>
            </div>

            {/* Inline Savings Input Form */}
            <AnimatePresence>
              {savingsMode !== "none" && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSavingsAction}
                  className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 overflow-hidden"
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={savingsInputDisplay}
                    onChange={(e) => handleAmountChange(e.target.value, setSavingsInputDisplay)}
                    placeholder={savingsMode === "deposit" ? "مبلغ واریز به تومان" : "مبلغ برداشت به تومان"}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none text-right"
                    dir="ltr"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className={`px-4 rounded-xl text-xs font-black text-white transition-colors shrink-0 ${
                      savingsMode === "deposit" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    تایید
                  </button>
                  <button
                    type="button"
                    onClick={() => setSavingsMode("none")}
                    className="px-3 rounded-xl text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    لغو
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* 3. New Expense Entry Form */}
          <form
            onSubmit={handleAddExpense}
            className="bg-white dark:bg-slate-800/80 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-3"
          >
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">ثبت خرج جدید</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان هزینه (مثلاً ناهار سلف)"
                className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                inputMode="numeric"
                value={newAmountDisplay}
                onChange={(e) => handleAmountChange(e.target.value, setNewAmountDisplay)}
                placeholder="مبلغ (تومان)"
                className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 text-right"
                dir="ltr"
              />
            </div>

            {/* Category selection chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = newCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewCategory(cat.id as BudgetExpense["category"])}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all border ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white dark:text-slate-900" : cat.color}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20"
            >
              ثبت خرج جدید
            </button>
          </form>

          {/* 4. Recent Expenses List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                ریز هزینه‌ها ({budgetState.expenses.length})
              </h4>
              {budgetState.expenses.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  مجموع: {totalSpent.toLocaleString()} تومان
                </span>
              )}
            </div>

            {budgetState.expenses.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  هنوز هزینه‌ای در این ماه ثبت نشده است
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {budgetState.expenses.map((expense) => {
                  const cat = EXPENSE_CATEGORIES.find((c) => c.id === expense.category) || EXPENSE_CATEGORIES[4];
                  const Icon = cat.icon;
                  return (
                    <div
                      key={expense.id}
                      className="bg-white dark:bg-slate-800/80 rounded-2xl p-3 px-3.5 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${cat.bg}`}>
                          <Icon className={`w-4 h-4 ${cat.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                            {expense.title}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">
                            {cat.name} • {formatShamsiDate(expense.date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-sans font-black text-xs text-slate-900 dark:text-white" dir="ltr">
                          {expense.amount.toLocaleString()} <span className="text-[10px] font-bold text-slate-400">تومان</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
                          title="حذف هزینه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        <AnimatePresence>
          {showConfirmReset && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">مدیریت و شروع ماه جدید</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  می‌توانید هزینه‌های این ماه را برای شروع ماه جدید صفر کنید، یا کل داده‌ها و سقف بودجه را پاکسازی نمایید.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleResetMonth}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors"
                  >
                    شروع ماه جدید (حفظ سقف بودجه و صفر کردن خرج‌ها)
                  </button>
                  <button
                    onClick={handleFullReset}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors"
                  >
                    پاکسازی کامل همه اطلاعات
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
