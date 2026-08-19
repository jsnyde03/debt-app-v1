/**
 * [D37] closure gate — every blocker/major finding must trace to a closure or a recorded refutation.
 *
 * ⛔ **Why this is a script and not a memory.** 🎯 2026-08-18: *"an untraceable closure is
 * indistinguishable from an open finding."* Run by hand at the T1–T8 exit it found **6 of 55** untraceable
 * — and every one of them was already BUILT. They had simply lost their id when a decomposed section was
 * collapsed into a summary row. Nothing was wrong with the code; the ledger had stopped being able to
 * prove it.
 *
 * ⚠️ **It expands compressed ranges before searching.** The plan writes `L1-5/6/7/14/19`, so a literal
 * grep for `L1-6` matches nothing — the first hand pass reported ~30 unassigned high+ and the real number
 * was 4. That expansion is the whole reason this is code.
 *
 * Usage: tsx scripts/check-audit-closure.ts
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const FINDINGS = join(REPO_ROOT, 'docs/audits/2026-08-17-v1.7-audit-gate/findings');

/** Where a closure may be recorded: the queue, the detail log, or the refutation record. */
const SOURCES = [
  join(REPO_ROOT, 'docs/DEBT_ELEVATION_PLAN.md'),
  join(REPO_ROOT, 'docs/DEBT_ELEVATION_LOG.md'),
  join(FINDINGS, 'L9-refutations.md'),
];

const highPlus: string[] = [];
for (const file of readdirSync(FINDINGS)) {
  if (!file.endsWith('.md') || file.startsWith('L9')) continue;
  let current: string | null = null;
  for (const line of readFileSync(join(FINDINGS, file), 'utf8').split('\n')) {
    const heading = line.match(/^### (L\d+-\d+)/);
    if (heading) current = heading[1];
    if (current && /^- \*\*Severity:\*\* (blocker|major)/.test(line)) {
      highPlus.push(current);
      current = null;
    }
  }
}

const recorded = new Set<string>();
for (const src of SOURCES) {
  for (const m of readFileSync(src, 'utf8').matchAll(/L(\d+)-(\d+(?:\/\d+)*)/g)) {
    for (const n of m[2].split('/')) recorded.add(`L${m[1]}-${n}`);
  }
}

const missing = highPlus.filter((id) => !recorded.has(id));
if (missing.length > 0) {
  console.error(`\n❌ [D37]: ${missing.length} of ${highPlus.length} high+ findings are not traceable.\n`);
  missing.forEach((id) => console.error(`  ${id}`));
  console.error('\n  Record each against the item that closed it (or a refutation in L9-refutations.md).');
  console.error('  ⚠️ Being FIXED is not enough — [D37] requires the closure be traceable to the id.\n');
  process.exit(1);
}
console.log(`✅ [D37]: all ${highPlus.length} high+ findings trace to a closure or a recorded refutation.`);
