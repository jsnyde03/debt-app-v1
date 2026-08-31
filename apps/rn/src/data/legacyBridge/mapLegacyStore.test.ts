import { runMigrations } from '@/data/migrations';
import { CURRENT_STORE_VERSION } from '@/data/models';
import { mapLegacyStore } from '@/data/legacyBridge/mapLegacyStore';

/**
 * 5.2 — the v1.6 → v1.7 key mapping.
 *
 * ⛔ **Every failure here is silent and irreversible.** A key mapped to the wrong field, a theme read from
 * the wrong shape, a debt that loses `originalBalance` — none of them throw, none of them show up in a
 * screenshot, and all of them land on the user's real portfolio during an upgrade they did not ask to
 * participate in. The assertions below are the only place these get to fail cheaply.
 *
 * The fixtures are built from the SHAPES MEASURED on `origin/v1.6-dev` at 5.2's before-scan — the key
 * names from a sweep of that tree, the types from its `usePersistedState<T>` calls, and the storage
 * quirks from its own source. Not from the v1.7 in-tree legacy copy, which has drifted.
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

/** v1.6 wrote every key through `writeKey`, which is `JSON.stringify` — except where noted below. */
const j = (value: unknown) => JSON.stringify(value);

const DEBT = {
  id: 'd1',
  name: 'Visa',
  balance: 1200,
  minimumPayment: 35,
  dueDate: '2026-09-01',  // fixture-date-ok: passenger — PLANTED 2020-01-01 across all 11 sites, `test:app` stayed green, so no assertion here reads this date against the clock
  apr: 19.99,
  type: 'debt',
  recurrence: 'monthly',
};

function fullLegacyStore(): Record<string, string> {
  return {
    'debtPlanner.schemaVersion': j(2),
    'debtPlanner.amount': j('2400'),
    'debtPlanner.payCycle': j('biweekly'),
    'debtPlanner.currentDate': j('2026-08-19'),
    'debtPlanner.nextPaycheckDate': j('2026-08-28'),
    'debtPlanner.semiMonthlyFirstDay': j('1'),
    'debtPlanner.semiMonthlySecondDay': j('15'),
    'debtPlanner.monthlyPayDay': j('1'),
    'debtPlanner.debts': j([DEBT]),
    'debtPlanner.requiredExpenses': j([{ id: 'e1', name: 'Rent', amount: 1400 }]),
    'debtPlanner.livingExpenses': j([{ id: 'l1', name: 'Groceries', amount: 400 }]),
    // ⛔ v1.6's real goal shape is `targetAmount`/`currentAmount` — see `readBackup.test.ts`. [S1.1]
    'debtPlanner.goals': j([{ id: 'g1', name: 'Trip', targetAmount: 1000, currentAmount: 250, type: 'savings' }]),
    'debtPlanner.cycleHistory': j([]),
    'debtPlanner.completedRecommendedActions': j([]),
    'debtPlanner.payoffStrategy': j('avalanche'),
    'debtPlanner.milestoneMaxProgress': j({ d1: 10 }),
    'debtPlanner.lastHandledPaydayDate': j('2026-08-14'),
    'debtPlanner.lastSavedAt': j('2026-08-19T10:00:00.000Z'),
    'debtPlanner.hasCompletedOnboarding': j(true),
    'debtPlanner.notificationsEnabled': j(true),
    'debtPlanner.appLockEnabled': j(false),
    'debtPlanner.darkMode': j('dark'),
  };
}

// ── The whole store maps, and every key is accounted for. ─────────────────────────────────────────
{
  const { partial, report } = mapLegacyStore(fullLegacyStore());
  eq(partial.paycheck?.amount, '2400', 'the paycheck amount carries (a STRING on both sides)');
  eq(partial.paycheck?.payCycle, 'biweekly', 'the pay cycle carries');
  eq(partial.paycheck?.semiMonthlySecondDay, '15', 'a semi-monthly day carries');
  eq((partial.debts as unknown[])?.length, 1, 'the debts array carries');
  eq(partial.payoffStrategy, 'avalanche', 'the strategy carries');
  eq(partial.prefs?.onboardingComplete, true, 'hasCompletedOnboarding → prefs.onboardingComplete (RENAMED)');
  eq(partial.prefs?.themeMode, 'dark', 'darkMode → prefs.themeMode');
  eq(report.unknown, [], 'no key in a real v1.6 store is unrecognised');
  eq(report.unparseable, [], 'every value parsed');
  eq(report.legacySchemaVersion, 2, 'the legacy schema version is read');
  assert(report.mapped.length === 21, `21 keys mapped (got ${report.mapped.length})`);
}

