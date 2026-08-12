/**
 * 3.7.B.2 (F10.1) — Today's greeting: time-aware, and personalised once the user has told us a name.
 *
 * Pure by construction: the HOUR is a parameter, never read here. The only impure read is the single
 * `new Date().getHours()` at the render edge — which keeps every band boundary unit-testable and keeps
 * the reference screenshots reproducible (a test freezes the clock rather than mocking a module).
 *
 * ⚠️ These STRINGS are owned by the wording/voice gate, not by this file. 2026-07-30 deferred F10.1
 * "waits on the wording audit"; [D26] ships the mechanism now and leaves the copy to that pass. Change
 * the words there — the bands and the fallback behaviour are what this module is responsible for.
 */

/** Longest name we will render in the title. Beyond this a title1 line wraps and shoves the page down. */
export const MAX_DISPLAY_NAME = 24;

export type GreetingBand = 'morning' | 'afternoon' | 'evening';

/**
 * What we actually persist. Collapses interior whitespace and trims, so " jason  s " and "jason s" are
 * one value; empty-after-trim is `undefined` rather than `''`, so "cleared the field" and "never set it"
 * are the same state everywhere downstream (no reader has to know both).
 */
export function normalizeDisplayName(raw: string | undefined | null): string | undefined {
  const trimmed = (raw ?? '').replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.slice(0, MAX_DISPLAY_NAME) : undefined;
}

/** Morning 05:00–11:59 · afternoon 12:00–16:59 · evening 17:00–04:59. */
export function greetingBand(hour: number): GreetingBand {
  // Defensive normalisation: `getHours()` is always 0–23, but this is the one input from outside.
  const h = Number.isFinite(hour) ? ((Math.floor(hour) % 24) + 24) % 24 : 12;
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}

const BAND_TEXT: Record<GreetingBand, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
};

/** Today's header. Falls back to the bare time-of-day greeting when no name is set — the name is always optional. */
export function selectGreeting(displayName: string | undefined, hour: number): string {
  const band = BAND_TEXT[greetingBand(hour)];
  const name = normalizeDisplayName(displayName);
  return name ? `${band}, ${name}` : band;
}
