/** U2 re-audit: which JSX candidates does MAX_JSX_FRAGMENT_LINES reject, and are any of them real copy? */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';
import { lineMap } from '../../../../scripts/lib/logicalLines';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const ROOTS = [join(REPO_ROOT, 'packages', 'core'), join(REPO_ROOT, 'apps', 'rn', 'src')];
const EXEMPT = [join('engine', 'allocatePaycheck.ts'), join('copy', 'vocabulary.ts'), join('src', 'store', 'glossary.test.ts')];
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out); else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}
let total = 0, rejected = 0;
const samples: string[] = [];
const wordy: string[] = [];
for (const root of ROOTS) for (const file of walk(root)) {
  if (EXEMPT.some((e) => file.includes(e))) continue;
  const base = basename(file);
  if (base.endsWith('.test.ts') || /^test[A-Z]/.test(base)) continue;
  const code = stripCommentsOnly(readFileSync(file, 'utf8'));
  const map = lineMap(code);
  for (const m of code.matchAll(/>[^<>{}]{2,}</g)) {
    total++;
    const nl = m[0].match(/\n/g)?.length ?? 0;
    if (nl > 2) {
      rejected++;
      const flat = m[0].replace(/\s+/g, ' ').trim();
      const rel = relative(REPO_ROOT, file);
      if (samples.length < 12) samples.push(`${rel}:${map.lineAt(m.index)} nl=${nl} :: ${flat.slice(0, 140)}`);
      // does it look like real prose? >=4 words of letters, and not obviously code
      const words = flat.replace(/^>|<$/g, '').match(/[A-Za-z']{2,}/g) ?? [];
      if (words.length >= 4 && !/[;={}()]/.test(flat)) wordy.push(`${rel}:${map.lineAt(m.index)} nl=${nl} :: ${flat.slice(0, 160)}`);
    }
  }
}
console.log(`JSX candidates total=${total} rejectedOnSpan=${rejected}`);
console.log('--- first 12 rejected ---');
for (const s of samples) console.log(' ', s);
console.log(`--- prose-shaped rejected (${wordy.length}) ---`);
for (const s of wordy.slice(0, 25)) console.log(' ', s);
