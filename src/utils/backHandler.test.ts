/**
 * Tests for backHandler — stack order, handled/unhandled, unregister.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  registerBackHandler,
  unregisterBackHandler,
  executeBackAction
} from "./backHandler";

// Helper to clear all handlers between tests by unregistering known ones.
// We track handlers we register in each test.
let registered: Array<() => boolean> = [];

function reg(fn: () => boolean): () => boolean {
  registerBackHandler(fn);
  registered.push(fn);
  return fn;
}

beforeEach(() => {
  for (const h of registered) {
    unregisterBackHandler(h);
  }
  registered = [];
});

describe("backHandler", () => {
  it("returns false when no handlers registered", () => {
    expect(executeBackAction()).toBe(false);
  });

  it("returns true when a handler handles the action", () => {
    reg(() => true);
    expect(executeBackAction()).toBe(true);
  });

  it("executes most recent handler first (LIFO)", () => {
    const order: string[] = [];
    reg(() => {
      order.push("first");
      return false;
    });
    reg(() => {
      order.push("second");
      return true;
    });
    expect(executeBackAction()).toBe(true);
    expect(order).toEqual(["second"]);
  });

  it("falls through to earlier handlers when later ones return false", () => {
    const order: string[] = [];
    reg(() => {
      order.push("a");
      return true;
    });
    reg(() => {
      order.push("b");
      return false;
    });
    reg(() => {
      order.push("c");
      return false;
    });
    expect(executeBackAction()).toBe(true);
    expect(order).toEqual(["c", "b", "a"]);
  });

  it("returns false when all handlers return false", () => {
    reg(() => false);
    reg(() => false);
    expect(executeBackAction()).toBe(false);
  });

  it("unregister removes handler so it is not called", () => {
    let called = false;
    const h = reg(() => {
      called = true;
      return true;
    });
    unregisterBackHandler(h);
    expect(executeBackAction()).toBe(false);
    expect(called).toBe(false);
  });

  it("unregister of unknown handler is a no-op", () => {
    expect(() => unregisterBackHandler(() => true)).not.toThrow();
    reg(() => true);
    expect(executeBackAction()).toBe(true);
  });
});
