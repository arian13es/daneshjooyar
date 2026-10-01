import { useState, useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { safeStorageGetString } from "../utils/storageUtils";

export function useAppReady(): { isAppReady: boolean; hasProfile: boolean; setHasProfile: (v: boolean) => void } {
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean>(() => {
    return !!safeStorageGetString("tabriz_profile_v2", "");
  });

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
    }

    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    let rafId: number | undefined;
    let started = false;

    const beginEntrance = () => {
      if (started) return;
      started = true;
      if (pollTimer) clearInterval(pollTimer);
      // Wait for the browser compositor to settle, then fade the splash out.
      rafId = requestAnimationFrame(() => {
        const splashOverlay = document.querySelector("#native-splash .splash-overlay");
        if (splashOverlay) {
          splashOverlay.classList.add("is-fading");
        }
        setIsAppReady(true);
        // The overlay is removed only after its fade transition has finished.
        removeTimer = setTimeout(() => {
          const nativeSplash = document.getElementById("native-splash");
          if (nativeSplash) {
            nativeSplash.remove();
          }
          setHasProfile(!!safeStorageGetString("tabriz_profile_v2", ""));
        }, 650);
      });
    };

    // React sets window.__APP_MOUNTED__ right after createRoot().render(), so we
    // start the entrance as soon as the app is really on screen instead of
    // relying on a fixed delay. Polling is cheap and avoids a blank first paint
    // on slow devices; the fallback timer guarantees we never get stuck.
    pollTimer = setInterval(() => {
      if ((window as unknown as { __APP_MOUNTED__?: boolean }).__APP_MOUNTED__) {
        beginEntrance();
      }
    }, 16);
    fadeTimer = setTimeout(beginEntrance, 2500);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (removeTimer) clearTimeout(removeTimer);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  return { isAppReady, hasProfile, setHasProfile };
}
