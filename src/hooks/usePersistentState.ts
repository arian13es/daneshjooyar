import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { safeStorageGet, safeStorageSet } from "../utils/storageUtils";

export function usePersistentState<T>(
  key: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => safeStorageGet<T>(key, fallback));
  const isMountedRef = useRef(false);
  const latestValueRef = useRef(value);
  const isPendingRef = useRef(false);
  latestValueRef.current = value;

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    isPendingRef.current = true;
    const timer = setTimeout(() => {
      safeStorageSet(key, latestValueRef.current);
      isPendingRef.current = false;
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [key, value]);

  useEffect(() => {
    return () => {
      if (isPendingRef.current) {
        safeStorageSet(key, latestValueRef.current);
      }
    };
  }, [key]);

  return [value, setValue];
}
