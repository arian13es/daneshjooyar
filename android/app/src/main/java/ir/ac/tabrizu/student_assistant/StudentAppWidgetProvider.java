package ir.ac.tabrizu.student_assistant;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: StudentAppWidgetProvider — ویجت هوشمند، بلادرنگ و پیش‌بین پردیس
 * Author: Arian
 * ============================================================================
 */
public class StudentAppWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "student_widget_data";
    public static final String ACTION_WIDGET_UPDATE_ALARM = "ir.ac.tabrizu.student_assistant.WIDGET_UPDATE_ALARM";

    private static final String[] PERSIAN_MONTH_NAMES = {
        "فروردین", "اردیبهشت", "خرداد",
        "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر",
        "دی", "بهمن", "اسفند"
    };

    private static final String[] PERSIAN_WEEKDAY_NAMES = {
        "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"
    };

    private static final String[] DAY_NAMES_BY_CAL = {
        "", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"
    };

    public static class JalaliDate {
        public int year;
        public int month;
        public int day;
        public String monthName;
    }

    public static class ClassSession {
        public String courseName;
        public int jsDay; // 0: Sunday, 1: Monday, ..., 6: Saturday
        public String startTime;
        public String endTime;
        public String location;
        public String weekType; // "all", "even", "odd"
    }

    public static class ExamEntry {
        public String courseName;
        public String date;
        public String time;
        public String location;
        public String type;
        public long timestamp;
    }

    public static class WidgetScheduleState {
        public String classStatusBadge;
        public int classStatusBadgeBgRes;
        public int classStatusTextColor;
        public String className;
        public String classTime;
        public String classLocation;

        public String examStatusBadge;
        public int examStatusBadgeBgRes;
        public int examStatusTextColor;
        public String examName;
        public String examDate;
        public String examCountdown;

        public String todayDate;
        public long nextTriggerMillis;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_WIDGET_UPDATE_ALARM.equals(action) ||
            Intent.ACTION_TIME_CHANGED.equals(action) ||
            Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
            Intent.ACTION_DATE_CHANGED.equals(action) ||
            Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            updateAllWidgets(context);
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        WidgetScheduleState state = computeScheduleState(context, prefs);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_student_assistant);

        // Header
        views.setTextViewText(R.id.tv_widget_date, state.todayDate);

        // Class Card
        views.setTextViewText(R.id.tv_widget_class_status, state.classStatusBadge);
        views.setTextColor(R.id.tv_widget_class_status, state.classStatusTextColor);
        views.setInt(R.id.tv_widget_class_status, "setBackgroundResource", state.classStatusBadgeBgRes);

        views.setTextViewText(R.id.tv_widget_class_time, state.classTime);
        views.setTextViewText(R.id.tv_widget_class_name, state.className);
        views.setTextViewText(R.id.tv_widget_class_location, state.classLocation);

        // Exam Card
        views.setTextViewText(R.id.tv_widget_exam_status, state.examStatusBadge);
        views.setTextColor(R.id.tv_widget_exam_status, state.examStatusTextColor);
        views.setInt(R.id.tv_widget_exam_status, "setBackgroundResource", state.examStatusBadgeBgRes);

        views.setTextViewText(R.id.tv_widget_exam_date, state.examDate);
        views.setTextViewText(R.id.tv_widget_exam_name, state.examName);
        views.setTextViewText(R.id.tv_widget_exam_countdown, state.examCountdown);

        // Click to launch App
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_class_card, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_exam_card, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);

        // Schedule next state transition alarm
        if (state.nextTriggerMillis > System.currentTimeMillis()) {
            scheduleNextUpdateAlarm(context, state.nextTriggerMillis);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, StudentAppWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                for (int appWidgetId : appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, appWidgetId);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void scheduleNextUpdateAlarm(Context context, long triggerAtMillis) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent intent = new Intent(context, StudentAppWidgetProvider.class);
            intent.setAction(ACTION_WIDGET_UPDATE_ALARM);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getBroadcast(context, 7771, intent, flags);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC, triggerAtMillis, pi);
            } else {
                am.set(AlarmManager.RTC, triggerAtMillis, pi);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ========================================================================
    // Real-Time Schedule & Calendar Intelligence Engine
    // ========================================================================

    public static WidgetScheduleState computeScheduleState(Context context, SharedPreferences prefs) {
        WidgetScheduleState state = new WidgetScheduleState();
        Calendar now = Calendar.getInstance();

        int gy = now.get(Calendar.YEAR);
        int gm = now.get(Calendar.MONTH) + 1;
        int gd = now.get(Calendar.DAY_OF_MONTH);
        JalaliDate jNow = gregorianToJalali(gy, gm, gd);

        int calDay = now.get(Calendar.DAY_OF_WEEK);
        int currJsDay = calDay - 1; // 0: Sunday ... 6: Saturday
        String dayName = (calDay >= 1 && calDay <= 7) ? DAY_NAMES_BY_CAL[calDay] : "امروز";

        state.todayDate = dayName + " " + toPersianDigits(jNow.day) + " " + jNow.monthName;

        int nowHour = now.get(Calendar.HOUR_OF_DAY);
        int nowMin = now.get(Calendar.MINUTE);
        String currentTimeStr = String.format(Locale.US, "%02d:%02d", nowHour, nowMin);

        int weekParityOffset = prefs.getInt("week_parity_offset", 0);
        boolean isEvenThisWeek = isEvenWeek(now.getTimeInMillis(), weekParityOffset);

        List<ClassSession> classes = parseClasses(prefs.getString("classes_json", ""));

        long nextTrigger = System.currentTimeMillis() + (30L * 60L * 1000L); // 30 min default

        // 1. Resolve Class
        if (classes.isEmpty()) {
            state.classStatusBadge = "برنامه کلاسی";
            state.classStatusBadgeBgRes = R.drawable.widget_badge_slate;
            state.classStatusTextColor = Color.parseColor("#94A3B8");
            state.className = prefs.getString("class_title", "کلاس فعالی ثبت نشده است");
            state.classTime = prefs.getString("class_time", "--:--");
            state.classLocation = prefs.getString("class_location", "");
        } else {
            List<ClassSession> todaySessions = new ArrayList<>();
            for (ClassSession s : classes) {
                if (s.jsDay == currJsDay) {
                    boolean parityOk = "all".equals(s.weekType) ||
                        ("even".equals(s.weekType) && isEvenThisWeek) ||
                        ("odd".equals(s.weekType) && !isEvenThisWeek);
                    if (parityOk) {
                        todaySessions.add(s);
                    }
                }
            }
            Collections.sort(todaySessions, (a, b) -> a.startTime.compareTo(b.startTime));

            ClassSession activeSession = null;
            ClassSession upcomingTodaySession = null;

            for (ClassSession s : todaySessions) {
                if (s.startTime.compareTo(currentTimeStr) <= 0 && currentTimeStr.compareTo(s.endTime) < 0) {
                    activeSession = s;
                    break;
                } else if (s.startTime.compareTo(currentTimeStr) > 0) {
                    if (upcomingTodaySession == null) {
                        upcomingTodaySession = s;
                    }
                }
            }

            if (activeSession != null) {
                state.classStatusBadge = "🟢 در حال برگزاری";
                state.classStatusBadgeBgRes = R.drawable.widget_badge_green;
                state.classStatusTextColor = Color.parseColor("#34D399");
                state.className = activeSession.courseName;
                state.classTime = "تا " + activeSession.endTime;
                state.classLocation = activeSession.location.isEmpty() ? "مکان ثبت‌نشده" : "📍 مکان: " + activeSession.location;

                long endMs = parseTodayTimeToMillis(now, activeSession.endTime);
                if (endMs > System.currentTimeMillis()) {
                    nextTrigger = Math.min(nextTrigger, endMs + 1000L);
                }
            } else if (upcomingTodaySession != null) {
                state.classStatusBadge = "کلاس بعدی امروز";
                state.classStatusBadgeBgRes = R.drawable.widget_badge_blue;
                state.classStatusTextColor = Color.parseColor("#38BDF8");
                state.className = upcomingTodaySession.courseName;
                state.classTime = upcomingTodaySession.startTime + " - " + upcomingTodaySession.endTime;
                state.classLocation = upcomingTodaySession.location.isEmpty() ? "" : "📍 مکان: " + upcomingTodaySession.location;

                long startMs = parseTodayTimeToMillis(now, upcomingTodaySession.startTime);
                if (startMs > System.currentTimeMillis()) {
                    nextTrigger = Math.min(nextTrigger, startMs + 1000L);
                }
            } else {
                // All classes today ended (e.g. evening / night) or no classes today:
                // Look ahead to find the first upcoming class in the next 1-7 days!
                ClassSession nextUpcoming = null;
                int nextDayOffset = 0;
                int targetJsDay = -1;

                for (int offset = 1; offset <= 7; offset++) {
                    int checkJsDay = (currJsDay + offset) % 7;
                    long futureTime = now.getTimeInMillis() + (long) offset * 24L * 3600L * 1000L;
                    boolean isFutureEven = isEvenWeek(futureTime, weekParityOffset);

                    List<ClassSession> futureSessions = new ArrayList<>();
                    for (ClassSession s : classes) {
                        if (s.jsDay == checkJsDay) {
                            boolean pOk = "all".equals(s.weekType) ||
                                ("even".equals(s.weekType) && isFutureEven) ||
                                ("odd".equals(s.weekType) && !isFutureEven);
                            if (pOk) futureSessions.add(s);
                        }
                    }
                    if (!futureSessions.isEmpty()) {
                        Collections.sort(futureSessions, (a, b) -> a.startTime.compareTo(b.startTime));
                        nextUpcoming = futureSessions.get(0);
                        nextDayOffset = offset;
                        targetJsDay = checkJsDay;
                        break;
                    }
                }

                if (nextUpcoming != null) {
                    if (nextDayOffset == 1) {
                        state.classStatusBadge = "اولین کلاس فردا";
                        state.classStatusBadgeBgRes = R.drawable.widget_badge_amber;
                        state.classStatusTextColor = Color.parseColor("#FBBF24");
                    } else {
                        state.classStatusBadge = "کلاس بعدی: " + PERSIAN_WEEKDAY_NAMES[targetJsDay];
                        state.classStatusBadgeBgRes = R.drawable.widget_badge_slate;
                        state.classStatusTextColor = Color.parseColor("#CBD5E1");
                    }
                    state.className = nextUpcoming.courseName;
                    state.classTime = nextUpcoming.startTime + " - " + nextUpcoming.endTime;
                    state.classLocation = nextUpcoming.location.isEmpty() ? "" : "📍 مکان: " + nextUpcoming.location;
                } else {
                    state.classStatusBadge = "پایان کلاس‌ها";
                    state.classStatusBadgeBgRes = R.drawable.widget_badge_slate;
                    state.classStatusTextColor = Color.parseColor("#94A3B8");
                    state.className = todaySessions.isEmpty() ? "امروز کلاسی ندارید" : "کلاس‌های امروز پایان یافته است";
                    state.classTime = "--:--";
                    state.classLocation = "خسته نباشید!";
                }
            }
        }

        // 2. Resolve Exam
        List<ExamEntry> exams = parseExams(prefs.getString("exams_json", ""));
        long nowMs = now.getTimeInMillis();

        ExamEntry nextExam = null;
        for (ExamEntry ex : exams) {
            if (ex.timestamp >= nowMs - (2L * 3600L * 1000L)) {
                nextExam = ex;
                break;
            }
        }

        if (nextExam != null) {
            long diffMs = nextExam.timestamp - nowMs;
            long diffDays = diffMs / (24L * 3600L * 1000L);

            if (diffDays <= 0) {
                state.examStatusBadge = "🔥 امروز";
                state.examStatusBadgeBgRes = R.drawable.widget_badge_rose;
                state.examStatusTextColor = Color.parseColor("#FB7185");
                state.examCountdown = "آزمون امروز برگزار می‌شود!";
            } else if (diffDays == 1) {
                state.examStatusBadge = "⚠️ فردا";
                state.examStatusBadgeBgRes = R.drawable.widget_badge_amber;
                state.examStatusTextColor = Color.parseColor("#FBBF24");
                state.examCountdown = "فقط ۱ روز تا آزمون باقی مانده";
            } else {
                state.examStatusBadge = toPersianDigits((int) diffDays) + " روز مانده";
                state.examStatusBadgeBgRes = R.drawable.widget_badge_blue;
                state.examStatusTextColor = Color.parseColor("#38BDF8");
                state.examCountdown = "زمان باقی‌مانده: " + toPersianDigits((int) diffDays) + " روز";
            }

            state.examName = nextExam.courseName + (nextExam.type.isEmpty() ? "" : " (" + nextExam.type + ")");
            state.examDate = nextExam.date + " • ساعت " + nextExam.time;
            if (!nextExam.location.isEmpty()) {
                state.examCountdown += " • مکان: " + nextExam.location;
            }
        } else {
            state.examStatusBadge = "امتحان";
            state.examStatusBadgeBgRes = R.drawable.widget_badge_slate;
            state.examStatusTextColor = Color.parseColor("#94A3B8");
            state.examName = prefs.getString("exam_title", "امتحان نزدیکی ثبت‌نشده");
            state.examDate = prefs.getString("exam_date", "--");
            state.examCountdown = "وضعیت تحصیلی آرام • با تمرکز مطالعه کنید";
        }

        // Align midnight boundary trigger
        Calendar midnight = Calendar.getInstance();
        midnight.add(Calendar.DAY_OF_YEAR, 1);
        midnight.set(Calendar.HOUR_OF_DAY, 0);
        midnight.set(Calendar.MINUTE, 0);
        midnight.set(Calendar.SECOND, 2);
        midnight.set(Calendar.MILLISECOND, 0);
        nextTrigger = Math.min(nextTrigger, midnight.getTimeInMillis());

        state.nextTriggerMillis = nextTrigger;
        return state;
    }

    private static long parseTodayTimeToMillis(Calendar now, String timeStr) {
        if (timeStr == null || !timeStr.contains(":")) return 0;
        try {
            String[] parts = timeStr.split(":");
            int h = Integer.parseInt(parts[0].trim());
            int m = Integer.parseInt(parts[1].trim());
            Calendar c = (Calendar) now.clone();
            c.set(Calendar.HOUR_OF_DAY, h);
            c.set(Calendar.MINUTE, m);
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            return c.getTimeInMillis();
        } catch (Exception e) {
            return 0;
        }
    }

    public static List<ClassSession> parseClasses(String jsonStr) {
        List<ClassSession> list = new ArrayList<>();
        if (jsonStr == null || jsonStr.trim().isEmpty()) return list;
        try {
            JSONArray arr = new JSONArray(jsonStr);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                String courseName = obj.optString("courseName", "");
                String weekday = obj.optString("weekday", "");
                String startTime = obj.optString("startTime", "");
                String endTime = obj.optString("endTime", "");
                String location = obj.optString("location", "");
                String weekType = obj.optString("weekType", "all");

                int jsDay = parseJsDay(weekday);
                if (jsDay >= 0) {
                    ClassSession s1 = new ClassSession();
                    s1.courseName = courseName;
                    s1.jsDay = jsDay;
                    s1.startTime = startTime;
                    s1.endTime = endTime;
                    s1.location = location;
                    s1.weekType = weekType;
                    list.add(s1);
                }

                boolean hasSecond = obj.optBoolean("hasSecondSession", false);
                if (hasSecond) {
                    String secWeekday = obj.optString("secondWeekday", "");
                    int secJsDay = parseJsDay(secWeekday);
                    if (secJsDay >= 0) {
                        ClassSession s2 = new ClassSession();
                        s2.courseName = courseName + " (جلسه ۲)";
                        s2.jsDay = secJsDay;
                        s2.startTime = obj.optString("secondStartTime", startTime);
                        s2.endTime = obj.optString("secondEndTime", endTime);
                        s2.location = obj.optString("secondLocation", location);
                        s2.weekType = obj.optString("secondWeekType", weekType);
                        list.add(s2);
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public static int parseJsDay(String w) {
        if (w == null) return -1;
        String s = w.replaceAll("[\\s\u200C]", "");
        if (s.contains("یک")) return 0;
        if (s.contains("دو")) return 1;
        if (s.contains("سه")) return 2;
        if (s.contains("چهار")) return 3;
        if (s.contains("پنج")) return 4;
        if (s.contains("جمعه")) return 5;
        if (s.contains("شنبه")) return 6;
        return -1;
    }

    public static List<ExamEntry> parseExams(String jsonStr) {
        List<ExamEntry> list = new ArrayList<>();
        if (jsonStr == null || jsonStr.trim().isEmpty()) return list;
        try {
            JSONArray arr = new JSONArray(jsonStr);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                if (obj.optBoolean("completed", false)) continue;

                ExamEntry ex = new ExamEntry();
                ex.courseName = obj.optString("courseName", "");
                ex.date = obj.optString("date", "");
                ex.time = obj.optString("time", "10:00");
                ex.location = obj.optString("location", "");
                ex.type = obj.optString("type", "پایان‌ترم");
                ex.timestamp = parseJalaliTimestamp(ex.date, ex.time);
                list.add(ex);
            }
            Collections.sort(list, (a, b) -> Long.compare(a.timestamp, b.timestamp));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public static long parseJalaliTimestamp(String dateStr, String timeStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return Long.MAX_VALUE;
        String[] parts = dateStr.trim().split("\\s+");
        if (parts.length < 2) return Long.MAX_VALUE;

        int day = parsePersianInt(parts[0]);
        int monthIdx = -1;
        for (int i = 0; i < PERSIAN_MONTH_NAMES.length; i++) {
            if (parts[1].contains(PERSIAN_MONTH_NAMES[i])) {
                monthIdx = i + 1;
                break;
            }
        }
        if (day < 1 || monthIdx == -1) return Long.MAX_VALUE;

        Calendar now = Calendar.getInstance();
        JalaliDate nowJ = gregorianToJalali(now.get(Calendar.YEAR), now.get(Calendar.MONTH) + 1, now.get(Calendar.DAY_OF_MONTH));
        int year = nowJ.year;
        if (parts.length >= 3) {
            int y = parsePersianInt(parts[2]);
            if (y > 1300 && y < 1500) year = y;
        }

        int hour = 10;
        int minute = 0;
        if (timeStr != null && timeStr.contains(":")) {
            String[] tp = timeStr.split(":");
            if (tp.length >= 2) {
                hour = parsePersianInt(tp[0]);
                minute = parsePersianInt(tp[1]);
            }
        }

        return jalaliToTimestamp(year, monthIdx, day, hour, minute);
    }

    public static int parsePersianInt(String str) {
        if (str == null) return 0;
        String normalized = str
            .replace("۰", "0").replace("۱", "1").replace("۲", "2")
            .replace("۳", "3").replace("۴", "4").replace("۵", "5")
            .replace("۶", "6").replace("۷", "7").replace("۸", "8")
            .replace("۹", "9");
        try {
            return Integer.parseInt(normalized.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    public static JalaliDate gregorianToJalali(int gy, int gm, int gd) {
        int[] g_d_m = {0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334};
        int gy2 = (gm > 2) ? (gy + 1) : gy;
        int days = 355666 + (365 * gy) + ((gy2 + 3) / 4) - ((gy2 + 99) / 100) + ((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
        int jy = -1595 + (33 * (days / 12053));
        days %= 12053;
        jy += 4 * (days / 1461);
        days %= 1461;
        if (days > 365) {
            jy += (days - 1) / 365;
            days = (days - 1) % 365;
        }
        int jm = (days < 186) ? 1 + (days / 31) : 7 + ((days - 186) / 30);
        int jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));

        JalaliDate res = new JalaliDate();
        res.year = jy;
        res.month = jm;
        res.day = jd;
        if (jm >= 1 && jm <= 12) {
            res.monthName = PERSIAN_MONTH_NAMES[jm - 1];
        } else {
            res.monthName = "";
        }
        return res;
    }

    public static long jalaliToTimestamp(int jy, int jm, int jd, int hour, int minute) {
        int gy;
        int jy2;
        if (jy > 979) {
            gy = 1600;
            jy2 = jy - 979;
        } else {
            gy = 621;
            jy2 = jy;
        }
        int days = (365 * jy2) + ((jy2 / 33) * 8) + (((jy2 % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
        gy += 400 * (days / 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * (--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        gy += 4 * (days / 1461);
        days %= 1461;
        if (days > 365) {
            gy += (days - 1) / 365;
            days = (days - 1) % 365;
        }
        boolean isLeap = (gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0);
        int[] sal_a = {0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
        int gm = 0;
        int gd = 0;
        for (int i = 1; i <= 12; i++) {
            if (days < sal_a[i]) {
                gm = i;
                gd = days + 1;
                break;
            }
            days -= sal_a[i];
        }
        Calendar cal = Calendar.getInstance();
        cal.set(gy, gm - 1, gd, hour, minute, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    public static boolean isEvenWeek(long nowMs, int parityOffset) {
        Calendar anchor = Calendar.getInstance();
        anchor.set(2026, Calendar.SEPTEMBER, 26, 0, 0, 0);
        anchor.set(Calendar.MILLISECOND, 0);
        long startOfAnchorDay = anchor.getTimeInMillis();

        Calendar target = Calendar.getInstance();
        target.setTimeInMillis(nowMs);
        target.set(Calendar.HOUR_OF_DAY, 0);
        target.set(Calendar.MINUTE, 0);
        target.set(Calendar.SECOND, 0);
        target.set(Calendar.MILLISECOND, 0);
        long startOfTargetDay = target.getTimeInMillis();

        long diffDays = Math.round((double)(startOfTargetDay - startOfAnchorDay) / (24.0 * 3600.0 * 1000.0));
        long weekNum = (diffDays / 7) + parityOffset;
        return (weekNum % 2) == 0;
    }

    public static String toPersianDigits(int num) {
        return toPersianDigits(String.valueOf(num));
    }

    public static String toPersianDigits(String str) {
        if (str == null) return "";
        char[] persianDigits = {'۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'};
        StringBuilder sb = new StringBuilder();
        for (char c : str.toCharArray()) {
            if (c >= '0' && c <= '9') {
                sb.append(persianDigits[c - '0']);
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
