import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { serializeBackup } from '@/data/backup';
import { createDefaultStore } from '@/data/defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';
import { describeBackup, readBackup, v16FileToLegacyItems } from '@/data/readBackup';

/**
 * 5.8.3 — the import router + the v1.6 file adapter.
 *
 * ⛔ **The assertion that matters most is that v1.6 data actually LANDS.** The 5.8 before-scan measured the
 * pre-5.8 path against a real v1.6 file: income 2100 → blank, `currentDate` → today, six keys stranded at
 * top level, and `payCycle` "surviving" only because it happened to match the default. That last one is
 * why the tests below assert against values that DIFFER from the defaults — an assertion that a field
 * equals the default proves nothing about whether it was mapped.
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

const AT = new Date('2026-08-19T12:00:00.000Z');

/** Field-for-field from `origin/v1.6-dev`'s `buildBackupData()` — NOT from the e2e fixture subset. */
function realV16Backup(): Record<string, unknown> {
  return {
    version: 1,
    exportedAt: '2026-05-23T14:02:11.000Z',
    amount: '2100',
    payCycle: 'monthly',
    semiMonthlyFirstDay: 1,
    semiMonthlySecondDay: 15,
    monthlyPayDay: 12,
    currentDate: '2026-05-23',
    nextPaycheckDate: '2026-06-05',
    requiredExpenses: [{ id: 'e1', name: 'Rent', amount: 1200 }],
    livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 400 }],
    debts: [
      {
        id: 'd1',
        name: 'Visa',
        balance: 1200,
        minimumPayment: 35,
        dueDate: '2026-09-01',
        apr: 19.99,
        type: 'debt',
        recurrence: 'monthly',
      },
    ],
    goals: [{ id: 'g1', name: 'Emergency fund', target: 1000 }],
    completedRecommendedActions: [],
    payoffStrategy: 'avalanche',
    lastSavedAt: '2026-05-23T14:00:00.000Z',
    cycleHistory: [],
  };
}

// ── ⛔ THE HEADLINE: a real v1.6 file's data LANDS, where the pre-5.8 path lost it. ───────────────
{
  const result = readBackup(JSON.stringify(realV16Backup()));
  assert(result.ok, 'a real v1.6 backup file is read');
  if (result.ok) {
    eq(result.kind, 'v16-file', '  …as a v1.6 file');
    eq(result.store.paycheck.amount, '2100', '  ⭐ income LANDS (was blank before 5.8)');
    eq(result.store.paycheck.currentDate, '2026-05-23', '  ⭐ the backup date LANDS (was today before 5.8)');
    eq(result.store.paycheck.nextPaycheckDate, '2026-06-05', '  nextPaycheckDate lands');
    eq(result.store.debts.length, 1, '  the debt lands');
    eq(result.store.debts[0]?.name, 'Visa', '  …with its name');
    eq(result.store.requiredExpenses?.length, 1, '  requiredExpenses land');
    eq(result.store.livingExpenses?.length, 1, '  ⭐ livingExpenses land — the field the e2e fixture omits');
    eq(result.store.goals?.length, 1, '  goals land');
    eq(result.store.storeVersion, CURRENT_STORE_VERSION, '  and the result is migrated to current');
  }
}

// ── ⛔ The coincidence trap: assert on values that DIFFER from the defaults. ──────────────────────
// `payCycle` and `payoffStrategy` are set to non-default values above precisely so that "it matches" is
// evidence of mapping rather than evidence of a default.
{
  const defaults = createDefaultStore();
  const result = readBackup(JSON.stringify(realV16Backup()));
  assert(result.ok, 'read for the coincidence check');
  if (result.ok) {
    assert(defaults.paycheck.payCycle !== 'monthly', '  the fixture payCycle DIFFERS from the default (else the test proves nothing)');
    eq(result.store.paycheck.payCycle, 'monthly', '  ⭐ payCycle is MAPPED, not defaulted');
    assert(defaults.payoffStrategy !== 'avalanche', '  the fixture strategy DIFFERS from the default');
    eq(result.store.payoffStrategy, 'avalanche', '  ⭐ payoffStrategy is MAPPED, not defaulted');
    eq(result.store.paycheck.monthlyPayDay, 12, '  monthlyPayDay is mapped (12, not the default)');
  }
}

// ── File metadata is skipped, not reported as unknown. ───────────────────────────────────────────
{
  const items = v16FileToLegacyItems(realV16Backup());
  assert(!('debtPlanner.version' in items), '`version` is not passed to the mapper');
  assert(!('debtPlanner.exportedAt' in items), '`exportedAt` is not passed to the mapper');
  assert('debtPlanner.amount' in items, 'real data IS passed, prefixed');
  eq(items['debtPlanner.amount'], '"2100"', 'values are re-encoded as JSON strings, as the mapper expects');
  eq(items['debtPlanner.monthlyPayDay'], '12', 'a number re-encodes as a number, not as a quoted string');

  const result = readBackup(JSON.stringify(realV16Backup()));
  if (result.ok) {
    eq(result.legacy?.unknown, [], '⭐ ZERO unknown keys — a healthy v1.6 file reports nothing puzzling');
    assert((result.legacy?.mapped.length ?? 0) > 0, 'the mapping report is carried for 5.8.4');
  }
}

// ── The envelope path. ───────────────────────────────────────────────────────────────────────────
{
  const store = createDefaultStore();
  const result = readBackup(serializeBackup(store, { now: AT }));
  assert(result.ok, 'a 5.8.1 envelope is read');
  if (result.ok) {
    eq(result.kind, 'envelope', '  …as an envelope');
    eq(result.store.storeVersion, CURRENT_STORE_VERSION, '  and migrated');
    assert(result.legacy === undefined, '  no legacy report on a native backup');
  }
}

