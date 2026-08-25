import type { Debt } from "@core/storage/debtPlannerStorage";
import type { Recurrence } from "@core/types/recurrence";
import { normalizeBnplInstallment } from "@core/debt/bnplInstallment";
import { parseAmountField, parseOptionalAmount } from "@core/utils/amountField";
import { parseLocalDate, toLocalISODate } from "@core/utils/localDate";

/**
 * CSV → `Debt[]`, for the bulk import the support FAQ documents.
 *
 * ⛔ **THE PARSE TAKES TEXT, NOT A `File`, AND THAT IS THE WHOLE POINT OF THIS MODULE'S SHAPE.**
 * `File` and `file.text()` are DOM. `packages/core` is the shared pure-TS engine and is consumed by a
 * React Native app where neither exists, so a parser that reads its own file can only ever run in a
 * browser. Reading bytes is the platform's job — a `<input type="file">` on the web, a document picker
 * on a device — and turning those bytes into debts is this file's. Each caller supplies the text.
 *
 * ⛔ **IDS ARE INJECTED FOR THE SAME REASON, PLUS A SECOND ONE.** `crypto.randomUUID` is not available in
 * every JS runtime this package runs in, and — more importantly — the app does not want a UUID. Its debt
 * ids are DERIVED from the ids that already exist (`debt-<cycle>-<n>`), which is what makes them unique
 * across a relaunch; a module counter namespaced by a date that does not move within a cycle hands out
 * duplicates. So the caller owns id minting and this file never guesses at it. ⚠️ `makeId` is called
 * once per ACCEPTED row and must return an id unused by both the existing portfolio and the rows already
 * returned from this same call.
 *
 * **Money goes through `amountField`, and it is the reason that module is shared code.** A CSV cell is a
 * typed money string exactly like a form field: someone exports `1,200` or `$1,200` from their bank and
 * `Number()` reads both as `NaN`. Parsing them differently here would mean the app accepts a number in
 * the debt sheet and refuses the same number from a file, and would blame the balance for it.
 * ⚠️ **APR is the optional-amount channel on purpose:** blank means 0%, unreadable STOPS the row. A
 * mistyped APR silently becoming 0 makes the engine project an interest-free payoff on a card that
 * charges, which is a wrong plan rather than a rejected row.
 */

type DebtType = "debt" | "bnpl";

const allowedTypes: DebtType[] = ["debt", "bnpl"];

/**
 * ⚠️ Narrower than the `Recurrence` union, deliberately. A debt is terminating by definition, so its
 * cadence describes the repayment rhythm; the quarterly/annual members exist for bills. Widening this
 * changes what a CSV can express, which is a product call and not a parser detail.
 */
const allowedRecurrences: Recurrence[] = ["one-time", "weekly", "biweekly", "per-paycheck", "monthly"];

export type DebtCsvResult = { debts: Debt[]; errors: string[] };

export type DebtCsvOptions = {
	/** Mint an id for one accepted row. See the note above on why this is not the parser's job. */
	makeId: () => string;
};

/**
 * One CSV record → its cells.
 *
 * Handles RFC-4180 quoting: a `""` inside a quoted field is a literal quote, and a comma inside quotes
 * is data rather than a separator. ⚠️ A quoted field containing a NEWLINE is not supported, because the
 * caller splits into records on newlines before this is reached. That is a real limit of the format this
 * accepts, not an oversight — a debt name spanning two lines has never appeared in a bank export, and
 * supporting it means a character-level record splitter.
 */
function parseCsvLine(line: string) {
	const values: string[] = [];
	let current = "";
	let insideQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		const nextChar = line[index + 1];

		if (char === '"' && nextChar === '"') {
			current += '"';
			index += 1;
			continue;
		}

		if (char === '"') {
			insideQuotes = !insideQuotes;
			continue;
		}

		if (char === "," && !insideQuotes) {
			values.push(current.trim());
			current = "";
			continue;
		}

		current += char;
	}

	values.push(current.trim());

	return values;
}

/**
 * ⛔ **SPACES AND SEPARATORS ARE STRIPPED — the docs promised columns this could not read.** [P6.8.9.7.4]
 *
 * This trimmed and lowercased only, so the header `minimum payment` normalised to `"minimum payment"` and
 * the lookup asks for `row.minimumpayment`. **`site/support.html` tells users the file "should have columns
 * for name, balance, minimum payment, APR, and due date"** — spelled exactly that way — and a file written
 * from those instructions had its minimum and due date read as ABSENT, so every row was skipped for
 * "missing required fields". The instructions and the parser disagreed, and the user was told their file
 * was wrong.
 *
 * ⚡ Fixed in the PARSER rather than only in the prose, because a real export from a bank or a spreadsheet
 * says `Minimum Payment` and `Due Date`. Making the docs match a strict parser would have been correct and
 * useless.
 */
