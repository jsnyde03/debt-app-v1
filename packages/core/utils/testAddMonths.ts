import { projectDebtPayoff } from "@core/debt/projectDebtPayoff";
import { advanceDueDateOnce } from "@core/recurrence/rolloverPayCycle";
import type { Debt } from "@core/storage/debtPlannerStorage";

import { addMonthsISO, addMonthsToDate } from "./addMonths";

/**
 * The month step must CLAMP, and the pin is on the month a user is shown.
 *
 * ⚠️ Asserting the helper alone would not have caught this. The clamp already existed and was already
 * tested when the Progress screen was naming a month one later than the plan it came from — what was
 * missing was the CALL. So the load-bearing case here is `projectDebtPayoff` reached through its public
 * signature with a start date on the 31st, which is the state a user paid on the last of the month is
 * in for seven months of the year. It fails on the original defect and passes on the fix.
 *
 * The direction matters and is asserted, not just the inequality: overflow is always FORWARD, so the
 * defect only ever tells someone their debt-free month is later than it is.
 */

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
	}
}

function debt(overrides: Partial<Debt> = {}): Debt {
	return {
		id: "d1",
		name: "Card",
		balance: 100,
		minimumPayment: 100,
		dueDate: "2026-01-31",
		apr: 0,
		type: "debt",
		recurrence: "monthly",
		...overrides,
	};
}

// ── the helper ──────────────────────────────────────────────────────────────
// Jan 31 is the canonical case: every shorter target month is a chance to overflow forward.
assertEqual(addMonthsISO("2026-01-31", 1), "2026-02-28", "Jan 31 + 1mo clamps to Feb 28");
assertEqual(addMonthsISO("2024-01-31", 1), "2024-02-29", "leap February clamps to the 29th");
assertEqual(addMonthsISO("2026-01-31", 3), "2026-04-30", "Jan 31 + 3mo clamps to Apr 30");
assertEqual(addMonthsISO("2026-01-31", 12), "2027-01-31", "a full year keeps the 31st");
assertEqual(addMonthsISO("2026-01-15", 1), "2026-02-15", "a day every month carries is untouched");
assertEqual(addMonthsISO("2026-03-31", -1), "2026-02-28", "stepping BACKWARDS clamps too");
assertEqual(addMonthsISO("2026-12-31", 1), "2027-01-31", "the step crosses a year boundary");
assertEqual(addMonthsISO("2026-01-31", 0), "2026-01-31", "a zero step is identity");

// `anchorDay` is what stops a date that has passed through a short month from staying there.
assertEqual(addMonthsISO("2026-02-28", 1, 31), "2026-03-31", "the anchor restores the 31st");
assertEqual(addMonthsISO("2026-02-28", 1), "2026-03-28", "without an anchor the short month persists");

// The input must not be mutated — every caller here is inside a loop that reuses its start date.
const source = new Date(2026, 0, 31);
addMonthsToDate(source, 1);
assertEqual(source.getMonth(), 0, "addMonthsToDate leaves its argument alone");
assertEqual(source.getDate(), 31, "addMonthsToDate leaves its argument's day alone");

// ── the rollover path still behaves, now that it delegates ──────────────────
assertEqual(advanceDueDateOnce("2026-01-31", "monthly"), "2026-02-28", "monthly rollover clamps");
assertEqual(advanceDueDateOnce("2026-02-28", "monthly", 31), "2026-03-31", "rollover honours the anchor");
assertEqual(advanceDueDateOnce("2026-01-31", "quarterly"), "2026-04-30", "quarterly rollover clamps");
assertEqual(advanceDueDateOnce("2024-02-29", "annually"), "2025-02-28", "annual rollover clamps a leap day");

// ── the date a user is actually shown ───────────────────────────────────────
// One debt cleared by its own minimum in a single month. Overflowed, Jan 31 + 1 lands on Mar 3 and
// `formatMonthYear` prints the whole three-day slip as a different month.
const oneMonth = projectDebtPayoff({
	debts: [debt()],
	monthlyExtraPayment: 0,
	strategy: "snowball",
	startDate: "2026-01-31",
});
assertEqual(oneMonth.monthsToDebtFree, 1, "the fixture clears in one month");
assertEqual(
	oneMonth.estimatedDebtFreeDate,
	"February 2026",
	"a 31st payer clearing in one month is told February, not March"
);

// Three months, so the slip crosses into a month with a different number of days (Apr 31 -> May 1).
const threeMonths = projectDebtPayoff({
	debts: [debt({ balance: 300 })],
	monthlyExtraPayment: 0,
	strategy: "snowball",
	startDate: "2026-01-31",
});
assertEqual(threeMonths.monthsToDebtFree, 3, "the fixture clears in three months");
assertEqual(
	threeMonths.estimatedDebtFreeDate,
	"April 2026",
	"a 31st payer clearing in three months is told April, not May"
);

// The 29th and 30th reach only February, and both are shown as March when unclamped.
for (const day of ["29", "30"]) {
	const result = projectDebtPayoff({
		debts: [debt()],
		monthlyExtraPayment: 0,
		strategy: "snowball",
		startDate: `2026-01-${day}`,
	});
	assertEqual(result.estimatedDebtFreeDate, "February 2026", `the ${day}th reaches February`);
}

// A start day every month carries must be unaffected by the fix — the clamp is not allowed to move a
// date that was already right.
const midMonth = projectDebtPayoff({
	debts: [debt()],
	monthlyExtraPayment: 0,
	strategy: "snowball",
	startDate: "2026-01-15",
});
assertEqual(midMonth.estimatedDebtFreeDate, "February 2026", "a mid-month start is unchanged");

console.log("✅ addMonths clamp regression passed");
