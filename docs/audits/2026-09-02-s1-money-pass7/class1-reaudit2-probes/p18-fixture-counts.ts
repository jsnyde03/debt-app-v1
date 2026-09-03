/** Re-derive `aged` 121→120 and `pinned` 129→127 independently: comments KEPT vs BLANKED. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '../../../..');
const AGING_KEY = /([A-Za-z_]*(?:Date|At|AsOf))\s*(?::|(?<![=!<>])=)\s*$/;
const LITERAL = /'(\d{4})-(\d{2})-(\d{2})'/g;
const CLOCK_PIN = /currentDate\s*:\s*'\d{4}-\d{2}-\d{2}'/;
const isTestShaped = (f: string): boolean =>
  /(^|\/)tests?\//.test(f) || /\.(test|spec|shot)\.tsx?$/.test(f) || /(^|\/)testing\//.test(f) || f.includes('__fixtures__');

const tracked = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8' }).split('\n').map((s) => s.trim()).filter(Boolean);
const testFiles = tracked.filter((f) => isTestShaped(f) && /\.(ts|tsx|mjs|cjs)$/.test(f));
const today = new Date(); today.setHours(0, 0, 0, 0);

function classify(keepComments: boolean, pinOnRaw = true) {
  const aged: string[] = []; const pinnedL: string[] = []; let nonAging = 0; const imminent: string[] = [];
  for (const f of testFiles) {
    let raw: string;
    try { raw = readFileSync(join(REPO_ROOT, f), 'utf8'); } catch { continue; }
    const text = keepComments ? raw : stripCommentsOnly(raw);
    const isPinned = CLOCK_PIN.test(pinOnRaw ? raw : stripCommentsOnly(raw));
    const srcLines = raw.split('\n');
    const starts = [0]; for (let i = 0; i < raw.length; i++) if (raw[i] === '\n') starts.push(i + 1);
    const lineAt = (idx: number) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= idx) lo = m; else hi = m - 1; } return lo + 1; };
    for (const m of text.matchAll(LITERAL)) {
      const i = lineAt(m.index) - 1;
      if (/fixture-date-ok:/.test(srcLines[i] ?? '')) continue;
      const before = text.slice(Math.max(0, m.index - 160), m.index);
      const key = AGING_KEY.exec(before)?.[1] ?? '';
      if (!key) { nonAging += 1; continue; }
      const tag = `${f}:${i + 1} ${key}: ${m[0]}`;
      if (isPinned) { pinnedL.push(tag); continue; }
      const days = Math.round((new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`).getTime() - today.getTime()) / 86400000);
      if (days < 0) aged.push(tag); else if (days <= 21) imminent.push(tag); 
    }
  }
  return { aged, pinnedL, nonAging, imminent };
}
const blanked = classify(false);
const kept = classify(true);
console.log(`files=${testFiles.length}`);
console.log(`comments BLANKED (shipped): aged=${blanked.aged.length} pinned=${blanked.pinnedL.length} nonAging=${blanked.nonAging} imminent=${blanked.imminent.length}`);
console.log(`comments KEPT (v1 fix)    : aged=${kept.aged.length} pinned=${kept.pinnedL.length} nonAging=${kept.nonAging} imminent=${kept.imminent.length}`);
const diff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));
console.log('\naged present only with comments KEPT:'); for (const x of diff(kept.aged, blanked.aged)) console.log('  ' + x);
console.log('pinned present only with comments KEPT:'); for (const x of diff(kept.pinnedL, blanked.pinnedL)) console.log('  ' + x);
console.log('aged present only when BLANKED:'); for (const x of diff(blanked.aged, kept.aged)) console.log('  ' + x);
console.log('pinned present only when BLANKED:'); for (const x of diff(blanked.pinnedL, kept.pinnedL)) console.log('  ' + x);

// live instances of a CLOCK_PIN that exists ONLY inside a comment
console.log('\nfiles whose CLOCK_PIN exists ONLY in a comment:');
let n = 0;
for (const f of testFiles) {
  let raw: string; try { raw = readFileSync(join(REPO_ROOT, f), 'utf8'); } catch { continue; }
  if (CLOCK_PIN.test(raw) && !CLOCK_PIN.test(stripCommentsOnly(raw))) { console.log('  ' + f); n++; }
}
if (!n) console.log('  none');
