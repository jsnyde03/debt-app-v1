import { StyleSheet } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { APP_STORE_URL } from '@/utils/ecosystem';

/**
 * 3.5.7.7 — the marketing embed's ONE exit, as a REAL ANCHOR.
 *
 * ⭐ **WHY THIS IS NOT JUST `Button` + `Linking.openURL`.** The embed lives inside somebody else's page,
 * in an iframe, and the only thing it can ask of a visitor is "go get this on the App Store". A `<div
 * role="button">` that calls `window.open` gets that wrong in three separate ways there:
 *   ① a sandboxed iframe without `allow-popups` blocks `window.open` outright, and it fails **silently** —
 *      the single CTA on a marketing page does nothing and nobody finds out;
 *   ② middle-click, ⌘-click, "copy link address" and "open in new tab" do not exist on a `div`;
 *   ③ a screen reader announces "button" for something that leaves the page.
 * A real `<a href target="_blank">` has all three for free and needs no JavaScript at all. The precedent
 * is `DateField.web.tsx`: where the web has the right primitive, the `.web.tsx` uses the real DOM element
 * rather than reconstructing it.
 *
 * ⚠️ `rel="noopener noreferrer"` is not decoration on a cross-origin `target="_blank"` — without it the
 * opened page gets a handle on this one.
 *
 * ⚠️ THE STYLES ARE READ FROM THE SAME TOKENS `Button` READS, not copied from it. That is a second
 * consumer of the design system, which is what a design system is for — as opposed to a second copy of a
 * rule, which is the shape this repo keeps getting bitten by. If the brand fill moves, both move.
 */
export function AppStoreCta({ label, testID }: { label: string; testID?: string }) {
  const c = useAppColors();
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testID}
      style={{
        minHeight: 52,
        borderRadius: layout.buttonRadius,
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'solid',
        borderColor: 'transparent',
        backgroundColor: c.accent.brand,
        color: c.text.onAccent,
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecorationLine: 'none',
        fontSize: 17,
        fontWeight: '500',
      }}>
      {label}
    </a>
  );
}
