/**
 * Motion primitives — the in-house ergonomic layer over Reanimated, bound to the `motion.ts` tokens.
 * Screens animate through THESE (never raw Reanimated) so the vocabulary stays consistent and the
 * whole system is swappable. See DEBT_MOTION_SPEC.
 */

export { Motion } from './Motion';
export { CountUp } from './CountUp';
export { useReduceMotion, useSpringValue } from './hooks';
export { haptics } from './haptics';
