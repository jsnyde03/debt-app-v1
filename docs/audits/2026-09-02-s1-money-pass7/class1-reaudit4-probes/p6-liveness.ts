import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const isTest = (rel: string) =>
  /\.test\.tsx?$/.test(rel) || /(^|\/)tests?\//.test(rel) || /(^|\/)testing\//.test(rel) ||
  /(^|\/)test[A-Z][A-Za-z0-9]*\.tsx?$/.test(rel);
const TRUST = 'apps/rn/src/store/trustSelectors.ts';
const RE = /\bbalance\s*(?:>=?|<=?|={2,3}|!={1,2})\s*0\b/;
const G = new RegExp(RE.source, 'g');
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((r) => !isTest(r) && r !== TRUST && r.startsWith('apps/rn/src/'));
let wholeTotal = 0, lineTotal = 0;
const diffs: string[] = [];
for (const rel of files) {
  const body = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  const whole = [...body.matchAll(G)];
  const perLine = body.split('\n').reduce((n, l) => n + [...l.matchAll(new RegExp(RE.source, 'g'))].length, 0);
  wholeTotal += whole.length; lineTotal += perLine;
  const crossing = whole.filter((m) => /\n/.test(m[0]));
  if (whole.length !== perLine || crossing.length) diffs.push(`${rel}: whole=${whole.length} perLine=${perLine} crossingMatches=${crossing.length}`);
}
console.log(`files in scope = ${files.length}`);
console.log(`WHOLE-FILE total = ${wholeTotal}`);
console.log(`PER-LINE  total = ${lineTotal}`);
console.log(`ledger cap      = 22`);
for (const d of diffs) console.log('  DIFF ' + d);
