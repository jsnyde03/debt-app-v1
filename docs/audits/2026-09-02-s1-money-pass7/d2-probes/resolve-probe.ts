import { execFileSync } from 'node:child_process';
import { resolveSpecifier, buildImportGraph } from '../../../../scripts/lib/importGraph';

const files = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { encoding: 'utf8', maxBuffer: 32e6 })
  .split('\n').map((s) => s.trim()).filter(Boolean).sort();
const tracked = new Set(files);

const rows: [string, string, string][] = [
  ['apps/rn/src/app/(tabs)/money.tsx', '@/store/trustSelectors', 'apps/rn/src/store/trustSelectors.ts  (the row the gate pins)'],
  ['app/page.tsx', '@/components/DebtsSection', 'components/DebtsSection.tsx  (root tsconfig: @/* -> ./*)'],
  ['app/page.tsx', '@/lib/storage/backup', 'lib/storage/backup.ts'],
  ['packages/core/history/selectVisibleHistory.ts', '@/lib/subscription/hasFeatureAccess', 'lib/subscription/hasFeatureAccess.ts  (packages/core tsconfig: @/* -> ../../*)'],
  ['packages/core/testing/testSafeStorage.ts', '@/lib/storage/safeStorage', 'lib/storage/safeStorage.ts'],
  ['components/DebtsSection.tsx', '@core/debt/projectDebtPayoff', 'packages/core/debt/projectDebtPayoff.ts  (@core, for contrast)'],
];
for (const [from, spec, expected] of rows) {
  const got = resolveSpecifier(from, spec, tracked);
  console.log(`${got === null ? 'NULL ' : 'EDGE '} ${from}  ${spec}\n        got=${got}\n        real=${expected}\n        target tracked? ${tracked.has(expected.split(' ')[0])}`);
}
const g = buildImportGraph(process.cwd(), files);
console.log('\nresolved edges in the real graph:', g.edges, 'over', files.length, 'source files');
const legacy = files.filter((f) => /^(app|components|lib)\//.test(f));
let legacyEdges = 0;
for (const f of legacy) legacyEdges += (g.importsOf.get(f)?.size ?? 0);
console.log('legacy-root source files:', legacy.length, '· outgoing edges the graph found for them:', legacyEdges);
console.log('consumers recorded for components/DebtsSection.tsx:', [...(g.consumersOf.get('components/DebtsSection.tsx') ?? [])]);
console.log('consumers recorded for lib/subscription/hasFeatureAccess.ts:', [...(g.consumersOf.get('lib/subscription/hasFeatureAccess.ts') ?? [])]);
