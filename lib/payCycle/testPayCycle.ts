import { getNextPaycheckDate } from "./getNextPaycheckDate";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function runPayCycleTests() {
    assertEqual(
        getNextPaycheckDate({
            payCycle: "weekly",
            currentDate: "2026-05-01",
        }),
        "2026-05-08",
        "weekly next paycheck"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "biweekly",
            currentDate: "2026-05-01",
        }),
        "2026-05-15",
        "biweekly next paycheck"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "monthly",
            currentDate: "2026-05-01",
            monthlyPayDay: 15,
        }),
        "2026-05-15",
        "monthly upcoming same month paycheck"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "monthly",
            currentDate: "2026-05-16",
            monthlyPayDay: 15,
        }),
        "2026-06-15",
        "monthly next month paycheck"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "monthly",
            currentDate: "2026-02-01",
            monthlyPayDay: 31,
        }),
        "2026-02-28",
        "monthly payday clamps to last day of month"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "semimonthly",
            currentDate: "2026-05-01",
            semiMonthlyFirstDay: 1,
            semiMonthlySecondDay: 15,
        }),
        "2026-05-15",
        "semi-monthly skips current day and finds next payday"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "semimonthly",
            currentDate: "2026-05-16",
            semiMonthlyFirstDay: 1,
            semiMonthlySecondDay: 15,
        }),
        "2026-06-01",
        "semi-monthly rolls to next month"
    );

    assertEqual(
        getNextPaycheckDate({
            payCycle: "semimonthly",
            currentDate: "2026-02-15",
            semiMonthlyFirstDay: 15,
            semiMonthlySecondDay: 31,
        }),
        "2026-02-28",
        "semi-monthly second payday clamps in February"
    );

    console.log("✅ Pay cycle regression tests passed.");
}

runPayCycleTests();
