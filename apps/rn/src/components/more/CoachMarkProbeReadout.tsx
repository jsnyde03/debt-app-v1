import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { useCoachMarkProbe } from '@/store/coachMarkProbe';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 4.1.4c — the coach-mark pipeline trace, rendered where a Maestro run can read it.
 *
 * ⚡ **Why a rendered element rather than a `console.log`.** The native lane builds `-configuration
 * Release` (`native-e2e.yml:246`) and captures the app's unified log, so a `console.log` *probably*
 * survives — and "probably" is what has cost this defect five cycles. A rendered node is in the view
 * hierarchy Maestro already dumps into the artifact on every flow, it can be asserted on, and it appears
 * in a screenshot a human can read without downloading anything.
 *
 * ⚠️ **Mounted on MORE, deliberately, and not as an overlay.** An always-on readout above the app would
 * be the obvious shape and would risk the seven flows that are currently green — a `pointerEvents`
 * mistake or an overlapping bound turns a diagnostic into a cause. More is a screen flow 08 already
 * visits (it resets the marks there), so this costs the suite nothing it was not already paying.
 *
 * Reads as: `hook:<id> ready=1 registry=1 · layout:<id> · show:<id>=ACCEPTED · measure:<id>=NULL ·
 * draw:<id>=noRect nested=0` — five stages, and whichever one is missing or wrong is the defect.
 *
 * Removed with `QA_TOOLS` at Phase 6 along with the rest of this section (`git grep QA_TOOLS`).
 */
export function CoachMarkProbeReadout() {
  const c = useAppColors();
  const entries = useCoachMarkProbe();
  return (
    <Card style={styles.card}>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Coach-mark probe (4.1.4c)</Text>
      <Text
        // The flow asserts on THIS id. Rendering the placeholder rather than nothing when the trace is
        // empty is the point: "no entries" is itself a finding (the hook never armed), and an element
        // that vanishes would make that indistinguishable from the screen failing to load.
        testID="coach-probe"
        style={[textStyles.caption, styles.trace, { color: c.text.secondary }]}>
        {entries.length ? entries.join(' · ') : 'EMPTY'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xxs, marginTop: spacing.sm },
  // Monospace so a rect reads cleanly, and unbounded lines — a truncated trace is a trace that can hide
  // the stage that matters.
  trace: { fontFamily: 'Menlo', fontSize: 10, lineHeight: 14 },
});
