import { computeAffordability } from "./affordability";

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	}
	console.log(`  ✓ ${label}`);
}

function runAffordabilityTests() {
	console.log("Running affordability (2.9) tests...");

	// Discretionary $600, floor $200.
	// Comfortable: purchase leaves cushion at/above the floor.
	const comf = computeAffordability(600, 300, 200);
	assertEqual(comf.verdict, "comfortable", "$300 of $600 (floor $200) → comfortable (cushion $300 ≥ floor)");
	assertEqual(comf.cushionAfter, 300, "…cushion after = $300");
	assertEqual(comf.shortBy, 0, "…nothing short");

	// Exactly at the floor is still comfortable (cushion === floor).
	assertEqual(computeAffordability(600, 400, 200).verdict, "comfortable", "cushion exactly at the floor ($200) → comfortable");

	// Tight: dips below the floor but bills still covered.
	const tight = computeAffordability(600, 500, 200);
	assertEqual(tight.verdict, "tight", "$500 of $600 → tight (cushion $100 < floor $200)");
	assertEqual(tight.cushionAfter, 100, "…cushion after = $100");

	// Short: exceeds the discretionary headroom entirely.
	const short = computeAffordability(600, 750, 200);
	assertEqual(short.verdict, "short", "$750 of $600 → short");
	assertEqual(short.shortBy, 150, "…short by $150");
	assertEqual(short.cushionAfter, 0, "…cushion floored at 0 (the gap is reported via shortBy)");

	// A zero floor: only comfortable vs short (no tight band).
	assertEqual(computeAffordability(600, 600, 0).verdict, "comfortable", "floor 0: spending all discretionary → comfortable");
	assertEqual(computeAffordability(600, 601, 0).verdict, "short", "floor 0: a dollar over → short");

	// Guards: non-finite / negative discretionary degrade to 0 (any purchase is short).
	assertEqual(computeAffordability(NaN, 100, 200).verdict, "short", "NaN discretionary → treated as 0 → short");
	assertEqual(computeAffordability(0, 50, 200).verdict, "short", "no discretionary → any purchase is short");

	console.log("✅ Affordability (2.9) tests passed.");
}

runAffordabilityTests();
