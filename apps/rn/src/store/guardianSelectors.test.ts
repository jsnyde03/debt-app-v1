import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectCalibrationScore, selectPaydayGuardian, selectRiskNotification, selectTightTopUp, selectTrialConversion } from '@/store/guardianSelectors';

/**
 * RS.2 — comprehensive break-it coverage for the Guardian SELECTORS (the newest, least-covered
 * app-layer). Builds a store in each state × tier × regime and hammers the read, incl. bad-number /
 * empty / boundary inputs. Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

/** A store in a chosen shape — a positive paycheck, optional debts/bills/living/goals, floor + tier. */
function store(o: {
  amount?: string;
  floor?: number;
  premium?: boolean;
  debts?: { balance: number; min: number }[];
  bills?: number[];
  living?: number;
  goals?: { type: 'emergency' | 'savings'; current: number; target?: number }[];
} = {}): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: o.premium ? 'premium' : 'free',
    cushionFloor: o.floor ?? 200,
    genuineCycleCount: 6, // established → no cold-start holdback dampening the deploy
    paycheck: { ...s.paycheck, amount: o.amount ?? '2000' },
    debts: (o.debts ?? []).map((d, i) => ({
      id: `d${i}`, name: `Debt ${i}`, balance: d.balance, minimumPayment: d.min, apr: 20,
      dueDate: today, type: 'debt', recurrence: 'monthly', balanceAsOfDate: today,
    })),
    requiredExpenses: (o.bills ?? []).map((amt, i) => ({ id: `e${i}`, name: `Bill ${i}`, amount: amt, dueDate: today, recurrence: 'monthly' })),
    livingExpenses: o.living ? [{ id: 'liv', name: 'Everyday', amount: o.living, enabled: true }] : [],
    goals: (o.goals ?? []).map((g, i) => ({
      id: `g${i}`, name: g.type === 'emergency' ? 'Emergency Fund' : `Savings ${i}`,
      type: g.type, currentAmount: g.current, targetAmount: g.target ?? 5000,
    })),
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

