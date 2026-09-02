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

/**
 * ⛔ **S1.13.7.10 — EVERY CATEGORY, CLASSIFIED — AND THE COMPILER KEEPS IT COMPLETE. [pass-6 `A3-15`]
 *
 * `DISCRETIONARY_BUCKETS` used to be `[...PROTECTED, ...PUT_TO_WORK]` — **the subject derived from the
 * object**. So the reconciliation asserted that the union of two lists equals the union of two lists, and
 * a category in NEITHER list was invisible to it: it simply was not in `DISCRETIONARY_BUCKETS` either.
 * `allocatePaycheck.ts:70-77` states the claim this was supposed to enforce — *"a category in neither
 * list silently breaks the partition"* — and for `optional_goal`, **every savings goal in the app**, no
 * such guard existed.
 *
 * ⚠️ ** A `Record<AllocationCategory, ...>` is exhaustive by construction: adding a member to the union
 * fails `typecheck:core` right here until somebody says which side it belongs on. That is the same
 * compiler-as-gate move `ENTITY_NOUN` earned, and it is the only shape that cannot go one short.
 */
const CATEGORY_SIDE: Record<AllocationCategory, "protected" | "put-to-work" | "obligation"> = {
	expense: "obligation",
	minimum_debt: "obligation",
	autopay_expense: "obligation",
	autopay_debt: "obligation",
	cushion_buffer: "protected",
	prefunded_reserve: "protected",
	expense_reserve: "protected",
	discovery_holdback: "protected",
	true_leftover: "protected",
	starter_emergency: "put-to-work",
	emergency: "put-to-work",
	snowball: "put-to-work",
	optional_goal: "put-to-work",
};

const DISCRETIONARY_BUCKETS = (Object.keys(CATEGORY_SIDE) as AllocationCategory[]).filter(
	(c) => CATEGORY_SIDE[c] !== "obligation",
);

{
	// ⛔ [`A3-15`] The two published lists must MATCH the classification above, in both directions. This is the
	// assertion the old derived set could not make: a category dropped from a list, or added to the union
	// and forgotten, reds here rather than silently leaving the partition.
	const inList = new Set<string>([...PROTECTED_CUSHION_CATEGORIES, ...PUT_TO_WORK_CATEGORIES]);
	for (const c of DISCRETIONARY_BUCKETS) {
		if (!inList.has(c)) {
			throw new Error(
				`FAIL [A3-15]: "${c}" is discretionary but is in NEITHER PROTECTED_CUSHION_CATEGORIES nor ` +
					"PUT_TO_WORK_CATEGORIES — the partition silently drops it, which is what allocatePaycheck's own note warns about",
			);
		}
	}
	for (const c of PROTECTED_CUSHION_CATEGORIES) {
		if (CATEGORY_SIDE[c] !== "protected") throw new Error(`FAIL [A3-15]: "${c}" is listed PROTECTED but classified ${CATEGORY_SIDE[c]}`);
	}
	for (const c of PUT_TO_WORK_CATEGORIES) {
		if (CATEGORY_SIDE[c] !== "put-to-work") throw new Error(`FAIL [A3-15]: "${c}" is listed PUT_TO_WORK but classified ${CATEGORY_SIDE[c]}`);
	}
	if (inList.size !== DISCRETIONARY_BUCKETS.length) {
		throw new Error(`FAIL [A3-15]: the two lists hold ${inList.size} categories, the classification says ${DISCRETIONARY_BUCKETS.length}`);
	}
}

