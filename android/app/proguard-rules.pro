# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Preserve Capacitor Plugin & Native Bridges
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Preserve custom Tabriz University Assistant native plugins and widget provider
-keep class ir.ac.tabrizu.student_assistant.** { *; }
-keepclassmembers class ir.ac.tabrizu.student_assistant.MainActivity$NativeNotificationHelperPlugin {
    public *;
}
-keep class ir.ac.tabrizu.student_assistant.StudentAppWidgetProvider { *; }

# Preserve AndroidX and Core components
-keep class androidx.core.app.NotificationCompat** { *; }

# Preserve WebView JavaScript Interfaces
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**


