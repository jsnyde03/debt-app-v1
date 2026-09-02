import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
const tracked = new Set(execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { encoding: 'utf8', maxBuffer: 32e6 }).split('\n').map(s=>s.trim()).filter(Boolean));
const cands = (b) => [b, `${b}.ts`, `${b}.tsx`, `${b}/index.ts`, `${b}/index.tsx`];
const hit = (b) => cands(b).find((c) => tracked.has(c)) ?? null;
const rows = [];
for (const f of tracked) {
  let t=''; try { t = readFileSync(f,'utf8'); } catch { continue; }
  for (const m of t.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    if (!spec.startsWith('@/') && !spec.startsWith('@core/')) continue;
    const rest = spec.startsWith('@/') ? spec.slice(2) : spec.slice('@core/'.length);
    // what importGraph.ts does
    const asCoded = spec.startsWith('@/') ? posix.join('apps/rn/src', rest) : posix.join('packages/core', rest);
    // what THIS FILE's own tsconfig says the alias means
    let owner, perProject;
    if (f.startsWith('apps/rn/')) { owner='apps/rn'; perProject = spec.startsWith('@/') ? posix.join('apps/rn/src',rest) : posix.join('apps/rn/core',rest); }
    else if (f.startsWith('packages/core/')) { owner='packages/core'; perProject = spec.startsWith('@/') ? rest : posix.join('packages/core',rest); }
    else if (f.startsWith('scripts/')) { owner='scripts'; perProject = spec.startsWith('@/') ? posix.join('apps/rn/src',rest) : posix.join('packages/core',rest); }
    else { owner='root(next)'; perProject = spec.startsWith('@/') ? rest : posix.join('packages/core',rest); }
    const a = hit(asCoded), b = hit(perProject);
    if (a !== b) rows.push({ f, spec, owner, importGraph: a, tsconfig: b });
  }
}
console.log('DISAGREEMENTS between importGraph.resolveSpecifier and the file owner tsconfig:', rows.length);
const byOwner = {}; for (const r of rows) byOwner[r.owner]=(byOwner[r.owner]??0)+1;
console.log('by owning project:', byOwner);
const lostEdges = rows.filter(r => r.importGraph === null && r.tsconfig !== null);
const wrongEdges = rows.filter(r => r.importGraph !== null && r.tsconfig !== null);
const phantom = rows.filter(r => r.importGraph !== null && r.tsconfig === null);
console.log('MISSED edges (graph=null, real target tracked):', lostEdges.length);
console.log('WRONG edges (graph points at a DIFFERENT tracked file):', wrongEdges.length);
console.log('PHANTOM edges (graph resolves, real target not tracked):', phantom.length);
for (const r of [...lostEdges, ...wrongEdges, ...phantom].slice(0, 25)) console.log('   ', r.owner, '|', r.f, '|', r.spec, '| graph=', r.importGraph, '| tsconfig=', r.tsconfig);
