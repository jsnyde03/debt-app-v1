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
    // ⛔ The light ramp is validated against `background.tertiary` (#dce4f0), the DARKEST ground the app
    // paints text on — not against the card. Validating on white is what let a token annotated "≥4.5:1"
    // render at 3.64. `npm run lint:contrast` holds every cell to that, and these are what it solved to —
    // with secondary pushed deliberately PAST its floor, because at the bare minimum secondary and
    // tertiary land within 0.02 of each other and the hierarchy the ramp exists for stops existing.
    secondary: { light: '#445163', dark: '#a6b9d4' },
    tertiary: { light: '#5b667a', dark: '#8496b2' },
    inverse: { light: '#ffffff', dark: '#0f172a' },
    onAccent: { light: '#ffffff', dark: '#08111f' }, // text sitting on an accent fill
  },

  // ── Brand / Accent (single blue accent + semantic) ───────────────────────────
  // ⛔ Every light accent below is solved against `background.tertiary` too, for the same reason. The dark
  // values are untouched: dark cleared AA on every cell of the grid before any of this.
  accent: {
    primary: { light: '#2b5dd4', dark: '#5b9dff' }, // blue — the ONE interactive accent
    accentSoft: { light: '#e6effc', dark: '#14264c' }, // accent-tinted chip/soft fill
    brand: { light: '#0f172a', dark: '#5b9dff' }, // primary CTA fill (navy light / blue dark)
    success: { light: '#0d753a', dark: '#43d17f' }, // semantic — progress / paid / on-plan
    warning: { light: '#a44c08', dark: '#fbbf24' }, // semantic — attention (amber, deepened for the ramp)
    danger: { light: '#c52222', dark: '#fb7185' }, // semantic — overdue / validation
    gold: { light: '#b0751e', dark: '#fbd34d' }, // semantic — achievement / milestone (warm; the beats)
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
  //
  // `subtle` / `default` / `strong` are DECORATION — a divider, a card edge, an underline. They are alpha
  // on purpose and they are not held to a contrast floor, because nothing depends on seeing them.
  //
  // ⛔ `control` is not decoration and that is the whole distinction. SC 1.4.11 asks for 3:1 on the visual
  // information needed to IDENTIFY a component, and a text field, a select, a radio, the segmented thumb
  // and the secondary button are identified by their edge and by nothing else — their fill is within 1.21
  // of the ground behind it in both themes. ⚠️ RN strokes a border INSIDE the box, so the rendered pixel is
  // this token composited over the control's own fill; at `default`'s alpha that pixel landed 0.56 L* from
  // the ground in light, which is at or below the just-noticeable difference for a flat patch and far below
  // it for a hairline. The border was not outlining the field, it was shaving a pixel off it.
  border: {
    subtle: { light: 'rgba(16,38,84,0.06)', dark: 'rgba(255,255,255,0.08)' },
    default: { light: 'rgba(16,38,84,0.10)', dark: 'rgba(255,255,255,0.12)' },
    strong: { light: 'rgba(16,38,84,0.18)', dark: 'rgba(255,255,255,0.20)' },
    control: { light: 'rgba(16,38,84,0.58)', dark: 'rgba(255,255,255,0.40)' },
  },
} satisfies Record<string, Record<string, ColorPair>>;

export type ColorTokens = typeof colors;

/**
 * Progress ramp — a SINGLE semantic color (`accent.success`) deepening with progress; never a
 * red/yellow/green traffic light. The user is always making progress; 100%+ crosses to gold.
 */
export function progressColor(percent: number, scheme: ColorScheme): string {
  if (percent >= 100) return colors.accent.gold[scheme];
  // ⚠️ Derived from the token, never typed alongside it. A hand-written rgb triple beside a hex token is a
  // second copy of the same colour that no gate compares, and a contrast fix moves one of them.
  const hex = colors.accent.success[scheme];
  const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
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

/**
 * ⛔ **S1.13.7.9 [pass-6 `C1-18`'s remedy, RE-HOMED] — THE RESERVE SWATCH'S DIMMING, OWNED HERE.**
 *
 * `C1-18` was right that this was declared twice with a comment telling a human to keep the two equal —
 * two producers of one fact, and the comment is the tell rather than the safeguard. ⛔ **Its remedy put
 * the owner in `CushionBarChart`, and that module imports `@shopify/react-native-skia` at module scope.**
 * `PaydayGuardianCard` importing one number from it dragged **CanvasKit into Today's import graph for
 * every render**, which is how a MINOR about a duplicated literal became **51 red e2e specs**: Today threw
 * `Cannot read properties of undefined (reading 'XYWHRect')` and rendered an empty body, so the swipe
 * actions, the tutorial fence and every click target simply were not there.
 *
 * ⚡ **A token belongs with the tokens.** Both the chart that draws the reserve and the card that draws its
 * legend swatch import it from here, so there is still exactly one producer — and neither of them pulls a
 * renderer into the other's graph to get it.
 *
 * ⚠️ **The lesson is not "do not de-duplicate".** It is that **where a shared value LIVES is part of the
 * fix**: hoisting to whichever module happens to use it first exports that module's dependencies along
 * with the value.
 */
export const RESERVE_OPACITY = 0.5;
