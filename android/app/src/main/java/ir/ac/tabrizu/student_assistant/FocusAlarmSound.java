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
import android.util.Log;

/**
 * Singleton alarm audio and haptics controller.
 * Guarantees that only one instance of MediaPlayer/Vibrator runs at any time,
 * and calling stop() from anywhere (Receiver, Activity, Notification) will
 * immediately silence the exact running alarm.
 */
public final class FocusAlarmSound {

    private static final String TAG = "FocusAlarmSound";
    private static final long[] VIBRATION_PATTERN = { 0, 800, 400, 800, 400, 1000 };
    private static final long SIREN_INTERVAL_MS = 800;

    private static volatile FocusAlarmSound sInstance;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private MediaPlayer mediaPlayer;
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

    public static synchronized FocusAlarmSound getInstance() {
        if (sInstance == null) {
            sInstance = new FocusAlarmSound();
        }
        return sInstance;
    }

    /** Backward compatibility alias */
    public static FocusAlarmSound create() {
        return getInstance();
    }

    public synchronized void start(Context context) {
        if (ringing) {
            Log.i(TAG, "FocusAlarmSound already ringing, ignoring redundant start");
            return;
        }
        ringing = true;
        Log.i(TAG, "Starting focus alarm sound and vibration (Singleton)");

        boolean mediaStarted = startMediaPlayer(context.getApplicationContext());
        startVibration(context.getApplicationContext());

        if (!mediaStarted) {
            Log.w(TAG, "MediaPlayer failed to start, falling back to ToneGenerator siren");
            startSiren();
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
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
            if (alarmUri == null) return false;

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(context, alarmUri);

            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(attrs);
            mediaPlayer.setLooping(true);
            mediaPlayer.setVolume(1.0f, 1.0f);

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error: what=" + what + " extra=" + extra);
                stopMediaPlayer();
                startSiren();
                return true;
            });

            mediaPlayer.prepare();
            mediaPlayer.start();
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Failed to start MediaPlayer for alarm", e);
            stopMediaPlayer();
            return false;
        }
    }

    private void stopMediaPlayer() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.reset();
                mediaPlayer.release();
            }
        } catch (Exception ignored) {
        } finally {
            mediaPlayer = null;
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

    private void beep() {
        if (toneGenerator == null) return;
        try {
            toneGenerator.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 400);
            handler.postDelayed(() -> {
                if (!ringing || toneGenerator == null) return;
                try {
                    toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 400);
                } catch (Exception ignored) {
                }
            }, 450);
        } catch (Exception ignored) {
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
            Log.w(TAG, "Vibration start failed", e);
        }
    }

    public synchronized void stop() {
        Log.i(TAG, "FocusAlarmSound stop requested");
        ringing = false;
        handler.removeCallbacks(sirenTick);
        stopMediaPlayer();

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
        vibrator = null;
    }

    public synchronized void release() {
        stop();
        if (toneGenerator != null) {
            try {
                toneGenerator.release();
            } catch (Exception ignored) {
            }
            toneGenerator = null;
        }
    }

    public synchronized boolean isRinging() {
        return ringing;
    }
}
