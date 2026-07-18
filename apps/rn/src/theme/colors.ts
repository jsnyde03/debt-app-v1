/**
 * Debt Planner — semantic color system (the RN design system's single source of truth).
 *
 * Debt's own identity, ported from the Capacitor CSS tokens (`app/styles/00-theme-and-base.css`):
 * a cool **slate/navy** base with a **blue** interactive accent and a **purple** accent reserved
 * for premium surfaces + achievement. Deliberately NOT Freedom's teal/gold — this keeps Debt
 * unmistakably Debt while adopting Freedom's token *architecture*.
 *
 * Every token carries a `light` + `dark` value. Components never use raw hex — they read a
 * resolved token via `useAppColors()`.
 */

export type ColorScheme = 'light' | 'dark';

/** A light/dark value pair. Leaves of the token tree. */
export interface ColorPair {
  light: string;
  dark: string;
}

export const colors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  background: {
    primary: { light: '#e9eef5', dark: '#07111f' }, // screen bg (deep navy on dark)
    secondary: { light: '#ffffff', dark: '#1e293b' }, // card bg
    tertiary: { light: '#e8edf5', dark: '#111c30' }, // grouped/muted section bg
    elevated: { light: '#ffffff', dark: '#111827' }, // raised surface
    overlay: { light: 'rgba(255,255,255,0.72)', dark: 'rgba(17,24,39,0.82)' }, // glass surfaces
    scrim: { light: 'rgba(15,23,42,0.45)', dark: 'rgba(0,0,0,0.55)' }, // modal backdrop
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary: { light: '#0f172a', dark: '#f8fafc' },
    secondary: { light: '#64748b', dark: '#d6e0ee' },
    tertiary: { light: '#94a3b8', dark: '#94a3b8' },
    inverse: { light: '#ffffff', dark: '#0f172a' },
    onAccent: { light: '#ffffff', dark: '#08111f' }, // text sitting on an accent fill
  },

  // ── Brand / Accent ───────────────────────────────────────────────────────────
  accent: {
    primary: { light: '#2563eb', dark: '#60a5fa' }, // blue — interactive / action
    brand: { light: '#0f172a', dark: '#60a5fa' }, // primary CTA fill (navy light / blue dark)
    purple: { light: '#9333ea', dark: '#a855f7' }, // premium surfaces + upsell
    success: { light: '#16a34a', dark: '#4ade80' }, // on-plan / paid / progress
    warning: { light: '#d97706', dark: '#fbbf24' },
    danger: { light: '#dc2626', dark: '#f87171' }, // overdue / validation
    gold: { light: '#b45309', dark: '#fcd34d' }, // achievement / milestone badge
  },

  // ── Borders / Separators ─────────────────────────────────────────────────────
  border: {
    subtle: { light: 'rgba(15,23,42,0.06)', dark: 'rgba(255,255,255,0.08)' },
    default: { light: 'rgba(15,23,42,0.10)', dark: 'rgba(255,255,255,0.12)' },
    strong: { light: 'rgba(15,23,42,0.18)', dark: 'rgba(255,255,255,0.20)' },
  },
} satisfies Record<string, Record<string, ColorPair>>;

export type ColorTokens = typeof colors;

/**
 * Progress ramp — a SINGLE semantic color (`accent.success`) deepening with progress; never a
 * red/yellow/green traffic light. The user is always making progress; 100%+ crosses to gold.
 */
export function progressColor(percent: number, scheme: ColorScheme): string {
  if (percent >= 100) return colors.accent.gold[scheme];
  const base = scheme === 'dark' ? '74,222,128' : '22,163,74'; // success rgb per scheme
  const opacity = percent >= 75 ? 1 : percent >= 50 ? 0.8 : percent >= 25 ? 0.65 : 0.5;
  return `rgba(${base},${opacity})`;
}

/** A fully scheme-resolved token tree: every `{light,dark}` leaf collapsed to its string. */
export type ResolvedColors = {
  [G in keyof ColorTokens]: { [K in keyof ColorTokens[G]]: string };
};

/** Resolve the whole token tree for one scheme (used by the `useAppColors` hook). */
export function resolveColors(scheme: ColorScheme): ResolvedColors {
  const out = {} as Record<string, Record<string, string>>;
  for (const group of Object.keys(colors) as (keyof ColorTokens)[]) {
    const resolvedGroup: Record<string, string> = {};
    const tokenGroup = colors[group] as Record<string, ColorPair>;
    for (const token of Object.keys(tokenGroup)) {
      resolvedGroup[token] = tokenGroup[token][scheme];
    }
    out[group] = resolvedGroup;
  }
  return out as ResolvedColors;
}
