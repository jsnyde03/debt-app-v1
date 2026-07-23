/**
 * Reconciliation tests for the §2.2 canonical partition + §2.0.b holdback clamp (2.4.6.1.1).
 * Asserts the discretionary buckets provably sum to `discretionary` (the lie can't hide in a wrong
 * total), the protected `cushion` = held buckets only, and the holdback composition is clamped so
 * buckets 1+2+3 can never over-sum above-floor headroom (round-6 F1).
 */
import {
	allocatePaycheck,
	PROTECTED_CUSHION_CATEGORIES,
	PUT_TO_WORK_CATEGORIES,
	type AllocationCategory,
} from "@core/engine/allocatePaycheck";
import { combinedHoldback, computeDeploy } from "@core/guardian/holdbackComposition";

function assertMoney(actual: number, expected: number, label: string) {
	const a = Math.round(actual * 100) / 100;
	const e = Math.round(expected * 100) / 100;
	if (a !== e) throw new Error(`FAIL [${label}]: expected $${e}, got $${a}`);
}

const DISCRETIONARY_BUCKETS = [...PROTECTED_CUSHION_CATEGORIES, ...PUT_TO_WORK_CATEGORIES] as AllocationCategory[];

function alloc({ paycheckAmount, required = 0, living = 0, buffer = 0, debtBalance = 0 }: {
	paycheckAmount: number;
	required?: number;
	living?: number;
	buffer?: number;
	debtBalance?: number;
}) {
	return allocatePaycheck({
		paycheckAmount,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: required > 0 ? [{ id: "e1", name: "Rent", amount: required, dueDate: "2026-06-05", recurrence: "monthly", isPaidThisCycle: false }] : [],
		livingExpenses: living > 0 ? [{ id: "l1", name: "Groceries", amount: living, enabled: true }] : [],
		debts: debtBalance > 0 ? [{ id: "d1", name: "Visa", balance: debtBalance, minimumPayment: 0, apr: 20, dueDate: "2026-06-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false }] : [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: buffer,
	});
}

function sumBuckets(result: ReturnType<typeof allocatePaycheck>, cats: readonly AllocationCategory[]): number {
	const set = new Set<string>(cats);
	return result.allocations.filter((a) => set.has(a.category)).reduce((s, a) => s + a.amount, 0);
}

function discretionaryOf(result: ReturnType<typeof allocatePaycheck>): number {
	return Math.max(0, result.paycheckAmount - result.totalRequired - result.livingExpenseReserve);
}

// ── partition reconciliation: sum(8 discretionary buckets) === discretionary ──
{
	// Normal: keep a buffer, deploy the rest to debt.
	const r = alloc({ paycheckAmount: 2000, required: 850, living: 400, buffer: 200, debtBalance: 5000 });
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), discretionaryOf(r), "normal: buckets sum to discretionary");
	assertMoney(discretionaryOf(r), 750, "normal: discretionary = 2000 − 850 − 400");
	assertMoney(sumBuckets(r, PROTECTED_CUSHION_CATEGORIES), 200, "normal: cushion = the reserved buffer (200)");
	assertMoney(sumBuckets(r, PUT_TO_WORK_CATEGORIES), 550, "normal: put-to-work = 550 to debt");
}
{
	// No debt to deploy → all discretionary stays protected (buffer + true_leftover).
	const r = alloc({ paycheckAmount: 2000, required: 850, living: 400, buffer: 200 });
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), 750, "no-deploy: buckets sum to discretionary");
	assertMoney(sumBuckets(r, PROTECTED_CUSHION_CATEGORIES), 750, "no-deploy: cushion = all of it (buffer + true_leftover)");
	assertMoney(sumBuckets(r, PUT_TO_WORK_CATEGORIES), 0, "no-deploy: nothing put to work");
}
{
	// Tight: discretionary < floor → cushion_buffer = min(floor, discretionary) (round-6 F2).
	const r = alloc({ paycheckAmount: 350, required: 200, buffer: 200 });
	assertMoney(discretionaryOf(r), 150, "tight: discretionary = 150");
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), 150, "tight: buckets sum to discretionary");
	assertMoney(sumBuckets(r, ["cushion_buffer"]), 150, "tight: cushion_buffer clamps to min(floor, discretionary)");
}
{
	// Shortfall: required > paycheck → no buffer, discretionary clamped to 0, all buckets 0.
	const r = alloc({ paycheckAmount: 500, required: 900, buffer: 200 });
	assertMoney(discretionaryOf(r), 0, "shortfall: discretionary = 0");
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), 0, "shortfall: all discretionary buckets 0");
}

// ── holdback clamp (§2.0.b, round-6 F1) ──
assertMoney(combinedHoldback({ prefundedReserve: 0, discoveryHoldback: 0, coldStartHoldback: 0, discretionary: 1000, floor: 200 }), 0, "no holdbacks → 0");
assertMoney(
	combinedHoldback({ prefundedReserve: 300, discoveryHoldback: 200, coldStartHoldback: 100, discretionary: 1000, floor: 200 }),
	500,
	"within headroom → prefunded 300 + max(discovery,coldStart) 200 = 500"
);
assertMoney(
	combinedHoldback({ prefundedReserve: 80, discoveryHoldback: 60, coldStartHoldback: 0, discretionary: 300, floor: 200 }),
	100,
	"over headroom → clamped to above-floor (aboveFloor=100: prefunded 80 + min(60, 20) = 100)"
);
assertMoney(
	combinedHoldback({ prefundedReserve: 100, discoveryHoldback: 50, coldStartHoldback: 0, discretionary: 300, floor: 200 }),
	100,
	"prefunded WINS the collision (takes the full 100 headroom, uncertainty gets 0)"
);
assertMoney(computeDeploy(300, 200, 100), 0, "deploy = max(0, 300−200−100) = 0, never negative");
assertMoney(computeDeploy(1000, 200, 500), 300, "deploy = 1000−200−500 = 300");

console.log("✅ Guardian partition + holdback-clamp tests passed.");
