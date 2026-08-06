/**
 * QA / device-test tooling gate. When `true`, the app exposes internal controls (in More) to trigger
 * on-device features that are otherwise hard to reach — currently the Payday Countdown Live Activity's
 * states + the payday-landed drain (3.5.3). Ships in TestFlight so device QA isn't blocked on hand-tuning
 * paycheck dates + sandbox premium.
 *
 * ⚠️ FLIP TO `false` BEFORE THE APP STORE SUBMISSION (Phase 6). One grep-able switch — `git grep QA_TOOLS`.
 */
export const QA_TOOLS = true;

/**
 * Is the bounded demo reachable in this build?
 *
 * ONE definition, read by the `/demo` route AND every affordance that offers it, so an entry can never
 * outlive the destination it points at. The legacy demo was the opposite shape: a Welcome button wired
 * straight to `importStore(demoStore())`, with nothing tying the offer to what it opened.
 *
 * **Jason, 2026-08-06: a real user gets the demo in v1.7.** So this is not gated. It briefly rode
 * `QA_TOOLS`, which would have taken the demo and both entries out of the shipped app at the Phase-6
 * flip — leaving a pre-purchase funnel built and not shipped, which is the opposite of what 3.5.4 is for.
 *
 * A function rather than a constant because this is the lever: the demo's reachability is one decision in
 * one place, and if it ever needs a condition (a remote flag, a locale, a store review build) it acquires
 * one here without a single call site changing.
 */
export function isDemoReachable(): boolean {
  return true;
}
