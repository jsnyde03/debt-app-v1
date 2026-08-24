import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { useAppStore } from '@/store/useAppStore';
import { useLiveAnnouncement } from '@/utils/a11y';
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
/**
 * The spoken form, as ONE string — the rendered copy is three JSX text nodes with entities in them, and an
 * announcement cannot be assembled from those. Kept adjacent to the copy it mirrors.
 */
const SAVE_FAILED_SPOKEN =
  'Couldn’t save your last change to this device. It’s still here — we’ll keep trying.';

export function SaveFailedBanner() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const failed = useAppStore((s) => s.storageError) === 'save-failed';
  /**
   * ⛔ **ABOVE THE EARLY RETURN, AND THAT IS THE WHOLE EDIT.** This was a bare
   * `accessibilityLiveRegion="polite"` — which RNW forwards to `aria-live`, so web announced and **iOS was
   * silent**, on the one banner that exists to tell a user a write did not land. A1-10 quoted this exact
   * line; cluster f built the primitive and never converted it (`git log`: one commit, pre-dating f).
   *
   * ⚠️ `useLiveAnnouncement` is a HOOK, so it cannot live after `if (!failed) return null`. Passing
   * `null` while there is nothing to say is the primitive's stated contract, and it is also what stops the
   * message re-firing: it announces only when the string CHANGES.
   */
  const live = useLiveAnnouncement(failed ? SAVE_FAILED_SPOKEN : null);
  if (!failed) return null;

  return (
    <View
      style={[styles.wrap, { top: insets.top + spacing.xs, backgroundColor: c.background.elevated, borderColor: c.accent.warning }]}
      accessibilityRole="alert"
      {...live}
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
