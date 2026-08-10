import { createDefaultStore } from '@/data/defaults';
import type { Debt, RequiredExpense } from '@/data/models';
import { appStore } from '@/store/appStore';
import { looksLikeDebt } from '@/store/looksLikeDebt';

/**
 * 3.7.A10.2 — the mis-file detector, and the conversion it offers.
 *
 * Both halves are pinned because both fail SILENTLY. A detector that misses says nothing; a detector that
 * over-fires tells someone their rent is secretly a debt, which is worse. And a conversion that half-
 * applies leaves the same money reserved as an expense AND projected as a debt, on the user's real plan.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

// ── The cases that started this: a mortgage and rent are indistinguishable by shape. ──────────────────
assert(looksLikeDebt({ name: 'Mortgage' }), 'a mortgage is caught — the case Jason hit');
assert(looksLikeDebt({ name: 'Rocket Mortgage' }), 'a lender-branded mortgage is caught');
assert(!looksLikeDebt({ name: 'Rent' }), 'rent is NOT accused — it is the same shape and a real expense');

// ── Cards and loans, which land in `other` and would be missed by any category-based rule. ────────────
assert(looksLikeDebt({ name: 'Visa' }), 'Visa');
assert(looksLikeDebt({ name: 'Chase credit card' }), 'a credit card');
assert(looksLikeDebt({ name: 'Car loan' }), 'a car loan');
assert(looksLikeDebt({ name: 'Klarna — sofa' }), 'BNPL by brand');

// ── Precision. Every one of these is a real expense a looser list would accuse. ───────────────────────
assert(!looksLikeDebt({ name: 'Discovery+' }), "Discovery+ is a subscription, not Discover — the word boundary earns its place");
assert(!looksLikeDebt({ name: 'Cardio Gym' }), '"Cardio" is not "card"');
assert(!looksLikeDebt({ name: 'Electric' }), 'a utility');
assert(!looksLikeDebt({ name: 'Netflix' }), 'a subscription');
assert(!looksLikeDebt({ name: 'Payment plan' }), '"payment" alone is NOT a debt word — too many bills are called one');

// ── The conversion moves the money exactly once. ──────────────────────────────────────────────────────
const expense: RequiredExpense = {
  id: 'e1',
  name: 'Mortgage',
  amount: 1600,
  dueDate: '2026-09-01',
  recurrence: 'monthly',
  category: 'housing',
} as RequiredExpense;

appStore.setState({
  store: { ...createDefaultStore(), requiredExpenses: [expense], debts: [] },
});

const debt: Debt = {
  id: 'd-converted',
  name: 'Mortgage',
  balance: 240000,
  minimumPayment: 1600,
  apr: 6.5,
  dueDate: '2026-09-01',
  type: 'debt',
  recurrence: 'monthly',
} as Debt;

appStore.getState().convertExpenseToDebt('e1', debt);
const after = appStore.getState().store;

assert(after.debts.length === 1 && after.debts[0].name === 'Mortgage', 'the debt exists');
assert(after.requiredExpenses.length === 0, 'and the expense is GONE — not left reserving the same money twice');
assert(after.debts[0].originalBalance === 240000, 'originalBalance is seeded so the row can show progress');
assert(!!after.debts[0].balanceAsOfDate, 'the balance is stamped as verified now — it was just typed by hand');

// A conversion naming an expense that does not exist must not invent a debt-shaped hole: the debt is
// still added (the user filled the form), and no unrelated expense is removed.
appStore.getState().convertExpenseToDebt('nope', { ...debt, id: 'd2', name: 'Second' } as Debt);
assert(appStore.getState().store.debts.length === 2, 'an unmatched expense id still adds the debt the user entered');

console.log(`✅ looksLikeDebt + convertExpenseToDebt tests passed (${passed} asserts).`);
