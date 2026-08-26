import { serializeBackup } from '@/data/backup';
import { createDefaultStore } from '@/data/defaults';
import { detectBackupFormat, detectBackupText, type BackupKind } from '@/data/detectBackupFormat';

/**
 * 5.8.2 — format detection.
 *
 * ⛔ **Every assertion here is really about the false-POSITIVE direction.** Misclassifying foreign JSON as
 * a backup routes it into `importStore`, which replaces the user's portfolio; misclassifying a real backup
 * as foreign just tells them to try again. So the interesting tests are not "does it recognise ours" —
 * they are "does it refuse everything that merely resembles ours".
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function kindIs(value: unknown, expected: BackupKind, label: string) {
  const got = detectBackupFormat(value).kind;
  assert(got === expected, `${label} → ${expected} (got ${got})`);
}

/**
 * A REAL v1.6 backup, field-for-field from `origin/v1.6-dev`'s `buildBackupData()`.
 * ⚠️ NOT from `tests/e2e/fixtures/backup-import.json`, which is a hand-made subset missing six real
 * fields — see the 5.8.2 before-scan. Using the fixture as the model here would have tested a shape no
 * user has.
 */
function realV16Backup(): Record<string, unknown> {
  return {
    version: 1,
    exportedAt: '2026-05-23T14:02:11.000Z',
    amount: '2100',
    payCycle: 'biweekly',
    semiMonthlyFirstDay: 1,
    semiMonthlySecondDay: 15,
    monthlyPayDay: 1,
    currentDate: '2026-05-23',
    nextPaycheckDate: '2026-06-05',
    requiredExpenses: [{ id: 'e1', name: 'Rent', amount: 1200 }],
    livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 400 }],
    debts: [{ id: 'd1', name: 'Visa', balance: 1200, minimumPayment: 35 }],
    // ⛔ v1.6's real goal shape is `targetAmount`/`currentAmount` — see `readBackup.test.ts`. [S1.1]
    goals: [{ id: 'g1', name: 'Emergency fund', targetAmount: 1000, currentAmount: 250, type: 'emergency' }],
    completedRecommendedActions: [],
    payoffStrategy: 'snowball',
    lastSavedAt: '2026-05-23T14:00:00.000Z',
    cycleHistory: [],
  };
}

// ── The three recognised formats. ────────────────────────────────────────────────────────────────
{
  kindIs(JSON.parse(serializeBackup(createDefaultStore(), { now: new Date('2026-08-19') })), 'envelope', '5.8.1 envelope');
  kindIs(realV16Backup(), 'v16-file', 'a real v1.6 backup');
  kindIs(createDefaultStore(), 'raw-v17', 'a bare v1.7 store (the pre-5.8 clipboard export)');
}

// ── ⛔ Near-misses. Each of these RESEMBLES a backup and must still be refused. ───────────────────
{
  kindIs({}, 'unrecognised', 'an empty object');
  kindIs({ name: 'some-pkg', version: '1.0.0', dependencies: {} }, 'unrecognised', 'a package.json (version is a STRING)');
  kindIs({ version: 1 }, 'unrecognised', 'a bare numeric `version` — far too common a key to be evidence');
  kindIs({ version: 1, exportedAt: '2026-01-01' }, 'unrecognised', 'the v1.6 marker pair with NO v1.6 data');
  kindIs({ exportedAt: '2026-01-01', payCycle: 'biweekly' }, 'unrecognised', 'v1.6 data but no `version`');
  kindIs({ version: 1, payCycle: 'biweekly' }, 'unrecognised', 'v1.6 data but no `exportedAt`');
  kindIs({ cloudFormat: 'financial-freedom-cloud-backup', payload: '{}' }, 'unrecognised', "another app's envelope");
  kindIs({ userProfile: { onboardingComplete: true }, assets: [] }, 'unrecognised', "another app's export");
  kindIs({ theme: 'dark', locale: 'en-US' }, 'unrecognised', 'a settings blob');
}

