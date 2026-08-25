import { parseLocalDate, toLocalISODate } from "./localDate";

/**
 * The ONE owner of "advance a calendar date by whole months".
 *
 * ⛔ `d.setMonth(d.getMonth() + n)` IS NOT THAT OPERATION. When the target month is shorter than the
 * day being carried, JS normalises the overflow FORWARD into the following month: Jan 31 + 1 month is
 * **Mar 3**, not Feb 28. Anything that then prints month-and-year — a debt-free date, a schedule row, a
 * chart tick — shows a **different month**, always later than the truth. For a start day of 31 that is
 * five of the twelve target months; for the 30th or 29th it is February.
 *
 * The clamp below was written once for the due-date rollover path and never reached the projection
 * paths, so the Progress screen's headline claim about the user's own plan could name a month one later
 * than the plan it was computed from. `scripts/check-month-arithmetic.ts` now keeps that from recurring
 * by enumeration: this file is the only place a bare `setMonth` is allowed to live.
 *
 * `anchorDay` is the INTENDED day-of-month, normally taken from an original date rather than the
 * running one. Clamping against the anchor is what stops a date that has passed through a short month
 * from staying there permanently (Feb 28 + 1mo should be Mar 31 when the anchor is 31, not Mar 28).
 */
export function addMonthsToDate(date: Date, months: number, anchorDay?: number): Date {
	const day = anchorDay ?? date.getDate();
	// First of the target month — `new Date(y, m, 1)` normalises month overflow into years, and starting
	// from day 1 is what makes the step immune to the source day.
	const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
	// Day 0 of the NEXT month is the last day of this one.
	const lastDayOfTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
	target.setDate(Math.min(day, lastDayOfTarget));

	return target;
}

/**
 * The same step over `YYYY-MM-DD`, which is how this app stores calendar dates.
 *
 * Routes through `localDate`'s owner both ways, so the month step cannot reintroduce the UTC class that
 * `scripts/check-local-dates.ts` guards.
 */
export function addMonthsISO(iso: string, months: number, anchorDay?: number): string {
	return toLocalISODate(addMonthsToDate(parseLocalDate(iso), months, anchorDay));
}
