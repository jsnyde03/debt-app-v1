import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { selectAllocation } from '@/store/selectors';

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

/** A window of exactly four weeks, so a weekly debt charges 4× and a biweekly one 2×. */
const CURRENT = '2026-09-04';
const NEXT = '2026-10-02';
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
        id: 'd1', name: 'Klarna', balance: 5000, minimumPayment: MINIMUM, apr: 0, dueDate: '2026-09-07',
        type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: MINIMUM, remainingPayments: 40, recurrence,
      }) as unknown as Debt,
  },
  {
    kind: 'fallback BNPL',
    of: (recurrence: string): Debt =>
      ({
        id: 'd1', name: 'Afterpay', balance: 5000, minimumPayment: MINIMUM, apr: 0, dueDate: '2026-09-07',
        type: 'bnpl', bnplProvider: 'Afterpay', recurrence,
      }) as unknown as Debt,
  },
  {
    kind: 'plain debt',
    of: (recurrence: string): Debt =>
      ({
        id: 'd1', name: 'Weekly loan', balance: 5000, minimumPayment: MINIMUM, apr: 10, dueDate: '2026-09-07',
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
   * ⛔ **THE DIRECTION A "reserve everything" FIX WOULD BREAK.** The monthly control must stay at ONE
   * charge: a fix that simply reserved more would satisfy every row above and fail here.
   */
  const monthly = selectAllocation(storeWith(SHAPES[2].of('monthly')))!;
  assert(monthly.totalRequired === MINIMUM, `⛔ control — a monthly debt is reserved ONCE ($${MINIMUM}), never scaled`);

  console.log(`\n✅ in-window minimum: ${passed} assertions across ${SHAPES.length} debt shapes × ${Object.keys(CHARGES).length} cadences\n`);
}

try {
  runInWindowMinimumTests();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
