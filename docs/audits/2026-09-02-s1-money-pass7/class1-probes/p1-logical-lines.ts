/**
 * Class 1 probe 1 — the premise `logicalLines` rests on, and whether it joins the shape the gate misses.
 * Run: npx tsx docs/audits/2026-09-02-s1-money-pass7/class1-probes/p1-logical-lines.ts
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { logicalLines } from '../../../../scripts/lib/logicalLines';
import { stripCommentsAndStrings, stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '../../../..');

const files = execFileSync('git', ['ls-files', 'apps/rn', 'packages/core', 'scripts'], {
  cwd: ROOT,
  encoding: 'utf8',
})
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => /\.(ts|tsx)$/.test(l));

// --- 1. OFFSET PREMISE: both strip variants preserve line count and every line's length -------
let mismatched = 0;
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const a = stripCommentsAndStrings(src).split('\n');
  const b = stripCommentsOnly(src).split('\n');
  if (a.length !== b.length) {
    mismatched++;
    console.log('  LINE COUNT DIFFERS:', rel);
    continue;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) {
      mismatched++;
      console.log('  LEN DIFFERS:', rel, 'line', i + 1);
      break;
    }
  }
}
console.log(`1. offset premise: ${files.length} files checked, ${mismatched} mismatched`);

// --- 2. does it join the shape the per-line gate misses? --------------------------------------
const WRAPPED = [
  'const a = parseAmountField(',
  '  raw,',
  ') ?? 0;',
  'const b = parseAmountField(raw) ?? 0;',
].join('\n');

const PER_LINE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/;
const WIDE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([\s\S]*?\)\s*\?\?\s*0/;

const perLineHits = WRAPPED.split('\n').filter((l) => PER_LINE.test(l)).length;
const logicalHits = logicalLines(WRAPPED, { blankStrings: true }).filter((ll) => WIDE.test(ll.text));
console.log(`2. two collapses present · per-physical-line finds ${perLineHits} · logicalLines finds ${logicalHits.length}`);
for (const h of logicalHits) console.log(`     line ${h.line} (span ${h.span}): ${h.text.trim()}`);

// --- 3. MAX_JOIN headroom against the real tree ------------------------------------------------
let widest = { rel: '', line: 0, span: 0 };
let capped = 0;
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  for (const ll of logicalLines(src, { blankStrings: true })) {
    if (ll.span > widest.span) widest = { rel, line: ll.line, span: ll.span };
    if (ll.span >= 200) capped++;
  }
}
console.log(`3. widest genuine join: ${widest.rel}:${widest.line} span=${widest.span} · logical lines hitting MAX_JOIN(200): ${capped}`);

// --- 4. the TRUE join distribution, cap effectively removed -----------------------------------
let trueMax = { rel: '', line: 0, span: 0 };
const buckets: Record<string, number> = { '>40': 0, '>100': 0, '>200': 0, '>400': 0 };
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  for (const ll of logicalLines(src, { blankStrings: true, maxJoin: 100000 })) {
    if (ll.span > trueMax.span) trueMax = { rel, line: ll.line, span: ll.span };
    if (ll.span > 40) buckets['>40']++;
    if (ll.span > 100) buckets['>100']++;
    if (ll.span > 200) buckets['>200']++;
    if (ll.span > 400) buckets['>400']++;
  }
}
console.log(`4. uncapped: true widest = ${trueMax.rel}:${trueMax.line} span=${trueMax.span}`);
console.log(`   spans >40: ${buckets['>40']} · >100: ${buckets['>100']} · >200: ${buckets['>200']} · >400: ${buckets['>400']}`);
