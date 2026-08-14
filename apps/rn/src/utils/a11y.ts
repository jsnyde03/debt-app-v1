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
 * That asymmetry cost this codebase a whole class of invisible defects — fences written longhand fenced
 * NOTHING on web, and a Playwright suite running on that platform reported them all green.
 *
 * Never hand-roll the pair. Two things enforce it, because this file is the one the linter cannot check:
 * the `no-restricted-syntax` rule in `eslint.config.mjs` covers `apps/rn/src` (exempting this file), and
 * `npm run lint:a11y-props` greps source AND tests, which the linter's `globalIgnores` puts out of reach.
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
 * The value of an `adjustable` control (a slider), cross-platform.
 *
 * ⛔ `accessibilityValue` IS THE NATIVE-ONLY HALF OF THE ASYMMETRY THIS FILE EXISTS TO DOCUMENT.
 * react-native-web's prop allowlist does not contain it, so `createDOMProps` drops it silently and the
 * control renders `role="slider"` with **no `aria-valuenow`** — a slider that never reports its value,
 * which is a WCAG AA failure. Measured on the cushion slider 2026-08-08 and recorded in
 * `CushionFloorSheet`; `a11y-axe` does not flag it, so nothing caught it either.
 *
 * ⭐ The `aria-*` form is the one that covers BOTH: RN 0.85 types `aria-valuemin/max/now/valuetext`
 * directly off `AccessibilityValue` and expands them to the native prop itself — the same aliasing that
 * makes `aria-hidden` work everywhere. So this is one rule in one place, not the same rule written twice.
 *
 * ⚠️ Deliberately NOT paired with `accessibilityValue`. Setting both would be the "two places, one rule"
 * shape this repo has repeatedly paid for; the aliasing is what makes the pair unnecessary.
 * ⚠️ `text` is load-bearing and not decoration: `now` alone is spoken as a bare number ("200"), which is
 * meaningless for money. The 3.5.3.9 audit is what established that.
 */
export function a11yAdjustableValue(
  min: number,
  max: number,
  now: number,
  text: string,
): AccessibilityProps {
  return { 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': now, 'aria-valuetext': text };
}

/**
 * Announce a transient change to screen readers — a new onboarding step, a crossed milestone, a
 * validation error, a blocking state that swaps in silently. Web-safe. Retained under Reduce Motion
 * (haptics + announcements are accessibility channels, not decoration).
 */
export function announce(message: string): void {
  if (!message) return;
  AccessibilityInfo.announceForAccessibility?.(message);
}
