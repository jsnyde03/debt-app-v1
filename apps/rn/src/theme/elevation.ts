/**
 * Debt Planner — elevation (how a surface lifts off the ground).
 *
 * The parity move (Elevation visual language): **LIGHT lifts by a soft NAVY-TINTED shadow** — white
 * cards float on the cool ground, restoring the depth light was missing — while **DARK lifts mostly
 * by value** + a soft black shadow. Uses RN 0.76+ `boxShadow` (cross-platform on New Arch + web) so
 * the tint + multi-layer softness carry everywhere; `elevation`/`shadow*` props can't tint on Android.
 *
 * ⚠️ Device note: `boxShadow` + `overflow:'hidden'` on the same view — confirm shadows aren't clipped
 * on iOS at the batched native build; if clipped, move the shadow to a non-clipping wrapper view.
 */

import { StyleSheet, type ViewStyle } from 'react-native';

import type { ColorScheme } from './colors';

type Elev = Record<ColorScheme, ViewStyle>;

export const elevation: { card: Elev; raised: Elev; hero: Elev } = {
  // resting content cards
  card: {
    light: { boxShadow: '0px 8px 22px rgba(16, 38, 84, 0.12), 0px 1.5px 3px rgba(16, 38, 84, 0.10)' },
    dark: { boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.38)' },
  },
  // sheets / modals / high-lift surfaces
  raised: {
    light: { boxShadow: '0px 16px 40px rgba(16, 38, 84, 0.16)' },
    dark: { boxShadow: '0px 16px 40px rgba(0, 0, 0, 0.5)' },
  },
  // the navy hero/beat panel's own lift off the screen. In LIGHT it pops as a dark island on the cool
  // ground (shadow alone). In DARK a black shadow can't separate navy-on-near-black, so the panel lifts
  // by a hairline luminous EDGE instead — brighter on top to catch light — restoring the island in dark.
  hero: {
    light: { boxShadow: '0px 14px 30px rgba(8, 20, 50, 0.30)' },
    dark: {
      boxShadow: '0px 14px 30px rgba(0, 0, 0, 0.5)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderTopColor: 'rgba(255, 255, 255, 0.14)',
    },
  },
};

/** The resting content-card shadow for the active scheme. */
export function cardElevation(scheme: ColorScheme): ViewStyle {
  return elevation.card[scheme];
}
