// L1 — registry entries whose proof.unfix[].at is a file in lane L1's manifest.
// Usage: node guards-in-lane.mjs <tree root>
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const j = JSON.parse(readFileSync(join(root, 'scripts/finding-guards.json'), 'utf8'));
const lanes = readFileSync(join(root, 'docs/audits/2026-09-02-s1-money-pass7/CLASS5-REAUDIT-LANES.tsv'), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.split('\t'))
  .filter((c) => c[0] === 'L1')
  .map((c) => c[3]);
const files = new Set(lanes);
// The registry is an OBJECT keyed by id (measured), not an array.
const entries = Array.isArray(j) ? j : Object.entries(j).map(([id, v]) => ({ id, ...v }));
let n = 0;
const out = [];
for (const e of entries) {
  const p = e.proof;
  if (!p || !p.unfix) continue;
  const ats = [].concat(p.unfix).map((u) => u.at);
  const hit = ats.filter((a) => files.has(a));
  if (hit.length === 0) continue;
  n += 1;
  const how = p.run ? `run:${p.run}` : `cmd:${JSON.stringify(p.cmd)}`;
  out.push(`${e.id}\t${how}\t${hit.join(',')}`);
}
console.log(`lane files ${files.size}; entries ${entries.length}; with unfix in lane ${n}`);
console.log(out.join('\n'));
