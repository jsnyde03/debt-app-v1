import { withBackfilledOriginalBalance } from "./migrateState";
import type { Debt } from "./debtPlannerStorage";

function assert(condition: boolean, label: string) {
    if (!condition) {
        throw new Error(`${label} failed.`);
    }
}

function debt(overrides: Partial<Debt>): Debt {
    return {
        id: "d",
        name: "Card",
        balance: 500,
        minimumPayment: 25,
        dueDate: "2026-01-15",
        apr: 20,
        type: "debt",
        recurrence: "monthly",
        ...overrides,
    };
}

function runBackfillTests() {
    const input: Debt[] = [
        debt({ id: "legacy", balance: 800, originalBalance: undefined }),
        debt({ id: "keep", balance: 300, originalBalance: 1000 }),
        debt({ id: "zeroed", balance: 0, originalBalance: undefined }),
    ];
    const out = withBackfilledOriginalBalance(input);

    assert(out[0].originalBalance === 800, "missing originalBalance backfilled to current balance");
    assert(out[1].originalBalance === 1000, "existing originalBalance preserved");
    assert(out[1] === input[1], "unchanged debt keeps its identity (so the migration skips a needless rewrite)");
    assert(out[2].originalBalance === 0, "paid-off legacy debt anchored to its (zero) balance");

    // A non-finite/invalid originalBalance is treated as missing and re-anchored.
    const invalid = withBackfilledOriginalBalance([
        debt({ id: "nan", balance: 400, originalBalance: Number.NaN }),
    ]);
    assert(invalid[0].originalBalance === 400, "NaN originalBalance re-anchored to balance");

    console.log("✅ originalBalance backfill regression tests passed.");
}

runBackfillTests();
