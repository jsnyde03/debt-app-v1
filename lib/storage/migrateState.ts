import { readKey, writeKey } from "@/lib/storage/safeStorage";
import type { Debt } from "@/lib/storage/debtPlannerStorage";

const DEBTS_KEY = "debtPlanner.debts";

// Backfill originalBalance on debts that predate the field. Without a positive
// originalBalance a debt is excluded from milestone tracking AND (historically)
// from the "all debts paid off" check, which could fire a false "Debt free!"
// celebration while a legacy debt was still owed. Anchor to the current balance
// — the best starting point recoverable for a pre-existing debt. Pure + exported
// for testing; the migration below applies it to persisted state.
export function withBackfilledOriginalBalance(debts: Debt[]): Debt[] {
    return debts.map((debt) => {
        const hasValidOriginal =
            typeof debt.originalBalance === "number" &&
            Number.isFinite(debt.originalBalance) &&
            debt.originalBalance > 0;
        return hasValidOriginal
            ? debt
            : { ...debt, originalBalance: debt.balance };
    });
}

function migrateDebtsOriginalBalance(): void {
    const { value: debts, status } = readKey<Debt[]>(DEBTS_KEY, []);
    if (status !== "ok" || !Array.isArray(debts) || debts.length === 0) {
        return;
    }
    const migrated = withBackfilledOriginalBalance(debts);
    const changed = migrated.some((debt, index) => debt !== debts[index]);
    if (changed) {
        writeKey(DEBTS_KEY, migrated);
    }
}

// Storage schema versioning + migration runner. This is purely the *mechanism*,
// landed before v1.5's first schema-affecting change (Pay Cycle History /
// "Track Your Journey") so that change can ship as a real migration rather than
// an ad-hoc parse. There are deliberately no migrations yet.
//
// Convention: MIGRATIONS[n] transforms persisted data from version n-1 to n.
// To add one: write the transform, register it under the next integer, and bump
// CURRENT_SCHEMA_VERSION. migrateState() runs them in order at startup and
// stamps the version forward.

const SCHEMA_VERSION_KEY = "debtPlanner.schemaVersion";

/** The schema version the current code expects. Bump when adding a migration. */
export const CURRENT_SCHEMA_VERSION = 2;

const MIGRATIONS: Record<number, () => void> = {
    // v1.5: backfill originalBalance so legacy debts are tracked and can't be
    // silently skipped by the debt-free check (see withBackfilledOriginalBalance).
    2: migrateDebtsOriginalBalance,
};

/**
 * Run any outstanding migrations and stamp the stored schema version forward.
 * Idempotent and safe to call once at startup before the first key read.
 * Existing installs with no version key are treated as version 0.
 */
export function migrateState(): void {
    const { value: stored, status } = readKey<number>(SCHEMA_VERSION_KEY, 0);
    let version = status === "ok" && Number.isFinite(stored) ? stored : 0;

    if (version >= CURRENT_SCHEMA_VERSION) return;

    while (version < CURRENT_SCHEMA_VERSION) {
        const next = version + 1;
        MIGRATIONS[next]?.();
        version = next;
    }

    writeKey(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
}
