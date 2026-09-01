/**
 * The ONE owner of `Date` ⇄ `YYYY-MM-DD`.
 *
 * This app stores CALENDAR DATES, not instants. A due date, a payday and a cycle boundary are all "the
 * day on the user's wall calendar" — they have no time and no zone. Routing one through UTC is therefore
 * a category error, not a rounding detail, and it has a direction: east of UTC local midnight is the
 * PREVIOUS day, so `new Date("2026-08-12T00:00:00").toISOString().slice(0, 10)` returns `2026-08-11` at
 * UTC+10. The user is shown, and the engine plans against, a date that is a day early.
 *
 * The pattern is banned by `scripts/check-local-dates.ts`, which scans core, the RN app AND the test
 * trees — a rule, not a convention, because this class was fixed by enumeration twice before and both
 * enumerations were short. The linter knows every site; a person does not.
 */

/** A `Date` → the calendar date its LOCAL components spell. Never touches UTC. */
export function toLocalISODate(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * A `YYYY-MM-DD` → local midnight on that calendar day.
 *
 * The `T00:00:00` suffix is what makes it local: a bare `new Date("2026-08-12")` is parsed as UTC
 * midnight by spec, which lands the day EARLIER west of Greenwich — the same defect mirrored.
 */
export function parseLocalDate(iso: string): Date {
	return new Date(`${iso}T00:00:00`);
}

/** Today's calendar date, read from the local clock. */
export function todayLocalISODate(): string {
	return toLocalISODate(new Date());
}

/**
 * ⛔ **S1.13.7.8 [pass-6 blocker `A3-12`] — IS THIS `YYYY-MM-DD` A DAY THAT EXISTS?**
 *
 * ⚡ A shape check is not a calendar check. `2026-02-30` matches `\d{4}-\d{2}-\d{2}` and `day <= 31`, and
 * `parseLocalDate` does not fail on it — it **succeeds**, returning **March 2**. Nothing downstream can
 * detect that: the debt is not `NaN`, it is not flagged, it has simply left the month it was due in. On a
 * monthly cycle the app then reports `$0 required` and offers the whole paycheck to the snowball while the
 * minimum is due inside that cycle. ⚠️ **The direction is worse than a `NaN`**: a loud failure is visible.
 *
 * ⛔ **THIS IS THE OWNER, AND IT EXISTS BECAUSE THE SAME CHECK WAS WRITTEN AT ONE DOOR AND NOT THE OTHER.**
 * `debtCsv` carried the round-trip inline from `P6.8.9.7.4`, with a comment naming `2026-02-30` exactly;
 * `parseStatementText` — the scan door, whose own header names `debtCsv` as *"the precedent this mirrors"* —
 * had a `day >= 1 && day <= 31` shape test at both of its return points. Two text→date parsers, one
 * guarded. Collapsing the pair to a single producer is the move this repo takes on every recurrence of
 * that shape; a second correct copy just buys the next round's third door.
 *
 * ⚠️ `parseLocalDate` + `toLocalISODate`, never `new Date(...).toISOString()` — the UTC form round-trips a
 * valid date to the day BEFORE east of Greenwich and would refuse every row in Sydney and Auckland.
 */
export function isRealCalendarDate(iso: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
	return toLocalISODate(parseLocalDate(iso)) === iso;
}