function run() {
  console.log('Running Guardian selector (RS.2) tests...');

  // ── selectPaydayGuardian: no plan → null ──
  eq(selectPaydayGuardian(store({ amount: '' })), null, 'no paycheck → null');
  eq(selectPaydayGuardian(createDefaultStore()), null, 'default (empty) store → null');

  // ── The state machine across headroom, premium ──
  const clear = selectPaydayGuardian(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], floor: 200 }));
  assert(clear !== null && clear.state === 'clear', 'high headroom → clear');
  assert(!!clear && clear.deployedToDebt > 0, 'clear premium deploys the spare to debt');

  const tight = selectPaydayGuardian(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200 }));
  assert(tight !== null && tight.state === 'tight', 'headroom under the floor (but ≥ half) → tight');
  eq(tight?.deployedToDebt, 0, 'tight deploys nothing');

  const atRisk = selectPaydayGuardian(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1870], floor: 200 }));
  assert(atRisk !== null && atRisk.state === 'at-risk', 'headroom below half the floor → at-risk');

  const short = selectPaydayGuardian(store({ premium: true, amount: '2000', bills: [2600], floor: 200 }));
  assert(short !== null && short.state === 'at-risk', 'bills exceed the paycheck → at-risk');
  assert(!!short && /won't cover everything/.test(short.title), '…and the shortfall title');
  eq(short?.deployedToDebt, 0, '…deploy paused in a shortfall');

  // ── Regime: debt-free persists, savings-framed (2.4.8) ──
  const debtFree = selectPaydayGuardian(store({ premium: true, amount: '2000', debts: [{ balance: 0, min: 100 }], goals: [{ type: 'savings', current: 0, target: 5000 }], floor: 200 }));
  assert(debtFree !== null, 'debt-free → Guardian PERSISTS (not null)');
  eq(debtFree?.debtFree, true, '…flagged debtFree');
  assert(!!debtFree && debtFree.deployedToDebt > 0, '…spare deploys to savings');

  // ── Tier: free gets the read, no action ──
  const free = selectPaydayGuardian(store({ premium: false, amount: '2000', debts: [{ balance: 5000, min: 100 }], floor: 200 }));
  assert(free !== null && free.state === 'clear', 'free: same headroom → clear');
  eq(free?.safeMove, undefined, 'free gets no safeMove (the card shows the invitation)');

  // ── Break-it: bad numbers never crash — they degrade to null (no plan) ──
  for (const bad of ['abc', 'NaN', '-500', '0', '  ', 'Infinity']) {
    eq(selectPaydayGuardian(store({ amount: bad, debts: [{ balance: 5000, min: 100 }] })), null, `bad paycheck "${bad}" → null (no crash)`);
  }
  const huge = selectPaydayGuardian(store({ premium: true, amount: '99999999', debts: [{ balance: 5000, min: 100 }], floor: 200 }));
  assert(huge !== null && huge.state === 'clear' && Number.isFinite(huge.cushion), 'huge paycheck → clear, finite viz (no Infinity)');

  // ── selectTightTopUp (2.4.11.2) ──
  const tuStore = store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200, goals: [{ type: 'emergency', current: 1000 }] });
  const tu = selectTightTopUp(tuStore);
  assert(tu !== null, 'tight + savings → a top-up offer');
  eq(tu?.topUp, 50, '…topUp = the gap to the floor (200 − 150)');
  eq(tu?.goalName, 'Emergency Fund', '…names the savings source');

  eq(selectTightTopUp(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200 })), null, 'tight + NO savings → null (honest calm state)');
  eq(selectTightTopUp(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], floor: 200, goals: [{ type: 'emergency', current: 1000 }] })), null, 'CLEAR → null (nothing to hold)');
  eq(selectTightTopUp({ ...tuStore, subscriptionPlan: 'free' }), null, 'free tier → null (premium-only)');
  // savings smaller than the gap → topUp capped at what's available
  const capped = selectTightTopUp(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1870], floor: 200, goals: [{ type: 'emergency', current: 20 }] }));
  assert(capped !== null && capped.topUp === 20, 'savings < gap → topUp capped at the balance');

  // ── 3.7.A3.3 [D24] — a DISCRETIONARY goal is preferred; the EF is the fallback, never the first pick ──
  // The old selector was a bare `find` over (emergency | savings), so the source was decided by array
  // ORDER — i.e. by whichever the user happened to create first. Raiding the safety net for a
  // covered-but-tight cushion dip should never be the default when a discretionary pot exists.
  const bothPots = selectTightTopUp(
    store({
      premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200,
      // EF FIRST in the array — so find-order would pick it, and preference must override that.
      goals: [{ type: 'emergency', current: 1000 }, { type: 'savings', current: 1000 }],
    }),
  );
  eq(bothPots?.goalName, 'Savings 1', 'A3.3 — a discretionary goal wins over the EF even when the EF is first');
  eq(bothPots?.isEmergencyFund, false, '…and it is not flagged as the emergency fund');

  // EF-only → still offered (a covered-but-tight cycle is what a cushion is for), but FLAGGED so the
  // copy can name it instead of calling it "savings".
  eq(tu?.isEmergencyFund, true, 'A3.3 — EF-only → still offered, and flagged as the emergency fund');

  // ── selectRiskNotification (2.4.10) — premium, risk-only, off the band ──
  const now = createDefaultStore().paycheck.currentDate;
  const riskStore = store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1870], floor: 200 }); // at-risk (discretionary ~30)
  eq(selectRiskNotification(riskStore, now).fire, true, 'premium at-risk → risk push fires');
  eq(selectRiskNotification({ ...riskStore, subscriptionPlan: 'free' }, now).fire, false, 'free → no risk push (premium-only)');
  eq(selectRiskNotification(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], floor: 200 }), now).fire, false, 'clear → no risk push (risk-only)');
  eq(selectRiskNotification({ ...riskStore, pushLog: [now, now] }, now).fire, false, '2 recent pushes → frequency-capped');

  // ── selectCalibrationScore (2.4.9) — cold-start / empty history ──
  const cal = selectCalibrationScore(store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }] }));
  eq(cal.proven, false, 'no history → not proven (day-one state)');
  eq(cal.matchRate, null, 'no history → matchRate null (no hollow number)');
  eq(cal.n, 0, 'no gradeable cycles → n 0');

  // ── selectTrialConversion (2.5.4) — a converted trial surfaces the keep/cancel prompt; tier-agnostic ──
  {
    const today = createDefaultStore().paycheck.currentDate;
    const withTrial = (over: Record<string, unknown>): DebtStore => ({
      ...store(),
      requiredExpenses: [{ id: 't0', name: 'Netflix', amount: 0, dueDate: today, recurrence: 'monthly', isTrial: true, fullAmount: 15.99, fullChargeDate: '2020-01-01', ...over }],
    });
    eq(selectTrialConversion(withTrial({}))?.name, 'Netflix', 'converted trial (past kick-in) → surfaces');
    eq(selectTrialConversion(withTrial({}))?.fullAmount, 15.99, '→ carries the full price');
    eq(selectTrialConversion(withTrial({}))?.cadence, '/mo', '→ monthly cadence label');
    eq(selectTrialConversion(withTrial({ fullChargeDate: '2999-01-01' })), null, 'not-yet-converted (future kick-in) → null');
    eq(selectTrialConversion(withTrial({ isTrial: false })), null, 'not flagged a trial → null');
    eq(selectTrialConversion(withTrial({ fullAmount: undefined })), null, 'no full price → null (no phantom prompt)');
    eq(selectTrialConversion(withTrial({ fullAmount: Number.NaN })), null, 'non-finite full price → null');
    eq(selectTrialConversion(store()), null, 'no trials → null');
    eq(selectTrialConversion({ ...withTrial({}), subscriptionPlan: 'free' })?.name, 'Netflix', 'free tier also gets the prompt (accuracy for all)');
  }

  // ── 3.7.A3.2 — the clear branch must not call money "cushion" when it went into a GOAL ──
  // The §2.5 waterfall funds the starter EF (and any PRIORITY savings goal) BEFORE the snowball, so a
  // spare wholly absorbed by either leaves `deployedToDebt` at 0 — and the brief then said "this
  // paycheck keeps ALL of it as your cushion, right at your $200 line", a sentence that contradicts
  // itself in its own clause. Measured overstatement: (discretionary − kept), up to the $1,000 starter
  // target. Both rungs are asserted, because fixing only the EF would leave the class open.
  {
    const efSoaks = selectPaydayGuardian(
      store({ premium: true, amount: '2000', debts: [{ balance: 8000, min: 100 }], bills: [900], floor: 200, goals: [{ type: 'emergency', current: 0, target: 1000 }] }),
    );
    eq(efSoaks?.deployedToDebt, 0, 'A3.2 — the starter EF absorbs the whole spare, so nothing reaches debt');
    eq(efSoaks?.cushion, 200, '…and the real cushion is the $200 floor, not the $1,000 headroom');
    assert(!efSoaks?.detail.includes('keeps all of it as your cushion'), '…so the brief must NOT claim it keeps all of it as cushion');
    assert(!!efSoaks?.detail.includes('$800') && !!efSoaks?.detail.includes('Emergency Fund'), '…it names the $800 and where it went');
    assert(!!efSoaks?.detail.includes('funds before debt payoff'), '…and why debt got nothing');
    // The old safe move promised nudging the floor down frees money "for debt". It frees it for the EF.
    assert(!!efSoaks?.safeMove?.includes('Emergency Fund'), '…and the safe move points at the rung that actually receives it');

    // The SAME defect through the other pre-debt rung — a prioritized savings goal.
    const base = store({ premium: true, amount: '2000', debts: [{ balance: 8000, min: 100 }], bills: [900], floor: 200 });
    const goalSoaks = selectPaydayGuardian({
      ...base,
      goals: [{ id: 'vac', name: 'Vacation', targetAmount: 5000, currentAmount: 0, type: 'savings', priority: true }],
    });
    eq(goalSoaks?.deployedToDebt, 0, 'A3.2 — a PRIORITY savings goal absorbs the spare the same way');
    assert(!goalSoaks?.detail.includes('keeps all of it as your cushion'), '…and gets the same honest treatment, not just the EF');
    assert(!!goalSoaks?.detail.includes('Vacation'), '…naming the goal that actually received it');

    // Regression guard the other way: a genuinely all-cushion CLEAR cycle keeps the original copy.
    // Discretionary lands exactly ON the floor, so the buffer takes it all and no rung sees a cent —
    // the one shape in which "keeps all of it as your cushion" is literally true.
    const noRung = selectPaydayGuardian(store({ premium: true, amount: '2000', debts: [{ balance: 8000, min: 100 }], bills: [1700], floor: 200 }));
    eq(noRung?.state, 'clear', 'discretionary exactly at the floor → clear (not tight)');
    eq(noRung?.deployedToDebt, 0, '…with no pre-debt rung and no spare to debt');
    assert(!!noRung?.detail.includes('keeps all of it as your cushion'), '…still says so, because this time it is true');
  }

  console.log(`✅ Guardian selector (RS.2) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
