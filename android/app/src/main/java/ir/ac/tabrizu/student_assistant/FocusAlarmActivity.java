package ir.ac.tabrizu.student_assistant;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import java.util.Calendar;
import java.util.Locale;

/**
 * Full-screen alarm screen shown when a focus session ends — the same pattern
 * the stock Clock app uses: it turns the screen on, appears above the lock
 * screen, and keeps sounding until the user acknowledges it.
 *
 * This is a plain Activity on purpose. Extending BridgeActivity would spin up a
 * whole WebView just to draw three text views and a button, which would both
 * slow the alert down and waste memory while the phone is alarming.
 */
public class FocusAlarmActivity extends Activity {

    private TextView clockView;
    private FocusAlarmSound sound;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            updateClock();
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_focus_alarm);

        // Show over the lock screen and turn the display on.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

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

        titleView.setText(title);
        bodyView.setText(body);
        updateClock();

        dismiss.setOnClickListener(v -> dismissAlarm());
    }

    private void updateClock() {
        if (clockView == null) return;
        Calendar c = Calendar.getInstance();
        String hh = String.format(Locale.US, "%02d", c.get(Calendar.HOUR_OF_DAY));
        String mm = String.format(Locale.US, "%02d", c.get(Calendar.MINUTE));
        clockView.setText(toPersianDigits(hh + ":" + mm));
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

    private void dismissAlarm() {
        if (sound != null) sound.stop();
        FocusAlarmService.stop(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            finishAndRemoveTask();
        } else {
            finish();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Take over the alarm from the fallback service so the two never ring
        // over each other, and keep ringing until the user stops it.
        FocusAlarmService.stop(this);
        if (sound == null) sound = FocusAlarmSound.create();
        sound.start(this);

        handler.removeCallbacks(ticker);
        handler.post(ticker);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(ticker);
        if (sound != null) sound.stop();
    }

    @Override
    public void onBackPressed() {
        // The alarm must be acknowledged explicitly, never dismissed by accident.
        View root = findViewById(R.id.alarm_root);
        if (root != null) {
            root.announceForAccessibility(getString(R.string.alarm_hint));
        }
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(ticker);
        if (sound != null) sound.stop();
        super.onDestroy();
    }
}
