
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
import { findCalls, lineMap } from '../../../../scripts/lib/logicalLines';
const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const OWNER = 'packages/core/utils/money.ts';
const ROUND_CALL = /Math\.round\s*\(/g;
const ARG_TAIL = /\*\s*100\s*,?\s*$/;
const AFTER_ROUND = /^\s*\/\s*100\b/;
const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((r) => r.startsWith('apps/rn/') || r.startsWith('packages/'));
let n = 0, wrong = 0;
for (const rel of tracked) {
  if (rel === OWNER) continue;
  const src = readFileSync(join(ROOT, rel), 'utf8');
  const code = stripCommentsOnly(src);
  const lines = lineMap(code);
  const raw = src.split(/\r?\n/);
  for (const call of findCalls(code, ROUND_CALL)) {
    if (!ARG_TAIL.test(call.args)) continue;
    if (!AFTER_ROUND.test(code.slice(call.argsEnd + 1))) continue;
    n++;
    const ln = lines.lineAt(call.index);
    const text = raw[ln - 1] ?? '';
    if (!/Math\s*\.\s*round/.test(text)) { wrong++; console.log(`  WRONG-LINE ${rel}:${ln} -> ${text.trim().slice(0, 90)}`); }
  }
}
console.log(`R3 line attribution: ${n} live rounding sites; ${wrong} report a line that does NOT contain \`Math.round\``);
