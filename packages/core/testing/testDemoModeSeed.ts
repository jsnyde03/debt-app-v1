import { applyDemoPlannerStateToStorage } from "./seedPlannerState";

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

// Minimal in-memory Storage (same shape as testSafeStorage's) so the pure
// seed path is testable in Node without window/localStorage.
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

// The bug this guards against: entering Demo Mode forced the theme to LIGHT
// (buildDemoPlannerState().darkMode === false was written to debtPlanner.darkMode,
// which useDarkMode reads as the "light" preference), overriding Auto/System.
// Demo Mode is a DATA showcase and must NOT touch the user's theme choice.

function testFreshEntryLeavesThemeUnset() {
    const storage = createMemoryStorage();
    // No theme key at all (before useDarkMode has run / a truly clean slate).
    applyDemoPlannerStateToStorage(storage);

    assertEqual(
        storage.getItem("debtPlanner.darkMode"),
        null,
        "no prior theme → darkMode left UNSET (useDarkMode then falls back to 'system'/Auto, not forced light)"
    );
}

function testSystemDefaultIsPreserved() {
    const storage = createMemoryStorage();
    // The real-world case: useDarkMode has already persisted the "system" default
    // by the time the user taps the demo CTA.
    storage.setItem("debtPlanner.darkMode", JSON.stringify("system"));

    applyDemoPlannerStateToStorage(storage);

    assertEqual(
        storage.getItem("debtPlanner.darkMode"),
        JSON.stringify("system"),
        "prior 'system' → preserved verbatim (demo loads on Auto/System)"
    );
}

function testExplicitDarkChoiceIsPreserved() {
    const storage = createMemoryStorage();
    storage.setItem("debtPlanner.darkMode", JSON.stringify("dark"));

    applyDemoPlannerStateToStorage(storage);

    assertEqual(
        storage.getItem("debtPlanner.darkMode"),
        JSON.stringify("dark"),
        "prior explicit 'dark' → preserved (NOT clobbered back to light)"
    );
}

function testLegacyBooleanChoiceIsPreserved() {
    const storage = createMemoryStorage();
    // Legacy shape: an old install could still hold a boolean preference.
    storage.setItem("debtPlanner.darkMode", JSON.stringify(true));

    applyDemoPlannerStateToStorage(storage);

    assertEqual(
        storage.getItem("debtPlanner.darkMode"),
        JSON.stringify(true),
        "prior legacy boolean true → preserved as-is (honors the explicit choice)"
    );
}

function testNeverForcesLightUnconditionally() {
    const storage = createMemoryStorage();
    storage.setItem("debtPlanner.darkMode", JSON.stringify("dark"));

    applyDemoPlannerStateToStorage(storage);

    assert(
        storage.getItem("debtPlanner.darkMode") !== JSON.stringify(false),
        "demo seed must never write a forced boolean false (the original light-mode bug)"
    );
}

function testDemoDataStillSeeds() {
    const storage = createMemoryStorage();
    applyDemoPlannerStateToStorage(storage);

    assertEqual(
        storage.getItem("debtPlanner.isDemoMode"),
        JSON.stringify(true),
        "demo flag still set (reorder didn't break the seed)"
    );
    assert(
        JSON.parse(storage.getItem("debtPlanner.debts") ?? "[]").length > 0,
        "sample debts still seeded"
    );
    assert(
        storage.getItem("debtPlanner.amount") === JSON.stringify("1950"),
        "sample paycheck still seeded"
    );
}

export function runDemoModeSeedTests() {
    console.log("Running demo-mode seed tests...");

    testFreshEntryLeavesThemeUnset();
    testSystemDefaultIsPreserved();
    testExplicitDarkChoiceIsPreserved();
    testLegacyBooleanChoiceIsPreserved();
    testNeverForcesLightUnconditionally();
    testDemoDataStillSeeds();

    console.log("✅ All demo-mode seed tests passed.");
}

runDemoModeSeedTests();
