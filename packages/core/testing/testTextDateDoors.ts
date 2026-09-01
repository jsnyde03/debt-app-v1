import { parseDebtCsvText } from "@core/imports/debtCsv";
import { parseStatementText } from "@core/scan/parseStatementText";
import { isRealCalendarDate, parseLocalDate, toLocalISODate } from "@core/utils/localDate";

/**
 * ⛔ **S1.13.7.8 [pass-6 blocker `A3-12`] — EVERY DOOR THAT TURNS TEXT INTO A STORED DATE, OVER A DAY
 * THAT DOES NOT EXIST.**
 *
 * ⚡ **This asserts the CLASS, not the member that was reported.** The finding named the scan parser.
 * The reason it was worth a blocker is that the identical check already existed at the CSV door, written
 * by `P6.8.9.7.4` with a comment naming `2026-02-30` by name — and it had not travelled. A test that
 * named `parseStatementText` would close the finding and leave the next door open, which is the shape
 * this whole sub-step exists to stop. `DOORS` is the population; adding a third text→date entry point
 * without adding it here is the only way past this file.
 *
 * ⚠️ **`2026-02-30` is not a `NaN`, and that is what makes it a blocker rather than a nuisance.**
 * `parseLocalDate("2026-02-30")` **succeeds** and returns **March 2** — the debt leaves the cycle it is
 * due in, `totalRequired` reads `$0`, and the app offers a whole paycheck to the snowball with the
 * minimum still owed. A loud failure would have been the kinder outcome, which is why the CSV door's own
 * comment predicting `NaN` understates its own hazard.
 *
 * ⛔ **The OPPOSITE direction is asserted on the same list.** A guard that refuses everything passes the
 * rejection half perfectly; `ACCEPTED` is the control, and `2026-02-29` is on it because 2026 is not a
 * leap year while 2028 is — a check that hard-codes 28 for February reds here.
 */

let passed = 0;

function assert(cond: boolean, label: string) {
	if (!cond) throw new Error(`FAIL [${label}]`);
	passed++;
	console.log(`  ✓ ${label}`);
}

function eq<T>(actual: T, expected: T, label: string) {
	assert(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

/**
 * A door is `(dateText) => the ISO date that would be STORED, or undefined if the door refused it`.
 *
 * ⚠️ Each one is driven through its real public entry point — the CSV door through `parseDebtCsvText`
 * with a complete row, the scan door through `parseStatementText` over statement-shaped text. A helper
 * that called `toIsoDate` directly would be testing a private function rather than the door, and
 * `toIsoDate` is not exported precisely because the door is the unit that matters.
 */
const DOORS: { name: string; store: (dateText: string) => string | undefined }[] = [
	{
		name: "CSV import (parseDebtCsvText)",
		store: (dateText) => {
			const r = parseDebtCsvText(`name,balance,minimumPayment,apr,dueDate\nVisa,2400,75,19.99,${dateText}`, {
				makeId: () => "id-1",
			});
			return r.debts[0]?.dueDate;
		},
	},
	{
		name: "statement scan (parseStatementText)",
		store: (dateText) =>
			parseStatementText(`Chase\nBalance $1,240.00\nMinimum Payment Due $45.00\nPayment Due Date ${dateText}\n`)
				.dueDate,
	},
];

/**
 * ⚠️ Written per door, because the two doors read different date GRAMMARS: the CSV column is ISO by
 * contract, the scan door reads what a US statement prints. The *class* being asserted is the calendar
 * check, so each impossible day is spelled the way its own door would receive it.
 */
const IMPOSSIBLE: Record<string, string[]> = {
	"CSV import (parseDebtCsvText)": ["2026-02-30", "2026-04-31", "2026-02-31", "2026-13-01", "2026-06-31"],
	"statement scan (parseStatementText)": ["02/30/2026", "04/31/2026", "February 31, 2026", "06/31/2026"],
};

const ACCEPTED: Record<string, [string, string][]> = {
	"CSV import (parseDebtCsvText)": [
		["2026-02-28", "2026-02-28"],
		["2028-02-29", "2028-02-29"],
		["2026-12-31", "2026-12-31"],
	],
	"statement scan (parseStatementText)": [
		["02/28/2026", "2026-02-28"],
		["02/29/2028", "2028-02-29"],
		["December 31, 2026", "2026-12-31"],
	],
};

export function runTextDateDoorTests() {
	console.log("\n📅 text → stored date: every door refuses a day that does not exist\n");

	for (const door of DOORS) {
		for (const bad of IMPOSSIBLE[door.name]) {
			const stored = door.store(bad);
			eq(stored, undefined, `${door.name}: "${bad}" is refused, not rolled into the next month`);
		}
		for (const [input, iso] of ACCEPTED[door.name]) {
			eq(door.store(input), iso, `${door.name}: "${input}" is a real day and still imports`);
		}
	}

	{
		// ⛔ The reason the class is a blocker and not a nuisance: the rolled value is a VALID date object,
		// so nothing downstream can tell it from a date the user meant. Asserted here so that a future
		// reader who removes the checks above can see what they were buying.
		const rolled = toLocalISODate(parseLocalDate("2026-02-30"));
		eq(rolled, "2026-03-02", "an impossible day parses SUCCESSFULLY into the following month — no NaN to catch");
		assert(!isRealCalendarDate("2026-02-30"), "…which is exactly what isRealCalendarDate exists to say no to");
		assert(isRealCalendarDate("2026-03-02"), "…while the real day it rolls to is accepted");
		assert(!isRealCalendarDate("2026-2-3"), "an unpadded value is refused on shape before the calendar is asked");
	}

	console.log(`\n✅ text → date doors: ${passed} assertions passed\n`);
}

runTextDateDoorTests();
