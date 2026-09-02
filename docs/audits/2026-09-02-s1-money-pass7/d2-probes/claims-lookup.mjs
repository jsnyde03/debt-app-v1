import { readFileSync } from 'node:fs';
const c1 = JSON.parse(readFileSync('scripts/surface-coverage.s1.json','utf8'));
const files = ['lib/subscription/hasFeatureAccess.ts','lib/subscription/plans.ts','lib/storage/safeStorage.ts','lib/storage/migrateState.ts','lib/subscription/features.ts','components/DebtsSection.tsx','packages/core/history/selectVisibleHistory.ts'];
for (const f of files) console.log(f.padEnd(52), 's1 claims:', c1[f] ? JSON.stringify(c1[f]) : 'NOT ON S1');
for (const s of ['s0','s2','s3','s4']) {
  const j = JSON.parse(readFileSync(`scripts/surface-coverage.${s}.json`,'utf8'));
  const hits = files.filter((f)=>j[f]);
  console.log(s, 'owns:', hits.length ? hits : '(none)');
}
