import { router } from 'expo-router';

import { track } from '@/analytics/funnel';

import { demoSession } from './demoSession';

/**
 * Where a demo can hand the viewer off to. All three are ends of the run, never detours inside it.
 *
 * ⛔ **`'/'` was added by R3 (🎯 2026-08-20), and it exists because this module's own premise was wrong.**
 * The comment below used to reason that *"whichever exit they took, a demo viewer has no plan yet"* — true
 * of the Welcome door the demo was built for, and **false of the paywall door**, which is reached mostly by
 * users who already have a plan. For them "back" is their own tabs, not a setup flow.
 */
export type DemoExit = '/onboarding' | '/paywall' | '/';

/**
 * 3.5.4.7 — leave the demo. [D18]'s terminal-exit rule, in one place so no caller can get the order wrong.
 *
 * `end()` BEFORE `replace()`, and that sequence is the whole point *for the callers that come through
 * here*: the destination must never render with the sandbox still mounted above it. `/paywall` writes the
 * real store by design, and `useNoRealWritesGuard` is deliberately strict for a bounded run — so a
 * purchase made from a still-mounted demo would be reported as the exact thing the guard exists to catch,
 * and at Phase 6 that lands in Sentry as a real-plan-corruption alert for a working checkout.
 *
 * ⛔ **[S1.13.7.11 · pass-6 `B2-1`] — THIS FUNCTION IS NOT WHAT MAKES THAT TRUE, AND THE SENTENCE ABOVE
 * USED TO IMPLY IT WAS.** `exitDemo(` has **2** call sites repo-wide against **6** for `'/paywall'`, and
 * four of those are ordinary pushes that never come through here. What actually holds the line is **[D9]:
 * the sandbox runs PREMIUM for every audience**, so no paywall entry point renders inside a bounded run.
 * ⚠️ Revert or narrow [D9] and the exposure is real, whatever this function does.
 *
 * `replace`, not `push`: the demo is over, and leaving it on the stack lets a back gesture resurrect a
 * torn-down run — a screen of sandbox figures with no session behind it and no marker in its dock.
 *
 * Separate module from `demoSession` on purpose: this needs `expo-router` (→ react-native), and the
 * session is kept dependency-free so the headless suite can assert it.
 */
export function exitDemo(to: DemoExit): void {
  // Recorded BEFORE the teardown, while there is still a run to describe. The funnel's whole question is
  // which exit people take, and reading it after `end()` would mean reconstructing it from the route.
  track({
    name: 'demo_exited',
    reason: to === '/paywall' ? 'unlock_premium' : to === '/' ? 'back_to_plan' : 'start_real_plan',
  });
  demoSession.getState().end();

  // ⛔ R3 — the returning user goes straight back to their own plan, and must NOT be routed through
  // onboarding on the way. It would work by accident (the route guard bounces an onboarded user to the
  // tabs) and that accident is exactly what made the old behaviour defensible while it read as a trap.
  // `replace`, like the others: the demo is over and a back gesture must not resurrect it.
  if (to === '/') {
    router.replace('/');
    return;
  }

  // ⚠️ Always land on onboarding FIRST, then push the paywall on top of it.
  //
  // `replace('/paywall')` alone stranded the user: it swapped out the only entry on the stack, so the
  // paywall's own back control had nothing to return to and did nothing. Reported from a real build, and
  // it is the same shape as 3.7.A0's cold-entry finding — a screen reachable by a route that leaves no
  // history behind it. Onboarding is the honest floor here: whichever exit they took, a demo viewer has
  // no plan yet, so that is where they belong when they close the paywall.
  router.replace('/onboarding');
  if (to === '/paywall') router.push('/paywall');
}
