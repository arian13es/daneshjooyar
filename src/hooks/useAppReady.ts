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

    let fadeTimer: ReturnType<typeof setTimeout>;
    let removeTimer: ReturnType<typeof setTimeout>;

    // Ensure DOM is fully painted by the browser compositor before starting transition
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fadeTimer = setTimeout(() => {
          const splashOverlay = document.querySelector("#native-splash .splash-overlay");
          if (splashOverlay) {
            splashOverlay.classList.add("is-fading");
          }
          setIsAppReady(true);
        }, 1250);

        removeTimer = setTimeout(() => {
          const nativeSplash = document.getElementById("native-splash");
          if (nativeSplash) {
            nativeSplash.remove();
          }
          setHasProfile(!!safeStorageGetString("tabriz_profile_v2", ""));
        }, 1900);
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return { isAppReady, hasProfile, setHasProfile };
}
