/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Module: polyfills.ts (Runtime ECMAScript polyfills for legacy Android WebViews)
 * Author: Arian
 * Telegram: https://t.me/arian13es
 * Copyright © 2026 Arian. All rights reserved.
 * ============================================================================
 * Ensures complete runtime stability on factory Android WebViews (Chrome 50-76)
 * without requiring heavy polyfill libraries or causing bundle bloat.
 */

// 1. globalThis polyfill (Chrome < 71)
if (typeof globalThis === "undefined") {
  (window as any).globalThis = window;
}

// 2. Promise.allSettled polyfill (Chrome < 76)
if (!Promise.allSettled) {
  Promise.allSettled = function <T>(
    promises: Iterable<T | PromiseLike<T>>
  ): Promise<PromiseSettledResult<Awaited<T>>[]> {
    return Promise.all(
      Array.from(promises).map((p) =>
        Promise.resolve(p).then(
          (value) => ({ status: "fulfilled" as const, value }),
          (reason) => ({ status: "rejected" as const, reason })
        )
      )
    );
  };
}

// 3. Array.prototype.flat & flatMap polyfills (Chrome < 69)
if (!Array.prototype.flat) {
  (Array.prototype as any).flat = function (depth: number = 1): any[] {
    const flatten = (arr: any[], d: number): any[] =>
      d > 0
        ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), [])
        : arr.slice();
    return flatten(this as any[], Math.floor(depth));
  };
}

if (!Array.prototype.flatMap) {
  (Array.prototype as any).flatMap = function (callback: any, thisArg?: any): any[] {
    return (this as any).map(callback, thisArg).flat();
  };
}

// 4. Object.fromEntries polyfill (Chrome < 73)
if (!Object.fromEntries) {
  (Object as any).fromEntries = function (entries: any): any {
    const obj: any = {};
    for (const [key, val] of entries) {
      obj[key] = val;
    }
    return obj;
  };
}

// 5. String.prototype.replaceAll polyfill (Chrome < 85)
if (!String.prototype.replaceAll) {
  (String.prototype as any).replaceAll = function (search: any, replace: any): string {
    if (search instanceof RegExp) {
      if (!search.global) {
        throw new TypeError("replaceAll called with a non-global RegExp");
      }
      return (this as string).replace(search, replace);
    }
    return (this as string).split(search).join(replace);
  };
}

// 6. Array.prototype.at & String.prototype.at polyfills (Chrome < 92)
if (!Array.prototype.at) {
  (Array.prototype as any).at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += (this as any).length;
    if (n < 0 || n >= (this as any).length) return undefined;
    return (this as any)[n];
  };
}

if (!String.prototype.at) {
  (String.prototype as any).at = function (n: number) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += (this as string).length;
    if (n < 0 || n >= (this as string).length) return "";
    return (this as string).charAt(n);
  };
}

// 7. Defensive ResizeObserver stub (Chrome < 64)
if (typeof window !== "undefined" && typeof (window as any).ResizeObserver === "undefined") {
  (window as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

export {};
