import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';
import { StorageLockedError, type StorageAdapter } from '@/storage/adapter';
import { bootstrapPersistence, SAVE_DEBOUNCE_MS } from '@/store/persistence';
import { createDebtStore } from '@/store/store';

/**
 * RS.5 — persistence + migration corrupt-data coverage. Drives the store's async `hydrate`/`save`
 * lifecycle through a tracking `StorageAdapter`: first-launch seed, clean vs upgrade hydrate, and the
 * critical corrupt/unmigratable branch (quarantine the bytes → start fresh → overwrite, NEVER write bad
 * data back). Plus `runMigrations` structural edges (future version, malformed nested shapes,
 * forward-compat passthrough). Throw-based; async → top-level `await`. Run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

/** A tracking adapter: records writes + quarantines so we can assert the lifecycle's side effects. */
class MockAdapter implements StorageAdapter {
  writes = 0;
  quarantines: { raw: string; reason: string }[] = [];
  cleared = 0;
  constructor(public blob: unknown | null = null) {}
  async read() {
    return this.blob;
  }
  failWrites = false;
  async write(store: unknown) {
    if (this.failWrites) throw new Error('disk full');
    this.writes++;
    this.blob = store;
  }
  async quarantine(raw: string, reason: string) {
    this.quarantines.push({ raw, reason });
  }
  async clearQuarantine() {
    this.cleared++;
  }
}

/** Storage that cannot be READ — a locked keychain, an MMKV that will not open. Counts writes so the
 *  "must not overwrite what it could not read" assertion has something to check. */
class ThrowingReadAdapter implements StorageAdapter {
  writes = 0;
  async read(): Promise<unknown | null> {
    throw new StorageLockedError();
  }
  async write() {
    this.writes++;
  }
}

