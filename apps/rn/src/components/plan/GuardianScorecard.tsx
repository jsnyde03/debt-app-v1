import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import type { CalibrationScore } from '@/store/guardianSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * §2.9 Guardian accuracy scorecard (2.4.9). A CALM reference section in the cushion-forecast drill-down —
 * the Guardian's honest track record, the model the audit rounds flagged as net-negative if faked. It
 * grades floor-breach ("did my read of whether you'd hold your cushion match what you confirmed"), and:
 *  - shows false-clear ("Under-warned") and false-tight ("Over-cautious") SEPARATELY (never one blended %);
 *  - a bad-record line OWNS the un-spinnable direction (false-clear: "I've under-warned"), decoupled from
 *    the displayed number by a warn threshold;
 *  - before it's proven (n < gate) it shows the day-one-protection state, NEVER a hollow number/apology.
 * Reference surface → no count-up, no celebration ([[match motion to surface job]]).
 */

/** The record is weak enough to surface an honest recalibration line. DECOUPLED from the shown number
 *  (round-4 §2.9): the count always shows; the apology only appears below this bar. [BUILD]-tunable. */
const WARN_MATCH_RATE = 0.8;

export function GuardianScorecard({ score }: { score: CalibrationScore }) {
  const c = useAppColors();

  // Not yet proven → the §2.0.d day-one-protection state. No number, no apology — the floor auto-protect
  // is confidence-independent value from day one; the track record is simply not earned yet.
  if (!score.proven || score.matchRate === null) {
    return (
      <Card>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>GUARDIAN ACCURACY</Text>
        <View style={styles.head}>
          <AppIcon name="gpp-good" size={20} color={c.text.secondary} />
          <Text style={[textStyles.title3, styles.headTitle, { color: c.text.primary }]}>Protected since day one</Text>
        </View>
        <Text style={[textStyles.subhead, styles.body, { color: c.text.secondary }]}>
          Your line&apos;s been protected from the start. I&apos;m still learning your patterns — I&apos;ll show my track
          record once I&apos;ve seen a few more paychecks.
        </Text>
      </Card>
    );
  }

  // A weak record surfaces an honest recalibration line, branched on the DOMINANT error direction.
  const weak = score.matchRate < WARN_MATCH_RATE && score.dominantError !== null;
  const recalibration =
    weak && score.dominantError === 'false_clear'
      ? "I've under-warned a few times — I've tightened my read." // the direction we never soften
      : weak
        ? "I've been over-cautious a few times — I'm recalibrating."
        : null;

  return (
    <Card>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>GUARDIAN ACCURACY</Text>
      <Text style={[textStyles.title2, { color: c.text.primary }]}>
        {score.matches} of {score.n} reads matched
      </Text>
      <Text style={[textStyles.footnote, styles.body, { color: c.text.tertiary }]}>
        How often my read of whether you&apos;d hold your cushion matched what you actually confirmed.
      </Text>

      <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />

      {/* The two error types, always reported SEPARATELY (never blended into one % that hides a false-clear). */}
      <View style={styles.errors}>
        <ErrorReadout label="Under-warned" sub="said you'd hold, you dipped below" value={score.falseClears} />
        <ErrorReadout label="Over-cautious" sub="flagged a risk that didn't land" value={score.falseTights} />
      </View>

      {recalibration ? (
        <Text style={[textStyles.subhead, styles.recalibration, { color: c.text.primary }]}>{recalibration}</Text>
      ) : null}
    </Card>
  );
}

function ErrorReadout({ label, sub, value }: { label: string; sub: string; value: number }) {
  const c = useAppColors();
  return (
    <View style={styles.readout}>
      <Text style={[textStyles.title3, { color: c.text.primary }]}>{value}</Text>
      <Text style={[textStyles.subhead, styles.readoutLabel, { color: c.text.secondary }]}>{label}</Text>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 0.8, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headTitle: { flex: 1 },
  body: { marginTop: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  errors: { flexDirection: 'row', gap: spacing.lg },
  readout: { flex: 1, gap: 2 },
  readoutLabel: { fontWeight: '600' },
  recalibration: { marginTop: spacing.md, fontWeight: '600' },
});
