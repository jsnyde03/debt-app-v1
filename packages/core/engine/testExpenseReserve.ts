import {
	allocatePaycheck,
	PROTECTED_CUSHION_CATEGORIES,
	PUT_TO_WORK_CATEGORIES,
	type AllocationCategory,
} from "@core/engine/allocatePaycheck";

/**
 * 3.8 — the expense reserve: the draw-down, the hold, and conservation across a cycle boundary.
 *
 * ⛔ The invariant this file exists for: money set aside in cycle 1 must be GONE from cycle 1's spendable
 * AND reduce cycle 2's demand. Honour only the second and the model invents money.
 *
 * ⚠️ Rent is an EXAMPLE, never the case. Every fixture below carries THREE expenses across two due dates,
 * because a single-bill fixture cannot see the ordering question — and the order is the engine's own
 * (occurrences, sorted by due date), never a second one derived here.
 */

const R = (n: number) => Math.round(n * 100) / 100;

function assertMoney(actual: number, expected: number, label: string) {
	if (R(actual) !== R(expected)) throw new Error(`FAIL [${label}]: expected $${R(expected)}, got $${R(actual)}`);
}
function assertTrue(cond: boolean, label: string) {
	if (!cond) throw new Error(`FAIL [${label}]`);
}

const EXPENSES = [
	{ id: "rent", name: "Rent", amount: 350, dueDate: "2026-06-06", recurrence: "monthly" as const },
	{ id: "elec", name: "Electric", amount: 120, dueDate: "2026-06-09", recurrence: "monthly" as const },
	{ id: "nflx", name: "Netflix", amount: 30, dueDate: "2026-06-12", recurrence: "monthly" as const },
];

