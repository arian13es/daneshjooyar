package ir.ac.tabrizu.student_assistant;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

public class StudentAppWidgetProvider extends AppWidgetProvider {

    public static final String PREFS_NAME = "student_widget_data";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String className = prefs.getString("class_title", "کلاس فعالی برای امروز نیست");
        String classTime = prefs.getString("class_time", "--:--");
        String classLocation = prefs.getString("class_location", "");
        String examName = prefs.getString("exam_title", "امتحان ثبت‌نشده");
        String examDate = prefs.getString("exam_date", "--");
        String todayDate = prefs.getString("today_date", "امروز");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_student_assistant);
        views.setTextViewText(R.id.tv_widget_class_name, className);
        views.setTextViewText(R.id.tv_widget_class_time, classTime);
        views.setTextViewText(R.id.tv_widget_class_location, classLocation);
        views.setTextViewText(R.id.tv_widget_exam_name, examName);
        views.setTextViewText(R.id.tv_widget_exam_date, examDate);
        views.setTextViewText(R.id.tv_widget_date, todayDate);

        // Click to launch App
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName componentName = new ComponentName(context, StudentAppWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
}
