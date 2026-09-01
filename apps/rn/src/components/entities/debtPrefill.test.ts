import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { EXPENSE_FIELDS_DROPPED, debtPrefillFromExpense } from '@core/debt/debtPrefillFromExpense';
import type { Debt, RequiredExpense } from '@core/storage/debtPlannerStorage';

/**
 * ⛔ **S1.13.7.8 [pass-6 blocker `C2-3`] — WHAT SURVIVES "MOVE TO DEBTS", AND WHAT THE SHEET SEEDS FROM.**
 *
 * ⚡ **This asserts the CLASS, not the field that was reported.** The finding named `isAutopay`. It is
 * worth a blocker because `recurrence` had already been lost the same way at the same two hops
 * (`S1.5.3 [B4]`, a quarterly bill filed as a monthly minimum) and the fix for it changed **one line** —
 * the four state seeds beside it kept reading `editing?`, and the prefill literal kept naming four
 * fields. A test that named `isAutopay` would close the finding and leave the next field open.
 *
 * The two hops, and the population each is checked against:
 *
 * 1. **`RequiredExpense` → prefill.** The partition is enforced by the COMPILER — see
 *    {@link EXPENSE_FIELDS_DROPPED} — so this file asserts the two halves do not overlap, that they add
 *    up to the whole type, and that the carried values actually arrive.
 * 2. **prefill → sheet state.** `DebtSheet` must seed every control from `seed` (`editing ?? prefill`).
 *    Asserted against the file's own text with a cap of ZERO, because the defect is a `useState`
 *    initialiser reading the wrong variable and no runtime assertion can see which variable was read.
 */

let passed = 0;

function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function eq<T>(actual: T, expected: T, label: string) {
  assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/**
 * ⛔ **`Required<RequiredExpense>` — THE COMPILER WRITES THIS POPULATION, NOT ME.**
 *
 * Every optional field is mandatory here, so a field added to `RequiredExpense` reds
 * `typecheck:tests` on this literal. A fixture spelled `RequiredExpense` would silently stay short —
 * which is the undercount class this whole sub-step is about.
 */
const EVERY_FIELD: Required<RequiredExpense> = {
  id: 'e-loan',
  name: 'Equipment Loan',
  amount: 600,
  dueDate: '2026-09-01',
  originalDueDate: '2026-06-01',
  recurrence: 'quarterly',
  isPaidThisCycle: true,
  isAutopay: true,
  autopayFailedThisCycle: true,
  expenseType: 'fixed',
  category: 'other',
  isTrial: true,
  fullAmount: 900,
  fullChargeDate: '2027-01-01',
  deferability: 'essential',
};

/**
 * Where each carried field lands on the debt. ⚠️ Its key set is asserted EQUAL to the type-derived
 * carried set below, so it cannot go one field short the way both previous versions of this did.
 */
const LANDS_AS: Record<string, (keyof Debt)[]> = {
  name: ['name'],
  amount: ['minimumPayment'],
  dueDate: ['dueDate'],
  recurrence: ['recurrence'],
  isAutopay: ['isAutopay'],
  autopayFailedThisCycle: ['autopayFailedThisCycle'],
  isPaidThisCycle: ['isPaidThisCycle', 'minimumPaidThisCycle'],
};

export function runDebtPrefillTests() {
  console.log('\n🔀 bill → debt: every field of the source record is carried or written off by name\n');

  const sourceKeys = Object.keys(EVERY_FIELD);
  const droppedKeys = Object.keys(EXPENSE_FIELDS_DROPPED);
  const carriedKeys = sourceKeys.filter((k) => !droppedKeys.includes(k));

  {
    // The partition itself. The compiler already refuses a missing or invented entry (proven by plant);
    // these are the halves it cannot state — that nothing is in both, and that every reason is a reason.
    for (const k of droppedKeys) {
      assert(sourceKeys.includes(k), `dropped field "${k}" is a real field of RequiredExpense`);
      assert(EXPENSE_FIELDS_DROPPED[k as keyof typeof EXPENSE_FIELDS_DROPPED].length > 20, `…and "${k}" is dropped with a stated reason, not an empty string`);
    }
    eq(
      carriedKeys.length + droppedKeys.length,
      sourceKeys.length,
      'carried + dropped covers every field of RequiredExpense exactly once',
    );
    eq(
      Object.keys(LANDS_AS).sort().join(','),
      carriedKeys.sort().join(','),
      'the landing map covers exactly the fields the type says are carried — no more, no fewer',
    );
  }

  {
    // ⛔ THE BLOCKER, and its whole class: the value has to ARRIVE, not merely be listed as carried.
    const prefill = debtPrefillFromExpense(EVERY_FIELD);
    for (const [source, targets] of Object.entries(LANDS_AS)) {
      for (const target of targets) {
        eq(
          prefill[target] as unknown,
          EVERY_FIELD[source as keyof RequiredExpense] as unknown,
          `${source} → debt.${target}`,
        );
      }
    }
    for (const k of droppedKeys) {
      assert(!(k in prefill), `"${k}" is not smuggled onto the debt under its own name`);
    }
  }

  {
    // ⚠️ The opposite direction: a bill with autopay OFF must not arrive with it on. A carry written as
    // `isAutopay: true` would pass every assertion above.
    const manual = debtPrefillFromExpense({ ...EVERY_FIELD, isAutopay: false, isPaidThisCycle: false });
    eq(manual.isAutopay, false, 'a bill paid BY HAND converts to a debt paid by hand');
    eq(manual.minimumPaidThisCycle, false, '…and one not yet paid this cycle is still owed');
  }

  {
    /**
     * ⛔ **HOP 2 — `DebtSheet` MUST SEED FROM `seed`, AND THE POPULATION IS THE FILE.**
     *
     * `seed = editing ?? prefill ?? null`. A `useState` initialiser that reads `editing?` instead is the
     * defect: on an EDIT the two are identical, so every test passes and only a prefilled ADD is wrong.
     * ⚠️ Matched by text with a cap of **zero** rather than by naming the four fields — the four were
     * what was left over last time somebody named the fields.
     */
    const sheet = readFileSync(join(__dirname, 'DebtSheet.tsx'), 'utf8');
    const fromEditing = sheet.match(/useState\(\s*editing\??\./g) ?? [];
    eq(
      fromEditing.length,
      0,
      `no useState in DebtSheet seeds from \`editing\` — it seeds from \`seed\`, so a prefill is honoured (found ${fromEditing.length})`,
    );
    assert(
      /const seed = editing \?\? prefill \?\? null;/.test(sheet),
      '…and `seed` is still the merge of the two, so the assertion above means what it says',
    );
    assert(
      /useState\(\s*seed\?\./.test(sheet),
      '…and the seeds really do read it, so a rename cannot make the check above vacuously true',
    );
  }

  console.log(`\n✅ bill → debt prefill: ${passed} assertions passed\n`);
}

runDebtPrefillTests();
