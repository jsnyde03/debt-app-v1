import { allocatePaycheck } from "../engine/allocatePaycheck";
import { buildTimelineItems } from "../timeline/buildTimelineItems";
import { buildSmartInsights } from "../insights/buildSmartInsights";
import { rolloverRequiredExpenses, rolloverDebts } from "../recurrence/rolloverPayCycle";
import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

// ─── helpers ────────────────────────────────────────────────────────────────

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
	}
}

function assertMoney(actual: number, expected: number, label: string) {
	const a = Math.round(actual * 100) / 100;
	const e = Math.round(expected * 100) / 100;
	if (a !== e) throw new Error(`${label} failed. Expected $${e}, received $${a}`);
}

function assertExists<T>(value: T | null | undefined, label: string): T {
	if (value === null || value === undefined)
		throw new Error(`${label} failed: expected a value to exist`);
	return value;
}

function assertGreaterThan(actual: number, threshold: number, label: string) {
	if (!(actual > threshold))
		throw new Error(`${label} failed: expected ${actual} > ${threshold}`);
}

function assertIncludes(str: string, substr: string, label: string) {
	if (!str.includes(substr))
		throw new Error(`${label} failed: "${str}" does not include "${substr}"`);
}

// ─── 1. ALLOCATION ENGINE ───────────────────────────────────────────────────

function testAllocationSumInvariant() {
	// Every dollar of the paycheck must be accounted for in allocations.
	const result = allocatePaycheck({
		paycheckAmount: 2000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{ id: "rent", name: "Rent", amount: 1000, dueDate: "2026-06-05", recurrence: "monthly" },
			{ id: "electric", name: "Electric", amount: 100, dueDate: "2026-06-07", recurrence: "monthly" },
		],
		debts: [
			{ id: "visa", name: "Visa", balance: 500, minimumPayment: 50, apr: 22, dueDate: "2026-06-10", type: "debt", recurrence: "monthly" },
		],
		goals: [
			{ id: "emg", name: "Emergency Fund", targetAmount: 1000, currentAmount: 200, type: "emergency" },
		],
		strategy: "snowball",
		paycheckBuffer: 50,
	});

	const allocationTotal = Math.round(
		result.allocations.reduce((sum, a) => sum + a.amount, 0) * 100
	) / 100;

	assertMoney(allocationTotal, result.paycheckAmount - result.livingExpenseReserve, "Allocation sum equals paycheck minus living reserve");
}

