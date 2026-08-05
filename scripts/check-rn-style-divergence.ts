/**
 * RN↔RNW style-divergence guard: a huge border used as a FILL must also clip.
 *
 * The trick this protects is legitimate and in use: a view inflated far past the screen with a border
 * equal to the inflation gives you a rounded HOLE — the border is the fill, and its inner corner radius
 * is `borderRadius − borderWidth`. `TutorialOverlay`'s scrim hole is built this way, because four square
 * bands cannot produce a rounded cutout without a mask.
 *
 * On the web that is all there is to it. On iOS it matters enormously HOW the border is drawn, and RN
 * only hands a border to Core Animation when one of three things is true (`RCTViewComponentView.mm`,
 * `useCoreAnimationBorderRendering`): the border width is zero, the border colour is fully transparent,
 * or the view CLIPS. A 2000pt opaque border is none of the first two — so without `overflow: 'hidden'`
 * it falls to `RCTGetSolidBorderImage`, which RASTERISES a bitmap the size of the inflated view and
 * redraws it whenever layout changes. At the sizes this trick uses, that is a multi-thousand-point
 * bitmap per animation frame; and if the allocation fails, the layer's contents are nil while the CA
 * path has already zeroed the border — so the fill vanishes entirely.
 *
 * `overflow: 'hidden'` costs nothing here (these views have no children — the border IS the content) and
 * flips `getClipsContentToBounds()`, restoring the vector path.
 *
 * This is the class of defect the web harness is structurally incapable of catching: Playwright renders
 * a CSS border and never reaches RN's iOS drawing code. A static check is the only cheap instrument.
 *
 * Usage: tsx scripts/check-rn-style-divergence.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [join(REPO_ROOT, 'apps', 'rn', 'src')];
const EXTS = new Set(['.ts', '.tsx']);

/**
 * Below this, a border is an ordinary outline — a 2pt ring rasterises a trivial image and nobody cares.
 * The pathology is a border being used as a full-screen fill. No legitimate outline is 100pt wide.
 */
const HUGE = 100;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(p, out);
    } else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

/** `const BLEED = 2000;` → so `borderWidth: BLEED` resolves. Same-file consts only, which is the idiom. */
function numericConsts(src: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of src.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*(?::\s*number\s*)?=\s*(-?\d+(?:\.\d+)?)\s*;/g)) {
    out.set(m[1], Number(m[2]));
  }
  return out;
}

const hits: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    const src = readFileSync(file, 'utf8');
    if (!src.includes('borderWidth')) continue;
    const consts = numericConsts(src);
    src.split('\n').forEach((line, i) => {
      const m = line.match(/borderWidth:\s*([A-Za-z_$][\w$]*|-?\d+(?:\.\d+)?)/);
      if (!m) return;
      const raw = m[1];
      const value = /^-?\d/.test(raw) ? Number(raw) : consts.get(raw);
      // An unresolvable identifier is NOT flagged — this check reports what it can prove, and a guard
      // that guesses gets switched off. Stated so a green run is not read as "no huge borders exist".
      if (value === undefined || value < HUGE) return;
      // Same LINE, because that is how style entries are written here (`hole: { … },` on one line). A
      // multi-line style object with the two properties split across lines is a known blind spot.
      if (!/overflow:\s*['"]hidden['"]/.test(line)) {
        hits.push(`${rel}:${i + 1}  borderWidth: ${raw} (${value}) with no overflow: 'hidden'\n      ${line.trim()}`);
      }
    });
  }
}

if (hits.length > 0) {
  console.error('\n❌ A huge border with no clip — this rasterises on iOS:\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error(
    "\n  Add overflow: 'hidden' to the same style. It flips clipsToBounds, which is one of the three\n" +
      '  conditions RN requires before drawing a border via Core Animation instead of rasterising it.\n' +
      '  Web is unaffected either way, so no Playwright test can catch this.\n',
  );
  process.exit(1);
}
console.log(`✅ RN style divergence: no border ≥ ${HUGE}pt is missing its clip.`);
