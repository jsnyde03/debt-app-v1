import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly, stripCommentsAndStrings } from '../../../../scripts/lib/stripCode';
import { findCalls, lineMap } from '../../../../scripts/lib/logicalLines';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((r) => r.startsWith('apps/rn/') || r.startsWith('packages/'));

const ROUND_CALL = /Math\.round\s*\(/g;
const ARG_TAIL = /\*\s*100\s*,?\s*$/;
const AFTER_ROUND = /^\s*\/\s*100\b/;

let seen = 0, skippedBlanked = 0, skippedUnbalanced = 0, counted = 0;
const skippedSites: string[] = [];

for (const rel of tracked) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const code = stripCommentsOnly(src);
  const structure = stripCommentsAndStrings(code);
  const lines = lineMap(code);
  for (const m of code.matchAll(ROUND_CALL)) {
    seen++;
    const open = m.index + m[0].length - 1;
    if (structure[open] !== '(') { skippedBlanked++; skippedSites.push(`BLANKED  ${rel}:${lines.lineAt(m.index)}`); continue; }
    let depth = 0, i = open;
    for (; i < structure.length; i++) {
      if (structure[i] === '(') depth++;
      else if (structure[i] === ')') { depth--; if (depth === 0) break; }
    }
    if (depth !== 0) { skippedUnbalanced++; skippedSites.push(`UNBAL    ${rel}:${lines.lineAt(m.index)}`); continue; }
    counted++;
  }
  // What the gate actually reports
  for (const c of findCalls(code, ROUND_CALL)) {
    if (!ARG_TAIL.test(c.args)) continue;
    if (!AFTER_ROUND.test(code.slice(c.argsEnd + 1))) continue;
  }
}
console.log(`Math.round( textual occurrences : ${seen}`);
console.log(`  skipped: '(' blanked by strip : ${skippedBlanked}`);
console.log(`  skipped: unbalanced            : ${skippedUnbalanced}`);
console.log(`  reached depth-scan OK          : ${counted}`);
for (const s of skippedSites) console.log('   ', s);