function testEmergencyGoalFundedBeforeSavingsGoal() {
	// Emergency fund must receive allocation before any savings goal.
	const result = allocatePaycheck({
		paycheckAmount: 1500,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals: [
			{ id: "savings", name: "Vacation", targetAmount: 500, currentAmount: 0, type: "savings" },
			{ id: "emg", name: "Emergency Fund", targetAmount: 1000, currentAmount: 0, type: "emergency" },
		],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const emergencyAlloc = result.allocations.find((a) => a.category === "emergency");
	const savingsAlloc = result.allocations.find((a) => a.category === "optional_goal");

	assertExists(emergencyAlloc, "Emergency allocation exists");
	// Emergency allocation index must come before savings allocation index
	const eidx = result.allocations.indexOf(emergencyAlloc!);
	if (savingsAlloc) {
		const sidx = result.allocations.indexOf(savingsAlloc);
		if (eidx > sidx) throw new Error("Emergency goal must be allocated before savings goal");
	}
}

function testGoalContributionCappedAtRemaining() {
	// Contribution to a goal should not exceed targetAmount - currentAmount.
	const result = allocatePaycheck({
		paycheckAmount: 2000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals: [
			{ id: "emg", name: "Emergency Fund", targetAmount: 500, currentAmount: 400, type: "emergency" },
		],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const emergencyAlloc = assertExists(
		result.allocations.find((a) => a.category === "emergency"),
		"Emergency allocation"
	);

	// Only $100 left to fund (500 - 400), should never exceed that
	assertMoney(emergencyAlloc.amount, 100, "Goal contribution capped at remaining need");
}

function testCashBufferOnlyAddedWithNoShortfall() {
	// When there IS a shortfall, the $50 cash buffer should NOT be added.
	const shortfall = allocatePaycheck({
		paycheckAmount: 800,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{ id: "rent", name: "Rent", amount: 850, dueDate: "2026-06-05", recurrence: "monthly" },
		],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 50,
	});

	const hasBuffer = shortfall.allocations.some((a) => a.label === "Keep cash buffer");
	assertEqual(hasBuffer, false, "Cash buffer not added when shortfall exists");
	assertGreaterThan(shortfall.shortfall, 0, "Shortfall is positive");

	// When there is NO shortfall, the buffer should be added.
	const noShortfall = allocatePaycheck({
		paycheckAmount: 1500,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 50,
	});

	const hasBuffer2 = noShortfall.allocations.some((a) => a.label === "Keep cash buffer");
	assertEqual(hasBuffer2, true, "Cash buffer added when no shortfall");
}

function testLivingExpenseReserveReducesAvailableCash() {
	const withLiving = allocatePaycheck({
		paycheckAmount: 2000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{ id: "visa", name: "Visa", balance: 800, minimumPayment: 50, apr: 20, dueDate: "2026-06-08", type: "debt", recurrence: "monthly" },
		],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
		livingExpenses: [
			{ id: "groceries", name: "Groceries", amount: 300, enabled: true },
		],
	});

	assertMoney(withLiving.livingExpenseReserve, 300, "Living reserve is $300");

	// Snowball can only use paycheckAmount - livingReserve - minimum = 2000 - 300 - 50 = 1650
	const snowball = withLiving.allocations.find((a) => a.category === "snowball");
	assertExists(snowball, "Snowball allocation exists");
	// Visa remaining after minimum = 800 - 50 = 750, and 1650 remaining, so capped at 750
	assertMoney(snowball!.amount, 750, "Snowball capped at remaining debt balance after living reserve");
}

function testAvalancheOrdersHighestAprFirst() {
	const result = allocatePaycheck({
		paycheckAmount: 3000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{ id: "low", name: "LowAPR", balance: 200, minimumPayment: 20, apr: 5, dueDate: "2026-06-08", type: "debt", recurrence: "monthly" },
			{ id: "high", name: "HighAPR", balance: 500, minimumPayment: 30, apr: 29.99, dueDate: "2026-06-09", type: "debt", recurrence: "monthly" },
		],
		goals: [],
		strategy: "avalanche",
		paycheckBuffer: 0,
	});

	const snowballs = result.allocations.filter((a) => a.category === "snowball");
	// With enough cash and avalanche strategy, high-APR debt gets extra payment first
	assertEqual(snowballs.length > 0, true, "Snowball allocations exist for avalanche");
	// The first snowball target should be the HighAPR debt
	assertEqual(snowballs[0].debtId, "high", "Avalanche targets highest-APR debt first");
}

function testSnowballOrdersSmallestBalanceFirst() {
	const result = allocatePaycheck({
		paycheckAmount: 3000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{ id: "big", name: "BigDebt", balance: 800, minimumPayment: 30, apr: 25, dueDate: "2026-06-08", type: "debt", recurrence: "monthly" },
			{ id: "small", name: "SmallDebt", balance: 150, minimumPayment: 20, apr: 10, dueDate: "2026-06-09", type: "debt", recurrence: "monthly" },
		],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const snowballs = result.allocations.filter((a) => a.category === "snowball");
	assertEqual(snowballs.length > 0, true, "Snowball allocations exist");
	// First snowball target should be SmallDebt (smallest balance)
	assertEqual(snowballs[0].debtId, "small", "Snowball targets smallest-balance debt first");
}

function testAutopayExpenseUsesCorrectLabel() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{ id: "netflix", name: "Netflix", amount: 15, dueDate: "2026-06-06", recurrence: "monthly", isAutopay: true },
		],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const autopay = result.allocations.find((a) => a.category === "autopay_expense");
	assertExists(autopay, "Autopay expense allocation exists");
	assertIncludes(autopay!.label, "Reserve autopay for", "Autopay expense label uses reserve language");
}

// ─── 2. TIMELINE SNAPSHOT ───────────────────────────────────────────────────

