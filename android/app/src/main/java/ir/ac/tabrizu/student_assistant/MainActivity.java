package ir.ac.tabrizu.student_assistant;

import android.app.AlarmManager;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.Manifest;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(NativeNotificationHelperPlugin.class);
        super.onCreate(savedInstanceState);
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }


    @CapacitorPlugin(
        name = "NativeNotificationHelper",
        permissions = {
            @Permission(
                alias = "storage",
                strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.READ_EXTERNAL_STORAGE }
            )
        }
    )
    public static class NativeNotificationHelperPlugin extends Plugin {

    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Context ctx = getContext();
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            boolean isIgnoring = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && pm != null) {
                isIgnoring = pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
            }
            ret.put("isIgnoring", isIgnoring);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("isIgnoring", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        try {
            Context ctx = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent();
                String packageName = ctx.getPackageName();
                PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                    intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(intent);
                }
            }
            call.resolve();
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception ex) {
                call.reject(ex.getMessage());
            }
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName());
            } else {
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            Context ctx = getContext();
            boolean canSchedule = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
                if (am != null) {
                    canSchedule = am.canScheduleExactAlarms();
                }
            }
            ret.put("canSchedule", canSchedule);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("canSchedule", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void openAutoStartSettings(PluginCall call) {
        Context ctx = getActivity() != null ? getActivity() : getContext();
        String pkg = ctx.getPackageName();
        boolean opened = false;

        // 1. Try Xiaomi / MIUI permission editor
        try {
            Intent intent = new Intent("miui.intent.action.APP_PERM_EDITOR");
            intent.setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity");
            intent.putExtra("extra_pkgname", pkg);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            opened = true;
        } catch (Exception ignored) {}

        // 2. Try Xiaomi auto-start direct component
        if (!opened) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                intent.putExtra("extra_pkgname", pkg);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
                opened = true;
            } catch (Exception ignored) {}
        }

        // 3. Try Huawei startup manager
        if (!opened) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
                opened = true;
            } catch (Exception ignored) {}
        }

        // 3.5. Try Samsung One UI Device Care Battery Manager
        if (!opened) {
            String[] samsungComponents = {
                "com.samsung.android.sm.ui.battery.AppSleepListActivity",
                "com.samsung.android.sm.battery.ui.BatteryActivity",
                "com.samsung.android.sm.ui.battery.BatteryActivity"
            };
            for (String comp : samsungComponents) {
                try {
                    Intent intent = new Intent();
                    intent.setComponent(new ComponentName("com.samsung.android.sm", comp));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(intent);
                    opened = true;
                    break;
                } catch (Exception ignored) {}
            }
        }

        // 4. Guaranteed universal standard fallback: App Info screen
        if (!opened) {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", pkg, null));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
                opened = true;
            } catch (Exception ex) {
                call.reject(ex.getMessage());
                return;
            }
        }

        call.resolve();
    }

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        try {
            Context ctx = getContext();
            SharedPreferences prefs = ctx.getSharedPreferences(StudentAppWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            String classTitle = call.getString("classTitle", "کلاس فعالی برای امروز نیست");
            String classTime = call.getString("classTime", "--:--");
            String classLocation = call.getString("classLocation", "");
            String examTitle = call.getString("examTitle", "امتحان ثبت‌نشده");
            String examDate = call.getString("examDate", "--");
            String todayDate = call.getString("todayDate", "امروز");

            editor.putString("class_title", classTitle);
            editor.putString("class_time", classTime);
            editor.putString("class_location", classLocation);
            editor.putString("exam_title", examTitle);
            editor.putString("exam_date", examDate);
            editor.putString("today_date", todayDate);
            editor.apply();

            StudentAppWidgetProvider.updateAllWidgets(ctx);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openSystemMusicPlayer(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent = Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_MUSIC);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Intent.ACTION_VIEW);
                fallback.setDataAndType(Uri.parse("content://media/external/audio/media"), "audio/*");
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception ex) {
                call.reject("Music player could not be launched: " + ex.getMessage());
            }
        }
    }

    @PermissionCallback
    private void saveImagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            saveImageToDownloads(call);
        } else {
            call.reject("مجوز دسترسی به حافظه برای ذخیره تصویر اعطا نشد.");
        }
    }

    /**
     * Decodes a base64 PNG and saves it into the public Downloads folder so the
     * user gets a real file (not just an "open" preview). Uses MediaStore on
     * Android 10+ (scoped storage, no permission needed) and a direct write on
     * older devices (with runtime permission validation).
     */
    @PluginMethod
    public void saveImageToDownloads(PluginCall call) {
        String base64Data = call.getString("base64");
        String fileName = call.getString("fileName", "barnameh-tabrizu.png");
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("No image data provided");
            return;
        }

        // On Android 9 and lower (API <= 28), WRITE_EXTERNAL_STORAGE is a dangerous runtime permission
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            if (getPermissionState("storage") != PermissionState.GRANTED) {
                requestPermissionForAlias("storage", call, "saveImagePermissionCallback");
                return;
            }
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            Context ctx = getContext();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = ctx.getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "image/png");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                Uri collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                Uri itemUri = resolver.insert(collection, values);
                if (itemUri == null) {
                    call.reject("Could not create Downloads entry");
                    return;
                }
                try (OutputStream os = resolver.openOutputStream(itemUri)) {
                    if (os == null) {
                        call.reject("Could not open output stream");
                        return;
                    }
                    os.write(bytes);
                    os.flush();
                }
                JSObject ret = new JSObject();
                ret.put("uri", itemUri.toString());
                ret.put("path", Environment.DIRECTORY_DOWNLOADS + "/" + fileName);
                call.resolve(ret);
            } else {
                if (!Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState())) {
                    call.reject("حافظه خارجی در دسترس نیست یا در حالت فقط خواندنی است.");
                    return;
                }

                java.io.File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloads.exists() && !downloads.mkdirs()) {
                    call.reject("امکان ایجاد پوشه دانلودها در حافظه وجود ندارد.");
                    return;
                }

                java.io.File outFile = new java.io.File(downloads, fileName);
                try (java.io.FileOutputStream fos = new java.io.FileOutputStream(outFile)) {
                    fos.write(bytes);
                    fos.flush();
                }

                // Index with MediaScannerConnection & broadcast for broad Android 7-9 gallery compatibility
                try {
                    android.media.MediaScannerConnection.scanFile(
                        ctx,
                        new String[] { outFile.getAbsolutePath() },
                        new String[] { "image/png" },
                        null
                    );
                    Intent scan = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                    scan.setData(Uri.fromFile(outFile));
                    ctx.sendBroadcast(scan);
                } catch (Exception ignored) {}

                JSObject ret = new JSObject();
                ret.put("uri", Uri.fromFile(outFile).toString());
                ret.put("path", outFile.getAbsolutePath());
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Failed to save to Downloads: " + e.getMessage());
        }
    }
    @PluginMethod
    public void setSystemAlarm(PluginCall call) {
        try {
            int hour = call.getInt("hour", 0);
            int minute = call.getInt("minute", 0);
            String message = call.getString("message", "پایان زمان تمرکز");

            Context ctx = getContext();
            Intent intent = new Intent(android.provider.AlarmClock.ACTION_SET_ALARM);
            intent.putExtra(android.provider.AlarmClock.EXTRA_MESSAGE, message);
            intent.putExtra(android.provider.AlarmClock.EXTRA_HOUR, hour);
            intent.putExtra(android.provider.AlarmClock.EXTRA_MINUTES, minute);
            intent.putExtra(android.provider.AlarmClock.EXTRA_SKIP_UI, true);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (intent.resolveActivity(ctx.getPackageManager()) != null) {
                ctx.startActivity(intent);
                call.resolve();
            } else {
                call.reject("No alarm clock app found");
            }
        } catch (Exception e) {
            call.reject("Failed to set alarm: " + e.getMessage());
        }
    }

}

}