function alloc({ paycheckAmount, required = 0, living = 0, buffer = 0, debtBalance = 0, discoveryFrac = 0, coldStartFrac = 0, prefunded = 0, variableRequired = 0, variableFrac = 0 }: {
	paycheckAmount: number;
	required?: number;
	living?: number;
	buffer?: number;
	debtBalance?: number;
	discoveryFrac?: number;
	coldStartFrac?: number;
	prefunded?: number;
	/** A `variable`-flagged required obligation (for the §2.5 variable-bill buffer). */
	variableRequired?: number;
	variableFrac?: number;
}) {
	return allocatePaycheck({
		paycheckAmount,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [
			...(required > 0 ? [{ id: "e1", name: "Rent", amount: required, dueDate: "2026-06-05", recurrence: "monthly" as const, isPaidThisCycle: false }] : []),
			...(variableRequired > 0 ? [{ id: "ev", name: "Electric", amount: variableRequired, dueDate: "2026-06-06", recurrence: "monthly" as const, isPaidThisCycle: false, expenseType: "variable" as const }] : []),
		],
		livingExpenses: living > 0 ? [{ id: "l1", name: "Groceries", amount: living, enabled: true }] : [],
		debts: debtBalance > 0 ? [{ id: "d1", name: "Visa", balance: debtBalance, minimumPayment: 0, apr: 20, dueDate: "2026-06-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false }] : [],
		goals: [],
		strategy: "snowball",
		paycheckBuffer: buffer,
		discoveryHoldbackFraction: discoveryFrac,
		coldStartHoldbackFraction: coldStartFrac,
		variableBillBufferFraction: variableFrac,
		prefundedReserve: prefunded,
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

// ── §2.0.b holdback WIRED INTO the allocation (2.4.6.1.3): it dampens deploy + stays protected ──
{
	// Discovery holdback 40% of above-floor headroom. discretionary 750, floor 200 → aboveFloor 550 →
	// held 220 → snowball 330 (dampened from 550). The partition invariant must still hold.
	const r = alloc({ paycheckAmount: 2000, required: 850, living: 400, buffer: 200, debtBalance: 5000, discoveryFrac: 0.4 });
	assertMoney(sumBuckets(r, ["discovery_holdback"]), 220, "holdback: discovery_holdback = 40% of above-floor headroom (550) = 220");
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), discretionaryOf(r), "holdback: buckets STILL sum to discretionary");
	assertMoney(sumBuckets(r, ["snowball"]), 330, "holdback: deploy DAMPENED (550 → 330)");
	assertMoney(sumBuckets(r, PROTECTED_CUSHION_CATEGORIES), 420, "holdback: held cash counts as PROTECTED (200 buffer + 220 held)");
}
{
	// discovery + cold-start compose by MAX, not sum: max(40%, 25%) of 550 = 220 (not 357.5).
	const r = alloc({ paycheckAmount: 2000, required: 850, living: 400, buffer: 200, debtBalance: 5000, discoveryFrac: 0.4, coldStartFrac: 0.25 });
	assertMoney(sumBuckets(r, ["discovery_holdback"]), 220, "holdback: discovery + cold-start compose by MAX (220), not sum");
}
{
	// A prefunded reserve ADDS to the uncertainty hold (2.4.7.6: now its OWN bucket, split from discovery).
	// aboveFloor 550, prefunded 100 (prefunded_reserve) + max(40%×550)=220 (discovery_holdback) = 320 held.
	const r = alloc({ paycheckAmount: 2000, required: 850, living: 400, buffer: 200, debtBalance: 5000, discoveryFrac: 0.4, prefunded: 100 });
	assertMoney(sumBuckets(r, ["prefunded_reserve"]), 100, "holdback: prefunded gets its OWN bucket (2.4.7.6 split)");
	assertMoney(sumBuckets(r, ["discovery_holdback"]), 220, "holdback: discovery is the remainder (220, not lumped with prefunded)");
	assertMoney(sumBuckets(r, PROTECTED_CUSHION_CATEGORIES), 520, "holdback: protected = buffer 200 + prefunded 100 + discovery 220 (snowball gets the remaining 230)");
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), discretionaryOf(r), "holdback+prefunded: buckets still sum to discretionary");
}
{
	// No deploy target (no debt) → the held reserve + true_leftover both land on the protected side.
	const r = alloc({ paycheckAmount: 2000, required: 850, living: 400, buffer: 200, discoveryFrac: 0.4 });
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), 750, "holdback/no-deploy: buckets sum to discretionary");
	assertMoney(sumBuckets(r, PROTECTED_CUSHION_CATEGORIES), 750, "holdback/no-deploy: all of it protected (buffer + held + leftover)");
	assertMoney(sumBuckets(r, PUT_TO_WORK_CATEGORIES), 0, "holdback/no-deploy: nothing put to work");
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

// ── §2.5 variable-bill buffer (2.5.3b): composes into the uncertainty `max`, never stacked ──
assertMoney(
	combinedHoldback({ prefundedReserve: 0, discoveryHoldback: 0, coldStartHoldback: 0, variableBuffer: 30, discretionary: 1000, floor: 200 }),
	30,
	"variable buffer alone → held (30)"
);
assertMoney(
	combinedHoldback({ prefundedReserve: 0, discoveryHoldback: 200, coldStartHoldback: 0, variableBuffer: 30, discretionary: 1000, floor: 200 }),
	200,
	"variable buffer composes by MAX with discovery — not stacked (200, never 230)"
);
assertMoney(
	combinedHoldback({ prefundedReserve: 0, discoveryHoldback: 10, coldStartHoldback: 0, variableBuffer: 30, discretionary: 1000, floor: 200 }),
	30,
	"variable buffer wins the max when it's the larger reason (30 > discovery 10)"
);
{
	// Integration: a premium variable buffer (0.15) holds 15% of the variable bill ($200) as protected
	// cushion, reducing the deploy by exactly that much. Partition invariant holds.
	const r = alloc({ paycheckAmount: 2000, required: 850, variableRequired: 200, living: 400, buffer: 200, debtBalance: 5000, variableFrac: 0.15 });
	assertMoney(discretionaryOf(r), 550, "variable buffer: discretionary = 2000 − (850+200) − 400");
	assertMoney(sumBuckets(r, ["discovery_holdback"]), 30, "variable buffer held as protected cushion (200 × 0.15)");
	assertMoney(sumBuckets(r, ["snowball"]), 320, "deploy reduced by the $30 variable buffer (550 − 200 buffer floor − 30)");
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), discretionaryOf(r), "variable buffer: buckets still sum to discretionary");
}
{
	// Not stacked: with a large discovery reserve live, the variable buffer is absorbed by the max.
	const r = alloc({ paycheckAmount: 2000, required: 850, variableRequired: 200, living: 400, buffer: 200, debtBalance: 5000, variableFrac: 0.15, discoveryFrac: 0.4 });
	// remaining after the $200 floor = 350; discovery = 350×0.4 = 140; variableBuffer = 30 → held = max = 140.
	assertMoney(sumBuckets(r, ["discovery_holdback"]), 140, "held = max(discovery 140, variable 30) — variable absorbed, not 170");
	assertMoney(sumBuckets(r, ["snowball"]), 210, "deploy = 350 − 140 (the larger reserve), not 350 − 170");
}
{
	// A variable bill with the fraction off (free tier / no buffer) holds nothing extra.
	const r = alloc({ paycheckAmount: 2000, required: 850, variableRequired: 200, living: 400, buffer: 200, debtBalance: 5000, variableFrac: 0 });
	assertMoney(sumBuckets(r, ["discovery_holdback"]), 0, "no variable buffer when the fraction is 0 (free undampened)");
}