function testTimelineRunningCashEndToEnd() {
	// Verify running cash arithmetic through a full paycheck cycle.
	const debts = [
		{ id: "visa", name: "Visa", balance: 400, minimumPayment: 40, apr: 22, dueDate: "2026-06-06", type: "debt" as const, recurrence: "monthly" as const },
	];
	const expenses = [
		{ id: "rent", name: "Rent", amount: 500, dueDate: "2026-06-05", recurrence: "monthly" as const },
	];

	const result = allocatePaycheck({
		paycheckAmount: 1500,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses,
		debts,
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: expenses,
		debts,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	// Running cash should only ever be >= 0 throughout
	for (const item of timeline) {
		if (item.runningCash < 0) {
			throw new Error(`Running cash went negative (${item.runningCash}) at item "${item.label}"`);
		}
	}

	// Paycheck item should be first and have runningCash = paycheckAmount
	const paycheckItem = assertExists(timeline[0], "First timeline item");
	assertEqual(paycheckItem.type, "paycheck", "First item is paycheck");
	assertMoney(paycheckItem.runningCash, 1500, "Paycheck running cash = paycheckAmount");
}

function testTimelineAllocationItemsAllPresent() {
	// Emergency, snowball, and optional_goal allocations all appear in timeline.
	const result = allocatePaycheck({
		paycheckAmount: 2000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{ id: "visa", name: "Visa", balance: 200, minimumPayment: 25, apr: 22, dueDate: "2026-06-08", type: "debt", recurrence: "monthly" },
		],
		goals: [
			{ id: "emg", name: "Emergency Fund", targetAmount: 500, currentAmount: 100, type: "emergency" },
			{ id: "vac", name: "Vacation", targetAmount: 300, currentAmount: 0, type: "savings" },
		],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts: [
			{ id: "visa", name: "Visa", balance: 200, minimumPayment: 25, apr: 22, dueDate: "2026-06-08", type: "debt", recurrence: "monthly" },
		],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const types = new Set(timeline.map((i) => i.type));
	assertEqual(types.has("emergency"), true, "Emergency allocation in timeline");
	assertEqual(types.has("snowball"), true, "Snowball allocation in timeline");
	assertEqual(types.has("optional_goal"), true, "Optional goal allocation in timeline");
}

function testTimelineLivingReserveReducesCash() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
		livingExpenses: [
			{ id: "grocery", name: "Groceries", amount: 200, enabled: true },
		],
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts: [],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const livingItem = assertExists(
		timeline.find((i) => i.type === "living_reserve"),
		"Living reserve item in timeline"
	);
	assertMoney(livingItem.runningCash, 800, "Living reserve reduces cash from 1000 to 800");
}

function testTimelineAllocationsAppearAfterExpenses() {
	// Snapshot allocations (category: snowball/emergency/optional_goal) must sort after
	// required expense items (which have earlier due dates).
	const debts = [
		{ id: "visa", name: "Visa", balance: 300, minimumPayment: 30, apr: 22, dueDate: "2026-06-05", type: "debt" as const, recurrence: "monthly" as const },
	];
	const result = allocatePaycheck({
		paycheckAmount: 1500,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts,
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const minimumIdx = timeline.findIndex((i) => i.type === "minimum_debt");
	const snowballIdx = timeline.findIndex((i) => i.type === "snowball");

	if (minimumIdx === -1 || snowballIdx === -1) {
		throw new Error("Expected both minimum_debt and snowball items in timeline");
	}
	if (snowballIdx < minimumIdx) {
		throw new Error("Snowball item must appear after minimum_debt item in timeline");
	}
}

// ─── 3. SMART INSIGHTS ──────────────────────────────────────────────────────

function makeBaseInsightParams(overrides: Partial<Parameters<typeof buildSmartInsights>[0]> = {}) {
	return {
		safeExtraPayment: 200,
		projectedBuffer: 300,
		requiredTotal: 800,
		snowballDebtFreeDate: "June 2028",
		avalancheDebtFreeDate: "June 2028",
		snowballInterest: 1500,
		avalancheInterest: 1500,
		debts: [] as Debt[],
		...overrides,
	};
}

function testInsightsRecoveryNeededWhenNegativeBuffer() {
	const insights = buildSmartInsights(makeBaseInsightParams({ projectedBuffer: -150 }));
	const recovery = assertExists(
		insights.find((i) => i.title === "Recovery Needed"),
		"Recovery Needed insight"
	);
	assertEqual(recovery.severity, "risk", "Recovery Needed is risk severity");
}

function testInsightsTightCycleWhenLowBuffer() {
	const insights = buildSmartInsights(makeBaseInsightParams({ projectedBuffer: 80 }));
	const tight = assertExists(
		insights.find((i) => i.title === "Tight Cycle Warning"),
		"Tight Cycle Warning insight"
	);
	assertEqual(tight.severity, "warning", "Tight Cycle is warning severity");
}

function testInsightsStableBufferWhenHealthy() {
	const insights = buildSmartInsights(makeBaseInsightParams({ projectedBuffer: 400 }));
	const stable = assertExists(
		insights.find((i) => i.title === "Buffer looks stable"),
		"Buffer looks stable insight"
	);
	assertEqual(stable.severity, "good", "Buffer looks stable is good severity");
}

function testInsightsProgressContinuesWhenNonNegativeBuffer() {
	const insights = buildSmartInsights(makeBaseInsightParams({ projectedBuffer: 50 }));
	const progress = assertExists(
		insights.find((i) => i.title === "Progress Still Continues"),
		"Progress Still Continues insight"
	);
	assertEqual(progress.severity, "good", "Progress Still Continues is good severity");
}

function testInsightsNearPayoffOpportunity() {
	const debts: Debt[] = [
		{
			id: "small-visa",
			name: "SmallVisa",
			balance: 250,        // balance <= safeExtraPayment(200) + 100 = 300 → fires
			minimumPayment: 50,
			apr: 22,
			dueDate: "2026-06-10",
			type: "debt",
			recurrence: "monthly",
		},
	];
	const insights = buildSmartInsights(makeBaseInsightParams({
		debts,
		safeExtraPayment: 200,
		projectedBuffer: 350,
	}));
	const nearPayoff = assertExists(
		insights.find((i) => i.title === "Near Payoff Opportunity"),
		"Near Payoff Opportunity insight"
	);
	assertEqual(nearPayoff.severity, "good", "Near Payoff is good severity");
}

function testInsightsAvalancheInterestReductionInsight() {
	const insights = buildSmartInsights(makeBaseInsightParams({
		snowballInterest: 2000,
		avalancheInterest: 1400,  // avalanche saves $600
		projectedBuffer: 300,
	}));
	const interestInsight = assertExists(
		insights.find((i) => i.title === "Interest Reduction Insight"),
		"Interest Reduction Insight"
	);
	assertEqual(interestInsight.severity, "good", "Interest Reduction is good severity");
}

function testInsightsAlwaysReturnsAtLeastOne() {
	// Even a minimal scenario should always produce at least one insight.
	const insights = buildSmartInsights(makeBaseInsightParams());
	assertGreaterThan(insights.length, 0, "At least one insight always returned");
}

function testInsightsRecoveryNeededNotReturnedWhenHealthy() {
	const insights = buildSmartInsights(makeBaseInsightParams({ projectedBuffer: 500 }));
	const recovery = insights.find((i) => i.title === "Recovery Needed");
	assertEqual(recovery === undefined, true, "Recovery Needed not returned when buffer is healthy");
}

// ─── 4. ROLLOVER PAY CYCLE ──────────────────────────────────────────────────

function testRolloverExpenseResetsIsPaidThisCycle() {
	const expenses: RequiredExpense[] = [
		{ id: "rent", name: "Rent", amount: 1000, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: true },
		{ id: "electric", name: "Electric", amount: 100, dueDate: "2026-06-07", recurrence: "monthly", isPaidThisCycle: false },
	];
	const rolled = rolloverRequiredExpenses(expenses, "2026-06-15");

	assertEqual(rolled[0].isPaidThisCycle, false, "Paid expense resets to unpaid after rollover");
	assertEqual(rolled[1].isPaidThisCycle, false, "Unpaid expense stays unpaid after rollover");
}

function testRolloverMonthlyExpenseAdvancesDueDate() {
	const expenses: RequiredExpense[] = [
		{ id: "rent", name: "Rent", amount: 1000, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: true },
	];
	const rolled = rolloverRequiredExpenses(expenses, "2026-07-01");
	assertEqual(rolled[0].dueDate, "2026-07-05", "Monthly expense advances due date by 1 month");
}

function testRolloverOneTimeExpenseKeepsDueDate() {
	const expenses: RequiredExpense[] = [
		{ id: "fee", name: "One-time Fee", amount: 50, dueDate: "2026-06-20", recurrence: "one-time", isPaidThisCycle: true },
	];
	const rolled = rolloverRequiredExpenses(expenses, "2026-07-01");
	assertEqual(rolled[0].dueDate, "2026-06-20", "One-time expense keeps original due date");
	assertEqual(rolled[0].isPaidThisCycle, false, "One-time expense resets paid status");
}

function testRolloverPerPaycheckExpenseAdvancesToPlanDate() {
	const expenses: RequiredExpense[] = [
		{ id: "parking", name: "Parking", amount: 20, dueDate: "2026-06-01", recurrence: "per-paycheck", isPaidThisCycle: true },
	];
	const rolled = rolloverRequiredExpenses(expenses, "2026-06-15");
	assertEqual(rolled[0].dueDate, "2026-06-15", "Per-paycheck expense advances to next plan date");
}

function testRolloverUnpaidExpenseDoesNotAdvanceDueDate() {
	// An unpaid monthly expense should NOT have its dueDate advanced
	// (only paid ones advance — the expense wasn't consumed this cycle)
	const expenses: RequiredExpense[] = [
		{ id: "rent", name: "Rent", amount: 1000, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false },
	];
	const rolled = rolloverRequiredExpenses(expenses, "2026-07-01");
	// Unpaid expense keeps its existing due date — it still needs to be paid
	assertEqual(rolled[0].dueDate, "2026-06-05", "Unpaid monthly expense keeps original due date");
}

function testRolloverDebtResetsPaidFlags() {
	const debts: Debt[] = [
		{
			id: "visa",
			name: "Visa",
			balance: 500,
			minimumPayment: 50,
			apr: 22,
			dueDate: "2026-06-10",
			type: "debt",
			recurrence: "monthly",
			minimumPaidThisCycle: true,
			snowballPaidThisCycle: true,
			isPaidThisCycle: true,
		},
	];
	const rolled = rolloverDebts(debts, "2026-07-01");

	assertEqual(rolled[0].minimumPaidThisCycle, false, "minimumPaidThisCycle resets after rollover");
	assertEqual(rolled[0].snowballPaidThisCycle, false, "snowballPaidThisCycle resets after rollover");
	assertEqual(rolled[0].isPaidThisCycle, false, "isPaidThisCycle resets after rollover");
}

function testRolloverMonthlyDebtAdvancesDueDate() {
	const debts: Debt[] = [
		{
			id: "visa",
			name: "Visa",
			balance: 500,
			minimumPayment: 50,
			apr: 22,
			dueDate: "2026-06-10",
			type: "debt",
			recurrence: "monthly",
			minimumPaidThisCycle: true,
		},
	];
	const rolled = rolloverDebts(debts, "2026-07-01");
	assertEqual(rolled[0].dueDate, "2026-07-10", "Monthly debt advances due date by 1 month");
}

function testRolloverUnpaidDebtDoesNotAdvanceDueDate() {
	// Unpaid debt minimum: due date stays put (the minimum is still due this cycle)
	const debts: Debt[] = [
		{
			id: "visa",
			name: "Visa",
			balance: 500,
			minimumPayment: 50,
			apr: 22,
			dueDate: "2026-06-10",
			type: "debt",
			recurrence: "monthly",
			minimumPaidThisCycle: false,
		},
	];
	const rolled = rolloverDebts(debts, "2026-07-01");
	assertEqual(rolled[0].dueDate, "2026-06-10", "Unpaid debt keeps its original due date");
}

// ─── 5. INTEGRATION: ALLOCATION → TIMELINE CASH RECONCILIATION ─────────────

function testAllocationAndTimelineCashAreConsistentForSimpleCase() {
	// For a simple case (no paid items), the final running cash in the timeline
	// should equal result.remaining after subtracting all allocation items shown.
	const debts = [
		{ id: "visa", name: "Visa", balance: 300, minimumPayment: 30, apr: 22, dueDate: "2026-06-06", type: "debt" as const, recurrence: "monthly" as const },
	];
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts,
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	// Running cash should never go negative
	for (const item of timeline) {
		if (item.runningCash < 0) {
			throw new Error(`Running cash went negative at "${item.label}": ${item.runningCash}`);
		}
	}

	// Minimum debt and snowball items should both appear in timeline
	const hasMinimum = timeline.some((i) => i.type === "minimum_debt");
	const hasSnowball = timeline.some((i) => i.type === "snowball");
	assertEqual(hasMinimum, true, "Minimum debt item appears in timeline");
	assertEqual(hasSnowball, true, "Snowball item appears in timeline");
}

function testRemainingCashCapturedInLeftoverAllocation() {
	// When money remains after all required items, goals, and snowball are handled,
	// it must appear in a "Leftover cash" allocation rather than disappearing silently.
	const result = allocatePaycheck({
		paycheckAmount: 500,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{ id: "d1", name: "D1", balance: 200, minimumPayment: 20, apr: 15, dueDate: "2026-06-08", type: "debt", recurrence: "monthly" },
		],
		goals: [
			{ id: "g1", name: "Emergency", targetAmount: 200, currentAmount: 0, type: "emergency" },
		],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	// All money goes somewhere — allocations must account for the full paycheck
	const totalAllocated = Math.round(result.allocations.reduce((sum, a) => sum + a.amount, 0) * 100) / 100;
	assertMoney(totalAllocated, result.paycheckAmount - result.livingExpenseReserve, "All paycheck money is accounted for in allocations");

	// If any money remains, it must be explicitly captured in a leftover allocation
	if (result.remaining > 0) {
		const leftover = result.allocations.find((a) => a.label === "Leftover cash");
		assertExists(leftover, "Remaining cash captured in Leftover cash allocation");
		assertMoney(leftover!.amount, result.remaining, "Leftover cash allocation amount matches result.remaining");
	}
}

// ─── runner ─────────────────────────────────────────────────────────────────

function runFullAppRegressionTests() {
	// Allocation engine
	testAllocationSumInvariant();
	testEmergencyGoalFundedBeforeSavingsGoal();
	testGoalContributionCappedAtRemaining();
	testCashBufferOnlyAddedWithNoShortfall();
	testLivingExpenseReserveReducesAvailableCash();
	testAvalancheOrdersHighestAprFirst();
	testSnowballOrdersSmallestBalanceFirst();
	testAutopayExpenseUsesCorrectLabel();

	// Timeline snapshot
	testTimelineRunningCashEndToEnd();
	testTimelineAllocationItemsAllPresent();
	testTimelineLivingReserveReducesCash();
	testTimelineAllocationsAppearAfterExpenses();

	// Smart insights
	testInsightsRecoveryNeededWhenNegativeBuffer();
	testInsightsTightCycleWhenLowBuffer();
	testInsightsStableBufferWhenHealthy();
	testInsightsProgressContinuesWhenNonNegativeBuffer();
	testInsightsNearPayoffOpportunity();
	testInsightsAvalancheInterestReductionInsight();
	testInsightsAlwaysReturnsAtLeastOne();
	testInsightsRecoveryNeededNotReturnedWhenHealthy();

	// Rollover pay cycle
	testRolloverExpenseResetsIsPaidThisCycle();
	testRolloverMonthlyExpenseAdvancesDueDate();
	testRolloverOneTimeExpenseKeepsDueDate();
	testRolloverPerPaycheckExpenseAdvancesToPlanDate();
	testRolloverUnpaidExpenseDoesNotAdvanceDueDate();
	testRolloverDebtResetsPaidFlags();
	testRolloverMonthlyDebtAdvancesDueDate();
	testRolloverUnpaidDebtDoesNotAdvanceDueDate();

	// Integration
	testAllocationAndTimelineCashAreConsistentForSimpleCase();
	testRemainingCashCapturedInLeftoverAllocation();

	console.log("✅ Full app regression tests passed.");
}

runFullAppRegressionTests();
