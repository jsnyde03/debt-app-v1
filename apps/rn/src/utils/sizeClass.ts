/**
 * Window size class for adaptive (iPad / Split View) layout. Tracks the live window width, not the
 * device, so a resized Split View / Stage Manager window reflows correctly.
 *
 * - `compact`  — iPhone, or a narrow Split View column
 * - `regular`  — roomy iPad width: center + width-cap content, sidebar rail nav
 */

export type SizeClass = 'compact' | 'regular';

/** iPad portrait is 768pt+; below that is a phone / narrow split. */
const REGULAR_MIN_WIDTH = 768;
/** Landscape iPad / wide Stage Manager — screens may reflow to two columns. */
const EXPANDED_MIN_WIDTH = 1024;

export function resolveSizeClass(width: number): SizeClass {
  return width >= REGULAR_MIN_WIDTH ? 'regular' : 'compact';
}

export function resolveIsExpanded(width: number): boolean {
  return width >= EXPANDED_MIN_WIDTH;
}
