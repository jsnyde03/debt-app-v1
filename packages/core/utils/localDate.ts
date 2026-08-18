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