function normalizeHeader(header: string) {
	return header.trim().toLocaleLowerCase().replace(/[\s_-]/g, "");
}

/** A count field — installments remaining. Whole, positive, and not money, so it does not take separators. */
/**
 * A COUNT — whole, positive, or absent. [P6.8.9.7.4]
 *
 * ⛔ This returned any finite number, so `remainingPayments: 2.5` and `-3` both imported. That is not a
 * cosmetic sloppiness: `normalizeBnplInstallment` reconciles an installment-native BNPL by computing
 * **`balance = scheduledPaymentAmount × remainingPayments`**, so a fractional or negative count silently
 * REWRITES the user's balance to a number they never typed and cannot trace to anything on screen.
 *
 * ⚠️ `undefined` rather than an error, deliberately, and this preserves the existing contract: the field is
 * optional and a debt missing it falls through to the balance+minimum path (`migrations.ts` v6 documents
 * that fallback). Refusing the ROW over an optional field would be a harsher change than the defect.
 */
function toCount(value: string | undefined) {
	if (!value) return undefined;

	const parsed = Number(value.trim());

	return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isValidRecurrence(value: string): value is Recurrence {
	return allowedRecurrences.includes(value as Recurrence);
}

function isValidDebtType(value: string): value is DebtType {
	return allowedTypes.includes(value as DebtType);
}

/**
 * Parse a whole CSV document into debts, skipping and REPORTING any row it cannot accept.
 *
 * A partially valid file imports what it can — the FAQ promises exactly that ("rows with missing required
 * fields will be skipped with a count shown"). Errors are per row and name the row number as the user
 * would count it in a spreadsheet, header included.
 */
export function parseDebtCsvText(text: string, options: DebtCsvOptions): DebtCsvResult {
	const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

	if (lines.length < 2) {
		return {
			debts: [],
			errors: ["CSV must include a header row and at least one debt row."],
		};
	}

	const headers = parseCsvLine(lines[0]).map(normalizeHeader);
	const errors: string[] = [];
	const debts: Debt[] = [];

	lines.slice(1).forEach((line, rowIndex) => {
		const rowNumber = rowIndex + 2;
		const values = parseCsvLine(line);

		const row = headers.reduce<Record<string, string>>((current, header, index) => {
			current[header] = values[index] ?? "";
			return current;
		}, {});

		const name = row.name?.trim();
		const rawBalance = row.balance?.trim() ?? "";
		const rawMinimum = row.minimumpayment?.trim() ?? "";
		const rawApr = row.apr?.trim() ?? "";
		const dueDate = row.duedate?.trim();
		const type = (row.type?.trim().toLowerCase() || "debt") as DebtType;
		const recurrence = (row.recurrence?.trim().toLowerCase() || "monthly") as Recurrence;
		const remainingPayments = toCount(row.remainingpayments);
		const scheduledPaymentAmount = parseAmountField(row.scheduledpaymentamount?.trim() ?? "");

		if (!name) {
			errors.push(`Row ${rowNumber}: name is required.`);
			return;
		}

		// ⚠️ Blank and unreadable are reported apart. "balance must be greater than 0" over a cell reading
		// `1.200,50` tells the user the wrong thing about their own file, and they will go and edit a
		// number that was never the problem.
		const balance = parseAmountField(rawBalance);
		if (balance === null) {
			errors.push(
				rawBalance === ""
					? `Row ${rowNumber}: balance is required.`
					: `Row ${rowNumber}: could not read balance "${rawBalance}" — it must be an amount greater than 0.`,
			);
			return;
		}

		const minimumPayment = parseAmountField(rawMinimum);
		if (minimumPayment === null) {
			errors.push(
				rawMinimum === ""
					? `Row ${rowNumber}: minimumPayment is required.`
					: `Row ${rowNumber}: could not read minimumPayment "${rawMinimum}" — it must be an amount greater than 0.`,
			);
			return;
		}

		/**
		 * ⛔ **A REQUIRED FIELD THAT WAS NEVER VALIDATED.** [P6.8.9.7.4] It was checked for emptiness and
		 * nothing else, so `"next friday"`, `"12/25"` and `"soon"` all imported CLEAN — and the value goes
		 * straight into `debt.dueDate`, where `guardianPredictionCore` reads it as a calendar date and
		 * produces `NaN`. A row the importer called successful then breaks the plan silently, which is the
		 * exact failure mode the APR guard above exists to prevent, one field along.
		 *
		 * ⚠️ The calendar check is not redundant with the shape check: `2026-02-30` matches the pattern and
		 * is not a day. Re-serialising and comparing is what catches a rolled-over date.
		 */
		/**
		 * ⚠️ `parseLocalDate` + `toLocalISODate`, NOT `new Date(...).toISOString()`. The first cut used the
		 * latter and `lint:dates` caught it in the release gate: `toISOString` converts to UTC, so east of
		 * UTC a valid date round-trips to the day BEFORE and every row would have been refused as "not a
		 * date" for users in Sydney and Auckland — two of the four launch storefronts.
		 * ⚡ A guard this repo already had, catching a defect written by the fix for a different one.
		 */
		const dueDateValid =
			!!dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && toLocalISODate(parseLocalDate(dueDate)) === dueDate;
		if (dueDate && !dueDateValid) {
			errors.push(`Row ${rowNumber}: dueDate "${dueDate}" is not a date — use YYYY-MM-DD, e.g. 2026-09-01.`);
			return;
		}
		if (!dueDate) {
			errors.push(`Row ${rowNumber}: dueDate is required.`);
			return;
		}

		// ⚠️ A refused APR is the one that matters most. `Number(apr) || 0` turned a mistyped rate into 0%
		// and the engine then projected an interest-free payoff on a card that charges — a wrong PLAN,
		// which is worse than a skipped row. Blank is a real answer (0%); unreadable is not.
		/**
		 * ⛔ **STRIP `%` BEFORE PARSING — the reject path did and the accept path did not.** [P6.8.9.7.4]
		 *
		 * `parseOptionalAmount`'s `normalize` strips `,`, whitespace and `$`; it does not strip `%`, because
		 * a percent sign in a MONEY field is not a thing. So `"19.99%"` — the way a person writes an APR,
		 * and the way a bank exports one — parsed to `null`, fell into the branch below, and was refused
		 * with **`"APR must be between 0 and 100"`**. 19.99 is between 0 and 100. The error told the user
		 * their correct value was out of range, which sends them to change a number that was already right.
		 *
		 * ⚠️ Stripped HERE rather than in `parseOptionalAmount`, which is shared with every money field
		 * (B1's owner). `%` is meaningful for a RATE and meaningless for an amount; widening the shared
		 * parser would make `$40%` a valid bill.
		 */
		/**
		 * ⛔ **ONE TRAILING `%`, NOT EVERY `%` — and a cell that strips to nothing is UNREADABLE, not blank.**
		 * [P6.8.9.7.11.4] The fix above stripped `%` globally and handed the result to
		 * `parseOptionalAmount`, whose blank contract is `if (cleaned === '') return 0` — so an APR cell of
		 * **`"%"` imported as 0%**, and `"1%2"` imported as **12%**. That is the silent zero this very
		 * function forbids twice in its own comments: a wrong PLAN, not a skipped row. ⚡ **The fix for the
		 * refusal wrote the defaulting it was written to prevent** — the accept path and the reject path
		 * swapped which one was wrong.
		 *
		 * A rate is written `19.99%`, never `1%2`, so only a trailing sign is stripped; anything else keeps
		 * its `%` and fails to parse, which is the correct outcome for a cell nobody meant.
		 */
		const rawTrimmed = rawApr.trim();
		const aprText = rawTrimmed.replace(/%$/, "").trim();
		const apr = rawTrimmed !== "" && aprText === "" ? null : parseOptionalAmount(aprText);
		/**
		 * ⚠️ The two messages are decided by the PARSE, not by a second re-read of the raw cell. The old
		 * branch re-parsed with `Number(...)` to guess which message to use, and `Number("")` is `0` — so
		 * `"%"` was reported as *"must be between 0 and 100"*, the same false message the `19.99%` fix
		 * existed to remove, on a different input. `apr === null` IS unreadable; `apr > 100` IS out of range.
		 */
		if (apr === null) {
			errors.push(`Row ${rowNumber}: could not read APR "${rawApr}" — leave it blank for 0%.`);
			return;
		}
		if (apr > 100) {
			errors.push(`Row ${rowNumber}: APR must be between 0 and 100 — got ${apr}.`);
			return;
		}

		if (!isValidDebtType(type)) {
			errors.push(`Row ${rowNumber}: type must be debt or bnpl`);
			return;
		}

		if (!isValidRecurrence(recurrence)) {
			errors.push(`Row ${rowNumber}: recurrence must be one-time, weekly, biweekly, per-paycheck, or monthly`);
			return;
		}

		// Installment-native BNPL: reconcile balance + minimum to scheduled × remaining (2.7.2).
		debts.push(normalizeBnplInstallment({
			id: options.makeId(),
			name,
			balance,
			originalBalance: balance,
			minimumPayment,
			apr,
			dueDate,
			originalDueDate: dueDate,
			type,
			recurrence,
			remainingPayments: type === "bnpl" ? remainingPayments : undefined,
			scheduledPaymentAmount: type === "bnpl" ? (scheduledPaymentAmount ?? undefined) : undefined,
			minimumPaidThisCycle: false,
			snowballPaidThisCycle: false,
		}));
	});

	return { debts, errors };
}
