import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { safeStorageGet, safeStorageSet } from "../utils/storageUtils";

export function usePersistentState<T>(
  key: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => safeStorageGet<T>(key, fallback));
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    safeStorageSet(key, value);
  }, [key, value]);

  return [value, setValue];
}
