package ir.ac.tabrizu.student_assistant;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;

/**
 * Owns the audible + haptic side of the focus alarm.
 *
 * Both the alarm Activity and its fallback Service need this, so it lives in one
 * place and is started by exactly one of them at a time — otherwise the two
 * would play over each other.
 *
 * The sound deliberately uses {@link AudioAttributes#USAGE_ALARM}, which routes
 * it through the device's alarm volume. That is what lets it ring at full volume
 * while the phone is on silent or vibrate, the same way the stock Clock app does.
 */
public final class FocusAlarmSound {

    private static final long[] VIBRATION_PATTERN = { 0, 700, 400, 700, 400, 900 };

    private Ringtone ringtone;
    private Vibrator vibrator;
    private boolean ringing;

    private FocusAlarmSound() {
    }

    public static FocusAlarmSound create() {
        return new FocusAlarmSound();
    }

    public void start(Context context) {
        if (ringing) return;
        ringing = true;
        startSound(context);
        startVibration(context);
    }

    private void startSound(Context context) {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            if (alarmUri == null) return;

            ringtone = RingtoneManager.getRingtone(context.getApplicationContext(), alarmUri);
            if (ringtone == null) return;

            ringtone.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone.setLooping(true);
            }
            ringtone.play();
        } catch (Exception ignored) {
            // Vibration below is still attempted.
        }
    }

    private void startVibration(Context context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm =
                        (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator == null || !vibrator.hasVibrator()) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Repeat index 0 => loop the whole pattern until cancelled.
                vibrator.vibrate(VibrationEffect.createWaveform(VIBRATION_PATTERN, 0));
            } else {
                vibrator.vibrate(VIBRATION_PATTERN, 0);
            }
        } catch (Exception ignored) {
            // Vibration is a bonus, not a requirement.
        }
    }

    public void stop() {
        ringing = false;
        try {
            if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        } catch (Exception ignored) {
        }
        try {
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {
        }
        ringtone = null;
        vibrator = null;
    }

    public boolean isRinging() {
        return ringing;
    }
}