// ── ⛔ Partial v1.7 stores must NOT pass as `raw-v17` — all three fields are required together. ───
{
  kindIs({ storeVersion: 7 }, 'unrecognised', 'storeVersion alone');
  kindIs({ storeVersion: 7, paycheck: {} }, 'unrecognised', 'storeVersion + paycheck, no debts');
  kindIs({ storeVersion: 7, debts: [] }, 'unrecognised', 'storeVersion + debts, no paycheck');
  kindIs({ paycheck: {}, debts: [] }, 'unrecognised', 'paycheck + debts, no storeVersion');
  kindIs({ storeVersion: '7', paycheck: {}, debts: [] }, 'unrecognised', 'storeVersion as a STRING');
  kindIs({ storeVersion: 7, paycheck: [], debts: [] }, 'unrecognised', 'paycheck as an ARRAY');
  kindIs({ storeVersion: 7, paycheck: {}, debts: {} }, 'unrecognised', 'debts as an OBJECT');
}

// ── The branches are DISJOINT, not order-dependent. ──────────────────────────────────────────────
// A v1.7 store that also happens to carry v1.6's marker pair is a v1.7 store — the v1.6 test bails on
// either structural field, so the answer does not depend on which check runs first.
{
  kindIs(
    { ...createDefaultStore(), version: 1, exportedAt: '2026-01-01', payCycle: 'biweekly' },
    'raw-v17',
    'a v1.7 store wearing v1.6 markers',
  );
  // …and an envelope always wins, since it is the only unambiguous marker of the three.
  const envelope = JSON.parse(serializeBackup(createDefaultStore(), { now: new Date('2026-08-19') }));
  kindIs({ ...envelope, version: 1, exportedAt: '2026-01-01', payCycle: 'biweekly' }, 'envelope', 'an envelope wearing v1.6 markers');
}

// ── Non-objects are never a backup. ──────────────────────────────────────────────────────────────
{
  for (const [label, value] of [
    ['null', null],
    ['an array', [1, 2, 3]],
    ['a string', 'hello'],
    ['a number', 42],
    ['undefined', undefined],
    ['a v1.6 backup inside an ARRAY', [realV16Backup()]],
  ] as [string, unknown][]) {
    kindIs(value, 'unrecognised', label);
  }
}

// ── ⚠️ The e2e fixture is NOT detectable as v1.6, and that is CORRECT. ───────────────────────────
// It is a hand-made subset with no `version`/`exportedAt`. No real v1.6 export has ever looked like it,
// so recognising it would mean loosening the marker requirement to fit a test artifact — which is how a
// fixture chosen for convenience starts deciding what the guard can see.
{
  const fixtureShaped = realV16Backup();
  delete fixtureShaped.version;
  delete fixtureShaped.exportedAt;
  kindIs(fixtureShaped, 'unrecognised', 'the fixture shape (no marker pair) is refused, by design');
}

// ── `detectBackupText` — the text-in convenience, and it never throws. ───────────────────────────
{
  assert(detectBackupText(serializeBackup(createDefaultStore(), { now: new Date('2026-08-19') })).kind === 'envelope', 'text: an envelope');
  assert(detectBackupText(JSON.stringify(realV16Backup())).kind === 'v16-file', 'text: a v1.6 backup');
  assert(detectBackupText('').kind === 'unrecognised', 'text: empty string');
  assert(detectBackupText('not json at all').kind === 'unrecognised', 'text: prose');
  assert(detectBackupText('{"version":1,').kind === 'unrecognised', 'text: truncated JSON');
}

// ── Every outcome carries a reason (5.8.4's confirm step reads it). ──────────────────────────────
{
  for (const value of [createDefaultStore(), realV16Backup(), {}, null]) {
    assert(detectBackupFormat(value).detail.length > 0, `a detail is always present (${detectBackupFormat(value).kind})`);
  }
}

console.log(`✅ backup format detection tests passed (${passed} asserts).`);
