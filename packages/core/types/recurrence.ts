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

/**
 * ⛔ **S1.12.5.5 [pass-5 `C5-4`] — THE UNIT A DEBT ROW PRINTS BESIDE ITS MINIMUM, IN ONE PLACE.**
 *
 * ⚡ Money's row wrote `isBnpl ? CADENCE_SUFFIX[…] : '/mo'` — this table consulted for one branch and
 * bypassed with a literal for the other — so a **quarterly** student loan read **"$600/mo"**, a 12×
 * overstatement, and `ListRow` put the same string in the a11y label so VoiceOver said it too.
 *
 * ⛔ **It lives here, beside the table, because the first version of the fix was tested as a COPY.** The
 * assertion re-implemented the row's expression, so planting the defect back into `money.tsx` left the
 * suite green — `tested-helper-is-not-a-used-helper`, in the test written to close the finding. A
 * function the screen actually calls is the only thing a plant can reach.
 *
 * ⚠️ **No `|| '/mo'` fallback.** `one-time` maps to `''` deliberately — a one-time debt has no rhythm to
 * state — and the fallback turned that into a monthly rate. The table is `Record<Recurrence, string>` and
 * therefore total, so the fallback guarded nothing.
 */
export function debtAmountSuffix(recurrence: Recurrence, minimumUnread: boolean): string | undefined {
	// A unit beside an em dash would assert a rate for a figure the app has just said it could not read.
	return minimumUnread ? undefined : CADENCE_SUFFIX[recurrence];
}
