import { PixelRatio } from 'react-native';

import { spacing } from '@/theme/spacing';

/**
 * The STAGE: the band of screen a coached subject is allowed to occupy — below the header, above the
 * coaching dock.
 *
 * Shared because two places need the same answer and had no way to agree on it: the SCREEN scrolls the
 * subject into the stage, and the OVERLAY must not draw the highlight outside it. Unclamped, a subject
 * taller than the band — the at-risk Guardian card is ~697pt against a ~530pt stage — has its ring drawn
 * straight across the coaching dock, a hard accent rule slicing the sentence in half in both themes.
 */

/**
 * `Screen`'s title header — the top of the stage.
 *
 * [B4] Scaled by the user's text size rather than fixed at 56. The header's title grows with Dynamic
 * Type; the constant did not, so at large sizes `stageTop` pointed part-way UP into the header and a
 * subject "scrolled into the stage" could come to rest behind it — the exact failure the stage exists to
 * prevent, appearing only for the users who most need the coaching to be legible.
 *
 * Deliberately an approximation, and deliberately biased to OVER-estimate: guessing the header too tall
 * parks the subject slightly lower than necessary, which is invisible; guessing it too short hides the
 * subject, which is the bug. Measuring the real header would mean threading a layout callback out of the
 * shared `Screen` component for every screen in the app to serve one overlay — a poor trade for the
 * precision it would buy, given the stage is a band and not a pixel.
 *
 * No upper clamp. A `Math.min(2, …)` here inverted that bias exactly where it mattered most: the real
 * header is padding plus a 28pt title that keeps growing, so above ~2.6× the estimate fell short and the
 * stage started inside the header — the failure this scaling exists to prevent, for the users who most
 * need the coaching legible.
 */
export function headerHeight(): number {
  return 56 * Math.max(1, PixelRatio.getFontScale());
}

/** The stage in WINDOW coordinates. `dockH` is the coaching dock's measured height (0 before it lays out). */
export function stageBounds(insetTop: number, screenH: number, dockH: number): { top: number; bottom: number } {
  return { top: insetTop + headerHeight(), bottom: screenH - dockH - spacing.sm };
}
