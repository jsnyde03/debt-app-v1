import { parseDebtCsvText } from "./debtCsv";

/**
 * P6.8.7g.1 (audit C8) — the CSV import parser.
 *
 * ⛔ **THIS TEST IS THE RESCUE.** The parser's only caller was `lib/hooks/useDebts.ts`, in the Capacitor
 * tree P6.11 deletes. Without a consumer here, that deletion would take a shipped feature's behaviour
 * with it silently — nothing would go red, and the support FAQ would still promise a CSV import. With
 * this file registered in the regression runner, removing the module or breaking it fails the gate by
 * name.
 *
 * ⚠️ **The money rows are the ones worth reading.** A bank export writes `1,200` and `$1,200`, and
 * `Number()` reads both as `NaN` — the same class of defect the forms shipped before B1. They are pinned
 * as ACCEPTED. The APR row is pinned as a REFUSAL for the opposite reason: an unreadable rate that
 * quietly becomes 0% produces a wrong plan, which outlives a skipped row.
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

/** Ids are the caller's job, so the test mints countable ones and checks they are what came back. */
function counter() {
	let n = 0;
	const make = () => `id-${++n}`;
	return { make, count: () => n };
}

function parse(text: string) {
	const ids = counter();
	const result = parseDebtCsvText(text, { makeId: ids.make });
	return { ...result, idsMinted: ids.count() };
}

const HEADER = "name,balance,minimumPayment,apr,dueDate";

