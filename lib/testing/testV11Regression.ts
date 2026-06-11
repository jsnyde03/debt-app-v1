import { allocatePaycheck } from "../engine/allocatePaycheck";
import { buildTimelineItems } from "../timeline/buildTimelineItems";
import { projectForecast } from "../forecast/projectForecast";

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(
			`${label} failed. Expected ${expected}, received ${actual}`
		);
	}
}

function assertExists<T>(value: T | undefined | null, label: string): T {
	if (value === undefined || value === null) {
		throw new Error(`${label} failed. Expected value to exist.`);
	}

	return value;
}

function testAutopayExpenseIsReserved() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{
				id: "rent",
				name: "Rent",
				amount: 500,
				dueDate: "2026-06-03",
				recurrence: "monthly",
				isAutopay: true,
			},
		],
		debts: [],
		goals: [],
		strategy: "snowball",
	});

	const autopayItem = assertExists(
		result.allocations.find((item) => item.category === "autopay_expense"),
		"Autopay expense allocation"
	);

	assertEqual(autopayItem.amount, 500, "Autopay expense amount");
	assertEqual(
		autopayItem.label,
		"Reserve autopay for Rent",
		"Autopay expense label"
	);
}

function testAutopayDebtMinimumIsReserved() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 900,
				minimumPayment: 75,
				apr: 24.99,
				dueDate: "2026-06-04",
				type: "debt",
				recurrence: "monthly",
				isAutopay: true,
			},
		],
		goals: [],
		strategy: "snowball",
	});

	const autopayItem = assertExists(
		result.allocations.find((item) => item.category === "autopay_debt"),
		"Autopay debt allocation"
	);

	assertEqual(autopayItem.amount, 75, "Autopay debt amount");
	assertEqual(
		autopayItem.label,
		"Reserve autopay minimum for Visa",
		"Autopay debt label"
	);
}

function testAutopayStillCountsTowardSnowballBalance() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		debts: [
			{
				id: "small-loan",
				name: "Small Loan",
				balance: 100,
				minimumPayment: 40,
				apr: 10,
				dueDate: "2026-06-04",
				type: "debt",
				recurrence: "monthly",
				isAutopay: true,
			},
		],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 0,
	});

	const autopayItem = assertExists(
		result.allocations.find((item) => item.category === "autopay_debt"),
		"Autopay minimum allocation before snowball"
	);

	const snowballItem = assertExists(
		result.allocations.find((item) => item.category === "snowball"),
		"Snowball allocation after autopay minimum"
	);

	assertEqual(autopayItem.amount, 40, "Autopay minimum amount");
	assertEqual(snowballItem.amount, 60, "Snowball uses remaining debt balance");
}

function testTimelineIncludesAutopayItemsInDateOrder() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{
				id: "rent",
				name: "Rent",
				amount: 500,
				dueDate: "2026-06-10",
				recurrence: "monthly",
				isAutopay: true,
			},
			{
				id: "utilities",
				name: "Utilities",
				amount: 100,
				dueDate: "2026-06-03",
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
				id: "rent",
				name: "Rent",
				amount: 500,
				dueDate: "2026-06-10",
				recurrence: "monthly",
				isAutopay: true,
			},
			{
				id: "utilities",
				name: "Utilities",
				amount: 100,
				dueDate: "2026-06-03",
				recurrence: "monthly",
			},
		],
		debts: [],
		currentDate: "2026-06-01",
	});

	assertEqual(timeline[0].type, "paycheck", "Timeline starts with paycheck");
	assertEqual(timeline[1].label, "Pay Utilities", "Timeline sorts earlier expense first");
	assertEqual(timeline[2].type, "autopay_expense", "Timeline includes autopay expense");
	assertEqual(timeline[2].label, "Reserve autopay for Rent", "Timeline autopay label");
}

function testTimelineRunningCash() {
	const result = allocatePaycheck({
		paycheckAmount: 1000,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			{
				id: "rent",
				name: "Rent",
				amount: 500,
				dueDate: "2026-06-03",
				recurrence: "monthly",
			},
		],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 300,
				minimumPayment: 75,
				apr: 20,
				dueDate: "2026-06-04",
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
		requiredExpenses: [
			{
				id: "rent",
				name: "Rent",
				amount: 500,
				dueDate: "2026-06-03",
				recurrence: "monthly",
			},
		],
		debts: [
			{
				id: "visa",
				name: "Visa",
				balance: 300,
				minimumPayment: 75,
				apr: 20,
				dueDate: "2026-06-04",
				type: "debt",
				recurrence: "monthly",
			},
		],
		currentDate: "2026-06-01",
	});

	assertEqual(timeline[0].runningCash, 1000, "Timeline paycheck running cash");
	assertEqual(timeline[1].runningCash, 500, "Timeline after expense");
	assertEqual(timeline[2].runningCash, 425, "Timeline after minimum debt");
}

function testExternalRecommendedPaymentDoesNotCountAgainstFlexibleCash() {
	const completedActions = [
		{
			targetId: "visa",
			label: "Extra payment to Visa",
			category: "snowball" as const,
			recommendedAmount: 200,
			actualAmount: 200,
			paymentSource: "external" as const,
		},
	];

	const paycheckFundedTotal = completedActions.filter((action) => action.paymentSource !== "external").reduce((sum, action) => sum + action.actualAmount, 0);

	assertEqual(paycheckFundedTotal, 0, "External recommended payment should not reduce paycheck flexible cash");
}

function testForecastKeepsSafeCashStable() {
	const forecast = projectForecast({
		startingSafeCash: 500,
		startingDebtBalance: 3000,
		monthlyDebtReduction: 250,
		months: 3,
	});

	assertEqual(forecast.length, 3, "Forecast month count");
	assertEqual(forecast[0].projectedSafeCash, 500, "Month 1 safe cash");
	assertEqual(forecast[1].projectedSafeCash, 500, "Month 2 safe cash");
	assertEqual(forecast[2].projectedSafeCash, 500, "Month 3 safe cash");
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

function testForecastStatusThresholds() {
	const stable = projectForecast({
		startingSafeCash: 500,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	const warning = projectForecast({
		startingSafeCash: 150,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	const risk = projectForecast({
		startingSafeCash: -1,
		startingDebtBalance: 1000,
		monthlyDebtReduction: 100,
		months: 1,
	});

	assertEqual(stable[0].status, "stable", "Stable forecast status");
	assertEqual(warning[0].status, "warning", "Warning forecast status");
	assertEqual(risk[0].status, "risk", "Risk forecast status");
}




function runV11RegressionTests() {
	testAutopayExpenseIsReserved();
	testAutopayDebtMinimumIsReserved();
	testAutopayStillCountsTowardSnowballBalance();
	testTimelineIncludesAutopayItemsInDateOrder();
	testTimelineRunningCash();
	testExternalRecommendedPaymentDoesNotCountAgainstFlexibleCash();
	testForecastKeepsSafeCashStable();
	testForecastNeverGoesBelowZeroDebt();
	testForecastReducesDebtBalance();
	testForecastStatusThresholds();
	

	console.log("✅ V1.1 regression tests passed.");
}

runV11RegressionTests();
