import { useCallback, useEffect, useRef, useState } from 'react';
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

  /**
   * 4.1.4c — has the entrance finished, i.e. is the sheet's content where it will actually stay?
   *
   * ⛔ **A coached control inside this sheet measures WRONG until this flips.** The enter animates
   * `translateY` from `sheetH` to 0, so at the first frame the whole sheet — footer accessory included —
   * is a full sheet-height BELOW its seated position. `TutorialTarget`'s `onLayout` fires there, and
   * `measureInWindow` faithfully reports that transient position: run 31700074087 measured the payoff
   * schedule row at **y=1702** on a 956pt screen (≈880 seated + ≈820 of sheet height), so the coach mark
   * drew ~1570pt down and was never visible. Nothing re-measured, because layout had not changed — only
   * position had.
   *
   * ⚡ It is a STATED SIGNAL rather than a delay, which is the same correction `use-coach-mark` already
   * made once when it replaced a 600 ms mount timer with the layout event. Layout was the right signal
   * for "the subject exists"; it is the wrong one for "the subject has arrived".
   *
   * Reduce Motion snaps, so there is no transient and this is true immediately.
   */
  const [settled, setSettled] = useState(reduce);

  useEffect(() => {
    if (reduce) {
      progress.value = 1;
      setSettled(true);
      return;
    }
    progress.value = withSpring(1, ENTER, (finished) => {
      if (finished) runOnJS(setSettled)(true);
    });
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

  return { pan, scrimStyle, sheetStyle, onBackdrop, requestClose, onSheetLayout, settled };
}
