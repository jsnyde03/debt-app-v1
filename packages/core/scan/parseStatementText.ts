/**
 * §2.8 Scan-to-prefill — the PURE parser half. Given the raw text an on-device OCR pass (Apple Vision,
 * a native edge — see the scan module) recognized from a photo of a credit-card / loan statement or a
 * bill, extract the debt fields to PREFILL the capture sheet. Everything the user confirms/edits before
 * it's saved, so this is best-effort heuristic extraction — a missing field just isn't prefilled, never
 * a wrong commit. Kept pure + text-only (no native/image types) so it has a full test surface, exactly
 * like `debtCsv` (text → Debt), the precedent this mirrors.
 */
import { BNPL_PROVIDER_VALUES } from "@core/debt/bnplProviders";
import { isRealCalendarDate } from "@core/utils/localDate";

export interface ParsedStatement {
	/** The issuer / creditor name (a known issuer, else the first meaningful line). */
	name?: string;
	/** The statement / current balance owed. */
	balance?: number;
	/** The minimum payment due. */
	minimumPayment?: number;
	/** The purchase APR, as a percentage number (24.99, not 0.2499). */
	apr?: number;
	/** The payment due date, normalized to ISO YYYY-MM-DD. */
	dueDate?: string;
}

// Issuers/lenders we can name confidently from an OCR'd statement header. Order matters only for the
// (rare) case a statement mentions two — the first found wins, which is fine for a prefill the user confirms.
// ⛔ [T8 · L2-4] The BNPL half is COMPOSED, not re-typed. It used to be six literals repeating
// `DebtSheet`'s picker list, so a provider added to one and not the other produced a debt the user could
// file by hand and the scanner would silently never recognise. `@core/debt/bnplProviders` owns them.
const ISSUERS = [
	"American Express", "Amex", "Capital One", "Bank of America", "Wells Fargo", "Apple Card",
	"Chase", "Citi", "Citibank", "Discover", "Barclays", "Synchrony", "U.S. Bank", "US Bank",
	"PNC", "TD Bank", "USAA", "Navy Federal",
	...BNPL_PROVIDER_VALUES,
];

function toAmount(s: string | undefined): number | undefined {
	if (!s) return undefined;
	const n = Number(s.replace(/[$,\s]/g, ""));
	return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}

/** First capture group of the first matching pattern, else undefined. */
function firstMatch(text: string, patterns: RegExp[]): string | undefined {
	for (const re of patterns) {
		const m = re.exec(text);
		if (m && m[1] != null) return m[1];
	}
	return undefined;
}

const MONTHS: Record<string, number> = {
	jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

/**
 * Normalize a recognized date to ISO. Handles "07/15/2026", "7-15-26", "July 15, 2026", "Jul 15 2026".
 *
 * ⛔ **S1.13.7.8 [pass-6 blocker `A3-12`] — `day <= 31` IS A SHAPE TEST AND IT LET `02/30` THROUGH.**
 * OCR's two commonest digit confusions are 0/8 and 0/1, so `02/28` reads as `02/30` and `04/30` as
 * `04/31`. Both were accepted, `pad()`-ed straight into a string, and became **March 2** / **May 1** at
 * the first date comparison — the debt silently leaves the cycle it is due in, `totalRequired` drops to
 * `$0`, and the whole paycheck is offered to the snowball with the minimum still owed inside that cycle.
 * ⚠️ Nothing is `NaN` and nothing is flagged, which is why this outranks the loud failure `debtCsv`'s
 * comment predicts.
 *
 * ⚡ **Both return points go through {@link isRealCalendarDate}, and so does `debtCsv`.** The check used
 * to live inline at the CSV door only — this module's own header names `debtCsv` as *"the precedent this
 * mirrors"*, and the calendar half of that precedent had not travelled. One owner, two doors; a second
 * correct copy would only buy the next round's third door.
 *
 * ⚠️ **A refused date is `undefined`, which is the documented "a missing field just isn't prefilled"
 * path, verified at both scan doors** — `money.tsx:343` gates the prefill on `balance`/`minimumPayment`/
 * `name`, so the sheet still opens, and `DebtSheet` seeds `dueDate` to `todayLocalISO()` for the user to
 * confirm. Refusing the date costs a prefill; accepting it costs the month.
 */
function toIsoDate(raw: string | undefined): string | undefined {
	if (!raw) return undefined;
	const s = raw.trim();

	// Numeric M/D/Y or M-D-Y (US statement convention).
	const num = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(s);
	if (num) {
		const mo = Number(num[1]);
		const day = Number(num[2]);
		let year = Number(num[3]);
		if (year < 100) year += 2000;
		if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) return asRealDate(`${year}-${pad(mo)}-${pad(day)}`);
	}

	// "July 15, 2026" / "Jul 15 2026".
	const words = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(s);
	if (words) {
		const mo = MONTHS[words[1].slice(0, 3).toLowerCase()];
		const day = Number(words[2]);
		const year = Number(words[3]);
		if (mo && day >= 1 && day <= 31) return asRealDate(`${year}-${pad(mo)}-${pad(day)}`);
	}

	return undefined;
}

