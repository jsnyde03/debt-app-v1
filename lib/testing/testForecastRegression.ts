import { getForecastStatus } from "../forecast/getForecastStatus";
import { projectForecast } from "../forecast/projectForecast";

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

function assertApprox(actual: number, expected: number, msg: string, tolerance = 0.01) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`FAIL [${msg}]: expected ~${expected}, got ${actual}`);
    }
    console.log(`  ✓ ${msg}`);
}

// --- getForecastStatus ---

function testForecastStatus_negativeIsRecovery() {
    assertEqual(getForecastStatus(-1), "recovery", "negative safe cash = recovery");
    assertEqual(getForecastStatus(-100), "recovery", "deeply negative = recovery");
}

function testForecastStatus_zeroIsPressure() {
    // boundary: <0 is recovery, 0 is pressure (not recovery)
    assertEqual(getForecastStatus(0), "pressure", "exactly 0 is pressure (not recovery)");
}

function testForecastStatus_upTo99IsPressure() {
    assertEqual(getForecastStatus(1), "pressure", "1 is pressure");
    assertEqual(getForecastStatus(99), "pressure", "99 is pressure");
    assertEqual(getForecastStatus(99.99), "pressure", "99.99 is pressure");
}

function testForecastStatus_100IsTight() {
    // boundary: <100 is pressure, 100 is tight (not pressure)
    assertEqual(getForecastStatus(100), "tight", "exactly 100 is tight (not pressure)");
}

function testForecastStatus_upTo199IsTight() {
    assertEqual(getForecastStatus(101), "tight", "101 is tight");
    assertEqual(getForecastStatus(199), "tight", "199 is tight");
    assertEqual(getForecastStatus(199.99), "tight", "199.99 is tight");
}

function testForecastStatus_200IsStable() {
    // boundary: <200 is tight, 200 is stable
    assertEqual(getForecastStatus(200), "stable", "exactly 200 is stable (not tight)");
}

function testForecastStatus_above200IsStable() {
    assertEqual(getForecastStatus(201), "stable", "201 is stable");
    assertEqual(getForecastStatus(1000), "stable", "large value is stable");
}

// --- projectForecast ---

function testProjectForecast_returnsCorrectMonthCount() {
    const result = projectForecast({
        startingSafeCash: 300,
        startingDebtBalance: 5000,
        monthlyDebtReduction: 200,
        months: 3,
    });
    assertEqual(result.length, 3, "returns exactly as many months as requested");
}

function testProjectForecast_zeroMonthsReturnsEmpty() {
    const result = projectForecast({
        startingSafeCash: 300,
        startingDebtBalance: 5000,
        monthlyDebtReduction: 200,
        months: 0,
    });
    assertEqual(result.length, 0, "zero months returns empty array");
}

function testProjectForecast_debtBalanceDecreasesByMonthlyReduction() {
    const result = projectForecast({
        startingSafeCash: 500,
        startingDebtBalance: 6000,
        monthlyDebtReduction: 300,
        months: 3,
    });
    assertApprox(result[0].projectedDebtBalance, 5700, "month 1: debt reduced by 300");
    assertApprox(result[1].projectedDebtBalance, 5400, "month 2: debt reduced by another 300");
    assertApprox(result[2].projectedDebtBalance, 5100, "month 3: debt reduced by another 300");
}

function testProjectForecast_debtCannotGoBelowZero() {
    const result = projectForecast({
        startingSafeCash: 500,
        startingDebtBalance: 100,
        monthlyDebtReduction: 500,
        months: 3,
    });
    assertEqual(result[0].projectedDebtBalance, 0, "debt floors at zero when overpaid");
    assertEqual(result[1].projectedDebtBalance, 0, "debt stays at zero in subsequent months");
    assertEqual(result[2].projectedDebtBalance, 0, "debt stays at zero in subsequent months");
}

