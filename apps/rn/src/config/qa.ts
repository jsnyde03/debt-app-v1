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
 * **[D19], Jason 2026-08-06: the demo does NOT ship to users.** It briefly did. The walkthrough is the
 * only in-app teaching surface, because both showed the same feature with the same persona money on the
 * same screen — in the app, that is one thing said twice. The demo's remaining job is the App Preview
 * (3.5.8) and the marketing embed (3.5.7), so it rides `QA_TOOLS` and leaves the shipped app at the
 * Phase-6 flip along with every entry to it.
 *
 * A function rather than a constant because this is the lever: reachability is one decision in one place,
 * and the entries read it too, so an entry can never outlive its destination.
 */
export function isDemoReachable(): boolean {
  return (typeof __DEV__ !== 'undefined' && __DEV__) || QA_TOOLS;
}
