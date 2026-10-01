package ir.ac.tabrizu.student_assistant;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Fires at the exact moment a focus session ends.
 *
 * It is deliberately independent of the WebView: once the alarm is registered,
 * the alert still works when the app is backgrounded, the process is killed, or
 * the screen is off.
 */
public class FocusAlarmReceiver extends BroadcastReceiver {

    public static final String ACTION_FOCUS_ALARM = "ir.ac.tabrizu.student_assistant.FOCUS_ALARM";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";
    public static final int REQUEST_CODE = 4821;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION_FOCUS_ALARM.equals(intent.getAction())) return;

        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        if (title == null) title = context.getString(R.string.alarm_default_title);
        if (body == null) body = context.getString(R.string.alarm_default_body);

        // The foreground service is started first: it plays the sound through the
        // ALARM stream and posts a high-importance notification carrying a
        // full-screen intent, which is the supported way to raise an alarm UI
        // from the background on Android 10+.
        Intent serviceIntent = new Intent(context, FocusAlarmService.class);
        serviceIntent.putExtra(EXTRA_TITLE, title);
        serviceIntent.putExtra(EXTRA_BODY, body);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception ignored) {
            // Nothing more we can do without a foreground service.
        }

        // Below Android 10 a direct activity start from a receiver still works
        // and gives an immediate alarm screen without waiting for the
        // notification to be promoted.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            Intent activityIntent = new Intent(context, FocusAlarmActivity.class);
            activityIntent.putExtra(EXTRA_TITLE, title);
            activityIntent.putExtra(EXTRA_BODY, body);
            activityIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP
                            | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            );
            try {
                context.startActivity(activityIntent);
            } catch (Exception ignored) {
            }
        }
    }

    /** Registers the alert with the OS clock. Returns true when it was scheduled. */
    public static boolean schedule(Context context, long triggerAtMillis, String title, String body) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return false;

        Intent intent = new Intent(context, FocusAlarmReceiver.class);
        intent.setAction(ACTION_FOCUS_ALARM);
        intent.putExtra(EXTRA_TITLE, title);
        intent.putExtra(EXTRA_BODY, body);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pending = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags);
        if (pending == null) return false;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                // Exact alarms are not permitted. setAndAllowWhileIdle still
                // delivers, just not to the second.
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending);
                return false;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending);
            }
            return true;
        } catch (SecurityException e) {
            try {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pending);
            } catch (Exception ignored) {
                return false;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /** Removes a previously scheduled alert. */
    public static void cancel(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(context, FocusAlarmReceiver.class);
        intent.setAction(ACTION_FOCUS_ALARM);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pending = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags);
        if (pending != null) am.cancel(pending);
    }
}
