import type { StorageAdapter } from './adapter';

/**
 * Web storage adapter — one JSON blob in `localStorage`, so reloads persist (real persistence on
 * web + the platform the B.1–B.8 rebuild verifies against). Every access is guarded so a private-mode
 * / disabled-storage environment degrades to a no-op rather than throwing.
 */
const KEY = 'debtPlanner.rnStore';
const QUARANTINE_PREFIX = 'debtPlanner.rnStore.__quarantine__';

export function createStorageAdapter(): StorageAdapter {
  return {
    async read() {
      try {
        const raw = globalThis.localStorage?.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    async write(store) {
      try {
        globalThis.localStorage?.setItem(KEY, JSON.stringify(store));
      } catch {
        // storage unavailable / quota — drop silently (data-safety escape hatches cover the real risk)
      }
    },
    async quarantine(raw, reason) {
      try {
        globalThis.localStorage?.setItem(`${QUARANTINE_PREFIX}.${reason}.${Date.now()}`, raw);
      } catch {
        /* no-op */
      }
    },
    async clearQuarantine() {
      try {
        const ls = globalThis.localStorage;
        if (!ls) return;
        Object.keys(ls)
          .filter((k) => k.startsWith(QUARANTINE_PREFIX))
          .forEach((k) => ls.removeItem(k));
      } catch {
        /* no-op */
      }
    },
  };
}
