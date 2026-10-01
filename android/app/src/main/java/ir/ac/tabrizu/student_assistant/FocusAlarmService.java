package ir.ac.tabrizu.student_assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

/**
 * Fallback path for the focus alarm.
 *
 * The full-screen {@link FocusAlarmActivity} is the primary alert. Some OEM
 * builds refuse background activity starts, so this foreground service keeps the
 * alarm sounding and posts a high-importance notification carrying a
 * full-screen intent. When the activity does come up it calls
 * {@link #stop(Context)}, so the two never ring at the same time.
 *
 * The service type must be {@code alarm}: Android 14+ throws
 * IllegalArgumentException from startForeground() when the runtime type does not
 * match the manifest, which silently killed the alert on those devices.
 */
public class FocusAlarmService extends Service {

    public static final String CHANNEL_ID = "focus_alarm_fullscreen_v1";
    public static final int NOTIFICATION_ID = 8891;

    private FocusAlarmSound sound;
    private boolean foregroundStarted;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sound = FocusAlarmSound.create();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null ? intent.getStringExtra(FocusAlarmReceiver.EXTRA_TITLE) : null;
        String body = intent != null ? intent.getStringExtra(FocusAlarmReceiver.EXTRA_BODY) : null;
        if (title == null) title = getString(R.string.alarm_default_title);
        if (body == null) body = getString(R.string.alarm_default_body);

        createChannel();
        promoteToForeground(title, body);

        // Ring even if the foreground promotion was refused.
        if (sound != null) sound.start(this);

        return START_NOT_STICKY;
    }

    private void promoteToForeground(String title, String body) {
        if (foregroundStarted) return;
        Notification notification = buildNotification(title, body);
        try {
            if (Build.VERSION.SDK_INT >= 34 /* Build.VERSION_CODES.UPSIDE_DOWN_CAKE */) {
                // The runtime type MUST match android:foregroundServiceType in
                // the manifest on Android 14+. Passing this on Android 10-13 throws
                // IllegalArgumentException because SHORT_SERVICE was introduced in API 34.
                startForeground(
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE
                );
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            foregroundStarted = true;
        } catch (Exception e) {
            // Some OEM builds refuse the promotion; post a normal notification
            // so the ring is still reachable, and the ringtone keeps playing.
            try {
                NotificationManager nm = getSystemService(NotificationManager.class);
                if (nm != null) nm.notify(NOTIFICATION_ID, notification);
            } catch (Exception ignored) {
            }
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                getString(R.string.alarm_channel_name),
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(getString(R.string.alarm_channel_description));
        channel.setBypassDnd(true);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 700, 400, 700, 400, 900 });
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

    private int pendingIntentFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return flags;
    }

    private Notification buildNotification(String title, String body) {
        Intent openIntent = new Intent(this, FocusAlarmActivity.class);
        openIntent.putExtra(FocusAlarmReceiver.EXTRA_TITLE, title);
        openIntent.putExtra(FocusAlarmReceiver.EXTRA_BODY, body);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
                this, FocusAlarmReceiver.REQUEST_CODE, openIntent, pendingIntentFlags());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(contentIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        // This is the supported way to raise a full-screen alarm from the
        // background on Android 10+; a bare startActivity() from a receiver is
        // blocked there, which is why the alarm screen never appeared.
        try {
            Intent fullScreenIntent = new Intent(this, FocusAlarmActivity.class);
            fullScreenIntent.putExtra(FocusAlarmReceiver.EXTRA_TITLE, title);
            fullScreenIntent.putExtra(FocusAlarmReceiver.EXTRA_BODY, body);
            fullScreenIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP
                            | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            );
            PendingIntent fullScreenPending = PendingIntent.getActivity(
                    this,
                    FocusAlarmReceiver.REQUEST_CODE + 1,
                    fullScreenIntent,
                    pendingIntentFlags()
            );
            builder.setFullScreenIntent(fullScreenPending, true);
        } catch (Exception ignored) {
            // Falls back to the heads-up notification above.
        }

        return builder.build();
    }

    @Override
    public void onDestroy() {
        if (sound != null) sound.stop();
        super.onDestroy();
    }

    public static void stop(Context context) {
        try {
            context.stopService(new Intent(context, FocusAlarmService.class));
        } catch (Exception ignored) {
        }
    }
}
