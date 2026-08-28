import { createDefaultStore } from '@/data/defaults';
import type { DataRepair, DebtStore, PayCycleSnapshot } from '@/data/models';
import {
  selectAffordability,
  selectCalibrationScore,
  selectPaydayGuardian,
  selectReserveRelease,
  selectTightTopUp,
} from '@/store/guardianSelectors';
import { debtLiveness, mayClaim } from '@/store/trustSelectors';

/**
 * ⛔ **S1.10.6.9 [`G-1`…`G-5`] — THE GUARDIAN NEVER GOT PASS-1 BLOCKER `B1`'s REMEDY.**
 *
 * `selectPlanState` was given `'debt-free-unverified'` so a screen *cannot* forget to ask whether the
 * balances behind a claim were readable. `guardianSelectors` spelled the same conjunct out three more
 * times and asked nothing, and a fourth defect turned out to be a hole in the claim TABLE rather than at
 * any call site. All five were measured before they were fixed.
 *
 * ⚠️ **EVERY CASE IS A PAIR, AND THE PAIR IS THE TEST.** A repair only matters where the app can tell two
 * zeroes apart and does not — so each assertion runs the DAMAGED store (a balance lost, repaired to `0`,
 * with the `DataRepair` record present) against a TRUTH control (the real number, no repair). ⛔ A
 * one-sided assertion here would pass on a selector that had simply stopped saying anything at all.
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

const TODAY = createDefaultStore().paycheck.currentDate;

const lost = (entity: DataRepair['entity'], id: string, name: string, field: string): DataRepair => ({
  entity,
  id,
  name,
  field,
  kind: 'lost',
});

/** A confirmed, gradeable cycle in one debt regime. `pred` vs `actual` decides match / false-clear. */
function snap(pred: number, actual: number, floor: number, debtFree: boolean): PayCycleSnapshot {
  return {
    cycleEndDate: '2026-08-01',
    totalDebtBalance: 5000,
    totalPaidThisCycle: 100,
    completedRecommendedActions: [],
    payoffStrategy: 'snowball',
    prediction: {
      forCycleEndDate: '2026-08-01',
      predictedCushion: pred,
      predictedState: 'clear',
      predictedShortfall: 0,
      predictedConfidenceContext: { discoveryHoldbackActive: false, coldStartHoldbackActive: false, provisional: false },
      plannedIncome: 2000,
      floor,
      debtFree,
    },
    outcome: { actualIncome: 2000, actualCushionHeld: actual, outcomeConfirmed: true },
  };
}

function base(o: {
  debts: { id: string; name: string; balance: number; min: number }[];
  goals?: { id: string; name: string; current: number }[];
  bills?: number;
  living?: number;
  repairs?: DataRepair[];
  history?: PayCycleSnapshot[];
  reserveRelease?: boolean;
}): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '2000', incomeVaries: true },
    prefs: { ...s.prefs, onboardingComplete: true },
    pendingDataRepairs: o.repairs ?? [],
    cycleHistory: o.history ?? [],
    ...(o.reserveRelease ? { pendingReserveRelease: { tapped: false, covered: 250 } } : {}),
    debts: o.debts.map((d) => ({
      id: d.id, name: d.name, balance: d.balance, minimumPayment: d.min, apr: 22,
      dueDate: TODAY, type: 'debt' as const, recurrence: 'monthly' as const, balanceAsOfDate: TODAY,
    })),
    requiredExpenses: o.bills ? [{ id: 'e0', name: 'Rent', amount: o.bills, dueDate: TODAY, recurrence: 'monthly' }] : [],
    livingExpenses: o.living ? [{ id: 'l0', name: 'Everyday', amount: o.living, enabled: true }] : [],
    goals: (o.goals ?? []).map((g) => ({
      id: g.id, name: g.name, type: 'savings' as const, currentAmount: g.current, targetAmount: 3000,
    })),
  } as DebtStore;
}

