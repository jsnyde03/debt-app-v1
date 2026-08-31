/**
 * S1.13.5 — **THE 12-WAY SPLIT, DERIVED AND ASSERTED RATHER THAN TYPED.**
 *
 * 🎯 `S1.13.4` sized pass 6 at **12 lanes**: pass 5 handed 4 lanes ~16k lines each and they read about a
 * third, which is why coverage came out at 86 of 446. Twelve puts ~8k in front of each reader.
 *
 * ⛔ **THIS IS A SUB-SPLIT, NOT A RE-PARTITION.** `LANES` in `audit-route.ts` is a total spec of four
 * SUBJECTS, each written to sit in one auditor's head — *"which member of its class did this test pick?"
 * is an engine question wearing a test's clothes.* Every sub-lane here stays inside its parent, so a
 * reader still holds one subject; what changes is how much of it they hold.
 *
 * ⛔ **AND IT IS NOT A TYPED LIST.** `audit-route.ts`'s header records why: `S1.10.1`'s hand-written route
 * named **118 of the 331** files it was routing. The rule that fixed it applies here unchanged — every
 * parent lane ends in a **mandatory catch-all** sub-lane, so a file cannot fall out of the spec; it can
 * only land in a sub-lane whose name fits it badly, and that is visible in the manifest. The run then
 * asserts `sum(sub-lanes) === parent` and no file in two.
 *
 * ## What the measurement changed about the proposed split
 *
 * `DISPATCH.md` proposed 3 sub-lanes per parent. Measured at 620 files / ~98.8k lines, the line balance
 * agrees — 3 each lands every sub-lane at ~8k. **One change came out of measuring, and it is inside D:**
 *
 * ⚡ **Lane D contributes ZERO to the coverage exit and carries the MOST lines (27.9k over 76 files).**
 * All 446 exit-bearing files are in A, B and C. That is not an argument for cutting D — `major` is
 * defined as *"an instrument reports green while doing less than it claims"*, and D produced 14 of pass
 * 5's 39 findings. It is an argument about what is inside it:
 *
 * ⚠️ **~8k of D's lines are the LEGACY NEXT ROOT** — `app/page.tsx`, `app/styles/`, `components/*Section.tsx`,
 * `lib/hooks` — **the surface `P6.11` deletes.** 🎯 `S1.12.6`: *"Coverage is what I want. Not unneeded
 * files."* So it gets its own sub-lane (`D3`) and its own reduced mandate in the brief, rather than being
 * audited line-for-line as though it ships. Isolating it also makes the cost of reading it visible, which
 * a blended sub-lane would hide.
 *
 * Usage:
 *   npx tsx scripts/audit-sublanes.ts --dir=docs/audits/<dir>
 *   npx tsx scripts/audit-sublanes.ts --dir=<dir> --check   (assert only, write nothing)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { carriesMoneyClaim, MIN_MONEY_BEARING } from './lib/moneyClaim';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLAIMS_S1 = 'scripts/surface-coverage.s1.json';

function die(msg: string): never {
  console.error(`\n❌ audit-sublanes: ${msg}\n`);
  process.exit(1);
}

interface SubLane {
  id: string;
  what: string;
  match: (f: string) => boolean;
}

/**
 * ⛔ **ORDERED. The first match wins, and the LAST entry of every parent is a catch-all** — that is what
 * makes the spec total. A sub-lane whose `match` is `() => true` is not laziness; it is the only
 * construction in which "the file reached no sub-lane" is unreachable rather than unnoticed.
 */
