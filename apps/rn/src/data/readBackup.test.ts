import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { serializeBackup } from '@/data/backup';
import { createDefaultStore } from '@/data/defaults';
import { runMigrations, SYNTHETIC_LOSS_FIELDS, WHOLE_LIST_LOSS_FIELD, WHOLE_ROW_LOSS_FIELD } from '@/data/migrations';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';
import { describeBackup, describeLocalOverwrite, describeLosses, describeRestorePreview, readBackup, v16FileToLegacyItems } from '@/data/readBackup';

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
    // ⛔ `targetAmount` / `currentAmount`, NOT `target`. [P6.8.9.7.11.18 · S1.1] This fixture said `target`
    // while its own docstring claimed it was field-for-field from v1.6 — measured against
    // `origin/v1.6-dev`: `buildBackupData()` emits `goals` verbatim and v1.6's `Goal` is
    // `targetAmount`/`currentAmount` (`components/GoalsSection.tsx:57`). So this door was being proved
    // with a shape v1.6 never wrote, and the only goal assertion was `goals.length === 1`, which holds
    // for either. Found when an absent required money field started being REPORTED.
    goals: [{ id: 'g1', name: 'Emergency fund', targetAmount: 1000, currentAmount: 250, type: 'emergency' }],
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
    // ⛔ **The MONEY, not just the row.** [S1.1] `length === 1` is the assertion that let this fixture
    // carry a `target` key for months: a goal whose `targetAmount` is absent still counts as one goal,
    // and still sums to `NaN` on Money. The file's own docstring warns against exactly this shape of
    // assertion for `payCycle`; goals never got it.
    eq(result.store.goals?.[0]?.targetAmount, 1000, '  ⭐ …carrying the target the file actually held');
    eq(result.store.goals?.[0]?.currentAmount, 250, '  …and what was saved toward it');
    eq(result.store.pendingDataRepairs.length, 0, '  ⛔ …and a healthy v1.6 file reports NO repairs');
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
  /**
   * ⛔ **[P6.8.9.7.11.13.6 · J1-1 Q2] THIS LIST HAD ONE MEMBER OF A FOUR-MEMBER CLASS.** A `null` row is
   * dropped and reported at `repairMoneyFields` — the one seam `debts`, `requiredExpenses`,
   * `livingExpenses` and `goals` all pass through (`.11.12.2`) — but only `debts` was ever poisoned here.
   * ⚡ **`goals` is the one the finding was about**, because the priority stand-down dereferences
   * `goal.priority` right after the seam, so a regression there throws where the others merely carry a
   * `null` to the first render. **A test that picks the one member of a class that works reports on the
   * member, not the class** — `.11.12.8`'s lesson, applied to a corpus instead of a mark.
   *
   * ⚠️ The fix is NOT this step's; `.11.12.2` shipped it. This is the fixture that would have caught it,
   * which is the standing answer whenever a finding names a list: turn it into a corpus, never a list.
   */
  const poisoned = [
    ['envelope with a string `debts`', { ...JSON.parse(serializeBackup(createDefaultStore(), { now: AT })), store: { storeVersion: 7, debts: 'oops', paycheck: {} } }],
    ['raw-v17 with a poisoned debt', { storeVersion: 7, paycheck: {}, debts: [null] }],
    /**
     * ⛔ **`debts: []` IS LOAD-BEARING ON EVERY ONE OF THESE, and leaving it out made them vacuous.**
     * `detectBackupFormat` requires `storeVersion` + `paycheck` + `debts` **together** to call a blob
     * `raw-v17` — so the first cut of these three, carrying only the poisoned list, was `unrecognised` and
     * **refused before `runMigrations` ever ran.** They asserted "does not throw" over a door that never
     * opened. ⚠️ Caught by noticing the `…imports what it can AND reports the loss` line was absent from
     * their output, not by re-reading them: the assertion is conditional on `result.ok`, so a refusal
     * skips it silently.
     */
    ['raw-v17 with a poisoned GOAL — the row the stand-down dereferences', { storeVersion: 7, paycheck: {}, debts: [], goals: [null] }],
    ['raw-v17 with a poisoned required expense', { storeVersion: 7, paycheck: {}, debts: [], requiredExpenses: [null] }],
    ['raw-v17 with a poisoned living expense', { storeVersion: 7, paycheck: {}, debts: [], livingExpenses: [null] }],
    ['raw-v17 with every list poisoned at once', { storeVersion: 7, paycheck: {}, debts: [null], goals: [null], requiredExpenses: [null], livingExpenses: [null] }],
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
    // ⛔ CONTRACT CHANGED AT 5.10. These used to have to REFUSE, because `runMigrations` threw on them and
    // refusing was the only safe answer. It is now total, so the honest outcome is to import what IS
    // readable and REPORT what was not — a poisoned `debts` no longer costs the user their income and
    // goals as well. What must never happen is a throw, or a loss nobody is told about.
    assert(!threw, `does NOT throw: ${label}`);
    assert(result !== undefined, `  …returns an outcome: ${label}`);
    if (result && result.ok) {
      assert(result.store.dataRepairs.length > 0, `  …imports what it can AND reports the loss: ${label}`);
    }
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

/**
 * ── B-J2-2: the DATE reaches the screen standing in front of an irreversible overwrite ────────────
 *
 * ⛔ **`BackupEnvelope.exportedAt`'s own docstring said it was surfaced before a destructive restore, and
 * it was not.** [P6.8.9.7.11.12] `serializeBackup` wrote it and `parseBackupValue` carried it, and then
 * `readBackup` passed only `envelope.store` on — so it was dropped at that line and reached no renderer
 * anywhere in the app. What the confirm screen showed was entity counts, which are identical for a backup
 * exported this morning and one exported in March, under a subtitle reading *"This overwrites everything
 * currently in the app. It can't be undone."*
 *
 * ⚠️ The iCloud door already did this correctly, so the app had both the value and a formatter — the file
 * door was the one that dropped it.
 */
{
  const result = readBackup(serializeBackup(createDefaultStore(), { now: AT }));
  assert(result.ok, 'read an envelope for its date');
  if (result.ok) {
    assert(result.exportedAt === AT.toISOString(), `⭐ the export timestamp SURVIVES the read — "${result.exportedAt}"`);
    const text = describeBackup(result);
    assert(text.includes('Saved'), `⛔ …and it is IN the confirm sentence — "${text}"`);
    assert(text.includes(String(AT.getFullYear())), '  …carrying the year the file was actually exported');
  }
}
{
  // A v1.6 file stamps `exportedAt` too — `detectBackupFormat` requires it to call the file v1.6 at all.
  const result = readBackup(JSON.stringify(realV16Backup()));
  assert(result.ok, 'read a v1.6 file for its date');
  if (result.ok) {
    assert(result.exportedAt === '2026-05-23T14:02:11.000Z', 'a v1.6 file carries its date through too');
    assert(describeBackup(result).includes('Saved'), '  …and it reaches the same sentence');
  }
}
{
  /**
   * ⚠️ **A bare store is not an envelope and has no date — the sentence must simply not claim one.**
   * Inventing "recently" here would be a statement about a file we know nothing about, on the screen
   * where being wrong is least recoverable.
   */
  const result = readBackup(JSON.stringify(createDefaultStore()));
  assert(result.ok, 'read a bare v1.7 store');
  if (result.ok) {
    assert(result.exportedAt === undefined, 'a raw store carries no export date');
    assert(!describeBackup(result).includes('Saved'), '  …and the sentence does not invent one');
  }
}

/**
 * ⛔ **S1.13.7.11 [pass-6 blocker `B3-2`] — THE THIRD MEMBER: present and UNREADABLE.**
 *
 * The two blocks above cover *present and valid* and *absent*. The member the code got wrong is the one
 * with no fixture — an `exportedAt` the build cannot parse rendered as **"Saved recently."**, one line
 * above *Replace my data · It can’t be undone*. A backup from 2019 and one from an hour ago produced
 * the same sentence, which is the whole thing `exportedAt` was plumbed through to prevent.
 *
 * ⚠️ **`"0"` is the worse half of the class.** `new Date("0")` is a VALID Date (1 Jan 2000), so a
 * NaN guard never fires and the screen prints a specific, confident date the file never carried. That is
 * why the check is on the SHAPE of the string, not on whether `Date` accepted it.
 */
{
  const withStamp = (value: unknown) => {
    const env = JSON.parse(serializeBackup(createDefaultStore(), { now: AT })) as Record<string, unknown>;
    env.exportedAt = value;
    return readBackup(JSON.stringify(env));
  };
  for (const junk of ['banana', '2026-13-45', '', 'Invalid Date', '0']) {
    const result = withStamp(junk);
    assert(result.ok, `read an envelope stamped ${JSON.stringify(junk)}`);
    if (result.ok) {
      const text = describeBackup(result);
      assert(
        !text.includes('Saved'),
        `  ⛔ ${JSON.stringify(junk)} → the sentence claims NO date — "${text}"`,
      );
      assert(!text.includes('recently'), `  …and never the word "recently" — "${text}"`);
    }
  }
  // the control: a real instant still reaches the sentence, so the guard did not simply swallow everything
  const good = withStamp('2019-03-04T10:00:00.000Z');
  assert(good.ok && describeBackup(good).includes('2019'), '  control: a readable stamp still reaches the sentence');
}

console.log(`✅ readBackup router tests passed (${passed} asserts).`);

// ── ⛔ THE ONBOARDING GATE (found on a real device, 🎯 2026-08-19). ───────────────────────────────
// A v1.6 backup file cannot carry `hasCompletedOnboarding` — `buildBackupData()` never emitted it — so
// the import used to land `onboardingComplete: false` and the route guard hid the whole restored
// portfolio behind onboarding. It read as "the import did nothing".
{
  const v16 = { ...realV16Backup() };
  const result = readBackup(JSON.stringify(v16));
  assert(result.ok, 'a v1.6 file imports');
  if (result.ok) {
    assert(result.store.prefs.onboardingComplete === true, '⛔ a restored PORTFOLIO skips onboarding');
  }
}
{
  // ⚠️ …but an EMPTY backup must still onboard. Inferred from CONTENT, never from the act of importing:
  // a user who exported before setting anything up would otherwise land on a blank Today with no route
  // back into the setup flow.
  const empty = {
    version: 1,
    exportedAt: '2026-05-23T14:02:11.000Z',
    amount: '',
    payCycle: 'biweekly',
    currentDate: '2026-05-23',
    requiredExpenses: [],
    livingExpenses: [],
    debts: [],
    goals: [],
    completedRecommendedActions: [],
    payoffStrategy: 'snowball',
    cycleHistory: [],
  };
  const result = readBackup(JSON.stringify(empty));
  assert(result.ok, 'an EMPTY v1.6 backup still imports');
  if (result.ok) {
    assert(result.store.prefs.onboardingComplete === false, '…and still onboards — nothing to show yet');
  }
}

/**
 * ── S1.10.6.4 [pass-3 C-7]: the confirm SAYS what could not be read, at the point of no return ─────
 *
 * ⛔ **The sentence was BYTE-IDENTICAL for an intact backup and one this reader had just recorded three
 * losses on.** A user read *"This backup has 2 debts, 1 expense and 1 goal. Saved …"*, tapped **Replace my
 * data** under *"It can't be undone"*, and learned about the losses only on Today, after their live
 * portfolio was gone. ⚡ The answer was not merely available — it was **already inside the object being
 * described** (`result.store.pendingDataRepairs`).
 *
 * ⚠️ **Every fixture in this file's seven `describeBackup` assertions is a healthy file.** Not one asserted
 * the sentence DIFFERS between an intact and a damaged backup, which is the whole claim — reading rule 2:
 * the tests picked the member of the class that works.
 */
{
  const healthy = createDefaultStore();
  healthy.debts = [
    { id: 'd1', name: 'Chase', balance: 5000, originalBalance: 5000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
  ] as DebtStore['debts'];
  const intact = readBackup(serializeBackup(healthy, { now: AT }));
  assert(intact.ok, 'read an intact backup');

  // The same file with one balance blanked — the loss `runMigrations` records on THIS file, not later.
  const damagedBlob = JSON.parse(serializeBackup(healthy, { now: AT })) as { store: { debts: unknown[] } };
  (damagedBlob.store.debts[0] as { balance: unknown }).balance = 'n/a';
  const damaged = readBackup(JSON.stringify(damagedBlob));
  assert(damaged.ok, 'read the damaged backup — it is still a readable file, which is the point');

  if (intact.ok && damaged.ok) {
    const intactText = describeBackup(intact);
    const damagedText = describeBackup(damaged);
    assert(damaged.store.pendingDataRepairs.length > 0, '⭐ the fixture really did record a loss (or it proves nothing)');
    // ⛔ THE HONEST STATE BY NAME. A test asserting only that the two differ would pass on any change.
    assert(damagedText.includes('could not be read'), `⛔ C-7 — the damaged confirm names the loss — "${damagedText}"`);
    assert(damagedText.includes('1 amount'), '⛔ C-7 — …and counts it, so "one" is distinguishable from "nine"');
    assert(intactText !== damagedText, '⛔ C-7 — the two sentences are no longer byte-identical');
    // ⭐ CONTROL — an intact file gains no warning, or the clause is noise on every restore.
    assert(!intactText.includes('could not be read'), `⭐ control — an intact backup carries no warning — "${intactText}"`);
    // …and the counts both files still agree on survive: the clause is an ADDITION, not a replacement.
    assert(intactText.includes('1 debt') && damagedText.includes('1 debt'), '⭐ control — the counts are untouched');
  }
}

/**
 * ── S1.10.6.4 [pass-3 C-7b]: the iCloud door reads from the SAME owner ────────────────────────────
 *
 * ⛔ The cloud restore confirm described nothing at all — no counts, no losses — because it confirms
 * BEFORE it fetches. The remedy is a pre-read, and this pins that both doors compose one sentence from one
 * function rather than growing a second copy of the wording to drift against.
 */
{
  const store = createDefaultStore();
  store.debts = [
    { id: 'd1', name: 'Chase', balance: 5000, originalBalance: 5000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
  ] as DebtStore['debts'];
  assert(describeRestorePreview(store).includes('1 debt'), 'C-7b — the cloud confirm states what is in the file');
  assert(!describeRestorePreview(store).includes('could not be read'), '⭐ control — and warns about nothing when there is nothing');

  const damagedBlob = JSON.parse(serializeBackup(store, { now: AT })) as { store: { debts: unknown[] } };
  (damagedBlob.store.debts[0] as { balance: unknown }).balance = 'n/a';
  const damaged = readBackup(JSON.stringify(damagedBlob));
  assert(damaged.ok, 'read the damaged file for the cloud preview');
  if (damaged.ok) {
    assert(describeRestorePreview(damaged.store).includes('could not be read'), '⛔ C-7b — and it names the loss, exactly as the file door does');
  }
}

/**
 * ── S1.11.4.3 [pass-4 `C4-11`]: the OTHER half of the sentence ────────────────────────────────────
 *
 * ⛔ Both existing owners describe what is being WRITTEN. Neither says what is being OVERWRITTEN, and the
 * launch-time door fires over a store the user has already typed a paycheck and a debt into: `_layout.tsx`
 * gates on `!isOnboarded`, and `onboarding.tsx` records that the steps write as they go while only
 * `CompletionStep` completes. ⚠️ `lint:restore-doors` proves every door COMPOSES a sentence; this proves
 * what the sentence says, and the empty case is asserted first because it is the common one.
 */
{
  const empty = createDefaultStore();
  assert(describeLocalOverwrite(empty) === '', '⛔ C4-11 — a store with nothing in it warns about nothing');

  const typed = createDefaultStore();
  typed.paycheck = { ...typed.paycheck, amount: '2000' };
  typed.debts = [
    { id: 'd1', name: 'Chase', balance: 5000, originalBalance: 5000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
  ] as DebtStore['debts'];
  const said = describeLocalOverwrite(typed);
  assert(said.includes('the paycheck'), '⛔ C4-11 — it names the paycheck the user entered');
  assert(said.includes('1 debt'), '⛔ C4-11 — …and the debt, singular');
  // ⛔ Only what is THERE. `describeStoreContents` is right for a backup, where "0 goals" is information
  // about the file; here it would be a list of things the user is not losing.
  assert(!said.includes('0 '), '⛔ C4-11 — and nothing the user does not have');
  assert(!said.includes('goal'), '⛔ C4-11 — …no empty goals clause either');

  // ⭐ A paycheck with no amount is not a paycheck. `createDefaultStore` seeds the field as a string, so
  // a truthiness test would have called every fresh install "already entered".
  const paycheckOnly = createDefaultStore();
  paycheckOnly.paycheck = { ...paycheckOnly.paycheck, amount: '0' };
  assert(describeLocalOverwrite(paycheckOnly) === '', '⭐ control — a $0 paycheck is not something to lose');

  /**
   * ⛔ **S1.13.7.11 [pass-6 `B3-5`] — THE CASH THE APP IS HOLDING.** The sentence named the four LISTS and
   * never `expenseReserve.balance` — money the app told the user it was setting aside for their recurring
   * bills, which is `undefined` after the restore and reads as `0` from the next render on. Its own type
   * doc is the argument: *"a cleared pot would be money the app took and never gave back."*
   */
  const withHeldCash = createDefaultStore();
  withHeldCash.paycheck = { ...withHeldCash.paycheck, amount: '2000' };
  withHeldCash.expenseReserve = { balance: 1500, contribution: { forCycle: '2026-06-15', amount: 220 } };
  const heldSaid = describeLocalOverwrite(withHeldCash);
  // ⛔ `set aside`, not the whole phrase, and that ordering is the point: a variant that DISCLOSES the
  // amount ("the $1,500 you have set aside") must reach the next assertion rather than tripping this one.
  // Measured — the first draft asserted the full sentence, and the amount-disclosing plant redded HERE,
  // which left the disclosure check below it never exercised. A plant that reds early hides what follows.
  assert(heldSaid.includes('set aside'), '⛔ B3-5 — the held cash is named among what is replaced');
  // ⛔ A CATEGORY, NOT AN AMOUNT: `backup.ts`'s rule for this family is "counts, never money", because the
  // screen may be shared or read in public. The fix must not become the disclosure.
  assert(!heldSaid.includes('1,500') && !heldSaid.includes('1500'), '⛔ B3-5 — …without disclosing how much');
  assert(!/\$/.test(heldSaid), '  …and with no amount of any kind in the sentence');

  // ⭐ The control the function's own rule demands: silent at zero, like every other clause here.
  const noHeldCash = createDefaultStore();
  noHeldCash.paycheck = { ...noHeldCash.paycheck, amount: '2000' };
  noHeldCash.expenseReserve = { balance: 0 };
  assert(
    !describeLocalOverwrite(noHeldCash).includes('set aside'),
    '⭐ control — an empty pot is not something to lose, so the clause stays silent',
  );
}

/**
 * ── S1.11.4.5 [pass-4 `F-B3`]: the two synthetic losses are TWO events ────────────────────────────
 *
 * ⛔ `describeLosses` split on `startsWith('(')` and counted both as *"whole rows"*, so a backup whose
 * entire `debts` list was unreadable read *"⚠️ 1 whole row in this backup could not be read"* — one
 * sentence above **Replace my data**, under *"It can't be undone"*. ⚠️ The count cannot be made right: the
 * unparseable value has no length. So the whole-list case says WHICH list, which is what is actually
 * known. ⭐ **The pair is the test** — the two loss kinds are asserted to produce DIFFERENT sentences on
 * one shared fixture, because producing the same one from opposite-sized losses was the defect.
 */
{
  const withRepairs = (repairs: DebtStore['pendingDataRepairs']): DebtStore => ({
    ...createDefaultStore(),
    pendingDataRepairs: repairs,
  });
  const wholeList = { entity: 'debt' as const, id: '', name: '', field: WHOLE_LIST_LOSS_FIELD, kind: 'lost' as const };
  const wholeRow = { entity: 'debt' as const, id: '', name: '', field: WHOLE_ROW_LOSS_FIELD, kind: 'lost' as const };
  const anAmount = { entity: 'debt' as const, id: 'd1', name: 'Visa', field: 'balance', kind: 'lost' as const };

  const listSaid = describeLosses(withRepairs([wholeList]));
  const rowSaid = describeLosses(withRepairs([wholeRow]));
  /**
   * ⛔ **THE ASSERTION THAT CARRIES THE FINDING GOES FIRST, AND `prove:guards` IS WHY.** What shipped was
   * ONE sentence serving both loss kinds; the pair is what makes that unrepresentable. ⚠️ It was written
   * third and the un-fix redded on the clause assertion above it instead — the harness reported
   * *"it redded, but not for the named reason"*, which is exactly the `plant-that-reds-early` class caught
   * by an instrument rather than by someone remembering. **The strongest claim is asserted first so the
   * plant meets it first**, and the two clause rows below now read as the detail they are.
   */
  assert(listSaid !== rowSaid, '⛔ F-B3 — opposite-sized losses no longer produce the identical clause');
  assert(listSaid.includes('the whole debts list'), `⛔ F-B3 — a whole LIST names the list (got ${JSON.stringify(listSaid)})`);
  assert(rowSaid.includes('1 whole row'), `F-B3 — a whole ROW is still counted, which is right for it (got ${JSON.stringify(rowSaid)})`);

  /**
   * ⛔ **S1.12.5.3 [pass-5 `B5-3` · `B5-1`] — THE ROW ABOVE IS A WORD CHECK WEARING A COUNT CHECK'S
   * SENTENCE, AND IT IS ASSERTED ON THE ONE ARITY WHERE THE DEFECT CANNOT APPEAR.**
   *
   * `"a whole ROW is still counted"` is satisfied by the literal string `1 whole row` over a **hand-built
   * one-element** `pendingDataRepairs` — a fixture the producer cannot make, asserting a count of one
   * against a list of length one. ⚡ Capping the count at 1 leaves the whole suite green; only changing
   * the WORD reds it. Measured three ways by lane B.
   *
   * ⛔ **And the count really was capped.** A whole-row loss carries `id: ''`, `mergeRepairs` dedupes on
   * `entity|id|field`, so nine lost debt rows collapsed to one record and the sentence one line above
   * **Replace my data** read *"⚠️ 1 whole row could not be read"* — byte-identical to losing exactly one.
   *
   * ⚠️ **So these run through `runMigrations`, not through a hand-built array.** Nothing else distinguishes
   * a fixture the app can produce from one it cannot, which is the gap that let a one-per-entity cap look
   * like a working counter for two passes.
   */
  const migrated = (debts: unknown[], goals: unknown[] = []): DebtStore =>
    runMigrations({ version: 99, debts, goals, requiredExpenses: [], livingExpenses: [] } as never) as DebtStore;
  const okDebt = { id: 'd1', name: 'Visa', balance: 100, minimumPayment: 10, apr: 0, dueDate: '2026-06-01', type: 'debt', recurrence: 'monthly' };

  const nine = describeLosses(migrated([okDebt, ...Array.from({ length: 9 }, () => null)]));
  assert(nine.includes('9 whole rows'), `⛔ B5-1 — nine lost rows say NINE, not one (got ${JSON.stringify(nine)})`);
  // ⭐ THE CONTROL that makes the row above mean something: the one-loss case must still say ONE. A counter
  // that returned the list length, or any constant, satisfies "9 whole rows" and fails here.
  const one = describeLosses(migrated([okDebt, null]));
  assert(one.includes('1 whole row') && !one.includes('9'), `⭐ B5-1 control — one lost row still says one (got ${JSON.stringify(one)})`);
  // ⛔ It counted ENTITIES, not rows: 5 bad debt rows + 4 bad goal rows reported "2 whole rows".
  const across = describeLosses(migrated([okDebt, null, null, null, null, null], [null, null, null, null]));
  assert(across.includes('9 whole rows'), `⛔ B5-1 — losses ACROSS entities sum, they do not count entities (got ${JSON.stringify(across)})`);
  // ⭐ The field class already counted correctly and must not regress — the obvious repair (dropping `id`
  // from the dedupe key) collapses these to one and would trade this working count for the broken one.
  const nineAmounts = migrated(Array.from({ length: 9 }, (_, i) => ({ ...okDebt, id: `d${i}`, balance: 'not-a-number' })));
  const amounts = describeLosses(nineAmounts);
  assert(amounts.includes('9 amounts'), `⭐ B5-1 control — nine unreadable AMOUNTS still say nine (got ${JSON.stringify(amounts)})`);
  /**
   * ⭐ **THE CONTROL FOR THE REPAIR B NAMED AS DANGEROUS, and the sentence alone cannot carry it.**
   * Dropping `id` from `mergeRepairs`' dedupe key is the obvious way to make row losses stop collapsing.
   * ⚠️ **Measured: with the counts summed, that over-fix leaves the SENTENCE correct** — nine amounts still
   * reads *"9 amounts"* — while nine per-debt records collapse into one. The card that names WHICH debts
   * could not be read would then name one. So the record count is asserted, not just the wording.
   */
  const perDebt = nineAmounts.pendingDataRepairs.filter((r) => r.field === 'balance');
  assert(
    perDebt.length === 9,
    `⭐ B5-1 control — nine unreadable balances stay NINE records, so the card can name each debt (got ${perDebt.length})`,
  );
  // ⭐ And a re-migration of an already-migrated store must not double it: the pending record and the fresh
  // read are the same event being re-reported, not two losses.
  const twice = describeLosses(runMigrations(migrated([okDebt, ...Array.from({ length: 9 }, () => null)]) as never) as DebtStore);
  assert(twice.includes('9 whole rows'), `⭐ B5-1 control — re-migrating does not double the count (got ${JSON.stringify(twice)})`);

  /**
   * ⛔ **S1.12.5.3 [pass-5 `B5-2`] — A STALE `recovered` SHADOWED A FRESH `lost`, AND IT FAILED OPEN.**
   *
   * `mergeRepairs` iterated `pending` first and kept the first record it saw for a key, so a value that
   * was RECOVERABLE on one read and is UNREADABLE on the next stayed labelled `recovered`. ⚡ Every guard
   * that reads `kind` to decide *"is this number trustworthy"* then flips green over money the app can no
   * longer read — the fail-open direction, on the one field that exists to say the opposite.
   *
   * Driven through two real migrations rather than by calling the merge directly: `'4,000'` is repaired by
   * stripping its grouping (a `recovered`), and the second read finds the same field unreadable (a `lost`).
   */
  const recoverable = migrated([{ ...okDebt, balance: '4,000' }]);
  const firstKind = recoverable.pendingDataRepairs.find((r) => r.field === 'balance')?.kind;
  assert(firstKind === 'recovered', `B5-2 premise — a grouped number is RECOVERED on the first read (got ${String(firstKind)})`);
  const nowUnreadable = runMigrations({
    ...(recoverable as unknown as Record<string, unknown>),
    version: 99,
    debts: [{ ...okDebt, balance: 'not-a-number' }],
  } as never) as DebtStore;
  const secondKind = nowUnreadable.pendingDataRepairs.find((r) => r.field === 'balance')?.kind;
  assert(
    secondKind === 'lost',
    `⛔ B5-2 — this read is the authority: a field that has become unreadable is LOST, not still "recovered" (got ${String(secondKind)})`,
  );
  // The finding's case E: all three kinds at once, in one sentence, joined once.
  const all = describeLosses(withRepairs([wholeList, wholeRow, anAmount]));
  assert(all.includes('the whole debts list'), '⛔ F-B3 · case E — the list clause survives company');
  assert(all.includes('1 amount'), '⛔ F-B3 · case E — …and so does the amount');
  assert(all.includes('1 whole row'), '⛔ F-B3 · case E — …and the row');
  assert(!all.includes('2 whole rows'), '⛔ F-B3 · case E — the list is NOT counted as a row any more');
  // ⭐ CONTROL — a recovered value is not a loss, and the sentence is empty rather than reassuring.
  assert(describeLosses(withRepairs([{ ...anAmount, kind: 'recovered' }])) === '', '⭐ F-B3 control — a recovered value warns about nothing');

  /**
   * ⛔ **THE COUPLING, PINNED AT LAST.** Every reader of these records tests `field.startsWith('(')`, and
   * nothing tied that convention to the two literals `migrations.ts` actually writes — *"a third
   * `(`-prefixed field added in `migrations.ts` would silently join the whole rows bucket"*.
   * ⚠️ **The prefix test STAYS** — it fails SAFE, and an exact-match list would fail OPEN, which would be
   * the remedy introducing a defect. What is asserted instead is that the producer emits no third one, so
   * a new synthetic loss cannot arrive unclassified.
   */
  for (const field of SYNTHETIC_LOSS_FIELDS) {
    assert(field.startsWith('('), `⛔ F-B3 — ${field} keeps the prefix every reader's backstop tests`);
  }
  const migrationsSrc = readFileSync(join(import.meta.dirname, 'migrations.ts'), 'utf8');
  const emitted = [...migrationsSrc.matchAll(/field: '(\([^']*\))'/g)].map((m) => m[1]);
  if (emitted.length > 0) {
    throw new Error(
      `FAIL [⛔ F-B3 — migrations.ts writes ${emitted.join(', ')} as a LITERAL. Name it in SYNTHETIC_LOSS_FIELDS, ` +
        'or a reader that tells the two events apart will silently put it in the wrong bucket]',
    );
  }
  assert(true, '⛔ F-B3 — migrations.ts emits no UNNAMED parenthesised field, so no third synthetic loss can arrive unclassified');
}


/**
 * ⛔ **S1.12.5.8 [pass-5 `B5-5` · `B5-6`] — TWO SHAPES OF `paycheck.amount` THE READ SIDE MISHANDLED.**
 *
 * ⚡ `B5-5`: with `"1,200"` the pre-overwrite sentence read *"This replaces 1 debt…"* and omitted **the
 * paycheck** — the sentence that names what the user is about to lose, one line above an irreversible
 * replace. `Number("1,200")` is `NaN`. ⛔ `paycheck.amount` is the one money field kept as a STRING, so
 * it sits outside `readMoney`'s repairable set — and `readMoney` is where the comma tolerance lives.
 *
 * ⚡ `B5-6`: every other input shape normalised and `undefined` did not, while the type said `string`.
 * `inferOnboarding` tests `typeof amount === 'string'`, so that reads as *"no income"* and routes a store
 * back to onboarding **with the user's data already imported**.
 */
{
  const withAmount = (amount: unknown): DebtStore =>
    runMigrations({
      version: 8,
      paycheck: { amount, currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
      debts: [{ id: 'd1', name: 'Visa', balance: 100, minimumPayment: 10, apr: 0, dueDate: '2026-03-02', type: 'debt', recurrence: 'monthly' }],
      prefs: { onboardingComplete: true },
    } as never) as DebtStore;

  assert(
    describeLocalOverwrite(withAmount('1,200')).includes('the paycheck'),
    '⛔ B5-5 — a grouped amount still names the paycheck in the pre-overwrite warning',
  );
  // ⭐ CONTROLS. "always say the paycheck" passes the row above; these are what separate the two.
  assert(
    describeLocalOverwrite(withAmount('1200')).includes('the paycheck'),
    '⭐ B5-5 control — …as does an ungrouped one',
  );
  assert(
    !describeLocalOverwrite(withAmount('')).includes('the paycheck'),
    '⭐ B5-5 control — and a store with NO income does not claim one',
  );

  // ⛔ B5-6 — every shape lands on a string, `undefined` included.
  for (const input of [undefined, null, 1200, '1200', {}, [1, 2], true]) {
    const out = withAmount(input).paycheck.amount;
    assert(
      typeof out === 'string',
      `⛔ B5-6 — paycheck.amount is a string for every input shape (${JSON.stringify(input)} gave ${typeof out})`,
    );
  }
  // ⭐ CONTROL — normalising must not flatten a real value to "".
  eq(withAmount(1200).paycheck.amount, '1200', '⭐ B5-6 control — a real number still becomes its string');
}

console.log(`✅ readBackup onboarding-gate tests passed.`);
