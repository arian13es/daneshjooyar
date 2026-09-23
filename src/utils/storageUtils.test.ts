/**
 * Tests for storageUtils — JSON-aware get/set, corrupt data recovery, memory fallback.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  safeStorageGet,
  safeStorageSet,
  safeStorageGetString,
  safeStorageRemove,
  isStorageAvailable
} from "./storageUtils";

const KEY = "test_key";

describe("storageUtils", () => {
  beforeEach(() => {
    localStorage.clear();
    safeStorageRemove(KEY);
  });

  afterEach(() => {
    localStorage.clear();
    safeStorageRemove(KEY);
    vi.restoreAllMocks();
  });

  it("safeStorageSet + safeStorageGet round-trips objects", () => {
    const value = { a: 1, b: "hello", nested: { list: [1, 2, 3] } };
    expect(safeStorageSet(KEY, value)).toBe(true);
    expect(safeStorageGet(KEY, null)).toEqual(value);
  });

  it("safeStorageGet returns fallback for missing key", () => {
    expect(safeStorageGet(KEY, "fallback")).toBe("fallback");
    expect(safeStorageGet(KEY, [])).toEqual([]);
    expect(safeStorageGet(KEY, null)).toBeNull();
  });

  it("safeStorageGet recovers from corrupt JSON", () => {
    localStorage.setItem(KEY, "{not valid json!!");
    const result = safeStorageGet(KEY, { default: true });
    expect(result).toEqual({ default: true });
  });

  it("safeStorageGet returns fallback for empty string", () => {
    localStorage.setItem(KEY, "");
    expect(safeStorageGet(KEY, "fb")).toBe("fb");
  });

  it("safeStorageSet JSON.stringifies values", () => {
    safeStorageSet(KEY, { x: 1 });
    expect(localStorage.getItem(KEY)).toBe('{"x":1}');
  });

  it("safeStorageGetString reads JSON-encoded strings", () => {
    safeStorageSet(KEY, "30");
    expect(safeStorageGetString(KEY, "0")).toBe("30");
  });

  it("safeStorageGetString reads raw unquoted strings (legacy)", () => {
    localStorage.setItem(KEY, "rawvalue");
    expect(safeStorageGetString(KEY, "fb")).toBe("rawvalue");
  });

  it("safeStorageGetString reads raw numbers (legacy)", () => {
    localStorage.setItem(KEY, "45");
    expect(safeStorageGetString(KEY, "0")).toBe("45");
  });

  it("safeStorageGetString returns fallback for missing key", () => {
    expect(safeStorageGetString(KEY, "fb")).toBe("fb");
    expect(safeStorageGetString(KEY)).toBe("");
  });

  it("safeStorageGetString returns raw when JSON parses to object", () => {
    localStorage.setItem(KEY, '{"a":1}');
    expect(safeStorageGetString(KEY, "fb")).toBe('{"a":1}');
  });

  it("safeStorageRemove deletes from localStorage", () => {
    localStorage.setItem(KEY, "value");
    safeStorageRemove(KEY);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("isStorageAvailable reports boolean", () => {
    expect(typeof isStorageAvailable()).toBe("boolean");
    expect(isStorageAvailable()).toBe(true);
  });
});
