import { useState, useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { safeStorageGetString } from "../utils/storageUtils";

/** Duration of the CSS cross-dissolve transition in milliseconds */
const SPLASH_FADE_MS = 750;
/** Duration the motion logo plays before dissolving smoothly */
const SPLASH_MIN_VISIBLE_MS = 1350;
/** Failsafe maximum wait duration */
const SPLASH_MAX_WAIT_MS = 2500;

export function useAppReady(): {
  isAppReady: boolean;
  hasProfile: boolean;
  setHasProfile: (v: boolean) => void;
} {
  const [isAppReady, setIsAppReady] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean>(() => {
    return !!safeStorageGetString("tabriz_profile_v2", "");
  });

  useEffect(() => {
    // Immediately dismiss the OS native splash so the HTML motion logo is visible from frame 1
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 100 }).catch(() => {});
    }

    const mountedAt = Date.now();
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let minVisibleTimer: ReturnType<typeof setTimeout> | undefined;
    let maxWaitTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    let rafId: number | undefined;
    let started = false;

    const isAppMounted = () =>
      Boolean((window as unknown as { __APP_MOUNTED__?: boolean }).__APP_MOUNTED__);

    const beginEntrance = () => {
      if (started) return;
      started = true;
      if (pollTimer) clearInterval(pollTimer);
      if (minVisibleTimer) clearTimeout(minVisibleTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);

      rafId = requestAnimationFrame(() => {
        const splashOverlay = document.querySelector("#native-splash .splash-overlay");
        if (splashOverlay) {
          splashOverlay.classList.add("is-fading");
        }
        setIsAppReady(true);

        removeTimer = setTimeout(() => {
          const el = document.getElementById("native-splash");
          if (el) {
            el.style.display = "none";
            el.remove();
          }
        }, SPLASH_FADE_MS + 60);
      });
    };

    const requestEntranceWhenAllowed = () => {
      const elapsed = Date.now() - mountedAt;
      const remaining = SPLASH_MIN_VISIBLE_MS - elapsed;
      if (remaining > 0) {
        if (!minVisibleTimer) {
          minVisibleTimer = setTimeout(() => {
            minVisibleTimer = undefined;
            if (isAppMounted()) beginEntrance();
          }, remaining);
        }
        return;
      }
      beginEntrance();
    };

    pollTimer = setInterval(() => {
      if (isAppMounted()) requestEntranceWhenAllowed();
    }, 16);

    maxWaitTimer = setTimeout(beginEntrance, SPLASH_MAX_WAIT_MS);

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (minVisibleTimer) clearTimeout(minVisibleTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      if (removeTimer) clearTimeout(removeTimer);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  return { isAppReady, hasProfile, setHasProfile };
}

