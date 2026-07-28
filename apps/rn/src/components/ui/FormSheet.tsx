import { type ReactNode, useCallback, useEffect, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { SheetScrim } from '@/components/ui/SheetScrim';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { elevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { confirmDiscard } from '@/utils/confirm';

const ENTER = { damping: 22, stiffness: 240, mass: 0.7 };
const DISMISS_DISTANCE = 110; // px dragged down
const DISMISS_VELOCITY = 800; // px/s flick

/**
 * A slide-up bottom sheet for the unified add/edit forms (the B.6 redesign — one sheet drives both
 * modes). 3.4.5 premium polish: a hand-driven present (Modal `none`) so the frosted `SheetScrim` FADES
 * in place while the sheet SPRINGS up (the old `animationType="slide"` slid the whole scrim as a panel —
 * a "custom modal" tell); a grabber + swipe-down-to-dismiss (pan on the header zone only, so scrolling
 * never dismisses; the Modal content is wrapped in its own `GestureHandlerRootView` because native
 * Modals render outside the app's root); a dark elevated surface + luminous top edge (dark-mode parity);
 * an ✕-in-circle close; and a keyboard-aware backdrop (tap dismisses the keyboard first) + optional
 * `dirty` discard-guard. Renders title + subtitle + a scrollable field body + a sticky submit.
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
  dirty,
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
  /** When the form has unsaved edits, a tap/swipe dismiss asks to confirm before discarding (3.4.5.5). */
  dirty?: boolean;
  children: ReactNode;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const { height: winH } = useWindowDimensions();

  const sheetH = useSharedValue(winH); // measured onLayout; the enter starts the sheet this far below
  const progress = useSharedValue(reduce ? 1 : 0); // 0 = off-screen/scrim-clear → 1 = seated/scrim-full
  const dragY = useSharedValue(0);

  useEffect(() => {
    progress.value = reduce ? 1 : withSpring(1, ENTER);
  }, [reduce, progress]);

  // Keyboard-aware backdrop: track whether the software keyboard is up (never fires on web).
  const keyboardUp = useRef(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => (keyboardUp.current = true));
    const hide = Keyboard.addListener('keyboardDidHide', () => (keyboardUp.current = false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const dismiss = useCallback(() => {
    if (reduce) {
      onClose();
      return;
    }
    dragY.value = withTiming(sheetH.value, { duration: 200 });
    progress.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [reduce, dragY, progress, sheetH, onClose]);

  const requestClose = useCallback(async () => {
    if (dirty && !(await confirmDiscard())) {
      dragY.value = withSpring(0, ENTER); // cancelled → settle the sheet back
      return;
    }
    dismiss();
  }, [dirty, dismiss, dragY]);

  const onBackdrop = useCallback(() => {
    // Keyboard-aware: a tap above a lifted sheet should put the keyboard away, not lose the whole form.
    if (keyboardUp.current) {
      Keyboard.dismiss();
      return;
    }
    void requestClose();
  }, [requestClose]);

  // Pan only activates after a deliberate downward drag, so taps on the close/headerAction still register.
  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      dragY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(requestClose)();
      } else {
        dragY.value = withSpring(0, ENTER);
      }
    });

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [sheetH.value, 0]) + dragY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => void requestClose()}>
      <GestureHandlerRootView style={styles.flex}>
        {/* KeyboardAvoidingView lifts the sheet (and its sticky submit) above the keyboard — the
            decimal-pad has no return key, so an un-lifted submit is unreachable on device (RN lesson #9). */}
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]} pointerEvents="none">
            <SheetScrim />
          </Animated.View>
          <Pressable style={StyleSheet.absoluteFill} onPress={onBackdrop} accessibilityLabel="Close" />
          <Animated.View
            onLayout={(e) => (sheetH.value = e.nativeEvent.layout.height + insets.bottom)}
            style={[
              styles.sheet,
              { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base },
              elevation.raised[scheme],
              scheme === 'dark' && styles.sheetDarkEdge,
              sheetStyle,
            ]}>
            <GestureDetector gesture={pan}>
              <View style={styles.grabZone}>
                <View style={[styles.grabber, { backgroundColor: c.text.tertiary }]} />
                <View style={styles.header}>
                  <View style={styles.flex}>
                    <Text style={[textStyles.title2, { color: c.text.primary }]}>{title}</Text>
                    {subtitle ? (
                      <Text style={[textStyles.subhead, { color: c.text.secondary }]} numberOfLines={1}>
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
                    style={[styles.closeBtn, { backgroundColor: c.background.tertiary }]}>
                    <AppIcon name="close" size={17} color={c.text.secondary} />
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

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
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' }, // dim + blur come from the animated <SheetScrim />
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: layout.cardRadiusLarge,
    borderTopRightRadius: layout.cardRadiusLarge,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  // Dark parity: near-black backdrop can't separate a navy sheet by shadow alone, so the sheet lifts by a
  // luminous top edge (the Elevation-language move, matching the hero panel).
  sheetDarkEdge: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  grabZone: { paddingTop: spacing.sm, gap: spacing.sm },
  grabber: { width: 36, height: 5, borderRadius: 3, opacity: 0.4, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.base, paddingVertical: spacing.xs },
  actions: { gap: spacing.xs },
  remove: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
