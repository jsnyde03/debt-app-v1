import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { buildTimelineItems } from "@core/timeline/buildTimelineItems";
import type { CompletedRecommendedAction, Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

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
	if (value == null) throw new Error(`FAIL [${label}]: expected a value to exist, got ${value}`);
	return value;
}

function assertNotExists<T>(value: T | null | undefined, label: string) {
	if (value != null) throw new Error(`FAIL [${label}]: expected no value, but got ${String(value)}`);
}

function buildResult(
	paycheckAmount: number,
	expenses: RequiredExpense[],
	debts: Debt[],
	nextPaycheckDate = "2026-06-15",
) {
	return allocatePaycheck({
		paycheckAmount,
		currentDate: "2026-06-01",
		nextPaycheckDate,
		expenses,
		debts,
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});
}

// ─── 1. ITEM INCLUSION ──────────────────────────────────────────────────────

function testUnpaidExpenseDueInCycleAppears() {
	// Unpaid expense with dueDate inside the cycle must appear.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay Rent");
	assertExists(item, "Unpaid in-cycle expense appears in timeline");
}

function testPaidExpenseDueInCycleAppears() {
	// Paid expense with dueDate inside the cycle must appear.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: true },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay Rent");
	assertExists(item, "Paid in-cycle expense appears in timeline");
	assertEqual(item!.isPaid, true, "Paid expense is flagged isPaid");
}

function testPaidExpenseOutsideDateWindowStillAppears() {
	// BUG FIX: Paid expenses with dueDate >= nextPaycheckDate must still appear.
	// These showed in "Completed This Cycle" in the plan but were previously dropped from the timeline.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Insurance", amount: 140, dueDate: "2026-06-20", recurrence: "monthly", isPaidThisCycle: true },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay Insurance");
	assertExists(item, "Paid expense with dueDate after nextPaycheckDate appears in timeline");
	assertEqual(item!.isPaid, true, "Out-of-window paid expense flagged isPaid");
}

function testUnpaidExpenseOutsideDateWindowDoesNotAppear() {
	// Unpaid expense with dueDate >= nextPaycheckDate belongs to a future cycle — must NOT appear.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "NextMonthRent", amount: 850, dueDate: "2026-06-20", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay NextMonthRent");
	assertNotExists(item, "Unpaid expense due after nextPaycheckDate does not appear");
}

