/** Re-auditor probe: join shapes and line-number drift across the tracked tree. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { logicalLines } from '../../../../scripts/lib/logicalLines';

const ROOT = join(import.meta.dirname, '../../../..');
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);

let widest = { span: 0, file: '', line: 0 };
let atCap = 0;
const hist = new Map<number, number>();
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), 'utf8');
  for (const ll of logicalLines(src, { blankStrings: true })) {
    hist.set(ll.span, (hist.get(ll.span) ?? 0) + 1);
    if (ll.span >= 200) atCap++;
    if (ll.span > widest.span) widest = { span: ll.span, file: rel, line: ll.line };
  }
}
console.log(`files=${files.length}`);
console.log(`widest join: span=${widest.span} at ${widest.file}:${widest.line}`);
console.log(`joins at/over MAX_JOIN(200): ${atCap}`);
const over = [...hist.entries()].filter(([s]) => s > 40).sort((a, b) => b[0] - a[0]);
console.log(`spans > 40: ${over.reduce((a, [, n]) => a + n, 0)} — top: ${over.slice(0, 8).map(([s, n]) => `${s}x${n}`).join(' ')}`);
const over10 = [...hist.entries()].filter(([s]) => s > 10).reduce((a, [, n]) => a + n, 0);
console.log(`spans > 10: ${over10}`);
