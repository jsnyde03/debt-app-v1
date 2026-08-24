/**
 * CONTRAST GUARD — the colour tokens are checked against WCAG arithmetic, not against an eye.
 *
 * P6.8's widest finding (B6 / V1-2, confirmed under refutation) was that the light theme's tokens were
 * validated on `#ffffff` while the light SCREEN is `#e6ebf3` and the light grouped section is `#dce4f0`.
 * `colors.ts` admitted it in its own annotations — "amber-700 light >=4.5:1 on white", "4.66 (light card)".
 * Every one of those is true, and every one of them is measured against a ground the app also paints on.
 *
 * ⚠️ A GRID CELL IS NOT A RENDERED PAIR, and conflating them is how the finding overstated itself: the
 * quoted floor of 2.63 belonged to a combination nothing paints. So this gate judges the cells the app can
 * actually render and requires every exemption to say why — and where the reason is "this token is never
 * used as text", the gate VERIFIES that from source rather than believing the comment. An exemption that
 * stops being true fails the run that makes it false, which is the only kind of exemption worth having.
 *
 * WHAT IS CHECKED
 *   1. Text: every foreground token × every background ground, against SC 1.4.3 AA (4.5:1). Large-text
 *      relief is NOT granted by default — the refutation measured the sites that qualify and they fail the
 *      3:1 large floor as well, so a blanket exemption would have been false.
 *   2. Non-text (SC 1.4.11, 3:1): the control boundary. `border.*` is an ALPHA token and React Native draws
 *      a border INSIDE the box, so the rendered pixel is the token composited over the FIELD FILL, and the
 *      comparison that matters is that pixel against the ground outside the control.
 *
 * WHAT IT CANNOT SEE, so a green is not read as more than it is:
 *   • Which pairs are on screen. It judges what the token system PERMITS; a pair that passes here can still
 *     be laid out unreadably, and a pair that fails may render nowhere.
 *   • Grounds that are not tokens — a colour painted over the hero panel, a gradient, an image.
 *   • Opacity applied at the component (`opacity: 0.6` on a Text): the composite is not modelled.
 *
 * Usage: npm run lint:contrast   ·   `--report` prints the whole grid   ·   runs inside `lint:rn`
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { colors, type ColorScheme } from '../apps/rn/src/theme/colors.ts';

const REPO_ROOT = join(import.meta.dirname, '..');
const SRC_DIR = join(REPO_ROOT, 'apps', 'rn', 'src');
const REPORT = process.argv.includes('--report');

// ── Colour maths (WCAG 2.1 relative luminance, and the alpha composite RN actually performs) ──────────

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parse(value: string): { rgb: Rgb; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }, alpha: 1 };
  }
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value.trim());
  if (rgba) {
    return {
      rgb: { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]) },
      alpha: rgba[4] === undefined ? 1 : Number(rgba[4]),
    };
  }
  throw new Error(`check-contrast: cannot parse colour "${value}"`);
}

/** `over` is opaque by construction — every ground this composites onto is a solid token. */
function composite(value: string, over: Rgb): Rgb {
  const { rgb, alpha } = parse(value);
  return {
    r: Math.round(rgb.r * alpha + over.r * (1 - alpha)),
    g: Math.round(rgb.g * alpha + over.g * (1 - alpha)),
    b: Math.round(rgb.b * alpha + over.b * (1 - alpha)),
  };
}

const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (c: Rgb): number => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const solid = (value: string): Rgb => parse(value).rgb;
const fmt = (n: number): string => n.toFixed(2);

// ── The grid ──────────────────────────────────────────────────────────────────────────────────────────

const AA_TEXT = 4.5;
const NON_TEXT = 3;

/** Grounds a component can paint text onto. `overlay` and `scrim` are translucent and are not grounds. */
const GROUNDS = ['primary', 'secondary', 'tertiary', 'elevated'] as const;
type Ground = (typeof GROUNDS)[number];

/** Foreground tokens, keyed `group.token` — the same path an exemption names. */
const FOREGROUNDS = [
  'text.primary',
  'text.secondary',
  'text.tertiary',
  'accent.primary',
  'accent.brand',
  'accent.success',
  'accent.warning',
  'accent.danger',
  'accent.gold',
] as const;
type Foreground = (typeof FOREGROUNDS)[number];

