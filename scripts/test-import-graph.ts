/**
 * ⛔ **THE ROUTE'S FIFTH ORIGIN, PINNED — INCLUDING `A-F4`'s REAL PAIR.** [S1.11.6.2]
 *
 * ⚡ `audit-route.ts` built its four buckets out of predicates on *changed*, so a file that did not move
 * could not reach any of them. A two-producer disagreement is therefore **half-routed by construction**:
 * the fix touches one producer, the route emits one producer, and the disagreement is invisible from the
 * other side. `A-F4` is that, measured — `buildPayoffTrajectory.ts` routed to nobody.
 *
 * ⛔ **The last assertion here is the finding itself, against the REAL graph**, not a fixture: the two
 * producers and their common consumer are named, and the neighbourhood is required to reach the one that
 * did not change. A synthetic fixture would prove the algorithm and say nothing about whether this repo's
 * specifiers resolve — which is the half that actually fails.
 *
 * Usage: npm run lint:import-graph
 */
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildImportGraph, neighbourhood, resolveSpecifier } from './lib/importGraph';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
const failures: string[] = [];
function check(cond: boolean, label: string) {
	if (cond) passed += 1;
	else failures.push(label);
}

const sourceFiles = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], {
	cwd: REPO_ROOT,
	encoding: 'utf8',
	maxBuffer: 32 * 1024 * 1024,
})
	.split('\n')
	.map((l) => l.trim())
	.filter(Boolean)
	.sort();
const tracked = new Set(sourceFiles);

// ── the four resolution shapes, on real tracked paths ────────────────────────────────────────────
check(
	resolveSpecifier('apps/rn/src/store/guardianSelectors.ts', './trustSelectors', tracked) ===
		'apps/rn/src/store/trustSelectors.ts',
	'a RELATIVE specifier resolves',
);
check(
	resolveSpecifier('apps/rn/src/store/payoffSelectors.ts', '@core/debt/projectDebtPayoff', tracked) ===
		'packages/core/debt/projectDebtPayoff.ts',
	'a @core specifier resolves',
);
check(
	resolveSpecifier('apps/rn/src/app/(tabs)/money.tsx', '@/store/trustSelectors', tracked) ===
		'apps/rn/src/store/trustSelectors.ts',
	'a @/ specifier resolves',
);
// ⚠️ Fails toward a SMALLER neighbourhood, which is the wrong direction for a route — so it is asserted
// rather than assumed, and the route prints its edge count so a collapse is visible.
check(resolveSpecifier('apps/rn/src/store/store.ts', 'zustand', tracked) === null, 'a bare package specifier is NOT an edge');

// ── the graph is not empty, which is the failure a silent resolver change would produce ──────────
const graph = buildImportGraph(REPO_ROOT, sourceFiles);
check(graph.edges > 1000, `the graph carries real edges (${graph.edges}) — a resolver that stopped resolving reads as "nothing nearby"`);

/**
 * ⛔ **`A-F4`, REPRODUCED AGAINST THE REAL GRAPH.** `payoffSelectors.ts` imports BOTH producers of the
 * debt-free fact. Change only one — which is what `A1` did — and the other is reached at the second hop
 * and only at the second hop. ⚠️ Both halves are asserted: that it IS reached, and that one hop does not
 * reach it, because a neighbourhood that returned everything would satisfy the first on its own.
 */
// ⚠️ `analysisSelectors.ts`, not `payoffSelectors.ts` — measured. `payoffSelectors` imports only the
// trajectory half, so it is a consumer of one producer and cannot reach the other; the common consumer is
// where the pair actually meets. A fixture named from memory would have asserted the wrong edge.
const CONSUMER = 'apps/rn/src/store/analysisSelectors.ts';
const MOVED = 'packages/core/debt/projectDebtPayoff.ts';
const SIBLING = 'packages/core/debt/buildPayoffTrajectory.ts';
for (const f of [CONSUMER, MOVED, SIBLING]) {
	check(tracked.has(f), `A-F4 fixture — ${f} is a tracked file (a stale path proves nothing)`);
}
check(graph.importsOf.get(CONSUMER)?.has(MOVED) === true, 'A-F4 — the consumer really does import the producer that moved');
check(graph.importsOf.get(CONSUMER)?.has(SIBLING) === true, 'A-F4 — …and the one that did not');

const { consumers, siblings } = neighbourhood(graph, new Set([MOVED]), sourceFiles);
check(consumers.has(CONSUMER), '⛔ A-F4 · hop 1 — the consumer of the changed producer is routed');
check(!consumers.has(SIBLING), '⛔ A-F4 · hop 1 does NOT reach the sibling — which is why one hop was not enough');
check(siblings.has(SIBLING), '⛔ A-F4 · hop 2 — the producer that did NOT change is routed');

// ⭐ THE CONTROL. A neighbourhood that returned every file would satisfy every row above.
const all = new Set([...consumers, ...siblings]);
check(all.size < sourceFiles.length / 2, `the neighbourhood of ONE file is a neighbourhood (${all.size} of ${sourceFiles.length}), not the repo`);
check(!all.has('apps/rn/src/app/onboarding.tsx'), 'an unrelated screen is NOT in the neighbourhood of one engine file');

if (failures.length > 0) {
	console.error(`\n❌ import graph: ${failures.length} failure(s).\n`);
	for (const f of failures) console.error(`  • ${f}`);
	console.error(
		'\n  ⛔ The route emits `neighbour` from this graph. A resolver that stops resolving does not red —\n' +
			'  it quietly returns a smaller route, which is this project\'s oldest defect wearing new clothes.\n',
	);
	process.exit(1);
}

console.log(`✅ import graph: ${passed} assertions · ${graph.edges} resolved edges across ${sourceFiles.length} source files.`);
