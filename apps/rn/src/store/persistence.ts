import type { StorageAdapter } from '@/storage/adapter';
import { reportError } from '@/utils/reportError';

import { migrateFromLegacy, type LegacyMigrationOutcome } from '@/data/legacyBridge/migrateFromLegacy';
import type { DataRepair } from '@/data/models';

import { appStore } from './appStore';
import { isSandboxStore } from './sandboxStore';
import type { DebtStoreInstance } from './store';

/**
 * Wire a store instance to durable storage: hydrate at launch, then auto-save on every real data
 * change (debounced). Idempotent per store instance. The app calls this once from the root layout
 * with the platform adapter; tests pass an isolated store + a `MemoryStorageAdapter`.
 */

/** Exported so a test can wait out the debounce rather than hard-code the same number beside it —
 *  two copies of this constant is how a test starts passing because it out-waited nothing. */
export const SAVE_DEBOUNCE_MS = 500;
const bootstrapped = new WeakSet<object>();
const flushers = new WeakMap<object, () => void>();

export async function bootstrapPersistence(
  adapter: StorageAdapter,
  store: DebtStoreInstance = appStore,
  /**
   * The v1.6 reader, injected — the same seam `migrateFromLegacy` already exposes and for the same
   * reason. ⛔ W1-6's harm lives in the INTERACTION between the bridge's verdict and hydrate's seed, and
   * neither existing suite could reach it: `interruption.test.ts` drives the bridge directly and never
   * runs this function, while every `bootstrapPersistence` case here supplies an adapter with no legacy
   * source at all. A defect that only appears where two correct halves meet needs a test that holds both.
   */
  readLegacy?: () => Promise<import('@/data/legacyBridge/report').LegacyReadReport>,
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

  // 5.3 — the v1.6 bridge, BEFORE hydrate and only when RN storage is genuinely empty.
  //
  // ⛔ The gate is `read() === null`, and the `try` around it is load-bearing: a read that THREW is not
  // an empty store. Treating the two alike would run the bridge against a user who already has v1.7 data
  // we merely could not open, and the migration would then look like a legitimate first launch. A throw
  // is left entirely to `hydrate`, which already knows how to say "I could not look" (`read-failed`).
  //
  // ⚠️ The double read is deliberate. `hydrate` does its own, and sharing one would mean either hoisting
  // hydrate's error handling up here or teaching the store a first-launch flag — a flag that could then
  // disagree with the data it describes. Two MMKV reads at launch cost nothing worth that.
  // W1-6 — `true` unless the bridge ran and could not reach a conclusion. Seeding an empty store is what
  // makes a skip permanent, so the one case that must not seed is the one where we do not know.
  let seed = true;
  try {
    if ((await adapter.read()) === null) ({ seed } = await runLegacyBridge(adapter, store, readLegacy));
  } catch {
    /* hydrate owns this failure — see above */
  }

  await store.getState().hydrate(adapter, { seed });

  // ⛔ The read failed, so what is in `store` is DEFAULTS, not the user's data. Installing the autosave
  // subscription now would let the first edit — or any startup write — overwrite a blob we merely could
  // not open, which turns a transient storage fault into permanent data loss. Leave persistence
  // uninstalled and drop the bootstrapped mark so the retry can run this again.
  if (store.getState().storageError === 'read-failed') {
    bootstrapped.delete(store);
    return;
  }

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

    // 5.5 — ⛔ PREFERENCES ARE WRITTEN IMMEDIATELY, NOT DEBOUNCED.
    //
    // The reported defect: a pref changed and then force-quit inside 500 ms was LOST. `flushPendingSave`
    // only fires on AppState `background`/`inactive`, and a force-quit from the foreground emits neither —
    // so the debounce window is a hole with nothing behind it.
    //
    // ⚠️ Prefs specifically, rather than shortening the debounce for everything. A pref is a single tap
    // the user WATCHED confirm itself — a switch that flips on screen and is gone at next launch is the
    // shape that destroys trust in whether the app saves anything at all. They are also rare and tiny, so
    // writing on every one costs nothing. High-frequency edits (typing an amount into a form) keep the
    // debounce, which is what it was for.
    if (state.store.prefs !== prev.store.prefs) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      void store.getState().save(adapter);
      return;
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void store.getState().save(adapter);
    }, SAVE_DEBOUNCE_MS);
  });
}

