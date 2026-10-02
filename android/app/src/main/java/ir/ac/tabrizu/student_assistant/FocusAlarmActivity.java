package ir.ac.tabrizu.student_assistant;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import androidx.core.content.res.ResourcesCompat;

import java.util.Calendar;
import java.util.Locale;

/**
 * Full-screen alarm activity displayed directly over the lockscreen.
 * Uses native Vazirmatn typography and applies lockscreen window flags before and after super.onCreate().
 * Acts identically to the native Android Clock application.
 */
public class FocusAlarmActivity extends Activity {

    private static final String TAG = "FocusAlarmActivity";
    private TextView clockView;
    private PowerManager.WakeLock screenWakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean isDismissed = false;

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            updateClock();
            handler.postDelayed(this, 1000);
        }
    };

    private final BroadcastReceiver dismissReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && FocusAlarmReceiver.ACTION_DISMISS_ACTIVITY.equals(intent.getAction())) {
                Log.i(TAG, "ACTION_DISMISS_ACTIVITY received, closing activity");
                dismissAlarm();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Crucial: Set window flags BEFORE super.onCreate() so WindowManager
        // assigns the lockscreen window tokens during the initial attachment phase.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }

        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                        | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                        | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                        | WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );

        super.onCreate(savedInstanceState);

        // Re-apply for devices requiring post-super execution
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            try {
                KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                if (km != null) {
                    km.requestDismissKeyguard(this, null);
                }
            } catch (Exception ignored) {
            }
        }

        // Keep screen bright while alarm is ringing
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                screenWakeLock = pm.newWakeLock(
                        PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                        "Daneshjooyar:AlarmScreenWakeLock"
                );
                screenWakeLock.acquire(10 * 60 * 1000L);
            }
        } catch (Exception e) {
            Log.w(TAG, "Screen wake lock failed", e);
        }

        setContentView(R.layout.activity_focus_alarm);

        String title = getIntent() != null
                ? getIntent().getStringExtra(FocusAlarmReceiver.EXTRA_TITLE)
                : null;
        String body = getIntent() != null
                ? getIntent().getStringExtra(FocusAlarmReceiver.EXTRA_BODY)
                : null;
        if (title == null) title = getString(R.string.alarm_default_title);
        if (body == null) body = getString(R.string.alarm_default_body);

        TextView titleView = findViewById(R.id.alarm_title);
        TextView bodyView = findViewById(R.id.alarm_body);
        clockView = findViewById(R.id.alarm_clock);
        Button dismiss = findViewById(R.id.alarm_dismiss);
        View root = findViewById(R.id.alarm_root);
        TextView tagView = findViewById(R.id.alarm_tag);
        TextView hintView = findViewById(R.id.alarm_hint);

        boolean isDark = getIntent() != null && getIntent().getBooleanExtra(FocusAlarmReceiver.EXTRA_IS_DARK_MODE, false);
        if (getIntent() == null || !getIntent().hasExtra(FocusAlarmReceiver.EXTRA_IS_DARK_MODE)) {
            try {
                isDark = getSharedPreferences("app_settings", MODE_PRIVATE).getBoolean("is_dark_mode", false);
            } catch (Exception ignored) {}
        }

        if (!isDark) {
            // Light Theme styling: clean slate/white background with dark legible typography
            if (root != null) root.setBackgroundColor(0xFFF8FAFC);
            if (clockView != null) clockView.setTextColor(0xFF0F172A);
            if (titleView != null) titleView.setTextColor(0xFF1E293B);
            if (bodyView != null) bodyView.setTextColor(0xFF475569);
            if (tagView != null) tagView.setTextColor(0xFF4338CA);
            if (hintView != null) hintView.setTextColor(0xFF64748B);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                int flags = getWindow().getDecorView().getSystemUiVisibility();
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                getWindow().getDecorView().setSystemUiVisibility(flags);
            }
        } else {
            // Dark Theme styling: luxury deep dark background
            if (root != null) root.setBackgroundColor(0xFF0A0F1D);
            if (clockView != null) clockView.setTextColor(0xFFFFFFFF);
            if (titleView != null) titleView.setTextColor(0xFFF1F5F9);
            if (bodyView != null) bodyView.setTextColor(0xFF94A3B8);
            if (tagView != null) tagView.setTextColor(0xFF818CF8);
            if (hintView != null) hintView.setTextColor(0xFF64748B);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                int flags = getWindow().getDecorView().getSystemUiVisibility();
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                getWindow().getDecorView().setSystemUiVisibility(flags);
            }
        }

        // Apply Vazirmatn typeface programmatically as guaranteed fallback
        try {
            Typeface vazirBold = ResourcesCompat.getFont(this, R.font.vazirmatn_bold);
            Typeface vazirReg = ResourcesCompat.getFont(this, R.font.vazirmatn);
            if (clockView != null && vazirBold != null) clockView.setTypeface(vazirBold);
            if (titleView != null && vazirBold != null) titleView.setTypeface(vazirBold);
            if (bodyView != null && vazirReg != null) bodyView.setTypeface(vazirReg);
            if (dismiss != null && vazirBold != null) dismiss.setTypeface(vazirBold);
            if (tagView != null && vazirBold != null) tagView.setTypeface(vazirBold);
            if (hintView != null && vazirReg != null) hintView.setTypeface(vazirReg);
        } catch (Exception e) {
            Log.w(TAG, "Could not load custom typeface font", e);
        }

        if (titleView != null) titleView.setText(title);
        if (bodyView != null) bodyView.setText(body);
        updateClock();

        if (dismiss != null) {
            dismiss.setOnClickListener(v -> dismissAlarm());
        }

        // Register receiver to finish this activity if the user taps "Stop" from notification
        IntentFilter filter = new IntentFilter(FocusAlarmReceiver.ACTION_DISMISS_ACTIVITY);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(dismissReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(dismissReceiver, filter);
        }

        // Ensure alarm sound is ringing
        FocusAlarmSound.getInstance().start(this);
    }

    private void updateClock() {
        if (clockView == null) return;
        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        int minute = cal.get(Calendar.MINUTE);
        String formatted = String.format(Locale.US, "%02d:%02d", hour, minute);
        clockView.setText(toPersianDigits(formatted));
    }

    private static String toPersianDigits(String input) {
        char[] persian = { '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹' };
        StringBuilder sb = new StringBuilder(input.length());
        for (char ch : input.toCharArray()) {
            if (ch >= '0' && ch <= '9') sb.append(persian[ch - '0']);
            else sb.append(ch);
        }
        return sb.toString();
    }

    private synchronized void dismissAlarm() {
        if (isDismissed) return;
        isDismissed = true;
        Log.i(TAG, "Dismissing alarm on user request");

        handler.removeCallbacks(ticker);

        // Stop sound immediately via singleton
        FocusAlarmSound.getInstance().stop();

        // Stop foreground service
        FocusAlarmService.stop(this);

        // Cancel receiver notifications and wake locks
        FocusAlarmReceiver.cancel(this);

        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            try {
                screenWakeLock.release();
            } catch (Exception ignored) {
            }
            screenWakeLock = null;
        }

        try {
            unregisterReceiver(dismissReceiver);
        } catch (Exception ignored) {
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            finishAndRemoveTask();
        } else {
            finish();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!isDismissed) {
            FocusAlarmSound.getInstance().start(this);
            handler.removeCallbacks(ticker);
            handler.post(ticker);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(ticker);
    }

    @Override
    public void onBackPressed() {
        // Prevent accidental dismissal via back button — must tap the big stop button
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(ticker);
        FocusAlarmSound.getInstance().stop();
        FocusAlarmService.stop(this);

        if (screenWakeLock != null && screenWakeLock.isHeld()) {
            try {
                screenWakeLock.release();
            } catch (Exception ignored) {
            }
            screenWakeLock = null;
        }
        try {
            unregisterReceiver(dismissReceiver);
        } catch (Exception ignored) {
        }
        super.onDestroy();
    }
}
