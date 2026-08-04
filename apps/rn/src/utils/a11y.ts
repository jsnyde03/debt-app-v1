import { AccessibilityInfo, type AccessibilityProps } from 'react-native';

/**
 * Accessibility primitives — the shared method so one fix propagates (DEBT_PHASE0_DESIGN_SYNTHESIS
 * §10). Standard is WCAG 2.2 AA + platform HIG; the expression is Debt's own. Screens/components
 * spread these rather than hand-rolling a11y props.
 */

/** Screen title / section heading — enables rotor-by-heading navigation. */
export function headerProps(label?: string): AccessibilityProps {
  return { accessibilityRole: 'header', ...(label ? { accessibilityLabel: label } : {}) };
}

/**
 * Collapse a row/card into ONE screen-reader utterance from its parts (empties dropped), so the
 * reader speaks "Visa, 18.9% APR, Focus, $4,210" as a unit instead of four stops. Numbers should
 * be passed already-formatted (and count-ups pass the FINAL value, never mid-roll).
 */
export function groupLabel(
  ...parts: (string | number | false | null | undefined)[]
): AccessibilityProps {
  const label = parts
    .filter((p) => p !== '' && p != null && p !== false)
    .map(String)
    .join(', ');
  return { accessible: true, accessibilityLabel: label };
}

/**
 * Hide a subtree from the accessibility tree — on EVERY platform, including web.
 *
 * Use this (or `decorative`) and never hand-roll the props. `aria-hidden` is not a web-only prop: RN
 * expands it to `accessibilityElementsHidden` + `importantForAccessibility` itself, so ONE prop covers
 * iOS and Android. The reverse is not true — react-native-web's prop allowlist contains neither native
 * prop, and `createDOMProps` drops unrecognised props silently with no warning.
 *
 * That asymmetry cost this codebase a whole class of invisible defects: the
 * `accessibilityElementsHidden` + `importantForAccessibility` pair was written out longhand at six call
 * sites — the walkthrough's screen fence, its control fence, MoreButton, the forecast link, the overlay
 * scrim and every sheet backdrop — and on web every one of them fenced NOTHING. Four audit rounds of
 * a11y work was "verified" by a Playwright suite running on the one platform where the fences did not
 * exist, which is why the suite stayed green through all of it. Round 6 (2026-08-04).
 */
export function a11yHidden(hidden: boolean): AccessibilityProps {
  return { 'aria-hidden': hidden };
}

/**
 * Hide a purely decorative visual (progress ring, gradient, glow, the Skia celebration, an icon
 * whose meaning is already in words) from the a11y tree — cross-platform. See `a11yHidden`.
 */
export const decorative: AccessibilityProps = { 'aria-hidden': true };

/**
 * Announce a transient change to screen readers — a new onboarding step, a crossed milestone, a
 * validation error, a blocking state that swaps in silently. Web-safe. Retained under Reduce Motion
 * (haptics + announcements are accessibility channels, not decoration).
 */
export function announce(message: string): void {
  if (!message) return;
  AccessibilityInfo.announceForAccessibility?.(message);
}
