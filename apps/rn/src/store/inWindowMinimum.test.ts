import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { selectAllocation } from '@/store/selectors';
import { allocatePaycheck } from '@core/engine/allocatePaycheck';
import { selectCashTimeline } from '@/store/payoffSelectors';

/**
 * ⛔ **THE IN-WINDOW MINIMUM HAS ONE OWNER, AND THIS ITERATES CADENCE × DEBT-TYPE TO PROVE IT.**
 * [S1.13.7.12.6 class 4 · `A2-1` / `A3-1` / `A3-4`, blockers]
 *
 * ⚡ **The defect this exists for.** `selectors.ts` handed the engine `scaleBnplMinimumsForWindow(...)`,
 * which rewrites `minimumPayment` to `n × installment` — and `bnplInstallmentAmount` **falls back to
 * `minimumPayment`**, so `effectiveMinimumInWindow` multiplied the already-scaled figure by `n` again:
 *
 *     stored $50  →  selectors $200 (correct)  →  allocator $800   (4× over-reserved)
 *
 * A $500 paycheck that covered everything printed a phantom shortfall; RESERVE and PAYDOWN fell 4× out
 * of lockstep; and the required-action caption would have read *"16 × $50"* where the truth is 4.
 *
 * ## ⛔ Why five existing instruments could not see it — measured, and it is FOUR reasons, not one
 *
 * | instrument | blind because |
 * |---|---|
 * | `testGuardianPartition` | zero minimum **and** a 14-day window holding ONE weekly installment |
 * | History's control | its fixture is due **five months** outside the window |
 * | the 28-pair cadence matrix | passes **`debts: []`** to every pair |
 * | *"a plain debt is never scaled"* | true only of a fixture with **no sub-cycle cadence** |
 * | `A3-4`'s own guard | calls `allocatePaycheck` **directly** — a path production does not take |
 *
 * ⭐ **And `bnplCadence.test.ts` does everything right and still could not see it.** It goes through
 * `selectAllocation`, asserts exact values, and its comment claims the exactness *"locks out BOTH a
 * removed scaling and a doubled one."* It passed before AND after a 4× change — because its fixture is
 * **installment-native**, and `bnplInstallmentAmount` prefers `scheduledPaymentAmount`, so the corrupted
 * `minimumPayment` was never read. Measured:
 *
 *     installment-native BNPL   200 → 200   not affected
 *     fallback BNPL (no sched)  200 → 800   DOUBLE-SCALED
 *     plain debt, weekly        200 → 800   DOUBLE-SCALED
 *
 * ⚠️ **So the axis that matters is whether the debt carries its own per-charge figure**, and a fixture
 * that carries one cannot detect this class. Every row below is therefore run in all three shapes.
 *
 * ## What this asserts
 *
 * ⛔ Through `selectAllocation` — **the production entry point** — because the divergence between the
 * engine and the seam is precisely what let this ship behind a green guard.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

/**
 * A window of exactly four weeks, so a weekly debt charges 4× and a biweekly one 2×.
 *
 * ⚠️ **Clock-relative, not literal dates** - `lint:fixture-dates` refused the first cut, correctly: a
 * hard-coded `2026-09-07` was two days from firing, and on that date the branch these fixtures exercise
 * would change **silently, with no code edit**. That is the `A1-4` dated-fuse class, and a fixture that
 * quietly stops testing what it claims is exactly what this whole class is about.
 *
 * The SHAPE is what matters here, never the calendar: four weeks holds four weekly charges whenever it
 * is run. The first charge sits three days in so the window opens before it, as a real cycle does.
 */
const day = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const CURRENT = day(0);
const NEXT = day(28);
const DUE = day(3);
const MINIMUM = 50;

/**
 * ⚠️ **Three shapes of the same $50-per-charge debt.** `installment-native` carries the per-charge figure
 * in `scheduledPaymentAmount`; the other two carry it in `minimumPayment`, which is the fallback rule
 * stated at `bnplInstallmentAmount` — and the reason only they were affected.
 */
const SHAPES = [
  {
    kind: 'installment-native BNPL',
    of: (recurrence: string): Debt =>
      ({
        id: 'd1', name: 'Klarna', balance: 5000, minimumPayment: MINIMUM, apr: 0, dueDate: DUE,
        type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: MINIMUM, remainingPayments: 40, recurrence,
      }) as unknown as Debt,
  },
  {
    kind: 'fallback BNPL',
    of: (recurrence: string): Debt =>
      ({
        id: 'd1', name: 'Afterpay', balance: 5000, minimumPayment: MINIMUM, apr: 0, dueDate: DUE,
        type: 'bnpl', bnplProvider: 'Afterpay', recurrence,
      }) as unknown as Debt,
  },
  {
    kind: 'plain debt',
    of: (recurrence: string): Debt =>
      ({
        id: 'd1', name: 'Weekly loan', balance: 5000, minimumPayment: MINIMUM, apr: 10, dueDate: DUE,
        type: 'debt', recurrence,
      }) as unknown as Debt,
  },
] as const;

