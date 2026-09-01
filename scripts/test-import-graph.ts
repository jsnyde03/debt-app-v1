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
import { readFileSync } from 'node:fs';
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

/**
 * ⛔ **C's TWO UNROUTED MONEY SCREENS — the other half of the exit line.** `(tabs)/progress.tsx` and
 * `(tabs)/index.tsx` held **3 of auditor C's 4 blockers** and were in no lane of pass 4: they had not
 * changed, so no bucket could see them. Each is a **hop-1 consumer** of a store selector the fixing
 * touched, which is the edge asserted here — `C4-9`'s own producer for one, the Guardian's for the other.
 */
for (const [screen, producer] of [
  ['apps/rn/src/app/(tabs)/progress.tsx', 'apps/rn/src/store/journeySelectors.ts'],
  ['apps/rn/src/app/(tabs)/index.tsx', 'apps/rn/src/store/guardianSelectors.ts'],
] as const) {
  check(tracked.has(screen) && tracked.has(producer), `C-screens fixture — ${screen} and ${producer} are tracked`);
  check(graph.importsOf.get(screen)?.has(producer) === true, `${screen} really does import ${producer}`);
  const n = neighbourhood(graph, new Set([producer]), sourceFiles);
  check(n.consumers.has(screen), `⛔ C-screens · ${screen} is routed when its producer moves — it was in no lane of pass 4`);
}

// ⭐ THE CONTROL. A neighbourhood that returned every file would satisfy every row above.
const all = new Set([...consumers, ...siblings]);
check(all.size < sourceFiles.length / 2, `the neighbourhood of ONE file is a neighbourhood (${all.size} of ${sourceFiles.length}), not the repo`);
check(!all.has('apps/rn/src/app/onboarding.tsx'), 'an unrelated screen is NOT in the neighbourhood of one engine file');

/**
 * ⛔ **S1.13.7.9 — A MODULE THAT LOADS A RENDERER MAY NOT BE IMPORTED FOR A PLAIN VALUE.**
 *
 * ⚡ **This is the defect that turned a MINOR into 51 red e2e specs.** `C1-18` observed, correctly, that
 * `RESERVE_OPACITY = 0.5` was declared twice with a comment telling a human to keep the two equal — two
 * producers of one fact. Its remedy made `CushionBarChart` the owner and had `PaydayGuardianCard` import
 * the number from it. ⛔ **`CushionBarChart` imports `@shopify/react-native-skia` at MODULE SCOPE**, so
 * that one-number import put **CanvasKit into Today's import graph for every render**. Today threw
 * `Cannot read properties of undefined (reading 'XYWHRect')` and rendered an **empty body** — the swipe
 * actions, the tutorial fence and every click target simply were not there.
 *
 * ⚠️ **The lesson is not "do not de-duplicate", it is that WHERE a shared value lives is part of the fix.**
 * Hoisting to whichever module happens to use it first exports that module's dependencies along with the
 * value. The token now lives in `theme/colors.ts` and both sides import it from there.
 *
 * ⛔ **The population is DERIVED**, not listed: every tracked module whose own source imports a renderer
 * package, and every module that imports one of those. An importer must either load a renderer itself —
 * in which case it already pays that cost — or be named in `RENDERER_CONSUMERS` with a reason.
 */
const RENDERER_PACKAGES = ['@shopify/react-native-skia', 'canvaskit-wasm'];

/**
 * A binding a NON-renderer module may take from a renderer module.
 *
 * ⛔ **The discriminator is PascalCase, and it is the whole rule.** A screen importing `<TrajectoryChart/>`
 * is rendering a chart — it wanted the renderer and pays for it deliberately. A module importing
 * `RESERVE_OPACITY` wanted **a number**, and a number must never cost you CanvasKit. Types are PascalCase
 * too and are erased at build, so they are correctly permitted.
 */