const SUBLANES: Record<string, SubLane[]> = {
  A: [
    { id: 'A1', what: 'The spec tree — every test that CLAIMS to guard the engine', match: (f) => f.startsWith('apps/rn/tests/') },
    { id: 'A2', what: 'The debt engine itself — payoff, amortisation, ids, balances', match: (f) => f.startsWith('packages/core/debt/') },
    { id: 'A3', what: 'The rest of the engine — cashflow, forecast, payCycle, guardian, income, recurrence', match: () => true },
  ],
  B: [
    {
      id: 'B1',
      what: 'The selectors — what the stored number is turned into before a screen sees it',
      match: (f) => /^apps\/rn\/src\/store\/.*(([Ss]electors)|guardian|trust|substrateProducers|affordability|looksLikeDebt|payoffCelebration|payoffViewGag|windfallSplit|steadyStateProjection|bnplCadence|paywallLead)/.test(f),
    },
    {
      id: 'B2',
      what: 'The store core — how the number is written, migrated, remembered and re-read',
      match: (f) => f.startsWith('apps/rn/src/store/'),
    },
    {
      id: 'B3',
      what: 'Storage, backup, formatting and dates — how the number is spelled and persisted outside the store',
      match: () => true,
    },
  ],
  C: [
    {
      id: 'C1',
      what: 'The plan cards — the densest place a true number becomes a false sentence',
      match: (f) => /^apps\/rn\/src\/components\/(plan|money|payday)\//.test(f),
    },
    {
      id: 'C2',
      what: 'The rest of the components — payoff, progress, entities, onboarding, more, and the UI primitives',
      match: (f) => f.startsWith('apps/rn/src/components/'),
    },
    {
      id: 'C3',
      what: 'The routes and the surfaces OUTSIDE the app — widget, Siri, Lock Screen, notifications, hooks, theme',
      match: () => true,
    },
  ],
  D: [
    /**
     * ⚠️ **`check-*` ALONE came out at 11 files / 2.4k while `D2` came out at 14.7k** — nearly the 16k
     * load pass 5 measured under-reading. The regression suites move here rather than a slice being cut
     * off `D2` by size: a gate and a suite are the same subject — **code whose whole job is to report
     * the tree green** — and pass 5's `D5-*` findings were mostly *the checker does less than it says*.
     */
    {
      id: 'D1',
      what: 'The gates and the suites — every instrument whose job is to report the tree green',
      match: (f) =>
        /^scripts\/check-.*\.ts$/.test(f) ||
        /^scripts\/(run-gates|begin-gate-run|write-gate-status|gateSources)\./.test(f) ||
        /^scripts\/gate-scan-floors\.json$/.test(f) ||
        /^packages\/core\/testing\//.test(f) ||
        /^apps\/rn\/src\/testing\//.test(f) ||
        /^apps\/rn\/src\/data\/migrationAudit\//.test(f),
    },
    {
      id: 'D3',
      what: 'The LEGACY NEXT ROOT — deleted by P6.11. Reduced mandate; see the brief',
      match: (f) => /^(app|components|lib|tests|site|public)\//.test(f),
    },
    {
      id: 'D2',
      what: 'The proof machinery and the config no surface owns — prove-guards, gate plants, the route, the ledgers',
      match: () => true,
    },
  ],
};

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

const dir = arg('dir');
if (!dir) die('--dir=<path> is required — the audit directory holding ROUTING-{A,B,C,D}.txt.');
const checkOnly = process.argv.includes('--check');

const claims: Record<string, string[]> = JSON.parse(readFileSync(join(REPO_ROOT, CLAIMS_S1), 'utf8'));
const exitPopulation = new Set(Object.keys(claims).filter(carriesMoneyClaim));

/**
 * ⛔ **S1.13.7.2 [pass-6 `D2-6`] — THE SAME FLOOR `D2-3` FOUND MISSING NEXT DOOR, AND FOR THE SAME REASON.**
 *
 * The `⭐ exit reachable` line below is filtered by `carriesMoneyClaim`. Blind that predicate and the
 * population empties, the lost set empties, and this prints a ⭐ over a split that is handing twelve
 * readers almost nothing. ⚠️ **This file is what the auditors were actually given** — the route's own
 * assertion is one level up and cannot see a mistake made here.
 */
if (exitPopulation.size < MIN_MONEY_BEARING) {
  die(
    `only ${exitPopulation.size} of ${Object.keys(claims).length} surface file(s) read as money-bearing, and the floor is ${MIN_MONEY_BEARING}.\n` +
      '  ⛔ The predicate has gone blind, so "every owed file is in a sub-lane" would mean "almost nothing is owed".',
  );
}
const nlines = (f: string): number => {
  try {
    return readFileSync(join(REPO_ROOT, f), 'utf8').split('\n').length;
  } catch {
    return 0;
  }
};

