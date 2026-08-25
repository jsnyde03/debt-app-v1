import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';
import { StorageLockedError, type StorageAdapter } from '@/storage/adapter';
import { bootstrapPersistence, SAVE_DEBOUNCE_MS } from '@/store/persistence';
// B1's pace assert runs through the SELECTOR the app actually reads, not through a hand-built engine
// call — the question is what this store allocates, and that is the path that answers it.
import { selectBaseAllocation } from '@/store/selectors';
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
    // ⛔ P6.8.7c.2 (B4/M3-1) — the branch used to leave `storageError` null, so `_layout` rendered the
    // route guard's verdict instead: first-run onboarding, with every debt gone and not one word about
    // why. `onboardingComplete: false` above is exactly what makes the silence indistinguishable from a
    // fresh install, which is why THIS assertion sits next to it.
    eq(s.getState().storageError, 'data-reset', '…⛔ and the reset is DECLARED, so the app can say so');
  }

  // ── Malformed nested shape (debts not an array) — CONTRACT CHANGED AT 5.10, deliberately ──
  // ⛔ It used to throw out of `runMigrations` and take the quarantine-and-reset path, which discarded the
  // WHOLE blob over one bad key: a user with a corrupt `debts` also lost their income, expenses and goals.
  // `runMigrations` is now total, so the rest of the store survives and the unreadable list is REPORTED.
  // ⚠️ The reporting half is the point. Repairing without recording would be a silent drop wearing a fix,
  // and the first cut of 5.10's repair did exactly that until this assertion caught it.
  {
    const a = new MockAdapter({
      storeVersion: CURRENT_STORE_VERSION,
      debts: 'nope',
      paycheck: { amount: '2100' },
      goals: [{ id: 'g1', name: 'Kept', target: 500 }],
    });
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(a.quarantines.length, 0, 'malformed nested blob is REPAIRED, not quarantined');
    eq(s.getState().store.debts.length, 0, '…the unreadable list is empty');
    eq(s.getState().store.paycheck.amount, '2100', '…⭐ but the income SURVIVES (it used to be discarded)');
    eq(s.getState().store.goals.length, 1, '…and so do the goals');
    eq(s.getState().store.dataRepairs.length, 1, '…⛔ and the loss is REPORTED, never silent');
    eq(s.getState().store.dataRepairs[0]?.entity, 'debt', '…naming what could not be read');
    eq(s.getState().isHydrated, true, '…and we stay hydrated');
    eq(s.getState().store.pendingDataRepairs.length, 1, '…⛔ and it is held for the USER, not just recorded');
  }

  // ── P6.8.7c.2 (B4/M3-2): a repair OUTLIVES the read that raised it ──
  // ⛔ This is the whole reason `pendingDataRepairs` exists. `dataRepairs` describes the blob this read
  // saw, and `repairsAreNotRepeated` guarantees a clean second pass reports nothing — so re-hydrating the
  // repaired store empties it. Before this field, that meant the notice had exactly one session to be
  // seen, and if the user did not open the right screen the $0 debt stayed a $0 debt forever.
  {
    const raw = {
      storeVersion: CURRENT_STORE_VERSION,
      paycheck: { amount: '2100' },
      debts: [{ id: 'd1', name: 'Chase card', balance: null, minimumPayment: 50 }],
    };
    const a = new MockAdapter(raw);
    const s = createDebtStore();
    await s.getState().hydrate(a);
    eq(s.getState().store.dataRepairs.length, 1, 'the unreadable balance is repaired and reported');
    eq(s.getState().store.pendingDataRepairs.length, 1, '…and queued for the user');
    eq(s.getState().store.pendingDataRepairs[0]?.name, 'Chase card', '…naming the debt they have to fix');

    // Re-hydrate from the REPAIRED store, which is what a save then a relaunch produces.
    const second = createDebtStore();
    await second.getState().hydrate(new MockAdapter(JSON.parse(JSON.stringify(s.getState().store))));
    eq(second.getState().store.dataRepairs.length, 0, '⛔ the per-read list is empty on the clean pass');
    eq(second.getState().store.pendingDataRepairs.length, 1, '…⭐ but the user has still not been told, so it STANDS');
    eq(second.getState().store.pendingDataRepairs[0]?.name, 'Chase card', '…with the name intact');

    // Acknowledging is the only thing that clears it — and it must survive a re-hydrate too.
    second.getState().acknowledgeDataRepairs();
    eq(second.getState().store.pendingDataRepairs.length, 0, 'acknowledging clears it');
    const third = createDebtStore();
    await third.getState().hydrate(new MockAdapter(JSON.parse(JSON.stringify(second.getState().store))));
    eq(third.getState().store.pendingDataRepairs.length, 0, '…and it does not come back to nag');
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

  // ── W1-6 (P6.8.7c.3): an INCONCLUSIVE bridge must not be sealed by seeding an empty store ──────
  //
  // ⛔ The audit's highest-harm finding, and it lives in the seam between two correct halves. The bridge
  // runs only while RN storage is empty; hydrate's first-launch branch writes defaults. So a bridge that
  // could not tell whether v1.6 data exists was immediately followed by the one write that guarantees it
  // will never be asked again — and a real portfolio, still sitting on disk, became unreachable forever.
  //
  // ⚠️ R1's critique of the existing coverage was exact: `interruption.test.ts` drives the bridge directly
  // and never runs `bootstrapPersistence`, and every other bootstrap case here has no legacy source. This
  // is the first test that holds both halves at once.
  {
    const refusedRead = async () => ({
      supported: true,
      webkitRoot: '/x/Library/WebKit',
      visited: 7,
      truncated: false,
      candidates: ['/x/db.sqlite3'],
      opened: [{ path: '/x/db.sqlite3', rows: 0, legacyKeys: 0, error: 'database is locked' }],
      store: null,
      droppedRows: 0,
    });
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await bootstrapPersistence(a, s, refusedRead);
    eq(a.writes, 0, '⛔ an inconclusive bridge writes NOTHING — the retry survives to the next launch');
    eq(s.getState().isHydrated, true, '…and the app still opens (hydration resolves on defaults)');
    eq(s.getState().storageError, null, '…without claiming a storage fault, because there was not one');
    // The proof that the retry is intact: storage is still empty, so the gate that admits the bridge
    // still holds.
    eq(await a.read(), null, '⭐ …and storage is STILL empty, which is the whole retry mechanism');
  }

  // ── M3-20 (P6.8.7c.4): a migration that LOSES something says so, through the same card ──────────
  //
  // ⛔ The bridge computed `LegacyMigrationOutcome` in full — `reason`, `read`, `map`, `quarantineFailed`
  // — and `runLegacyBridge` threw all of it away one line after receiving it. `reportError` sent some to
  // Sentry, and Sentry is not a user.
  {
    const lossyRead = async () => ({
      supported: true,
      webkitRoot: '/x/Library/WebKit',
      visited: 7,
      truncated: false,
      candidates: ['/x/db.sqlite3'],
      opened: [{ path: '/x/db.sqlite3', rows: 3, legacyKeys: 3 }],
      store: {
        path: '/x/db.sqlite3',
        items: {
          'debtPlanner.amount': JSON.stringify('2400'),
          'debtPlanner.debts': JSON.stringify([{ id: 'd1', name: 'Visa', balance: 1200, minimumPayment: 35 }]),
          // ⚠️ A key this build does not recognise — v1.6 persisted something unaccounted for.
          'debtPlanner.somethingNewNobodyMapped': JSON.stringify({ a: 1 }),
          // …and one whose value will not parse at all.
          'debtPlanner.goals': '{not json',
        },
      },
      droppedRows: 0,
    });
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await bootstrapPersistence(a, s, lossyRead);
    const losses = s.getState().store.pendingDataRepairs.filter((r) => r.entity === 'migration');
    assert(losses.length > 0, '⛔ a lossy migration REPORTS to the user, not only to Sentry');
    assert(
      losses.some((r) => /not recognised/.test(r.field)),
      `…naming the unrecognised item (got: ${JSON.stringify(losses.map((r) => r.field))})`,
    );
    // ⛔ And the half the finding got wrong: `dropped` entries are DELIBERATE non-carries, so none of
    // them may reach the user. Every v1.6 store has some; reporting them would nag every upgrader about
    // a QA hook and a superseded counter.
    assert(
      !losses.some((r) => /rolloverCount|isDemoMode|mockSubscription|schemaVersion/.test(r.field)),
      'and a DELIBERATE drop is never reported as a loss',
    );
    // The migration itself still succeeded — reporting a loss must not look like a failure.
    eq(s.getState().store.paycheck.amount, '2400', '…while the migration itself still landed');
  }

  // ── …while a CONFIRMED fresh install still seeds, or every launch would re-run the bridge forever ──
  {
    const cleanRead = async () => ({
      supported: true,
      webkitRoot: '/x/Library/WebKit',
      visited: 7,
      truncated: false,
      candidates: [],
      opened: [],
      store: null,
      droppedRows: 0,
    });
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await bootstrapPersistence(a, s, cleanRead);
    assert(a.writes > 0, '⭐ a confirmed fresh install DOES seed (the fix must not strand every new user)');
  }

  // ── 5.5 — ⛔ A PREF IS WRITTEN IMMEDIATELY. Debounced, a force-quit inside 500 ms LOST it. ──
  // The user watched the switch flip; `flushPendingSave` only fires on AppState background, and a
  // force-quit from the foreground emits neither background nor inactive. Nothing was behind the window.
  {
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await bootstrapPersistence(a, s);
    const before = a.writes;
    s.getState().updatePrefs({ themeMode: 'dark' });
    // NOT awaiting the debounce — that is the whole point. A microtask is enough for the save to be
    // dispatched; if this needed `SAVE_DEBOUNCE_MS` the defect would still be live.
    await Promise.resolve();
    await Promise.resolve();
    assert(a.writes > before, 'a pref change writes WITHOUT waiting out the debounce');
  }

  // ── …while ordinary data edits keep the debounce, which is what it is for ──
  {
    const a = new MockAdapter(null);
    const s = createDebtStore();
    await bootstrapPersistence(a, s);
    const before = a.writes;
    s.getState().setPayoffStrategy('avalanche');
    await Promise.resolve();
    await Promise.resolve();
    eq(a.writes, before, 'a non-pref edit does NOT write immediately (the debounce still coalesces)');
    await new Promise((r) => setTimeout(r, SAVE_DEBOUNCE_MS + 60));
    assert(a.writes > before, '…and lands once the debounce elapses');
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

  // ── [B1 · P6.8.9.7.2] GOALS ARE REPAIRED — they were the one list that never was ──
  //
  // ⛔ Debts, required expenses and living expenses all ran through `repairMoneyFields`; goals fell through
  // the `...r` spread untouched, and `mapLegacyStore.ts:76` carries `goals: 'goals'` straight from v1.6 —
  // so the only blobs that cannot be fixed by reinstalling were the ones with no repair.
  //
  // ⚠️ `priorityPerPaycheck` is the assert that matters, and it is NOT a display concern. Its type doc says
  // *"Absent → no cap (funds as fast as spare allows)"*, and an unreadable value serialises to `null`,
  // which every `??` reader treats as absent. A corrupt pace therefore REMOVES the cap the user signed off
  // on and funds the goal ahead of debt at full speed.
  {
    const g = runMigrations({
      goals: [
        { id: 'g0', name: 'Roof', type: 'savings', targetAmount: '4,000', currentAmount: null, priority: true, priorityPerPaycheck: 'Infinity' },
      ],
    } as unknown);
    // ⛔ **THE LOAD-BEARING ASSERTS COME FIRST, DELIBERATELY.** This runner is throw-based and stops at the
    // first failure, so an assertion ordered behind another is only ever proven by that other one — and the
    // first plant of this block proved only the `targetAmount` line while the pace asserts never ran.
    //
    // ⛔ **THESE ASSERT THE ALLOCATION, NOT THE VALUE — and the two versions this replaces are why.**
    // They read `priorityPerPaycheck === 0 || Number.isFinite(…)` and `!== undefined`. Both PASSED on the
    // defect. `readMoney` repairs an unreadable pace to `0`, and `0` is the **uncapped** value at
    // `allocatePaycheck.ts:632` (`!= null && > 0 ? pace : Infinity`), so the first assert admitted by name
    // the exact value that reproduces the harm — while the comment four lines above it stated that harm
    // correctly. The second guards `undefined`, which `readMoney` can never return. (P6.8.9.7.10 · C-2.)
    //
    // ⚡ **The subject is "does this goal still take money ahead of the debt", and only an allocation can
    // answer it.** A value assert is a proxy for the subject, and a proxy for the subject is not the
    // subject — measured five times in this project now.
    {
      const corrupt: DebtStore = {
        ...g,
        paycheck: { ...g.paycheck, amount: '1000', currentDate: '2026-08-25', nextPaycheckDate: '2026-09-08' },
        debts: [
          { id: 'd0', name: 'Card', balance: 3000, minimumPayment: 50, apr: 20, dueDate: '2026-09-01', type: 'debt', recurrence: 'monthly' },
        ],
        requiredExpenses: [],
        livingExpenses: [],
      } as DebtStore;
      const alloc = selectBaseAllocation(corrupt);
      assert(alloc !== null, 'goal repair → the fixture allocates at all (guards a vacuous pass)');
      const toGoal = (alloc?.allocations ?? [])
        .filter((a) => a.goalId === 'g0')
        .reduce((sum, a) => sum + a.amount, 0);
      // The corrupt store funded this goal with the ENTIRE remainder, ahead of the debt. Whatever the
      // repair chooses to do, it may not leave that behaviour standing.
      assert(
        toGoal === 0,
        `goal repair → a goal whose pace could not be read is NOT funded ahead of debt (got $${toGoal})`,
      );
    }
    // ⛔ **THE PRESERVED PROPERTY — a finding names what is WRONG; the fix must keep what was RIGHT.**
    // Standing a goal down is the correct answer to *"we cannot read your cap"* and the WRONG answer to
    // everything else. A repair that over-matches would quietly stop funding every sinking fund in the
    // app, which is a worse defect than the one being fixed and would look identical in the green run
    // above. So: a READABLE pace still caps, and still funds ahead of debt.
    {
      const healthy = runMigrations({
        goals: [
          { id: 'g0', name: 'Roof', type: 'savings', targetAmount: 4000, currentAmount: 0, priority: true, priorityPerPaycheck: 200 },
        ],
      } as unknown);
      const store: DebtStore = {
        ...healthy,
        paycheck: { ...healthy.paycheck, amount: '1000', currentDate: '2026-08-25', nextPaycheckDate: '2026-09-08' },
        debts: [
          { id: 'd0', name: 'Card', balance: 3000, minimumPayment: 50, apr: 20, dueDate: '2026-09-01', type: 'debt', recurrence: 'monthly' },
        ],
        requiredExpenses: [],
        livingExpenses: [],
      } as DebtStore;
      const toGoal = (selectBaseAllocation(store)?.allocations ?? [])
        .filter((a) => a.goalId === 'g0')
        .reduce((sum, a) => sum + a.amount, 0);
      eq(toGoal, 200, 'goal repair → a READABLE pace is untouched: still funded, still capped at its pace');
    }
    /**
     * ⛔ **A RECOVERED PACE IS NOT A LOST ONE, AND THE REPAIR RECORD CANNOT TELL THEM APART.**
     * [P6.8.9.7.11.9 · B-1] `readMoney` flags `'200'` as `repaired: true` — the FORMAT was repaired — and
     * returns the real 200. Standing the goal down on that record destroys a cap that was read correctly,
     * which is a worse outcome than the defect being fixed. v1.6 stored money from HTML inputs, so the
     * string form is the ordinary case, not an exotic one.
     *
     * ⚠️ The block above cannot catch this: its fixture carries THREE repairs at once, so "stand down any
     * goal with any repair" satisfies it. Only a goal whose pace is recovered while another field is not
     * separates the two rules.
     */
    {
      const recovered = runMigrations({
        goals: [
          { id: 'g0', name: 'Roof', type: 'savings', targetAmount: 'nonsense', currentAmount: 0, priority: true, priorityPerPaycheck: '1,200' },
        ],
      } as unknown);
      eq(recovered.goals[0].priorityPerPaycheck, 1200, 'goal repair → a comma-grouped pace is RECOVERED, not lost');
      eq(recovered.goals[0].priority, true, '⛔ …and the goal keeps its priority: the value was read, so nothing was lost');
      assert(
        recovered.pendingDataRepairs.some((r) => r.entity === 'goal'),
        '…while the unreadable targetAmount beside it is still reported',
      );
    }
    /**
     * ⛔ **THE STORES A PREVIOUS BUILD ALREADY WROTE.** A pace repaired to `0` by an earlier version is a
     * finite number, so it re-reads as `repaired: false` and carries no record — nothing would ever detect
     * it, and `0` funds uncapped ahead of debt forever. Matching on the value reaches it; matching on the
     * record cannot.
     */
    {
      const legacyZero = runMigrations({
        goals: [
          { id: 'g0', name: 'Roof', type: 'savings', targetAmount: 4000, currentAmount: 0, priority: true, priorityPerPaycheck: 0 },
        ],
      } as unknown);
      eq(legacyZero.goals[0].priority, false, '⛔ a stored pace of 0 stands the goal down, with no repair record to go on');
      eq(legacyZero.goals[0].priorityPerPaycheck, undefined, '…and the meaningless cap is cleared');
      eq(legacyZero.pendingDataRepairs.length, 0, '…and nothing is reported, because the loss was not today');
    }
    eq(g.goals.length, 1, 'goal repair → the goal survives');
    eq(g.goals[0].targetAmount, 4000, 'goal repair → a grouped targetAmount is read, not dropped');
    eq(g.goals[0].currentAmount, 0, 'goal repair → an unreadable currentAmount becomes 0');
    // And the repair is REPORTED, not silently applied — the user is owed the list.
    assert(
      runMigrations({ goals: [{ id: 'g0', name: 'Roof', type: 'savings', targetAmount: 'abc' }] } as unknown)
        .pendingDataRepairs.some((r) => r.entity === 'goal'),
      'goal repair → surfaces as a `goal` DataRepair rather than being applied silently',
    );
  }

  console.log(`✅ Persistence-lifecycle (RS.5) tests passed (${passed} asserts).`);
}

// Async → the runner `await`s this default export (top-level await isn't available under the cjs transform).
export default run;
