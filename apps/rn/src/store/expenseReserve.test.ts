import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import type { DebtStore, RequiredExpense } from '@/data/models';
import { selectExpenseReserveNow, selectExpenseReserveOffer, selectRecurringSmoothed } from '@/store/expenseReserveSelectors';
import { selectWindfallSplit } from '@/store/guardianSelectors';
import { applyRollover } from '@/store/payday';
import { selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectAllocation, selectExpenseReserveContribution, selectExpenseReservePot } from '@/store/selectors';

/**
 * 3.8 — the expense reserve's READ + PERSISTENCE layers.
 *
 * The engine's own invariants are locked in `@core/engine/testExpenseReserve`. This covers what only exists
 * above it: the cycle-keyed contribution, the hero's "what is set aside RIGHT NOW" figure, the capped offer,
 * the rollover fold, and the two canonical lists a new allocation category must join.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
const R = (n: number) => Math.round(n * 100) / 100;
const eq = (actual: number, expected: number, label: string) =>
  assert(R(actual) === R(expected), `${label} (expected ${R(expected)}, got ${R(actual)})`);

const bill = (id: string, amount: number, dueDate: string): RequiredExpense =>
  ({ id, name: id, amount, dueDate, recurrence: 'monthly', category: 'housing' }) as RequiredExpense;

const base = createDefaultStore();
// Rent falls INSIDE this cycle; the other two land after the 6/15 payday. Three bills, deliberately —
// rent is an example, not the case.
const store = (over: Partial<DebtStore> = {}): DebtStore => ({
  ...base,
  paycheck: { ...base.paycheck, amount: '1200', payCycle: 'biweekly', currentDate: '2026-06-01', nextPaycheckDate: '2026-06-15' },
  requiredExpenses: [bill('rent', 350, '2026-06-06'), bill('elec', 120, '2026-06-20'), bill('nflx', 30, '2026-06-25')],
  ...over,
});
const held = (amount: number, forCycle = '2026-06-15') => ({ balance: 0, contribution: { forCycle, amount } });

console.log('\n▶ 3.8 expense reserve — store, selectors, rollover');

// ── absent ⇒ today's behaviour (the rule Phase 5's migration bridge depends on) ──
eq(selectExpenseReservePot(store()), 0, 'absent pot reads 0');
eq(selectExpenseReserveContribution(store()), 0, 'absent contribution reads 0');
{
  const raw = { ...store() } as Record<string, unknown>;
  delete raw.expenseReserve;
  assert(runMigrations(raw).expenseReserve === undefined, 'a pre-3.8 blob migrates WITHOUT acquiring a pot');
}

// ── the contribution is cycle-KEYED, so a stale one self-corrects ──
eq(selectExpenseReserveContribution(store({ expenseReserve: held(175) })), 175, 'this cycle’s contribution counts');
eq(selectExpenseReserveContribution(store({ expenseReserve: held(175, '2026-05-01') })), 0, 'a STALE contribution reads 0');
eq(selectExpenseReservePot(store({ expenseReserve: { balance: 350, contribution: { forCycle: '2026-05-01', amount: 175 } } })), 350,
  '…while the carried balance survives it');

// ⛔ The hero must move the INSTANT the user reserves. Reading `balance` would leave it at $0 until the
// next payday — the app failing to record the habit it just coached, which is 3.8's own defect restated.
eq(selectExpenseReserveNow(store()), 0, 'day one: nothing set aside');
eq(selectExpenseReserveNow(store({ expenseReserve: held(175) })), 175, 'the hero moves IMMEDIATELY on reserving, not at rollover');
eq(selectExpenseReserveNow(store({ expenseReserve: { balance: 500 } })), 150, 'the hero nets this cycle’s draw (500 − 350 rent)');
eq(selectExpenseReserveNow(store({ expenseReserve: { balance: 500, contribution: { forCycle: '2026-06-15', amount: 200 } } })), 350,
  'carry − draw + hold, together');
{
  // An oversized contribution shows what was HELD, never what was asked.
  const greedy = selectExpenseReserveNow(store({ expenseReserve: held(99_999) }));
  assert(greedy < 99_999, 'an over-large contribution is clamped, not echoed');
  eq(greedy, 800, '…to paycheck 1200 − rent 350 − the free tier’s $50 floor');
}

// ── the smoothing: the WHOLE recurring load, one owner ──
eq(selectRecurringSmoothed(store()).monthlyTotal, 500, 'smoothing sums every recurring bill, not one');

// ⛔ [A3.6] the offer may never promise more than the paycheck can spare.
{
  const healthy = selectExpenseReserveOffer(store())!;
  eq(healthy.offer, healthy.recommended, 'a healthy paycheck is offered the full recommendation');
  assert(healthy.coversRecommendation, '…and says it covers it');

  const thin = selectExpenseReserveOffer(store({ paycheck: { ...store().paycheck, amount: '550' } }))!;
  assert(thin.offer < thin.recommended, 'a thin paycheck’s offer is CAPPED');
  assert(!thin.coversRecommendation, '…and says so, so the copy cannot promise the whole figure');
  // Measured against the engine, not derived: offering the number must reserve exactly that number.
  const thinStore = store({ paycheck: { ...store().paycheck, amount: '550' }, expenseReserve: held(thin.offer) });
  eq(selectAllocation(thinStore)!.expenseReserveHeld, thin.offer, '…and the engine holds exactly what was offered');
  const overStore = store({ paycheck: { ...store().paycheck, amount: '550' }, expenseReserve: held(R(thin.offer + 1)) });
  assert(selectAllocation(overStore)!.expenseReserveHeld < R(thin.offer + 1), '…while one dollar more would be a broken promise');

  assert(selectExpenseReserveOffer(store({ requiredExpenses: [] })) === null, 'no recurring load → no offer');
  assert(selectExpenseReserveOffer(store({ paycheck: { ...store().paycheck, amount: '100' } })) === null,
    'a SHORTFALL → no offer: never coach a reserve while this cycle is unfunded');
}

// ── the "Spoken for" split, and the reserve never leaking into everyday ──
{
  const s = store({ livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 300, enabled: true }], expenseReserve: held(175) });
  const a = selectAllocation(s)!;
  const summary = selectPlanSummary(s, a, selectRequiredRows(s, a));
  eq(summary.everydayReserve, 300, 'everydayReserve stays living-only');
  eq(summary.billsReserve, 175, 'billsReserve is the held contribution');
  eq(summary.everydayReserve + summary.billsReserve, 475, 'Spoken for = everyday + bills');
  eq(summary.everydayHeld, 300, '…and a paycheck that can hold it reports held === requested');
}

// ⛔ [T5 · L3-6] The everyday reserve is a REQUEST, and the engine clamps it to what exists:
// `remaining = Math.max(0, remaining - paidRequired - livingExpenseReserve)`. The overflow is absorbed
// with no record against the reserve, so every surface that said "reserved each paycheck" over the raw
// enabled sum was stating an outcome the paycheck never delivered. `livingExpenseHeld` is that outcome.
{
  // $300 paycheck, $400 of enabled everyday spending, no bills due in-cycle → $100 of it cannot exist.
  const s = store({
    paycheck: { ...base.paycheck, amount: '300', payCycle: 'biweekly', currentDate: '2026-06-01', nextPaycheckDate: '2026-06-15' },
    requiredExpenses: [],
    livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 400, enabled: true }],
  });
  const a = selectAllocation(s)!;
  eq(a.livingExpenseReserve, 400, 'the REQUEST is still the raw enabled sum');
  eq(a.livingExpenseHeld, 300, '…while what the paycheck HELD is clamped to what exists');
  assert(a.livingExpenseHeld < a.livingExpenseReserve, '…so the two genuinely diverge, which is the copy gate');
  const summary = selectPlanSummary(s, a, selectRequiredRows(s, a));
  eq(summary.everydayHeld, 300, 'and the summary carries the held figure, not the request');

  // A disabled item is not requested at all — the clamp must not paper over the enabled filter.
  const off = selectAllocation(store({
    paycheck: { ...base.paycheck, amount: '300', payCycle: 'biweekly', currentDate: '2026-06-01', nextPaycheckDate: '2026-06-15' },
    requiredExpenses: [],
    livingExpenses: [{ id: 'l1', name: 'Groceries', amount: 400, enabled: false }],
  }))!;
  eq(off.livingExpenseHeld, 0, 'a disabled item holds nothing');
}

// ⛔ A bill the pot covers IN FULL must still be a tickable row — the user still owes the biller.
{
  const s = store({ expenseReserve: { balance: 350 } });
  const rent = selectRequiredRows(s, selectAllocation(s)!).find((r) => r.item.targetId === 'rent');
  assert(!!rent, 'a fully pre-funded bill still renders a row');
  eq(rent!.item.amount, 0, '…contributing 0 from this paycheck');
  eq(rent!.item.reserveCovered ?? 0, 350, '…and naming the reserve’s share');
  eq(rent!.item.amount + (rent!.item.reserveCovered ?? 0), 350, '…so the row can show the REAL bill, not $0');
}

// ⛔ CONSERVATION through a real rollover: balance − drawn + held, using the engine's own numbers.
{
  const c1 = store({ expenseReserve: held(175) });
  const a1 = selectAllocation(c1)!;
  eq(a1.expenseReserveHeld, 175, 'cycle 1 holds 175');
  const rolled = applyRollover(c1);
  eq(rolled.expenseReserve?.balance ?? -1, 175, 'the rollover folds the hold into the pot');
  assert(rolled.expenseReserve?.contribution === undefined, '…and drops the spent, cycle-keyed contribution');

  // Cycle 2 (the rolled store's own dates) must spend it rather than accumulate forever.
  const a2 = selectAllocation(rolled)!;
  assert(a2.expenseReserveDrawn > 0, 'cycle 2 DRAWS on the pot rather than hoarding it');
  const rolled2 = applyRollover(rolled);
  eq(
    rolled2.expenseReserve?.balance ?? 0,
    R(175 - a2.expenseReserveDrawn + a2.expenseReserveHeld),
    'cycle 2’s pot = balance − drawn + held: nothing invented, nothing lost',
  );
}
{
  // A store that never touches the feature must stay indistinguishable from a pre-3.8 one.
  assert(applyRollover(store()).expenseReserve === undefined, 'an untouched reserve stays ABSENT through a rollover');
}

// ⛔ The two canonical lists a new allocation category MUST join, or money stops conserving.
{
  // `WINDFALL_GROUPS` asserts it partitions every category; `expense_reserve` was routed to `bills`,
  // deliberately NOT `safetyNet` (that is the Guardian's automatic protection, not the user's set-aside).
  const s = store({ subscriptionPlan: 'premium', genuineCycleCount: 6, expenseReserve: held(175) });
  const split = selectWindfallSplit(s, 300);
  assert(split !== null, 'a windfall still splits with a reserve in play');
  eq(split!.items.reduce((t, i) => t + i.amount, 0), 300, 'windfall buckets still sum EXACTLY to the windfall');
  assert(!split!.items.some((i) => i.key === 'safetyNet' && i.amount < 0), 'the reserve never lands as negative safety net');
}

console.log(`✅ 3.8 expense reserve: ${passed} assertions passed.`);
