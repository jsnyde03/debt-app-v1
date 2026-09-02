import {
  BACKUP_APP_NAME,
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  backupFilename,
  isBackupEnvelope,
  parseBackup,
  serializeBackup,
} from '@/data/backup';
import { createDefaultStore } from '@/data/defaults';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';

/**
 * 5.8.1 — the backup FILE envelope.
 *
 * ⛔ **What these assertions are actually defending.** Before 5.8 the importer accepted ANY JSON object —
 * measured: `{}`, a `package.json` and another app's export were all accepted, migrated onto defaults and
 * written over the user's real portfolio. Nothing threw, nothing rendered wrong, and 39 RN e2e specs
 * never noticed because **not one of them imports anything**. The envelope's entire job is to turn that
 * silent guess into a refusal, so every test below is really asking one question: *does this refuse?*
 *
 * ⚠️ Detection of the two OTHER shapes (a raw v1.7 store, a v1.6 backup file) is 5.8.2 and is asserted
 * there. Here, ONLY the envelope is valid — a raw store must be rejected by this layer, because it is
 * 5.8.2's job to route it, not this one's to accept it.
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

function storeWithDebt(): DebtStore {
  const store = createDefaultStore();
  return {
    ...store,
    debts: [
      ...store.debts,
      {
        ...(store.debts[0] ?? ({} as DebtStore['debts'][number])),
        id: 'b1',
        name: 'Visa',
        balance: 1200,
        minimumPayment: 35,
      } as DebtStore['debts'][number],
    ],
  };
}

// ── Round trip: what goes in comes back out, unchanged. ───────────────────────────────────────────
{
  const store = storeWithDebt();
  const text = serializeBackup(store, { now: AT });
  const result = parseBackup(text);

  assert(result.ok, 'a serialized store parses back');
  if (result.ok) {
    eq(result.envelope.store, store, 'the store round-trips byte-identically');
    eq(result.envelope.format, BACKUP_FORMAT, 'the format marker is carried');
    eq(result.envelope.formatVersion, BACKUP_FORMAT_VERSION, 'the envelope version is carried');
    eq(result.envelope.app, BACKUP_APP_NAME, 'the app name is carried');
    eq(result.envelope.exportedAt, AT.toISOString(), 'the export timestamp is the injected one');
    eq(result.envelope.storeVersion, CURRENT_STORE_VERSION, 'the store version is lifted onto the envelope');
  }
}

// ── The store is NESTED, never spread. ────────────────────────────────────────────────────────────
// A future store field named `format`/`app`/`storeVersion` would collide with an envelope field if these
// were spread, and the envelope would win — silently, over real user data.
{
  const raw = JSON.parse(serializeBackup(createDefaultStore(), { now: AT })) as Record<string, unknown>;
  assert(typeof raw.store === 'object' && raw.store !== null, 'the store sits under `store`');
  assert(!('debts' in raw), 'store fields do NOT appear at the envelope level');
  assert(!('paycheck' in raw), 'nor does `paycheck` — nothing is spread');
}

// ── ⛔ THE DEFECT THIS EXISTS FOR: foreign JSON objects are REFUSED. ──────────────────────────────
// Each of these was measured as ACCEPTED by the pre-5.8 path, then written over the user's portfolio.
{
  const foreign: [string, unknown][] = [
    ['an empty object', {}],
    ['a package.json', { name: 'some-pkg', version: '1.0.0', dependencies: { react: '^19' } }],
    ["another app's export", { userProfile: { onboardingComplete: true }, assets: [], freedomDate: '2030-01-01' }],
    ['a settings blob', { theme: 'dark', locale: 'en-US' }],
  ];
  for (const [label, value] of foreign) {
    const result = parseBackup(JSON.stringify(value));
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'not-a-backup', `  …as not-a-backup: ${label}`);
  }
}

// ── A RAW v1.7 store is refused HERE (5.8.2 routes it, this layer must not guess). ────────────────
{
  const result = parseBackup(JSON.stringify(createDefaultStore()));
  assert(!result.ok, 'a bare store carries no marker → refused by the envelope layer');
  if (!result.ok) eq(result.reason, 'not-a-backup', '  …as not-a-backup, for 5.8.2 to route');
}

// ── Non-JSON and non-objects. ────────────────────────────────────────────────────────────────────
{
  for (const [label, text] of [
    ['empty string', ''],
    ['prose', 'here is my backup'],
    ['truncated json', '{"format":"debt-planner-backup"'],
  ] as [string, string][]) {
    const result = parseBackup(text);
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'not-json', `  …as not-json: ${label}`);
  }
  for (const [label, value] of [
    ['an array', [1, 2, 3]],
    ['a bare string', 'hello'],
    ['a number', 42],
    ['null', null],
  ] as [string, unknown][]) {
    const result = parseBackup(JSON.stringify(value));
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'not-a-backup', `  …as not-a-backup: ${label}`);
  }
}

// ── ⛔ Forward-incompatibility is REFUSED, not silently downgraded. ───────────────────────────────
// `runMigrations` only moves forward — it merges onto CURRENT defaults, so a future store would be
// stripped of everything this build doesn't know, and the restore would LOOK like it worked.
{
  const newerEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION + 1,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    storeVersion: CURRENT_STORE_VERSION,
    store: createDefaultStore(),
  };
  const result = parseBackup(JSON.stringify(newerEnvelope));
  assert(!result.ok, 'a NEWER envelope version is refused');
  if (!result.ok) {
    eq(result.reason, 'too-new', '  …as too-new');
    assert(result.message.includes('newer version'), '  …and the message says to update the app');
  }
}
{
  const newerStore = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    storeVersion: CURRENT_STORE_VERSION + 1,
    store: { ...createDefaultStore(), storeVersion: CURRENT_STORE_VERSION + 1 },
  };
  const result = parseBackup(JSON.stringify(newerStore));
  assert(!result.ok, 'a current envelope carrying a NEWER store is refused');
  if (!result.ok) eq(result.reason, 'too-new', '  …as too-new');
}
// …and the version cannot be smuggled past by deleting the envelope's copy of it.
{
  const smuggled = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    store: { ...createDefaultStore(), storeVersion: CURRENT_STORE_VERSION + 1 },
  };
  const result = parseBackup(JSON.stringify(smuggled));
  assert(!result.ok, 'deleting the envelope storeVersion does NOT hide a future store');
  if (!result.ok) eq(result.reason, 'too-new', '  …the payload is read as the fallback');
}

// ── Malformed: our format, our version, no usable payload. ────────────────────────────────────────
{
  for (const [label, store] of [
    ['a missing store', undefined],
    ['a null store', null],
    ['an array store', []],
    ['a string store', 'nope'],
  ] as [string, unknown][]) {
    const result = parseBackup(
      JSON.stringify({
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        app: BACKUP_APP_NAME,
        exportedAt: AT.toISOString(),
        storeVersion: CURRENT_STORE_VERSION,
        store,
      }),
    );
    assert(!result.ok, `REFUSED: ${label}`);
    if (!result.ok) eq(result.reason, 'malformed', `  …as malformed: ${label}`);
  }
}

// ── An OLDER store is accepted — that is what `runMigrations` is for at the import boundary. ──────
{
  const older = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: AT.toISOString(),
    storeVersion: 1,
    store: { ...createDefaultStore(), storeVersion: 1 },
  };
  const result = parseBackup(JSON.stringify(older));
  assert(result.ok, 'an OLDER store is accepted, not refused');
  if (result.ok) eq(result.envelope.storeVersion, 1, '  …and its version is reported unmigrated');
}

// ── A missing/typeless formatVersion is treated as too-new, not as valid. ────────────────────────
// A file with our marker but no version is not something this build can reason about; guessing "1" would
// be the same accept-anything instinct the whole item exists to remove.
{
  const result = parseBackup(
    JSON.stringify({ format: BACKUP_FORMAT, app: BACKUP_APP_NAME, store: createDefaultStore() }),
  );
  assert(!result.ok, 'no formatVersion → refused');
  if (!result.ok) eq(result.reason, 'too-new', '  …as too-new rather than assumed to be v1');
}

// ── `isBackupEnvelope` is the detection primitive 5.8.2 dispatches on. ───────────────────────────
{
  assert(isBackupEnvelope(JSON.parse(serializeBackup(createDefaultStore(), { now: AT }))), 'detects our own output');
  assert(!isBackupEnvelope(createDefaultStore()), 'a bare store is not an envelope');
  assert(!isBackupEnvelope({}), 'an empty object is not an envelope');
  assert(!isBackupEnvelope(null), 'null is not an envelope');
  assert(!isBackupEnvelope([{ format: BACKUP_FORMAT }]), 'an array is not an envelope');
  assert(!isBackupEnvelope({ format: 'financial-freedom-cloud-backup' }), "another app's marker is not ours");
}

// ── The serialized file is human-inspectable (it is a thing users save and look at). ─────────────
{
  const text = serializeBackup(createDefaultStore(), { now: AT });
  assert(text.includes('\n'), 'pretty-printed, not one line');
  assert(text.indexOf(BACKUP_FORMAT) < 100, 'the marker is near the top, visible on opening the file');
}

// ── 5.8.5's filename: v1.6's name, and a LOCAL date. ────────────────────────────────────────────
{
  eq(backupFilename('2026-08-19'), 'debt-planner-backup-2026-08-19.json', "matches v1.6's name, so one sorted series survives the upgrade");
  const generated = backupFilename();
  assert(/^debt-planner-backup-\d{4}-\d{2}-\d{2}\.json$/.test(generated), `the default is a dated name (${generated})`);
  // ⛔ The date must be LOCAL. v1.6 used `toISOString().slice(0,10)`, which east of UTC stamps an evening
  // backup with tomorrow — so it sorts ahead of one saved after it. Asserting against the UTC answer is
  // the only way this test can fail in the timezone where the bug is real.
  const local = new Date();
  const localISO = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
  eq(generated, `debt-planner-backup-${localISO}.json`, 'the date is LOCAL, not a UTC round-trip');
}

// ── S1.13.7.10 [pass-6 A3-17] — the three fields eight "backup" assertions CLAIMED and never touched. ──
{
  /**
   * ⛔ **S1.13.7.10 [pass-6 `A3-17`] — EIGHT RELEASE-GATE ASSERTIONS NAMED "backup ..." TESTED `JSON.parse(JSON.stringify(literal))`.
   *
   * They lived in `packages/core/testing/testPlannerStateHardening.ts` and `testFinalLaunchRegression.ts`,
   * inside `test:regression`, inside `validate:release:rn` — proving a property of the JavaScript engine
   * while reading as coverage of the one path where a defect loses a user's whole portfolio. Core cannot
   * import the backup code at all; its import lists are `allocatePaycheck` + the rollovers and nothing else.
   *
   * ⚡ ** AND THE HOLE THEY HID WAS REAL. Measured while closing this: the genuine suite here had 48
   * assertions and mentioned `completedRecommendedActions`, `isPaidThisCycle` and `minimumPaidThisCycle`
   * ZERO times — the exact three properties those eight assertions named. So the fake coverage was not
   * merely useless, it was sitting on a gap. These drive the real `serializeBackup` -> `parseBackup`.
   */
  const store = createDefaultStore();
  store.completedRecommendedActions = [
    { targetId: 'paypal-2', label: 'Extra payment to PayPal', category: 'snowball', recommendedAmount: 100, actualAmount: 100 },
  ];
  store.requiredExpenses = [
    { id: 'e1', name: 'Rent', amount: 1465, dueDate: '2026-09-01', recurrence: 'monthly', isPaidThisCycle: true }, // fixture-date-ok: this test asserts round-trip / deletion identity; no branch here reads a clock
  ];
  store.debts = [
    { id: 'card', name: 'Visa', balance: 4271, minimumPayment: 96, apr: 22.74, dueDate: '2026-09-04', type: 'debt', recurrence: 'monthly', minimumPaidThisCycle: true, isPaidThisCycle: true }, // fixture-date-ok: this test asserts round-trip / deletion identity; no branch here reads a clock
  ];

  const parsed = parseBackup(serializeBackup(store));
  assert(parsed.ok, 'a store carrying paid-state and completed actions round-trips through the real envelope');
  if (parsed.ok) {
    const back = parsed.envelope.store;
    eq(back.completedRecommendedActions.length, 1, 'the completed action survives the round trip');
    eq(back.completedRecommendedActions[0]?.targetId, 'paypal-2', "...with the id the plan's next cycle reads");
    eq(back.completedRecommendedActions[0]?.actualAmount, 100, '...and the amount the ledger is fed');
    // ⚠️  The paid flags are the ones a user notices: restore a backup and every bill you already paid
    // this cycle is asking to be paid again.
    eq(back.requiredExpenses[0]?.isPaidThisCycle, true, 'a bill already paid this cycle is still paid after a restore');
    eq(back.debts[0]?.minimumPaidThisCycle, true, "...and a debt's minimum is still marked paid");
    eq(back.debts[0]?.isPaidThisCycle, true, '...on the legacy flag the required-action view still reads');
  }
}

