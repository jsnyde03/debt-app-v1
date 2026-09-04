/**
 * Probe: V7 replaced joinedCode's line-prefix `isCode` predicate with `stripCommentsOnly`.
 * Measure the DIFFERENCE over the real population, both directions.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const NL = String.fromCharCode(10);

// the OLD predicate, verbatim from 9ff5e87c
function isCode(line: string, state: { inBlock: boolean }): boolean {
  const t = line.trim();
  const startsBlock = t.startsWith('/*') && !t.includes('*/');
  const wasInBlock = state.inBlock;
  if (startsBlock) state.inBlock = true;
  else if (wasInBlock && t.includes('*/')) state.inBlock = false;
  return !(wasInBlock || startsBlock || t.startsWith('//') || t.startsWith('*'));
}

function oldText(src: string): string {
  const state = { inBlock: false };
  const parts: string[] = [];
  for (const raw of src.split(NL)) {
    if (!isCode(raw, state)) continue;
    parts.push(raw.trim(), ' ');
  }
  return parts.join('').replace(/[ \t]+/g, ' ');
}
function newText(src: string): string {
  const parts: string[] = [];
  for (const raw of stripCommentsOnly(src).split(NL)) parts.push(raw.trim(), ' ');
  return parts.join('').replace(/[ \t]+/g, ' ');
}

function walk(d: string, out: string[] = []): string[] {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === '.expo' || e === 'dist') continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

const files = [...walk(join(ROOT, 'apps', 'rn', 'src')), ...walk(join(ROOT, 'packages', 'core')), ...walk(join(ROOT, 'scripts'))];

// tokens the two consumers actually look for: any word run. Compare WORD SETS so
// re-ordering / spacing noise does not drown the signal.
const words = (s: string): Set<string> => new Set((s.match(/[A-Za-z][A-Za-z0-9_$]{3,}/g) ?? []));

let nDiff = 0;
const lostRows: string[] = [];
const gainedRows: string[] = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const o = words(oldText(src));
  const n = words(newText(src));
  const lost = [...n].filter((w) => !o.has(w));   // NEW sees it, old did not  -> new exposure (noisy risk)
  const gone = [...o].filter((w) => !n.has(w));   // OLD saw it, new does not  -> NEW BLINDNESS
  if (lost.length === 0 && gone.length === 0) continue;
  nDiff++;
  const rel = relative(ROOT, f);
  if (gone.length) lostRows.push(`${rel}  BLANKED-BY-NEW(${gone.length}): ${gone.slice(0, 8).join(' ')}`);
  if (lost.length) gainedRows.push(`${rel}  EXPOSED-BY-NEW(${lost.length}): ${lost.slice(0, 8).join(' ')}`);
}
console.log(`files scanned: ${files.length}; files whose joined text CHANGED: ${nDiff}`);
console.log(`\n=== NEW BLINDNESS (old saw as code, new blanks) — ${lostRows.length} file(s) ===`);
lostRows.slice(0, 40).forEach((r) => console.log('  ' + r));
console.log(`\n=== NEW EXPOSURE (new sees as code, old dropped) — ${gainedRows.length} file(s) ===`);
gainedRows.slice(0, 40).forEach((r) => console.log('  ' + r));
