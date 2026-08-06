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
 * 3.5.4.8 — is the bounded demo reachable in this build?
 *
 * ONE definition, read by both the `/demo` route and every affordance that offers it, so an entry can
 * never outlive the destination it points at. The legacy demo was the opposite shape: a Welcome button
 * wired straight to `importStore(demoStore())`, with nothing tying the offer to what it opened.
 *
 * ⚠️ 3.5.4.7 decides what this becomes for a real pre-purchase user. Today it rides `QA_TOOLS`, which
 * ships in TestFlight and is flipped OFF before submission — so as it stands, the demo and every entry to
 * it disappear together at that flip. That is the honest default (an entry that leads nowhere is worse
 * than no entry), and it is deliberately a decision rather than a leftover.
 */
export function isDemoReachable(): boolean {
  return (typeof __DEV__ !== 'undefined' && __DEV__) || QA_TOOLS;
}
