import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
const tracked = new Set(execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { encoding: 'utf8', maxBuffer: 32e6 }).split('\n').map(s=>s.trim()).filter(Boolean));
const hit = (b) => [b, `${b}.ts`, `${b}.tsx`, `${b}/index.ts`, `${b}/index.tsx`].find((c) => tracked.has(c)) ?? null;
const missed = [];
for (const f of tracked) {
  let t=''; try { t = readFileSync(f,'utf8'); } catch { continue; }
  for (const m of t.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    if (!spec.startsWith('@/')) continue;
    const rest = spec.slice(2);
    const asCoded = hit(posix.join('apps/rn/src', rest));   // importGraph.ts
    if (asCoded) continue;                                   // graph found an edge; fine
    const atRoot = hit(rest);                                // root/packages-core tsconfig meaning
    if (atRoot) missed.push({ f, spec, target: atRoot });
  }
}
console.log('@/ imports where importGraph resolves NOTHING but the repo-root meaning resolves a TRACKED file:', missed.length);
const byDir = {};
for (const r of missed) { const d = r.f.split('/')[0] === 'packages' ? 'packages/core' : r.f.split('/')[0]; byDir[d]=(byDir[d]??0)+1; }
console.log('by importing tree:', byDir);
const srcs = [...new Set(missed.map(r=>r.f))];
console.log('distinct importing files:', srcs.length);
console.log('packages/core ones:');
for (const r of missed.filter(r=>r.f.startsWith('packages/core/'))) console.log('   ', r.f, '->', r.spec, '=>', r.target);
console.log('distinct MISSED targets:', [...new Set(missed.map(r=>r.target))].length);
