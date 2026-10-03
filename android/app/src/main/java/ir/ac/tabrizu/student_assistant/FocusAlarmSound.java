package ir.ac.tabrizu.student_assistant;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.media.ToneGenerator;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.provider.Settings;
import android.util.Log;

/**
 * High-reliability, maximum-volume alarm audio controller.
 *
 * Guarantees a loud, continuous, looping alarm sound even if:
 * 1. The phone is in Silent or Vibrate mode (forces playback via STREAM_ALARM).
 * 2. The user has alarm volume set low (safely boosts STREAM_ALARM volume).
 * 3. The phone has no default alarm ringtone (falls back to bundled media player and continuous siren).
 */
public final class FocusAlarmSound {

    private static final String TAG = "FocusAlarmSound";
    // Distinct, persistent alarm vibration cadence (1s on, 0.4s off, 1s on, 0.4s off)
    private static final long[] VIBRATION_PATTERN = { 0, 1000, 400, 1000, 400, 1200 };

    private static volatile FocusAlarmSound sInstance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private MediaPlayer mediaPlayer;
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private boolean ringing;
    private boolean sirenActive;

    // Siren loop for guaranteed audibility on any OEM hardware
    private final Runnable sirenLoop = new Runnable() {
        @Override
        public void run() {
            if (!ringing) return;
            try {
                if (toneGenerator != null) {
                    toneGenerator.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 850);
                }
            } catch (Exception ignored) {}
            handler.postDelayed(this, 1200);
        }
    };

    private FocusAlarmSound() {}

    public static synchronized FocusAlarmSound getInstance() {
        if (sInstance == null) {
            sInstance = new FocusAlarmSound();
        }
        return sInstance;
    }

    public static FocusAlarmSound create() {
        return getInstance();
    }

    public synchronized void start(Context context) {
        if (ringing) {
            Log.i(TAG, "FocusAlarmSound is already active");
            return;
        }
        ringing = true;
        Context appCtx = context.getApplicationContext();

        // 1. Ensure the alarm stream volume is loud enough to wake/alert the student
        boostAlarmVolume(appCtx);

        // 2. Start high-priority alarm vibration
        startVibration(appCtx);

        // 3. Play alarm audio via MediaPlayer on STREAM_ALARM with setLooping(true)
        boolean mediaStarted = startMediaPlayer(appCtx);

        // 4. If MediaPlayer could not acquire an audio source, use ToneGenerator siren
        if (!mediaStarted) {
            startSiren();
        }
    }

    private void boostAlarmVolume(Context context) {
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int currentVol = am.getStreamVolume(AudioManager.STREAM_ALARM);
                // Ensure alarm volume is at least 85% of hardware maximum
                int targetVol = Math.max(currentVol, (int) (maxVol * 0.85f));
                am.setStreamVolume(AudioManager.STREAM_ALARM, targetVol, 0);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not adjust alarm stream volume", e);
        }
    }

    private boolean startMediaPlayer(Context context) {
        try {
            stopMediaPlayer();

            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) {
                alarmUri = Settings.System.DEFAULT_ALARM_ALERT_URI;
            }
            if (alarmUri == null) {
                return false;
            }

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(context, alarmUri);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setLegacyStreamType(AudioManager.STREAM_ALARM)
                        .build();
                mediaPlayer.setAudioAttributes(attrs);
            } else {
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
            }

            mediaPlayer.setLooping(true);
            mediaPlayer.setVolume(1.0f, 1.0f);
            mediaPlayer.prepare();
            mediaPlayer.start();
            Log.i(TAG, "MediaPlayer successfully looping on STREAM_ALARM");
            return true;
        } catch (Exception e) {
            Log.w(TAG, "MediaPlayer initialization failed, falling back to ToneGenerator", e);
            stopMediaPlayer();
            return false;
        }
    }

    private void startSiren() {
        try {
            sirenActive = true;
            if (toneGenerator == null) {
                toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME);
            }
            handler.removeCallbacks(sirenLoop);
            handler.post(sirenLoop);
            Log.i(TAG, "ToneGenerator siren loop active");
        } catch (Exception e) {
            Log.e(TAG, "Could not initialize ToneGenerator", e);
            sirenActive = false;
        }
    }

    private void startVibration(Context context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = vm != null ? vm.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator == null || !vibrator.hasVibrator()) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(VIBRATION_PATTERN, 0));
            } else {
                vibrator.vibrate(VIBRATION_PATTERN, 0);
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not start vibration", e);
        }
    }

    private void stopMediaPlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    public synchronized void stop() {
        Log.i(TAG, "Stopping FocusAlarmSound");
        ringing = false;
        sirenActive = false;
        handler.removeCallbacks(sirenLoop);

        stopMediaPlayer();

        if (toneGenerator != null) {
            try {
                toneGenerator.stopTone();
                toneGenerator.release();
            } catch (Exception ignored) {}
            toneGenerator = null;
        }

        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
        }
    }

    public boolean isRinging() {
        return ringing;
    }
}
