import { computeCycleDelta } from "./computeCycleDelta";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function snap(totalDebtBalance: number) {
    return { totalDebtBalance };
}

function runComputeCycleDeltaTests() {
    // No previous snapshot -> render nothing.
    assertEqual(computeCycleDelta(null, 5000), null, "no previous snapshot -> null");
    assertEqual(computeCycleDelta(undefined, 5000), null, "undefined previous snapshot -> null");

    // Debt fell since last cycle -> down.
    const down = computeCycleDelta(snap(5000), 4580);
    assertEqual(down?.direction, "down", "debt reduced -> down");
    assertEqual(down?.amount, 420, "down amount is the positive difference");

    // Debt rose (e.g. interest outran payment) -> up.
    const up = computeCycleDelta(snap(5000), 5120);
    assertEqual(up?.direction, "up", "debt increased -> up");
    assertEqual(up?.amount, 120, "up amount is the positive difference");

    // No change -> render nothing.
    assertEqual(computeCycleDelta(snap(5000), 5000), null, "no change -> null");

    // Sub-cent change rounds to 0 -> nothing.
    assertEqual(computeCycleDelta(snap(5000), 4999.997), null, "sub-cent change -> null");

    // Cents are preserved.
    const cents = computeCycleDelta(snap(5000.5), 4900.25);
    assertEqual(cents?.amount, 100.25, "cent-level delta preserved");

    console.log("✅ Cycle delta regression tests passed.");
}

runComputeCycleDeltaTests();
