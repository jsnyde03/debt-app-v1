import { useEffect } from 'react';

import { coachMarks } from '@/store/coachMarks';
import { probeCoachMark } from '@/store/coachMarkProbe';
import { useTutorialTargets } from '@/store/tutorialTargets';

/**
 * Offer a coach-mark when its subject has actually LAID OUT.
 *
 * ⚠️ This was a 600ms mount timer, and the timer was the defect. `CoachMarkLayer` renders nothing on a
 * miss or a 0×0 measure, so a mark asked for too early silently never appears — which made "has the sheet
 * finished presenting?" a question answered by a wall-clock guess. Under load the guess drifts, and the
 * suite found it: the mark landed mid-walkthrough and covered the subject a beat was explaining, and the
 * gate failed where an isolated run did not.
 *
 * `invalidate(id)` is the fact the guess was approximating — [E5] made `TutorialTarget` fire it on every
 * layout precisely because layout is the one signal that covers mount, reflow and resize. Asking then is
 * not merely better-timed; it is asking a question the app can answer, which is the same correction
 * 3.5.8 applied fourteen times to the capture pipeline.
 *
 * ⚠️ **Lives in `hooks/`, not beside the store.** `coachMarks.ts` is imported by the app-layer test
 * runner, which runs under `tsx` with no React Native runtime — so the store layer has to stay free of
 * `react-native` imports, and `useTutorialTargets` brings one in transitively. That constraint is stated
 * at the top of `runAppTests.ts` and this hook is where it gets honoured.
 *
 * Fires once per mount of the subject; `coachMarks.show` decides whether it is owed at all.
 */
export function useCoachMark(id: string, ready: boolean): void {
  const targets = useTutorialTargets();
  useEffect(() => {
    // 4.1.4c — record the ARM separately from the layout event. "The mark never appeared" is compatible
    // with `ready` never flipping, with no registry above the caller, and with the subject never laying
    // out; those are three different defects and this is what tells them apart.
    probeCoachMark(`hook:${id} ready=${ready ? 1 : 0} registry=${targets ? 1 : 0}`);
    if (!ready || !targets) return;
    let asked = false;
    const unsubscribe = targets.subscribe((laidOut) => {
      if (asked || laidOut !== id) return;
      asked = true;
      probeCoachMark(`layout:${id}`);
      coachMarks.getState().show(id);
    });
    return unsubscribe;
  }, [id, ready, targets]);
}
