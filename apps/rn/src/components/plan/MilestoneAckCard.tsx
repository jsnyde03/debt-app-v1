import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import type { PendingMilestone } from '@/data/models';
import { haptics } from '@/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * The portfolio milestone-cross ack (3.3.2.2) — a calm, gold-accented Today card when a 25/50/75% journey
 * threshold is newly crossed at a rollover. Proportional to a mid-journey win (the full-screen spectacle is
 * reserved for debt-free); a single success haptic marks the moment on appear.
 */
const MESSAGE: Record<PendingMilestone['threshold'], { title: string; body: string }> = {
  25: { title: 'A quarter paid off', body: "You've cleared 25% of your debt. Keep the momentum going." },
  50: { title: 'Halfway to debt-free', body: "50% paid off — you're over the hump." },
  75: { title: 'Three-quarters done', body: '75% paid off. The finish line is in sight.' },
};

export function MilestoneAckCard({ milestone, onAck }: { milestone: PendingMilestone; onAck: () => void }) {
  const c = useAppColors();
  const m = MESSAGE[milestone.threshold];

  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: c.accent.gold }]}>
          <AppIcon name="star" size={18} color={c.text.onAccent} />
        </View>
        <View style={styles.text}>
          <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{m.title}</Text>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{m.body}</Text>
        </View>
      </View>
      <Button label="Keep going" variant="text" onPress={onAck} style={styles.cta} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
  cta: { marginTop: spacing.sm, alignSelf: 'flex-start' },
});
