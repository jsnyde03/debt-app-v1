import { runMigrations } from './migrations';
import type { DataRepair, DebtStore } from './models';

/**
 * `readMoney`'s classification table, asserted through the door a user's file actually comes in.
 * [P6.8.9.7.11.18 · S1.1 — round-4 blocker #1]
 *
 * ⛔ **THE CLASS IS "MONEY THE APP COULD NOT READ", AND EVERY TEST IN THE TREE PICKED `null`.**
 * `data-recovery.spec.ts` seeds `balance: null`, which is `lost` under the defect and under the fix — so
 * the whole class was represented by the one member that worked, while `''`, `'   '` and `','` were
 * stamped `recovered` and carried a silent `0`. That is the corollary this project has now paid for
 * twice: *a test that picks the one member of a class that works reports on the member, not the class.*
 *
 * ⚠️ **Asserted through `runMigrations`, not by importing `readMoney`.** The function is private, and a
 * test of a private helper cannot say the door uses it — `.11.11`'s clamp existed, was correct and was
 * tested while the defect shipped, because what was missing was the call.
 */

function fail(message: string): never {
  throw new Error(message);
}

function eq<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) fail(`${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function migrateOneDebt(balance: unknown): { store: DebtStore; repair: DataRepair | undefined } {
  const store = runMigrations({
    version: 8,
    debts: [{ id: 'd1', name: 'Card', balance, apr: 20, minimumPayment: 25 }],
  });
  return { store, repair: store.pendingDataRepairs.find((r) => r.entity === 'debt' && r.field === 'balance') };
}

/**
 * ⚠️ Every row states the VALUE as well as the class. A row asserting only the class would stay green if
 * a future "fix" classified `''` correctly and then wrote `NaN` into the balance.
 */
const CASES: { readonly input: unknown; readonly kind: DataRepair['kind'] | 'none'; readonly value: number; readonly why: string }[] = [
  { input: 4000, kind: 'none', value: 4000, why: 'a real number is not a repair at all' },
  { input: '4,000', kind: 'recovered', value: 4000, why: 'grouping stripped — the number was there and is exactly right' },
  { input: '0', kind: 'recovered', value: 0, why: 'a written zero IS a number, and Money depends on this staying a recovery' },
  { input: '0.00', kind: 'recovered', value: 0, why: 'and so is a written zero with decimals' },
  { input: '', kind: 'lost', value: 0, why: '⛔ blocker #1 — Number("") is 0, so this used to read as recovered' },
  { input: '   ', kind: 'lost', value: 0, why: '⛔ blocker #1 — whitespace trims to nothing to read' },
  { input: ',', kind: 'lost', value: 0, why: '⛔ blocker #1 — emptiness is tested AFTER the comma strip, not before' },
  { input: ', ,', kind: 'lost', value: 0, why: 'and the strip can empty a longer string too' },
  { input: 'wat', kind: 'lost', value: 0, why: 'the ordinary loss — unchanged by the fix' },
  { input: 'Infinity', kind: 'lost', value: 0, why: 'parses, but is not finite money' },
  { input: null, kind: 'lost', value: 0, why: 'the member every other test picked' },
  { input: undefined, kind: 'lost', value: 0, why: 'an absent field' },
];

/**
 * ⛔ **A downward-only floor on the table itself.** Deleting a row is how a classification test quietly
 * stops covering the class it was written for; `HOSTILE_FLOOR` and `MIN_CHECKS` are the same device.
 */
const CASE_FLOOR = 12;

export default function run(): void {
  if (CASES.length < CASE_FLOOR) {
    fail(`the classification table lost rows: ${CASES.length} < ${CASE_FLOOR}. A row may be ADDED, never removed.`);
  }

  for (const c of CASES) {
    const { store, repair } = migrateOneDebt(c.input);
    const label = `readMoney(${JSON.stringify(c.input)}) — ${c.why}`;
    eq(store.debts.length, 1, `${label}: the debt survives migration`);
    eq(store.debts[0]!.balance, c.value, `${label}: balance`);
    if (c.kind === 'none') {
      eq(repair, undefined, `${label}: no repair is recorded`);
    } else {
      if (!repair) fail(`${label}: expected a ${c.kind} repair and none was recorded`);
      eq(repair.kind, c.kind, `${label}: repair kind`);
    }
  }

  /**
   * ⛔ **THE SENTENCE A USER READS.** `money.tsx:360-361` narrowed the celebration guard to
   * `r.kind !== 'recovered'` on the strength of `readMoney`'s docblock, so the classification above is
   * not an internal detail — it decides whether a restored portfolio of blank balances renders
   * *"Every balance cleared"*. The predicate is reproduced here because a unit test cannot reach the
   * screen; `data-recovery.spec.ts` asserts the rendered text for the same fixture.
   */
  const blank = runMigrations({
    version: 8,
    debts: [
      { id: 'd1', name: 'Card A', balance: '', apr: 20, minimumPayment: 25 },
      { id: 'd2', name: 'Card B', balance: '', apr: 20, minimumPayment: 25 },
    ],
  });
  const unreadDebts = blank.pendingDataRepairs.some((r) => r.entity === 'debt' && r.kind !== 'recovered');
  eq(unreadDebts, true, 'two blank balances leave the celebration guard ARMED (this is blocker #1)');
  eq(blank.debts.every((d) => d.balance === 0), true, 'both balances still repair to 0 — the guard, not the value, is the fix');

  absentFieldCases();
}

/**
 * ⛔ **AN ABSENT REQUIRED MONEY FIELD, ONE FIXTURE PER FIELD.** [P6.8.9.7.11.18 · S1.1]
 *
 * `repairMoneyFields` skipped every `undefined`, so a debt row with no `balance` key reached the store as
 * `balance: undefined` — in neither `active` nor `paidOff`, and poisoning every total to `NaN`. The split
 * is by schema optionality, and **a field omitted from BOTH lists stops being repaired silently**, which
 * is what these rows exist to catch. ⚠️ One row per field, not one row naming several: a single fixture
 * asserting three fields at once stops at the first failure and reports on one of them.
 */
function absentFieldCases(): void {
  const REQUIRED: { entity: 'debt' | 'goal' | 'requiredExpense' | 'livingExpense'; field: string }[] = [
    { entity: 'debt', field: 'balance' },
    { entity: 'debt', field: 'minimumPayment' },
    { entity: 'debt', field: 'apr' },
    { entity: 'goal', field: 'targetAmount' },
    { entity: 'goal', field: 'currentAmount' },
    { entity: 'requiredExpense', field: 'amount' },
    { entity: 'livingExpense', field: 'amount' },
  ];
  /**
   * ⚠️ Absence MEANS something for these three — repairing them to `0` invents a value the user never set.
   * ⛔ **`after` is what the row holds once `runMigrations` is done, which is not always `undefined`:**
   * `originalBalance` is stamped by `raiseOriginalBalance` (`.11.15`'s high-water mark) *after* the repair
   * pass, so asserting `undefined` there would be asserting the absence of a different, correct feature.
   * The invariant these rows carry is **"no repair is invented"**, and the value is stated so a future
   * change cannot satisfy that by writing a `0` instead.
   */
  const OPTIONAL: { entity: 'debt' | 'goal'; field: string; after: unknown }[] = [
    { entity: 'debt', field: 'originalBalance', after: 100 /* = the balance: the high-water stamp, not a repair */ },
    { entity: 'debt', field: 'scheduledPaymentAmount', after: undefined },
    { entity: 'goal', field: 'priorityPerPaycheck', after: undefined },
  ];

  const REQUIRED_FLOOR = 7;
  const OPTIONAL_FLOOR = 3;
  if (REQUIRED.length < REQUIRED_FLOOR || OPTIONAL.length < OPTIONAL_FLOOR) {
    fail(`the absent-field fixtures lost rows: ${REQUIRED.length}/${REQUIRED_FLOOR} required, ${OPTIONAL.length}/${OPTIONAL_FLOOR} optional.`);
  }

  const rowFor = (entity: string): Record<string, unknown> =>
    entity === 'debt'
      ? { id: 'x', name: 'Row', balance: 100, minimumPayment: 25, apr: 20, originalBalance: 200, scheduledPaymentAmount: 50 }
      : entity === 'goal'
        /**
         * ⛔ **`priority: false`, AND THAT IS THE ASSERTION WORKING.** With `priority: true` the
         * `priorityPerPaycheck` row was **vacuous**: the stand-down loop matches a non-positive pace and
         * `delete`s the field, so a defect that repaired the absent pace to `0` was erased before the
         * assertion could see it — measured, by planting exactly that defect and watching this row stay
         * silent while the other two fired.
         */
        ? { id: 'x', name: 'Row', targetAmount: 1000, currentAmount: 100, type: 'savings', priority: false, priorityPerPaycheck: 50 }
        : { id: 'x', name: 'Row', amount: 100 };
  const listKey = (entity: string): string =>
    entity === 'debt' ? 'debts' : entity === 'goal' ? 'goals' : entity === 'requiredExpense' ? 'requiredExpenses' : 'livingExpenses';

  const migrateWithout = (entity: string, field: string) => {
    const row = rowFor(entity);
    delete row[field];
    const store = runMigrations({ version: 8, [listKey(entity)]: [row] });
    const rows = (store as unknown as Record<string, Record<string, unknown>[]>)[listKey(entity)]!;
    return { rows, repair: store.pendingDataRepairs.find((r) => r.entity === entity && r.field === field) };
  };

  for (const { entity, field } of REQUIRED) {
    const { rows, repair } = migrateWithout(entity, field);
    const label = `a ${entity} row with no \`${field}\` key`;
    eq(rows.length, 1, `${label}: the row survives`);
    eq(rows[0]![field], 0, `${label}: repaired to 0 rather than left undefined (NaN totals)`);
    if (!repair) fail(`${label}: NO repair recorded — the loss is invisible to the user and to the trust guards`);
    eq(repair.kind, 'lost', `${label}: recorded as a loss, not a recovery`);
  }

  for (const { entity, field, after } of OPTIONAL) {
    const { rows, repair } = migrateWithout(entity, field);
    const label = `a ${entity} row with no \`${field}\` key`;
    eq(rows.length, 1, `${label}: the row survives`);
    eq(rows[0]![field], after, `${label}: not repaired to 0 — absence is the meaning`);
    eq(repair, undefined, `${label}: no repair is invented`);
  }
}