/** Installments of the given cadence inside `CURRENT → NEXT`. A cadence is a fact about the SCHEDULE. */
const CHARGES: Record<string, number> = { weekly: 4, biweekly: 2, monthly: 1 };

function storeWith(debt: Debt): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    paycheck: { ...s.paycheck, amount: '3000', payCycle: 'monthly', currentDate: CURRENT, nextPaycheckDate: NEXT },
    debts: [debt],
    requiredExpenses: [],
    livingExpenses: [],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

export function runInWindowMinimumTests(): void {
  console.log('\n💵 the in-window minimum: one owner, across cadence × debt-type\n');

  for (const shape of SHAPES) {
    for (const [recurrence, charges] of Object.entries(CHARGES)) {
      const expected = MINIMUM * charges;
      const alloc = selectAllocation(storeWith(shape.of(recurrence)));
      assert(alloc !== null, `${shape.kind} · ${recurrence} — the allocation resolves`);
      assert(
        alloc!.totalRequired === expected,
        `${shape.kind} · ${recurrence} — reserves ${charges} × $${MINIMUM} = $${expected}, not a multiple of it (got $${alloc!.totalRequired})`,
      );
      /**
       * ⛔ **THE CONSEQUENCE THE USER MET.** The paycheck covers every one of these comfortably, so a
       * non-zero shortfall here is money the app says you are missing while you are holding it — printed
       * on the Guardian card, the Live Activity, the widget and the paywall lead.
       */
      assert(
        alloc!.shortfall === 0,
        `${shape.kind} · ${recurrence} — no phantom shortfall on a paycheck that covers it (got $${alloc!.shortfall})`,
      );
    }
  }

  /**
   * ⛔ **`A3-1` — A PAYCHECK THAT COVERS THE TRUE RESERVE AND NOT THE INFLATED ONE.**
   * [round-2 `R2-6`: the assertion registered for `A3-1` was GREEN under `A3-1`'s own defect]
   *
   * ⚡ `A3-1` is *"the same seam measured to the printed **shortfall** on four surfaces"* — the Guardian
   * card, the Live Activity, the widget and the paywall lead. The guard registered for it asserted *"no
   * phantom shortfall on a paycheck that covers it"* over a **$3,000** fixture, where the inflated $800
   * is covered just as comfortably as the true $200. **Measured with the defect planted: `totalRequired
   * $800`, `shortfall $0`.** The assertion could not print a shortfall, so it could not fail.
   *
   * ⛔ **A guard for a finding about a NUMBER must be able to see that number move.** $300 covers the
   * true $200 and not the 4× $800, so the defect surfaces as the **$500 phantom shortfall** the finding
   * describes — money the app says you are missing while you are holding it.
   */
  for (const shape of SHAPES) {
    const tight = selectAllocation({
      ...storeWith(shape.of('weekly')),
      paycheck: { ...storeWith(shape.of('weekly')).paycheck, amount: '300' },
    })!;
    assert(
      tight.totalRequired === MINIMUM * CHARGES.weekly,
      `⛔ A3-1 · ${shape.kind} — a tight paycheck reserves the same in-window $${MINIMUM * CHARGES.weekly} (got $${tight.totalRequired})`,
    );
    assert(
      tight.shortfall === 0,
      `⛔ A3-1 · ${shape.kind} — and declares NO shortfall on a $300 paycheck that covers it (got $${tight.shortfall})`,
    );
  }

  /**
   * ⛔ **`A3-2` — THE PRODUCTION PATH AND THE DIRECT-CALL PATH ARE THE SAME PATH.**
   * [round-2 `R2-6`: the assertion registered for `A3-2` checked only that the allocation was non-null]
   *
   * ⚡ `A3-2` is *"`A3-4`'s guard calls `allocatePaycheck` DIRECTLY, a path production never takes"* —
   * measured at the time as **guard $200, production $800 on the same fixture**. It was closed by making
   * production hand the engine RAW debts, so the two paths converge. ⚠️ **That convergence is the claim,
   * and it needs asserting**: re-introduce any pre-scaling at the seam and these two diverge again, which
   * is precisely how a green guard came to describe a path nobody ran.
   */
  for (const shape of SHAPES) {
    const store = storeWith(shape.of('weekly'));
    const viaProduction = selectAllocation(store)!;
    const viaDirectCall = allocatePaycheck({
      paycheckAmount: Number(store.paycheck.amount),
      currentDate: CURRENT,
      nextPaycheckDate: NEXT,
      expenses: [],
      debts: store.debts,
      goals: [],
      strategy: store.payoffStrategy,
      paycheckBuffer: 0,
    } as never);
    assert(
      viaProduction.totalRequired === viaDirectCall.totalRequired,
      `⛔ A3-2 · ${shape.kind} — the production path and a direct allocator call on the SAME debts agree ($${viaProduction.totalRequired} vs $${viaDirectCall.totalRequired})`,
    );
  }

  /**
   * ⛔ **THE DIRECTION A "reserve everything" FIX WOULD BREAK.** The monthly control must stay at ONE
   * charge: a fix that simply reserved more would satisfy every row above and fail here.
   */
  const monthly = selectAllocation(storeWith(SHAPES[2].of('monthly')))!;
  assert(monthly.totalRequired === MINIMUM, `⛔ control — a monthly debt is reserved ONCE ($${MINIMUM}), never scaled`);

  /**
   * ⛔ **AND EVERY PROJECTED CYCLE, because the seam had a THIRD site the finding never named.**
   * [`A3-4`, blocker]
   *
   * ⚡ After the `selectors.ts` seam was fixed, cycle 0 was correct and **cycle 1 onward was still 4×**:
   * `buildMultiCycleTimeline` scaled its own `projDebts` and handed the same list to *both* the allocator
   * and `buildTimelineItems`. Measured, a $50 weekly debt:
   *
   *     fallback BNPL   c0 $200 ✓   c1 $800 ✗
   *
   * ⛔ `essentials` feeds `net` and `carriedBalance` — the cash-runway receipt and the crunch detector —
   * so every projected cycle predicted a crunch out of money the user is holding.
   *
   * ⚠️ The ITEMS still take the scaled list and that is right: `buildTimelineItems` reads
   * `debt.minimumPayment` directly and has no window. Two consumers, two needs.
   */
  /**
   * ⛔ **THE PROJECTION RUNS ON A FIXED-LENGTH PAY CADENCE, AND THE REASON IS A DEFECT THIS FILE
   * SHIPPED.** [class 4 re-audit `F2`, blocker]
   *
   * ⚡ The rows above pass `currentDate`/`nextPaycheckDate` explicitly, so **cycle 0's window is 28 days
   * whenever it runs** — measured date-stable across 365 consecutive start dates. ⛔ **Cycle 1's window
   * is not passed in; the projection DERIVES it**, and under the `monthly` pay cycle this file first used
   * it ran from `today + 28` to **the 1st of the following month** — anywhere from **1 to 31 days**. A
   * weekly debt therefore charged **0–5 times**, and `essentials` was measured at $0, $50, $100, $150,
   * $200 and $250 depending on nothing but the calendar.
   *
   * ⚠️ **It redded `test:app` on 288 of 365 days, and the class was closed on one of the 77 that pass** —
   * five days before the next red. ⭐ **The first cut of this file was refused by `lint:fixture-dates`
   * for a hard-coded date; the clock-relative rewrite that replaced it then hid a WORSE fuse, because
   * `day(28)` pins the window you hand over and says nothing about the one that is computed for you.**
   *
   * ⛔ **So the projection is driven by a cadence whose period is a constant number of days.** `biweekly`
   * steps 14 days from any date, so **every** projected window is 14 days and a weekly debt charges
   * exactly twice — by construction, not by where the month happens to end.
   */
  const PROJ_NEXT = day(14);
  const PROJ_CHARGES = 2;
  const projStoreWith = (debt: Debt): DebtStore => {
    const s = storeWith(debt);
    return { ...s, paycheck: { ...s.paycheck, payCycle: 'biweekly', nextPaycheckDate: PROJ_NEXT } };
  };

  for (const shape of SHAPES) {
    const timeline = selectCashTimeline(projStoreWith(shape.of('weekly')), 2);
    assert(timeline.length >= 2, `${shape.kind} — the projection builds at least two cycles`);
    for (const cycle of [0, 1]) {
      assert(
        timeline[cycle].essentials === MINIMUM * PROJ_CHARGES,
        `${shape.kind} · projected cycle ${cycle} — essentials are the in-window $${MINIMUM * PROJ_CHARGES}, not a multiple (got $${timeline[cycle].essentials})`,
      );
    }
  }

  /**
   * ⭐ **THE CONTROL, and without it a projection returning a CONSTANT passes every row above.** A
   * biweekly debt charges **once** in the same 14-day windows the weekly one charges twice in. If the
   * projection stopped distinguishing cadence — the exact failure `A3-4` was — these two would agree.
   */
  for (const cycle of [0, 1]) {
    const bi = selectCashTimeline(projStoreWith(SHAPES[2].of('biweekly')), 2);
    assert(
      bi[cycle].essentials === MINIMUM,
      `⭐ control · projected cycle ${cycle} — a BIWEEKLY debt charges ONCE ($${MINIMUM}) where the weekly one charges twice (got $${bi[cycle].essentials})`,
    );
  }

  console.log(`\n✅ in-window minimum: ${passed} assertions across ${SHAPES.length} debt shapes × ${Object.keys(CHARGES).length} cadences\n`);
}

try {
  runInWindowMinimumTests();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
