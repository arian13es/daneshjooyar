import { useState, useEffect } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";
import { safeStorageGetString } from "../utils/storageUtils";

/** Must stay in sync with the .splash-overlay opacity transition in index.html. */
const SPLASH_FADE_MS = 450;
/**
 * The logo intro in index.html runs for ~340ms. The splash is held on screen at
 * least this long so the animation is never cut off half-way, which made the
 * entrance look like it "stuttered" into the app.
 */
const SPLASH_MIN_VISIBLE_MS = 420;
/** Safety net: never keep the user on the splash for longer than this. */
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
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
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

    /**
     * Cross-dissolve: the splash stays on top while the app fades in underneath
     * it, then the splash dissolves away. Because the splash is painted above
     * the app in the same stacking context, there is never a blank frame.
     */
    const beginEntrance = () => {
      if (started) return;
      started = true;
      if (pollTimer) clearInterval(pollTimer);
      if (minVisibleTimer) clearTimeout(minVisibleTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);

      // Two frames: one to commit the app's mounted state, one to guarantee the
      // compositor has the app's first layer ready before we start dissolving.
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const splashOverlay = document.querySelector("#native-splash .splash-overlay");
          if (splashOverlay) {
            splashOverlay.classList.add("is-fading");
          }
          // Triggers the app's own opacity fade-in underneath the splash.
          setIsAppReady(true);

          removeTimer = setTimeout(() => {
            document.getElementById("native-splash")?.remove();
            setHasProfile(!!safeStorageGetString("tabriz_profile_v2", ""));
          }, SPLASH_FADE_MS + 60);
        });
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

    // React sets window.__APP_MOUNTED__ right after createRoot().render(), so the
    // entrance starts when the app is genuinely on screen rather than after a
    // fixed delay. Polling is cheap; the cap below guarantees we never stick.
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
