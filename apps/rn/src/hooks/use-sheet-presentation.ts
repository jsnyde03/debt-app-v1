import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, type LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { interpolate, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirmDiscard } from '@/utils/confirm';

const ENTER = { damping: 22, stiffness: 240, mass: 0.7 };
const DISMISS_DISTANCE = 110; // px dragged down
const DISMISS_VELOCITY = 800; // px/s flick

/**
 * 3.4.5 — the shared premium-sheet presentation, so `FormSheet` and the display/capture sheets behave
 * identically: the frosted scrim FADES in place while the sheet SPRINGS up (Modal must be
 * `animationType="none"`); a grabber-zone pan dismisses past a distance/velocity threshold; a
 * keyboard-aware backdrop dismisses the keyboard before the sheet; and an optional `dirty` flag guards
 * discard. Reduce Motion snaps + skips the exit animation. Callers render the returned styles/handlers.
 */
export function useSheetPresentation(onClose: () => void, dirty?: boolean) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const { height: winH } = useWindowDimensions();

  const sheetH = useSharedValue(winH); // measured via onSheetLayout; the enter starts the sheet this far below
  const progress = useSharedValue(reduce ? 1 : 0); // 0 = off-screen / scrim-clear → 1 = seated / scrim-full
  const dragY = useSharedValue(0);

  useEffect(() => {
    progress.value = reduce ? 1 : withSpring(1, ENTER);
  }, [reduce, progress]);

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
    if (keyboardUp.current) {
      Keyboard.dismiss(); // a tap above a lifted sheet puts the keyboard away, not the form
      return;
    }
    void requestClose();
  }, [requestClose]);

  // Only activates after a deliberate downward drag, so taps (close/action) and body scroll are safe.
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
  const onSheetLayout = useCallback(
    (e: LayoutChangeEvent) => {
      sheetH.value = e.nativeEvent.layout.height + insets.bottom;
    },
    [sheetH, insets.bottom],
  );

  return { pan, scrimStyle, sheetStyle, onBackdrop, requestClose, onSheetLayout };
}
