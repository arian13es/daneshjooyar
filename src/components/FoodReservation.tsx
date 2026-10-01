import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Clock, CalendarDays, CheckCircle2, ChevronDown, Info, Bell, X } from "lucide-react";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { NotificationService, NOTIFICATION_CHANNEL_ID } from "../services/NotificationService";
import { CustomTimePicker } from "./CustomDateTimePicker";
import { safeStorageGet, safeStorageSet, safeStorageGetString } from "../utils/storageUtils";

const DAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه"];
const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const WEEKDAYS_MAP: Record<string, number> = {
  "یکشنبه": 1, "دوشنبه": 2, "سه شنبه": 3, "چهارشنبه": 4, "پنجشنبه": 5, "جمعه": 6, "شنبه": 7
};

const GENERAL_RESTAURANTS = [
  "سلف مرکزی",
  "سلف خوابگاه شهدا",
  "سلف خوابگاه ولیعصر",
  "سلف دامپزشکی",
  "رستوران زیتون",
  "رستوران سبحان",
  "رستوران ریحان",
  "رستوران بهشت",
  "رستوران کیمیا"
];

const LUNCH_RESTAURANTS = [
  "سلف مرکزی",
  "سلف برق",
  "سلف خوابگاه شهدا",
  "سلف خوابگاه ولیعصر",
  "سلف دامپزشکی",
  "رستوران زیتون",
  "رستوران سبحان",
  "رستوران ریحان",
  "رستوران بهشت",
  "رستوران کیمیا"
];

interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
}

type WeeklyPlan = Record<string, MealPlan>;