// ── S1.13.7.10 [pass-6 D1-6] — a LARGE portfolio, with duplicate names, through the real envelope. ──
{
  /**
   * ⛔ **S1.13.7.10 [pass-6 `D1-6`] — `testAbuseScenarios.ts`'s "Import/export abuse" block asserted `JSON.parse(JSON.stringify(x))`
   * over 100 hand-built debts — the only import/export coverage in a file whose whole subject is abuse,
   * and it could never red for any change to this repo. The one property it was gesturing at is worth
   * keeping: identity survives at SCALE, with names that do not distinguish rows.
   *
   * ⚠️ ** Duplicate names are the point. Every debt here is called "Duplicate Name", so nothing but the ID
   * can tell row 88 from row 87 — which is exactly the condition under which an identity bug is
   * invisible on screen.
   */
  const big = createDefaultStore();
  big.debts = Array.from({ length: 100 }, (_, i) => ({
    id: `debt-${i + 1}`,
    name: 'Duplicate Name',
    balance: 100 + i,
    minimumPayment: 25,
    apr: 19.99,
    dueDate: '2026-09-04', // fixture-date-ok: identity at scale; no branch here reads a clock
    type: 'debt' as const,
    recurrence: 'monthly' as const,
  }));
  big.completedRecommendedActions = [
    { targetId: 'debt-88', label: 'Extra payment to Duplicate Name', category: 'snowball', recommendedAmount: 25, actualAmount: 25 },
  ];

  const round = parseBackup(serializeBackup(big));
  assert(round.ok, 'a 100-debt portfolio round-trips through the real envelope');
  if (round.ok) {
    const back = round.envelope.store;
    eq(back.debts.length, 100, 'all 100 debts survive');
    eq(back.debts[87]?.id, 'debt-88', '⚡  the 88th row is still the 88th row — ORDER carries the identity here');
    eq(back.debts[87]?.balance, 187, '...with its own balance, not a neighbour’s');
    eq(back.completedRecommendedActions[0]?.targetId, 'debt-88', '...and the action still points at it');
  }
}

console.log(`✅ backup envelope tests passed (${passed} asserts).`);