async function run() {
  console.log('Running persistence-lifecycle (RS.5) tests...');

  // ── First launch: nothing stored → seed defaults + persist once ──
  {
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(s.getState().isHydrated, true, 'first launch → hydrated');
    eq(a.writes, 1, '…seeds the blob exactly once');
    eq((a.blob as DebtStore).storeVersion, CURRENT_STORE_VERSION, '…seeded blob at the current version');
  }

  // ── Clean hydrate: a current-version blob → load as-is, no rewrite ──
  {
    const stored: DebtStore = { ...createDefaultStore(), debts: [{ id: 'd', name: 'X', balance: 100, minimumPayment: 5, apr: 10, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-07-01', lastVerifiedDate: '2026-07-01' } as DebtStore['debts'][number]] };
    const a = new MockAdapter(stored);
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(s.getState().store.debts.length, 1, 'clean hydrate → data loaded');
    eq(a.writes, 0, '…current-version blob is NOT rewritten (no needless churn)');
  }

  // ── Upgrade hydrate: an older-version blob → migrate + persist the upgrade ──
  {
    const a = new MockAdapter({ ...createDefaultStore(), storeVersion: 2 });
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(s.getState().store.storeVersion, CURRENT_STORE_VERSION, 'upgrade hydrate → migrated to current');
    eq(a.writes, 1, '…the migration is persisted');
  }

  // ── Corrupt (non-object): quarantine → start fresh → overwrite, never write bad data back ──
  {
    const a = new MockAdapter('this is not a store');
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(a.quarantines.length, 1, 'corrupt blob → quarantined exactly once');
    eq(a.quarantines[0].reason, 'migration-failed', '…with the right reason');
    eq(s.getState().store.prefs.onboardingComplete, false, '…store reset to fresh defaults');
    eq(a.writes, 1, '…fresh defaults overwrite the corrupt bytes');
    eq(s.getState().isHydrated, true, '…and we stay hydrated (never brick the app)');
  }

  // ── Malformed nested shape (debts not an array): the migration map throws → same quarantine path ──
  {
    const a = new MockAdapter({ storeVersion: CURRENT_STORE_VERSION, debts: 'nope', paycheck: {} });
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(a.quarantines.length, 1, 'malformed nested blob → quarantined (no hard crash)');
    eq(a.writes, 1, '…recovered to fresh defaults');
  }

  // ── Array blob is not a valid store → quarantined ──
  {
    const a = new MockAdapter([1, 2, 3]);
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(a.quarantines.length, 1, 'array blob → quarantined');
  }

  // ── save(): writes through + toggles the saving flag back off ──
  {
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await s.getState().hydrate(a);
    const before = a.writes;
    await s.getState().save(a);
    eq(a.writes, before + 1, 'save → writes through the adapter');
    eq(s.getState().isSaving, false, '…and clears the saving flag when done');
  }

  // ── T3.2 (L5-2): a read that REJECTS is not the same as "nothing is stored" ──
  //
  // ⚠️ The corrupt-blob cases above look like they cover this and do not: a corrupt READ still
  // RETURNS, so `hydrate` reaches the quarantine path and recovers. A read that THROWS never gets
  // there. Before this, the rejection escaped `hydrate` entirely, `isHydrated` stayed false forever,
  // and the app rendered `null` — splash to black with no message and no retry.
  {
    const a = new ThrowingReadAdapter();
    const s = createDebtStore();
    await s.getState().hydrate(a);
    // Asserted FIRST because it is the one that costs the user their data, and this runner stops at the
    // first failure — an assertion ordered behind a sentinel is only ever proven by the sentinel.
    // Seeding defaults and persisting them, which is exactly what the `raw === null` branch does, would
    // overwrite a blob we merely could not open.
    eq(a.writes, 0, 'read throws → writes NOTHING (a failed read must never overwrite the real data)');
    eq(s.getState().isHydrated, true, '…and hydration RESOLVES (never a permanent blank screen)');
    eq(s.getState().storageError, 'read-failed', '…and records why, so the layout can offer a retry');
  }

  // ── …and autosave is never installed in that state, so a later edit cannot overwrite either ──
  {
    const a = new ThrowingReadAdapter();
    const s = createDebtStore();
    await bootstrapPersistence(a, s);
    eq(s.getState().storageError, 'read-failed', 'bootstrap over a failed read → error state');
    s.getState().updatePrefs({ themeMode: 'dark' });
    await new Promise((r) => setTimeout(r, SAVE_DEBOUNCE_MS + 60));
    eq(a.writes, 0, '…and an edit afterwards still writes nothing (no autosave subscription installed)');
  }

  // ── A failed WRITE is surfaced rather than swallowed, and clears when one lands ──
  {
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await s.getState().hydrate(a);
    a.failWrites = true;
    await s.getState().save(a);
    eq(s.getState().storageError, 'save-failed', 'write throws → recorded (was: silent, lost at next launch)');
    eq(s.getState().isSaving, false, '…and the saving flag still clears (the finally still runs)');
    a.failWrites = false;
    await s.getState().save(a);
    eq(s.getState().storageError, null, '…a later successful write clears it (transient faults stop nagging)');
  }

  // ── runMigrations structural edges (pure) ──
  {
    // A future/unknown version is stamped DOWN to the current version (the app owns the shape it runs).
    eq(runMigrations({ storeVersion: 999 } as unknown).storeVersion, CURRENT_STORE_VERSION, 'future version → stamped to current');
    // Partial prefs merge onto defaults without dropping the others.
    const m = runMigrations({ prefs: { themeMode: 'dark' } } as unknown);
    eq(m.prefs.themeMode, 'dark', 'partial prefs → the set field is preserved');
    eq(m.prefs.onboardingComplete, false, '…and the unset prefs fall back to defaults');
    // Forward-compat: an unknown top-level field passes through (spread), never dropped.
    const fwd = runMigrations({ someFutureField: 42 } as unknown) as unknown as { someFutureField?: number };
    eq(fwd.someFutureField, 42, 'unknown field → passed through (forward-compat)');
  }

  console.log(`✅ Persistence-lifecycle (RS.5) tests passed (${passed} asserts).`);
}

// Async → the runner `await`s this default export (top-level await isn't available under the cjs transform).
export default run;
