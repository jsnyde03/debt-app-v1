/** Re-auditor probe: how far is a reported `path:line` from the physical line of the hit? */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { logicalLines } from '../../../../scripts/lib/logicalLines';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '../../../..');
const RE = /Math\.round\([^;]*?\*\s*100\s*,?\s*\)\s*\/\s*100/g;
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((r) => (r.startsWith('apps/rn/') || r.startsWith('packages/')) && r !== 'packages/core/utils/money.ts');

let drifted = 0, total = 0, worst = { d: 0, s: '' };
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const phys = stripCommentsOnly(src).split('\n');
  // physical lines that contain the head of a match
  for (const ll of logicalLines(src, { blankStrings: true })) {
    for (const m of ll.text.matchAll(RE)) {
      total++;
      const head = m[0].slice(0, 30);
      // find the physical line inside the join that carries the match head
      let actual = -1;
      for (let p = ll.line - 1; p < ll.line - 1 + ll.span && p < phys.length; p++) {
        if (phys[p].includes(head.split('\n')[0].trim().slice(0, 20))) { actual = p + 1; break; }
      }
      if (actual > 0 && actual !== ll.line) {
        drifted++;
        const d = actual - ll.line;
        if (d > worst.d) worst = { d, s: `${rel} reported:${ll.line} actual:${actual}` };
      }
    }
  }
}
console.log(`rounding sites=${total} · reported at the WRONG physical line=${drifted} · worst drift=+${worst.d} (${worst.s})`);
