import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

/**
 * 3.5.1 — the tutorial's first-run INVITATION.
 *
 * The design gate chose an invitation over a takeover: a user who just finished onboarding wants to see
 * their own number first, and for a free user an unskippable tour of a premium-flavoured feature reads
 * as a pitch rather than help. So this offers, and never interrupts — declining is a real answer that
 * isn't asked again (replay stays on the Guardian card's "?" and in More).
 *
 * It occupies the VIS-4 single ack-slot ranked LAST, so a milestone, a reserve release or a trial
 * conversion — all time-sensitive — always outranks a teaching offer.
 */
export function TutorialInviteCard({ onStart, onDismiss }: { onStart: () => void; onDismiss: () => void }) {
  const c = useAppColors();
  const a11y = groupLabel(
    'See how your Guardian works',
    'A short walkthrough on example numbers, not your real plan.',
  );

  return (
    <Card>
      <View style={styles.body} testID="tutorial-invite">
        <View {...a11y} style={styles.copy}>
          <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>See how your Guardian works</Text>
          {/* Says up front that it runs on example numbers — the honesty framing the scenarios need,
              since a "tight"/"at-risk" beat is a TAUGHT state, not a read on their real money. */}
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            A short walkthrough on example numbers — your plan isn&apos;t touched.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button label="Show me" onPress={onStart} />
          <Button label="Not now" variant="text" onPress={onDismiss} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  copy: { gap: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
