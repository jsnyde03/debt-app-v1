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

/**
 * The text of the style object containing line `i` — from its opening `{` back through the balancing `}`.
 *
 * Brace-counted rather than regexed, because a style entry can nest (`shadowOffset: { … }`). If the
 * braces do not resolve inside a small window, returns the line alone: reporting on less is a missed
 * catch, reporting on more is a false alarm on correct code, and of the two only the false alarm gets
 * the whole guard switched off.
 */
function objectAround(src: string, idx: number): string {
  // Backward to the INNERMOST unclosed `{`. Character-wise, not line-wise: a style entry is often
  // written on one line, where the object opens and closes around the match on that same line.
  let depth = 0;
  let start = -1;
  for (let p = idx; p >= 0; p--) {
    const ch = src[p];
    if (ch === '}') depth++;
    else if (ch === '{') {
      if (depth === 0) {
        start = p;
        break;
      }
      depth--;
    }
  }
  if (start < 0) return '';
  // Forward to its match. Innermost matters: climbing to the enclosing `StyleSheet.create({…})` would
  // find some OTHER entry's `overflow` and silently pass every style in the file — a false negative,
  // which is worse than the false positive this replaced, because it looks like success.
  let d = 0;
  for (let p = start; p < src.length; p++) {
    const ch = src[p];
    if (ch === '{') d++;
    else if (ch === '}') {
      d--;
      if (d === 0) return src.slice(start, p + 1);
    }
  }
  return src.slice(start);
}

const hits: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    const src = readFileSync(file, 'utf8');
    // Matches the scan below, side-specific spellings included. Narrowed to the shorthand, this fast path
    // skipped whole FILES whose only huge border was a `borderTopWidth` — the guard could not have found
    // them however good the regex underneath was.
    if (!/border\w*Width/.test(src)) continue;
    const consts = numericConsts(src);
    // Side-specific widths too. `borderTopWidth: BLEED` takes the identical drawing path, and matching
    // only the shorthand left four spellings of the same defect invisible.
    for (const m of src.matchAll(/border(?:Top|Bottom|Left|Right|Start|End)?Width:\s*([A-Za-z_$][\w$]*|-?\d+(?:\.\d+)?)/g)) {
      const raw = m[1];
      const value = /^-?\d/.test(raw) ? Number(raw) : consts.get(raw);
      // An unresolvable identifier is NOT flagged — this check reports what it can prove, and a guard
      // that guesses gets switched off. Stated so a green run is not read as "no huge borders exist".
      if (value === undefined || value < HUGE) continue;
      // Look for the clip across the enclosing STYLE OBJECT, not just this line. Multi-line style entries
      // are this repo's dominant form, so a same-line test failed CORRECT code — the loudest failure mode
      // a lint gate has, and the one that gets it switched off.
      if (!/overflow:\s*['"]hidden['"]/.test(objectAround(src, m.index))) {
        const lineNo = src.slice(0, m.index).split(/\r?\n/).length;
        hits.push(`${rel}:${lineNo}  ${m[0].split(':')[0]}: ${raw} (${value}) with no overflow: 'hidden'`);
      }
    }
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
