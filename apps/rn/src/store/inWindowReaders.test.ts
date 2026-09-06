import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { effectiveMinimumInWindow } from '@core/debt/bnplInstallment';
import { selectBnplBetweenPaycheck } from '@/store/guardianSelectors';
import { selectRequiredRows } from '@/store/planSelectors';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { selectAllocation } from '@/store/selectors';

/**
 * ⛔ **EVERY SURFACE THAT PRINTS AN IN-WINDOW OBLIGATION READS THE ONE PRODUCER.**
 * [S1.13.7.12.6 `.4.11` `F3` `F6` `F7` · `.4.12` `R2-1` `R2-2`]
 *
 * ⚡ **Why this file exists at all.** Round 1 fixed three separate surfaces that were each re-deriving or
 * ignoring the in-window minimum, and registered **no guard for any of them**. The round-2 audit then
 * reverted all three at once and reported `test:app`, `test:regression`, `test:scenarios` and `typecheck`
 * **all green** — three user-facing money fixes with nothing standing behind them.
 *
 * ⚠️ **The producer is `effectiveMinimumInWindow`, capped at the balance.** Every assertion below is
 * written against *that*, never against a literal, so a change to the rule moves the whole file together
 * instead of leaving nine hard-coded numbers to drift.
 *
 * ## The window
 *
 * ⛔ **A WINDOW IS A PAIR, AND PINNING ONE END IS NOT PINNING THE WINDOW** — the lesson `.4.11` paid for
 * four times. Both ends are handed over explicitly here, and the projection is not exercised, so nothing
 * in this file depends on where in the month it runs.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

const day = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const CURRENT = day(0);
const NEXT = day(28);
const DUE = day(3);
const EACH = 50;

/**
 * ⛔ **THE LITERAL ANCHORS — [class 4 round-3 `R3-1`].**
 *
 * ⚡ Every assertion in this file was written against `effectiveMinimumInWindow` and **never against a
 * literal**. That is the right rule for a **wiring** claim (*this reader calls that producer*) and the
 * wrong one for a **money** claim (*the sentence states what the app holds back*) — it makes the row an
 * equation with the same expression on both sides. Measured: with a 2× defect planted in the producer,
 * **all 15 rows stayed green** and the suite printed *"the heads-up names 8 payments"* as a pass.
 *
 * ⛔ **`R2-1`'s own fix is what removed the last independent term.** Before it the reader counted with
 * `bnplInstallmentsInWindow` while this file expected `effectiveMinimumInWindow / each` — two producers,
 * a real cross-check. Collapsing them into one is right for the product and left nothing here to disagree.
 *
 * ⚠️ **These are clock-safe, and the reason is arithmetic rather than luck:** both ends of the window are
 * the same offset from one `new Date()`, so it is always `[D, D+28]` with the charge due at `D+3` —
 * charges at +3/+10/+17/+24 and the next at +31. Four on every day of the year, no month-length or DST
 * dependence, because every offset is in whole days. ⛔ **The file header's claim was true and the
 * conclusion drawn from it was not:** "nothing depends on when it runs" does not mean "no literal is
 * needed", and that elision is what left the producer unguarded.
 */
const CHARGES_IN_WINDOW = 4;
const OWED_WEEKLY = CHARGES_IN_WINDOW * EACH;
const SCHED_MONTHLY = 80;

const weeklyDebt = (over: Partial<Debt> = {}): Debt =>
  ({
    id: 'd1', name: 'Weekly loan', balance: 5000, minimumPayment: EACH, apr: 10,
    dueDate: DUE, type: 'debt', recurrence: 'weekly', ...over,
  }) as unknown as Debt;

function storeWith(debt: Debt, paycheck = '3000'): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    paycheck: { ...s.paycheck, amount: paycheck, payCycle: 'monthly', currentDate: CURRENT, nextPaycheckDate: NEXT },
    debts: [debt],
    requiredExpenses: [],
    livingExpenses: [],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

