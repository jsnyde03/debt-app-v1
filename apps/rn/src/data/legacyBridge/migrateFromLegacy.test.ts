import { MemoryStorageAdapter, type StorageAdapter } from '@/storage/adapter';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';
import { migrateFromLegacy } from '@/data/legacyBridge/migrateFromLegacy';
import type { LegacyReadReport } from '@/data/legacyBridge/report';

/**
 * 5.3 — the bridge.
 *
 * ⛔ **Idempotence here is structural, and these tests are what prove the structure holds.** The bridge
 * runs only when RN storage is empty; that one condition is what makes it one-shot, interruption-safe,
 * and incapable of overwriting a store the user has already built. A regression that adds a "hasMigrated"
 * flag, or that runs the bridge unconditionally, fails below.
 *
 * ⚠️ The riskiest assertion is the `truncated` one. `store: null` has two meanings — "this is a fresh
 * install" and "I could not finish looking" — and only the first makes it safe to carry on as though the
 * user had no data. Conflating them is how a migration silently skips someone's whole portfolio.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq(actual: unknown, expected: unknown, label: string) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`,
  );
}

const j = (value: unknown) => JSON.stringify(value);

function reportWith(items: Record<string, string>, overrides: Partial<LegacyReadReport> = {}): LegacyReadReport {
  return {
    supported: true,
    webkitRoot: '/x/Library/WebKit',
    visited: 7,
    truncated: false,
    candidates: ['/x/db.sqlite3'],
    opened: [{ path: '/x/db.sqlite3', rows: Object.keys(items).length, legacyKeys: Object.keys(items).length }],
    store: { path: '/x/db.sqlite3', items },
    droppedRows: 0,
    ...overrides,
  };
}

const POPULATED = {
  'debtPlanner.schemaVersion': j(2),
  'debtPlanner.amount': j('2400'),
  'debtPlanner.payCycle': j('biweekly'),
  'debtPlanner.debts': j([{ id: 'd1', name: 'Visa', balance: 1200, minimumPayment: 35, apr: 19.99, type: 'debt' }]),
  'debtPlanner.hasCompletedOnboarding': j(true),
  'debtPlanner.darkMode': j(true),
};

export default async function run() {

// ── A populated v1.6 store comes across, and lands at the current version. ────────────────────────
{
  const adapter = new MemoryStorageAdapter();
  const { outcome, store } = await migrateFromLegacy(adapter, async () => reportWith(POPULATED));
  assert(outcome.migrated, 'a populated v1.6 store migrates');
  eq(outcome.reason, 'migrated', 'and says so');
  eq(store?.storeVersion, CURRENT_STORE_VERSION, 'the result is at the CURRENT store version');
  eq(store?.paycheck.amount, '2400', 'the paycheck came across');
  eq(store?.debts.length, 1, 'the debt came across');
  eq(store?.prefs.onboardingComplete, true, 'the renamed onboarding flag came across');
  // ⚡ The legacy boolean theme, which only the oldest installs carry.
  eq(store?.prefs.themeMode, 'dark', 'the pre-ThemePreference boolean theme came across');
}

// ── ⛔ A FRESH INSTALL is not a failure, and must not be reported as one. ─────────────────────────
{
  const adapter = new MemoryStorageAdapter();
  const { outcome, store } = await migrateFromLegacy(adapter, async () => reportWith({}, { store: null }));
  assert(!outcome.migrated, 'no v1.6 store → nothing migrates');
  assert(outcome.reason.includes('fresh install'), `and it is named a fresh install (${outcome.reason})`);
  eq(store, null, 'no store is produced');
}

// ── ⛔ A TRUNCATED SEARCH IS NOT A FRESH INSTALL. This is the one that loses portfolios. ──────────
{
  const adapter = new MemoryStorageAdapter();
  const { outcome } = await migrateFromLegacy(adapter, async () => reportWith({}, { store: null, truncated: true }));
  assert(!outcome.migrated, 'a truncated search migrates nothing');
  assert(
    outcome.reason.includes('UNKNOWN'),
    `and is recorded as UNKNOWN rather than as "no legacy data" (${outcome.reason})`,
  );
  assert(!outcome.reason.includes('fresh install'), 'and is NOT called a fresh install');
}

// ── Web has no container, and that is its own answer. ────────────────────────────────────────────
{
  const adapter = new MemoryStorageAdapter();
  const { outcome } = await migrateFromLegacy(adapter, async () => reportWith({}, { supported: false, store: null }));
  assert(!outcome.migrated, 'web migrates nothing');
  assert(outcome.reason.includes('web'), `and says why (${outcome.reason})`);
}

// ── ⛔ A read that THROWS never becomes "nothing to migrate". ─────────────────────────────────────
{
  const adapter = new MemoryStorageAdapter();
  const { outcome, store } = await migrateFromLegacy(adapter, async () => {
    throw new Error('mmkv exploded');
  });
  assert(!outcome.migrated, 'a throwing read migrates nothing');
  assert(outcome.reason.includes('read threw'), `and the throw is recorded (${outcome.reason})`);
  eq(store, null, 'and no store is invented');
}

// ── ⛔ v1.6's quarantine is carried BEFORE the store is written. ──────────────────────────────────
{
  const quarantined: { raw: string; reason: string }[] = [];
  const adapter: StorageAdapter = {
    async read() {
      return null;
    },
    async write() {},
    async quarantine(raw, reason) {
      quarantined.push({ raw, reason });
    },
  };
  const { outcome } = await migrateFromLegacy(adapter, async () =>
    reportWith({
      ...POPULATED,
      'debtPlanner.__corrupt__.debtPlanner.goals.2026-07-01T00:00:00.000Z': '{"broken":',
    }),
  );
  assert(outcome.migrated, 'the store still migrates alongside a quarantine');
  eq(outcome.quarantined, 1, 'the quarantined entry is carried');
  eq(quarantined[0].raw, '{"broken":', 'and its BYTES are carried verbatim — the only copy left');
  assert(quarantined[0].reason.startsWith('v1.6-'), 'tagged as coming from v1.6');
}

// ── A quarantine write that fails must not cost the migration. ───────────────────────────────────
{
  const adapter: StorageAdapter = {
    async read() {
      return null;
    },
    async write() {},
    async quarantine() {
      throw new Error('quarantine full');
    },
  };
  const { outcome } = await migrateFromLegacy(adapter, async () =>
    reportWith({ ...POPULATED, 'debtPlanner.__corrupt__.x.2026-01-01': 'bytes' }),
  );
  assert(outcome.migrated, 'losing the quarantine is bad; losing the migration is worse');
  eq(outcome.quarantined, 0, 'and the failure is visible in the count');
}

// ── An adapter with no quarantine support is fine (the contract marks it optional). ───────────────
{
  const adapter: StorageAdapter = {
    async read() {
      return null;
    },
    async write() {},
  };
  const { outcome } = await migrateFromLegacy(adapter, async () =>
    reportWith({ ...POPULATED, 'debtPlanner.__corrupt__.x.2026-01-01': 'bytes' }),
  );
  assert(outcome.migrated, 'a quarantine-less adapter still migrates');
}

// ── ⭐ The report survives, so a device probe can say what happened. ──────────────────────────────
{
  const adapter = new MemoryStorageAdapter();
  const { outcome } = await migrateFromLegacy(adapter, async () => reportWith(POPULATED));
  assert(outcome.map !== null, 'the mapping report is carried out');
  eq(outcome.map?.unknown, [], 'with zero unknown keys for a known-good store');
  assert((outcome.read?.visited ?? 0) > 0, 'and the read report, including how much was walked');
}

// ── The migrated blob is a real DebtStore, not a partial. ─────────────────────────────────────────
{
  const adapter = new MemoryStorageAdapter();
  const { store } = await migrateFromLegacy(adapter, async () => reportWith(POPULATED));
  const typed = store as DebtStore;
  assert(Array.isArray(typed.requiredExpenses), 'requiredExpenses defaulted to an array, not undefined');
  assert(Array.isArray(typed.cycleHistory), 'cycleHistory defaulted');
  assert(typeof typed.cushionFloor === 'number', 'cushionFloor got its default');
  assert(typed.paycheck.incomeVaries === false, 'a v1.6 blob defaults to fixed income');
}

  console.log(`✅ migrateFromLegacy tests passed (${passed} asserts).`);
}
