import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout } from '@/theme/spacing';

/** The standard content card. `tone`: default surface, `accent` = subtle accent-tinted premium surface. */
export function Card({
  children,
  style,
  tone = 'default',
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'accent';
  padded?: boolean;
}) {
  const c = useAppColors();
  const bg = tone === 'accent' ? c.background.tertiary : c.background.secondary;
  const border = tone === 'accent' ? c.border.default : c.border.subtle;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: border },
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  padded: { paddingHorizontal: layout.cardPaddingH, paddingVertical: layout.cardPaddingV },
});