function testPaidDebtMinimumOutsideDateWindowStillAppears() {
	// BUG FIX: Same as expenses — paid debt minimums with dueDate >= nextPaycheckDate must appear.
	const debts: Debt[] = [
		{ id: "d1", name: "Car Loan", balance: 5000, minimumPayment: 245, apr: 6.9, dueDate: "2026-06-18", type: "debt", recurrence: "monthly", minimumPaidThisCycle: true, isPaidThisCycle: false },
	];
	const result = buildResult(2000, [], debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay minimum on Car Loan");
	assertExists(item, "Paid debt minimum with dueDate after nextPaycheckDate appears in timeline");
	assertEqual(item!.isPaid, true, "Out-of-window paid debt flagged isPaid");
}

function testUnpaidDebtOutsideDateWindowDoesNotAppear() {
	// Unpaid debt due after nextPaycheckDate must NOT appear — it's a future cycle item.
	const debts: Debt[] = [
		{ id: "d1", name: "FutureDebt", balance: 500, minimumPayment: 50, apr: 15, dueDate: "2026-06-20", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, [], debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay minimum on FutureDebt");
	assertNotExists(item, "Unpaid debt due after nextPaycheckDate does not appear");
}

function testDebtWithZeroBalanceAndNotPaidDoesNotAppear() {
	// Fully paid-off debt (balance = 0, not paid this cycle) must not appear.
	const debts: Debt[] = [
		{ id: "d1", name: "PaidOff", balance: 0, minimumPayment: 50, apr: 15, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, [], debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay minimum on PaidOff");
	assertNotExists(item, "Debt with zero balance and not paid this cycle does not appear");
}

function testDebtWithZeroBalanceButPaidThisCycleAppears() {
	// Debt paid off exactly this cycle (balance=0, minimumPaidThisCycle=true) should appear.
	const debts: Debt[] = [
		{ id: "d1", name: "LastPayment", balance: 0, minimumPayment: 50, apr: 15, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", minimumPaidThisCycle: true, isPaidThisCycle: false },
	];
	const result = buildResult(2000, [], debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay minimum on LastPayment");
	assertExists(item, "Debt with zero balance but minimumPaidThisCycle=true appears in timeline");
}

function testExpenseDueExactlyOnNextPaycheckDateExcludedWhenUnpaid() {
	// An unpaid expense due exactly on nextPaycheckDate is the next cycle — exclude it.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Boundary", amount: 100, dueDate: "2026-06-15", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay Boundary");
	assertNotExists(item, "Unpaid expense due exactly on nextPaycheckDate excluded");
}

function testExpenseDueExactlyOnNextPaycheckDateIncludedWhenPaid() {
	// A paid expense due on nextPaycheckDate was paid this cycle — include it.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Boundary", amount: 100, dueDate: "2026-06-15", recurrence: "monthly", isPaidThisCycle: true },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Pay Boundary");
	assertExists(item, "Paid expense due exactly on nextPaycheckDate is included");
}

// ─── 2. COMPLETED RECOMMENDED ACTIONS ───────────────────────────────────────

function testCompletedSnowballFromPaycheckAppearsInTimeline() {
	// BUG FIX: Completed snowball actions from paycheck must appear in timeline.
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 500, minimumPayment: 30, apr: 22, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(1000, [], debts);
	const completedRecommendedActions = [
		{ targetId: "d1", label: "Extra payment to Visa", category: "snowball" as const, recommendedAmount: 200, actualAmount: 200, paymentSource: "paycheck" as const },
	];
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, completedRecommendedActions, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Extra payment to Visa" && i.isPaid);
	assertExists(item, "Completed snowball action (paycheck) appears in timeline");
	assertEqual(item!.type, "snowball", "Completed snowball has correct type");
	assertMoney(item!.amount, 200, "Completed snowball has correct amount");
}

function testCompletedEmergencyFromPaycheckAppearsInTimeline() {
	// Completed emergency fund contributions from paycheck must appear in timeline.
	const result = buildResult(1000, [], []);
	const completedRecommendedActions = [
		{ targetId: "g1", label: "Add to Emergency Fund", category: "emergency" as const, recommendedAmount: 100, actualAmount: 100, paymentSource: "paycheck" as const },
	];
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts: [], completedRecommendedActions, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Add to Emergency Fund" && i.isPaid);
	assertExists(item, "Completed emergency action (paycheck) appears in timeline");
	assertEqual(item!.type, "emergency", "Completed emergency has correct type");
}

function testCompletedActionFromExternalSourceDoesNotAppear() {
	// External payment (money from outside this paycheck) must NOT appear in the timeline.
	// It doesn't affect the paycheck's running cash balance.
	const result = buildResult(1000, [], []);
	const completedRecommendedActions = [
		{ targetId: "d1", label: "Extra payment to Visa", category: "snowball" as const, recommendedAmount: 300, actualAmount: 300, paymentSource: "external" as const },
	];
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts: [], completedRecommendedActions, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = timeline.find((i) => i.label === "Extra payment to Visa");
	assertNotExists(item, "External completed action does not appear in timeline");
}

function testNoCompletedActionsProducesNoExtraItems() {
	// Empty completedRecommendedActions must not produce ghost items.
	const result = buildResult(1000, [], []);
	const timelineWithEmpty = buildTimelineItems({ result, requiredExpenses: [], debts: [], completedRecommendedActions: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });
	const timelineWithUndefined = buildTimelineItems({ result, requiredExpenses: [], debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	assertEqual(timelineWithEmpty.length, timelineWithUndefined.length, "Empty completedRecommendedActions produces same count as omitting it");
}

function testCompletedSnowballSuppressesPlannedAllocation() {
	// When a snowball payment is marked complete, the engine's planned allocation for the
	// same debt must be suppressed. Only the completed entry (isPaid=true) should appear —
	// never both. Running cash must only be deducted once.
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 500, minimumPayment: 30, apr: 22, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(1000, [], debts);
	const completedRecommendedActions = [
		{ targetId: "d1", label: "Extra payment to Visa", category: "snowball" as const, recommendedAmount: 150, actualAmount: 150, paymentSource: "paycheck" as const },
	];
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, completedRecommendedActions, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const snowballItems = timeline.filter((i) => i.type === "snowball");
	assertEqual(snowballItems.length, 1, "Exactly one snowball entry — completed suppresses planned");
	assertEqual(snowballItems[0].isPaid, true, "The single snowball entry is the completed one (isPaid=true)");
	assertMoney(snowballItems[0].amount, 150, "Snowball amount is the actual completed amount");
}

function testCompletedEmergencySuppressesPlannedAllocation() {
	// Same dedup rule for emergency fund contributions.
	const goals = [{ id: "g1", name: "Emergency Fund", targetAmount: 1000, currentAmount: 0, type: "emergency" as const }];
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals,
		strategy: "snowball",
		paycheckBuffer: 0,
	});
	const completedRecommendedActions = [
		{ targetId: "g1", label: "Add to Emergency Fund", category: "emergency" as const, recommendedAmount: 100, actualAmount: 100, paymentSource: "paycheck" as const },
	];
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts: [], completedRecommendedActions, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const emergencyItems = timeline.filter((i) => i.type === "emergency");
	assertEqual(emergencyItems.length, 1, "Exactly one emergency entry — completed suppresses planned");
	assertEqual(emergencyItems[0].isPaid, true, "The single emergency entry is the completed one");
}

function testCompletedActionsForDifferentTargetsBothAppear() {
	// Completing a snowball for Visa and a separate snowball for Medical must both
	// show up independently - completing one target's action must not affect another's.
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 200, minimumPayment: 20, apr: 22, dueDate: "2026-06-06", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
		{ id: "d2", name: "Medical", balance: 300, minimumPayment: 10, apr: 0, dueDate: "2026-06-09", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(1000, [], debts);
	const completedRecommendedActions = [
		{ targetId: "d1", label: "Extra payment to Visa", category: "snowball" as const, recommendedAmount: 200, actualAmount: 200, paymentSource: "paycheck" as const },
		{ targetId: "d2", label: "Extra payment to Medical", category: "snowball" as const, recommendedAmount: 50, actualAmount: 50, paymentSource: "paycheck" as const },
	];
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, completedRecommendedActions, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const completedVisa = assertExists(
		timeline.find((i) => i.type === "snowball" && i.label === "Extra payment to Visa"),
		"Completed Visa snowball appears"
	);
	const completedMedical = assertExists(
		timeline.find((i) => i.type === "snowball" && i.label === "Extra payment to Medical"),
		"Completed Medical snowball also appears (different target)"
	);
	assertMoney(completedVisa.amount, 200, "Visa snowball amount is correct");
	assertMoney(completedMedical.amount, 50, "Medical snowball amount is correct");
}

// ─── 3. RUNNING CASH INVARIANTS ─────────────────────────────────────────────

/**
 * ⛔ **S1.12.9 [DECISION `S1.12.7`] — WAS *"running cash never goes negative"* OVER $800 OF INCOME AND
 * $1,800 OF BILLS.** It passed because the field was clamped, not because the money held up. Now that the
 * ledger states the true number, the same fixture asserts the shortfall it was concealing — **−$1,000** by
 * the last row, exactly $800 − $1,500 − $200 − $100.
 */
function testRunningCashStatesTheShortfall() {
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 1500, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
		{ id: "e2", name: "Electric", amount: 200, dueDate: "2026-06-07", recurrence: "monthly", isPaidThisCycle: false },
	];
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 1000, minimumPayment: 100, apr: 22, dueDate: "2026-06-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(800, expenses, debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const last = timeline[timeline.length - 1];
	if (!last) throw new Error("FAIL [S1.12.9]: the timeline is empty, so the assertion below would be vacuous.");
	assertMoney(last.runningCash, -1000, "⛔ S1.12.9 — the last row states −$1,000, not a third identical $0");
}

function testRunningCashDecrementedByPaidItems() {
	// Paid items still affect running cash — they represent money that already left the account.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: true },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const paycheckItem = assertExists(timeline.find((i) => i.type === "paycheck"), "Paycheck item exists");
	const rentItem = assertExists(timeline.find((i) => i.label === "Pay Rent"), "Paid Rent item exists");

	// Running cash after paid rent = paycheckAmount - rent amount
	assertMoney(rentItem.runningCash, paycheckItem.runningCash - 850, "Running cash decremented by paid rent amount");
}

function testRunningCashStartsAtPaycheckAmount() {
	// The paycheck item's running cash must equal paycheckAmount.
	const result = buildResult(1950, [], []);
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const paycheckItem = assertExists(timeline.find((i) => i.type === "paycheck"), "Paycheck item exists");
	assertMoney(paycheckItem.runningCash, 1950, "Running cash at paycheck item equals paycheckAmount");
}

// ─── 4. SORT ORDER ──────────────────────────────────────────────────────────

function testPaycheckIsAlwaysFirst() {
	// Paycheck must be the first item regardless of what else is in the timeline.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	assertEqual(timeline[0].type, "paycheck", "Paycheck is first item");
}

function testLivingReserveComesBeforeExpenses() {
	// Living reserve is deducted before any bills — must appear before expenses.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
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
		livingExpenses: [{ id: "l1", name: "Groceries", amount: 300, enabled: true }],
	});
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const livingIndex = timeline.findIndex((i) => i.type === "living_reserve");
	const expenseIndex = timeline.findIndex((i) => i.label === "Pay Rent");
	if (livingIndex === -1) throw new Error("FAIL [Living reserve before expenses]: living_reserve item not found");
	if (expenseIndex === -1) throw new Error("FAIL [Living reserve before expenses]: expense item not found");
	if (livingIndex >= expenseIndex) throw new Error(`FAIL [Living reserve before expenses]: living_reserve at ${livingIndex}, expense at ${expenseIndex}`);
}

/**
 * ⛔ **S1.13.7.10 [pass-6 `D1-5`] — THIS TEST EXECUTED ZERO ASSERTIONS, AND NO PLANT COULD SEE IT.**
 *
 * Its whole body sat behind `if (snowballIndex !== -1)`, and `snowballIndex` was **-1 on every run** — so
 * the only test in this suite that pins the ORDER of the Today timeline did nothing at all. A sort-order
 * regression putting an allocation above the bills it is funded from would change every `runningCash`
 * figure on the screen and nothing here would red. ⚠️ **Found in the GREEN state**: a plant cannot see a
 * test that does not fail, because it does not run.
 *
 * ⛔ **AND THE FINDING'S IMPLIED EXPLANATION WAS WRONG, WHICH CHANGES THE FIX.** It reads as though the
 * engine emits a snowball that `buildTimelineItems` drops. Measured: `buildTimelineItems:129-131` says the
 * opposite in its own comment — extra payments appear **only once the user has marked them paid**, so they
 * are emitted from `completedRecommendedActions` and from nothing else. `-1` was CORRECT for a fixture
 * that passed none. The repair is therefore to give the fixture a completed action, **not** to change the
 * producer.
 *
 * ⚠️ **The vacuity guards come first and are unconditional** — the shape `testRunningCashStatesTheShortfall`
 * forty lines above already uses. Three nested existence checks with no floor is how this test passed for
 * as long as it did.
 */
function testAllocationsAppearAfterExpensesAndDebts() {
	// Snowball/emergency allocations are dated at nextPaycheckDate, so they must sort after
	// all expenses and debt minimums that are dated earlier in the cycle.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 500, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
	];
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 200, minimumPayment: 20, apr: 22, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(1500, expenses, debts);
	// ⛔ The snowball reaches the timeline ONLY through here — see the docblock above.
	const completedRecommendedActions: CompletedRecommendedAction[] = [
		{ targetId: "d1", label: "Extra payment to Visa", category: "snowball", recommendedAmount: 180, actualAmount: 180 },
	];
	const timeline = buildTimelineItems({
		result,
		requiredExpenses: expenses,
		debts,
		completedRecommendedActions,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const snowballIndex = timeline.findIndex((i) => i.type === "snowball");
	const expenseIndex = timeline.findIndex((i) => i.label === "Pay Rent");
	const debtIndex = timeline.findIndex((i) => i.label === "Pay minimum on Visa");

	// ⛔ THE VACUITY FLOOR. Each of the three used to be an `!== -1` escape hatch; all three are now the
	// assertion. A missing row means this test measured NOTHING, which is what it did for its whole life.
	if (snowballIndex === -1) {
		throw new Error(
			"FAIL [D1-5]: no snowball item in the timeline, so every ordering check below is vacuous — " +
				"which is exactly the state this test shipped in.",
		);
	}
	if (expenseIndex === -1) throw new Error("FAIL [D1-5]: no expense row, so the ordering check is vacuous");
	if (debtIndex === -1) throw new Error("FAIL [D1-5]: no debt-minimum row, so the ordering check is vacuous");

	if (snowballIndex <= expenseIndex) {
		throw new Error(`FAIL [Allocations after expenses]: snowball at ${snowballIndex}, expense at ${expenseIndex}`);
	}
	if (snowballIndex <= debtIndex) {
		throw new Error(`FAIL [Allocations after expenses]: snowball at ${snowballIndex}, debt at ${debtIndex}`);
	}
}

// ─── 5. MIXED CYCLE (PAID + UNPAID) ─────────────────────────────────────────

function testMixedCycleAllItemsPresent() {
	// In a real mid-cycle state some items are paid, some unpaid, some overdue paid.
	// Timeline must contain ALL of them.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-03", recurrence: "monthly", isPaidThisCycle: true },
		{ id: "e2", name: "Electric", amount: 95, dueDate: "2026-06-08", recurrence: "monthly", isPaidThisCycle: false },
		{ id: "e3", name: "Insurance", amount: 138, dueDate: "2026-06-20", recurrence: "monthly", isPaidThisCycle: true }, // paid but outside window
	];
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 1200, minimumPayment: 35, apr: 22, dueDate: "2026-06-10", type: "debt", recurrence: "monthly", minimumPaidThisCycle: true },
		{ id: "d2", name: "CarLoan", balance: 8000, minimumPayment: 245, apr: 6.9, dueDate: "2026-06-12", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2400, expenses, debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const labels = timeline.map((i) => i.label);
	if (!labels.some((l) => l === "Pay Rent")) throw new Error("FAIL [Mixed cycle]: Paid Rent missing");
	if (!labels.some((l) => l === "Pay Electric")) throw new Error("FAIL [Mixed cycle]: Unpaid Electric missing");
	if (!labels.some((l) => l === "Pay Insurance")) throw new Error("FAIL [Mixed cycle]: Paid Insurance (outside window) missing");
	if (!labels.some((l) => l === "Pay minimum on Visa")) throw new Error("FAIL [Mixed cycle]: Paid Visa minimum missing");
	if (!labels.some((l) => l === "Pay minimum on CarLoan")) throw new Error("FAIL [Mixed cycle]: Unpaid CarLoan minimum missing");
}

function testMixedCyclePaidItemsFlaggedCorrectly() {
	// isPaid flag must correctly reflect each item's state.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-03", recurrence: "monthly", isPaidThisCycle: true },
		{ id: "e2", name: "Electric", amount: 95, dueDate: "2026-06-08", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const rent = assertExists(timeline.find((i) => i.label === "Pay Rent"), "Rent item exists");
	const electric = assertExists(timeline.find((i) => i.label === "Pay Electric"), "Electric item exists");

	assertEqual(rent.isPaid, true, "Paid Rent is flagged isPaid=true");
	assertEqual(electric.isPaid ?? false, false, "Unpaid Electric is flagged isPaid=false");
}

// ─── 6. AUTOPAY ─────────────────────────────────────────────────────────────

function testAutopayExpenseShowsCorrectLabel() {
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Netflix", amount: 20, dueDate: "2026-06-06", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true },
	];
	const result = buildResult(1000, expenses, []);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts: [], currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = assertExists(timeline.find((i) => i.label === "Reserve autopay for Netflix"), "Autopay expense label");
	assertEqual(item.type, "autopay_expense", "Autopay expense has correct type");
}

function testAutopayDebtShowsCorrectLabel() {
	const debts: Debt[] = [
		{ id: "d1", name: "CarLoan", balance: 5000, minimumPayment: 245, apr: 6.9, dueDate: "2026-06-08", type: "debt", recurrence: "monthly", isPaidThisCycle: false, isAutopay: true },
	];
	const result = buildResult(1500, [], debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: [], debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	const item = assertExists(timeline.find((i) => i.label === "Reserve minimum for CarLoan"), "Autopay debt label");
	assertEqual(item.type, "autopay_debt", "Autopay debt has correct type");
}

// ─── 7. COUNT CONSISTENCY ───────────────────────────────────────────────────

function testTimelineCountMatchesPlanItems() {
	// The number of expense+debt items in the timeline must equal the number of
	// expenses and debts that are either in-cycle or paid this cycle.
	const expenses: RequiredExpense[] = [
		{ id: "e1", name: "Rent", amount: 850, dueDate: "2026-06-03", recurrence: "monthly", isPaidThisCycle: true },
		{ id: "e2", name: "Electric", amount: 95, dueDate: "2026-06-08", recurrence: "monthly", isPaidThisCycle: false },
		{ id: "e3", name: "FutureBill", amount: 50, dueDate: "2026-06-20", recurrence: "monthly", isPaidThisCycle: false },
	];
	const debts: Debt[] = [
		{ id: "d1", name: "Visa", balance: 500, minimumPayment: 30, apr: 22, dueDate: "2026-06-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
		{ id: "d2", name: "FutureDebt", balance: 300, minimumPayment: 25, apr: 15, dueDate: "2026-06-25", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
	];
	const result = buildResult(2000, expenses, debts);
	const timeline = buildTimelineItems({ result, requiredExpenses: expenses, debts, currentDate: "2026-06-01", nextPaycheckDate: "2026-06-15" });

	// Expected in timeline: Rent (paid), Electric (in-cycle), NOT FutureBill (unpaid, outside)
	// Visa (in-cycle), NOT FutureDebt (unpaid, outside)
	const expenseDebtItems = timeline.filter((i) =>
		i.type === "expense" || i.type === "autopay_expense" ||
		i.type === "minimum_debt" || i.type === "autopay_debt"
	);
	assertEqual(expenseDebtItems.length, 3, "Timeline has exactly 3 expense/debt items: Rent (paid), Electric, Visa");
}

// ─── runner ──────────────────────────────────────────────────────────────────

export function runTimelineRegressionTests() {
	// Item inclusion
	testUnpaidExpenseDueInCycleAppears();
	testPaidExpenseDueInCycleAppears();
	testPaidExpenseOutsideDateWindowStillAppears();
	testUnpaidExpenseOutsideDateWindowDoesNotAppear();
	testPaidDebtMinimumOutsideDateWindowStillAppears();
	testUnpaidDebtOutsideDateWindowDoesNotAppear();
	testDebtWithZeroBalanceAndNotPaidDoesNotAppear();
	testDebtWithZeroBalanceButPaidThisCycleAppears();
	testExpenseDueExactlyOnNextPaycheckDateExcludedWhenUnpaid();
	testExpenseDueExactlyOnNextPaycheckDateIncludedWhenPaid();

	// Completed recommended actions
	testCompletedSnowballFromPaycheckAppearsInTimeline();
	testCompletedEmergencyFromPaycheckAppearsInTimeline();
	testCompletedActionFromExternalSourceDoesNotAppear();
	testNoCompletedActionsProducesNoExtraItems();
	testCompletedSnowballSuppressesPlannedAllocation();
	testCompletedEmergencySuppressesPlannedAllocation();
	testCompletedActionsForDifferentTargetsBothAppear();

	// Running cash invariants
	testRunningCashStatesTheShortfall();
	testRunningCashDecrementedByPaidItems();
	testRunningCashStartsAtPaycheckAmount();

	// Sort order
	testPaycheckIsAlwaysFirst();
	testLivingReserveComesBeforeExpenses();
	testAllocationsAppearAfterExpensesAndDebts();

	// Mixed cycle
	testMixedCycleAllItemsPresent();
	testMixedCyclePaidItemsFlaggedCorrectly();

	// Autopay labels
	testAutopayExpenseShowsCorrectLabel();
	testAutopayDebtShowsCorrectLabel();

	// Count consistency
	testTimelineCountMatchesPlanItems();

	console.log("✅ Timeline regression tests passed.");
}

runTimelineRegressionTests();