/**
 * M3-20 — what the v1.6 migration could not bring across, in the user's words.
 *
 * ⛔ **`LegacyMapReport.dropped` is excluded on purpose, and the finding conflated it with the rest.**
 * Measured at switch-in: every `DROPPED` entry carries a documented reason and none of them is user data.
 * `unknown` (v1.6 persisted something this build does not recognise), `unparseable` (a value that would
 * not read) and `quarantineFailed` (bytes that could not be preserved) are the real losses.
 *
 * ⚠️ Named as a count rather than as raw keys: `debtPlanner.rolloverCount` means nothing to the person
 * holding the phone, and the action it should prompt — check your figures against the old app — is the
 * same whichever key it was.
 */
function describeMigrationLosses(outcome: LegacyMigrationOutcome): DataRepair[] {
  const out: DataRepair[] = [];
  const push = (field: string) => out.push({ entity: 'migration', id: '', name: '', field });
  const unknown = outcome.map?.unknown.length ?? 0;
  const unparseable = outcome.map?.unparseable.length ?? 0;
  if (unknown > 0) push(`${unknown} item(s) from your old version were not recognised`);
  if (unparseable > 0) push(`${unparseable} value(s) from your old version could not be read`);
  if (outcome.quarantineFailed > 0) {
    push(`${outcome.quarantineFailed} set(s) of set-aside data could not be carried over`);
  }
  return out;
}

/**
 * 5.3 — run the v1.6 bridge and persist what it found.
 *
 * ⚠️ **The blob is written BEFORE the store is imported.** If the write fails the migration is abandoned
 * and nothing is imported, so the next launch still sees empty storage and retries from the untouched
 * v1.6 source. Importing first and writing second would leave a user looking at migrated data that was
 * never persisted — which they would then edit, and lose.
 *
 * ⚠️ Never throws. A launch that fails because a migration failed is worse than a launch with an empty
 * store and the source still sitting there.
 */
async function runLegacyBridge(
  adapter: StorageAdapter,
  store: DebtStoreInstance,
  readLegacy?: () => Promise<import('@/data/legacyBridge/report').LegacyReadReport>,
): Promise<{ seed: boolean }> {
  try {
    const { outcome, store: migrated } = await migrateFromLegacy(adapter, readLegacy);
    if (!outcome.migrated || migrated === null) {
      // ⛔ W1-6 — a NON-terminal skip must not be sealed by seeding an empty store. The bridge runs only
      // while RN storage is empty, so the seed is what consumes the retry: after it, `read()` is no
      // longer `null`, the bridge never runs again, and a v1.6 portfolio sitting untouched on disk is
      // unreachable forever. Leaving storage `null` makes the retry structural — the same move the
      // throwing-`read()` path already makes, for the same reason.
      //
      // ⚠️ Reported on every non-terminal skip, because without it there is no instrument that could ever
      // tell us this is happening in the field (W1-7).
      if (!outcome.terminal) {
        reportError(new Error(`legacy bridge inconclusive: ${outcome.reason}`), {
          seam: 'legacy-bridge',
          truncated: String(outcome.read?.truncated ?? 'n/a'),
          visited: String(outcome.read?.visited ?? 'n/a'),
          candidates: String(outcome.read?.candidates.length ?? 'n/a'),
          refused: String(outcome.read?.opened.filter((o) => o.error).length ?? 'n/a'),
        });
      }
      return { seed: outcome.terminal };
    }
    // M3-20 — the migration's own verdict reaches the USER, not just Sentry. ⛔ Deliberately NOT
    // `map.dropped`: every entry there is a documented, intentional non-carry (a v1.6 QA hook, a
    // superseded counter, a consumed schema version), so surfacing it would tell an upgrader the app
    // "dropped" things they never had and cannot act on. What is reported is what was genuinely LOST.
    const carried = { ...migrated, pendingDataRepairs: [...migrated.pendingDataRepairs, ...describeMigrationLosses(outcome)] };
    await adapter.write(carried);
    store.getState().importStore(carried);
    return { seed: true };
  } catch (error) {
    reportError(error, { seam: 'legacy-bridge' });
    // A throw here is exactly the case that must not be sealed either — the bridge never reported a
    // conclusion, so nothing may act as though it had.
    return { seed: false };
  }
}

/** Immediately persist any pending debounced change (wire to AppState background at B.9). */
export function flushPendingSave(store: DebtStoreInstance = appStore): void {
  flushers.get(store)?.();
}