/** A candidate ISO string, or `undefined` if it names a day that does not exist. See {@link toIsoDate}. */
function asRealDate(iso: string): string | undefined {
	return isRealCalendarDate(iso) ? iso : undefined;
}

export function parseStatementText(raw: string): ParsedStatement {
	if (!raw || typeof raw !== "string") return {};
	const text = raw.replace(/\r/g, "");
	// Label→value matches stay on the SAME line (no newline between the label and the number), so a
	// "Minimum Payment Due" label can't accidentally grab the "New Balance" figure below it.
	const AMT = "[^\\n\\d]{0,30}\\$?\\s*([\\d,]+\\.\\d{2})";

	const balance = toAmount(firstMatch(text, [
		new RegExp(`new balance${AMT}`, "i"),
		new RegExp(`statement balance${AMT}`, "i"),
		new RegExp(`current balance${AMT}`, "i"),
		new RegExp(`(?:outstanding|balance owed|principal balance)${AMT}`, "i"),
		new RegExp(`balance${AMT}`, "i"),
	]));

	const minimumPayment = toAmount(firstMatch(text, [
		new RegExp(`minimum payment due${AMT}`, "i"),
		new RegExp(`minimum (?:payment|amount due)${AMT}`, "i"),
		new RegExp(`min(?:imum)?\\.? (?:payment|due)${AMT}`, "i"),
	]));

	/**
	 * APR either side of the % sign: "Purchase APR 24.99%" or "24.99% APR".
	 *
	 * ⛔ **S1.12.5.3 [pass-5 A5-3] — THE `<= 100` BOUND BELOW COULD NOT FIRE, AND THE REGEX WAS READING
	 * A FALSE NUMBER RATHER THAN REFUSING.**
	 *
	 * Both captures were `\d{1,2}`, so the largest value the expression could produce was `99.99` and
	 * `aprNum <= 100` was true for every input the regex could match. It read exactly like the scanner's
	 * rate bound and had never rejected anything — while `amount-guards.spec.ts:98` cited it as one of
	 * three paths that *"bound the rate to 0–100"*.
	 *
	 * ⚡ **And the second pattern was unanchored on its left, so on a three-digit rate it slid one digit
	 * right and matched the tail.** Measured: `"129.99% APR"` → **`29.99`**, and
	 * `"399.00% annual percentage rate"` → **`99`**. A 399% payday loan — exactly the debt this app is
	 * for — prefilled as 99%, with nothing on screen marking the figure as inferred.
	 *
	 * The captures are `\d{1,3}` so a three-digit rate is CAPTURED, and the lookbehind stops the slide,
	 * which leaves the bound below to do the rejecting it always claimed to do. A rate over 100 is now
	 * an honest absence the user fills in, never a number 100 points low.
	 *
	 * ⚠️ **Whether 100 is the right ceiling is a separate question and is deliberately not answered here.**
	 * Payday and title lending in the shipped markets routinely exceeds it. Raising it would mean
	 * ACCEPTING a scanned 399%, which is a product decision about a prefilled field; refusing is the
	 * conservative half and is what closes the false number.
	 */
	const aprStr = firstMatch(text, [
		/(?:purchase apr|annual percentage rate|interest rate|apr)[^\n\d]{0,25}(\d{1,3}(?:\.\d{1,2})?)\s*%/i,
		/(?<![\d.])(\d{1,3}(?:\.\d{1,2})?)\s*%\s*(?:apr|annual percentage rate)/i,
	]);
	const aprNum = aprStr != null ? Number(aprStr) : NaN;
	const apr = Number.isFinite(aprNum) && aprNum >= 0 && aprNum <= 100 ? aprNum : undefined;

	// The label→date gap excludes LETTERS (only whitespace/colon/punctuation), so a greedy gap can't eat
	// into the month name ("Payment Due Date July …" must capture "July", not "uly").
	const dueDate = toIsoDate(firstMatch(text, [
		/(?:payment due date|due date|payment due|autopay date|due by)[^\n\dA-Za-z]{0,20}([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})/i,
		/(?:payment due date|due date|payment due|autopay date|due by)[^\n\dA-Za-z]{0,20}(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i,
	]));

	// Name: the first known issuer mentioned, else the first meaningful line (an OCR'd header/logo).
	let name: string | undefined;
	for (const issuer of ISSUERS) {
		if (new RegExp(`\\b${issuer.replace(/[.]/g, "\\.")}\\b`, "i").test(text)) {
			name = issuer;
			break;
		}
	}
	if (!name) {
		const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length >= 3 && /[A-Za-z]/.test(l));
		if (firstLine) name = firstLine.slice(0, 40);
	}

	const out: ParsedStatement = {};
	if (name) out.name = name;
	if (balance != null) out.balance = balance;
	if (minimumPayment != null) out.minimumPayment = minimumPayment;
	if (apr != null) out.apr = apr;
	if (dueDate) out.dueDate = dueDate;
	return out;
}
