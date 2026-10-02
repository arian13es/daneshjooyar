package ir.ac.tabrizu.student_assistant;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
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
import android.provider.Settings;
import android.util.Log;

/**
 * Singleton alarm audio and haptics controller.
 * Plays the device's actual alarm ringtone with USAGE_ALARM (full alarm stream volume,
 * bypassing silent/vibrate mode just like the system Clock app).
 * Avoids any rapid notification-like beeps; sounds exactly like a legitimate Clock alarm.
 */
public final class FocusAlarmSound {

    private static final String TAG = "FocusAlarmSound";
    // Steady, distinct alarm vibration cadence (1s vibrate, 0.5s pause, 1s vibrate, 0.5s pause)
    private static final long[] VIBRATION_PATTERN = { 0, 1000, 500, 1000, 500, 1200 };

    private static volatile FocusAlarmSound sInstance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Ringtone ringtone;
    private MediaPlayer mediaPlayer;
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private boolean ringing;
    private boolean toneLoopActive;

    // Watchdog to guarantee continuous playback on Android versions where Ringtone looping is not native
    private final Runnable ringtoneWatchdog = new Runnable() {
        @Override
        public void run() {
            if (!ringing) return;
            try {
                if (ringtone != null && !ringtone.isPlaying()) {
                    ringtone.play();
                }
            } catch (Exception ignored) {}
            handler.postDelayed(this, 1200);
        }
    };

    // Melodic synthesized alarm fallback if no system ringtone exists at all
    private final Runnable alarmToneLoop = new Runnable() {
        @Override
        public void run() {
            if (!ringing || toneGenerator == null) return;
            try {
                toneGenerator.startTone(ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK, 700);
            } catch (Exception ignored) {}
            handler.postDelayed(this, 1500);
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
            Log.i(TAG, "FocusAlarmSound is already ringing; skipping redundant start");
            return;
        }
        ringing = true;
        Log.i(TAG, "Starting Clock-style alarm audio and vibration");

        startVibration(context.getApplicationContext());

        // 1. Try system Ringtone first (highest compatibility with OEM alarm sounds)
        boolean started = startRingtone(context.getApplicationContext());

        // 2. Fallback to MediaPlayer with default system alarm URI
        if (!started) {
            started = startMediaPlayer(context.getApplicationContext());
        }

        // 3. Fallback to synthesized melody ToneGenerator if all else fails
        if (!started) {
            startSynthesizedAlarm();
        }
    }

    private boolean startRingtone(Context context) {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) {
                alarmUri = Settings.System.DEFAULT_ALARM_ALERT_URI;
            }
            if (alarmUri == null) return false;

            ringtone = RingtoneManager.getRingtone(context, alarmUri);
            if (ringtone == null) return false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                ringtone.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone.setLooping(true);
            }

            ringtone.play();
            handler.removeCallbacks(ringtoneWatchdog);
            handler.postDelayed(ringtoneWatchdog, 1500);
            Log.i(TAG, "Playing alarm via RingtoneManager");
            return true;
        } catch (Exception e) {
            Log.w(TAG, "RingtoneManager playback failed", e);
            ringtone = null;
            return false;
        }
    }

    private boolean startMediaPlayer(Context context) {
        try {
            stopMediaPlayer();
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (alarmUri == null) return false;

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(context, alarmUri);
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mediaPlayer.setLooping(true);
            mediaPlayer.setVolume(1.0f, 1.0f);
            mediaPlayer.prepare();
            mediaPlayer.start();
            Log.i(TAG, "Playing alarm via MediaPlayer");
            return true;
        } catch (Exception e) {
            Log.w(TAG, "MediaPlayer fallback failed", e);
            stopMediaPlayer();
            return false;
        }
    }

    private void startSynthesizedAlarm() {
        try {
            if (toneGenerator == null) {
                toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME);
            }
            toneLoopActive = true;
            handler.removeCallbacks(alarmToneLoop);
            handler.post(alarmToneLoop);
            Log.i(TAG, "Playing synthesized alarm melody via ToneGenerator");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start synthesized tone generator", e);
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
            Log.w(TAG, "Vibration failed to start", e);
        }
    }

    public synchronized void stop() {
        Log.i(TAG, "FocusAlarmSound stop requested");
        ringing = false;
        handler.removeCallbacks(ringtoneWatchdog);
        handler.removeCallbacks(alarmToneLoop);

        if (ringtone != null) {
            try {
                if (ringtone.isPlaying()) {
                    ringtone.stop();
                }
            } catch (Exception ignored) {}
            ringtone = null;
        }

        stopMediaPlayer();

        if (toneLoopActive && toneGenerator != null) {
            try {
                toneGenerator.stopTone();
            } catch (Exception ignored) {}
        }
        toneLoopActive = false;

        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
            vibrator = null;
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

    public synchronized void release() {
        stop();
        if (toneGenerator != null) {
            try {
                toneGenerator.release();
            } catch (Exception ignored) {}
            toneGenerator = null;
        }
    }

    public synchronized boolean isRinging() {
        return ringing;
    }
}
