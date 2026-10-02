package ir.ac.tabrizu.student_assistant;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * Focus alarm receiver that wakes up the device and displays FocusAlarmActivity
 * directly over the lockscreen on Samsung (One UI) and standard Android devices.
 * Uses both direct activity launch and high-priority full-screen intent.
 */
public class FocusAlarmReceiver extends BroadcastReceiver {

    public static final String ACTION_FOCUS_ALARM = "ir.ac.tabrizu.student_assistant.FOCUS_ALARM";
    public static final String ACTION_STOP_ALARM = "ir.ac.tabrizu.student_assistant.ACTION_STOP_FOCUS_ALARM";
    public static final String ACTION_DISMISS_ACTIVITY = "ir.ac.tabrizu.student_assistant.ACTION_DISMISS_ACTIVITY";

    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";
    public static final int REQUEST_CODE = 4821;
    public static final String CHANNEL_ID = "focus_alarm_clock_channel_v6";
    public static final int NOTIFICATION_ID = 8891;
    private static final String TAG = "FocusAlarmReceiver";

    private static PowerManager.WakeLock sWakeLock;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (ACTION_STOP_ALARM.equals(action)) {
            Log.i(TAG, "ACTION_STOP_ALARM received, dismissing alarm and closing activity");
            cancel(context);
            Intent dismissIntent = new Intent(ACTION_DISMISS_ACTIVITY);
            dismissIntent.setPackage(context.getPackageName());
            context.sendBroadcast(dismissIntent);
            return;
        }

        if (!ACTION_FOCUS_ALARM.equals(action)) return;

        Log.i(TAG, "Focus alarm triggered! Waking device and launching clock screen...");

        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        if (title == null) title = context.getString(R.string.alarm_default_title);
        if (body == null) body = context.getString(R.string.alarm_default_body);

        // 1. Force the physical screen to wake up immediately using ACQUIRE_CAUSES_WAKEUP
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

        // 2. Start loud audio & vibration immediately through singleton
        try {
            FocusAlarmSound.getInstance().start(context.getApplicationContext());
        } catch (Exception e) {
            Log.e(TAG, "Failed to start alarm sound", e);
        }

        // 3. Prepare intent for FocusAlarmActivity (Clock-style full-screen UI)
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        Intent activityIntent = new Intent(context, FocusAlarmActivity.class);
        activityIntent.putExtra(EXTRA_TITLE, title);
        activityIntent.putExtra(EXTRA_BODY, body);
        activityIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );

        PendingIntent fullScreenPending = PendingIntent.getActivity(
                context,
                REQUEST_CODE + 2,
                activityIntent,
                flags
        );

        Intent stopIntent = new Intent(context, FocusAlarmReceiver.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent stopPending = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE + 3,
                stopIntent,
                flags
        );

        createNotificationChannel(context);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.mipmap.ic_launcher))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(fullScreenPending)
                .setFullScreenIntent(fullScreenPending, true)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "توقف زنگ", stopPending);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, builder.build());
            Log.i(TAG, "Posted full-screen alarm notification");
        }

        // 4. Directly launch FocusAlarmActivity (Samsung One UI permits activity launch from alarm broadcasts)
        try {
            context.startActivity(activityIntent);
            Log.i(TAG, "Launched FocusAlarmActivity directly from receiver");
        } catch (Exception e) {
            Log.w(TAG, "Direct startActivity fell back to fullScreenIntent", e);
        }
    }

    private static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                context.getString(R.string.alarm_channel_name),
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(context.getString(R.string.alarm_channel_description));
        channel.setBypassDnd(true);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 800, 400, 800, 400, 1000 });
        channel.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
        );
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(channel);
    }

    /**
     * Schedules the focus alarm via AlarmManager.setAlarmClock.
     * Fires a BroadcastReceiver PendingIntent so Android delivers with system wake privileges.
     */
    public static boolean schedule(Context context, long triggerAtMillis, String title, String body) {
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
                Log.i(TAG, "Scheduled focus alarm via setAlarmClock at " + triggerAtMillis);
                return true;
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPendingIntent);
                return true;
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPendingIntent);
                return true;
            }
        } catch (SecurityException se) {
            Log.w(TAG, "Exact alarm permission rejected, falling back to setAndAllowWhileIdle", se);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, operationPendingIntent);
                    return false;
                }
            } catch (Exception ignored) {
            }
            return false;
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule alarm", e);
            return false;
        }
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