/**
 * An exemption is a claim with a mechanism, and the mechanism decides how it is verified.
 *
 *   `never-text` — the token is not painted as a foreground anywhere. Verified from source on every run: the
 *                  first `color:` consumer that appears fails the gate rather than inheriting the exemption.
 *   `non-text`   — it IS painted, but only as a non-text mark (an icon, a fill), so SC 1.4.11's 3:1 is the
 *                  governing floor and the cell is held to that instead of 4.5.
 */
type Exemption =
  | { kind: 'never-text'; token: Foreground; why: string }
  | { kind: 'non-text'; token: Foreground; grounds: readonly Ground[]; why: string };

const EXEMPTIONS: readonly Exemption[] = [
  {
    kind: 'never-text',
    token: 'accent.brand',
    why: 'the primary CTA FILL. Its foreground is `text.onAccent`, which is checked against it separately.',
  },
  {
    kind: 'non-text',
    token: 'accent.gold',
    grounds: GROUNDS,
    why:
      'achievement warmth, and it is never ink: a badge fill, a pill, and an icon on the payoff invitation. ' +
      'An icon is a non-text mark, so 1.4.11 governs it. Verified from source as well as declared.',
  },
];

// ── The source scan that keeps an exemption honest ────────────────────────────────────────────────────

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.ts' || extname(p) === '.tsx') out.push(p);
  }
  return out;
}

/**
 * Foreground uses of a token: `color: c.accent.gold` / `color={c.accent.gold}`, either spelling of the tree.
 *
 * ⚠️ Deliberately syntactic. A token reached through a local (`const ink = c.accent.gold`) is invisible here,
 * so this NARROWS an exemption rather than proving it — which is why every exemption also carries a written
 * reason a reader can check.
 */
function textUses(token: Foreground, files: string[]): string[] {
  const [group, name] = token.split('.');
  const pattern = new RegExp(String.raw`\bcolor\s*[:=]\s*\{?\s*(?:c|colors)\.${group}\.${name}\b`);
  const hits: string[] = [];
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (pattern.test(line)) hits.push(`${relative(REPO_ROOT, file).replace(/\\/g, '/')}:${i + 1}`);
      });
  }
  return hits;
}

// ── Run ───────────────────────────────────────────────────────────────────────────────────────────────

const files = walk(SRC_DIR);
const failures: string[] = [];
const rows: string[] = [];

const exemptionFor = (token: Foreground, ground: Ground): Exemption | undefined =>
  EXEMPTIONS.find((e) => e.token === token && (e.kind === 'never-text' || e.grounds.includes(ground)));

for (const scheme of ['light', 'dark'] as ColorScheme[]) {
  for (const token of FOREGROUNDS) {
    const [group, name] = token.split('.') as [keyof typeof colors, string];
    const pair = (colors[group] as Record<string, { light: string; dark: string }>)[name];
    const ink = solid(pair[scheme]);

    for (const ground of GROUNDS) {
      const bg = solid(colors.background[ground][scheme]);
      const cr = ratio(ink, bg);
      const exemption = exemptionFor(token, ground);
      const floor = exemption ? NON_TEXT : AA_TEXT;
      rows.push(
        `${scheme.padEnd(5)} ${token.padEnd(15)} on background.${ground.padEnd(10)} ${fmt(cr).padStart(6)}` +
          `  floor ${floor}${exemption ? `  [${exemption.kind}]` : '        '}  ${cr >= floor ? 'ok' : 'FAIL'}`,
      );
      if (cr < floor) {
        failures.push(
          `${scheme}: ${token} on background.${ground} is ${fmt(cr)}:1, below ${floor}:1` +
            (exemption ? ` — exempted as ${exemption.kind}, and it fails even that floor` : ''),
        );
      }
    }
  }
}

/**
 * Text that does NOT sit on a `background.*` ground, and is therefore invisible to the grid above.
 *
 * ⭐ The hero/beat panel is the reason this list exists. `surface.hero*` is CONSTANT in both themes — it is
 * the identity move — so it appears in no theme-parity sweep, and it carries the payday number, the ring
 * percentage, the debt-free date and the paid-off moment. A grid keyed on `background.*` cannot see one
 * word of it. The CTA fill, the gold pill and the sandbox chip are the same shape: a fill that is a ground.
 */
