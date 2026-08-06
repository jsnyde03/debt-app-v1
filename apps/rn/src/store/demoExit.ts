import { router } from 'expo-router';

import { track } from '@/analytics/funnel';

import { demoSession } from './demoSession';

/** Where a demo can hand the viewer off to. Both are ends of the run, never detours inside it. */
export type DemoExit = '/onboarding' | '/paywall';

/**
 * 3.5.4.7 — leave the demo. [D18]'s terminal-exit rule, in one place so no caller can get the order wrong.
 *
 * `end()` BEFORE `replace()`, and that sequence is the whole point: the destination must never render
 * with the sandbox still mounted above it. `/paywall` writes the real store by design, and
 * `useNoRealWritesGuard` is deliberately strict for a bounded run — so a purchase made from a
 * still-mounted demo would be reported as the exact thing the guard exists to catch, and at Phase 6 that
 * lands in Sentry as a real-plan-corruption alert for a working checkout.
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
  track({ name: 'demo_exited', reason: to === '/paywall' ? 'unlock_premium' : 'start_real_plan' });
  demoSession.getState().end();

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
