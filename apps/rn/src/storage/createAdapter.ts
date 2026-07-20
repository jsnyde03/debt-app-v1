import { createMMKV } from 'react-native-mmkv';

import type { StorageAdapter } from './adapter';

/**
 * Native storage adapter (B.9) — one JSON blob in MMKV, the fast native key-value store the
 * Phase-D data bridge migrates the Capacitor WKWebView `localStorage` into. Mirrors the web
 * adapter's contract (`createAdapter.web.ts`); the store depends only on `StorageAdapter`, so MMKV
 * never enters the web bundle (Metro resolves the `.web` file there).
 *
 * Parity-first: **unencrypted**, matching today's Capacitor `localStorage` (also plaintext). MMKV
 * encryption (key held in the Keychain via expo-secure-store) is a deliberate, device-tested
 * security enhancement — NOT added blind here, since a wrong key path is a data-loss risk on an
 * untestable native surface ([[feedback_native_module_verification_gap]]).
 *
 * ⚠️ Native-only: MMKV instantiation requires the native module — verified on a real device/
 * TestFlight build (Phase E), never on web/Expo Go.
 */
const KEY = 'store';
const QUARANTINE_PREFIX = 'quarantine.';

export function createStorageAdapter(): StorageAdapter {
  const mmkv = createMMKV({ id: 'debtPlanner' });
  return {
    async read() {
      const raw = mmkv.getString(KEY);
      if (raw == null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        // Corrupt bytes: hand the raw string back so the store's hydrate → runMigrations throws →
        // the blob is quarantined (never silently dropped).
        return raw;
      }
    },
    async write(store) {
      mmkv.set(KEY, JSON.stringify(store));
    },
    async quarantine(raw, reason) {
      mmkv.set(`${QUARANTINE_PREFIX}${reason}.${Date.now()}`, raw);
    },
    async clearQuarantine() {
      mmkv
        .getAllKeys()
        .filter((k) => k.startsWith(QUARANTINE_PREFIX))
        .forEach((k) => mmkv.remove(k));
    },
  };
}
