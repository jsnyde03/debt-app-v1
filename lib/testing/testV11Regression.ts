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

function testPaidRequiredExpenseStaysInTimelineAndStillReducesCash() {
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
		completedRecommendedActions: [],
	});

	const rentItem = assertExists(
		timeline.find((item) => item.label === "Pay Rent"),
		"Paid required expense timeline item"
	);

	assertEqual(rentItem.status, "paid", "Paid required expense status");
	assertEqual(rentItem.runningCash, 600, "Paid required expense still reduces timeline cash");
}

function testPaidDebtMinimumStaysInTimelineAndUsesPlannedMinimum() {
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
		completedRecommendedActions: [],
	});

	const visaItem = assertExists(
		timeline.find((item) => item.label === "Pay minimum on Visa"),
		"Paid debt minimum timeline item"
	);

	assertEqual(visaItem.amount, 75, "Timeline uses planned minimum instead of reduced balance");
	assertEqual(visaItem.status, "paid", "Paid debt minimum status");
	assertEqual(visaItem.runningCash, 925, "Paid debt minimum still reduces timeline cash");
}

function testOutsideRecommendedActionDoesNotReduceTimelineCash() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts: [],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		completedRecommendedActions: [
			{
				targetId: "visa",
				label: "Extra payment to Visa",
				category: "snowball",
				recommendedAmount: 100,
				actualAmount: 100,
				paymentSource: "external",
			},
		],
	});

	const externalItem = assertExists(
		timeline.find((item) => item.label === "Extra payment to Visa"),
		"External recommended timeline item"
	);

	assertEqual(externalItem.status, "external", "External recommended status");
	assertEqual(externalItem.runningCash, 1000, "External recommended action does not reduce paycheck timeline cash");
}

function testPaycheckRecommendedActionDoesReduceTimelineCash() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const timeline = buildTimelineItems({
		result,
		requiredExpenses: [],
		debts: [],
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		completedRecommendedActions: [
			{
				targetId: "visa",
				label: "Extra payment to Visa",
				category: "snowball",
				recommendedAmount: 100,
				actualAmount: 100,
				paymentSource: "paycheck",
			},
		],
	});

	const paycheckItem = assertExists(
		timeline.find((item) => item.label === "Extra payment to Visa"),
		"Paycheck-funded recommended timeline item"
	);

	assertEqual(paycheckItem.status, "paid", "Paycheck-funded recommended status");
	assertEqual(paycheckItem.runningCash, 900, "Paycheck-funded recommended action reduces timeline cash");
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
		completedRecommendedActions: [],
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
	testPaidRequiredExpenseStaysInTimelineAndStillReducesCash();
	testPaidDebtMinimumStaysInTimelineAndUsesPlannedMinimum();
	testOutsideRecommendedActionDoesNotReduceTimelineCash();
	testPaycheckRecommendedActionDoesReduceTimelineCash();
	testTimelineExcludesItemsAfterNextPaycheck();
	testForecastStatusThresholds();
	testForecastCanApplyBufferTrend();
	testForecastReducesDebtBalance();
	testForecastNeverGoesBelowZeroDebt();

	console.log("✅ V1.1 Plan regression tests passed.");
}

runV11RegressionTests();
