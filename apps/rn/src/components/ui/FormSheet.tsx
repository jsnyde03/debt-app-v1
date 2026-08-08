import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachMarkLayer } from '@/components/plan/CoachMarkLayer';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { sheetStyles } from '@/components/ui/sheet-styles';
import { useSheetPresentation } from '@/hooks/use-sheet-presentation';
import { elevation } from '@/theme/elevation';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * A slide-up bottom sheet for the unified add/edit forms (the B.6 redesign — one sheet drives both
 * modes). 3.4.5 premium polish (shared with the display/capture sheets via `useSheetPresentation` +
 * `sheetStyles`): the frosted `SheetScrim` FADES in place while the sheet SPRINGS up; a grabber +
 * swipe-down-to-dismiss (pan on the GRABBER only — the header sits deliberately OUTSIDE the detector,
 * so its touchables still receive taps on device; Modal content wrapped in its own
 * `GestureHandlerRootView`); a dark elevated surface + luminous top edge; an ✕-in-circle close; a
 * keyboard-aware backdrop + optional `dirty` discard-guard. Renders title + subtitle + a scrollable
 * field body + a sticky submit.
 */
export function FormSheet({
  visible,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onRemove,
  onClose,
  headerAction,
  footerAccessory,
  dirty,
  inline = false,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  submitLabel: string;
  onSubmit: () => void;
  onRemove?: () => void;
  onClose: () => void;
  /** Optional pressable pinned in the header row, just left of the close button (e.g. "View schedule"). */
  headerAction?: ReactNode;
  /**
   * [L5] A navigation affordance pinned BELOW the scrolling fields and ABOVE the sticky submit — always
   * on screen, never a scroll away.
   *
   * It exists because the alternative placements both failed on real hardware. As the last child of the
   * scroll, "View payoff schedule" was below the fold on the largest iPhone at default type (native
   * hierarchy 2026-08-06: row at `[20,877][420,925]`) and its nearest neighbour was the destructive
   * Remove. In the header — where 3.7.A0 originally put it — it was occluded by a presented Modal.
   *
   * Here it is neither: the submit button sits between it and Remove, so a mis-tap on a secondary
   * navigation row can no longer land on a destroy.
   */
  footerAccessory?: ReactNode;
  /** When the form has unsaved edits, a tap/swipe dismiss asks to confirm before discarding (3.4.5.5). */
  dirty?: boolean;
  /** 3.6.2 — render as an in-tree PANE (the iPad Money master-detail detail) instead of a Modal: same
   *  header + fields + submit/remove, but no scrim / grabber / swipe / ✕ (a pane isn't a dismissed sheet). */
  inline?: boolean;
  children: ReactNode;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { pan, scrimStyle, sheetStyle, onBackdrop, requestClose, onSheetLayout } = useSheetPresentation(onClose, dirty);

  // 3.6.2 — inline pane (iPad Money master-detail): the same header + fields + submit/remove, but no
  // Modal / scrim / grabber / swipe / ✕ (a pane isn't a dismissible sheet). `useSheetPresentation` is
  // still called above (hooks rule); its swipe/scrim just go unused here.
  if (inline) {
    return (
      <KeyboardAvoidingView
        style={[styles.inlineRoot, { backgroundColor: c.background.primary }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={sheetStyles.header}>
          <View style={sheetStyles.flex}>
            <Text style={[textStyles.title2, { color: c.text.primary }]}>{title}</Text>
            {subtitle ? (
              <Text style={[textStyles.subhead, { color: c.text.secondary }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {headerAction}
        </View>
        <ScrollView
          style={[styles.scroll, styles.scrollInline]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footerAccessory}
        <View style={styles.actions}>
          <Button label={submitLabel} onPress={onSubmit} />
          {onRemove ? (
            <Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
              <Text style={[textStyles.bodyMedium, { color: c.accent.danger }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onBackdrop}>
      <GestureHandlerRootView style={sheetStyles.flex}>
        {/* KeyboardAvoidingView lifts the sheet (and its sticky submit) above the keyboard — the
            decimal-pad has no return key, so an un-lifted submit is unreachable on device (RN lesson #9). */}
        <KeyboardAvoidingView style={sheetStyles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* [C4] The dim + tap-to-dismiss layer, shared by all three sheet shells. See `SheetBackdrop`
              for why it lives there and not inline. Touch behaviour is unchanged. */}
          <SheetBackdrop scrimStyle={scrimStyle} onPress={onBackdrop} />
          <Animated.View
            onLayout={onSheetLayout}
            style={[
              sheetStyles.sheet,
              { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base },
              elevation.raised[scheme],
              scheme === 'dark' && sheetStyles.sheetDarkEdge,
              sheetStyle,
            ]}>
            <GestureDetector gesture={pan}>
              <View testID="sheet-drag-handle" style={sheetStyles.dragHandle}>
                <View style={[sheetStyles.grabber, { backgroundColor: c.text.tertiary }]} />
              </View>
            </GestureDetector>
            {/* Header lives OUTSIDE the GestureDetector so headerAction + ✕ stay tappable on native. */}
            <View style={sheetStyles.header}>
              <View style={sheetStyles.flex}>
                <Text style={[textStyles.title2, { color: c.text.primary }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {headerAction}
              <Pressable
                testID="sheet-close"
                onPress={() => void requestClose()}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
                style={[sheetStyles.closeBtn, { backgroundColor: c.background.tertiary }]}>
                <AppIcon name="close" size={17} color={c.text.secondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            {footerAccessory}

            <View style={styles.actions}>
              <Button label={submitLabel} onPress={onSubmit} />
              {onRemove ? (
                <Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
                  <Text style={[textStyles.bodyMedium, { color: c.accent.danger }]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
        {/* 3.5.5.5 — the coach-mark layer, a SECOND time, inside this Modal.
            `CoachMarkLayer` is mounted at the app root by design, and a root-level overlay is a SIBLING
            of a presented Modal, so on device it renders BEHIND it — the same geometry that killed
            3.7.A0's header button, which `payoff-schedule.spec.ts` opens by describing. The web cannot
            show the difference (one DOM tree), so this is device-lane truth rather than a web finding.
            It sits inside the full-screen gesture root rather than inside the sheet, so a subject's
            window coordinates and the callout's frame share one space. The store is shared, so "one at a
            time" still holds across both mounts, and the layer renders null unless something is marked. */}
        <CoachMarkLayer nested />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.base, paddingVertical: spacing.xs },
  actions: { gap: spacing.xs },
  remove: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  // 3.6.2 inline pane — fill the detail column; the scroll grows so the submit/remove stick to the bottom.
  inlineRoot: { flex: 1, paddingTop: spacing.base },
  scrollInline: { flexGrow: 1 },
});