// ── The raw-v17 path (the pre-5.8 clipboard export). ─────────────────────────────────────────────
{
  const store = { ...createDefaultStore(), payoffStrategy: 'avalanche' } as DebtStore;
  const result = readBackup(JSON.stringify(store));
  assert(result.ok, 'a bare v1.7 store is read');
  if (result.ok) {
    eq(result.kind, 'raw-v17', '  …as raw-v17');
    eq(result.store.payoffStrategy, 'avalanche', '  and its data survives');
  }
}

// ── ⛔ Refusals — the whole point of the item. ────────────────────────────────────────────────────
{
  for (const [label, text] of [
    ['an empty object', '{}'],
    ['a package.json', JSON.stringify({ name: 'p', version: '1.0.0', dependencies: {} })],
    ["another app's export", JSON.stringify({ userProfile: {}, assets: [] })],
    ['a settings blob', JSON.stringify({ theme: 'dark' })],
    ['prose', 'this is my backup I promise'],
    ['an array', '[1,2,3]'],
    ['empty', ''],
  ] as [string, string][]) {
    const result = readBackup(text);
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) assert(result.message.length > 0, `  …with a message: ${label}`);
  }
}

// ── ⛔ A RECOGNISED format is not a TRUSTED one — a poisoned payload refuses, never throws. ───────
// Detection proves the top-level shape; `runMigrations` reaches inside. Unwrapped, these crash.
{
  const poisoned = [
    ['envelope with a string `debts`', { ...JSON.parse(serializeBackup(createDefaultStore(), { now: AT })), store: { storeVersion: 7, debts: 'oops', paycheck: {} } }],
    ['raw-v17 with a poisoned debt', { storeVersion: 7, paycheck: {}, debts: [null] }],
    ['v1.6 file with a string `debts`', { ...realV16Backup(), debts: 'oops' }],
  ] as [string, unknown][];
  for (const [label, value] of poisoned) {
    let threw = false;
    let result;
    try {
      result = readBackup(JSON.stringify(value));
    } catch {
      threw = true;
    }
    assert(!threw, `does NOT throw: ${label}`);
    assert(result !== undefined && !result.ok, `  …refuses instead: ${label}`);
  }
}

// ── The rescued fixture: still a subset, still correctly refused. ────────────────────────────────
// Kept as a real artifact of what v1.6's e2e used, and asserted to be UNRECOGNISED so that if anyone
// later loosens the marker rule to make it "work", this reds.
{
  const fixture = readFileSync(
    join(__dirname, 'legacyBridge', '__fixtures__', 'v16-backup-file-subset.json'),
    'utf8',
  );
  const parsed = JSON.parse(fixture) as Record<string, unknown>;
  assert(!('version' in parsed), 'the rescued fixture genuinely lacks `version`');
  assert(!('livingExpenses' in parsed), '…and lacks `livingExpenses`, which real files carry');
  const result = readBackup(fixture);
  assert(!result.ok, 'the fixture subset is REFUSED — no real v1.6 export ever looked like it');
}

// ── Nothing is committed: the router returns a store, it does not write one. ─────────────────────
{
  const before = JSON.stringify(createDefaultStore());
  const source = realV16Backup();
  const sourceBefore = JSON.stringify(source);
  const result = readBackup(JSON.stringify(source));
  assert(result.ok, 'read for the purity check');
  assert(JSON.stringify(createDefaultStore()) === before, 'the defaults factory is untouched — no shared-state leak');
  assert(JSON.stringify(source) === sourceBefore, "the caller's own object is not mutated by the read");
}

// ── 5.8.4's summary: it describes the MIGRATED store, not the file. ─────────────────────────────
// ⛔ This is the load-bearing distinction. If a v1.6 file's debts fail to map, the summary must say "no
// debts" so the user can stop — counting the FILE's own array would report them present right up until
// they vanished, which is reassurance rather than information.
{
  const result = readBackup(JSON.stringify(realV16Backup()));
  assert(result.ok, 'read for the summary');
  if (result.ok) {
    const text = describeBackup(result);
    assert(text.includes('1 debt'), `summary counts the debt — "${text}"`);
    assert(text.includes('2 expenses'), '  …and sums required + living expenses');
    assert(text.includes('1 goal'), '  …and the goal');
    assert(text.includes('older version'), '  …and names the source as a v1.6 file');
  }
}
{
  // A file whose debts do NOT survive the mapping must SAY so.
  const broken = { ...realV16Backup(), debts: [] };
  const result = readBackup(JSON.stringify(broken));
  assert(result.ok, 'read a v1.6 file with no debts');
  if (result.ok) {
    const text = describeBackup(result);
    assert(text.includes('0 debts'), `⭐ an empty result is reported as empty — "${text}"`);
  }
}
{
  // Singular/plural is not cosmetic here — "1 debts" reads as a bug in a screen asking for consent.
  const result = readBackup(serializeBackup(createDefaultStore(), { now: AT }));
  assert(result.ok, 'read an empty envelope');
  if (result.ok) {
    const text = describeBackup(result);
    assert(text.includes('0 debts') && text.includes('0 expenses') && text.includes('0 goals'), `plurals on zero — "${text}"`);
    assert(!text.includes('older version'), '  …and a native backup is not described as legacy');
  }
}

console.log(`✅ readBackup router tests passed (${passed} asserts).`);
