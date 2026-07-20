/**
 * Debt Planner — semantic color system (the RN design system's single source of truth).
 *
 * Debt's own identity (Elevation visual language, 2026-07-20): a cool **slate/navy** base with a
 * **single blue** interactive accent. Green/gold/red are **semantic** (progress / achievement /
 * overdue), NOT brand accents. The signature move: the **navy hero/beat panels (`surface.hero*`)
 * are CONSTANT in both themes** — the payday number, the progress ring, and the paid-off moment
 * always sit on deep navy, so the emotional beats are identically premium in light and dark, and
 * light carries the brand ground. Light lifts cards by a soft navy-tinted shadow (see the elevation
 * helper); dark lifts by value. Warmth (gold) is spent only on the beats.
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
    primary: { light: '#e6ebf3', dark: '#07111f' }, // screen bg (cool tint / deep navy)
    secondary: { light: '#ffffff', dark: '#152340' }, // card bg (lifts by shadow on light)
    tertiary: { light: '#dce4f0', dark: '#0d1830' }, // grouped/muted section bg
    elevated: { light: '#ffffff', dark: '#1a2a49' }, // raised surface
    overlay: { light: 'rgba(255,255,255,0.72)', dark: 'rgba(20,35,64,0.82)' }, // glass surfaces
    scrim: { light: 'rgba(11,26,56,0.45)', dark: 'rgba(0,0,0,0.55)' }, // modal backdrop
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary: { light: '#111a2e', dark: '#f3f8ff' },
    secondary: { light: '#5a6b82', dark: '#a6b9d4' },
    tertiary: { light: '#8695ab', dark: '#6f83a1' },
    inverse: { light: '#ffffff', dark: '#0f172a' },
    onAccent: { light: '#ffffff', dark: '#08111f' }, // text sitting on an accent fill
  },

  // ── Brand / Accent (single blue accent + semantic) ───────────────────────────
  accent: {
    primary: { light: '#2f66ea', dark: '#5b9dff' }, // blue — the ONE interactive accent
    accentSoft: { light: '#e6effc', dark: '#14264c' }, // accent-tinted chip/soft fill
    brand: { light: '#0f172a', dark: '#5b9dff' }, // primary CTA fill (navy light / blue dark)
    success: { light: '#12a150', dark: '#43d17f' }, // semantic — progress / paid / on-plan
    warning: { light: '#d97706', dark: '#fbbf24' },
    danger: { light: '#dc2626', dark: '#fb7185' }, // semantic — overdue / validation
    gold: { light: '#b7791f', dark: '#fbd34d' }, // semantic — achievement / milestone (warm; the beats)
  },

  // ── Surface — the navy hero/beat panel (CONSTANT across themes = the parity + identity move) ──
  surface: {
    heroTop: { light: '#0e2242', dark: '#0e2242' }, // hero gradient top
    heroBottom: { light: '#0a1730', dark: '#0a1730' }, // hero gradient bottom
    heroText: { light: '#f2f7ff', dark: '#f2f7ff' }, // text on the navy panel
    heroSub: { light: '#9fb6d8', dark: '#9fb6d8' }, // secondary text on the navy panel
    goldPill: { light: '#f7cf5f', dark: '#f7cf5f' }, // gold pill / beat accent on navy
    goldPillInk: { light: '#0a1730', dark: '#0a1730' }, // text on the gold pill
  },

  // ── Borders / Separators (navy-tinted on light) ──────────────────────────────
  border: {
    subtle: { light: 'rgba(16,38,84,0.06)', dark: 'rgba(255,255,255,0.08)' },
    default: { light: 'rgba(16,38,84,0.10)', dark: 'rgba(255,255,255,0.12)' },
    strong: { light: 'rgba(16,38,84,0.18)', dark: 'rgba(255,255,255,0.20)' },
  },
} satisfies Record<string, Record<string, ColorPair>>;

export type ColorTokens = typeof colors;

/**
 * Progress ramp — a SINGLE semantic color (`accent.success`) deepening with progress; never a
 * red/yellow/green traffic light. The user is always making progress; 100%+ crosses to gold.
 */
export function progressColor(percent: number, scheme: ColorScheme): string {
  if (percent >= 100) return colors.accent.gold[scheme];
  const base = scheme === 'dark' ? '67,209,127' : '18,161,80'; // success rgb per scheme
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
