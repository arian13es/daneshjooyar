package ir.ac.tabrizu.student_assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

/**
 * Foreground Service for the Clock-style focus alarm.
 * Running in the foreground gives the app the required Android 10+ OS privilege
 * to display FocusAlarmActivity over the lockscreen and keep alarm audio playing.
 */
public class FocusAlarmService extends Service {

    public static final String CHANNEL_ID = "focus_alarm_clock_channel_v9";
    public static final int NOTIFICATION_ID = 8891;
    public static final String ACTION_STOP = "ir.ac.tabrizu.student_assistant.ACTION_STOP_FOCUS_ALARM";
    public static final String ACTION_START = "ir.ac.tabrizu.student_assistant.ACTION_START_FOCUS_ALARM";
    private static final String TAG = "FocusAlarmService";

    private boolean foregroundStarted;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            Log.i(TAG, "Stop action received in FocusAlarmService");
            stopAlarm();
            return START_NOT_STICKY;
        }

        String title = intent != null ? intent.getStringExtra(FocusAlarmReceiver.EXTRA_TITLE) : null;
        String body = intent != null ? intent.getStringExtra(FocusAlarmReceiver.EXTRA_BODY) : null;
        if (title == null) title = getString(R.string.alarm_default_title);
        if (body == null) body = getString(R.string.alarm_default_body);

        createChannel();
        promoteToForeground(title, body);

        // Ensure singleton audio is playing
        FocusAlarmSound.getInstance().start(this);

        // Launch full-screen lockscreen activity from the foreground service
        launchAlarmActivity(title, body);

        return START_NOT_STICKY;
    }

    private void launchAlarmActivity(String title, String body) {
        try {
            Intent activityIntent = new Intent(this, FocusAlarmActivity.class);
            activityIntent.putExtra(FocusAlarmReceiver.EXTRA_TITLE, title);
            activityIntent.putExtra(FocusAlarmReceiver.EXTRA_BODY, body);
            if (intentHasDarkExtra(title)) {
                // extra passed through intent if available
            }
            activityIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP
                            | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            );
            startActivity(activityIntent);
            Log.i(TAG, "Successfully started FocusAlarmActivity from foreground service");
        } catch (Exception e) {
            Log.w(TAG, "Failed to start FocusAlarmActivity directly from service; relying on fullScreenIntent", e);
        }
    }

    private boolean intentHasDarkExtra(String unused) {
        return false;
    }

    private void promoteToForeground(String title, String body) {
        if (foregroundStarted) return;
        Notification notification = buildNotification(title, body);
        try {
            if (Build.VERSION.SDK_INT >= 34 /* Android 14+ */) {
                startForeground(
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                );
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                );
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            foregroundStarted = true;
            Log.i(TAG, "Promoted FocusAlarmService to foreground");
        } catch (Exception e) {
            Log.w(TAG, "startForeground failed, posting standard notification fallback", e);
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIFICATION_ID, notification);
            } catch (Exception ignored) {
            }
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Clean up previous silent channel version to guarantee fresh notification settings
        try {
            nm.deleteNotificationChannel("focus_alarm_clock_channel_v8");
        } catch (Exception ignored) {}

        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                getString(R.string.alarm_channel_name),
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(getString(R.string.alarm_channel_description));
        channel.setBypassDnd(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

        // Vibration pattern required for high-priority heads-up / full-screen classification
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{ 0, 800, 400, 800 });

        // Set silent tone with USAGE_ALARM so Android OS permits fullScreenIntent to launch
        // over lockscreen without producing audio conflict with FocusAlarmSound
        try {
            Uri silentUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.silent_alarm);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            channel.setSound(silentUri, audioAttributes);
        } catch (Exception e) {
            Log.w(TAG, "Failed to bind silent_alarm raw sound to channel", e);
        }

        nm.createNotificationChannel(channel);
    }

    private int pendingIntentFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return flags;
    }

    private Notification buildNotification(String title, String body) {
        Intent fullScreenIntent = new Intent(this, FocusAlarmActivity.class);
        fullScreenIntent.putExtra(FocusAlarmReceiver.EXTRA_TITLE, title);
        fullScreenIntent.putExtra(FocusAlarmReceiver.EXTRA_BODY, body);
        fullScreenIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                        | Intent.FLAG_ACTIVITY_CLEAR_TOP
                        | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );

        PendingIntent fullScreenPending = PendingIntent.getActivity(
                this,
                FocusAlarmReceiver.REQUEST_CODE + 2,
                fullScreenIntent,
                pendingIntentFlags()
        );

        Intent stopIntent = new Intent(this, FocusAlarmReceiver.class);
        stopIntent.setAction(FocusAlarmReceiver.ACTION_STOP_ALARM);
        PendingIntent stopPending = PendingIntent.getBroadcast(
                this,
                FocusAlarmReceiver.REQUEST_CODE + 3,
                stopIntent,
                pendingIntentFlags()
        );

        Uri silentUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/" + R.raw.silent_alarm);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setOngoing(true)
                .setAutoCancel(false)
                .setVibrate(new long[]{ 0, 800, 400, 800 })
                .setSound(silentUri)
                .setContentIntent(fullScreenPending)
                .setFullScreenIntent(fullScreenPending, true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "توقف زنگ", stopPending);

        return builder.build();
    }

    private void stopAlarm() {
        Log.i(TAG, "stopAlarm invoked in service");
        FocusAlarmSound.getInstance().stop();
        try {
            stopForeground(true);
        } catch (Exception ignored) {
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        FocusAlarmSound.getInstance().stop();
        super.onDestroy();
    }

    public static void stop(Context context) {
        try {
            FocusAlarmSound.getInstance().stop();
            Intent intent = new Intent(context, FocusAlarmService.class);
            intent.setAction(ACTION_STOP);
            context.startService(intent);
        } catch (Exception ignored) {
            try {
                context.stopService(new Intent(context, FocusAlarmService.class));
            } catch (Exception ignored2) {
            }
        }
    }
}
