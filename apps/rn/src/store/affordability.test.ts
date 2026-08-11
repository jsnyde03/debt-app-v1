import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectAffordability, selectAppliedTopUp, selectSaveForItOptions } from '@/store/guardianSelectors';

/**
 * §2.9 Can-I-Afford-This? — the app-layer selectors over the engine. The pure verdict + priority-goal
 * math are unit-tested in core; this proves `selectAffordability` (verdict + honest debt impact off the
 * real allocation) and `selectSaveForItOptions` (the paced sinking-fund options) on a seeded store.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

// $2000 paycheck, one big debt (min $100) → discretionary = 2000 - 100 = $1900 above obligations; floor $200.
function store(): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '2000', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [{ id: 'card', name: 'Card', balance: 8000, minimumPayment: 100, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
    requiredExpenses: [],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

function run() {
  console.log('Running affordability selectors (2.9) tests...');
  const s = store();

  // Verdicts against $1900 discretionary, $200 floor.
  assert(selectAffordability(s, 500)?.verdict === 'comfortable', '$500 → comfortable (cushion $1400 ≥ floor)');
  assert(selectAffordability(s, 1800)?.verdict === 'tight', '$1800 → tight (cushion $100 < floor $200)');
  const short = selectAffordability(s, 2500);
  assert(short?.verdict === 'short', '$2500 → short (exceeds $1900)');
  assert(short?.shortBy === 600, '…short by $600');

  // The honest debt impact: a comfortable purchase displaces money that would have gone to the snowball.
  assert((selectAffordability(s, 500)?.extraToDebtDelta ?? 0) > 0, 'a purchase reduces what reaches debt this paycheck (extraToDebtDelta > 0)');

  // §2.9.5 cover-a-tight-dip: a tight purchase can be covered from a SAVINGS goal (never the EF).
  const withSavings: DebtStore = { ...s, goals: [{ id: 'vac', name: 'Vacation', targetAmount: 1000, currentAmount: 500, type: 'savings' }] };
  const tightCover = selectAffordability(withSavings, 1800); // cushionAfter 100 < floor 200 → tight, gap 100
  assert(tightCover?.verdict === 'tight', '$1800 is tight (cover case)');
  assert(tightCover?.coverFromSavings?.goalName === 'Vacation' && tightCover?.coverFromSavings?.amount === 100, 'cover offers the $100 gap from the savings goal');
  assert(selectAffordability(s, 1800)?.coverFromSavings === null, 'no cover option when there is no savings goal');
  const efOnly: DebtStore = { ...s, goals: [{ id: 'ef', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 500, type: 'emergency' }] };
  assert(selectAffordability(efOnly, 1800)?.coverFromSavings === null, 'never raids the emergency fund for a discretionary buy');
  assert(selectAffordability(withSavings, 500)?.coverFromSavings === null, 'a comfortable purchase has no cover option');
  assert(tightCover?.coverFromSavings?.holdsLine === true, '…and a fully-funded cover reports holdsLine');

  // ── 3.7.A3.6 — the cushion this card reads must INCLUDE a top-up already taken this cycle ──
  // The Guardian's brief adds `appliedTopUp`; this selector did not, so after the user tapped the
  // Guardian's one-tap the two cards sat on one screen disagreeing about the same cushion — and this one
  // offered to move the SAME money out of the SAME goal a second time.
  // $1750 of rent drops the $1900 discretionary to $150, under the $200 floor — the exact state in which
  // the Guardian ALSO offers its own top-up, which is what makes the double-count reachable.
  const tightBase: DebtStore = {
    ...s,
    requiredExpenses: [{ id: 'rent', name: 'Rent', amount: 1750, dueDate: '2026-08-05', recurrence: 'monthly' }],
    goals: [{ id: 'vac', name: 'Vacation', targetAmount: 1000, currentAmount: 450, type: 'savings' }],
  };
  const preTopUp = selectAffordability(tightBase, 100);
  assert(preTopUp?.discretionaryNow === 150, 'pre-top-up: the cushion is $150 (under the $200 floor)');
  assert(preTopUp?.coverFromSavings?.amount === 150, '…and a $100 purchase needs the full $150 gap covered');

  // Now the user taps the GUARDIAN's one-tap first: $50 moves from Vacation into this cycle.
  const toppedUp: DebtStore = { ...tightBase, cycleTopUp: { forCycle: '2026-09-01', amount: 50, goalId: 'vac' } };
  const afterTopUp = selectAffordability(toppedUp, 100);
  assert(afterTopUp?.discretionaryNow === 200, 'A3.6 — the $50 already moved from savings counts toward the cushion ($150 + $50)');
  assert(afterTopUp?.cushionAfter === 100, '…so the same $100 purchase dips to $100, not the stale $50');
  // The regression this pins: unfixed, the cover still asked for $150 on top of the $50 already moved —
  // $200 drawn to close a $150 gap, $50 of it a second draw for money that was already in checking.
  assert(afterTopUp?.coverFromSavings?.amount === 100, '…and the cover asks the REMAINING $100, never re-offering the $50 already moved');

  // A cover capped by the goal's balance must not claim to hold the line (A3.1's defect class).
  const thinPot: DebtStore = { ...tightBase, goals: [{ id: 'vac', name: 'Vacation', targetAmount: 1000, currentAmount: 20, type: 'savings' }] };
  const capped = selectAffordability(thinPot, 100);
  assert(capped?.coverFromSavings?.amount === 20, 'a thin savings pot caps the cover at its balance');
  assert(capped?.coverFromSavings?.holdsLine === false, '…and reports holdsLine=false — $20 against a $150 gap does not hold the line');

  // The applied-top-up confirmation carries the same outcome flag, so "to hold your line" can't persist
  // as a lie after a capped move.
  assert(selectAppliedTopUp(toppedUp)?.holdsLine === true, 'an applied top-up that reaches the floor reports holdsLine');
  const cappedApplied: DebtStore = { ...thinPot, goals: [{ id: 'vac', name: 'Vacation', targetAmount: 1000, currentAmount: 0, type: 'savings' }], cycleTopUp: { forCycle: '2026-09-01', amount: 20, goalId: 'vac' } };
  assert(selectAppliedTopUp(cappedApplied)?.holdsLine === false, '…a capped one does not, even once the goal is drained to $0');

  // Save-for-it options for a short purchase: prioritized paces + a debt-first path.
  const opts = selectSaveForItOptions(s, 2500);
  assert(opts.some((o) => o.key === 'fast' && o.prioritize && (o.perPaycheck ?? 0) > 0 && o.paychecks != null), 'a prioritized "fast" option with a real per-paycheck pace + ready date');
  assert(opts.some((o) => o.key === 'debtFirst' && !o.prioritize && o.readyBy == null), 'a debt-first option (no priority, no firm date)');
  assert(opts.length >= 2, 'at least fast + debt-first are offered');

  console.log(`✅ Affordability selectors (2.9) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
