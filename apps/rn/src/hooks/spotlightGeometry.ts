/**
 * 3.5.3.3.1 — the spotlight's scroll math, deliberately free of React and react-native.
 *
 * Same reasoning as `tutorialPath.ts`: the failure modes here are all silent (a beat that describes
 * something hidden behind its own coaching card, a screen that twitches on every step), and none of
 * them throw. Keeping the decision pure means it can be pinned by assertions instead of by looking.
 */

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How far to scroll so the subject sits inside the stage — the band between the screen header and the
 * coaching dock. Positive scrolls down (content moves up); 0 means "already framed, don't move".
 *
 * A subject TALLER than the stage can't be framed, so it aligns to the top and accepts the overflow:
 * centering it would hide the beginning of the very thing the user is being asked to read.
 */
export function scrollDelta(rect: TargetRect, stageTop: number, stageBottom: number): number {
  const stageHeight = stageBottom - stageTop;
  if (rect.height >= stageHeight) return rect.y - stageTop;
  if (rect.y < stageTop) return rect.y - stageTop; // above the stage → scroll up (negative)
  if (rect.y + rect.height > stageBottom) return rect.y + rect.height - stageBottom;
  return 0;
}