// ── ⛔ The theme union. v1.6 wrote THREE different shapes into one key. ───────────────────────────
for (const [stored, expected, label] of [
  ['"dark"', 'dark', 'the string form'],
  ['"light"', 'light', 'the string form, light'],
  ['"system"', 'system', 'the string form, system'],
  ['true', 'dark', 'the PRE-ThemePreference BOOLEAN true → dark'],
  ['false', 'light', 'the pre-ThemePreference boolean false → light'],
] as const) {
  const { partial } = mapLegacyStore({ 'debtPlanner.darkMode': stored });
  eq(partial.prefs?.themeMode, expected, `darkMode: ${label}`);
}
{
  // `null` is a real stored value — "no preference" — and must NOT become a theme.
  const { partial, report } = mapLegacyStore({ 'debtPlanner.darkMode': 'null' });
  eq(partial.prefs, undefined, 'darkMode null sets NO theme, so the default applies');
  eq(report.dropped.length, 1, 'and it is reported as a decision, not silently ignored');
}

// ── ⛔ Nothing is silently discarded. ─────────────────────────────────────────────────────────────
{
  const { report } = mapLegacyStore({
    'debtPlanner.debts': j([DEBT]),
    'debtPlanner.somethingNobodyMapped': j(1),
  });
  eq(report.unknown, ['debtPlanner.somethingNobodyMapped'], 'an unrecognised key is REPORTED, not ignored');
}
{
  const { report } = mapLegacyStore({ 'debtPlanner.isDemoMode': j(true), 'debtPlanner.resetSnapshot': j({ a: 1 }) });
  eq(report.dropped.length, 2, 'deliberate drops are recorded');
  assert(
    report.dropped.every((d) => d.why.length > 0),
    'every drop carries a REASON — "not mapped" and "decided not to map" must be distinguishable',
  );
}

// ⚡ The value v1.6 wrote WITHOUT JSON.stringify. `localStorage.setItem("debtPlanner.mockSubscription",
// "premium")` — a bare string, not JSON. It is a dropped key so the parse never runs, but the case is
// pinned because 5.1a's decoder assumed every legacy value was stringified, and this is the counterexample.
{
  const { report } = mapLegacyStore({ 'debtPlanner.mockSubscription': 'premium' });
  eq(report.unparseable, [], 'a non-JSON value on a DROPPED key never reaches the parser');
  eq(report.dropped.length, 1, 'and it is dropped by decision');
}
{
  // The same non-JSON shape on a key we DO map must be reported, never defaulted.
  const { partial, report } = mapLegacyStore({ 'debtPlanner.payoffStrategy': 'avalanche' });
  eq(report.unparseable, ['debtPlanner.payoffStrategy'], 'an unparseable MAPPED value is reported');
  eq(partial.payoffStrategy, undefined, 'and it is left unset rather than guessed');
}

// ── ⛔ v1.6's quarantine is the only surviving copy of a corrupt key. It is CARRIED. ──────────────
{
  const { quarantine, report } = mapLegacyStore({
    'debtPlanner.debts': j([DEBT]),
    'debtPlanner.__corrupt__.debtPlanner.goals.2026-07-01T00:00:00.000Z': '{"broken":',
  });
  eq(report.quarantined.length, 1, 'the quarantined key is carried, not dropped');
  eq(
    quarantine['debtPlanner.__corrupt__.debtPlanner.goals.2026-07-01T00:00:00.000Z'],
    '{"broken":',
    'and its BYTES survive verbatim — they are the only copy left',
  );
  eq(report.unparseable, [], 'quarantined bytes are never parsed (they are corrupt BY DEFINITION)');
}

// ── ⛔ v1.7's OWN web key shares the namespace and must not be treated as legacy. ─────────────────
{
  const { report } = mapLegacyStore({
    'debtPlanner.rnStore': j({ storeVersion: 7 }),
    'debtPlanner.rnStore.__quarantine__.x': 'bytes',
    'debtPlanner.debts': j([DEBT]),
  });
  eq(report.unknown, [], 'rnStore is not reported as an unknown legacy key');
  eq(report.mapped, ['debtPlanner.debts'], 'and it is not mapped — only the real legacy key is');
}

