import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const tracked = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

/** find `head(` then walk to its MATCHING `)` — a real bracket scan, no character-class bound */
function balancedCalls(code: string, headSource: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  const re = new RegExp(headSource + String.raw`\s*\(`, 'g');
  for (const m of code.matchAll(re)) {
    let i = m.index + m[0].length - 1;
    let d = 0;
    for (; i < code.length; i++) {
      if (code[i] === '(') d++;
      else if (code[i] === ')') {
        d--;
        if (d === 0) break;
      }
    }
    if (d === 0) out.push({ start: m.index, end: i });
  }
  return out;
}

const OWNER = 'packages/core/utils/money.ts';
const roundingFiles = tracked.filter((r) => r.startsWith('apps/rn/') || r.startsWith('packages/'));
let balRound = 0;
const balRoundBraced: string[] = [];
for (const rel of roundingFiles) {
  if (rel === OWNER) continue;
  const code = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  for (const c of balancedCalls(code, String.raw`Math\.round`)) {
    const inner = code.slice(c.start, c.end + 1);
    const after = code.slice(c.end + 1, c.end + 12);
    if (/\*\s*100\s*,?\s*\)$/.test(inner) && /^\s*\/\s*100/.test(after)) {
      balRound++;
      const args = inner.slice(inner.indexOf('('));
      if (/[{}]/.test(args)) balRoundBraced.push(`${rel}: ${inner.replace(/\s+/g, ' ').slice(0, 90)}`);
    }
  }
}
console.log(`rounding, balanced-paren scan: ${balRound}   (gate's [^;{}] count = 94)`);
console.log(`  of which carry a brace inside the args (invisible to [^;{}]): ${balRoundBraced.length}`);
for (const s of balRoundBraced.slice(0, 10)) console.log('   ', s);

const collFiles = tracked.filter(
  (r) =>
    (r.startsWith('apps/rn/') || r.startsWith('packages/core') || r.startsWith('scripts')) &&
    !/utils\/(amountField|testAmountField)\.ts$/.test(r) &&
    r !== 'scripts/check-amount-collapse.ts' &&
    r !== 'scripts/test-wrap-escapes.ts',
);
let balColl = 0;
const balCollSites: string[] = [];
for (const rel of collFiles) {
  const code = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  for (const c of balancedCalls(code, String.raw`\b(?:parseAmountField|parseNonNegativeAmount|parseOptionalAmount)`)) {
    const after = code.slice(c.end + 1, c.end + 20);
    if (/^\s*\?\?\s*0(?![\d.])/.test(after)) {
      balColl++;
      balCollSites.push(`${rel}: ${code.slice(c.start, c.end + 1).replace(/\s+/g, ' ').slice(0, 90)}`);
    }
  }
}
console.log(`\ncollapse, balanced-paren scan: ${balColl}   (gate's [^;{}] count = 0)`);
for (const s of balCollSites.slice(0, 10)) console.log('   ', s);

const LOOSE = /toISOString\(\)\s*\.\s*(?:slice|substring|substr)\s*\(\s*0\s*,\s*10\s*,?\s*\)/g;
const TIGHT = /toISOString\(\)\s*\.\s*(?:slice|substring|substr)\s*\(\s*0\s*,\s*10\s*\)/g;
let l1 = 0;
let l2 = 0;
for (const rel of tracked) {
  if (!/^(packages\/core|apps\/rn\/src|apps\/rn\/tests)/.test(rel)) continue;
  if (rel === 'packages/core/utils/localDate.ts') continue;
  const code = stripCommentsOnly(readFileSync(join(ROOT, rel), 'utf8'));
  l1 += [...code.matchAll(LOOSE)].length;
  l2 += [...code.matchAll(TIGHT)].length;
}
console.log(`\nlocal-dates: with optional trailing comma = ${l1}; the gate's pattern (no ,?) = ${l2}`);
