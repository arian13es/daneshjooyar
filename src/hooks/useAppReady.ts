import { useState, useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { safeStorageGetString } from "../utils/storageUtils";

/** Duration of the CSS cross-dissolve transition in milliseconds */
const SPLASH_FADE_MS = 450;
/** Duration the motion logo plays before dissolving smoothly */
const SPLASH_MIN_VISIBLE_MS = 650;
/** Failsafe maximum wait duration */
const SPLASH_MAX_WAIT_MS = 1500;

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

    let minVisibleTimer: ReturnType<typeof setTimeout> | undefined;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    let started = false;

    const beginEntrance = () => {
      if (started) return;
      started = true;
      if (minVisibleTimer) clearTimeout(minVisibleTimer);

      requestAnimationFrame(() => {
        const splashOverlay = document.querySelector("#native-splash .splash-overlay");
        if (splashOverlay) {
          splashOverlay.classList.add("is-fading");
        }

        // Defer React re-render until CSS transition finishes so JS does not compete with GPU fade
        removeTimer = setTimeout(() => {
          setIsAppReady(true);
          const el = document.getElementById("native-splash");
          if (el) {
            el.style.display = "none";
            el.remove();
          }
        }, SPLASH_FADE_MS + 40);
      });
    };

    minVisibleTimer = setTimeout(beginEntrance, SPLASH_MIN_VISIBLE_MS);

    return () => {
      if (minVisibleTimer) clearTimeout(minVisibleTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, []);

  return { isAppReady, hasProfile, setHasProfile };
}

