import type { TrajectoryPoint } from '@/store/payoffSelectors';

/**
 * [P1-3 / D58] How wide the payoff chart's x-axis is, and where the comparison curves get cut off.
 *
 * ⛔ **The domain used to be the extent of everything drawn, and the minimums ghost is by definition the
 * longest of them.** So the better the plan, the smaller the share of the axis the user's own line got.
 * Measured on the app's own seeds: a plan clearing in **8 months** against a **109-month** minimums curve
 * gave the user's curve **7.3%** of the width; the near-payoff seed gave it **4.8%** — a few pixels at the
 * left edge, eight empty years to the right, and the debt-free pill stranded past the first axis tick.
 * ⚡ **It failed in the direction of the user doing WELL**, on the tab whose entire job is that news.
 *
 * Pure and separately tested because it is arithmetic with three edge cases that a rendered chart makes
 * expensive to check: a plan that never clears, a variable-income cone that clears later than the typical
 * plan, and a payoff so near that the axis needs a floor rather than a clamp.
 */

/**
 * `DOMAIN_MARGIN` leaves room right of the payoff so the endpoint bead and its date pill are not jammed
 * against the frame. `MIN_DOMAIN_MONTHS` is the floor: a plan clearing in two months would otherwise be a
 * three-point chart, which is a different kind of unreadable from the one being fixed.
 */
export const DOMAIN_MARGIN = 1.15;
export const MIN_DOMAIN_MONTHS = 6;

/** The month a trajectory reaches zero, or `null` if it never does within its horizon. */
export function clearMonth(traj: TrajectoryPoint[]): number | null {
  return traj.find((p) => p.balance <= 0)?.month ?? null;
}

/**
 * The x-axis span, in months.
 *
 * ⚠️ **Two properties the pre-clamp expression got RIGHT, which this keeps:**
 * - the **lean** curve (variable income) pays off later than the typical plan, and the domain has to reach
 *   its date or the cone is clipped — so "the user's own plan" is the latest of *their* curves, never the
 *   active one alone;
 * - a plan that **never clears** has no end to clamp to and must still draw across the full extent.
 */
/**
 * The debt-free end pill's width, as an UPPER BOUND. [V3-5 · P6.8.9.7.7]
 *
 * ⛔ **Extracted so it can be tested at all.** V3-5's fix was correct and came back `CLOSED-UNPINNED` for a
 * structural reason no better test could have solved: it lived as an inline expression inside a component,
 * `fontScale` is **always 1 in react-native-web** so no e2e can vary it, and `lint:type-scale`'s floor is
 * 30 pt while this pill's text is 11 pt. **Nothing in the repo could reach it.** A pure function can be
 * driven at any scale by a unit test, which is the only instrument that was ever going to work here.
 *
 * ⚠️ An UPPER bound, deliberately — the 6.5 is a per-character advance estimate for an 11 pt bold face, and
 * it must never UNDER-estimate or the pill clamps to a box smaller than it draws. Scaled by the same
 * `min(fontScale, LABEL_SCALE_MAX)` ceiling the pill's own text is capped at, so the estimate stays exact
 * at the ceiling rather than being right only at 1×.
 */
export function endPillWidth(label: string | null, fontScale: number, scaleMax: number): number {
  const chars = label ? label.length : 8;
  return (20 + chars * 6.5) * Math.min(fontScale, scaleMax);
}

export function trajectoryDomain({
  active,
  cone,
  all,
}: {
  /** The plan being drawn bold — snowball or avalanche. */
  active: TrajectoryPoint[];
  /** The lean/safe-floor curve, or empty when there is no variable-income band. */
  cone: TrajectoryPoint[];
  /** Everything on the chart, including the minimums ghost. */
  all: TrajectoryPoint[];
}): number {
  const rawEnd = Math.max(1, ...all.map((p) => p.month));
  const activeEnd = clearMonth(active);
  if (activeEnd == null) return rawEnd;
  const ownEnd = Math.max(activeEnd, clearMonth(cone) ?? 0);
  return Math.min(rawEnd, Math.max(MIN_DOMAIN_MONTHS, Math.ceil(ownEnd * DOMAIN_MARGIN)));
}

/**
 * Cut a comparison curve off at the frame.
 *
 * ⛔ Clamping the domain means the minimums ghost now runs PAST the right edge, and a path drawn beyond
 * the plot is at the mercy of whether the canvas happens to clip. Truncating the points makes the
 * behaviour identical on every renderer — and it is also the reading we want: the user's line reaches
 * zero while the grey one is still high, walking off the edge unfinished.
 *
 * ⚠️ Keeps the FIRST point past the domain, so the last segment reaches the edge instead of stopping short
 * of it and leaving a visible gap.
 */
export function truncateToDomain(traj: TrajectoryPoint[], maxMonth: number): TrajectoryPoint[] {
  const cut = traj.findIndex((p) => p.month > maxMonth);
  return cut === -1 ? traj : traj.slice(0, cut + 1);
}
