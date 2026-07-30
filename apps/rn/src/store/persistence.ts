import type { StorageAdapter } from '@/storage/adapter';
import { reportError } from '@/utils/reportError';

import { appStore } from './appStore';
import { isSandboxStore } from './sandboxStore';
import type { DebtStoreInstance } from './store';

/**
 * Wire a store instance to durable storage: hydrate at launch, then auto-save on every real data
 * change (debounced). Idempotent per store instance. The app calls this once from the root layout
 * with the platform adapter; tests pass an isolated store + a `MemoryStorageAdapter`.
 */

const SAVE_DEBOUNCE_MS = 500;
const bootstrapped = new WeakSet<object>();
const flushers = new WeakMap<object, () => void>();

export async function bootstrapPersistence(
  adapter: StorageAdapter,
  store: DebtStoreInstance = appStore,
): Promise<void> {
  // 3.5.0.6 — a sandbox must never reach durable storage. Its `save`/`hydrate` are already neutered, so
  // this can't corrupt anything; the guard exists to make a mis-wire OBSERVABLE (and to skip installing
  // an autosave subscription on a store whose whole point is being throwaway) rather than silently inert.
  if (isSandboxStore(store)) {
    reportError(new Error('bootstrapPersistence called with a SANDBOX store — refusing'), { seam: 'persistence' });
    return;
  }
  if (bootstrapped.has(store)) return;
  bootstrapped.add(store);

  await store.getState().hydrate(adapter);

  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      void store.getState().save(adapter);
    }
  };
  flushers.set(store, flush);

  store.subscribe((state, prev) => {
    // Only persist real store-data changes — not isHydrated/isSaving lifecycle toggles.
    if (state.store === prev.store) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void store.getState().save(adapter);
    }, SAVE_DEBOUNCE_MS);
  });
}

/** Immediately persist any pending debounced change (wire to AppState background at B.9). */
export function flushPendingSave(store: DebtStoreInstance = appStore): void {
  flushers.get(store)?.();
}
