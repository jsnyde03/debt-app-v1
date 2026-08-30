/**
 * ⛔ **THE IMPORT NEIGHBOURHOOD OF A CHANGE — because a route built on `changed` is HALF-BLIND to a
 * two-producer disagreement by construction.** [S1.11.6.2 · pass-4 `A-F4` / `D4-7`]
 *
 * ⚡ **The fix touches one producer; the route sees one producer; the disagreement is only visible from
 * the side that moved.** `A-F4` is the proof: `projectDebtPayoff.ts` and `buildPayoffTrajectory.ts`
 * compute one fact, `A1` corrected one of them, and the other **routed to nobody** — it did not change,
 * so nothing put it in front of a reader. The pair is not producer/consumer; they are **siblings through
 * a common consumer** (`payoffSelectors.ts` imports both), which is why one hop is not enough.
 *
 * ⚠️ **Measured at pass 4's own endpoints (`96d1f11…e65f9c7`), not reasoned:**
 *
 * ```
 * changed tracked source files            95
 * + direct CONSUMERS of those            101   -> (tabs)/progress.tsx, (tabs)/index.tsx  ← 3 of C's 4 blockers
 * + their other imports (SIBLINGS)       155   -> buildPayoffTrajectory.ts               ← A-F4's producer
 * ```
 *
 * ⛔ **Both hops are what the exit line requires**, and the cost is stated rather than hidden: the
 * neighbourhood is ~3.7× the changed set. Restricting either hop to files an inventory already owns saves
 * only 351 → 311, so it is not taken — the saving does not pay for a second rule to get wrong.
 *
 * ⚠️ **Resolution is deliberately conservative.** Relative specifiers and this repo's two aliases
 * (`@core/`, `@/`) resolve; a bare package specifier does not, and an unresolvable specifier is simply not
 * an edge. That fails toward a SMALLER neighbourhood, which is the wrong direction for a route — so the
 * route prints the edge count, and `test-import-graph` pins the four resolution shapes. A silent drop to
 * zero edges would otherwise look exactly like "nothing changed nearby".
 */
import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

/** `from` is repo-relative and POSIX-separated, as `git ls-files` emits. */
export function resolveSpecifier(from: string, spec: string, tracked: ReadonlySet<string>): string | null {
	let base: string | null = null;
	if (spec.startsWith('.')) base = posix.normalize(posix.join(posix.dirname(from), spec));
	else if (spec.startsWith('@core/')) base = posix.join('packages/core', spec.slice('@core/'.length));
	else if (spec.startsWith('@/')) base = posix.join('apps/rn/src', spec.slice('@/'.length));
	if (!base) return null;
	for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
		if (tracked.has(cand)) return cand;
	}
	return null;
}

export interface ImportGraph {
	importsOf: Map<string, Set<string>>;
	consumersOf: Map<string, Set<string>>;
	/** Total resolved edges — printed by the route, so a resolver that stops resolving is visible. */
	edges: number;
}

export function buildImportGraph(repoRoot: string, sourceFiles: readonly string[]): ImportGraph {
	const tracked = new Set(sourceFiles);
	const importsOf = new Map<string, Set<string>>();
	const consumersOf = new Map<string, Set<string>>();
	let edges = 0;
	for (const f of sourceFiles) {
		let text = '';
		try {
			text = readFileSync(join(repoRoot, f), 'utf8');
		} catch {
			continue; // a tracked file absent from disk is `missing`'s business, not this one's
		}
		const set = new Set<string>();
		// ⚠️ `from '…'` covers `import … from`, `export … from` and `import type … from`. A dynamic
		// `import('…')` is NOT matched, and that is a known under-count rather than an oversight — see the
		// header on which direction this fails.
		for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
			const r = resolveSpecifier(f, m[1], tracked);
			if (r && r !== f) set.add(r);
		}
		importsOf.set(f, set);
		for (const i of set) {
			if (!consumersOf.has(i)) consumersOf.set(i, new Set());
			consumersOf.get(i)!.add(f);
			edges += 1;
		}
	}
	return { importsOf, consumersOf, edges };
}

/**
 * Every file that did not change but sits in the import neighbourhood of one that did.
 *
 * ⛔ **Two hops, and the second is the one `A-F4` needs.** Hop 1 is the consumers of a changed file — the
 * screens that render what moved. Hop 2 is those consumers' *other* imports — the SIBLING producer that a
 * fix left behind. ⚠️ It stops there: a third hop reaches most of the repo and stops being a
 * neighbourhood.
 */
export function neighbourhood(
	graph: ImportGraph,
	changed: ReadonlySet<string>,
	sourceFiles: readonly string[],
): { consumers: Set<string>; siblings: Set<string> } {
	const consumers = new Set<string>();
	for (const f of sourceFiles) {
		if (!changed.has(f)) continue;
		for (const c of graph.consumersOf.get(f) ?? []) if (!changed.has(c)) consumers.add(c);
	}
	const siblings = new Set<string>();
	for (const c of consumers) {
		for (const i of graph.importsOf.get(c) ?? []) {
			if (!changed.has(i) && !consumers.has(i)) siblings.add(i);
		}
	}
	return { consumers, siblings };
}
