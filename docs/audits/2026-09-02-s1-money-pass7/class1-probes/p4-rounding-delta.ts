/**
 * Class 1 probe 4 — WHY did `lint:rounding`'s count move when the matcher changed?
 *
 * ⛔ A downward-only cap may not be raised to make a run pass. Before re-baselining it, this names every
 * site the old per-physical-line matcher saw and the new logical-line matcher does not, and vice versa.
 *
 * Run: npx tsx docs/audits/2026-09-02-s1-money-pass7/class1-probes/p4-rounding-delta.ts
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '../../../..');
const OWNER = 'packages/core/utils/money.ts';
const ROUNDING = /Math\.round\([^;]*?\*\s*100\s*\)\s*\/\s*100/g;

const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .filter((rel) => rel.startsWith('apps/rn/') || rel.startsWith('packages/'))
  .filter((rel) => rel !== OWNER);

/** OLD: one site per matching PHYSICAL line. */
const oldSites: string[] = [];
/** NEW: one site per MATCH, over FLATTENED text. */
const newSites: string[] = [];

for (const rel of tracked) {
  const source = readFileSync(join(ROOT, rel), 'utf8');
  for (const line of stripCommentsOnly(source).split('\n')) {
    ROUNDING.lastIndex = 0;
    if (ROUNDING.test(line)) oldSites.push(`${rel}| ${line.trim()}`);
  }
  const flat = flattenContinuations(source);
  for (const m of flat.text.matchAll(ROUNDING)) newSites.push(`${rel}| ${m[0].trim()}`);
}

console.log(`OLD (per physical line, one per line): ${oldSites.length}`);
console.log(`NEW (per match, over flattened text) : ${newSites.length}`);

const count = (xs: string[]) => {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
};
const o = count(oldSites.map((s) => s.split('|')[0]));
const n = count(newSites.map((s) => s.split('|')[0]));

console.log('\nper-file differences:');
let moved = 0;
for (const f of new Set([...o.keys(), ...n.keys()])) {
  const a = o.get(f) ?? 0;
  const b = n.get(f) ?? 0;
  if (a !== b) {
    moved++;
    console.log(`  ${f}: old=${a} new=${b}  (${b > a ? '+' : ''}${b - a})`);
  }
}
if (!moved) console.log('  (none — the totals differ only in aggregate, which would be a bug in this probe)');
