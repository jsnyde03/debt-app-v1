import { useIsFocused } from 'expo-router';
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
  const isFocused = useIsFocused();

  /**
   * 4.1.5.4 — a mark must not outlive the screen its subject is on.
   *
   * ⛔ **The defect this fixes, reproduced before it was explained:** with the `trajectory-scrub` hint up
   * on Progress, opening More left *"Drag the curve · Scrub any month…"* lying across the settings list.
   * Seen first on the iPad (`ipad-04` → `ipad-05`) and then in Chrome, so it is a cross-platform product
   * defect, not a layout artifact.
   *
   * ⚡ **It is 4.1.4c's defect ① again, on the other side of the same boundary.** That one was a
   * *suppressor* held by a MOUNTED tab, and it was fixed by gating on focus — because Today never
   * unmounts. The offer was left on mount semantics, so the identical confusion (mount ≠ visible) survived
   * in the mark itself. `CoachMarkLayer` is mounted at the ROOT, above the navigator, so a pushed route
   * changes nothing it can see: only the HOST screen knows it has stopped being the one you are looking at.
   *
   * ⛔ Do NOT infer the mechanism from what a browser shows here. `probe-mark-route-push.spec.ts` reports
   * the subject as still mounted on More — but RN-web leaves the previous screen painted while a simulator
   * renders only the focused tab, which is a documented difference. What holds on BOTH is that the mark
   * renders at all, and that requires `active` to still be set. That is the stage; the DOM's mount count
   * is not evidence about native.
   *
   * `dismiss()`, not `suppress()`: suppressors are a COUNT held by something mounted and owe a matching
   * release — which is precisely what made ① app-wide and undebuggable. This is one-shot.
   *
   * ⚠️ Nothing is lost by standing down. The once-ever record is written by the LAYER on `DREW`
   * (4.1.4c moved it there from OFFER), so a mark that reached the screen is already recorded as seen; a
   * mark that never drew keeps its turn.
   */
  useEffect(() => {
    if (isFocused) return;
    if (coachMarks.getState().active !== id) return;
    probeCoachMark(`blur:${id}=dismissed`);
    coachMarks.getState().dismiss();
  }, [isFocused, id]);

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
