import { hasFeatureAccess } from "../subscription/hasFeatureAccess";
import { premiumPlusOnlyFeatures, type PremiumFeature } from "../subscription/features";

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
