package ir.ac.tabrizu.student_assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
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
 * alarm sounding and posts a high-importance notification the user can tap. When
 * the activity does come up it calls {@link #stop(Context)}, so the two never
 * ring at the same time.
 */
public class FocusAlarmService extends Service {

    public static final String CHANNEL_ID = "focus_alarm_fullscreen_v1";
    public static final int NOTIFICATION_ID = 8891;

    private FocusAlarmSound sound;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sound = FocusAlarmSound.create();
        sound.start(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null ? intent.getStringExtra(FocusAlarmReceiver.EXTRA_TITLE) : null;
        String body = intent != null ? intent.getStringExtra(FocusAlarmReceiver.EXTRA_BODY) : null;
        if (title == null) title = getString(R.string.alarm_default_title);
        if (body == null) body = getString(R.string.alarm_default_body);

        createChannel();
        try {
            startForeground(NOTIFICATION_ID, buildNotification(title, body));
        } catch (Exception ignored) {
            // If the OS refuses the foreground promotion we still ring.
        }
        return START_NOT_STICKY;
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
        nm.createNotificationChannel(channel);
    }

    private Notification buildNotification(String title, String body) {
        Intent openIntent = new Intent(this, FocusAlarmActivity.class);
        openIntent.putExtra(FocusAlarmReceiver.EXTRA_TITLE, title);
        openIntent.putExtra(FocusAlarmReceiver.EXTRA_BODY, body);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent =
                PendingIntent.getActivity(this, FocusAlarmReceiver.REQUEST_CODE, openIntent, piFlags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(body)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(contentIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build();
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