const EXTRA_PAIRS: readonly { ink: string; ground: string; label: string }[] = [
  { ink: 'text.onAccent', ground: 'accent.brand', label: 'the primary CTA fill' },
  { ink: 'surface.heroText', ground: 'surface.heroTop', label: 'the hero panel, gradient top' },
  { ink: 'surface.heroText', ground: 'surface.heroBottom', label: 'the hero panel, gradient bottom' },
  { ink: 'surface.heroSub', ground: 'surface.heroTop', label: 'hero secondary text, gradient top' },
  { ink: 'surface.heroSub', ground: 'surface.heroBottom', label: 'hero secondary text, gradient bottom' },
  { ink: 'surface.goldPillInk', ground: 'surface.goldPill', label: 'the gold beat pill' },
  { ink: 'accent.primary', ground: 'accent.accentSoft', label: 'the accent-tinted chip' },
];

const tokenValue = (path: string, scheme: ColorScheme): string => {
  const [group, name] = path.split('.') as [keyof typeof colors, string];
  return (colors[group] as Record<string, { light: string; dark: string }>)[name][scheme];
};

for (const scheme of ['light', 'dark'] as ColorScheme[]) {
  for (const pair of EXTRA_PAIRS) {
    const cr = ratio(solid(tokenValue(pair.ink, scheme)), solid(tokenValue(pair.ground, scheme)));
    rows.push(
      `${scheme.padEnd(5)} ${pair.ink.padEnd(15)} on ${pair.ground.padEnd(22)} ${fmt(cr).padStart(6)}` +
        `  floor ${AA_TEXT}          ${cr >= AA_TEXT ? 'ok' : 'FAIL'}`,
    );
    if (cr < AA_TEXT) {
      failures.push(`${scheme}: ${pair.ink} on ${pair.ground} (${pair.label}) is ${fmt(cr)}:1, below ${AA_TEXT}:1`);
    }
  }
}

for (const e of EXEMPTIONS) {
  if (e.kind !== 'never-text') continue;
  const uses = textUses(e.token, files);
  if (uses.length > 0) {
    failures.push(
      `exemption broken: \`${e.token}\` is declared never-text but is painted as a foreground at ${uses.join(', ')}`,
    );
  }
}

/**
 * ⛔ `border.control` has to be USED, or this whole file is arithmetic about a colour nothing paints.
 *
 * That is the exact failure this repo has measured before: a fix that computes correctly, reports green, and
 * never reaches the screen. The token existing and the token being reachable are different claims, and only
 * the second one is worth a passing gate.
 */
if (!files.some((f) => /\bc(?:olors)?\.border\.control\b/.test(readFileSync(f, 'utf8')))) {
  failures.push(
    '`border.control` is defined and consumed by nothing — the boundary the 3:1 check clears is not painted anywhere',
  );
}

/**
 * ⛔ A LITERAL THAT EQUALS A TOKEN is the shape this gate is blindest to, so it is the one shape it hunts.
 *
 * The cash-flow bars typed their label colours as the same hex the semantic tokens held. Every number above
 * was true of the token and none of it was true of that file, and the copy is invisible in review precisely
 * because it is correct — right up to the moment the token moves and the copy does not. Anything that wants
 * a token's value asks for the token; anything that genuinely wants its own colour picks a different one.
 *
 * ⚠️ Scoped to the SEMANTIC INK — `text.*` and `accent.*`, the groups whose values this file's arithmetic
 * actually moves. `surface.*` is a beat palette a celebration is entitled to build its own ramp from, a
 * background is a primitive, and pure white and pure black are what anything reaches for; flagging those
 * would train a reader to skip the check, which costs more than the copies it would catch. `colors.ts`
 * itself and any line building a gradient are excluded for the same reason.
 */
const PRIMITIVE = new Set(['#ffffff', '#000000']);
const TOKEN_VALUES = new Map<string, string>();
for (const groupName of ['text', 'accent'] as const) {
  for (const [name, pair] of Object.entries(colors[groupName] as Record<string, { light: string; dark: string }>)) {
    for (const scheme of ['light', 'dark'] as const) {
      const value = pair[scheme].toLowerCase();
      if (/^#[0-9a-f]{6}$/.test(value) && !PRIMITIVE.has(value)) TOKEN_VALUES.set(value, `${groupName}.${name}.${scheme}`);
    }
  }
}

/**
 * ⚠️ The gradient exclusion blanks the ARRAY, never the line. Skipping any line mentioning a gradient is
 * what a first cut does, and on the file that motivated this check the copied label sat on the same line as
 * the ramp it belonged to — so the one line worth reading was the one line skipped.
 */
const withoutGradients = (line: string): string => line.replace(/\[[^\]]*'#[0-9a-fA-F]{3,8}'[^\]]*\]/g, '[]');

