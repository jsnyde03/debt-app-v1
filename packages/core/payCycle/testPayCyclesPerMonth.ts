import { payCyclesPerMonth } from "./payCyclesPerMonth";

function assertClose(actual: number, expected: number, label: string) {
    if (Math.abs(actual - expected) > 1e-9) {
        throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
    }
}
function assert(cond: boolean, label: string) {
    if (!cond) throw new Error(`${label} failed.`);
}

function runPayCyclesPerMonthTests() {
    // ─── true annual-count / 12 ───
    assertClose(payCyclesPerMonth("weekly"), 52 / 12, "weekly = 52/12");
    assertClose(payCyclesPerMonth("biweekly"), 26 / 12, "biweekly = 26/12");
    assertClose(payCyclesPerMonth("semimonthly"), 2, "semimonthly = 2");
    assertClose(payCyclesPerMonth("monthly"), 1, "monthly = 1");

    // ─── regression: the ~8% understatement the old `weekly?4 : monthly?1 : 2`
    //     caused on the default biweekly cadence. A $200/paycheck biweekly extra
    //     is $433.33/mo, NOT the old 2× = $400. ───
    assertClose(200 * payCyclesPerMonth("biweekly"), 433.3333333333, "biweekly monthly-equiv (was understated at 400)");
    assert(payCyclesPerMonth("weekly") > 4, "weekly must exceed the old 4");
    assert(payCyclesPerMonth("biweekly") > 2, "biweekly must exceed the old 2");

    console.log("✅ payCyclesPerMonth regression tests passed.");
}

runPayCyclesPerMonthTests();