/** What the app owes on this debt in this window — the one producer, capped as it caps. */
const owed = (debt: Debt): number => Math.min(effectiveMinimumInWindow(debt, CURRENT, NEXT), debt.balance);

export function runInWindowReaderTests(): void {
  console.log('\n💵 the in-window minimum: every reader agrees with the one producer\n');

  /**
   * ⛔ **THE ANCHOR RUNS FIRST**, so a defect in the producer reds here instead of being echoed,
   * agreed with, and printed as a pass by every row below it. [`R3-1`]
   */
  {
    const got = owed(weeklyDebt());
    assert(
      got === OWED_WEEKLY,
      `⛔ R3-1 anchor — the producer owes $${OWED_WEEKLY}: ${CHARGES_IN_WINDOW} × $${EACH} in this window (got $${got})`,
    );
    const sched = owed(
      weeklyDebt({
        name: 'Klarna', type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'monthly',
        apr: 0, scheduledPaymentAmount: SCHED_MONTHLY, remainingPayments: 40,
      } as Partial<Debt>),
    );
    assert(
      sched === SCHED_MONTHLY,
      `⛔ R3-1 anchor — an installment-native MONTHLY plan owes its own $${SCHED_MONTHLY}, not the stored minimum (got $${sched})`,
    );
  }

  /**
   * ⛔ **`F3` — THE FIGURE MUST NOT MOVE ON THE TAP.**
   *
   * ⚡ `planSelectors` re-adds a debt the allocator drops once its minimum is ticked, so the user sees it
   * struck through rather than vanished — and it built that row from the **raw** `minimumPayment`.
   * Measured before the fix: **$200 before the tap, $50 after.** Same debt, same window, same screen, the
   * number falling 4× at the moment the app confirms you paid.
   */
  {
    const expected = owed(weeklyDebt());
    for (const ticked of [false, true]) {
      const debt = weeklyDebt({ isPaidThisCycle: ticked, minimumPaidThisCycle: ticked } as Partial<Debt>);
      const store = storeWith(debt);
      const rows = selectRequiredRows(store, selectAllocation(store) as never);
      const mine = rows.filter((r) => r.item.debtId === 'd1');
      assert(mine.length === 1, `⛔ F3 · ticked=${ticked} — the debt has exactly one required row`);
      assert(
        mine[0].item.amount === expected,
        `⛔ F3 · ticked=${ticked} — the row is the in-window $${expected}, not one installment (got $${mine[0].item.amount})`,
      );
    }
  }

  /**
   * ⛔ **`F6` — THE RECOVERY PLAN READS THE PRODUCER, NOT THE BOUNDARY TRANSFORM.**
   *
   * ⚡ It called `scaleBnplMinimumForWindow`, which short-circuits `if (n <= 1) return debt` and so yields
   * the **stored** minimum at one charge, where the producer returns the debt's own per-charge figure.
   * Measured: an installment-native MONTHLY plan with `scheduledPaymentAmount 80` against
   * `minimumPayment 50` — **owner $80, recovery $50**.
   *
   * ⚠️ **A shortfall is required for a plan to exist at all**, so the paycheck here is deliberately far
   * below the obligation.
   */
  {
    const cases: [string, Debt][] = [
      ['plain weekly (n=4)', weeklyDebt()],
      [
        'installment-native MONTHLY, sched 80 ≠ min 50',
        weeklyDebt({
          name: 'Klarna', type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'monthly',
          apr: 0, scheduledPaymentAmount: 80, remainingPayments: 40,
        } as Partial<Debt>),
      ],
    ];
    for (const [label, debt] of cases) {
      const plan = selectRecoveryPlan(storeWith(debt, '30'));
      const row = plan?.coverNow.find((e) => e.id === 'd1');
      assert(row != null, `⛔ F6 · ${label} — the recovery plan carries the debt`);
      assert(
        row!.amount === owed(debt),
        `⛔ F6 · ${label} — recovery covers the in-window $${owed(debt)}, the same figure the owner states (got $${row!.amount})`,
      );
    }
  }

  /**
   * ⛔ **`F7` — THE LINE THAT EXPLAINS THE RESERVE REACHES EVERY SHAPE THE RESERVE DOES.**
   *
   * ⚡ It gated on `isInstallmentNative` while the reserve had been widened to any known cadence, so a
   * fallback BNPL and a plain weekly debt got the multiplied reserve with the Guardian **silent about why**.
   */
  {
    const shapes: [string, Debt][] = [
      ['installment-native BNPL', weeklyDebt({ name: 'Klarna', type: 'bnpl', bnplProvider: 'Klarna', apr: 0, scheduledPaymentAmount: EACH, remainingPayments: 40 } as Partial<Debt>)],
      ['fallback BNPL', weeklyDebt({ name: 'Afterpay', type: 'bnpl', bnplProvider: 'Afterpay', apr: 0 } as Partial<Debt>)],
      ['plain debt', weeklyDebt()],
    ];
    for (const [label, debt] of shapes) {
      const line = selectBnplBetweenPaycheck(storeWith(debt));
      // ⛔ [R3-1] The LITERAL, not `owed(debt) / EACH`. Derived, this row agreed with the producer by
      // construction and read "names 8 payments" as a pass under a 2× defect in it.
      assert(
        line != null && line.includes(`${CHARGES_IN_WINDOW} `),
        `⛔ F7 · ${label} — the heads-up names ${CHARGES_IN_WINDOW} payments (got ${line ?? 'null'})`,
      );
      // …and the wiring claim the derived form was actually making, kept and stated as its own row.
      assert(
        owed(debt) / EACH === CHARGES_IN_WINDOW,
        `⛔ F7 · ${label} — and the reserve the line explains is the producer's ${CHARGES_IN_WINDOW} charges (got ${owed(debt) / EACH})`,
      );
    }
  }

  /**
   * ⛔ **`R2-1` — AND IT MUST NOT ANNOUNCE PAYMENTS THE BALANCE CANNOT FUND.** *(a blocker `F7` itself
   * introduced)*
   *
   * ⚡ The gate `F7` replaced was `isInstallmentNative`, which requires `remainingPayments > 0` — **the
   * same field that caps the installment count.** The gate was doing two jobs and the widening kept one:
   * the shapes it admitted carry no `remainingPayments`, so the cap became `Infinity`.
   *
   * ⚠️ **Measured on a $1 balance:** *"Heads up — 4 Car Loan payments (about $50 each)"* — **$200
   * announced against $1 the app reserves.** This is the direction a "reach every shape" fix breaks, and
   * without it `F7`'s rows above pass over a line that shouts at a nearly-paid debt.
   */
  {
    for (const balance of [1, 20, 49]) {
      const debt = weeklyDebt({ name: 'Car Loan', balance });
      assert(
        selectBnplBetweenPaycheck(storeWith(debt)) === null,
        `⛔ R2-1 · $${balance} balance — a debt that cannot fund two charges says NOTHING (got ${selectBnplBetweenPaycheck(storeWith(debt))})`,
      );
    }
    /**
     * ⭐ **THE CONTROL, and without it "return null always" passes every `R2-1` row.** A balance that funds
     * exactly two charges must still speak.
     */
    const twoCharges = weeklyDebt({ name: 'Car Loan', balance: 2 * EACH });
    const line = selectBnplBetweenPaycheck(storeWith(twoCharges));
    assert(
      line != null && line.includes('2 '),
      `⛔ R2-1 control — a balance funding exactly two charges still announces them (got ${line ?? 'null'})`,
    );
  }

  console.log(`\n✅ in-window readers: ${passed} assertions across the plan row, the recovery plan and the Guardian line\n`);
}

try {
  runInWindowReaderTests();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
