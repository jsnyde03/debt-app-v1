import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Shared screen scaffold: safe-area top, a title header with an optional back control (pushed
 * sub-screens) + right action, and a scrollable body padded to clear the tab bar. On the roomy
 * iPad (regular) layout the content column is centered + width-capped; compact (iPhone) is
 * untouched. `footer` renders as a sticky element below the scroll area.
 */
export function Screen({
  title,
  right,
  onBack,
  children,
  scroll = true,
  footer,
  maxWidth,
  wide = false,
  scrollRef,
  onScroll,
}: {
  title: string;
  right?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  /** Override the centered column's max width on the regular (iPad) layout; ignored on compact. */
  maxWidth?: number;
  /** 3.6 — opt OUT of the centered width-cap on the regular (iPad) layout so the screen uses the FULL
   *  canvas for its own two-column / master-detail layout. No-op on compact (already full-width). */
  wide?: boolean;
  /** 3.5.3.3.1 — a handle on the body scroller, so an overlay can bring a coached subject into view.
   *  Opt-in and inert for every other screen; the alternative was for the tutorial to reach around
   *  `Screen` and re-implement the scaffold, which would then drift from it. */
  scrollRef?: React.Ref<ScrollView>;
  /** Paired with `scrollRef`: `scrollTo` takes an ABSOLUTE content offset, so a caller that wants to
   *  move by a measured delta has to know where the scroller currently is. */
  onScroll?: ScrollViewProps['onScroll'];
}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { isRegular, maxContentWidth } = useLayout();
  const bottomPad = insets.bottom + spacing.huge; // clear the tab bar

  const columnStyle = isRegular && !wide
    ? [styles.column, { maxWidth: maxWidth ?? maxContentWidth, paddingHorizontal: spacing.sm }]
    : styles.column;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.background.primary, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={columnStyle}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* The back control carries a testID so the native lane can drive it: Maestro's `back` is an
                Android gesture and does nothing on iOS, and the glyph is a "‹" no selector should match on. */}
            {onBack ? (
              <Pressable testID="screen-back" onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
                <Text style={[textStyles.title2, { color: c.accent.primary }]}>‹</Text>
              </Pressable>
            ) : null}
            <Text
              style={[textStyles.title1, { color: c.text.primary }]}
              numberOfLines={1}
              accessibilityRole="header">
              {title}
            </Text>
          </View>
          {right ?? null}
        </View>

        {scroll ? (
          <ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex]}>{children}</View>
        )}

        {footer}
      </View>
    </KeyboardAvoidingView>
  );
}

/** A titled group of rows/cards. */
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  const c = useAppColors();
  return (
    <View style={styles.section}>
      {title ? (
        <Text
          style={[textStyles.footnote, styles.sectionTitle, { color: c.text.tertiary }]}
          accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  column: { flex: 1, width: '100%', alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  content: {
    paddingHorizontal: layout.screenPaddingH,
    gap: spacing.lg,
  },
  section: { gap: spacing.sm },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 0.5 },
});
