package ir.ac.tabrizu.student_assistant;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

/**
 * Focus alarm receiver that receives AlarmManager.setAlarmClock triggers.
 * Wakes up the device screen and immediately starts FocusAlarmService to
 * bring FocusAlarmActivity to the front over the lockscreen.
 */
public class FocusAlarmReceiver extends BroadcastReceiver {

    public static final String ACTION_FOCUS_ALARM = "ir.ac.tabrizu.student_assistant.FOCUS_ALARM";
    public static final String ACTION_STOP_ALARM = "ir.ac.tabrizu.student_assistant.ACTION_STOP_FOCUS_ALARM";
    public static final String ACTION_DISMISS_ACTIVITY = "ir.ac.tabrizu.student_assistant.ACTION_DISMISS_ACTIVITY";

    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";
    public static final String EXTRA_IS_DARK_MODE = "is_dark_mode";
    public static final int REQUEST_CODE = 4821;
    public static final int NOTIFICATION_ID = 8891;
    private static final String TAG = "FocusAlarmReceiver";

    private static PowerManager.WakeLock sWakeLock;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (ACTION_STOP_ALARM.equals(action)) {
            Log.i(TAG, "ACTION_STOP_ALARM received, stopping alarm service and dismissing activity");
            cancel(context);
            FocusAlarmService.stop(context);
            Intent dismissIntent = new Intent(ACTION_DISMISS_ACTIVITY);
            dismissIntent.setPackage(context.getPackageName());
            context.sendBroadcast(dismissIntent);
            return;
        }

        if (!ACTION_FOCUS_ALARM.equals(action)) return;

        Log.i(TAG, "Focus alarm triggered via AlarmManager! Waking display and starting alarm service...");

        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        boolean isDark = intent.getBooleanExtra(EXTRA_IS_DARK_MODE, false);
        if (title == null) title = context.getString(R.string.alarm_default_title);
        if (body == null) body = context.getString(R.string.alarm_default_body);

        // 1. Force screen on immediately via ACQUIRE_CAUSES_WAKEUP WakeLock
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (sWakeLock != null && sWakeLock.isHeld()) {
                    try { sWakeLock.release(); } catch (Exception ignored) {}
                }
                sWakeLock = pm.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK
                                | PowerManager.ACQUIRE_CAUSES_WAKEUP
                                | PowerManager.ON_AFTER_RELEASE,
                        "Daneshjooyar:FocusAlarmWakeLock"
                );
                sWakeLock.acquire(10 * 60 * 1000L /* 10 minutes */);
                Log.i(TAG, "Acquired FULL_WAKE_LOCK with ACQUIRE_CAUSES_WAKEUP");
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to acquire screen wakeup lock", e);
        }

        // 2. Start FocusAlarmService as a Foreground Service to elevate fullScreenIntent and manage audio
        Intent serviceIntent = new Intent(context, FocusAlarmService.class);
        serviceIntent.putExtra(EXTRA_TITLE, title);
        serviceIntent.putExtra(EXTRA_BODY, body);
        serviceIntent.putExtra(EXTRA_IS_DARK_MODE, isDark);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.i(TAG, "Dispatched startForegroundService to FocusAlarmService");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start FocusAlarmService; starting sound directly as backup", e);
            FocusAlarmSound.getInstance().start(context.getApplicationContext());
        }

        // 3. Attempt direct startActivity as secondary launch path
        try {
            Intent activityIntent = new Intent(context, FocusAlarmActivity.class);
            activityIntent.putExtra(EXTRA_TITLE, title);
            activityIntent.putExtra(EXTRA_BODY, body);
            activityIntent.putExtra(EXTRA_IS_DARK_MODE, isDark);
            activityIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP
                            | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            );
            context.startActivity(activityIntent);
            Log.i(TAG, "Launched FocusAlarmActivity from receiver");
        } catch (Exception e) {
            Log.d(TAG, "Direct startActivity from receiver handed off to foreground service", e);
        }
    }

    /**
     * Schedules the focus alarm via AlarmManager.setAlarmClock.
     * Fires a BroadcastReceiver PendingIntent so Android delivers with system wake privileges.
     */
    public static boolean schedule(Context context, long triggerAtMillis, String title, String body, boolean isDark) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        Intent broadcastIntent = new Intent(context, FocusAlarmReceiver.class);
        broadcastIntent.setAction(ACTION_FOCUS_ALARM);
        broadcastIntent.putExtra(EXTRA_TITLE, title);
        broadcastIntent.putExtra(EXTRA_BODY, body);
        broadcastIntent.putExtra(EXTRA_IS_DARK_MODE, isDark);

        PendingIntent operationPendingIntent = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE,
                broadcastIntent,
                flags
        );
        if (operationPendingIntent == null) return false;

        Intent activityIntent = new Intent(context, FocusAlarmActivity.class);
        activityIntent.putExtra(EXTRA_TITLE, title);
        activityIntent.putExtra(EXTRA_BODY, body);
        activityIntent.putExtra(EXTRA_IS_DARK_MODE, isDark);
        activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent showPendingIntent = PendingIntent.getActivity(
                context,
                REQUEST_CODE + 1,
                activityIntent,
                flags
        );

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(triggerAtMillis, showPendingIntent);
                am.setAlarmClock(info, operationPendingIntent);
                Log.i(TAG, "Focus alarm scheduled via setAlarmClock for " + triggerAtMillis + " (isDark=" + isDark + ")");
                return true;
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPendingIntent);
                Log.i(TAG, "Focus alarm scheduled via setExact for " + triggerAtMillis);
                return true;
            }
        } catch (Exception e) {
            Log.w(TAG, "setAlarmClock failed; falling back to setExactAndAllowWhileIdle", e);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPendingIntent);
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPendingIntent);
                }
                return true;
            } catch (Exception fallbackErr) {
                Log.e(TAG, "All AlarmManager schedule paths failed", fallbackErr);
                return false;
            }
        }
    }

    public static boolean schedule(Context context, long triggerAtMillis, String title, String body) {
        return schedule(context, triggerAtMillis, title, body, false);
    }

    /** Removes a previously scheduled alert and stops all ringing audio immediately. */
    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            Intent broadcastIntent = new Intent(context, FocusAlarmReceiver.class);
            broadcastIntent.setAction(ACTION_FOCUS_ALARM);
            PendingIntent bPending = PendingIntent.getBroadcast(context, REQUEST_CODE, broadcastIntent, flags);
            if (bPending != null) {
                am.cancel(bPending);
            }
        }

        if (sWakeLock != null && sWakeLock.isHeld()) {
            try { sWakeLock.release(); } catch (Exception ignored) {}
            sWakeLock = null;
        }

        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIFICATION_ID);
            }
        } catch (Exception ignored) {}

        try {
            FocusAlarmSound.getInstance().stop();
        } catch (Exception ignored) {}

        Log.i(TAG, "Cancelled focus alarm and dismissed alerts");
    }
}
