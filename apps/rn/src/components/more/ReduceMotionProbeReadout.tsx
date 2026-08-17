import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { useReduceMotion } from '@/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 4.1.7① — does this app observe a Reduce-Motion setting written from outside it?
 *
 * ⚠️ **THE PLAN ASKED THE WRONG QUESTION, and the before-scan caught it.** It reads: *"§B3.6 and §11.7
 * are `[M◐]` only if RN's `AccessibilityInfo` observes the `simctl` Reduce-Motion write."* But the app
 * does not use `AccessibilityInfo` for this at all — every animation gates on `useReduceMotion()`, which
 * is Reanimated's `useReducedMotion()` (`src/motion/hooks.ts`). So "does AccessibilityInfo see it" could
 * be answered YES and the app could still animate, which is the outcome the two checklist rows are about.
 *
 * ⭐ **So it reports BOTH, and the pair is the finding.** They can disagree, and which way they disagree
 * decides the fix rather than merely the verdict:
 *
 *   | reanimated | a11yInfo | meaning |
 *   |---|---|---|
 *   | true  | true  | the lane can drive Reduce Motion; both rows become automatable |
 *   | false | true  | the SETTING is observable but the app's hook is not reactive → switch the hook |
 *   | false | false | nothing outside the app can set it here → both rows fall back to `[D]`, floor +2 |
 *
 * ⚠️ Reanimated reads the system value when it initialises, so a mid-session change may never reach it.
 * That is why the lane's step writes the preference and then RELAUNCHES before reading this — a probe
 * that only toggled at runtime would report `false` for a reason that has nothing to do with the question.
 *
 * ⚡ A rendered node rather than a `console.log`, for `CoachMarkProbeReadout`'s reason: this lane builds
 * `-configuration Release` and RN's console lines do not survive it — measured, after an invented log
 * predicate cost a cycle. A rendered node is in the hierarchy Maestro dumps on every flow.
 *
 * Removed with `QA_TOOLS` at Phase 6 along with the rest of this section (`git grep QA_TOOLS`).
 */
export function ReduceMotionProbeReadout() {
  const c = useAppColors();
  const reanimated = useReduceMotion();
  const [a11yInfo, setA11yInfo] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setA11yInfo(v);
    });
    // The listener is what tells a MID-SESSION write apart from a launch-time one. If the static read
    // says false and this fires true, the setting is observable and only Reanimated's snapshot is stale.
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setA11yInfo(v));
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return (
    <Card style={styles.card}>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Reduce-Motion probe (4.1.7①)</Text>
      <Text
        // The flow asserts on THIS id. `pending` is rendered rather than nothing, for the coach-probe's
        // reason: a node that vanishes makes "not yet resolved" indistinguishable from "the screen never
        // loaded", and those need different answers.
        testID="rm-probe"
        style={[textStyles.caption, styles.trace, { color: c.text.secondary }]}>
        {`reanimated=${reanimated ? 1 : 0} a11yInfo=${a11yInfo === null ? 'pending' : a11yInfo ? 1 : 0}`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xxs, marginTop: spacing.sm },
  trace: { fontFamily: 'Menlo', fontSize: 10, lineHeight: 14 },
});