function testProjectForecast_safeCashStartingValueHoldsWithNoTrend() {
    const result = projectForecast({
        startingSafeCash: 150,
        startingDebtBalance: 2000,
        monthlyDebtReduction: 100,
        months: 3,
        bufferTrendPerMonth: 0,
    });
    assertApprox(result[0].projectedSafeCash, 150, "month 1 safe cash = starting value when trend=0");
    assertApprox(result[1].projectedSafeCash, 150, "month 2 safe cash unchanged with zero trend");
    assertApprox(result[2].projectedSafeCash, 150, "month 3 safe cash unchanged with zero trend");
}

function testProjectForecast_bufferTrendIncreasesSafeCash() {
    const result = projectForecast({
        startingSafeCash: 50,
        startingDebtBalance: 3000,
        monthlyDebtReduction: 100,
        months: 3,
        bufferTrendPerMonth: 30,
    });
    // index 0: 50 + 30*0 = 50; index 1: 50 + 30*1 = 80; index 2: 50 + 30*2 = 110
    assertApprox(result[0].projectedSafeCash, 50, "month 1: no trend applied yet (index=0)");
    assertApprox(result[1].projectedSafeCash, 80, "month 2: +30 from trend");
    assertApprox(result[2].projectedSafeCash, 110, "month 3: +60 from trend");
}

function testProjectForecast_statusReflectsSafeCashThresholds() {
    // starts in recovery, improves with trend
    const result = projectForecast({
        startingSafeCash: -50,
        startingDebtBalance: 5000,
        monthlyDebtReduction: 200,
        months: 3,
        bufferTrendPerMonth: 100,
    });
    // month 1: -50 + 0*100 = -50 → recovery
    // month 2: -50 + 1*100 = 50 → pressure
    // month 3: -50 + 2*100 = 150 → tight
    assertEqual(result[0].status, "recovery", "month 1 at -50 is recovery");
    assertEqual(result[1].status, "pressure", "month 2 at 50 is pressure");
    assertEqual(result[2].status, "tight", "month 3 at 150 is tight");
}

function testProjectForecast_stableStatus() {
    const result = projectForecast({
        startingSafeCash: 250,
        startingDebtBalance: 2000,
        monthlyDebtReduction: 100,
        months: 1,
    });
    assertEqual(result[0].status, "stable", "starting at 250 yields stable status");
}

function testProjectForecast_eachMonthHasRequiredFields() {
    const result = projectForecast({
        startingSafeCash: 300,
        startingDebtBalance: 5000,
        monthlyDebtReduction: 200,
        months: 2,
    });
    for (const month of result) {
        if (!month.monthLabel || typeof month.monthLabel !== "string") {
            throw new Error(`FAIL: month missing monthLabel`);
        }
        if (typeof month.projectedSafeCash !== "number") {
            throw new Error(`FAIL: month missing projectedSafeCash`);
        }
        if (typeof month.projectedDebtBalance !== "number") {
            throw new Error(`FAIL: month missing projectedDebtBalance`);
        }
        if (!month.status) {
            throw new Error(`FAIL: month missing status`);
        }
        if (!month.recommendedAction) {
            throw new Error(`FAIL: month missing recommendedAction`);
        }
    }
    console.log("  ✓ every forecast month has all required fields");
}

export function runForecastRegressionTests() {
    console.log("Running forecast regression tests...");

    testForecastStatus_negativeIsRecovery();
    testForecastStatus_zeroIsPressure();
    testForecastStatus_upTo99IsPressure();
    testForecastStatus_100IsTight();
    testForecastStatus_upTo199IsTight();
    testForecastStatus_200IsStable();
    testForecastStatus_above200IsStable();

    testProjectForecast_returnsCorrectMonthCount();
    testProjectForecast_zeroMonthsReturnsEmpty();
    testProjectForecast_debtBalanceDecreasesByMonthlyReduction();
    testProjectForecast_debtCannotGoBelowZero();
    testProjectForecast_safeCashStartingValueHoldsWithNoTrend();
    testProjectForecast_bufferTrendIncreasesSafeCash();
    testProjectForecast_statusReflectsSafeCashThresholds();
    testProjectForecast_stableStatus();
    testProjectForecast_eachMonthHasRequiredFields();

    console.log("✅ All forecast regression tests passed.");
}

runForecastRegressionTests();