export default function FoodReservation() {
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [plan, setPlan] = useState<WeeklyPlan>(() => {
    const defaultPlan = DAYS.reduce((acc, day) => {
      acc[day] = { breakfast: "", lunch: "", dinner: "" };
      return acc;
    }, {} as WeeklyPlan);
    return safeStorageGet<WeeklyPlan>("food_reservation_plan", defaultPlan);
  });

  const [reminderDay, setReminderDay] = useState(() => {
    return safeStorageGetString("food_reminder_day", "پنجشنبه");
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return safeStorageGetString("food_reminder_time", "10:00");
  });
  const [isReminderSet, setIsReminderSet] = useState(() => {
    return safeStorageGetString("food_reminder_set", "false") === "true";
  });

  // State for Bottom Sheet Modal
  const [bottomSheetOptions, setBottomSheetOptions] = useState<{
    isOpen: boolean;
    title: string;
    options: string[];
    onSelect: (val: string) => void;
    selectedValue: string;
  }>({ isOpen: false, title: "", options: [], onSelect: () => {}, selectedValue: "" });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    safeStorageSet("food_reservation_plan", plan);
  }, [plan]);

  useEffect(() => {
    safeStorageSet("food_reminder_set", isReminderSet.toString());
  }, [isReminderSet]);

  const handleMealChange = (day: string, meal: keyof MealPlan, value: string) => {
    setPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [meal]: value
      }
    }));
  };

  const openRestaurantSelect = (meal: keyof MealPlan, label: string, isLunch: boolean = false) => {
    const options = isLunch ? LUNCH_RESTAURANTS : GENERAL_RESTAURANTS;
    const value = plan[activeDay]?.[meal] || "";
    
    setBottomSheetOptions({
      isOpen: true,
      title: `انتخاب رستوران - ${label.split(" (")[0]}`,
      options: options,
      selectedValue: value,
      onSelect: (val) => {
        handleMealChange(activeDay, meal, val);
        setBottomSheetOptions(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const openDaySelect = () => {
    setBottomSheetOptions({
      isOpen: true,
      title: "انتخاب روز یادآوری",
      options: WEEKDAYS,
      selectedValue: reminderDay,
      onSelect: (val) => {
        setReminderDay(val);
        setBottomSheetOptions(prev => ({ ...prev, isOpen: false }));
        setIsReminderSet(false); // reset reminder status when settings change
      }
    });
  };

  const toggleReminder = async () => {
    if (!Capacitor.isNativePlatform()) {
      showToast("یادآوری اعلان‌ها در نسخه اندروید فعال است.");
      return;
    }
    if (isReminderSet) {
      // Cancel
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1000 }] });
      } catch (e) { console.error(e); }
      setIsReminderSet(false);
    } else {
      // Set
      const hasPerm = await NotificationService.requestPermission();
      if (!hasPerm) {
        showToast("لطفاً ابتدا دسترسی اعلان‌ها را به برنامه بدهید.");
        return;
      }
      const baseDay = WEEKDAYS_MAP[reminderDay];
      if (!baseDay) return;
      let [h, m] = reminderTime.split(':').map(Number);

      // Calculate next exact date for this weekday
      const now = new Date();
      let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      let dayOffset = baseDay - (now.getDay() + 1); // JS getDay: 0=Sun. JS+1 matches WEEKDAYS_MAP.
      if (dayOffset < 0 || (dayOffset === 0 && targetDate.getTime() <= now.getTime())) {
         dayOffset += 7; // Next week
      }
      targetDate = new Date(targetDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1000, // Fixed ID for food reminder
              title: "یادآوری رزرو غذا 🍔",
              body: "یادت نره غذای هفته بعدت رو رزرو کنی تا جا نمونی!",
              schedule: { at: targetDate, allowWhileIdle: true, repeats: true, every: "week" },
              channelId: NOTIFICATION_CHANNEL_ID,
              extra: { tab: 'food' }
            }
          ]
        });
        setIsReminderSet(true);
        safeStorageSet("food_reminder_day", reminderDay);
        safeStorageSet("food_reminder_time", reminderTime);
      } catch (e) {
        console.error(e);
        showToast("مشکلی در تنظیم یادآور پیش آمد.");
      }
    }
  };

  const renderMealButton = (meal: keyof MealPlan, label: string, isLunch: boolean = false) => {
    const value = plan[activeDay]?.[meal] || "";
    const isBreakfastSelf = meal === "breakfast" && value && value.includes("سلف");

    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-3">
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2">{label}</label>
        <button 
          onClick={() => openRestaurantSelect(meal, label, isLunch)}
          className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-indigo-500 transition-colors"
        >
          <span className={value ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}>
            {value || "انتخاب رستوران..."}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {isBreakfastSelf && (
          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50/80 dark:bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
            <Info className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>توجه: صبحانه سلف، شب قبل همراه با شام تحویل داده می‌شود.</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto px-2.5 sm:px-4 pb-36 sm:pb-32 space-y-4 sm:space-y-6 relative">
      
      {/* Header Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[1.75rem] sm:rounded-[2rem] p-4 sm:p-6 text-white shadow-xl dark:shadow-none relative overflow-hidden mt-2 sm:mt-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-2 sm:mb-4 relative z-10">
          <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-white/10 shadow-sm">
            <Utensils className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" />
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base drop-shadow-sm">برنامه رزرو غذا</h4>
            <p className="text-[9px] sm:text-[10px] text-indigo-100 mt-0.5 font-medium">برنامه‌ریزی و یادآوری هفتگی</p>
          </div>
        </div>
      </div>

      {/* Days Tabs - 3x2 on phones, 6x1 on tablets */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all ${activeDay === day ? "bg-indigo-600 text-white shadow-md dark:shadow-none" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
          >
            <span className="text-[11px] sm:text-xs font-black">{day}</span>
            {plan[day].breakfast || plan[day].lunch || plan[day].dinner ? (
              <div className={`h-1.5 w-1.5 rounded-full ${activeDay === day ? 'bg-amber-300' : 'bg-indigo-400'}`}></div>
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-transparent"></div>
            )}
          </button>
        ))}
      </div>

      {/* Meals Section - Stack on phones, 3 cols on tablets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 transition-opacity duration-200">
        {renderMealButton("breakfast", "صبحانه (۷:۰۰ الی ۹:۰۰)")}
        {renderMealButton("lunch", "ناهار (۱۲:۰۰ الی ۱۴:۰۰)", true)}
        {activeDay !== "پنجشنبه" && renderMealButton("dinner", "شام (۱۸:۰۰ الی ۲۰:۰۰)")}
      </div>

      {/* Reminder Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm mt-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h5 className="font-black text-sm text-slate-800 dark:text-slate-100">یادم بنداز رزرو کنم</h5>
            <p className="text-[10px] font-bold text-slate-400">تنظیم آلارم برای هفته بعد</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5">روز یادآوری</label>
            <button 
              onClick={openDaySelect}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-rose-400 transition-colors"
            >
              <span>{reminderDay}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          
          <div>
            <CustomTimePicker 
              label="ساعت یادآوری" 
              value={reminderTime} 
              onChange={(val) => {
                setReminderTime(val);
                setIsReminderSet(false);
              }} 
              themeColor="rose"
              triggerClassName="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-rose-400 transition-colors"
            />
          </div>
        </div>

        <button 
          onClick={toggleReminder}
          className={`w-full py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${isReminderSet ? "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600"}`}
        >
          {isReminderSet ? (
            <><CheckCircle2 className="h-4 w-4" /> یادآور تنظیم شد</>
          ) : (
            <><Bell className="h-4 w-4" /> تنظیم یادآور</>
          )}
        </button>

        <div className="mt-4 bg-amber-50 dark:bg-amber-900/10 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] font-medium leading-relaxed text-amber-700 dark:text-amber-500/80">
            میدونم میشه از پنجشنبه غذا رو رزرو کرد ولی بعضی از تاک ها ظرفیتشون زود پر میشه و ممکنه نتونی رزرو کنی. با توجه به اون یکی دو روز زودتر یادآور رو تنظیم بکن تا بتونی تو جایی که میخوای غذا رزرو کنی.
          </p>
        </div>
      </div>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {bottomSheetOptions.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] flex justify-center items-end"
          >
            <div 
              onClick={() => setBottomSheetOptions(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/50"
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-[2rem] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800">
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm pl-4">{bottomSheetOptions.title}</h4>
                <button 
                  onClick={() => setBottomSheetOptions(prev => ({ ...prev, isOpen: false }))}
                  className="h-8 w-8 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-2">
                <button
                  onClick={() => bottomSheetOptions.onSelect("")}
                  className={`w-full flex items-center justify-between p-4 rounded-xl mb-1 transition-colors ${bottomSheetOptions.selectedValue === "" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                >
                  <span className="text-xs">هیچکدام</span>
                  {bottomSheetOptions.selectedValue === "" && <CheckCircle2 className="h-5 w-5" />}
                </button>
                {bottomSheetOptions.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => bottomSheetOptions.onSelect(opt)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl mb-1 transition-colors ${bottomSheetOptions.selectedValue === opt ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black" : "text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    <span className="text-xs">{opt}</span>
                    {bottomSheetOptions.selectedValue === opt && <CheckCircle2 className="h-5 w-5" />}
                  </button>
                ))}
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                 {/* Footer padding for safe area */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-[300] max-w-sm mx-auto bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-center border border-white/10"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
