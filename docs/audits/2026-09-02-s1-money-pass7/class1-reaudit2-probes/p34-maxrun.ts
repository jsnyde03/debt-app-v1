/** Is MAX_RUN = 8 reachable by a GENUINE wrapped call in the live tree? */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsAndStrings } from '../../../../scripts/lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '../../../..');
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((r) => r.startsWith('apps/rn/') || r.startsWith('packages/') || r.startsWith('scripts/'));

/** Every `ident(` … matching `)` paren group, with the number of physical lines it spans. */
interface Call { file: string; line: number; span: number; head: string }
const calls: Call[] = [];
for (const rel of files) {
  const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
  const code = stripCommentsAndStrings(src);
  const lineOf: number[] = new Array(code.length);
  let ln = 1;
  for (let i = 0; i < code.length; i++) { lineOf[i] = ln; if (code[i] === '\n') ln++; }
  for (let i = 0; i < code.length; i++) {
    if (code[i] !== '(') continue;
    // only a CALL: an identifier immediately before the paren
    const before = code.slice(Math.max(0, i - 40), i);
    const m = /([A-Za-z_$][\w$.?]*)\s*$/.exec(before);
    if (!m) continue;
    let depth = 0; let j = i;
    for (; j < code.length; j++) {
      if (code[j] === '(') depth++;
      else if (code[j] === ')') { depth--; if (depth === 0) break; }
    }
    if (j >= code.length) continue;
    const span = lineOf[j] - lineOf[i] + 1;
    if (span > 1) calls.push({ file: rel, line: lineOf[i], span, head: m[1] });
  }
}
const hist = new Map<number, number>();
for (const c of calls) hist.set(c.span, (hist.get(c.span) ?? 0) + 1);
console.log(`multi-line call expressions: ${calls.length} across ${files.length} files`);
console.log('span → count (physical lines from `ident(` to its matching `)`):');
for (const k of [...hist.keys()].sort((a, b) => a - b)) console.log(`  ${String(k).padStart(4)}: ${hist.get(k)}`);
const over = calls.filter((c) => c.span >= 9);
console.log(`\ncalls spanning >= 9 lines (INVISIBLE past MAX_RUN = 8): ${over.length}`);
for (const c of over.slice(0, 15)) console.log(`  ${c.file}:${c.line}  span=${c.span}  ${c.head}(`);
const moneyish = over.filter((c) => /parse|round|Amount|Money|import/i.test(c.head));
console.log(`\n…of which the head name is money- or import-shaped: ${moneyish.length}`);
for (const c of moneyish.slice(0, 20)) console.log(`  ${c.file}:${c.line}  span=${c.span}  ${c.head}(`);
