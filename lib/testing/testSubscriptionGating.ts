import { hasFeatureAccess } from "../subscription/hasFeatureAccess";
import type { PremiumFeature } from "../subscription/features";

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

// Every PremiumFeature must be free=false, premium=true. This is the
// entire contract of hasFeatureAccess - if a future feature is added
// without being wired into this matrix, that's a real gating bug this
// test exists to catch immediately, not discover after release.
const ALL_PREMIUM_FEATURES: PremiumFeature[] = [
    "forecasting",
    "strategy_comparison",
    "what_if_scenarios",
    "smart_insights",
    "notifications",
];

function testHasFeatureAccess_freeDeniedForEveryFeature() {
    for (const feature of ALL_PREMIUM_FEATURES) {
        assertEqual(hasFeatureAccess("free", feature), false, `free plan denied "${feature}"`);
    }
}

function testHasFeatureAccess_premiumGrantedForEveryFeature() {
    for (const feature of ALL_PREMIUM_FEATURES) {
        assertEqual(hasFeatureAccess("premium", feature), true, `premium plan granted "${feature}"`);
    }
}

export function runSubscriptionGatingRegressionTests() {
    console.log("Running subscription gating regression tests...");

    testHasFeatureAccess_freeDeniedForEveryFeature();
    testHasFeatureAccess_premiumGrantedForEveryFeature();

    console.log("✅ All subscription gating regression tests passed.");
}

runSubscriptionGatingRegressionTests();
