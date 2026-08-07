import { useEffect, useRef, useState } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';

import { CAPTURE_DEMO } from '@/config/qa';
import { demoSession } from '@/store/demoSession';
import { decorative } from '@/utils/a11y';

/** How long the white frame is held. Long enough for `blackdetect` to see a run, short enough to be free. */
export const CAPTURE_SLATE_MS = 350;

/**
 * 3.5.8.9 — the film slate, and the end of guessing where the video starts.
 *
 * **The problem it removes.** The capture pipeline has to know one number: the raw-file timestamp where
 * the demo's script begins, because the trim and every per-beat frame extraction are offsets from it.
 * Four cycles tried to recover that number FROM the recording and each failed differently — a guessed
 * constant, `blackdetect` (this app's dark theme is nearly black, so it stopped on a faint pre-content
 * frame: 8.6s on one cycle, 4.2s on the next, same build), screenshot polling (`simctl io screenshot`
 * costs ~1.4s per call, so a "0.5s interval, 20s max" loop ran 54.7 seconds and the whole script played
 * out inside it), and finally a declared `LAUNCH_ALLOWANCE` that cycles 7 and 8 measured **3 seconds
 * apart on the same build**.
 *
 * The recording cannot be asked when the app was ready. Only the app knows. So it says so, the way film
 * has said so for a century: one unmistakable frame, at the moment it is true.
 *
 * **Why white.** Every other candidate is something this UI legitimately contains. Full white is not — the
 * palette has no near-whites at this scale, and the dark theme is nearly black, which is precisely what
 * defeated `blackdetect`. Inverted (`negate,blackdetect`), a white run is the one thing in the file that
 * cannot be confused with content.
 *
 * **What it is anchored to.** The slate is shown only after the demo's opening screen has actually
 * rendered — two frames plus a drained interaction queue, which is the strongest "the navigation is done
 * and the tree is painted" signal RN gives — and the script's clock starts as the slate clears. So the
 * in-point is a painted frame by construction, and every beat's `at` is measured from a screen that
 * exists rather than from a mount that preceded it.
 *
 * ⚠️ **It is not a timing dial.** If the settle below is too short, the slate lands a little early and the
 * cut opens a little early — a graded outcome. The old constant had no such property: being wrong by 3s
 * put the trim on black and every extracted frame on the wrong beat, with nothing in the artifact saying
 * so. That difference, not the precision, is the point.
 *
 * Inert in every real build: `CAPTURE_DEMO` is inlined false by Metro, and `startClock` is null unless a
 * caller asked to hold it — which only `/demo?capture=1` does.
 *
 * Renders nothing outside a capture.
 */
export function CaptureSlate() {
  // The cue: the run is live, its opening state is applied, and its clock has NOT started.
  const held = useStore(demoSession, (s) => s.startClock !== null);
  const [showing, setShowing] = useState(false);
  // Once per launch. A capture build runs one demo; re-arming would put a second white flash into the cut.
  const armed = useRef(false);

  // ⚠️ NOT gated on `CAPTURE_DEMO`, deliberately. A held clock that nobody releases is a demo frozen on
  // its opening beat, and that is not hypothetical — keying the HOLD on `?capture=1` while the RELEASE was
  // keyed on the build flag stranded the whole web e2e on beat 1. The hold now comes from the same flag,
  // so this can never fire outside a capture; leaving the releaser unconditional means the invariant
  // ("anything held is always released") holds by construction rather than by the two staying in sync.
  useEffect(() => {
    if (!held || armed.current) return;
    armed.current = true;

    let cancelled = false;
    let second = 0;
    // Two frames, then the interaction queue. `runAfterInteractions` waits out the navigation that brought
    // us here; the second `requestAnimationFrame` is what makes "the commit happened" into "a frame was
    // produced from it", which is the distinction a starved CI runner actually exposes.
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        InteractionManager.runAfterInteractions(() => {
          if (cancelled) return;
          setShowing(true);
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [held]);

  useEffect(() => {
    if (!showing) return;
    const t = setTimeout(() => {
      // Hidden and released together: the frame the slate stops covering IS the script's t=0, so anything
      // that put a rendered frame between the two would be time the extraction offsets do not know about.
      setShowing(false);
      demoSession.getState().releaseClock();
    }, CAPTURE_SLATE_MS);
    return () => clearTimeout(t);
  }, [showing]);

  if (!CAPTURE_DEMO || !showing) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      // A capture has no viewer, but this must never be reachable if the flag ever were: it covers the
      // screen, so it hides itself from the a11y tree rather than becoming a 350ms trap.
      pointerEvents="none"
      {...decorative}>
      <View style={styles.slate} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Pure #fff, fully opaque, edge to edge. The detector's whole premise is that nothing else in the file
  // looks like this — a tint or an alpha would hand back the ambiguity the slate exists to remove.
  slate: { flex: 1, backgroundColor: '#ffffff' },
});