function alloc(over: Partial<Parameters<typeof allocatePaycheck>[0]> = {}) {
	return allocatePaycheck({
		paycheckAmount: 1200,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: EXPENSES,
		livingExpenses: [],
		debts: [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: 200,
		...over,
	});
}

type Result = ReturnType<typeof allocatePaycheck>;
const sum = (r: Result, cats: readonly AllocationCategory[]) => {
	const s = new Set<string>(cats);
	return r.allocations.filter((a) => s.has(a.category)).reduce((t, a) => t + a.amount, 0);
};
const discretionary = (r: Result) => Math.max(0, r.paycheckAmount - r.totalRequired - r.livingExpenseReserve);
const ALL_BUCKETS = [...PROTECTED_CUSHION_CATEGORIES, ...PUT_TO_WORK_CATEGORIES] as AllocationCategory[];

// ── inert by default: every pre-3.8 caller must be untouched ──────────────────
{
	const r = alloc();
	assertMoney(r.totalRequired, 500, "no reserve: required = 350+120+30");
	assertMoney(r.expenseReserveDrawn, 0, "no reserve: nothing drawn");
	assertMoney(r.expenseReserveHeld, 0, "no reserve: nothing held");
	assertMoney(sum(r, ALL_BUCKETS), discretionary(r), "no reserve: partition holds");
}

// ── THE DRAW: spans bills in the engine's own due-date order, across categories ──
{
	const r = alloc({ expenseReservePot: 400 });
	assertMoney(r.expenseReserveDrawn, 400, "draw: min(pot, demand)");
	assertMoney(r.totalRequired, 100, "draw: demand DROPS by exactly the draw");
	assertMoney(r.expenseReservePotAfterDraw, 0, "draw: pot emptied");
	assertMoney(sum(r, ALL_BUCKETS), discretionary(r), "draw: partition still holds");

	// Order, per occurrence: rent (350) absorbed first, then 50 of electric, nothing for netflix.
	assertMoney(r.allocations.find((a) => a.targetId === "rent")?.amount ?? -1, 0, "draw: rent owes the paycheck nothing");
	assertMoney(r.allocations.find((a) => a.targetId === "rent")?.reserveCovered ?? 0, 350, "draw: rent's reserve share is 350");
	assertMoney(r.allocations.find((a) => a.targetId === "elec")?.amount ?? -1, 70, "draw: electric owes 120−50");
	assertMoney(r.allocations.find((a) => a.targetId === "elec")?.reserveCovered ?? 0, 50, "draw: electric's reserve share is 50");
	assertMoney(r.allocations.find((a) => a.targetId === "nflx")?.amount ?? -1, 30, "draw: netflix untouched by the pot");
}

// ⛔ A bill the pot covers IN FULL must STILL produce a row — it is unpaid and the biller is still owed.
// Without this the best case of the whole feature deletes rent from Today and breaks the streak silently.
{
	const r = alloc({ expenseReservePot: 350 });
	const rent = r.allocations.find((a) => a.targetId === "rent");
	assertTrue(!!rent, "vanishing row: a fully covered bill still allocates a row");
	assertMoney(rent?.amount ?? -1, 0, "vanishing row: it contributes 0 from this paycheck");
	assertMoney(rent?.reserveCovered ?? 0, 350, "vanishing row: and names the reserve's 350");
	assertMoney((rent?.amount ?? 0) + (rent?.reserveCovered ?? 0), 350, "vanishing row: the two sum to the real bill");
}

// ── the pot never draws more than is owed ─────────────────────────────────────
{
	const r = alloc({ expenseReservePot: 900 });
	assertMoney(r.expenseReserveDrawn, 500, "over-funded: draws only the demand");
	assertMoney(r.totalRequired, 0, "over-funded: demand cleared");
	assertMoney(r.expenseReservePotAfterDraw, 400, "over-funded: the surplus stays in the pot");
}

// ── THE HOLD: gone from this cycle's spendable, floor first, clamped ──────────
{
	const held = alloc({ expenseReserveContribution: 175 });
	const none = alloc();
	assertMoney(held.expenseReserveHeld, 175, "hold: held 175");
	assertMoney(sum(held, ["expense_reserve"]), 175, "hold: its own bucket");
	assertMoney(sum(none, ["true_leftover"]) - sum(held, ["true_leftover"]), 175, "hold: leftover drops by exactly the hold");
	assertMoney(sum(held, ALL_BUCKETS), discretionary(held), "hold: partition holds");

	const over = alloc({ expenseReserveContribution: 99_999 });
	assertMoney(over.expenseReserveHeld, discretionary(over) - 200, "clamp: cannot hold more than is spare");
	assertMoney(sum(over, ["cushion_buffer"]), 200, "clamp: the FLOOR wins — reserving never breaches it");
	assertTrue(over.remaining >= 0, "clamp: remaining never goes negative");
	assertMoney(sum(over, ALL_BUCKETS), discretionary(over), "clamp: partition holds under the clamp");
}

// ── paying early must not orphan the pot ──────────────────────────────────────
{
	const r = alloc({
		expenses: [{ ...EXPENSES[0], isPaidThisCycle: true }, EXPENSES[1], EXPENSES[2]],
		expenseReservePot: 350,
	});
	assertMoney(r.expenseReserveDrawn, 350, "paid-early: the pot still discharges against a ticked bill");
}

// ── the on-plan streak: a pot-covered bill left unpaid is STILL an affordable skip ──
{
	assertMoney(alloc({ expenseReservePot: 350 }).affordableUnpaidRequiredCount, 3, "streak: pot-covered bills still count as skips");
	assertMoney(alloc().affordableUnpaidRequiredCount, 3, "streak: the pot buys no on-plan credit");
}

// ⛔ CONSERVATION ACROSS A CYCLE BOUNDARY — the invariant the whole item exists for.
{
	const c1 = alloc({ expenseReservePot: 0, expenseReserveContribution: 175 });
	const after1 = R(0 - c1.expenseReserveDrawn + c1.expenseReserveHeld);
	assertMoney(after1, 175, "conservation: cycle 1 leaves 175 in the pot");
	assertMoney(sum(c1, ["true_leftover"]), R(discretionary(c1) - 200 - 175), "conservation: and it is GONE from cycle 1's spendable");

	const c2 = alloc({ expenseReservePot: after1 });
	assertMoney(c2.expenseReserveDrawn, 175, "conservation: cycle 2 draws it");
	assertMoney(c2.totalRequired, 325, "conservation: cycle 2's demand falls 500 → 325");
	assertMoney(R(after1 - c2.expenseReserveDrawn + c2.expenseReserveHeld), 0, "conservation: nothing invented, nothing lost");
}

// ── the occurrence date is a CALENDAR date, not a UTC instant ─────────────────
// A weekly bill expands into occurrences whose due dates set the draw ORDER. `toISOString()` shifts them a
// day east of UTC, which silently changes which bill the pot pays.
{
	const r = alloc({
		expenses: [{ id: "wk", name: "Groceries", amount: 50, dueDate: "2026-06-02", recurrence: "weekly" as const }],
		expenseReservePot: 75,
	});
	assertMoney(r.expenseReserveDrawn, 75, "weekly: the pot draws across separate occurrences");
	assertMoney(r.totalRequired, 25, "weekly: 2 occurrences × 50 = 100, less the 75 drawn");
}

console.log("✅ 3.8 expense reserve: draw-down, hold, clamp, streak and conservation all hold.");