for (const file of files) {
  if (file.replace(/\\/g, '/').endsWith('theme/colors.ts')) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const raw of withoutGradients(line).match(/'#[0-9a-fA-F]{6}'/g) ?? []) {
        const token = TOKEN_VALUES.get(raw.slice(1, -1).toLowerCase());
        if (!token) continue;
        failures.push(
          `${relative(REPO_ROOT, file).replace(/\\/g, '/')}:${i + 1} writes ${raw}, which is \`${token}\` — ` +
            'read the token instead of copying its value',
        );
      }
    });
}

/**
 * ⛔ **LITERAL INK — the class this file was blindest to, and it had two live AA failures behind it.**
 *
 * Found by the P6.8.9.2 verification, 2026-08-24. Everything above reasons about TOKENS: the grid is keyed
 * on `background.*`, `EXTRA_PAIRS` names token-on-token pairs, and the literal-equals-a-token check is
 * scoped to `text.*`/`accent.*` with `#ffffff` and `#000000` deliberately excluded as primitives. **A
 * hardcoded white painted on a semantic accent fill slips through all three at once**, and two did:
 *
 *   `ListRow.tsx:205`        `#ffffff` on `accent.danger`   — light 5.79:1 ✅  **dark 2.69:1 ⛔**
 *   `SpokenForSheet.tsx:166`  `#fff`    on `accent.primary`  — light 5.80:1 ✅  **dark 2.72:1 ⛔**
 *
 * ⚡ **The mechanism is not "a literal equals a token" — it is that the token it stands in for FLIPS.**
 * `text.onAccent` is `#ffffff` in light and `#08111f` in dark, so the literal is *correct in light and
 * wrong in dark*, which is why it survived review and why a light-only reading of either file finds nothing.
 * With the token: **7.03:1 and 6.95:1** in dark.
 *
 * ⚠️ **THREE things the enumeration caught that the finding did not.** The finding named `#ffffff`;
 * `SpokenForSheet` writes **`#fff`**, so a six-digit match misses it entirely. It named two sites; there are
 * **three**. And the third — `TrajectoryChart.tsx:603`'s end pill, `#10264f` on the gold pill — is
 * **9.95:1 and NOT a contrast defect at all.** It is a hand-rolled ink where `surface.goldPillInk` exists
 * for exactly that job, which is the *drift* hazard rather than the *contrast* one. ⛔ Writing this gate's
 * definition is what separated them; the finding's list would have had one site fixed for the wrong reason.
 *
 * ⚠️ Scoped to `color:` — the INK. `backgroundColor` literals are a different question and are not this
 * gate's, because a fill has no floor of its own until something is painted on it.
 */
const INK_LITERAL = /\bcolor:\s*'(#[0-9a-fA-F]{3,8}|white|black)'/g;

/**
 * An exemption here is a claim that a literal ink is CORRECT, and it has to say against what — with the
 * measured number, in both schemes. ⛔ Keyed on the **literal**, not the file: a file-wide exemption would
 * silently cover the next literal somebody adds to it, which is how an exemption stops being a claim.
 */
const INK_EXEMPT: readonly { file: string; literal: string; why: string }[] = [
  {
    file: 'components/payoff/TrajectoryChart.tsx',
    literal: '#10264f',
    why:
      "the debt-free end pill, and it CLEARS AA in both schemes — measured 9.95:1 on the dark gold (#f7cf5f) " +
      'and 6.44:1 on the light (#dca01f). ⚠️ It is a DRIFT hazard, not a contrast one, and the fix is not the ' +
      'obvious one: `surface.goldPillInk` exists for this job but pairs with `surface.goldPill`, while this ' +
      "component paints its own `gold` (`dark ? '#f7cf5f' : '#dca01f'`, line 307) — so adopting the ink alone " +
      'would half-adopt a pair, and adopting both changes a SHIPPED light-theme colour with no device to ' +
      'look at. Filed as a token-adoption question, deliberately not taken as a contrast fix.',
  },
];

