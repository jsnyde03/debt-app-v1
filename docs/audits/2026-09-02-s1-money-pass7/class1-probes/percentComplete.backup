/**
 * S1.13.7.5 [pass-6 `C3-3`] — **A WHOLE-PERCENT LABEL IS A CLAIM AT ITS ENDPOINTS, AND `Math.round` MAKES
 * THAT CLAIM ON EVIDENCE THAT CONTRADICTS IT.**
 *
 * ⛔ **The measured defect.** `Math.round(fraction * 100)` is symmetric, so **any residue below 0.5% of
 * the original rounds up into 100** — a *completeness* statement. The widget reported **"100% paid"** on
 * the same face as **"$5 left"**; on Progress the same expression lit the gold **"Free"** milestone node
 * and VoiceOver announced *"all milestones reached"*, over money the user still owes.
 *
 * ⚡ **The distinction the codebase already draws, and this crossed it.** Every other rounding here is
 * `Math.round(n * 100) / 100` — cents, a **precision** choice, where being a half-cent out is nothing.
 * These are `Math.round(fraction * 100)` — **whole percent**, where the top of the range is not a
 * rounding at all but an assertion that there is nothing left.
 *
 * ⚠️ **Both ends, not just the top.** `0%` is the mirror claim — *"you have paid nothing"* — and a user
 * who has paid $3 of $10,000 has not paid nothing. Rounding toward the honest interior at both ends is
 * one rule, not two special cases.
 *
 * ⛔ **This does not clamp the fraction; it clamps the LABEL.** The underlying ratio still drives rings,
 * bars and gauges at full precision — a progress ring that stops at 99% of its sweep would be a second
 * false statement. What changes is only the number a sentence states.
 */

/**
 * The whole-percent figure to PRINT for a completion ratio.
 *
 * `100` only when the ratio genuinely reaches 1; `0` only when it is genuinely 0. Everything in between
 * is squeezed into `1..99`, so a label can never make a claim the balance contradicts.
 *
 * ⚠️ Non-finite input returns `0` rather than throwing: this is display formatting on a surface that must
 * not crash, and `NaN` reaching a percent label is the caller's defect to fix — see `assertNumeric.ts`.
 */
export function percentCompleteLabel(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  if (ratio >= 1) return 100;
  if (ratio <= 0) return 0;
  return Math.min(99, Math.max(1, Math.round(ratio * 100)));
}
