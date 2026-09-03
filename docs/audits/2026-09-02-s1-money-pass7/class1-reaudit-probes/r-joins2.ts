import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { logicalLines } from '../../../../scripts/lib/logicalLines';
const ROOT = join(import.meta.dirname, '../../../..');
const pops: Record<string, string[]> = {
  'rounding (apps/rn + packages)': execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter(Boolean)
    .filter((r) => r.startsWith('apps/rn/') || r.startsWith('packages/')),
  'amount-collapse (apps/rn packages/core scripts)': execFileSync('git', ['ls-files', 'apps/rn', 'packages/core', 'scripts'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').map((l) => l.trim()).filter(Boolean).filter((r) => /\.(ts|tsx)$/.test(r)),
};
for (const [name, files] of Object.entries(pops)) {
  let atCap = 0, widest = 0, wfile = '', wline = 0, over40 = 0;
  for (const rel of files) {
    let src: string;
    try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    for (const ll of logicalLines(src, { blankStrings: true })) {
      if (ll.span >= 200) atCap++;
      if (ll.span > 40) over40++;
      if (ll.span > widest) { widest = ll.span; wfile = rel; wline = ll.line; }
    }
  }
  console.log(`${name}: files=${files.length} widest=${widest} @${wfile}:${wline} atCap=${atCap} over40=${over40}`);
}
// show the runaway sites
const files = pops['rounding (apps/rn + packages)'];
for (const rel of files) {
  let src: string; try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  for (const ll of logicalLines(src, { blankStrings: true })) {
    if (ll.span >= 200) console.log(`  RUNAWAY ${rel}:${ll.line} span=${ll.span}`);
  }
}