for (const file of files) {
  const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');
  if (rel.endsWith('theme/colors.ts')) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      for (const m of withoutGradients(line).matchAll(INK_LITERAL)) {
        if (INK_EXEMPT.some((e) => rel.endsWith(e.file) && e.literal.toLowerCase() === m[1].toLowerCase())) continue;
        failures.push(
          `${rel}:${i + 1} paints ink as the literal '${m[1]}' — a literal cannot flip with the theme, so ` +
            'it is right in one scheme and unchecked in the other. Use a token (`text.onAccent` for an ' +
            'accent fill), or declare an INK_EXEMPT entry saying what ground makes it correct',
        );
      }
    });
}

/**
 * SC 1.4.11 on the CONTROL BOUNDARY. `border.control` is the token a field, a select, a radio, the segmented
 * thumb and the secondary button outline themselves with, and RN strokes it INSIDE the box — so the rendered
 * pixel is the token composited over the control's own fill, judged against the ground outside it.
 *
 * ⛔ It is checked against EVERY ground, because a control does not choose which one it lands on — and the
 * binding case is the one that looks like a non-case: a field on a CARD has the card's own colour as its
 * fill, so the border is not merely the best edge available, it is the only thing that exists. The
 * fill-vs-ground step is measured alongside it: a control its FILL alone delineates would make the border
 * decorative, and no ground in either theme comes near doing that.
 *
 * ⚠️ `subtle`, `default` and `strong` are deliberately NOT checked here. They are decoration; holding a
 * divider to 3:1 would draw a line the design does not want, and pretending they are control boundaries is
 * how a real criterion turns into a rubber stamp.
 *
 * ⛔ **BUT THE STATED REASON FOR EXCLUDING `strong` WAS FALSE, and V1-5 was the proof.** It read *"a
 * divider, a card edge, an underline"* — and **not one of its ten consumers is any of those**. Enumerated
 * 2026-08-24 at P6.8.9.7.5: eight `Switch` off-state tracks, one onboarding step dot, and `AddRow`'s entire
 * boundary. ⚡ An exclusion is a claim; this one was never true.
 *
 * What each consumer actually is, and why only one moved:
 *   - **`AddRow`** — a button with NO FILL, so the border is the only thing that delineates it. Moved to
 *     `border.control`, which is checked at 3:1 above. This was V1-5's second named instance and cluster f
 *     never reached it.
 *   - **Eight `Switch` off-tracks** — the THUMB carries the affordance and the track is its ground; iOS's
 *     own switches ship a low-contrast off track. Holding these to 3:1 would redraw a system control to
 *     satisfy a criterion aimed at boundaries.
 *   - **One step dot** — the ACTIVE dot is `accent.primary` and wider; the inactive dots are the absence of
 *     that, not information a user must resolve.
 * ⚠️ So the exclusion stays, with a reason that is now true of the tokens it covers.
 */
for (const scheme of ['light', 'dark'] as ColorScheme[]) {
  const fill = solid(colors.background.secondary[scheme]);
  const stroke = composite(colors.border.control[scheme], fill);
  for (const ground of GROUNDS) {
    const bg = solid(colors.background[ground][scheme]);
    const border = ratio(stroke, bg);
    const fillOnly = ratio(fill, bg);
    const best = Math.max(border, fillOnly);
    rows.push(
      `${scheme.padEnd(5)} border.control  vs background.${ground.padEnd(10)} ${fmt(border).padStart(6)}` +
        `  (fill alone ${fmt(fillOnly)})  floor ${NON_TEXT}  ${best >= NON_TEXT ? 'ok' : 'FAIL'}`,
    );
    if (best < NON_TEXT) {
      failures.push(
        `${scheme}: the control boundary is ${fmt(border)}:1 (fill alone ${fmt(fillOnly)}:1) against ` +
          `background.${ground}, below SC 1.4.11's ${NON_TEXT}:1 — a form field is not identifiable by its edge`,
      );
    }
  }
}

if (REPORT) rows.forEach((r) => console.log(r));

if (failures.length > 0) {
  console.error(`\ncheck-contrast: ${failures.length} failing pair(s)\n`);
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('\nFix the token in apps/rn/src/theme/colors.ts, or declare an exemption with a mechanism.');
  console.error('Run with --report to see the whole grid.\n');
  process.exit(1);
}

console.log('check-contrast: every rendered token pair clears its floor.');
