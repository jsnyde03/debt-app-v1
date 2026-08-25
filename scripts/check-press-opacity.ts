/**
 * Press-opacity guard — bans a bare number as a control's pressed/hovered/disabled opacity.
 *
 * ⛔ **This is a gate rather than a list because the list has now been wrong twice, in the same place.**
 * `theme/spacing.ts`'s own docstring said, in the PAST TENSE, that the literals were gone — *"every one an
 * inline literal with no token, so two cards of the same size on the same screen dimmed by visibly
 * different amounts"* — while **seven were still live at five values**, including the two Money cards it
 * names by shape (0.85 and 0.8, same size class, same screen). The fix reached the four `ui/` primitives
 * and stopped, and the file documenting the fix was the last place that would have said so.
 *
 * ⚠️ **Nothing else can see this.** No test in the corpus asserts `opacity`, and `lint:contrast` reads
 * COLOUR pairs — a control that dims to the wrong amount is invisible to every other gate, and the motion
 * README routes press *feel* to the device pass, which is after the freeze. A regression here would ship.
 *
 * ⛔ **Scoped to the STATE ternary, never to `opacity` in general.** A decorative opacity is a design
 * value that belongs at its site — the trajectory legend swatch at 0.55, a dashed floor line at 0.7, a
 * scrim at 0.8, `PaydayGuardianCard`'s `dimmed: 0.4`. Those are not press feedback and must NOT be
 * tokenised; banning them would make this gate wrong, and a gate that is wrong gets switched off.
 * The signal is a literal opacity in the same expression as `pressed` / `hovered` / `disabled`.
 *
 * `theme/spacing.ts` is the owner: `pressedOpacity` · `hoveredOpacity` · `disabledOpacity`.
 *
 * Usage: tsx scripts/check-press-opacity.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [join(REPO_ROOT, 'apps', 'rn', 'src')];

/** The one module allowed to define the values. */
const EXEMPT = [join('apps', 'rn', 'src', 'theme', 'spacing.ts')];

/**
 * `opacity:` … a state word … a decimal literal, in one expression.
 *
 * ⚠️ Matched on the LINE, and the state word may sit either side of the number — `pressed ? 0.7 : 1` and
 * `disabled ? 0.5 : pressed ? pressedOpacity : 1` are both hits, and the second is the half-fixed shape
 * that this guard exists to refuse. A ternary split across lines by the formatter is the known blind spot;
 * `opacity` in a style object is short enough that prettier keeps it on one line at the repo's width.
 */
const STATE = /opacity:[^;\n]*\b(pressed|hovered|disabled)\b[^;\n]*?\b0?\.\d+/;

const EXTS = new Set(['.ts', '.tsx']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.expo') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

/**
 * Comments are blanked, not matched — this guard's own explanation names the banned shape, and a checker
 * that reds on its own documentation gets deleted rather than obeyed. Line numbers are preserved.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1: string) => p1 + ' '.repeat(m.length - p1.length));
}

const hits: string[] = [];
let scanned = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    if (EXEMPT.some((e) => rel === e)) continue;
    scanned++;
    const raw = readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/);
    stripComments(raw)
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (STATE.test(line)) hits.push(`${rel}:${i + 1}: ${lines[i]?.trim() ?? ''}`);
      });
  }
}

if (hits.length > 0) {
  console.error('\n❌ A control state dims by a bare number instead of a token:\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error('\nUse pressedOpacity / hoveredOpacity / disabledOpacity from @/theme/spacing.');
  console.error('Two card-sized targets on one screen dimming by different amounts is what this prevents,');
  console.error('and no test in this repo asserts opacity — nothing else would catch it.\n');
  process.exit(1);
}

console.log(`✅ press opacity: ${scanned} files, every control state on a token.`);
