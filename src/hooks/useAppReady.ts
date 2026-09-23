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

    const fadeTimer = setTimeout(() => {
      const splashOverlay = document.querySelector("#native-splash .splash-overlay");
      if (splashOverlay) {
        splashOverlay.classList.add("is-fading");
      }
      setIsAppReady(true);
    }, 2200);

    const removeTimer = setTimeout(() => {
      const nativeSplash = document.getElementById("native-splash");
      if (nativeSplash) {
        nativeSplash.remove();
      }
      setHasProfile(!!safeStorageGetString("tabriz_profile_v2", ""));
    }, 2850);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return { isAppReady, hasProfile, setHasProfile };
}
