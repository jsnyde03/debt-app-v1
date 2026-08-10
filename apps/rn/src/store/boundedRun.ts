import { useStore } from 'zustand';

import { demoSession } from './demoSession';
import { tutorialSession } from './tutorialSession';

/**
 * 3.5.4.1 — "a bounded run is on screen", the ONE predicate every containment fence keys on.
 *
 * A bounded run is a session that owns the screen and renders sandbox money: the Guardian walkthrough,
 * and — since [D18] — the demo. Both are kiosk-contained, so the fences they need are identical: hold the
 * tabs, withhold More, and let the guard treat any real-store write as a leak.
 *
 * This is a shared definition rather than `tutorial.active || demo.active` written out at each site
 * because that shape has failed repeatedly here: the containment fences were all keyed on
 * `tutorialSession.active`, and adding a second member would have turned each into a two-condition check.
 * The recurring defect of this phase is a class closed at some of its members but not all — the a11y
 * longhand pair, the sheet backdrops, `measure`, the route-escape fence — every one found by an audit
 * after shipping. The second member arrives with the share already in place, so the misses have nowhere
 * to happen. Same move as `a11yHidden()` and `guardianSubjects`, ahead of the defect instead of behind it.
 *
 * ⚠️ A new bounded run adds itself HERE and nowhere else. If a fence ever needs to distinguish which run
 * is on screen, that is a different question — ask the session directly; do not fork this predicate.
 */
export function useInBoundedRun(): boolean {
  const inTutorial = useStore(tutorialSession, (s) => s.active);
  const inDemo = useStore(demoSession, (s) => s.active);
  return inTutorial || inDemo;
}

/** The same predicate outside React — for guards that run in an event handler rather than a render. */
export function isBoundedRunActive(): boolean {
  return tutorialSession.getState().active || demoSession.getState().active;
}

/**
 * 3.5.10 — is the run also holding NAVIGATION?
 *
 * ⚠️ **A separate question, asked separately — `useInBoundedRun` is deliberately NOT forked.** The note
 * above says a fence needing to distinguish which run is on screen should ask the session directly, and
 * this is that case: "sandbox money is on screen" and "you may not leave this screen" were one predicate
 * only because, until now, every bounded run happened to mean both.
 *
 * The explore demo breaks that coincidence. It is every bit as bounded — fake money, no real writes, the
 * Example marker, coach-marks suppressed — and it is the opposite of kiosk: navigating IS the point. So
 * the money fences keep reading `useInBoundedRun`, and only the two navigation fences read this.
 *
 * True for: the walkthrough (it owns the screen for seven beats and a stray tab press loses the arc) and
 * the SCRIPTED demo (a kiosk by [D18], and the App-Preview capture must not photograph a tab bar).
 */
export function useNavigationHeld(): boolean {
  const inTutorial = useStore(tutorialSession, (s) => s.active);
  const inDemo = useStore(demoSession, (s) => s.active);
  const demoMode = useStore(demoSession, (s) => s.mode);
  return inTutorial || (inDemo && demoMode === 'scripted');
}
