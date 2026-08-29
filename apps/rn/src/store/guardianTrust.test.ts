import { createDefaultStore } from '@/data/defaults';
import type { DataRepair, DebtStore, PayCycleSnapshot } from '@/data/models';
import {
  selectAffordability,
  selectCalibrationScore,
  selectPaydayGuardian,
  selectReserveRelease,
  selectSavingsPoolUnread,
  selectTightTopUp,
} from '@/store/guardianSelectors';
import { BNPL_COUNT_FIELDS, bnplPaymentsTotal } from '@core/debt/bnplInstallment';
import { clearResuppliedRepairs, debtLiveness, mayClaim, rowFieldUnread } from '@/store/trustSelectors';

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
  /**
   * ⭐ **THE OVER-FIX CONTROL FOR `F-B4`, AND IT WAS MEASURED MISSING.** The laziest repair for that
   * finding is *"ask the claim owner"* — `!mayClaim(store, 'debt-balances')` — and the route it would
   * inherit **also carries `originalBalance`**. ⚡ Planted: the whole suite stayed **GREEN**, so nothing
   * refused the wider predicate. An unread ORIGINAL balance is the trophy shelf's question (`C-4`); it
   * says nothing about whether the CURRENT balances were readable, and suppressing the Guardian's framing
   * over it is a second false statement told by omission.
   */
  eq(
    debtLiveness(base({ debts: [visaLost], repairs: [lost('debt', 'd0', 'Visa', 'originalBalance')] })),
    'debt-free',
    '⭐ owner over-fix control — an unread originalBalance is not a liveness question and must not suppress',
  );

  /**
   * ⛔ **AFTER THE ACKNOWLEDGEMENT — 🎯 2026-08-28 [S1.11.4.8]: THE ACK SILENCES THE CARD AND DOES NOT
   * VERIFY THE DATA.**
   *
   * ⚡ A whole-row loss is `!answerableByEdit` — no screen to open, no number to re-type — and
   * `clearResuppliedRepairs` used to DROP it on the ack. Dropping the record ends the suppression with it,
   * so one *"Got it"* over a backup whose entire `debts` array was unreadable put the app straight back on
   * the debt-free framing. Measured first, then taken to Jason as a product call, and this is his answer:
   * the generic tap is not an answer to *"are you debt-free?"*.
   *
   * ⚠️ **So the question has to stay answerable**, and there are exactly two answers — both asserted here,
   * because a suppression with no exit is the trap `C1` was raised for wearing a new face.
   */
  const wholeListLoss = DEBT_LOSSES[2].repair;
  const beforeAck = base({ debts: [], repairs: [wholeListLoss] });
  const afterAck = { ...beforeAck, pendingDataRepairs: [{ ...wholeListLoss, acknowledged: true }] };
  const acked = clearResuppliedRepairs(beforeAck, afterAck);
  eq(acked.pendingDataRepairs.length, 1, '⛔ ack — the record SURVIVES the acknowledgement; the card hides, the data is still unread');
  eq(
    debtLiveness(acked),
    'debt-free-unverified',
    '⛔ ack — …so the debt-free framing does NOT return over a list nobody read',
  );

  // ⚠️ ANSWER 1 — the list comes back. The user entered their debts, so the app is reading their numbers
  // again and the question is genuinely settled.
  const refilled = clearResuppliedRepairs(beforeAck, { ...afterAck, debts: base({ debts: [visa] }).debts });
  eq(refilled.pendingDataRepairs.length, 0, '⭐ ack exit 1 — entering the debts answers it: the record clears');

  // ⚠️ ANSWER 2 — they say so. `resolveUnreadableRows('debt')` is the card's own "These are all my debts",
  // and removing the record is what makes the state exitable for a genuinely debt-free user.
  const resolved = {
    ...acked,
    pendingDataRepairs: acked.pendingDataRepairs.filter((r) => !(r.entity === 'debt' && r.field.startsWith('('))),
  };
  eq(debtLiveness(resolved), 'debt-free', '⭐ ack exit 2 — and the user confirming their portfolio settles it');

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
  /**
   * ⛔ **S1.11.4.4 [pass-4 `C4-5`] — THE ARITY IS THE FIXTURE NOW.** Every assertion below used to run on
   * the TWO-pot store alone, which is the one member of the class where a fallback pot exists — so
   * `pickTopUpGoal` returns something, the offer object exists, and the caption has an object to be a
   * field of. ⚡ **With ONE pot, and it the unread one, `selectTightTopUp` returns `null`** and a caption
   * living inside that object went dark with the offer: no top-up, no caption, no mention that a figure
   * could not be read. That is reading rule 2 exactly — *a test that picks the one member of a class that
   * works reports on the member, not the class* — and it is why the caption is now a store fact.
   */
  const pots = (goals: { id: string; name: string; current: number }[], repairs: DataRepair[]) =>
    base({ debts: [visa], bills: 1550, living: 200, goals, repairs });
  const goalRepair = lost('goal', 'g0', 'Vacation', 'currentAmount');
  const VACATION = { id: 'g0', name: 'Vacation', current: 800 };
  const VACATION_LOST = { id: 'g0', name: 'Vacation', current: 0 };
  const COFFEE = { id: 'g1', name: 'Coffee Fund', current: 25 };

  const tTruth = selectTightTopUp(pots([VACATION, COFFEE], []));
  const tDamaged = selectTightTopUp(pots([VACATION_LOST, COFFEE], [goalRepair]));

  eq(tTruth?.goalName, 'Vacation', 'G-5 control — the pot that can hold the line is the one offered');
  eq(tTruth?.holdsLine, true, 'G-5 control — …and it does hold it');
  eq(tDamaged?.goalName, 'Coffee Fund', 'G-5 — the blanked pot really does leave the running (the offer still stands)');
  eq(tDamaged?.holdsLine, false, 'G-5 — …and the app still states the honest outcome of the pot it can see');

  /**
   * ⛔ **THE CAPTION, WALKED OVER EVERY ARITY OF THE POT LIST.** One row per member, iterated rather than
   * repeated — a list someone has to remember to extend is the defect this is fixing.
   */
  const ARITIES: { label: string; goals: typeof VACATION[]; repairs: DataRepair[]; expect: boolean }[] = [
    { label: 'TWO pots, one unread', goals: [VACATION_LOST, COFFEE], repairs: [goalRepair], expect: true },
    { label: 'ONE pot, and it is the unread one', goals: [VACATION_LOST], repairs: [goalRepair], expect: true },
    { label: 'TWO pots, both readable', goals: [VACATION, COFFEE], repairs: [], expect: false },
    { label: 'ONE pot, readable', goals: [VACATION], repairs: [], expect: false },
  ];
  for (const { label, goals, repairs, expect } of ARITIES) {
    eq(
      selectSavingsPoolUnread(pots(goals, repairs)),
      expect,
      `⛔ C4-5 · ${label} — the caption is a fact about the STORE and does not depend on there being an offer`,
    );
  }
  // ⭐ THE MEMBER THAT SHIPPED, NAMED. With one unread pot there is no offer at all — which is correct,
  // there is nothing to move — and the caption is what must survive it.
  eq(selectTightTopUp(pots([VACATION_LOST], [goalRepair])), null, '⭐ C4-5 — one unread pot really does leave nothing to offer');
  // ⛔ …and the caption is silent on a cycle with no gap, or it becomes noise on every clear paycheck.
  eq(
    selectSavingsPoolUnread(base({ debts: [visa], bills: 100, living: 100, goals: [VACATION_LOST], repairs: [goalRepair] })),
    false,
    '⛔ C4-5 — no gap, no top-up question, no caption',
  );

  /**
   * ⛔ **THE SECOND SURFACE, AND IT IS THE SAME DEFECT RATHER THAN A SIBLING.** `selectAffordability`
   * builds `coverFromSavings` behind `if (gap > 0 && goal)`, so a `null` from `pickTopUpGoal` took out the
   * offer AND the caption together — `AffordabilityCard` read `coverFromSavings?.unreadSavings`, which
   * cannot be true when the object is `null`. Walked over the same arities, on the finding's own measured
   * fixture: a $650 purchase against a $200 floor, which lands squarely on `tight` with a real gap.
   * ⚠️ The finding's FIRST one-pot fixture returned `short` rather than `tight` and skipped the branch for
   * an unrelated reason — recorded here because a fixture that misses the branch reports the same green as
   * a fix.
   */
  const buyer = (goals: { id: string; name: string; current: number }[], repairs: DataRepair[]) =>
    base({ debts: [visa], bills: 1100, living: 0, goals, repairs });
  for (const { label, goals, repairs, expect } of ARITIES) {
    const afford = selectAffordability(buyer(goals, repairs), 650);
    eq(afford?.verdict, 'tight', `⭐ C4-5 · ${label} — the fixture really does land on TIGHT, or the branch is skipped for an unrelated reason`);
    eq(
      afford?.savingsPoolUnread,
      expect,
      `⛔ C4-5 · affordability · ${label} — the caption survives the offer being null`,
    );
  }
  eq(
    selectAffordability(buyer([VACATION_LOST], [goalRepair]), 650)?.coverFromSavings,
    null,
    '⭐ C4-5 · affordability — one unread pot really does leave nothing to cover from',
  );

  /**
   * ⛔ **S1.11.4.4 [pass-4 blocker `C4-1`] — THE PREDICATE BOTH BNPL READERS ASK, AND IT WAS ONE FIELD
   * SHORT.** `BnplCalendarSection`'s filter named `scheduledPaymentAmount` alone, so a plan whose
   * `originalBalance` was the recorded loss walked through it and the calendar printed *"payment 1 of 2"*
   * for what is truly payment 3 of 4. ⚡ The count is derived from `originalBalance` because
   * `repairMoneyFields` drops the unreadable value and `raiseOriginalBalance` stamps it from `balance` on
   * the next line — so `basis / scheduled` collapses to `remainingPayments`. ⚠️ The RENDER halves are
   * `tests/e2e/trust-claims.spec.ts`'s `C4-1` pair; this is the predicate they both stand on, and it is
   * the cheap thing to plant.
   */
  {
    const klarna = (originalBalance: number, repairs: DataRepair[]): DebtStore => ({
      ...base({ debts: [], goals: [], repairs }),
      debts: [
        {
          id: 'k1', name: 'Klarna', balance: 200, originalBalance, minimumPayment: 100, apr: 0,
          dueDate: TODAY, type: 'bnpl', recurrence: 'biweekly', bnplProvider: 'Klarna',
          scheduledPaymentAmount: 100, remainingPayments: 2,
        },
      ] as DebtStore['debts'],
    });
    const originalLost = lost('debt', 'k1', 'Klarna', 'originalBalance');
    const asked = (store: DebtStore) => rowFieldUnread(store, 'row-figures', 'debt', 'k1', ...BNPL_COUNT_FIELDS);
    eq(
      asked(klarna(200, [originalLost])),
      true,
      '⛔ C4-1 — the fields the installment COUNT is derived from include the one that was lost',
    );
    // ⭐ The control, or the predicate could simply be `true` and pass the assertion above.
    eq(asked(klarna(400, [])), false, '⭐ C4-1 control — a plan the app read in full is not filtered out');
    // ⛔ And the count really is wrong on that store, which is what makes the predicate worth asking.
    eq(bnplPaymentsTotal(klarna(200, [originalLost]).debts[0]), 2, '⭐ C4-1 — the stamped basis really does collapse the total to 2');
    eq(bnplPaymentsTotal(klarna(400, []).debts[0]), 4, '⭐ C4-1 control — …against a true 4 when the field was read');
  }

  console.log(`✅ Guardian trust (S1.10.6.9) tests passed (${passed} asserts).`);
}

run();