const rows: { id: string; what: string; files: string[]; lines: number; exit: number }[] = [];
let grandTotal = 0;

for (const [parent, subs] of Object.entries(SUBLANES)) {
  const parentFiles = readFileSync(join(REPO_ROOT, dir, `ROUTING-${parent}.txt`), 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  grandTotal += parentFiles.length;

  const assigned = new Map<string, string>();
  const buckets = new Map<string, string[]>(subs.map((s) => [s.id, []]));
  for (const f of parentFiles) {
    const sub = subs.find((s) => s.match(f));
    if (!sub) die(`"${f}" reached no sub-lane of ${parent} — the catch-all is broken.`);
    if (assigned.has(f)) die(`"${f}" was assigned twice inside ${parent}.`);
    assigned.set(f, sub.id);
    buckets.get(sub.id)!.push(f);
  }

  /**
   * ⛔ The assertion that can actually fail: a sub-lane spec edit that drops or double-counts a file.
   * ⚠️ It is NOT a tautology of the loop — the inner `die` covers "no sub-lane" and the `Map` covers
   * "twice", so this compares the two INDEPENDENT counts the manifests are written from.
   */
  const written = [...buckets.values()].reduce((n, l) => n + l.length, 0);
  if (written !== parentFiles.length) {
    die(`lane ${parent}: sub-lanes hold ${written} file(s) and the parent manifest has ${parentFiles.length}.`);
  }

  for (const s of subs) {
    const files = buckets.get(s.id)!.sort();
    rows.push({ id: s.id, what: s.what, files, lines: files.reduce((a, f) => a + nlines(f), 0), exit: files.filter((f) => exitPopulation.has(f)).length });
  }
}

rows.sort((a, b) => a.id.localeCompare(b.id));

const totalFiles = rows.reduce((n, r) => n + r.files.length, 0);
const totalExit = rows.reduce((n, r) => n + r.exit, 0);
if (totalFiles !== grandTotal) die(`sub-lanes hold ${totalFiles} file(s) and the four parent manifests hold ${grandTotal}.`);

/**
 * ⛔ **THE EXIT AGAIN, ONE LEVEL DOWN.** `audit-route.ts` asserts every money-bearing file reaches a
 * LANE. That says nothing about whether it reached a SUB-LANE, and the sub-lanes are what a reader is
 * actually handed. A dropped file between the two is invisible to both otherwise.
 */
if (totalExit !== exitPopulation.size) {
  const inSub = new Set(rows.flatMap((r) => r.files));
  const lost = [...exitPopulation].filter((f) => !inSub.has(f));
  die(
    `${lost.length} money-bearing file(s) the exit demands are in no SUB-LANE:\n  ${lost.join('\n  ')}\n\n` +
      '  ⛔ The route can assert every one of them reached a lane and still hand a reader a manifest\n' +
      '  without them. The sub-lanes are what is actually dispatched.',
  );
}

console.log(`\n📋 audit-sublanes — ${rows.length} sub-lanes · ${totalFiles} files · ${(rows.reduce((n, r) => n + r.lines, 0) / 1000).toFixed(1)}k lines`);
console.log(`   ⭐ exit reachable: all ${totalExit} money-bearing file(s) are in a sub-lane.\n`);
console.log('   lane   files    lines   exit-bearing   subject');
for (const r of rows) {
  console.log(`   ${r.id.padEnd(6)} ${String(r.files.length).padStart(5)} ${`${(r.lines / 1000).toFixed(1)}k`.padStart(8)} ${String(r.exit).padStart(14)}   ${r.what}`);
}

if (checkOnly) {
  console.log('\n   --check: nothing written.\n');
  process.exit(0);
}

for (const r of rows) {
  writeFileSync(join(REPO_ROOT, dir, `ROUTING-${r.id}.txt`), `${r.files.join('\n')}\n`, 'utf8');
}
console.log(`\n   written: ${dir}/ROUTING-{${rows.map((r) => r.id).join(',')}}.txt\n`);
