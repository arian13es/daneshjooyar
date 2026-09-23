import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { safeStorageSet, safeStorageGetString } from "../utils/storageUtils";

export function useAppTheme(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = safeStorageGetString("tabriz_theme_v3", "light");
    return saved === "dark";
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      safeStorageSet("tabriz_theme_v3", "dark");
      if (metaTheme) metaTheme.setAttribute("content", "#0f172a");
      if (Capacitor.isNativePlatform()) {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: "#0f172a" }).catch(() => {});
      }
    } else {
      document.documentElement.classList.remove("dark");
      safeStorageSet("tabriz_theme_v3", "light");
      if (metaTheme) metaTheme.setAttribute("content", "#f8fafc");
      if (Capacitor.isNativePlatform()) {
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        StatusBar.setBackgroundColor({ color: "#f8fafc" }).catch(() => {});
      }
    }
  }, [isDarkMode]);

  return [isDarkMode, setIsDarkMode];
}
