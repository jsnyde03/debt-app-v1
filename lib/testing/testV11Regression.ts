import { allocatePaycheck } from "../engine/allocatePaycheck";
import { projectForecast } from "../forecast/projectForecast";
import { buildTimelineItems } from "../timeline/buildTimelineItems";

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
	}
}

function assertExists<T>(value: T | undefined | null, label: string): T {
	if (value === undefined || value === null) {
		throw new Error(`${label} failed. Expected value to exist.`);
	}

	return value;
}

function testRequiredExpenseAppearsInTimelineRegardlessOfPaidStatus() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{
				id: "rent",
				name: "Rent",
				amount: 400,
				dueDate: "2026-06-05",
				recurrence: "monthly",
				isPaidThisCycle: true,
			},
		],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [
			{
				id: "rent",
				name: "Rent",
				amount: 400,
				dueDate: "2026-06-05",
				recurrence: "monthly",
				isPaidThisCycle: true,
			},
		],
		debts: [],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const rentItem = assertExists(
		timeline.find((item) => item.label === "Pay Rent"),
		"Required expense appears in timeline snapshot"
	);

	assertEqual(rentItem.runningCash, 600, "Required expense reduces timeline cash regardless of paid status");
}

function testDebtMinimumAppearsInTimelineWithFullMinimumAmount() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 20,
				minimumPayment: 75,
				apr: 24.99,
				dueDate: "2026-06-06",
				type: "debt",
				recurrence: "monthly",
				minimumPaidThisCycle: true,
			},
		],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 20,
				minimumPayment: 75,
				apr: 24.99,
				dueDate: "2026-06-06",
				type: "debt",
				recurrence: "monthly",
				minimumPaidThisCycle: true,
			},
		],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const visaItem = assertExists(
		timeline.find((item) => item.label === "Pay minimum on Visa"),
		"Debt minimum appears in timeline snapshot"
	);

	assertEqual(visaItem.amount, 75, "Timeline shows the full planned minimum payment amount");
	assertEqual(visaItem.runningCash, 925, "Debt minimum reduces timeline cash regardless of paid status");
}

function testPaidOffDebtDoesNotAppearInTimeline() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 0,
				minimumPayment: 75,
				apr: 24.99,
				dueDate: "2026-06-06",
				type: "debt",
				recurrence: "monthly",
			},
		],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 0,
				minimumPayment: 75,
				apr: 24.99,
				dueDate: "2026-06-06",
				type: "debt",
				recurrence: "monthly",
			},
		],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	assertEqual(
		timeline.some((item) => item.label === "Pay minimum on Visa"),
		false,
		"Paid off debt (balance=0) does not appear in timeline"
	);
}

function testResultAllocationsAppearInTimeline() {
	const debts = [
		{
			id: "visa",
			name: "Visa",
			balance: 200,
			minimumPayment: 25,
			apr: 24.99,
			dueDate: "2026-06-06",
			type: "debt" as const,
			recurrence: "monthly" as const,
		},
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

	const plannedTimeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	assertEqual(
		plannedTimeline.some((item) => item.label === "Extra payment to Visa"),
		false,
		"Unconfirmed snowball allocation does not appear in timeline (optional until marked paid)"
	);

	const timelineWithCompletedAction = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts,
		completedRecommendedActions: [
			{
				targetId: "visa",
				label: "Extra payment to Visa",
				category: "snowball",
				recommendedAmount: 175,
				actualAmount: 175,
			},
		],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	const snowballItem = assertExists(
		timelineWithCompletedAction.find((item) => item.label === "Extra payment to Visa"),
		"Completed snowball action appears in timeline"
	);

	assertEqual(snowballItem.amount, 175, "Completed snowball action amount is correct");
}

function testTimelineExcludesItemsAfterNextPaycheck() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{
				id: "future-bill",
				name: "Future Bill",
				amount: 200,
				dueDate: "2026-06-20",
				recurrence: "monthly",
			},
		],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [
			{
				id: "future-bill",
				name: "Future Bill",
				amount: 200,
				dueDate: "2026-06-20",
				recurrence: "monthly",
			},
		],
		debts: [],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
	});

	assertEqual(
		timeline.some((item) => item.label === "Pay Future Bill"),
		false,
		"Timeline excludes bills after next paycheck"
	);
}

function testForecastStatusThresholds() {
	const stable = projectForecast({
		startingSafeCash: 500,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	const tight = projectForecast({
		startingSafeCash: 150,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	const pressure = projectForecast({
		startingSafeCash: 50,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	const recovery = projectForecast({
		startingSafeCash: -1,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	assertEqual(stable[0].status, "stable", "Stable forecast status");
	assertEqual(tight[0].status, "tight", "Tight forecast status");
	assertEqual(pressure[0].status, "pressure", "Pressure forecast status");
	assertEqual(recovery[0].status, "recovery", "Recovery forecast status");
}

function testForecastCanApplyBufferTrend() {
	const forecast = projectForecast({
		startingSafeCash: 500,
		startingDebtBalance: 3000,
		monthlyDebtReduction: 250,
		months: 3,
		bufferTrendPerMonth: 25,
	});

	assertEqual(forecast[0].projectedSafeCash, 500, "Month 1 trended safe cash");
	assertEqual(forecast[1].projectedSafeCash, 525, "Month 2 trended safe cash");
	assertEqual(forecast[2].projectedSafeCash, 550, "Month 3 trended safe cash");
}

function testForecastReducesDebtBalance() {
	const forecast = projectForecast({
		startingSafeCash: 500,
		startingDebtBalance: 3000,
		monthlyDebtReduction: 250,
		months: 3,
	});

	assertEqual(forecast[0].projectedDebtBalance, 2750, "Month 1 debt balance");
	assertEqual(forecast[1].projectedDebtBalance, 2500, "Month 2 debt balance");
	assertEqual(forecast[2].projectedDebtBalance, 2250, "Month 3 debt balance");
}

function testForecastNeverGoesBelowZeroDebt() {
	const forecast = projectForecast({
		startingSafeCash: 500,
		startingDebtBalance: 300,
		monthlyDebtReduction: 250,
		months: 3,
	});

	assertEqual(forecast[0].projectedDebtBalance, 50, "Month 1 capped debt");
	assertEqual(forecast[1].projectedDebtBalance, 0, "Month 2 capped debt");
	assertEqual(forecast[2].projectedDebtBalance, 0, "Month 3 capped debt");
}

function runV11RegressionTests() {
	testRequiredExpenseAppearsInTimelineRegardlessOfPaidStatus();
	testDebtMinimumAppearsInTimelineWithFullMinimumAmount();
	testPaidOffDebtDoesNotAppearInTimeline();
	testResultAllocationsAppearInTimeline();
	testTimelineExcludesItemsAfterNextPaycheck();
	testForecastStatusThresholds();
	testForecastCanApplyBufferTrend();
	testForecastReducesDebtBalance();
	testForecastNeverGoesBelowZeroDebt();

	console.log("✅ V1.1 Plan regression tests passed.");
}

runV11RegressionTests();
