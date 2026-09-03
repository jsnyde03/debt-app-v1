/** R3: does every reported path:line actually carry the match's first character? */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';
const REPO_ROOT = join(import.meta.dirname, '../../../..');
const ROUNDING = /Math\.round\([^;]*?\*\s*100\s*,?\s*\)\s*\/\s*100/g;
const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/g;
const IMPORT = /^\s*import\s*(?:\{[^}]*\bappStore\b[^}]*\}|\*\s*as\s+\w+)\s*from\s*['"][^'"]*appStore['"]/gm;
const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n').map((s) => s.trim()).filter(Boolean);
for (const [name, re, head] of [['rounding', ROUNDING, 'Math.round'], ['collapse', COLLAPSE, 'parse'], ['sandbox-import', IMPORT, 'import']] as const) {
  let n = 0, wrong = 0; const bad: string[] = [];
  for (const rel of files) {
    if (!rel.startsWith('apps/') && !rel.startsWith('packages/') && !rel.startsWith('scripts/')) continue;
    const src = readFileSync(join(REPO_ROOT, rel), 'utf8');
    const f = flattenContinuations(src);
    for (const m of f.text.matchAll(new RegExp(re.source, re.flags))) {
      n++;
      const line = f.lineAt(m.index);
      const physical = src.split('\n')[line - 1] ?? '';
      if (!physical.includes(head)) { wrong++; if (bad.length < 6) bad.push(`${rel}:${line}  «${physical.trim().slice(0, 70)}»`); }
    }
  }
  console.log(`${name}: matches=${n} reported at a line NOT containing "${head}" = ${wrong}`);
  for (const b of bad) console.log('   ' + b);
}
