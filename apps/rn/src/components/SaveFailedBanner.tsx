import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * A write did not land. Non-blocking, because the store on screen is correct and still editable — the
 * only thing wrong is that it is not durable yet.
 *
 * ⚠️ It clears itself: `save` drops `storageError` the moment a write succeeds, and autosave retries on
 * every change, so an ordinary transient fault resolves without the user doing anything. That is the
 * whole reason this is a banner rather than a modal — the recovery does not need them.
 *
 * ⛔ It exists because a `storageError` nobody renders is worse than not recording one. The state was
 * added so the user finds out BEFORE next launch; leaving it unshown would keep the silent-loss defect
 * exactly as it was while making the code look like it had been fixed.
 */
export function SaveFailedBanner() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const failed = useAppStore((s) => s.storageError) === 'save-failed';
  if (!failed) return null;

  return (
    <View
      style={[styles.wrap, { top: insets.top + spacing.xs, backgroundColor: c.background.elevated, borderColor: c.accent.warning }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      testID="save-failed-banner"
    >
      <Text style={[textStyles.footnote, { color: c.text.primary }]}>
        Couldn&rsquo;t save your last change to this device. It&rsquo;s still here — we&rsquo;ll keep
        trying.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
