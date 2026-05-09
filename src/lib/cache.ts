/**
 * SSR-safe localStorage wrapper for demo reliability.
 * Only accesses window.localStorage in the browser; no-ops on server.
 */

const isBrowser = typeof window !== "undefined";

export const cache = {
  get<T>(key: string): T | null {
    if (!isBrowser) return null;
    try {
      const raw = window.localStorage.getItem(`paysignal:${key}`);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(`paysignal:${key}`, JSON.stringify(value));
    } catch {
      // localStorage full or unavailable — silently fail
    }
  },

  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(`paysignal:${key}`);
    } catch {
      // silently fail
    }
  },

  clearAll(): void {
    if (!isBrowser) return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) =>
        k.startsWith("paysignal:")
      );
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // silently fail
    }
  },

  /** List all cached keys (without prefix) */
  keys(): string[] {
    if (!isBrowser) return [];
    try {
      return Object.keys(window.localStorage)
        .filter((k) => k.startsWith("paysignal:"))
        .map((k) => k.replace("paysignal:", ""));
    } catch {
      return [];
    }
  },
};
