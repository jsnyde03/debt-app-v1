import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';

/** Shared onboarding chrome: progress dots, a scrollable body, and a sticky CTA stack. */
export function OnboardingLayout({
  step,
  total,
  children,
  ctas,
}: {
  step: number;
  total: number;
  children: ReactNode;
  ctas: ReactNode;
}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: c.background.primary, paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === step ? c.accent.primary : c.border.strong, width: i === step ? 22 : 8 }]}
          />
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View style={[styles.ctas, { paddingBottom: insets.bottom + spacing.base }]}>{ctas}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: spacing.lg },
  dot: { height: 8, borderRadius: 4 },
  content: { paddingHorizontal: layout.screenPaddingH, gap: spacing.xl, paddingBottom: spacing.xl, flexGrow: 1 },
  ctas: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.sm, gap: spacing.sm },
});

/** Shared step styling (hero icon badge, copy block, feature/stat rows). */
export const onboardingStyles = StyleSheet.create({
  hero: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  copy: { gap: spacing.sm },
  list: { gap: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
});