function runDebtCsvTests() {
	console.log("Running CSV debt import (C8) tests...");

	// ── the happy path, and the shape the FAQ documents ──
	{
		const r = parse(`${HEADER}\nVisa,2400,75,19.99,2026-09-01`);
		eq(r.errors.length, 0, "a clean row reports no errors");
		eq(r.debts.length, 1, "a clean row produces one debt");
		eq(r.debts[0].name, "Visa", "name");
		eq(r.debts[0].balance, 2400, "balance");
		eq(r.debts[0].originalBalance, 2400, "originalBalance mirrors balance on import");
		eq(r.debts[0].minimumPayment, 75, "minimumPayment");
		eq(r.debts[0].apr, 19.99, "apr");
		eq(r.debts[0].dueDate, "2026-09-01", "dueDate");
		eq(r.debts[0].originalDueDate, "2026-09-01", "originalDueDate anchors the imported due date");
		eq(r.debts[0].type, "debt", "type defaults to debt");
		eq(r.debts[0].recurrence, "monthly", "recurrence defaults to monthly");
		eq(r.debts[0].minimumPaidThisCycle, false, "an imported debt is not already paid");
		eq(r.debts[0].snowballPaidThisCycle, false, "an imported debt carries no snowball payment");
	}

	// ── ids come from the caller: the parser mints none of its own ──
	{
		const r = parse(`${HEADER}\nVisa,2400,75,19.99,2026-09-01\nCard,900,40,0,2026-09-05`);
		eq(r.idsMinted, 2, "makeId is called once per accepted row");
		eq(r.debts[0].id, "id-1", "the first debt carries the caller's first id");
		eq(r.debts[1].id, "id-2", "the second debt carries the caller's second id");
	}
	{
		// A rejected row must NOT consume an id, or the caller's derived sequence gains holes.
		const r = parse(`${HEADER}\n,2400,75,19.99,2026-09-01\nCard,900,40,0,2026-09-05`);
		eq(r.idsMinted, 1, "a skipped row mints no id");
		eq(r.debts[0].id, "id-1", "the accepted row still gets the first id");
	}

	// ── headers are matched case- and space-insensitively ──
	{
		const r = parse("  Name , BALANCE ,MinimumPayment, APR ,DueDate\nVisa,2400,75,19.99,2026-09-01");
		eq(r.debts.length, 1, "an oddly-cased header row still maps its columns");
		eq(r.debts[0].balance, 2400, "balance found under a differently-cased header");
	}

	// ── quoting: a comma inside quotes is data, and "" is a literal quote ──
	{
		const r = parse(`${HEADER}\n"Chase, Freedom",2400,75,19.99,2026-09-01`);
		eq(r.debts[0].name, "Chase, Freedom", "a quoted field keeps its comma");
	}
	{
		const r = parse(`${HEADER}\n"He said ""hi""",2400,75,19.99,2026-09-01`);
		eq(r.debts[0].name, 'He said "hi"', "a doubled quote is one literal quote");
	}

	// ── MONEY: a grouped or symbol-prefixed amount is READ, not refused ──
	{
		const r = parse(`${HEADER}\nVisa,"1,200",75,19.99,2026-09-01`);
		eq(r.errors.length, 0, "a grouped balance is accepted");
		eq(r.debts[0].balance, 1200, '"1,200" reads as 1200, not NaN');
	}
	{
		const r = parse(`${HEADER}\nVisa,$1200,$75,19.99,2026-09-01`);
		eq(r.debts[0].balance, 1200, "a currency symbol on the balance is stripped");
		eq(r.debts[0].minimumPayment, 75, "a currency symbol on the minimum is stripped");
	}

	// ── MONEY: an unreadable amount is refused, and the message does not blame the wrong thing ──
	{
		const r = parse(`${HEADER}\nVisa,abc,75,19.99,2026-09-01`);
		eq(r.debts.length, 0, "an unreadable balance is refused");
		// ⚠️ The assertion is about what the message LEADS WITH, not about which words it avoids. The old
		// message for this input was "balance must be greater than 0" — true of nothing the user typed,
		// and it sends them to edit a number that parsed fine as text. Stating the requirement after the
		// read failure is useful; stating it INSTEAD is the defect.
		assert(r.errors[0].startsWith("Row 2: could not read balance"), "the error leads with the READ failure");
		assert(r.errors[0].includes('"abc"'), "the error quotes the cell it could not read");
	}
	{
		const r = parse(`${HEADER}\nVisa,,75,19.99,2026-09-01`);
		assert(r.errors[0].includes("balance is required"), "a BLANK balance is reported as missing, not unreadable");
	}
	{
		const r = parse(`${HEADER}\nVisa,0,75,19.99,2026-09-01`);
		eq(r.debts.length, 0, "a zero balance is refused");
	}
	{
		const r = parse(`${HEADER}\nVisa,-50,75,19.99,2026-09-01`);
		eq(r.debts.length, 0, "a negative balance is refused");
	}
	{
		const r = parse(`${HEADER}\nVisa,2400,0,19.99,2026-09-01`);
		eq(r.debts.length, 0, "a zero minimum is refused");
	}

	// ── APR: blank means 0%, unreadable STOPS the row ──
	{
		const r = parse(`${HEADER}\nVisa,2400,75,,2026-09-01`);
		eq(r.errors.length, 0, "a blank APR is a real answer");
		eq(r.debts[0].apr, 0, "a blank APR is 0%");
	}
	{
		const r = parse(`${HEADER}\nVisa,2400,75,abc,2026-09-01`);
		eq(r.debts.length, 0, "an unreadable APR refuses the row rather than defaulting to 0%");
		assert(r.errors[0].includes("could not read APR"), "the error names the APR");
	}
	{
		const r = parse(`${HEADER}\nVisa,2400,75,150,2026-09-01`);
		eq(r.debts.length, 0, "an out-of-range APR is refused");
		assert(r.errors[0].includes("between 0 and 100"), "an out-of-range APR reports its RANGE, not unreadability");
	}

	// ── required fields ──
	{
		const r = parse(`${HEADER}\n,2400,75,19.99,2026-09-01`);
		assert(r.errors[0].includes("name is required"), "a missing name is named");
	}
	{
		const r = parse(`${HEADER}\nVisa,2400,75,19.99,`);
		assert(r.errors[0].includes("dueDate is required"), "a missing dueDate is named");
	}

	// ── the row number is the one the user sees in a spreadsheet, header included ──
	{
		const r = parse(`${HEADER}\nVisa,2400,75,19.99,2026-09-01\n,900,40,0,2026-09-05`);
		assert(r.errors[0].startsWith("Row 3:"), "the second data row is Row 3");
	}

	// ── an unsupported type or cadence is refused rather than coerced ──
	{
		const r = parse("name,balance,minimumPayment,apr,dueDate,type\nVisa,2400,75,19.99,2026-09-01,mortgage");
		eq(r.debts.length, 0, "an unknown type is refused");
		assert(r.errors[0].includes("debt or bnpl"), "the type error names the accepted values");
	}
	{
		const r = parse("name,balance,minimumPayment,apr,dueDate,recurrence\nVisa,2400,75,19.99,2026-09-01,quarterly");
		eq(r.debts.length, 0, "a cadence outside the debt set is refused");
	}

	// ── BNPL: the installment fields are canonical, and balance/minimum are DERIVED from them ──
	{
		const r = parse(
			"name,balance,minimumPayment,apr,dueDate,type,remainingPayments,scheduledPaymentAmount\n" +
				"Affirm,999,999,0,2026-09-01,bnpl,4,50",
		);
		eq(r.debts.length, 1, "an installment-native BNPL imports");
		eq(r.debts[0].balance, 200, "balance is reconciled to scheduled × remaining");
		eq(r.debts[0].minimumPayment, 50, "minimumPayment is reconciled to the scheduled installment");
		eq(r.debts[0].remainingPayments, 4, "remainingPayments survives");
		eq(r.debts[0].scheduledPaymentAmount, 50, "scheduledPaymentAmount survives");
	}
	{
		const r = parse(
			"name,balance,minimumPayment,apr,dueDate,type,remainingPayments,scheduledPaymentAmount\n" +
				"Visa,2400,75,19.99,2026-09-01,debt,4,50",
		);
		eq(r.debts[0].balance, 2400, "a plain debt is not reconciled against installment columns");
		eq(r.debts[0].remainingPayments, undefined, "a plain debt drops remainingPayments");
		eq(r.debts[0].scheduledPaymentAmount, undefined, "a plain debt drops scheduledPaymentAmount");
	}

	// ── a partially valid file imports what it can, which is what the FAQ promises ──
	{
		const r = parse(
			`${HEADER}\nVisa,2400,75,19.99,2026-09-01\n,900,40,0,2026-09-05\nCard,600,30,0,2026-09-09`,
		);
		eq(r.debts.length, 2, "the readable rows import");
		eq(r.errors.length, 1, "the unreadable row is reported");
		eq(r.debts[1].name, "Card", "a skipped row does not consume the row after it");
	}

	// ── a file with no data rows says so, rather than importing nothing silently ──
	{
		const r = parse(HEADER);
		eq(r.debts.length, 0, "a header-only file imports nothing");
		eq(r.errors.length, 1, "a header-only file reports why");
	}
	{
		const r = parse("");
		eq(r.errors.length, 1, "an empty file reports why");
	}

	// ── blank lines and CRLF endings are not data ──
	{
		const r = parse(`${HEADER}\r\nVisa,2400,75,19.99,2026-09-01\r\n\r\n`);
		eq(r.debts.length, 1, "CRLF endings and trailing blank lines do not produce phantom rows");
		eq(r.errors.length, 0, "a trailing blank line is not an error");
	}

	// ── [C8 · P6.8.9.7.4] The three the finding undercounted, after already undercounting by three ──
	//
	// ⛔ C8 said "rescue the parser". The rescue found DOM `File`, `crypto.randomUUID` and `Number()` money.
	// The verification pass, told to look for a fourth, found three more. **An enumeration that came up
	// short once came up short again**, which is this repo's most-measured result.
	{
		// ⛔ THE APR THE USER ACTUALLY TYPES. The reject path stripped `%`; the accept path did not — so a
		// correct rate was refused with "APR must be between 0 and 100", a message that is FALSE of 19.99
		// and sends the user to change a value that was already right.
		const r = parse(`${HEADER}\nVisa,2400,75,19.99%,2026-09-01`);
		eq(r.errors.length, 0, "an APR written with a percent sign imports cleanly");
		eq(r.debts[0]?.apr, 19.99, "…and keeps its value");
	}
	// ── [P6.8.9.7.11.4] THE BLAST RADIUS OF THE FIX ABOVE ──
	//
	// ⛔ Stripping every `%` and handing the rest to `parseOptionalAmount` — whose blank contract is
	// `return 0` — turned two unreadable cells into a **silent 0% and a silent 12%**. A wrong PLAN, which
	// is the outcome this file forbids in its own comments, written BY the fix for the opposite defect.
	// ⚡ The accept path and the reject path simply swapped which one was wrong.
	{
		const r = parse(`${HEADER}\nVisa,2400,75,%,2026-09-01`);
		eq(r.debts.length, 0, "an APR cell of just '%' is unreadable, NOT a blank 0%");
		assert(
			r.errors.some((e) => e.includes("could not read APR")),
			"…and it is reported as unreadable, not as out of range — `Number('')` is 0, which chose the false message",
		);
	}
	{
		const r = parse(`${HEADER}\nVisa,2400,75,1%2,2026-09-01`);
		eq(r.debts.length, 0, "a `%` INSIDE the number does not silently concatenate to 12%");
	}
	// ⛔ [P6.8.9.7.11.9 · C-2] `%` IS ONE OF FOUR CHARACTERS THAT CAN EMPTY THE CELL. `parseOptionalAmount`'s
	// `normalize` also strips `,`, whitespace and `$`, and its blank contract returns `0` — so guarding only
	// the `%` case left `"$"` and `","` importing as a silent 0% on a card that charges interest.
	/**
	 * ⛔ **ASSERT THE REASON, NOT THE REFUSAL — the first version of these did not.** [P6.8.9.7.11.10 · B-J1-2]
	 * `eq(r.debts.length, 0)` is satisfied by a row refused for ANY reason, and a cell containing a comma
	 * shifts every later column, so `","` and `"$,"` were refused for a **missing dueDate** while the APR
	 * was never reached. All four assertions passed with the fix reverted and the defect fully present.
	 *
	 * ⚠️ Whitespace stays out of the list on purpose: a cell of only spaces is indistinguishable from an
	 * empty one, and blank is a real answer (0%). `$` and `,` are characters someone typed deliberately.
	 * The comma cases are quoted so the CSV keeps its shape and the APR column is what is actually tested.
	 */
	for (const [cell, csv] of [["$", "$"], [",", '","'], ["$,", '"$,"']] as const) {
		const r = parse(`${HEADER}\nVisa,2400,75,${csv},2026-09-01`);
		eq(r.debts.length, 0, `an APR cell of "${cell}" is unreadable, NOT a blank 0%`);
		assert(
			r.errors.some((e) => e.includes("could not read APR")),
			`…and it is the APR that refused it, not a column the comma shifted ("${cell}")`,
		);
	}
	{
		const r = parse(`${HEADER}\nVisa,2400,75, ,2026-09-01`);
		eq(r.errors.length, 0, "…while a cell of only spaces IS blank, and blank is 0%");
		eq(r.debts[0]?.apr, 0, "…imported at 0%");
	}
	{
		// ⛔ [C-5] A NEGATIVE IS A NUMBER THAT IS OUT OF RANGE, not an unreadable cell. `parseOptionalAmount`
		// returns `null` for both, which collapses the two messages onto the wrong one.
		const r = parse(`${HEADER}\nVisa,2400,75,-5,2026-09-01`);
		eq(r.debts.length, 0, "a negative APR is refused");
		assert(
			r.errors[0].includes("between 0 and 100"),
			"…and reported as OUT OF RANGE, not as unreadable — it is a number, and the user can see that",
		);
	}
	{
		// The preserved property, both directions: blank still means 0%, and a spaced sign still parses.
		const r = parse(`${HEADER}\nVisa,2400,75,19.99 %,2026-09-01`);
		eq(r.errors.length, 0, "a space before the percent sign is still a rate");
		eq(r.debts[0]?.apr, 19.99, "…with its value intact");
	}
	{
		// ⛔ A REQUIRED FIELD THAT WAS NEVER VALIDATED. This imported clean and produced NaN downstream in
		// `guardianPredictionCore` — a row the importer called successful, breaking the plan silently.
		const r = parse(`${HEADER}\nVisa,2400,75,19.99,next friday`);
		eq(r.debts.length, 0, "a dueDate that is not a date is refused");
		assert(
			r.errors.some((e) => e.includes("not a date")),
			"…and the error names the format rather than blaming the value",
		);
	}
	{
		// ⚠️ Shape-valid, calendar-invalid. `2026-02-30` passes a regex and is not a day.
		const r = parse(`${HEADER}\nVisa,2400,75,19.99,2026-02-30`);
		eq(r.debts.length, 0, "a date that does not exist on the calendar is refused");
	}
	{
		// ⛔ A FRACTIONAL COUNT SILENTLY REWRITES A BALANCE. `normalizeBnplInstallment` computes
		// `balance = scheduled × remaining`, so 2.5 installments invents a number the user never typed.
		// ⚠️ Asserted as `undefined` — the field is optional, so the row survives and falls back to the
		// balance+minimum path rather than being refused over an optional column.
		const r = parse(`${HEADER},type,remainingPayments\nKlarna,400,100,0,2026-09-01,bnpl,2.5`);
		eq(r.debts[0]?.remainingPayments, undefined, "a fractional installment count is not accepted");
		const neg = parse(`${HEADER},type,remainingPayments\nKlarna,400,100,0,2026-09-01,bnpl,-3`);
		eq(neg.debts[0]?.remainingPayments, undefined, "…nor a negative one");
		const ok = parse(`${HEADER},type,remainingPayments\nKlarna,400,100,0,2026-09-01,bnpl,4`);
		eq(ok.debts[0]?.remainingPayments, 4, "…while a whole positive count still imports");
	}

	{
		// ⛔ THE HEADERS THE SUPPORT PAGE TELLS USERS TO WRITE, and the spelling a bank export actually uses.
		// `normalizeHeader` used to trim and lowercase only, so "Minimum Payment" and "Due Date" read as
		// ABSENT and every row was skipped for "missing required fields" — the docs and the parser
		// disagreed, and the user was told their file was wrong.
		const r = parse("Name,Balance,Minimum Payment,APR,Due Date\nVisa,2400,75,19.99,2026-09-01");
		eq(r.errors.length, 0, "headers written with spaces and capitals import cleanly");
		eq(r.debts[0]?.minimumPayment, 75, "…and the spaced column is actually read");
		eq(r.debts[0]?.dueDate, "2026-09-01", "…including the due date");
	}

	console.log(`\n✅ CSV debt import: ${passed} assertions passed\n`);
}

runDebtCsvTests();
