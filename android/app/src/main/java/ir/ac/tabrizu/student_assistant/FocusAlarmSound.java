package ir.ac.tabrizu.student_assistant;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
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
 *
 * Two independent sound paths are used, because a device with no alarm tone
 * configured (common on emulators and some OEM builds) makes
 * RingtoneManager.getRingtone() return null — which previously produced exactly
 * one short, quiet blip and then silence:
 *   1. the user's configured alarm ringtone, looped;
 *   2. a synthesized two-tone alarm siren, which is guaranteed to be audible.
 */
public final class FocusAlarmSound {

    private static final long[] VIBRATION_PATTERN = { 0, 700, 400, 700, 400, 900 };
    private static final long SIREN_INTERVAL_MS = 900;

    private final Handler handler = new Handler(Looper.getMainLooper());

    private Ringtone ringtone;
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private boolean ringing;
    private boolean sirenOn;

    private final Runnable sirenTick = new Runnable() {
        @Override
        public void run() {
            if (!ringing) return;
            beep();
            handler.postDelayed(this, SIREN_INTERVAL_MS);
        }
    };

    private FocusAlarmSound() {
    }

    public static FocusAlarmSound create() {
        return new FocusAlarmSound();
    }

    public void start(Context context) {
        if (ringing) return;
        ringing = true;
        boolean toneStarted = startRingtone(context);
        startVibration(context);
        if (!toneStarted) {
            // No usable system alarm tone: drive the synthesized siren instead.
            startSiren();
        }
    }

    /** @return true when a looping system ringtone actually started. */
    private boolean startRingtone(Context context) {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) return false;

            ringtone = RingtoneManager.getRingtone(context.getApplicationContext(), alarmUri);
            if (ringtone == null) return false;

            ringtone.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone.setLooping(true);
            }
            ringtone.play();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void startSiren() {
        try {
            if (toneGenerator == null) {
                toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME);
            }
        } catch (Exception e) {
            toneGenerator = null;
        }
        sirenOn = true;
        handler.removeCallbacks(sirenTick);
        handler.post(sirenTick);
    }

    /** Alternates two tones so it reads as an alarm rather than a notification. */
    private void beep() {
        if (toneGenerator == null) return;
        try {
            toneGenerator.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 420);
            handler.postDelayed(() -> {
                if (!ringing || toneGenerator == null) return;
                try {
                    toneGenerator.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 420);
                } catch (Exception ignored) {
                }
            }, 460);
        } catch (Exception ignored) {
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
        handler.removeCallbacks(sirenTick);
        try {
            if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        } catch (Exception ignored) {
        }
        if (sirenOn && toneGenerator != null) {
            try {
                toneGenerator.stopTone();
            } catch (Exception ignored) {
            }
        }
        sirenOn = false;
        try {
            if (vibrator != null) vibrator.cancel();
        } catch (Exception ignored) {
        }
        ringtone = null;
        vibrator = null;
    }

    /** Releases the ToneGenerator; call only when the alarm is fully finished. */
    public void release() {
        stop();
        if (toneGenerator != null) {
            try {
                toneGenerator.release();
            } catch (Exception ignored) {
            }
            toneGenerator = null;
        }
    }

    public boolean isRinging() {
        return ringing;
    }
}
