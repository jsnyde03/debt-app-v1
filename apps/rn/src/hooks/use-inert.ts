import { useEffect, type RefObject } from 'react';
import { Platform } from 'react-native';

/**
 * The TAB-ORDER half of an accessibility fence, on web.
 *
 * `aria-hidden` removes a subtree from the accessibility tree, and on native that is the whole job — RN
 * expands it into `accessibilityElementsHidden` + `importantForAccessibility`, neither of which has a
 * separate focus concept. On web the two questions come apart: react-native-web gives every `Pressable`
 * an explicit `tabIndex` — `0` unless the Pressable is `disabled`, in which case `-1`
 * (`react-native-web/src/exports/Pressable/index.js`) — so a fenced region keeps its enabled controls in
 * the tab order, and a fence that happens to hold today may be resting on an unrelated `disabled`. Hidden
 * from a screen reader AND reachable by Tab is the `aria-hidden-focus` violation — worse than either
 * alone, because the element announces nothing when it receives focus.
 *
 * `inert` is the one attribute that closes both, and it has no RN equivalent, so it is applied to the
 * host node directly. A runtime `Platform.OS` check rather than a `.web.ts` split: a platform-split file
 * that overrides one export has to re-export the rest, and getting that wrong has bitten this codebase
 * before with device-only `undefined`s.
 */
export function useInert(ref: RefObject<unknown>, active: boolean): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node?.setAttribute) return;
    if (active) node.setAttribute('inert', '');
    else node.removeAttribute('inert');
    return () => node.removeAttribute('inert');
  }, [ref, active]);
}
