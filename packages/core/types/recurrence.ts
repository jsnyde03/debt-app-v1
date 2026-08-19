export type Recurrence =
	| "one-time"
	| "monthly"
	| "weekly"
	| "biweekly"
	| "per-paycheck"
	| "quarterly"
	| "annually"

/**
 * The short suffix a per-payment figure carries — "$15.99/mo", "$40/2 wks".
 *
 * ⛔ **T8 / audit L2-1 — this existed TWICE and had ALREADY DIVERGED in production.** `money.tsx`'s
 * `CADENCE_SUFFIX` said `/2 wks` and `/check`; `guardianSelectors`' `cadenceLabel` said `/2wks` and
 * `/paycheck`. Two user-visible spellings for one cadence, on surfaces a tap apart — which is the whole
 * reason the L2 lens calls this class "dangerous" rather than untidy: nothing was wrong with either table,
 * and no test could see that they disagreed.
 *
 * ⚠️ The winning spellings are chosen, not inherited: `/2 wks` because the space reads, and `/paycheck`
 * because "paycheck" is the app's word everywhere else (`@core/copy/vocabulary`, "reserved each
 * paycheck") while `/check` was an abbreviation used nowhere but that one table.
 *
 * It lives beside the type so a new `Recurrence` member cannot be added without the compiler asking what
 * it is called on screen.
 */
export const CADENCE_SUFFIX: Record<Recurrence, string> = {
	"monthly": "/mo",
	"weekly": "/wk",
	"biweekly": "/2 wks",
	"per-paycheck": "/paycheck",
	"quarterly": "/qtr",
	"annually": "/yr",
	"one-time": "",
};

/** `CADENCE_SUFFIX` for a value that is not statically known to be a `Recurrence` (e.g. a stored string). */
export function cadenceSuffix(recurrence: string): string {
	return CADENCE_SUFFIX[recurrence as Recurrence] ?? "";
}
