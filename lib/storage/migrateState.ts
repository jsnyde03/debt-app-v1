import { readKey, writeKey } from "@/lib/storage/safeStorage";

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
export const CURRENT_SCHEMA_VERSION = 1;

const MIGRATIONS: Record<number, () => void> = {
    // 2: () => { /* v1.5 journey-data shape change lands here */ },
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