function run() {
  console.log('Running Guardian trust (S1.10.6.9 · G-1…G-5) tests...');

  // ── the owner ─────────────────────────────────────────────────────────────────────────────────
  const visa = { id: 'd0', name: 'Visa', balance: 4200, min: 150 };
  const visaLost = { ...visa, balance: 0 };
  const balanceRepair = lost('debt', 'd0', 'Visa', 'balance');

  /**
   * ⛔ **S1.11.4.1 [pass-4 `F-B4`] — THE CLASS HAS THREE MEMBERS AND THIS SUITE TESTED ONE.**
   *
   * ⚡ Every fixture below used to be built from `balanceRepair`, so `G-1`…`G-3` were asserted against the
   * QUIETEST member of the class while the two loudest — a row the reader could not parse, and a whole
   * `debts` list it could not read at all — went straight through `hasUnreadDebtBalances` and printed the
   * three sentences those findings closed. ⚠️ **The rows are iterated rather than repeated**: a list is
   * what someone has to remember to extend, and nobody does — which is the defect this is fixing.
   *
   * The two synthetic fields are the ones `migrations.ts` actually emits (`:129`, `:155`), quoted rather
   * than re-spelled, so a change to either producer's wording reds here instead of drifting.
   */
  const DEBT_LOSSES: { label: string; repair: DataRepair }[] = [
    { label: 'a lost balance FIELD', repair: balanceRepair },
    { label: 'a whole ROW unreadable', repair: { entity: 'debt', id: '', name: '', field: '(a row could not be read)', kind: 'lost' } },
    { label: 'the whole LIST unreadable', repair: { entity: 'debt', id: '', name: '', field: '(whole list unreadable)', kind: 'lost' } },
  ];

  eq(debtLiveness(base({ debts: [visa] })), 'has-debt', 'owner — a live balance is has-debt');
  eq(debtLiveness(base({ debts: [visaLost] })), 'debt-free', 'owner — a real zero, no repair, is debt-free');
  for (const { label, repair } of DEBT_LOSSES) {
    eq(
      debtLiveness(base({ debts: [visaLost], repairs: [repair] })),
      'debt-free-unverified',
      `⛔ owner · ${label} — the SAME zero with a repair record is unverified, and that distinction is the whole module`,
    );
  }
  // ⛔ [F-B4] A whole-list loss usually arrives with the list EMPTY — `migrations.ts:129` records it when
  // the stored value is not an array at all — so the zero-row shape is asserted as well as the one that
  // keeps a row. Both must be unverified; only one of them was reachable by the old fixture.
  eq(
    debtLiveness(base({ debts: [], repairs: [DEBT_LOSSES[2].repair] })),
    'debt-free-unverified',
    '⛔ owner · an EMPTY debts list with a whole-list loss — no rows to read, and nothing to celebrate',
  );
  eq(
    debtLiveness(base({ debts: [visaLost], repairs: [{ ...balanceRepair, kind: 'recovered' }] })),
    'debt-free',
    '⚠️ owner — a RECOVERED balance is exactly right and must not suppress anything (the load-bearing exclusion)',
  );

  // ── G-1 · the calibration scorecard ───────────────────────────────────────────────────────────
  /**
   * ⛔ The loudest of the five. The debt regime holds four FALSE-CLEARS (predicted a hold, the cushion
   * dipped); the debt-free regime holds four clean matches. Reading the regime off `balance > 0` re-graded
   * the user into the regime they are not in, so "0 of 4 · Under-warned 4" printed as "4 of 4 ·
   * Under-warned 0" and the recalibration apology went with it.
   */
  const mixedHistory = [
    snap(300, 300, 200, true), snap(310, 310, 200, true), snap(320, 320, 200, true), snap(330, 330, 200, true),
    snap(300, 50, 200, false), snap(310, 40, 200, false), snap(320, 30, 200, false), snap(330, 20, 200, false),
  ];
  const calTruth = selectCalibrationScore(base({ debts: [visa], history: mixedHistory }));
  eq(calTruth.matches, 0, 'G-1 control — with the balance readable, the DEBT regime is graded: 0 of 4 matched');
  eq(calTruth.falseClears, 4, 'G-1 control — …and all four are under-warns, the direction the copy never softens');

  for (const { label, repair } of DEBT_LOSSES) {
    const calDamaged = selectCalibrationScore(base({ debts: [visaLost], repairs: [repair], history: mixedHistory }));
    eq(calDamaged.n, 0, `⛔ G-1 · ${label} — an unread balance grades NOTHING rather than the wrong regime`);
    eq(calDamaged.proven, false, `⛔ G-1 · ${label} — …so the scorecard falls back to the day-one state`);
    eq(calDamaged.matchRate, null, `⛔ G-1 · ${label} — …and there is no percentage to print`);
    assert(
      !(calDamaged.matches === 4 && calDamaged.falseClears === 0),
      `⛔ G-1 · ${label} — the exact inversion that shipped ("4 of 4 · Under-warned 0") cannot recur`,
    );
  }

  const calFree = selectCalibrationScore(base({ debts: [visaLost], history: mixedHistory }));
  eq(calFree.matches, 4, '⭐ G-1 control — a GENUINELY debt-free user still gets their debt-free record graded');

  /**
   * ⛔ **THE OVER-FIX CONTROL, AND THE PLANT THAT DEMANDED IT.** *"Suppress the score whenever the store
   * carries ANY repair"* is the lazy repair here, and it shipped past the first cut of this suite: the
   * `recovered` case above asks `debtLiveness`, not the scorecard, so nothing asserted that a repair
   * unrelated to liveness leaves the record alone. ⚠️ An unread APR says nothing about which regime the
   * user is in, and a `recovered` balance is exactly right — either one silencing the record would be a
   * second false statement, told by omission.
   */
  const calAprRepair = selectCalibrationScore(
    base({ debts: [visa], repairs: [lost('debt', 'd0', 'Visa', 'apr')], history: mixedHistory }),
  );
  eq(calAprRepair.falseClears, 4, '⭐ G-1 over-fix control — an unread APR is not a liveness question; the record still grades');
  const calRecovered = selectCalibrationScore(
    base({ debts: [visa], repairs: [{ ...balanceRepair, kind: 'recovered' }], history: mixedHistory }),
  );
  eq(calRecovered.falseClears, 4, '⭐ G-1 over-fix control — a RECOVERED balance was read correctly; suppressing over it says something false too');

  // ── G-2 · the reserve release destination ─────────────────────────────────────────────────────
  eq(
    selectReserveRelease(base({ debts: [visa], reserveRelease: true }))?.targetName,
    'your Visa',
    'G-2 control — a readable balance names the debt',
  );
  eq(
    selectReserveRelease(base({ debts: [visaLost], reserveRelease: true }))?.targetName,
    'your savings',
    'G-2 control — a genuine payoff really does send it to savings',
  );
  for (const { label, repair } of DEBT_LOSSES) {
    eq(
      selectReserveRelease(base({ debts: [visaLost], repairs: [repair], reserveRelease: true }))?.targetName,
      'your debt',
      `⛔ G-2 · ${label} — an unread balance takes the existing "your debt" fallback, never "your savings"`,
    );
  }

  // ── G-3 · the Guardian headline's regime (pass-1 blocker B1, in the sibling selector) ──────────
  const gTruth = selectPaydayGuardian(base({ debts: [visa], bills: 1500 }));
  const gFree = selectPaydayGuardian(base({ debts: [visaLost], bills: 1500 }));

  eq(gTruth?.debtFree, false, 'G-3 control — a live balance keeps the Guardian on the debt framing');
  eq(gFree?.debtFree, true, 'G-3 control — a genuine payoff graduates it, which is 2.4.8 and must keep working');
  for (const { label, repair } of DEBT_LOSSES) {
    const gDamaged = selectPaydayGuardian(base({ debts: [visaLost], repairs: [repair], bills: 1500 }));
    eq(
      gDamaged?.debtFree,
      false,
      `⛔ G-3 · ${label} — an unread balance does NOT graduate the headline; a debt row exists and only its number is unknown`,
    );
  }

  // ── G-4 · the routing gap: an unread BALANCE removes an obligation, exactly as an unread minimum does ──
  /**
   * ⚠️ **`debtLiveness` cannot catch this one** — a live Visa sits beside the lost Store Card, so both
   * worlds are `has-debt`. The engine skips a debt with no balance left to pay, so the Store Card's $300
   * minimum simply stopped being owed and the spare read $550 against a true $250.
   */
  const twoDebts = (storeCard: number, repairs: DataRepair[]) =>
    base({
      debts: [visa, { id: 'd1', name: 'Store Card', balance: storeCard, min: 300 }],
      bills: 1100,
      living: 200,
      repairs,
    });
  const cardRepair = lost('debt', 'd1', 'Store Card', 'balance');
  const g4Truth = twoDebts(1800, []);
  const g4Damaged = twoDebts(0, [cardRepair]);

  eq(debtLiveness(g4Damaged), 'has-debt', '⚠️ G-4 — both worlds are has-debt, so the store-level question cannot see this');
  eq(mayClaim(g4Truth, 'required-plan'), true, 'G-4 control — with every balance readable the plan claim is allowed');
  eq(
    mayClaim(g4Damaged, 'required-plan'),
    false,
    '⛔ G-4 — an unread BALANCE poisons the plan claim, because it drops the minimum out of the plan',
  );
  assert(
    (selectAffordability(g4Damaged, 250)?.discretionaryNow ?? 0) >
      (selectAffordability(g4Truth, 250)?.discretionaryNow ?? 0),
    '⚠️ G-4 — the selector figure is STILL inflated, which is why the card gates on the claim rather than the number',
  );
  eq(
    mayClaim(twoDebts(0, [lost('debt', 'd1', 'Store Card', 'apr')]), 'required-plan'),
    true,
    '⭐ G-4 control — an unread APR touches no obligation, so the plan claim survives (C-4’s own boundary)',
  );

  // ── G-5 · the savings-pot pool ────────────────────────────────────────────────────────────────
  /**
   * A $800 Vacation beside a $25 Coffee Fund and a $100 gap. Blanking the Vacation hands the offer to the
   * Coffee Fund and turns "holds your line" into "it won't close the gap" — a false NEGATIVE about the
   * user's own money. ⛔ Captioned, not suppressed: the offer is still the best one the app can see.
   */
  const pots = (vacation: number, repairs: DataRepair[]) =>
    base({
      debts: [visa],
      bills: 1550,
      living: 200,
      goals: [{ id: 'g0', name: 'Vacation', current: vacation }, { id: 'g1', name: 'Coffee Fund', current: 25 }],
      repairs,
    });
  const goalRepair = lost('goal', 'g0', 'Vacation', 'currentAmount');
  const tTruth = selectTightTopUp(pots(800, []));
  const tDamaged = selectTightTopUp(pots(0, [goalRepair]));

  eq(tTruth?.goalName, 'Vacation', 'G-5 control — the pot that can hold the line is the one offered');
  eq(tTruth?.holdsLine, true, 'G-5 control — …and it does hold it');
  eq(tTruth?.unreadSavings, false, 'G-5 control — nothing unread, so no caption');
  eq(tDamaged?.goalName, 'Coffee Fund', 'G-5 — the blanked pot really does leave the running (the offer still stands)');
  eq(tDamaged?.holdsLine, false, 'G-5 — …and the app still states the honest outcome of the pot it can see');
  eq(
    tDamaged?.unreadSavings,
    true,
    '⛔ G-5 — …but it now SAYS a savings amount could not be read, so the negative is not stated as final',
  );

  console.log(`✅ Guardian trust (S1.10.6.9) tests passed (${passed} asserts).`);
}

run();