// ── §2.5 surplus-waterfall re-arch (2.4.7.6): starter EF before debt · fuller EF after · gate ──
const EF = (currentAmount: number, targetAmount: number) => [{ id: "ef", name: "EF", currentAmount, targetAmount, type: "emergency" as const }];
function allocEF(o: { paycheckAmount: number; debtBalance?: number; goals: ReturnType<typeof EF>; skipStarter?: boolean }) {
	return allocatePaycheck({
		paycheckAmount: o.paycheckAmount,
		currentDate: "2026-06-01",
		nextPaycheckDate: "2026-06-15",
		expenses: [],
		livingExpenses: [],
		debts: o.debtBalance ? [{ id: "d1", name: "Visa", balance: o.debtBalance, minimumPayment: 0, apr: 20, dueDate: "2026-06-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false }] : [],
		goals: o.goals,
		strategy: "snowball",
		paycheckBuffer: 0,
		skipStarterEmergency: o.skipStarter,
	});
}
{
	// Starter EF ($1000 cap) funds BEFORE debt; the remainder goes to the snowball.
	const r = allocEF({ paycheckAmount: 2000, debtBalance: 5000, goals: EF(0, 3000) });
	assertMoney(sumBuckets(r, ["starter_emergency"]), 1000, "starter EF funds the $1000 cap before debt");
	assertMoney(sumBuckets(r, ["snowball"]), 1000, "debt gets the remainder AFTER the starter EF (not before)");
	assertMoney(sumBuckets(r, ["emergency"]), 0, "no fuller EF (paycheck exhausted by starter + debt)");
	assertMoney(sumBuckets(r, DISCRETIONARY_BUCKETS), discretionaryOf(r), "starter split: buckets sum to discretionary");
}
{
	// The D5.3 gate (savings elsewhere) → SKIP the starter, deploy straight to debt.
	const r = allocEF({ paycheckAmount: 2000, debtBalance: 5000, goals: EF(0, 3000), skipStarter: true });
	assertMoney(sumBuckets(r, ["starter_emergency"]), 0, "gate: no starter EF when savings are elsewhere");
	assertMoney(sumBuckets(r, ["snowball"]), 2000, "gate: everything deploys to debt first");
}
{
	// Full waterfall: starter EF → small debt → fuller EF (the remainder) → leftover; the two EF tranches
	// never over-fund past the target.
	const r = allocEF({ paycheckAmount: 5000, debtBalance: 500, goals: EF(0, 3000) });
	assertMoney(sumBuckets(r, ["starter_emergency"]), 1000, "waterfall: starter EF $1000 before debt");
	assertMoney(sumBuckets(r, ["snowball"]), 500, "waterfall: debt paid after the starter");
	assertMoney(sumBuckets(r, ["emergency"]), 2000, "waterfall: fuller EF finishes the goal AFTER debt (3000 − 1000 starter)");
	assertMoney(sumBuckets(r, ["starter_emergency", "emergency"]), 3000, "the two EF tranches never over-fund past the target");
	assertMoney(sumBuckets(r, ["true_leftover"]), 1500, "genuine leftover after the full waterfall");
}
{
	// EF already past the starter cap → starter funds 0; the rest funds after debt.
	const r = allocEF({ paycheckAmount: 5000, debtBalance: 500, goals: EF(1500, 3000) });
	assertMoney(sumBuckets(r, ["starter_emergency"]), 0, "already above the $1000 starter → no pre-debt EF");
	assertMoney(sumBuckets(r, ["emergency"]), 1500, "fuller EF tops up the remaining 1500 after debt");
}

console.log("✅ Guardian partition + holdback-clamp tests passed.");
