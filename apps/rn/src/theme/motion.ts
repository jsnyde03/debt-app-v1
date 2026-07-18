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

export type SpringToken = keyof typeof spring;
export type DurationToken = keyof typeof duration;
