import { useState, useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { safeStorageGetString } from "../utils/storageUtils";

/** Duration of the CSS cross-dissolve transition in milliseconds */
const SPLASH_FADE_MS = 500;
/** Duration the motion logo plays before dissolving smoothly (spring settle) */
const SPLASH_MIN_VISIBLE_MS = 1100;

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

      const triggerFade = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
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
              setHasProfile(!!safeStorageGetString("tabriz_profile_v2", ""));
            }, SPLASH_FADE_MS + 50);
          });
        });
      };

      if (typeof document !== "undefined" && "fonts" in document) {
        document.fonts.ready.then(triggerFade).catch(triggerFade);
      } else {
        triggerFade();
      }
    };

    minVisibleTimer = setTimeout(beginEntrance, SPLASH_MIN_VISIBLE_MS);

    return () => {
      if (minVisibleTimer) clearTimeout(minVisibleTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, []);

  return { isAppReady, hasProfile, setHasProfile };
}
