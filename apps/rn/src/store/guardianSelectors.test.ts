import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { toCushionStatus } from '@core/timeline/buildMultiCycleTimeline';
import { selectAllocation } from '@/store/selectors';
import { selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { selectAffordability, selectAppliedTopUp, selectCalibrationScore, selectPaydayGuardian, selectRiskNotification, selectTightTopUp, selectTrialConversion } from '@/store/guardianSelectors';

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
  /**
   * §2.10 cash already moved from a goal to checking THIS cycle. [S1 · pass 1 · M3] Added because this
   * file had **zero** `cycleTopUp` cases — `grep -c` returned 0 — so the one input that falsifies the
   * band's own premise was untestable here.
   */
  topUp?: number;
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
    // Keyed to the cycle, exactly as `applyTightTopUp` writes it — `appliedTopUp` returns 0 for any other
    // `forCycle`, so a record keyed to the wrong date would silently test nothing.
    ...(o.topUp
      ? {
          cycleTopUp: {
            forCycle: s.paycheck.nextPaycheckDate,
            amount: o.topUp,
            entries: [{ source: 'guardian' as const, goalId: 'g0', amount: o.topUp }],
          },
        }
      : {}),
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
  assert(!!short && /won’t cover everything/.test(short.title), '…and the shortfall title');
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

  // ── T3.5 (audit L3-3) — WITHIN a type, the pick was still creation order ──
  //
  // [D24] ordered the categories and left the within-category pick on a bare `find`, i.e. on whichever
  // pot the user created first. The user is then told a true thing about the WRONG pot: their line
  // cannot be held, while money that would have held it sits one row down.
  const tinyFirst = selectTightTopUp(
    store({
      premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200,
      // A  pot created BEFORE a  one, against a  gap. Find-order picks the .
      goals: [{ type: 'savings', current: 10 }, { type: 'savings', current: 800 }],
    }),
  );
  eq(tinyFirst?.goalName, 'Savings 1', 'L3-3 — prefers a pot that can COVER the gap over the one created first');
  eq(tinyFirst?.topUp, 50, '…draws the gap, not the whole balance of the tiny pot');
  eq(tinyFirst?.holdsLine, true, '…so the line actually holds (was: false, with  untouched)');

  // ⚠️ The SAME shape with the order reversed. Without this, every case above picks the LAST goal, so a
  // "take the last one" implementation passes the whole block — the assertion would be pinning array
  // position rather than the rule.
  const bigFirst = selectTightTopUp(
    store({
      premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200,
      goals: [{ type: 'savings', current: 800 }, { type: 'savings', current: 10 }],
    }),
  );
  eq(bigFirst?.goalName, 'Savings 0', 'L3-3 — and it is the RULE, not the position: the big pot wins from index 0 too');
  eq(bigFirst?.holdsLine, true, '…line holds either way round');

  // No pot can cover it → the largest available, and holdsLine stays honestly false.
  const noneSuffice = selectTightTopUp(
    store({
      premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200,
      goals: [{ type: 'savings', current: 5 }, { type: 'savings', current: 30 }],
    }),
  );
  eq(noneSuffice?.topUp, 30, 'L3-3 — none sufficient → the LARGEST available, not the first');
  eq(noneSuffice?.holdsLine, false, '…and it still says the line will not hold');

  // ⚠️ [D24] is NOT reopened: a savings pot too small to hold the line still outranks a sufficient EF.
  const smallSavingsBigEF = selectTightTopUp(
    store({
      premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200,
      goals: [{ type: 'savings', current: 10 }, { type: 'emergency', current: 5000 }],
    }),
  );
  eq(smallSavingsBigEF?.isEmergencyFund, false, 'D24 holds — an insufficient SAVINGS pot still beats a sufficient EF');
  eq(smallSavingsBigEF?.holdsLine, false, '…the line does not hold, and the safety net is left alone');

  // EF-only → still offered (a covered-but-tight cycle is what a cushion is for), but FLAGGED so the
  // copy can name it instead of calling it "savings".
  eq(tu?.isEmergencyFund, true, 'A3.3 — EF-only → still offered, and flagged as the emergency fund');

  /**
   * ⛔ **A SECOND EMERGENCY-TYPED GOAL IS NOT *THE* EMERGENCY FUND.** [P6.8.9.7.11.18 · S1.1 · M9 / D66]
   *
   * `isEmergencyFund` was `goal.type === 'emergency'`, which is true of every emergency-typed pot — so the
   * button read *"Move $50 from your emergency fund"* over a goal Money labels **Savings** and the engine
   * funds as a sinking fund. ⚡ **No fixture anywhere in the repo carried two emergency goals on this
   * path**, which is why three surfaces disagreed for a release: every assertion above pins a *lone* EF or
   * an EF-vs-savings preference, and both are true under the defect and under the fix.
   *
   * ⚠️ The second pot is the LARGER one so `pickTopUpGoal`'s within-type rule selects it — otherwise this
   * asserts the flag on the primary and reports nothing about the class.
   */
  const twoEfs = selectTightTopUp({
    ...tuStore,
    goals: [
      { id: 'g0', name: 'Emergency Fund', type: 'emergency', currentAmount: 300, targetAmount: 5000 },
      { id: 'g1', name: 'Car repair fund', type: 'emergency', currentAmount: 4000, targetAmount: 5000 },
    ],
  });
  eq(twoEfs?.goalName, 'Car repair fund', 'the larger of two emergency pots is the source');
  eq(twoEfs?.isEmergencyFund, false, '⛔ …and it is NOT called the emergency fund — Money calls it Savings');

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

  // ── [S1 · pass 1 · M3] An APPLIED top-up must not talk the band out of a shortfall ──
  //
  // `buildGuardianBrief` used to derive the band from `computeState(discretionary, …)` alone, on the
  // recorded premise that *"a shortfall drives `discretionary` to 0 → at-risk, so it needs no separate
  // branch"*. `selectDiscretionary` is 0 on any shortfall — but this seam passes
  // `selectDiscretionary(allocation) + appliedTopUp(store)`, and the top-up term is not. With the band no
  // longer `at-risk`, `PaydayGuardianCard` drops `brief.detail`, which is the only place the dollar
  // figure appears in the card's own copy, and draws the `clear` tone's good-standing shield under a
  // title saying the paycheck will not cover everything.
  //
  // ⚠️ `selectTightTopUp` refuses to OFFER a top-up while `allocation.shortfall > 0`, so this state is
  // reached by going short AFTER the move — which is the ordinary case, not an exotic one.
  {
    const shortWithTopUp = store({ premium: true, amount: '2000', bills: [2400], floor: 200, topUp: 200, goals: [{ type: 'savings', current: 1000 }] });
    const brief = selectPaydayGuardian(shortWithTopUp);
    assert((brief?.shortfall ?? 0) > 0, 'M3 fixture really is short (the assertion below is vacuous otherwise)');
    eq(brief?.state, 'at-risk', 'M3 — a shortfall is at-risk even with a top-up on record');
    // ⚠️ A PRECONDITION, NOT A GUARD — and labelled as one because no mutation of the band can red it.
    // The copy branch keys off `shortfall > 0` independently of `state`, so the sentence exists either
    // way; what the defect changed was whether the CARD renders it. Measured under the plant: `state`
    // came back `clear` with `detail` still set to the shortfall sentence. The render gate is pinned in
    // `guardian-shortfall-topup.spec.ts`, which is the only place it can be.
    assert(!!brief?.detail && /short/.test(brief.detail), 'M3 precondition — the shortfall sentence exists to be rendered');

    // The control, same store minus the record. Without it the fixture proves nothing about the top-up.
    const shortNoTopUp = store({ premium: true, amount: '2000', bills: [2400], floor: 200, goals: [{ type: 'savings', current: 1000 }] });
    eq(selectPaydayGuardian(shortNoTopUp)?.state, 'at-risk', 'M3 control — still at-risk without the record');

    // ⛔ THE OTHER DIRECTION, and it is what makes the fix a branch rather than a blunt override: a
    // COVERED cycle with a top-up on record must be completely unmoved. Without this row, `state =
    // "at-risk"` unconditionally would pass every assertion above.
    const coveredWithTopUp = store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], floor: 200, topUp: 200, goals: [{ type: 'savings', current: 1000 }] });
    // ⚠️ `?? 0` — `GuardianBrief.shortfall` is optional and set only on the shortfall branch, so a covered
    // read carries `undefined`, not `0`. Comparing against `0` directly fails on the very case it exists
    // to describe.
    eq(selectPaydayGuardian(coveredWithTopUp)?.shortfall ?? 0, 0, 'M3 counter-fixture really is covered');
    eq(selectPaydayGuardian(coveredWithTopUp)?.state, 'clear', 'M3 — a COVERED cycle with a top-up is untouched');

    // And the tight band still exists between them: the fix must not have collapsed three bands into two.
    const tightWithTopUp = store({ premium: true, amount: '2000', debts: [{ balance: 5000, min: 100 }], bills: [1750], floor: 200, topUp: 20, goals: [{ type: 'savings', current: 1000 }] });
    eq(selectPaydayGuardian(tightWithTopUp)?.shortfall ?? 0, 0, 'M3 tight-fixture is covered, just under the line');
    eq(selectPaydayGuardian(tightWithTopUp)?.state, 'tight', 'M3 — `tight` survives; the fix touches only the shortfall case');

    // ── M3's second door, found by its after-scan and MEASURED before it was believed ──
    //
    // `selectAffordability` adds `appliedTopUp` for the reason its own comment records — cash moved from
    // savings really is in checking, and without it the two cards disagreed about the same cushion. But
    // `selectSpendable` is 0 on any shortfall, so the top-up was the WHOLE figure: with a $400 shortfall
    // and $200 on record, a $150 purchase came back `tight` (cushionAfter $50) instead of `short`
    // (shortBy $150). The app told a user who could not cover their bills that the purchase was fine.
    const affordShort = selectAffordability(shortWithTopUp, 150);
    eq(affordShort?.verdict, 'short', 'M3b — a purchase during a shortfall is SHORT, top-up on record or not');
    eq(affordShort?.shortBy, 150, '…and short by the whole amount, matching the no-top-up control');
    eq(selectAffordability(shortNoTopUp, 150)?.verdict, 'short', 'M3b control — the no-record store already behaved');

    // The other direction: a covered cycle must still SEE the top-up, which is what 3.7.A3.6 added it for.
    // A blanket `0` everywhere would pass every assertion above and silently undo that fix.
    const affordCovered = selectAffordability(coveredWithTopUp, 150);
    eq(affordCovered?.verdict, 'comfortable', 'M3b — a covered cycle is unmoved');
    assert((affordCovered?.cushionAfter ?? 0) > 0, '…and still counts the moved cash, per 3.7.A3.6');
  }


  /**
   * ⛔ **S1.9.3 [pass-2 A1] — THREE READS OF THE SAME MONEY, AND THEY MUST AGREE.**
   *
   * ⚡ **The block above pins `topUp 200` against `shortfall 400`, and so does every other test in the
   * tree** — `guardian-shortfall-topup.spec.ts:28` included. That is the member of the class where a
   * blanket `0` and netting agree **exactly**, so every existing assertion passes under both
   * implementations and none of them can see this. Nothing exercised `topUp > shortfall` at all.
   *
   * Measured on the live selectors: a premium user **$1 short** after moving $200 at the Guardian's own
   * suggestion was told *"Not this paycheck — you'd come up about $20 short"* about a $20 purchase, in the
   * same card saying the $200 *"holds your line"*, with **$199 unspent**.
   *
   * ⛔ **Written as a COMPARISON, not as three expected values** — the same shape `trustSelectors.test.ts`
   * uses for B1, and for the same reason: a test that pins three numbers goes green again the moment a
   * fourth read of this money is added without asking. The invariant is that the seams do not disagree.
   */
  {
    const floor = 200;
    /** Short by `short` before any top-up, with `topUp` already moved this cycle. */
    const cycle = (short: number, topUp: number) =>
      store({ premium: true, amount: '2000', bills: [2000 + short], floor, topUp, goals: [{ type: 'savings', current: 1000 }] });

    /** The three sentences, as the components compose them. */
    const reads = (s: DebtStore, buy: number) => ({
      band: selectPaydayGuardian(s)?.state,
      holdsLine: selectAppliedTopUp(s)?.holdsLine,
      verdict: selectAffordability(s, buy)?.verdict,
      shortBy: selectAffordability(s, buy)?.shortBy,
      spare: selectAffordability(s, buy)?.discretionaryNow,
    });

    // ── THE CASE THAT SHIPPED: one dollar short, $200 moved, a $20 purchase ──
    {
      const r = reads(cycle(1, 200), 20);
      // ⛔ The false dollar figure, by name. $199 of that move is sitting in checking.
      assert(r.shortBy === 0, `⛔ A1 — no purchase this small is "short" with $199 unspent (shortBy ${r.shortBy})`);
      assert(r.verdict !== 'short', '⛔ A1 — …so the card must not say "not this paycheck"');
      assert(r.spare === 199, `⛔ A1 — the spare is the SURPLUS, stated: $199 (got ${r.spare})`);
      // ⛔ THE INVARIANT, and it is the assertion that survives a fourth read being added: the band and the
      // card cannot disagree about whether the line is held.
      eq(r.holdsLine, r.band === 'clear', '⛔ A1 — `holdsLine` and the band are ONE expression, so they agree');
      eq(r.band, 'tight', '…and $199 against a $200 floor is tight — neither at-risk nor clear');
    }

    // ── the same shape, wider: a $600 move against a $50 shortfall genuinely holds the line ──
    {
      const r = reads(cycle(50, 600), 20);
      eq(r.band, 'clear', '⛔ A1 — a top-up that covers the shortfall AND clears the floor is clear');
      eq(r.holdsLine, true, '…and the card says so, agreeing with the band');
      eq(r.verdict, 'comfortable', '…and a $20 purchase against $550 spare is comfortable');
      assert(r.spare === 550, `…the surplus, netted once: 600 − 50 (got ${r.spare})`);
    }

    // ── ⭐ THE CONTROL, and it is AS-3's own case: `topUp ≤ shortfall` must not move at all ──
    // ⚠️ This is the member the existing tests pin. If the netting were wrong in the other direction it
    // would show here, so the pair is what makes either assertion mean anything.
    {
      const r = reads(cycle(400, 200), 150);
      eq(r.band, 'at-risk', '⭐ A1 control — a shortfall the move does NOT cover is still at-risk (M3 intact)');
      eq(r.verdict, 'short', '⭐ A1 control — …and the purchase is still short (AS-3 intact)');
      eq(r.shortBy, 150, '…by the whole amount, exactly as before');
      eq(r.spare, 0, '…with no spare, because the surplus is 0 — not because of a blanket rule');
      eq(r.holdsLine, false, '…and the move did not hold the line');
      // ⚡ **AND THE FIGURE IN THE SENTENCE MOVED, which the after-scan measured rather than assumed.**
      // The card used to say *"about $400 short"* over a user who had already moved $200 into checking.
      // $200 is what they still need, and it is the number the same netting produces — one rule, and the
      // copy gets more honest as a side effect rather than needing its own patch.
      const brief = selectPaydayGuardian(cycle(400, 200));
      assert(!!brief?.detail?.includes('$200'), `⛔ A1 — the shortfall named is what is STILL short (got: ${brief?.detail})`);
      assert(!brief?.detail?.includes('$400'), '…never the gap before the money the user already moved');
    }

    // ── ⭐ AND THE NO-TOP-UP CONTROL: the fix must be invisible where there is no money on record ──
    {
      const r = reads(cycle(400, 0), 150);
      eq(r.band, 'at-risk', '⭐ A1 control — unmoved with no top-up');
      eq(r.verdict, 'short', '⭐ A1 control — unmoved');
      eq(r.shortBy, 150, '⭐ A1 control — unmoved');
    }

    /**
     * ⛔ **THE OFFER READS THE RESIDUAL TOO, and this is the fourth seam — the plan named three.**
     * `selectTightTopUp` refused while the RAW shortfall stood, so in the range where the band now says
     * `tight` it would have offered nothing at all: a card saying "you are under your line" beside no
     * control to do anything about it. ⚠️ The direction is permissive, so it is stated: it can only make
     * the offer available where the band already agrees the obligations are met.
     */
    {
      const s = cycle(50, 200);
      eq(selectPaydayGuardian(s)?.state, 'tight', 'the band calls this cycle tight…');
      assert(selectTightTopUp(s) !== null, '⛔ A1 — …so the tight-case offer exists for it');
      // ⭐ …and it still refuses where the shortfall genuinely stands.
      eq(selectTightTopUp(cycle(400, 200)), null, '⭐ A1 control — a real shortfall still refuses the offer');
    }
  }


  /**
   * ⛔ **S1.9.6 [pass-2 D2-1] — THE THREE PRODUCERS OF THE ONE BAND, ON THE APP'S OWN DESIGNED PATH.**
   *
   * `computeState`'s docblock states the invariant: *"Every producer — the card (`buildGuardianBrief`),
   * the forecast (`buildMultiCycleTimeline`) and `selectPlanSummary` — must derive its band from THIS
   * function so they can never disagree (the card said 'clear' while its own lookahead said 'tight' — the
   * exact contradiction F4 kills)."* ⚡ **All three did call it, with three different first arguments**,
   * and the difference was exactly `appliedTopUp`.
   *
   * Measured: a premium user taps the Guardian card's own *"Move $50 from your emergency fund"*, the card
   * turns **Clear**, and the *"See forecast"* button on that same card opens the cushion forecast on
   * **cycle 0** reading **Tight · $50 under** — the gap they just paid $50 of emergency fund to close.
   * `selectTightTopUp` sizes the offer to exactly `floor − cushion`, so **the designed happy path is the
   * one that broke the invariant.**
   *
   * ⛔ **Asserted as an AGREEMENT, never as three expected values** — the same shape `trustSelectors.test.ts`
   * uses for B1. A test that pins three bands goes green again the moment a fourth reader of this money is
   * added without asking; the invariant is that no producer disagrees.
   *
   * ⚠️ **Compared THROUGH `toCushionStatus`.** `GuardianState` is `clear|tight|at-risk` and `CushionStatus`
   * is `stable|tight|pressure`, so comparing the raw words reports a disagreement that is a vocabulary and
   * not a defect.
   */
  {
    const bands = (st: DebtStore) => {
      const a = selectAllocation(st)!;
      return {
        card: toCushionStatus(selectPaydayGuardian(st)!.state),
        summary: selectPlanSummary(st, a, selectRequiredRows(st, a)).cushionStatus,
        forecast: selectCashTimeline(st)[0]?.cushionStatus,
      };
    };
    const agree = (b: ReturnType<typeof bands>) => new Set([b.card, b.summary, b.forecast]).size === 1;

    // Auditor D's own fixture: premium, $2,000 in, $1,850 of rent, a $200 line, $1,000 in the EF.
    const before = store({ premium: true, amount: '2000', bills: [1850], floor: 200, goals: [{ type: 'emergency', current: 1000 }] });
    const b0 = bands(before);
    assert(agree(b0), `⭐ D2-1 control — the three producers agree BEFORE the move (${JSON.stringify(b0)})`);
    eq(b0.card, 'tight', '…and the cycle really is under the line, or the assertion below is vacuous');

    // The card's OWN offer, sized by the app, not by me.
    const offer = selectTightTopUp(before);
    assert(offer !== null, 'the card offers its one-tap move on this fixture');
    eq(offer?.topUp, 50, '…of exactly the gap — floor − cushion');

    const after = store({
      premium: true, amount: '2000', bills: [1850], floor: 200,
      goals: [{ type: 'emergency', current: 1000 }], topUp: offer!.topUp,
    });
    const b1 = bands(after);
    // ⛔ THE FINDING. Before this, `card` was `stable` while `summary` and `forecast` were `tight`.
    assert(agree(b1), `⛔ D2-1 — the three producers agree AFTER the card's own offer (${JSON.stringify(b1)})`);
    eq(b1.card, 'stable', '…and the move genuinely cleared the line, which is why the card said so');

    /**
     * ⛔ **CYCLE 0 ONLY — and nothing asserted it until a plant of the OVER-FIX stayed green.**
     *
     * The money is in checking *this* cycle; next cycle the §2.5 waterfall refills the goal it came from,
     * so a projected cycle that counts it forecasts a cushion nobody will ever have. ⚡ Applying the
     * surplus to every projected cycle passed every other assertion in this block — the three producers
     * still agreed, because they agreed about cycle 0 and nothing looked further out.
     *
     * ⚠️ Compared against the SAME store without the record, so this measures the top-up's reach rather
     * than any particular projected value.
     */
    const laterWith = selectCashTimeline(after).slice(1).map((c) => c.cushionStatus);
    const laterWithout = selectCashTimeline(before).slice(1).map((c) => c.cushionStatus);
    assert(laterWith.length > 0, 'the fixture projects past cycle 0, or the assertion below is vacuous');
    eq(
      JSON.stringify(laterWith),
      JSON.stringify(laterWithout),
      '⛔ D2-1 — the top-up reaches cycle 0 and NO projected cycle; the waterfall refills the goal',
    );
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
