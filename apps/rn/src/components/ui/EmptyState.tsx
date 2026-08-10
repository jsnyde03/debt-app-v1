import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** A consistent empty state with a prominent "add your first…" CTA inside it (the B.6 redesign). */
export function EmptyState({
  icon,
  title,
  body,
  cta,
  onCta,
  ctaTestID,
}: {
  icon: IconGlyph;
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
  ctaTestID?: string;
}) {
  const c = useAppColors();
  return (
    <Card style={styles.card}>
      <View style={[styles.icon, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name={icon} size={28} color={c.accent.primary} />
      </View>
      <Text style={[textStyles.title3, styles.center, { color: c.text.primary }]}>{title}</Text>
      <Text style={[textStyles.subhead, styles.center, { color: c.text.secondary }]}>{body}</Text>
      <Button label={cta} onPress={onCta} style={styles.cta} testID={ctaTestID} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm },
  icon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: spacing.sm },
});
