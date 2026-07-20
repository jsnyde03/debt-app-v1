/**
 * Debt Planner — motion tokens.
 *
 * Spring physics over easing (except color fades). Entrances fast (~300ms), exits faster (~150ms).
 * All entrance animations must degrade to a fade under Reduce Motion. (Reanimated arrives at B.8;
 * these tokens are the contract screens animate against.)
 */

export const spring = {
  default: { damping: 22, stiffness: 280, mass: 1 }, // smooth + confident
  snappy: { damping: 18, stiffness: 350, mass: 0.9 }, // button press, haptic-paired
  gentle: { damping: 28, stiffness: 200, mass: 1 }, // number counter, chart
  bouncy: { damping: 12, stiffness: 300, mass: 1 }, // milestone achievement only
} as const;

export const duration = {
  instant: 100,
  fast: 200,
  default: 300,
  slow: 500,
  chart: 800,
  counter: 600,
} as const;

/** Per-item entrance delays for list/ladder reveals (ms). Kept small — restraint. */
export const stagger = {
  list: 40,
} as const;

/**
 * Debt-paid-off celebration timeline — ms offsets for the composed Skia spectacle.
 * See DEBT_MOTION_SPEC §5. Reduce Motion collapses the whole sequence to a crossfade into the
 * final state (haptics retained).
 */
export const celebration = {
  panelIn: 0, // navy beat panel composes in (scale 0.96->1 + fade), spring.default
  ringSweep: 100, // gold ring sweeps current%->100% (Skia), duration.chart
  checkPop: 900, // check pops (spring.bouncy) + success haptic + bespoke pattern
  balanceRoll: 1000, // balance rolls to $0, duration.counter
  cascade: 1500, // freed payment travels to the next debt + impactLight
  interestSaved: 1700, // "interest saved" fades in
  cta: 1900, // "Keep going" CTA enters last
} as const;

export type SpringToken = keyof typeof spring;
export type DurationToken = keyof typeof duration;
