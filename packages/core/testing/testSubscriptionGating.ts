/**
 * ⛔ **S1.13.7.10 — WHAT THIS SUITE COVERS, AND WHAT IT DOES NOT. [pass-6 `A3-16`]
 *
 * ⛔ **It tests a gating mechanism `apps/rn` does not use.** Measured:
 * `grep -rn "hasFeatureAccess\|PremiumFeature" apps/rn/src` returns **zero lines**. The shipping app
 * gates with a plain boolean on the store — `store.subscriptionPlan === 'premium'`, at 11 non-test sites.
 * Everything below imports from `@/lib/subscription/...`, the **legacy root tree `P6.11` deletes**.
 *
 * ⚠️ **It is read as more than it is, and that is why this note exists.** `test:regression` runs inside
 * `validate:release:rn`, and this is the only suite in that gate whose subject is *"what does a paying
 * user get"* — so a reviewer counting subscription coverage counts evidence about a surface that is being
 * removed. **It proves the legacy matrix is internally consistent. It proves nothing about the shipping
 * app's paywall.**
 *
 * ⛔ **NOT deleted here, deliberately.** It is live coverage of a tree that is still compiled and executed
 * by `typecheck:core` and `test:regression` (class X, `D3-1`), and deleting it is `P6.11`'s call, not this
 * step's. The RN-side gap — no test anywhere asserts the 11 real `subscriptionPlan === 'premium'` sites —
 * is filed to `P6.11` beside `D3-2`.
 */
import { hasFeatureAccess } from "@/lib/subscription/hasFeatureAccess";
import { premiumPlusOnlyFeatures, type PremiumFeature } from "@/lib/subscription/features";

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

// Every PremiumFeature must be wired into the free/premium/premium_plus
// matrix. If a future feature is added without being listed here, that's a
// real gating bug this test exists to catch immediately, not discover after
// release.
const ALL_PREMIUM_FEATURES: PremiumFeature[] = [
    "forecasting",
    "strategy_comparison",
    "what_if_scenarios",
    "smart_insights",
    "pay_cycle_history",
    "unlimited_history",
    "amortization_schedule",
];

// Free gets nothing.
function testHasFeatureAccess_freeDeniedForEveryFeature() {
    for (const feature of ALL_PREMIUM_FEATURES) {
        assertEqual(hasFeatureAccess("free", feature), false, `free plan denied "${feature}"`);
    }
}

// Premium gets everything EXCEPT the Premium+-exclusive features.
function testHasFeatureAccess_premiumGrantedExceptPremiumPlusOnly() {
    for (const feature of ALL_PREMIUM_FEATURES) {
        const expected = !premiumPlusOnlyFeatures.includes(feature);
        assertEqual(hasFeatureAccess("premium", feature), expected, `premium plan ${expected ? "granted" : "denied"} "${feature}"`);
    }
}

// Premium+ gets everything.
function testHasFeatureAccess_premiumPlusGrantedForEveryFeature() {
    for (const feature of ALL_PREMIUM_FEATURES) {
        assertEqual(hasFeatureAccess("premium_plus", feature), true, `premium_plus plan granted "${feature}"`);
    }
}

// Guard against the premiumPlusOnlyFeatures list silently emptying - the
// tier split is the whole point of the v1.5 gating work.
function testPremiumPlusOnlyFeaturesAreActuallyExclusive() {
    for (const feature of premiumPlusOnlyFeatures) {
        assertEqual(hasFeatureAccess("premium", feature), false, `premium denied Premium+-only "${feature}"`);
        assertEqual(hasFeatureAccess("premium_plus", feature), true, `premium_plus granted "${feature}"`);
    }
}

export function runSubscriptionGatingRegressionTests() {
    console.log("Running subscription gating regression tests...");

    testHasFeatureAccess_freeDeniedForEveryFeature();
    testHasFeatureAccess_premiumGrantedExceptPremiumPlusOnly();
    testHasFeatureAccess_premiumPlusGrantedForEveryFeature();
    testPremiumPlusOnlyFeaturesAreActuallyExclusive();

    console.log("✅ All subscription gating regression tests passed.");
}

runSubscriptionGatingRegressionTests();
