import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { requireFinite } from './assertNumeric';
import { buildMultiCycleTimeline } from "@core/timeline/buildMultiCycleTimeline";
import { buildTimelineItems } from "@core/timeline/buildTimelineItems";
import type { Debt, Goal, RequiredExpense } from "@core/storage/debtPlannerStorage";
import type { LivingExpense } from "@core/types/livingExpense";

// ─── helpers ────────────────────────────────────────────────────────────────

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${label}]: expected ${String(expected)}, got ${String(actual)}`);
    }
}

function assertMoney(actual: number, expected: number, label: string) {
    const a = Math.round(actual * 100) / 100;
    const e = Math.round(expected * 100) / 100;
    if (a !== e) throw new Error(`FAIL [${label}]: expected $${e}, got $${a}`);
}

function assertExists<T>(value: T | null | undefined, label: string): T {
    if (value == null) throw new Error(`FAIL [${label}]: expected a value, got ${value}`);
    return value;
}

function assertNotExists<T>(value: T | null | undefined, label: string) {
    if (value != null) throw new Error(`FAIL [${label}]: expected nothing, got ${String(value)}`);
}

function assertAtLeast(actual: number, min: number, label: string) {
    if (actual < min) throw new Error(`FAIL [${label}]: expected >= ${min}, got ${actual}`);
}

function assertAtMost(actual: number, max: number, label: string) {
    if (actual > max) throw new Error(`FAIL [${label}]: expected <= ${max}, got ${actual}`);
}

// Builds a multi-cycle timeline with biweekly pay starting Jun 1 / Jun 15
function buildTimeline({
    paycheckAmount = 2000,
    expenses = [] as RequiredExpense[],
    debts = [] as Debt[],
    goals = [] as Goal[],
    livingExpenses = [] as LivingExpense[],
    maxCycles = 3,
    paycheckBuffer = 0,
} = {}) {
    const result = allocatePaycheck({
        paycheckAmount,
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        expenses,
        livingExpenses,
        debts,
        goals,
        strategy: "snowball",
        paycheckBuffer,
    });
    return buildMultiCycleTimeline({
        result,
        requiredExpenses: expenses,
        debts,
        goals,
        livingExpenses,
        completedRecommendedActions: [],
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        payCycleConfig: { payCycle: "biweekly" },
        strategy: "snowball",
        paycheckBuffer,
        maxCycles,
    });
}

// ─── Forecast state-threading (2.4.7.1 / §2.5 C5) ────────────────────────────

function testRetiredDebtFreesItsMinimumIntoLaterNet() {
    // A debt that pays off mid-horizon must free its minimum into a later cycle's discretionary —
    // visible as `net` rising once the debt is gone. Without state-threading the debt never retires
    // (the projection re-ran on frozen balances) and net stays flat at the minimum-reduced value.
    const debts: Debt[] = [
        { id: "d1", name: "Card", balance: 400, minimumPayment: 100, apr: 0, dueDate: "2026-06-10", type: "debt", recurrence: "biweekly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 300, debts, maxCycles: 3 });
    assertMoney(cycles[0].net, 200, "cycle 0 net = 300 − 100 minimum (debt still active)");
    assertMoney(cycles[2].net, 300, "cycle 2 net = 300 (debt retired → its $100 minimum freed into discretionary)");
}

// Goal advancement is also state-threaded (advanceGoals) so a funded goal stops re-funding each cycle,
// but its effect is DEPLOY (excluded from `net`/`carriedBalance`/`endingBalance` and only shown as a
// timeline item once marked paid) → not directly observable via the public TimelineCycle API. It's
// covered by construction + indirectly by the debt-retirement timing above (freed goal money → snowball).

/**
 * ⛔ **S1.12.5.3 [pass-5 `A5-6`] — THE PROJECTED CYCLES' CROSS-CADENCE BNPL SCALING WAS ASSERTED BY
 * NOTHING, AND ITS REMOVAL CHANGES WHAT A USER READS.**
 *
 * `buildMultiCycleTimeline.ts:197` scales a BNPL's minimum to the FULL in-window outflow, because a
 * biweekly plan charges ~2× before a monthly paycheck. Deleting it from the **projected** cycles was
 * invisible to `test:regression`, `test:app` and `test:scenarios` — while every projected cycle's ending
 * balance read **$100 too high**: money already committed to Klarna, shown back as cushion, on the screen
 * whose entire job is to say what is coming.
 *
 * ⛔ **THE FIXTURE CONSTRAINT IS THE FINDING, AND IT IS WHY THIS TEST LOOKS OVER-SPECIFIED.** Lane A's
 * first two fixtures produced identical output on both sides and it nearly filed the line as dead. They
 * used a $3,000 paycheck — enough for the snowball to clear the whole BNPL in cycle 0, **so no projected
 * cycle ever held a BNPL to scale, and the line under test was never reached.** The paycheck here is
 * deliberately tight enough that the debt survives into the projection. ⚠️ A "tidier" fixture with a
 * comfortable paycheck re-creates a test that passes against the defect.
 *
 * ⚠️ Covers `:197` (the projected path) only. Cycle 0's scaling at `:137` is a separate call site.
 */
function testProjectedCyclesScaleACrossCadenceBnpl() {
    // A monthly payer with a BIWEEKLY plan — the cross-cadence case. $100 × 24 remaining.
    const klarna: Debt[] = [
        { id: "bnpl1", name: "Klarna", balance: 2400, minimumPayment: 100, apr: 0, dueDate: "2026-06-05", type: "bnpl", recurrence: "biweekly", isPaidThisCycle: false },
    ];
    const rent: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 1200, dueDate: "2026-06-03", recurrence: "monthly", isPaidThisCycle: false } as RequiredExpense,
    ];
    const monthly = (debts: Debt[]) => {
        const result = allocatePaycheck({
            paycheckAmount: 1600, currentDate: "2026-06-01", nextPaycheckDate: "2026-07-01",
            expenses: rent, livingExpenses: [], debts, goals: [], strategy: "snowball", paycheckBuffer: 0,
        });
        return buildMultiCycleTimeline({
            result, requiredExpenses: rent, debts, goals: [], livingExpenses: [],
            completedRecommendedActions: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-07-01",
            payCycleConfig: { payCycle: "monthly", monthlyPayDay: 1 }, strategy: "snowball", paycheckBuffer: 0, maxCycles: 3,
        });
    };

    const cycles = monthly(klarna);
    // ⚠️ A PROJECTED cycle, not cycle 0 — `:197` is the projected call site and cycle 0 goes through `:137`.
    const projected = assertExists(cycles.find((c) => c.isProjected), "A5-6 — a projected cycle exists to measure");
    const item = assertExists(
        projected.items.find((i) => i.label === "Pay minimum on Klarna"),
        "⛔ A5-6 — the projected cycle still carries the BNPL (if not, the fixture is too generous and asserts nothing)",
    );
    /**
     * The window is Jul 1 → Aug 1 and the plan charges biweekly from Jun 5, so it falls due on **Jul 3,
     * Jul 17 and Jul 31** — three charges, $300. ⚠️ Lane A's write-up says $200 for this class; its probe
     * used a different window, and a 31-day month holds three biweekly charges rather than two. **The
     * number here is the one measured against this fixture**, not the one carried from the finding.
     *
     * ⛔ The defect renders `$100` — the unscaled minimum, as though a biweekly plan charged once a month.
     */
    assertMoney(
        item.amount,
        300,
        "⛔ A5-6 — a biweekly BNPL charges three times in this monthly window, so the projected minimum is $300, never the unscaled $100",
    );

    /**
     * ⭐ **THE CONTROL, and without it a blanket "scale everything by the window" passes.** A BNPL whose
     * cadence already matches the pay cycle must NOT be scaled — the scaling is about the mismatch, not
     * about windows in general.
     */
    const aligned: Debt[] = [{ ...klarna[0], recurrence: "monthly" }];
    const alignedCycles = monthly(aligned);
    const alignedProjected = assertExists(alignedCycles.find((c) => c.isProjected), "A5-6 control — a projected cycle exists");
    const alignedItem = assertExists(
        alignedProjected.items.find((i) => i.label === "Pay minimum on Klarna"),
        "A5-6 control — the aligned BNPL is still there",
    );
    assertMoney(alignedItem.amount, 100, "⭐ A5-6 control — a MONTHLY BNPL under a monthly paycheck is charged once, never scaled");
}

// ─── One-time windfall (2.4.6.1.4) ──────────────────────────────────────────

function testWindfallDoesNotRepeatInProjectedCycles() {
    // Cycle 0's paycheck includes a $500 one-time windfall (base $2000 → $2500). Projected cycles must
    // run on the recurring $2000, never the windfall-inflated amount (which is cleared at rollover).
    const base = 2000;
    const windfall = 500;
    const result = allocatePaycheck({
        paycheckAmount: base + windfall,
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        expenses: [],
        livingExpenses: [],
        debts: [],
        goals: [],
        strategy: "snowball",
        paycheckBuffer: 0,
    });
    const cycles = buildMultiCycleTimeline({
        result,
        requiredExpenses: [],
        debts: [],
        goals: [],
        livingExpenses: [],
        completedRecommendedActions: [],
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        payCycleConfig: { payCycle: "biweekly" },
        strategy: "snowball",
        paycheckBuffer: 0,
        maxCycles: 3,
        projectedPaycheckAmount: base,
    });
    assertMoney(cycles[0].paycheckAmount, base + windfall, "cycle 0 keeps the windfall ($2500)");
    assertMoney(cycles[1].paycheckAmount, base, "projected cycle 1 drops the windfall ($2000)");
    assertMoney(cycles[2].paycheckAmount, base, "projected cycle 2 drops the windfall ($2000)");
    // And the default (no projectedPaycheckAmount) stays backward-compatible: projected == cycle 0.
    const legacy = buildMultiCycleTimeline({
        result, requiredExpenses: [], debts: [], goals: [], livingExpenses: [], completedRecommendedActions: [],
        currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15", payCycleConfig: { payCycle: "biweekly" },
        strategy: "snowball", paycheckBuffer: 0, maxCycles: 3,
    });
    assertMoney(legacy[1].paycheckAmount, base + windfall, "default (no projected amount) → projected == cycle 0 (backward-compatible)");
}

// ─── 1. THE CORE BUG FIX ─────────────────────────────────────────────────────

function testBillAfterNextPaycheckAppearsInFutureCycle() {
    // THE KEY REGRESSION: bills due after nextPaycheckDate were silently excluded from the
    // timeline. They must now appear in a projected future cycle.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
        { id: "e2", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses });

    // Rent (Jun 5) is before Jun 15 → in cycle 0
    const cycle0 = cycles[0];
    assertExists(cycle0.items.find((i) => i.label === "Pay Rent"), "Rent in cycle 0");
    assertNotExists(cycle0.items.find((i) => i.label === "Pay Internet"), "Internet NOT in cycle 0");

    // Internet (Jun 22) is after Jun 15 but before Jun 29 → in cycle 1
    const cycle1 = assertExists(cycles[1], "Cycle 1 exists");
    assertExists(cycle1.items.find((i) => i.label === "Pay Internet"), "Internet in cycle 1 (bug fix)");
}

function testDebtMinimumAfterNextPaycheckAppearsInFutureCycle() {
    // Same bug, debt minimum variant: a minimum payment due after nextPaycheckDate
    // must appear in the correct projected cycle. Balance is large so state-threading (2.4.7.1) doesn't
    // pay it off in cycle 0's snowball before its cycle-1 minimum can be asserted (this tests due-date
    // PLACEMENT, not payoff).
    const debts: Debt[] = [
        { id: "d1", name: "CreditCard", balance: 12000, minimumPayment: 35, apr: 22, dueDate: "2026-06-20", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ debts });

    assertNotExists(
        cycles[0].items.find((i) => i.label === "Pay minimum on CreditCard"),
        "CreditCard minimum NOT in cycle 0 (due Jun 20, after Jun 15)"
    );

    const cycle1 = assertExists(cycles[1], "Cycle 1 exists");
    assertExists(
        cycle1.items.find((i) => i.label === "Pay minimum on CreditCard"),
        "CreditCard minimum in cycle 1 (Jun 20 falls in Jun 15–Jun 28)"
    );
}

// ─── 2. CYCLE STRUCTURE ──────────────────────────────────────────────────────

function testCurrentCycleIsNotProjected() {
    const cycles = buildTimeline();
    assertEqual(cycles[0].isProjected, false, "Cycle 0 is NOT projected");
}

function testFutureCyclesAreProjected() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 3 });

    for (let i = 1; i < cycles.length; i++) {
        assertEqual(cycles[i].isProjected, true, `Cycle ${i} is projected`);
    }
}

function testAlwaysReturnsAtLeastOneCycle() {
    // Even with no bills, cycle 0 is always returned.
    const cycles = buildTimeline({ maxCycles: 1 });
    assertAtLeast(cycles.length, 1, "At least one cycle always returned");
}

function testMaxCyclesCapIsRespected() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 2 });
    assertAtMost(cycles.length, 2, "maxCycles=2 returns at most 2 cycles");
}

function testCycleStartAndEndAreContinuous() {
    // Each cycle's start must equal the previous cycle's end.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 3 });

    for (let i = 1; i < cycles.length; i++) {
        assertEqual(
            cycles[i].cycleStart,
            cycles[i - 1].cycleEnd,
            `Cycle ${i} starts where cycle ${i - 1} ends`
        );
    }
}

// ─── 3. CURRENT CYCLE FIDELITY ───────────────────────────────────────────────

function testCycle0ItemsMatchSingleCycleOutput() {
    // The items in cycle 0 must be identical to what buildTimelineItems returns alone.
    // This ensures multi-cycle projection doesn't change existing current-cycle behavior.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
        { id: "e2", name: "Insurance", amount: 138, dueDate: "2026-06-20", recurrence: "monthly", isPaidThisCycle: true },
    ];
    const result = allocatePaycheck({
        paycheckAmount: 2000,
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
        expenses,
        debts: [],
        goals: [],
        strategy: "snowball",
        paycheckBuffer: 0,
    });
    const singleCycleItems = buildTimelineItems({
        result,
        requiredExpenses: expenses,
        debts: [],
        currentDate: "2026-06-01",
        nextPaycheckDate: "2026-06-15",
    });

    const cycles = buildTimeline({ expenses });
    const cycle0Items = cycles[0].items;

    assertEqual(cycle0Items.length, singleCycleItems.length, "Cycle 0 item count matches single-cycle");
    for (let i = 0; i < singleCycleItems.length; i++) {
        assertEqual(cycle0Items[i].label, singleCycleItems[i].label, `Item ${i} label matches`);
        assertMoney(cycle0Items[i].amount, singleCycleItems[i].amount, `Item ${i} amount matches`);
        assertMoney(cycle0Items[i].runningCash, singleCycleItems[i].runningCash, `Item ${i} runningCash matches`);
    }
}

function testCycle0AlwaysHasPaycheckItem() {
    const cycles = buildTimeline();
    const paycheck = cycles[0].items.find((i) => i.type === "paycheck");
    assertExists(paycheck, "Cycle 0 has paycheck item");
    assertMoney(paycheck!.amount, 2000, "Paycheck amount is correct");
}

function testProjectedCyclesAlsoHavePaycheckItem() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 2 });
    const cycle1 = assertExists(cycles[1], "Cycle 1 exists");
    const paycheck = cycle1.items.find((i) => i.type === "paycheck");
    assertExists(paycheck, "Cycle 1 has paycheck item");
}

// ─── 4. LIVING EXPENSES IN PROJECTED CYCLES ──────────────────────────────────

function testLivingReserveAppearsInProjectedCycles() {
    const livingExpenses: LivingExpense[] = [
        { id: "l1", name: "Groceries", amount: 400, enabled: true },
    ];
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, livingExpenses, maxCycles: 2 });
    const cycle1 = assertExists(cycles[1], "Cycle 1 exists");
    assertExists(
        cycle1.items.find((i) => i.type === "living_reserve"),
        "Living reserve in projected cycle 1"
    );
}

// ─── 5. RECURRENCE ROLLOVER ───────────────────────────────────────────────────

function testOneTimeBillDoesNotRepeatInProjectedCycles() {
    // A one-time expense appears only once — it must not appear in any projected cycle.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "RegistrationFee", amount: 200, dueDate: "2026-06-05", recurrence: "one-time", isPaidThisCycle: false },
        { id: "e2", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 3 });

    const cycle1 = assertExists(cycles[1], "Cycle 1 exists (Internet triggers it)");
    assertNotExists(
        cycle1.items.find((i) => i.label === "Pay RegistrationFee"),
        "One-time fee does NOT repeat in cycle 1"
    );

    if (cycles[2]) {
        assertNotExists(
            cycles[2].items.find((i) => i.label === "Pay RegistrationFee"),
            "One-time fee does NOT repeat in cycle 2"
        );
    }
}

function testMonthlyBillDoesNotRepeatInImmediatelyNextCycle() {
    // A monthly bill due Jun 22 appears in cycle 1 (Jun 15–28). After being "paid"
    // in cycle 1 by the projection, it rolls to Jul 22 and must NOT appear in cycle 2
    // (Jun 29–Jul 12 for biweekly). It should appear in cycle 3 (Jul 13–27) instead.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 3 });

    // Appears in cycle 1
    const cycle1 = assertExists(cycles[1], "Cycle 1 exists");
    assertExists(cycle1.items.find((i) => i.label === "Pay Internet"), "Internet in cycle 1");

    // Must NOT appear in cycle 2 (Jul 22 > Jul 13 = cycle 2's nextPaycheckDate)
    if (cycles[2]) {
        // cycle 2: Jun 29 → Jul 13 — Jul 22 falls after this, so Internet must NOT be here
        assertNotExists(
            cycles[2].items.find((i) => i.label === "Pay Internet"),
            "Internet does NOT repeat in cycle 2 after being projected-paid in cycle 1"
        );
    }
}

// ─── 6. ENDING BALANCE & CUSHION STATUS ─────────────────────────────────────

function testEndingBalanceMatchesLastItemRunningCash() {
    // cycle.endingBalance must equal the last item's runningCash.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
        { id: "e2", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 2 });

    for (let i = 0; i < cycles.length; i++) {
        const items = cycles[i].items;
        if (items.length > 0) {
            assertMoney(
                cycles[i].endingBalance,
                items[items.length - 1].runningCash,
                `Cycle ${i} endingBalance matches last item runningCash`
            );
        }
    }
}

function testCushionStatusStableAtOrAbove200() {
    // Paycheck $2000, no bills → ending balance = $2000 → stable
    const cycles = buildTimeline({ paycheckAmount: 2000, paycheckBuffer: 0 });
    assertEqual(cycles[0].cushionStatus, "stable", "No-bills cycle has stable cushion ($2000 remaining)");
}

function testCushionStatusTightBetween100And199() {
    // Paycheck $350, bills $200 → ending $150 → tight
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 200, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 350, expenses, paycheckBuffer: 0 });
    assertEqual(cycles[0].cushionStatus, "tight", "Ending balance $150 → tight");
}

function testCushionStatusPressureBelow100() {
    // Paycheck $250, bill $200 → ending $50 → pressure
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 200, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 250, expenses, paycheckBuffer: 0 });
    assertEqual(cycles[0].cushionStatus, "pressure", "Ending balance $50 → pressure");
}

// ─── 7. DOLLAR INVARIANT ─────────────────────────────────────────────────────

/**
 * ⛔ **S1.12.9 [DECISION `S1.12.7`] — THIS TEST ASSERTED THE CLAMP AND NOW ASSERTS WHAT REPLACED IT.**
 *
 * ⚡ It was named *"running cash never goes negative in any projected cycle"* and its comment said
 * *"regardless of how tight the budget is, runningCash must be clamped at 0"* — over $1,500 of income
 * against $2,100 of bills. It could only ever have passed. ⚠️ **Deleting it would leave the gap where the
 * true statement belongs**, so both halves are asserted: the ROWS state the real dip, and the CYCLE's
 * `endingBalance` still clamps, because that is the field that seeds the next cycle.
 */
function testTightCycleStatesItsDipAndStillCarriesZero() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 1800, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
        { id: "e2", name: "CarInsurance", amount: 300, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 1500, expenses, maxCycles: 3 });

    const dipped = cycles.some((c) => c.items.some((i) => i.runningCash < 0));
    if (!dipped) {
        throw new Error("FAIL [S1.12.9]: $1,500 against $2,100 of bills and no row states a negative balance — the clamp is back.");
    }

    for (const cycle of cycles) {
        // ⛔ S1.13.7.3 [pass-6 D1-3] — `x < 0` is FALSE for NaN, so this printed ✅ over a NaN cycle
        // balance, which the app then renders to the user and to VoiceOver as `$0`. The guard has to
        // ask whether it is a number BEFORE it asks whether it is negative.
        // ⚠️ S1.13.7.8 — `cycle.cycleNumber` does not exist on `TimelineCycle` and this file broke
        // `typecheck:core` for the whole of `S1.13.7.3`–`.7`. It survived because the regression suite is
        // run by `tsx`, which strips types and never compiles: `test:regression` was green over a tree the
        // compiler rejects. The cycle's identifier here is its START, which the throw below already uses.
        requireFinite(cycle.endingBalance, `Cycle ${cycle.cycleStart} ending balance`);
        if (cycle.endingBalance < 0) {
            throw new Error(`FAIL [S1.12.9]: endingBalance must still clamp — it seeds the next cycle. cycle ${cycle.cycleStart} = ${cycle.endingBalance}`);
        }
    }
}

function testCycleEndingBalanceMatchesPaycheckMinusDeductions() {
    // In cycle 0 with no completed actions, endingBalance = paycheckAmount - livingReserve - requiredBills
    // (paycheckBuffer is 0 for this test to make the math simple)
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
        { id: "e2", name: "Electric", amount: 95, dueDate: "2026-06-10", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const debts: Debt[] = [
        { id: "d1", name: "Visa", balance: 500, minimumPayment: 30, apr: 22, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 2000, expenses, debts, paycheckBuffer: 0 });

    // expected = 2000 - 850 - 95 - 30 = 1025
    // (snowball payment for Visa: 2000 - 850 - 95 - 30 = 1025, all goes to snowball → ending = 0? No...)
    // Actually allocatePaycheck with no buffer and no goals puts remaining into snowball.
    // But buildTimelineItems only shows completed recommended actions (not planned snowball).
    // So the ending balance in the timeline reflects what's left BEFORE completed actions.
    // ⚠️ S1.12.9 — this verifies `endingBalance`, which is what it always read; the old line said
    // `runningCash` and named a field it does not touch.
    const cycle0 = cycles[0];
    requireFinite(cycle0.endingBalance, 'Cycle ending balance');
    if (cycle0.endingBalance < 0) {
        throw new Error(`FAIL [Cycle ending balance]: expected >= 0, got ${cycle0.endingBalance}`);
    }
}

// ─── 8. CASH BUFFER IN TIMELINE ─────────────────────────────────────────────

function testBufferAppearsAsTimelineItemWhenNoShortfall() {
    // When the engine allocates a $50 buffer (no shortfall, remaining > 0), it must
    // appear as a "buffer" item in the timeline so the ending balance matches
    // flexible-cash-available.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 400, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 1000, expenses, paycheckBuffer: 50 });
    const cycle0 = cycles[0];

    const bufferItem = cycle0.items.find((i) => i.type === "buffer");
    assertExists(bufferItem, "Buffer item appears when engine allocates a buffer");
    assertMoney(bufferItem!.amount, 50, "Buffer item has correct amount ($50)");
}

function testBufferDoesNotAppearWhenShortfallExists() {
    // If required bills exceed the paycheck, there is no buffer allocation and
    // no buffer item should appear in the timeline.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 900, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    // $500 paycheck, $900 rent → shortfall → no buffer
    const cycles = buildTimeline({ paycheckAmount: 500, expenses, paycheckBuffer: 50 });
    const cycle0 = cycles[0];

    assertNotExists(cycle0.items.find((i) => i.type === "buffer"), "Buffer item absent when shortfall exists");
}

function testBufferEndingBalanceIsFlexibleCash() {
    // With a buffer allocated, endingBalance = paycheckAmount - totalRequired - buffer
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 600, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 1000, expenses, paycheckBuffer: 50 });
    // Expected: 1000 - 600 - 50 = 350
    assertMoney(cycles[0].endingBalance, 350, "endingBalance = paycheck - required - buffer");
}

// ─── 9. ITEM DATES IN PROJECTED CYCLES ───────────────────────────────────────

function testProjectedCycleItemsHaveCorrectDates() {
    // An expense due Jun 22 should appear in cycle 1 with date "2026-06-22"
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ expenses, maxCycles: 2 });
    const cycle1 = assertExists(cycles[1], "Cycle 1 exists");
    const internetItem = assertExists(
        cycle1.items.find((i) => i.label === "Pay Internet"),
        "Internet item in cycle 1"
    );
    assertEqual(internetItem.date, "2026-06-22", "Internet item has correct due date in projected cycle");
}

// ─── 10. CROSS-CYCLE CARRY (2.4.D.6 · round-6 F3) ────────────────────────────

function testNetEqualsPaycheckMinusRequiredMinusLiving() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const livingExpenses: LivingExpense[] = [{ id: "l1", name: "Groceries", amount: 400, enabled: true }];
    const cycles = buildTimeline({ paycheckAmount: 2000, expenses, livingExpenses, paycheckBuffer: 0 });
    // 2000 − 850 required − 400 living = 750
    assertMoney(cycles[0].net, 750, "cycle 0 net = paycheck − required − living");
}

/**
 * ⛔ **S1.13.7.11 [pass-6 blocker `C1-15`] — `essentials` is CARRIED, and the old derivation is the defect.**
 *
 * `CashRunwayChart` rendered *"Expenses & essentials"* as `paycheckAmount - net`, so the one line naming
 * what the money goes OUT on was back-solved from the value it explains. The three rows reconciled because
 * of that, not because each was true. `[D2-1]` then folded the applied top-up into cycle 0's `net` —
 * correctly; the money genuinely is in checking and `net` is what the band reads — and the receipt started
 * understating the user's own rent by exactly what they had just moved out of their emergency fund.
 */
function testEssentialsIsReadNotDerivedFromNet() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 1850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const result = allocatePaycheck({
        paycheckAmount: 2000, expenses, debts: [], goals: [], livingExpenses: [],
        currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15",
        strategy: "snowball", paycheckBuffer: 0,
    });
    const cycles = buildMultiCycleTimeline({
        result, requiredExpenses: expenses, debts: [], goals: [], livingExpenses: [],
        completedRecommendedActions: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15",
        payCycleConfig: { payCycle: "biweekly" }, strategy: "snowball", paycheckBuffer: 0, maxCycles: 2,
        appliedTopUpSurplus: 50,
    });
    const c0 = cycles[0];

    // the figures are D2-1's own: premium, $2,000, rent $1,850, a $50 top-up applied
    assertMoney(c0.essentials, 1850, "essentials names the rent, not the rent minus the moved cash");
    assertMoney(c0.movedIn, 50, "and the moved cash is a field the receipt can name");
    assertMoney(c0.net, 200, "net still carries the surplus — D2-1 stays closed");

    // ⛔ the defect, as the expression that produced it: this is what the screen used to print
    assertMoney(
        c0.paycheckAmount - c0.net,
        1800,
        "the RETIRED derivation understates the bill by exactly the top-up",
    );
    if (c0.paycheckAmount - c0.net === c0.essentials) {
        throw new Error("FAIL [the fixture does not reproduce C1-15 — derivation and truth agree here]");
    }

    // the identity the fourth row restores: income + moved − essentials = left after essentials
    assertMoney(c0.paycheckAmount + c0.movedIn - c0.essentials, c0.net, "the four rows add up again");
    if (c0.essentials < 0) throw new Error("FAIL [essentials is non-negative by construction, so no display clamp]");
}

/**
 * ⚠️ Projected cycles carry no surplus by design (`buildMultiCycleTimeline:86-88`), so `movedIn` is **0
 * rather than absent** — an optional field would let a consumer read *"no data"* as *"no money moved"*,
 * and the receipt renders the row on `> 0`.
 */
function testMovedInNamesTheAppliedTopUp() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const build = (appliedTopUpSurplus: number) => {
        const result = allocatePaycheck({
            paycheckAmount: 2000, expenses, debts: [], goals: [], livingExpenses: [],
            currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15",
            strategy: "snowball", paycheckBuffer: 0,
        });
        return buildMultiCycleTimeline({
            result, requiredExpenses: expenses, debts: [], goals: [], livingExpenses: [],
            completedRecommendedActions: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15",
            payCycleConfig: { payCycle: "biweekly" }, strategy: "snowball", paycheckBuffer: 0, maxCycles: 3,
            appliedTopUpSurplus,
        });
    };
    const none = build(0);
    assertMoney(none[0].movedIn, 0, "no top-up ⇒ nothing to name, and the row does not render");
    assertMoney(none[0].essentials, 850, "  …and essentials is unchanged by the presence of a surplus");

    const moved = build(50);
    assertMoney(moved[0].essentials, 850, "essentials is the SAME with a top-up applied — that is the point");
    assertMoney(moved[1].movedIn, 0, "a projected cycle carries none, stated as 0 rather than left absent");
    /**
     * ⚡ **And this is why the defect was only ever visible on cycle 0** — the finding says so and it is
     * worth pinning rather than repeating: with no surplus folded in, the retired derivation and the
     * carried truth AGREE. ⚠️ Not asserted against a literal: the monthly rent has rolled out of the
     * projected biweekly window, so this cycle's essentials is legitimately its own number, and a literal
     * here would pin the fixture's calendar rather than the property.
     */
    assertMoney(
        moved[1].paycheckAmount - moved[1].net,
        moved[1].essentials,
        "a projected cycle's derivation and its carried essentials agree — cycle 0 is the only one that moved",
    );
}

function testCarriedBalanceIsCumulativeFromStartingBalance() {
    // No bills → net = 2000 every cycle; startingBalance defaults to paycheckBuffer (200 here).
    const cycles = buildTimeline({ paycheckAmount: 2000, paycheckBuffer: 200, maxCycles: 3 });
    assertMoney(cycles[0].carriedBalance, 200 + 2000, "carried_0 = startingBalance + net_0");
    assertMoney(cycles[1].carriedBalance, 200 + 2000 * 2, "carried_1 accumulates net_1");
    assertMoney(cycles[2].carriedBalance, 200 + 2000 * 3, "carried_2 accumulates net_2");
}

function testCarriedBalanceRecurrenceHolds() {
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "Internet", amount: 80, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 2000, expenses, maxCycles: 3 });
    for (let i = 1; i < cycles.length; i++) {
        assertMoney(
            cycles[i].carriedBalance,
            cycles[i - 1].carriedBalance + cycles[i].net,
            `carried_${i} = carried_${i - 1} + net_${i}`
        );
    }
}

function testNegativeNetLumpyCyclePreservedUnclamped() {
    // A lumpy bill lands in cycle 1 that EXCEEDS that cycle's income → net_1 < 0. The un-clamped net
    // must be preserved — `endingBalance` clamps the dip to ≥0, hiding the crunch the water-fill needs.
    const expenses: RequiredExpense[] = [
        { id: "e1", name: "PropertyTax", amount: 1800, dueDate: "2026-06-22", recurrence: "monthly", isPaidThisCycle: false },
    ];
    const cycles = buildTimeline({ paycheckAmount: 1000, expenses, maxCycles: 2, paycheckBuffer: 0 });
    const cycle1 = assertExists(cycles[1], "cycle 1 exists");
    // 1000 − 1800 = −800: the negative net is the whole point (a lumpy-bill crunch).
    assertMoney(cycle1.net, -800, "lumpy-bill cycle net is NEGATIVE and un-clamped");
    assertAtLeast(cycle1.endingBalance, 0, "endingBalance stays clamped ≥0 (the dip it would hide)");
    assertMoney(
        cycle1.carriedBalance,
        cycles[0].carriedBalance + cycle1.net,
        "carried recurrence holds THROUGH the negative cycle"
    );
}

// ─── runner ──────────────────────────────────────────────────────────────────

export function runMultiCycleTimelineRegressionTests() {
    // Core bug fix
    testBillAfterNextPaycheckAppearsInFutureCycle();
    testDebtMinimumAfterNextPaycheckAppearsInFutureCycle();

    // Cycle structure
    testCurrentCycleIsNotProjected();
    testFutureCyclesAreProjected();
    testAlwaysReturnsAtLeastOneCycle();
    testMaxCyclesCapIsRespected();
    testCycleStartAndEndAreContinuous();

    // Current cycle fidelity
    testCycle0ItemsMatchSingleCycleOutput();
    testCycle0AlwaysHasPaycheckItem();
    testProjectedCyclesAlsoHavePaycheckItem();

    // Living expenses
    testLivingReserveAppearsInProjectedCycles();

    // Recurrence rollover
    testOneTimeBillDoesNotRepeatInProjectedCycles();
    testMonthlyBillDoesNotRepeatInImmediatelyNextCycle();

    // Ending balance & cushion
    testEndingBalanceMatchesLastItemRunningCash();
    testCushionStatusStableAtOrAbove200();
    testCushionStatusTightBetween100And199();
    testCushionStatusPressureBelow100();

    // Dollar invariants
    testTightCycleStatesItsDipAndStillCarriesZero();
    testCycleEndingBalanceMatchesPaycheckMinusDeductions();

    // Cash buffer
    testBufferAppearsAsTimelineItemWhenNoShortfall();
    testBufferDoesNotAppearWhenShortfallExists();
    testBufferEndingBalanceIsFlexibleCash();

    // Item dates
    testProjectedCycleItemsHaveCorrectDates();

    // Forecast state-threading (2.4.7.1)
    testRetiredDebtFreesItsMinimumIntoLaterNet();

    // One-time windfall not repeated across projected cycles (2.4.6.1.4)
    testWindfallDoesNotRepeatInProjectedCycles();

    // S1.12.5.3 [pass-5 A5-6] — the PROJECTED cycles' cross-cadence BNPL scaling
    testProjectedCyclesScaleACrossCadenceBnpl();

    // Cross-cycle carry (2.4.D.6)
    testNetEqualsPaycheckMinusRequiredMinusLiving();
    testCarriedBalanceIsCumulativeFromStartingBalance();
    testCarriedBalanceRecurrenceHolds();
    testNegativeNetLumpyCyclePreservedUnclamped();

    // S1.13.7.11 [pass-6 C1-15] — the receipt's middle row is READ, not back-solved
    testEssentialsIsReadNotDerivedFromNet();
    testMovedInNamesTheAppliedTopUp();

    console.log("✅ Multi-cycle timeline regression tests passed.");
}

runMultiCycleTimelineRegressionTests();
