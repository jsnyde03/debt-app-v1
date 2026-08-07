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
/**
 * 3.5.8.3 — is THIS build an App-Preview capture build?
 *
 * `EXPO_PUBLIC_*` is inlined by Metro at BUILD time, so this is a constant in the bundle: a real build
 * never sets it, and the branch it guards is unreachable there rather than merely unused.
 *
 * ⚠️ It exists because the deep link cannot start the capture, and that took two CI cycles to establish.
 * `xcrun simctl openurl` on a custom scheme makes iOS raise **"Open in 'Debt Planner (RN)'?" [Cancel]
 * [Open]** — and it does so even when the app is already FRONTMOST, which was the second cycle's
 * hypothesis and is disproven by its own `after-openurl.png`. Nothing unattended dismisses that dialog, so
 * cycle 1 recorded 30s of Home Screen and cycle 2 recorded 30s of onboarding-behind-an-alert.
 *
 * A launch is not an open: `xcrun simctl launch` raises no dialog. So the capture build boots itself into
 * the demo and the URL leaves the path entirely, which removes the failure class instead of working
 * around it.
 */
export const CAPTURE_DEMO = process.env.EXPO_PUBLIC_CAPTURE_DEMO === '1';

/**
 * ⚠️ **A FLAGGED BUILD CAN LEAK INTO THE NEXT ONE. Clear the bundler cache after any capture export.**
 *
 * `EXPO_PUBLIC_*` is inlined at build time, and Metro's export cache does **not** treat it as a cache key.
 * Measured here on 2026-08-07: a capture export was followed by a plain `expo export --platform web` that
 * set nothing, and the resulting bundle STILL had `CAPTURE_DEMO` true. Every route auto-entered the demo,
 * so the whole e2e suite failed with elements "resolved but hidden" — the bounded-run a11y fence, doing
 * exactly its job on a screen nobody meant to fence. `expo export --clear` fixed it; the same suite then
 * passed untouched.
 *
 * Production risk is small because release builds come off fresh CI clones, but it is not zero and the
 * failure is silent: a leaked flag ships an app that boots strangers into a demo of somebody else's money.
 * After running the capture export locally, `--clear` before trusting anything you build next.
 */

export function isDemoReachable(): boolean {
  // `CAPTURE_DEMO` is included so a capture build still works after the Phase-6 `QA_TOOLS` flip — the
  // App Preview will need re-shooting for exactly the releases where `QA_TOOLS` is false.
  return (typeof __DEV__ !== 'undefined' && __DEV__) || QA_TOOLS || CAPTURE_DEMO;
}