const isComponentBinding = (name: string) => /^[A-Z][a-zA-Z0-9]*$/.test(name) && name !== name.toUpperCase();

/** A non-component binding taken from a renderer module, with the reason it is acceptable. */
const RENDERER_VALUE_IMPORTS: Record<string, string> = {};

{
	const loadsRenderer = new Set<string>();
	for (const f of sourceFiles) {
		if (!/\.(ts|tsx)$/.test(f)) continue;
		const src = readFileSync(resolve(REPO_ROOT, f), 'utf8');
		if (RENDERER_PACKAGES.some((pkg) => src.includes(`from '${pkg}'`) || src.includes(`from "${pkg}"`))) {
			loadsRenderer.add(f);
		}
	}
	// ⚠️ A population floor: if the detector stops finding renderer modules the whole block passes
	// vacuously, which is the shape `assertScanFloor` exists for elsewhere.
	check(loadsRenderer.size >= 5, `the renderer detector sees the charts (${loadsRenderer.size} modules load one)`);

	const offenders: string[] = [];
	for (const target of loadsRenderer) {
		for (const importer of graph.consumersOf.get(target) ?? []) {
			if (loadsRenderer.has(importer)) continue;
			const src = readFileSync(resolve(REPO_ROOT, importer), 'utf8');
			for (const m of src.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
				if (resolveSpecifier(importer, m[2], tracked) !== target) continue;
				for (const raw of m[1].split(',')) {
					const name = raw.split(/\s+as\s+/)[0].replace(/\btype\b/, '').trim();
					if (!name || isComponentBinding(name)) continue;
					const key = `${importer} -> ${target}#${name}`;
					if (key in RENDERER_VALUE_IMPORTS) continue;
					offenders.push(key);
				}
			}
		}
	}
	check(
		offenders.length === 0,
		`⛔ a plain VALUE is imported from a module that loads a renderer — it drags CanvasKit into the ` +
			`importer's graph for every render (${offenders.slice(0, 4).join(' · ')})`,
	);
	for (const named of Object.keys(RENDERER_VALUE_IMPORTS)) {
		check(offenders.length === 0, `RENDERER_VALUE_IMPORTS names ${named} — kept only while it still resolves`);
	}
}

if (failures.length > 0) {
	console.error(`\n❌ import graph: ${failures.length} failure(s).\n`);
	for (const f of failures) console.error(`  • ${f}`);
	console.error(
		'\n  ⛔ The route emits `neighbour` from this graph. A resolver that stops resolving does not red —\n' +
			'  it quietly returns a smaller route, which is this project\'s oldest defect wearing new clothes.\n',
	);
	process.exit(1);
}

/**
 * ⛔ **S1.13.7.2 [pass-6 `D2-5`] — `passed` WAS PRINTED AND NEVER CHECKED, so a load-bearing control row
 * could be deleted and BOTH gates stayed green.**
 *
 * ⚡ Measured by planting: lane D2 removed the *"hop 2 — the producer that did NOT change is routed"*
 * assertion — the one row pinning the `neighbour` origin, the origin that exists because a two-producer
 * disagreement is otherwise half-routed by construction — and this file exited **0** while
 * `lint:finding-guards` also stayed green, because the registry pins the guard's *token*, not its
 * *count*. **Deleting an assertion is invisible to a gate that only counts failures.**
 *
 * ⚠️ Downward-only, and it is `!==` rather than `<` for `D2-7`'s reason: a silently ADDED assertion means
 * the pinned number and the real one have drifted in the direction nobody looks.
 */
const MIN_ASSERTIONS = 23;
if (passed !== MIN_ASSERTIONS) {
	console.error(`\n❌ import graph: ${passed} assertions ran, ${MIN_ASSERTIONS} expected.\n`);
	process.exit(1);
}

console.log(`✅ import graph: ${passed} assertions · ${graph.edges} resolved edges across ${sourceFiles.length} source files.`);
