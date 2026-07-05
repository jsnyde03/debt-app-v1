import {
    readKey,
    readKeyValue,
    writeKey,
    getCorruptKeys,
    __setStorageForTests,
    __resetCorruptionForTests,
} from "../storage/safeStorage";
import { migrateState, CURRENT_SCHEMA_VERSION } from "../storage/migrateState";

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`FAIL [${msg}]`);
    console.log(`  ✓ ${msg}`);
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

// Minimal in-memory Storage so the pure read/write path is testable in Node
// (no window/localStorage here). Implements the bits safeStorage touches:
// getItem/setItem/removeItem/key/length/clear.
function createMemoryStorage(): Storage {
    const map = new Map<string, string>();
    return {
        get length() {
            return map.size;
        },
        clear() {
            map.clear();
        },
        getItem(key: string) {
            return map.has(key) ? (map.get(key) as string) : null;
        },
        key(index: number) {
            return Array.from(map.keys())[index] ?? null;
        },
        removeItem(key: string) {
            map.delete(key);
        },
        setItem(key: string, value: string) {
            map.set(key, String(value));
        },
    } as Storage;
}

const QUARANTINE_PREFIX = "debtPlanner.__corrupt__";

function quarantineEntries(storage: Storage, key: string): string[] {
    const out: string[] = [];
    const prefix = `${QUARANTINE_PREFIX}.${key}.`;
    for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
    }
    return out;
}

function fresh(): Storage {
    const storage = createMemoryStorage();
    __setStorageForTests(storage);
    __resetCorruptionForTests();
    return storage;
}

// --- readKey status matrix ---

function testAbsentKey() {
    fresh();
    const { value, status } = readKey<number[]>("debtPlanner.debts", []);
    assertEqual(value, [], "absent → returns fallback");
    assertEqual(status, "absent", "absent → status 'absent' (safe to persist)");
}

function testValidJson() {
    const storage = fresh();
    storage.setItem("debtPlanner.debts", JSON.stringify([{ id: "a" }]));
    const { value, status } = readKey<{ id: string }[]>("debtPlanner.debts", []);
    assertEqual(value, [{ id: "a" }], "valid → returns parsed value");
    assertEqual(status, "ok", "valid → status 'ok'");
}

function testCorruptJson() {
    const storage = fresh();
    const corruptRaw = '[{"id":"a"} OOPS not json';
    storage.setItem("debtPlanner.debts", corruptRaw);

    const { value, status } = readKey<unknown[]>("debtPlanner.debts", []);
    assertEqual(status, "corrupt", "corrupt → status 'corrupt'");
    assertEqual(value, [], "corrupt → returns the fallback");

    // The headline guarantee: the read itself NEVER overwrites the live key.
    assertEqual(
        storage.getItem("debtPlanner.debts"),
        corruptRaw,
        "corrupt → live key still holds the original bytes (not destroyed by the read)"
    );

    const quarantined = quarantineEntries(storage, "debtPlanner.debts");
    assertEqual(quarantined.length, 1, "corrupt → original quarantined exactly once");
    assertEqual(
        storage.getItem(quarantined[0]),
        corruptRaw,
        "corrupt → quarantine holds the exact original bytes"
    );
    assert(getCorruptKeys().includes("debtPlanner.debts"), "corrupt → key surfaced in corruption registry");
}

function testQuarantineDedupe() {
    const storage = fresh();
    storage.setItem("debtPlanner.debts", "{still broken");

    readKey("debtPlanner.debts", []);
    readKey("debtPlanner.debts", []);
    readKey("debtPlanner.debts", []);

    assertEqual(
        quarantineEntries(storage, "debtPlanner.debts").length,
        1,
        "re-reading the same corrupt bytes quarantines only once (no unbounded growth)"
    );
}

function testWriteReadRoundTrip() {
    fresh();
    writeKey("debtPlanner.goals", [{ id: "g1" }]);
    assertEqual(readKeyValue("debtPlanner.goals", []), [{ id: "g1" }], "writeKey → readKeyValue round-trips");
}

// --- headline regression: a corrupt debts blob must not become an empty array ---

function testCorruptDebtsNotWiped() {
    const storage = fresh();
    const realDebts = JSON.stringify([{ id: "card", balance: 4200 }]);
    // Simulate corruption of a real, populated debts blob.
    const corrupted = realDebts.slice(0, realDebts.length - 5); // truncated → invalid JSON
    storage.setItem("debtPlanner.debts", corrupted);

    // This mirrors what usePersistedState does on mount: read, and because the
    // status is 'corrupt', DO NOT persist the fallback back over the original.
    const { status } = readKey<unknown[]>("debtPlanner.debts", []);
    const shouldSkipPersist = status === "corrupt";
    assert(shouldSkipPersist, "corrupt debts → mount must skip the write-back");

    assert(
        storage.getItem("debtPlanner.debts") !== "[]",
        "corrupt debts → live key is NOT overwritten with an empty array (the headline bug stays fixed)"
    );
    assert(
        quarantineEntries(storage, "debtPlanner.debts").length === 1,
        "corrupt debts → the original (recoverable) copy is quarantined"
    );
}

// --- migrateState mechanism ---

function testMigrateStampsAbsentVersion() {
    const storage = fresh();
    storage.setItem("debtPlanner.debts", JSON.stringify([{ id: "a" }]));

    migrateState();

    assertEqual(
        readKeyValue<number>("debtPlanner.schemaVersion", 0),
        CURRENT_SCHEMA_VERSION,
        "no stored version → stamped forward to CURRENT_SCHEMA_VERSION"
    );
    assertEqual(
        readKeyValue("debtPlanner.debts", []),
        [{ id: "a" }],
        "migration leaves existing data intact"
    );
}

function testMigrateIsIdempotent() {
    const storage = fresh();
    writeKey("debtPlanner.schemaVersion", CURRENT_SCHEMA_VERSION);
    storage.setItem("debtPlanner.debts", JSON.stringify([{ id: "a" }]));

    migrateState(); // should be a no-op

    assertEqual(
        readKeyValue<number>("debtPlanner.schemaVersion", 0),
        CURRENT_SCHEMA_VERSION,
        "already-current version → idempotent (version unchanged)"
    );
    assertEqual(readKeyValue("debtPlanner.debts", []), [{ id: "a" }], "idempotent run leaves data intact");
}

export function runSafeStorageTests() {
    console.log("Running safe-storage tests...");

    testAbsentKey();
    testValidJson();
    testCorruptJson();
    testQuarantineDedupe();
    testWriteReadRoundTrip();
    testCorruptDebtsNotWiped();
    testMigrateStampsAbsentVersion();
    testMigrateIsIdempotent();

    // Don't leak the in-memory storage override into other test modules.
    __setStorageForTests(undefined);
    __resetCorruptionForTests();

    console.log("✅ All safe-storage tests passed.");
}

runSafeStorageTests();