// ── The originalBalance backfill (v1.5's migration, ported). ──────────────────────────────────────
{
  const { partial, report } = mapLegacyStore({ 'debtPlanner.debts': j([DEBT]) });
  const debts = partial.debts as { originalBalance?: number }[];
  eq(debts[0].originalBalance, 1200, 'a debt with no originalBalance is anchored to its balance');
  eq(report.originalBalanceBackfilled, 1, 'and the backfill is COUNTED, so a silent no-op is visible');
}
{
  const { partial, report } = mapLegacyStore({ 'debtPlanner.debts': j([{ ...DEBT, originalBalance: 3000 }]) });
  const debts = partial.debts as { originalBalance?: number }[];
  eq(debts[0].originalBalance, 3000, 'an existing originalBalance is NOT overwritten');
  eq(report.originalBalanceBackfilled, 0, 'and nothing is counted as backfilled');
}

// ── ⭐ THE COMPOSITION: the mapper's partial, through the REAL runMigrations. ─────────────────────
// This is the property the design rests on — the bridge does not re-implement defaults, it delegates.
{
  const { partial } = mapLegacyStore(fullLegacyStore());
  const store = runMigrations(partial);
  eq(store.storeVersion, CURRENT_STORE_VERSION, 'the migrated store lands at the current version');
  eq(store.paycheck.amount, '2400', 'the mapped paycheck survived the merge');
  eq(store.prefs.themeMode, 'dark', 'the mapped theme survived the merge');
  eq(store.prefs.onboardingComplete, true, 'the renamed onboarding flag survived');
  eq(store.debts.length, 1, 'the debt survived');
  // ⭐ The three fields v1.6 never had, filled by runMigrations rather than by the mapper.
  assert(typeof store.debts[0].lastVerifiedDate === 'string', 'runMigrations backfilled lastVerifiedDate');
  assert(typeof store.debts[0].balanceAsOfDate === 'string', 'runMigrations backfilled balanceAsOfDate');
  // ⚠️ Fields v1.6 has no concept of must come from DEFAULTS, not from undefined.
  assert(store.paycheck.incomeVaries === false, 'a v1.6 blob defaults to fixed income');
  eq(store.prefs.coachMarksSeen, [], 'and to an empty coach-mark list — every mark offered once');
  eq(store.prefs.tutorialSeen, null, 'and to an unseen tutorial');
}

// ── ⭐ THE REAL CAPTURED CONTAINER'S KEY SET — measured, not imagined. ────────────────────────────
// These are the 22 `debtPlanner.*` keys `legacy-container-capture` recovered from an actual iOS 26.2
// simulator container at
//   Library/WebKit/com.jasonsnyder.debtplanner/WebsiteData/Default/<salt>/<salt>/LocalStorage/localstorage.sqlite3
// ⛔ The assertion that matters is ZERO UNKNOWNS: if a real v1.6 store holds a key this mapper has never
// heard of, that is data about to be silently dropped, and this is where it gets caught.
// ⚠️ It proves LOCATION and SHAPE, not coverage — the set is the SIM_SMOKE seeder's, so it lacks
// `isDemoMode`, `resetSnapshot`, `rolloverCount`, `reviewRequested`, `lastHandledPaydayDate` and any
// quarantine. Those are 5.10's job.
{
  const CAPTURED_KEYS = [
    'amount', 'appLockEnabled', 'completedRecommendedActions', 'currentDate', 'cycleHistory',
    'darkMode', 'debts', 'goals', 'hasCompletedOnboarding', 'hasConfiguredPaycheck', 'lastSavedAt',
    'livingExpenses', 'milestoneMaxProgress', 'monthlyPayDay', 'nextPaycheckDate',
    'notificationsEnabled', 'payCycle', 'payoffStrategy', 'requiredExpenses', 'schemaVersion',
    'semiMonthlyFirstDay', 'semiMonthlySecondDay',
  ];
  assert(CAPTURED_KEYS.length === 22, `the captured container held 22 keys (${CAPTURED_KEYS.length})`);
  const items: Record<string, string> = {};
  for (const key of CAPTURED_KEYS) items[`debtPlanner.${key}`] = j(key === 'debts' ? [DEBT] : 1);
  const { report } = mapLegacyStore(items);
  eq(report.unknown, [], 'ZERO unknown keys against the real captured container');
  assert(
    report.mapped.length + report.dropped.length === 22,
    `every captured key is either mapped or deliberately dropped (${report.mapped.length}+${report.dropped.length})`,
  );
}

// ── An empty / absent legacy store is not an error. ───────────────────────────────────────────────
{
  const { partial, report } = mapLegacyStore({});
  eq(partial, {}, 'no keys → an empty partial');
  eq(report.mapped, [], 'nothing mapped');
  eq(report.unknown, [], 'and nothing unknown — an absent store is a fresh install, not a failure');
}

console.log(`✅ mapLegacyStore tests passed (${passed} asserts).`);
