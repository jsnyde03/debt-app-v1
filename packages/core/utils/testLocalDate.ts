import { getNextPaycheckDate } from "@core/payCycle/getNextPaycheckDate";
import { advanceDueDateOnce, rolloverRequiredExpenses } from "@core/recurrence/rolloverPayCycle";
import type { RequiredExpense } from "@core/storage/debtPlannerStorage";

import { parseLocalDate, toLocalISODate, todayLocalISODate } from "./localDate";

/**
 * Calendar dates must not depend on the reader's timezone.
 *
 * ⚠️ THIS TEST HAS TO RUN IN MORE THAN ONE ZONE OR IT PROVES NOTHING. The defect it guards is
 * DIRECTIONAL: `toISOString().slice(0, 10)` is correct for most of a day west of UTC and wrong east of
 * it, so a suite pinned to one zone — CI's UTC, a US laptop — passes over the bug for every user in
 * Europe, Asia and Australia. The zone list below is the whole instrument.
 *
 * ⚠️ `process.env.TZ` is assigned at RUNTIME rather than via the launch environment. Measured on the
 * dev machine: a runtime assignment takes effect immediately, while `TZ=… node …` through Git Bash is
 * dropped entirely (the host zone survived it) — so the launch form would have run every case in one
 * zone and reported four passes. The original TZ is restored in a `finally`, because the regression
 * runner imports this module alongside every other suite and a leaked zone would silently re-time them.
 */

function assertEqual<T>(actual: T, expected: T, label: string) {
	if (actual !== expected) {
		throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
	}
}

/** Deliberately straddles UTC: two zones ahead (one past the dateline), two behind. */
const ZONES = [
	"Pacific/Kiritimati", // UTC+14 — the furthest ahead any user can be
	"Australia/Sydney", // UTC+10/+11
	"UTC",
	"America/Los_Angeles", // UTC-7/-8
	"Pacific/Midway", // UTC-11 — the furthest behind
];

function expense(overrides: Partial<RequiredExpense>): RequiredExpense {
	return {
		id: "e",
		name: "Rent",
		amount: 1000,
		dueDate: "2026-01-31",
		recurrence: "monthly",
		isPaidThisCycle: true,
		...overrides,
	};
}

const originalTZ = process.env.TZ;
try {
	for (const zone of ZONES) {
		process.env.TZ = zone;

		// Guard the guard: if a platform ever stops honouring a runtime TZ change, every case below
		// silently collapses into the host zone and the suite reports five passes for one measurement.
		if (zone !== "UTC" && new Date(2026, 7, 12).getTimezoneOffset() === 0) {
			throw new Error(`TZ did not take effect for ${zone} — this suite would be measuring one zone five times.`);
		}

		// ── the owner itself ────────────────────────────────────────────────────
		assertEqual(toLocalISODate(new Date(2026, 7, 12)), "2026-08-12", `${zone}: local midnight keeps its own day`);
		assertEqual(toLocalISODate(new Date(2026, 7, 12, 23, 59, 59)), "2026-08-12", `${zone}: last second of the day`);
		assertEqual(toLocalISODate(new Date(2026, 0, 1)), "2026-01-01", `${zone}: new year's day`);
		assertEqual(toLocalISODate(parseLocalDate("2026-08-12")), "2026-08-12", `${zone}: parse → format round-trips`);
		assertEqual(parseLocalDate("2026-08-12").getDate(), 12, `${zone}: parse lands on the named day`);
		assertEqual(todayLocalISODate(), toLocalISODate(new Date()), `${zone}: today agrees with the formatter`);

		// ── the pay-cycle boundary (L5-9) ───────────────────────────────────────
		assertEqual(
			getNextPaycheckDate({ payCycle: "biweekly", currentDate: "2026-08-12" }),
			"2026-08-26",
			`${zone}: biweekly payday`,
		);
		assertEqual(
			getNextPaycheckDate({ payCycle: "weekly", currentDate: "2026-08-12" }),
			"2026-08-19",
			`${zone}: weekly payday`,
		);
		assertEqual(
			getNextPaycheckDate({ payCycle: "monthly", currentDate: "2026-08-12", monthlyPayDay: 1 }),
			"2026-09-01",
			`${zone}: monthly payday rolls to next month`,
		);
		assertEqual(
			getNextPaycheckDate({ payCycle: "semimonthly", currentDate: "2026-08-12", semiMonthlyFirstDay: 1, semiMonthlySecondDay: 15 }),
			"2026-08-15",
			`${zone}: semi-monthly picks the next day in the month`,
		);

		// ── the rollover (L0-2's worst site: the error re-applies every cycle) ──
		assertEqual(advanceDueDateOnce("2026-01-31", "monthly", 31), "2026-02-28", `${zone}: monthly rollover clamps to Feb`);
		assertEqual(advanceDueDateOnce("2026-08-12", "biweekly"), "2026-08-26", `${zone}: biweekly rollover`);
		const rolled = rolloverRequiredExpenses([expense({ dueDate: "2026-08-31", recurrence: "monthly" })], "2026-09-15");
		assertEqual(rolled[0]?.dueDate, "2026-09-30", `${zone}: rolled expense keeps its calendar day`);

		// A year of rollovers must not drift. This is the compounding half — a single-step assertion
		// passes on an implementation that loses a day every cycle.
		let due = "2026-01-15";
		for (let i = 0; i < 12; i++) due = advanceDueDateOnce(due, "monthly", 15);
		assertEqual(due, "2027-01-15", `${zone}: twelve monthly rollovers land on the same day-of-month`);
	}
} finally {
	if (originalTZ === undefined) delete process.env.TZ;
	else process.env.TZ = originalTZ;
}

console.log(`✅ localDate: calendar dates hold across ${ZONES.join(", ")}`);
