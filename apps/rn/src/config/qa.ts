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
 * Is QA tooling allowed to exist in this build at all — `__DEV__` OR the shipped `QA_TOOLS` switch?
 *
 * ⚠️ **Extracted because it was already written three times** (`sandboxHarness.ts`'s `harnessEnabled`,
 * `more.tsx:298`, `tutorial.tsx:39`) and the coach-mark probe was about to make it four. This repo has
 * priced that shape three times in one wave — *"a rule re-derived at each call site rather than owned
 * once"* — and the failure mode here is specific: the Phase-6 flip is `git grep QA_TOOLS`, so a copy that
 * spells the guard differently is a copy the flip can miss. **Agreeing copies are still copies.**
 *
 * `typeof` guard rather than a bare `__DEV__`: this module is reachable from the app-layer test runner,
 * which runs under `tsx` with no React Native global.
 */
export function qaEnabled(): boolean {
  return (typeof __DEV__ !== 'undefined' && __DEV__) || QA_TOOLS;
}

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
 * 3.5.7.5 — is THIS build the web marketing EMBED?
 *
 * Same mechanism as `CAPTURE_DEMO` and the same reason: an embed is a page that must show the product
 * within a second of loading, and the two ways to arrange that are a deep link or a build that knows
 * what it is. The capture lane already established that a URL is the fragile option.
 *
 * The embed and the capture want DIFFERENT runs, which is why this is a second flag and not a rename:
 *   - capture  → `/demo?capture=1`      chrome STRIPPED, clock HELD (a recording, `CaptureSlate` releases it)
 *   - embed    → `/demo?mode=scripted`  chrome KEPT (the dock is a viewer's only exit), clock free
 *
 * ⛔ THIS IS NOT THE FLAG `createAdapter.web.ts` READS, AND THAT DUPLICATION IS DELIBERATE AND MEASURED.
 * The obvious tidy — one exported `EMBED` here, imported there — would break a property 3.5.7.4 proved:
 * *no switch survives in the artifact*. Metro inlines `EXPO_PUBLIC_*` (0 occurrences of `EXPO_PUBLIC` in
 * either built bundle), but the minifier only folds the branch away when the constant is in the SAME
 * module. Measured 2026-08-17 on the shipped artifacts: the storage adapter's same-module ternary is
 * fully eliminated (`dist` has 0 × `sessionStorage`, `dist-embed` 0 × `localStorage`), while this file's
 * cross-module `CAPTURE_DEMO` survives **6 times** as a constant-false check. Both are unreachable at
 * runtime; only one is absent from the bundle. Storage is the one where absence was the claim, so
 * storage keeps its own local constant. **An "agreeing copy" is usually a defect — this one is a
 * measurement.**
 */
export const EMBED_DEMO = process.env.EXPO_PUBLIC_EMBED === '1';

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

/**
 * Is the bounded demo reachable in this build? **Yes — it ships to users.**
 *
 * ONE definition, read by the `/demo` route AND every affordance that offers it, so an entry can never
 * outlive the destination it points at. The legacy demo was the opposite shape: a Welcome button wired
 * straight to `importStore(demoStore())`, with nothing tying the offer to what it opened.
 *
 * **[D21], 🎯 Jason 2026-08-10 — this reverses [D19].** [D19] pulled the demo's user-facing entries on the
 * grounds that it duplicated the walkthrough: *"as built it never leaves Today, which makes it a Guardian
 * demo, not a Debt demo."* True then. The same decision ordered the rebuild (3.5.4.11) that made it a
 * five-beat arc across Money, Today and Progress — **so the premise was repaired the same day and the
 * pull was never revisited.**
 *
 * What that cost, measured: `tutorialSelectors` will not offer the walkthrough until `onboardingComplete`,
 * so with the entries gone a new user had **no way to see what the app does before entering their real
 * financial data.** The demo was built for exactly that (its route guard handles a not-yet-onboarded user,
 * and device checklist §12.1 tests the fresh-install door) — the door was built, verified, then unhandled.
 *
 * The division of labour that keeps it from being "one thing said twice":
 *   - **demo** — BEFORE you commit anything. Sandboxed persona money, terminal exits. Welcome + paywall.
 *   - **walkthrough** — AFTER onboarding. Teaches the Guardian on the user's own money, in situ.
 *
 * ⚠️ It no longer rides `QA_TOOLS`, so the Phase-6 flip does not take it out of the app. That coupling was
 * the point of the old expression and is exactly what must not be re-introduced.
 */
export function isDemoReachable(): boolean {
  return true;
}
