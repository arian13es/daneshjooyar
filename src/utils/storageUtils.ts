/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: storageUtils
 * Description: Type-safe, crash-resistant storage helpers. Guards against
 *   corrupt JSON on read (prevents White-Screen-of-Death at startup), against
 *   quota / private-mode write failures, AND against environments where
 *   localStorage is entirely blocked (Safari private mode, sandboxed WebViews,
 *   embedded preview iframes). In those cases it transparently falls back to an
 *   in-memory store so the app keeps working for the session instead of
 *   crashing or silently losing state.
 * ============================================================================
 */

// In-memory fallback used when localStorage is unavailable or throws.
const memoryStore: Record<string, string> = {};

// Whether the real localStorage is usable. Detected once, lazily.
let localStorageUsable: boolean | null = null;

function storageAvailable(): boolean {
  if (localStorageUsable !== null) return localStorageUsable;
  try {
    const probeKey = "__tabriz_storage_probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    localStorageUsable = true;
  } catch {
    console.warn(
      "[Storage] localStorage is unavailable (blocked or private mode). " +
        "Falling back to in-memory storage for this session.",
    );
    localStorageUsable = false;
  }
  return localStorageUsable;
}

/**
 * Reads a raw string from storage (localStorage if available, otherwise the
 * in-memory fallback). Never throws.
 */
function readRaw(key: string): string | null {
  if (storageAvailable()) {
    try {
      return localStorage.getItem(key);
    } catch {
      /* fall through to memory */
    }
  }
  return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
}

/**
 * Writes a raw string to storage (localStorage if available, otherwise the
 * in-memory fallback). Returns false only if both paths fail. Never throws.
 */
function writeRaw(key: string, value: string): boolean {
  if (storageAvailable()) {
    try {
      localStorage.setItem(key, value);
      // Mirror into memory so a mid-session storage revocation is harmless.
      memoryStore[key] = value;
      return true;
    } catch {
      /* fall through to memory */
    }
  }
  try {
    memoryStore[key] = value;
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and parses a JSON value from storage. Never throws: on a missing key,
 * an empty value, or a malformed/truncated JSON payload it returns the
 * supplied fallback instead of crashing the initial React render.
 */
export function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = readRaw(key);
    if (raw === null || raw === undefined || raw === "") return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[Storage] Corrupt or unreadable JSON in key "${key}"; using fallback.`, err);
    return fallback;
  }
}

/**
 * Serializes and writes a value to storage. Returns false (instead of
 * throwing) when the write fails everywhere, so callers can surface a warning.
 */
export function safeStorageSet<T>(key: string, value: T): boolean {
  try {
    return writeRaw(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[Storage] Failed to write key "${key}".`, err);
    return false;
  }
}

/**
 * Reads a plain string value from storage without JSON parsing.
 */
export function safeStorageGetString(key: string, fallback: string = ""): string {
  const raw = readRaw(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed === "number" || typeof parsed === "boolean") return String(parsed);
    if (parsed === null || parsed === undefined) return fallback;
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Removes a key from storage (both layers). Never throws.
 */
export function safeStorageRemove(key: string): void {
  try {
    if (storageAvailable()) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  try {
    delete memoryStore[key];
  } catch {
    /* ignore */
  }
}

/**
 * Reports whether the persistent (real) storage layer is available. Useful for
 * showing a one-time "data won't be saved" warning in private/blocked contexts.
 */
export function isStorageAvailable(): boolean {
  return storageAvailable();
}
