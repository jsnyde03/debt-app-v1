import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

import { qaEnabled } from '@/config/qa';

/**
 * 4.1.4c — the coach-mark pipeline PROBE. A measurement, not a fix.
 *
 * ⛔ **FIVE mechanisms have been asserted for `debt-row-actions` never appearing, and FOUR have been
 * refuted** — the subscription race most recently, by run `31621553581`. Every one of them was a reading
 * of the code that fitted the observation; none was a measurement. This file exists to stop the sixth.
 *
 * **Why the defect could hide at all, and it is the load-bearing fact:** the mark is gated on
 * `Platform.OS === 'ios'` (`money.tsx:259`), so the web e2e suite and the `tsx` app-layer runner are both
 * structurally blind to it, and `phase35-themes.shot.ts:106` already says so. An iOS simulator run is the
 * ONLY surface that can see this mark — and a simulator run reports one bit ("the assertion failed"),
 * which is exactly the resolution that let four wrong stories survive.
 *
 * So the pipeline reports each stage separately:
 *
 *   `hook` → the offer was armed        (`use-coach-mark.ts`)
 *   `layout` → the subject laid out and the listener heard it   (`tutorialTargets.tsx` → `subscribe`)
 *   `show` → the store accepted or refused, **naming the guard**  (`coachMarks.ts`)
 *   `measure` → the rect resolved, or came back null  (`CoachMarkLayer.tsx`)
 *   `draw` → the layer's final render decision
 *
 * A red assertion plus this trace names the stage. There is no arrangement of these five values that
 * supports more than one story, which is the entire point.
 *
 * ⚠️ **RN-free on purpose.** `coachMarks.ts` records into this, and that store is imported by the
 * app-layer test runner under `tsx` with no React Native runtime — the constraint is stated at the top of
 * `runAppTests.ts` and at `coachMarks.ts`'s `suppressors`. `zustand/vanilla` and `@/config/qa` both
 * honour it; a `react-native` import here would break the runner rather than this file.
 *
 * ⚠️ **Inert outside QA, and it disappears at the Phase-6 flip** — every writer early-returns on
 * `qaEnabled()`, so a store build records nothing and the readout is not mounted (`git grep QA_TOOLS`).
 */

/** Bounded so a long session cannot grow this without limit — the interesting events are the first ones,
 *  and a mark is offered once. Old entries drop off the front. */
const MAX_ENTRIES = 40;

export interface CoachMarkProbeState {
  /** Newest last. Rendered joined, because ONE string is one thing for a flow to screenshot and read. */
  entries: string[];
}

export const coachMarkProbe = createStore<CoachMarkProbeState>(() => ({ entries: [] }));

/**
 * Record one stage. Deliberately takes a pre-formatted string rather than a structured event: the
 * consumer is a Maestro hierarchy dump and a screenshot, so the format IS the interface.
 */
export function probeCoachMark(entry: string): void {
  if (!qaEnabled()) return;
  coachMarkProbe.setState((s) => ({
    entries: [...s.entries, entry].slice(-MAX_ENTRIES),
  }));
}

/** Clear the trace — the flow resets the marks, so it must be able to reset what it reads about them. */
export function resetCoachMarkProbe(): void {
  if (!qaEnabled()) return;
  coachMarkProbe.setState({ entries: [] });
}

export function useCoachMarkProbe(): string[] {
  return useStore(coachMarkProbe, (s) => s.entries);
}
