/**
 * S1.10.7.3 — **THE AUDIT ROUTE IS A GENERATED FILE, AND THIS IS THE GENERATOR.**
 *
 * Pass 3 proved the need and pass 3 did it by hand. Its brief says the manifests were *"generated
 * mechanically from `scripts/surface-coverage.s1.json`"* — true, and the recipe lived nowhere. This file
 * is that recipe, committed, so pass 5, S2, S3 and S4 do not re-derive it.
 *
 * ⛔ **WHY A SCRIPT AND NOT A SENTENCE.** S1.10.1's own pre-authored route list named **118 of the 331**
 * files it was routing — it omitted `apps/rn/src/store` (24 files), the entire test tree, and five
 * `packages/core` directories. That was the SIXTH instance of this project's oldest failure: *an
 * enumeration is blind to what the enumeration omits.* A route that is typed can undercount. A route
 * that is a set difference cannot.
 *
 * ⛔ **THE ENUMERATION IS INVERTED.** Nothing here lists the files to audit. It lists the files ALREADY
 * ACCOUNTED FOR — swept and unchanged — and audits the remainder. Lane assignment is likewise total: an
 * ordered predicate list ending in a mandatory catch-all, and the run asserts
 * `union(lanes) === union(buckets)` exactly. A file cannot fall out of a lane spec; it can only land in
 * the wrong one, and that is visible in the manifest.
 *
 * ⛔ **ONE PRODUCER OF THE SURFACE LIST.** The surface and its swept/unswept split come from the
 * inventory markdown that `scripts/surface-coverage.ts` GENERATES. This file parses that output; it does
 * not re-walk the roots and it does not re-implement `UNSWEPT_CLAIMS`. Two agreeing copies of a fact is
 * this repo's most-repeated defect shape — S1.10.6.1's three blockers were all one pair of functions
 * computing the same number differently. The parse is checked against the inventory's own stated totals,
 * so a format drift reds rather than silently routing a short list.
 *
 * ## The three origins, and why the split is the point
 *
 * ⚡ **Report the round split by ORIGIN or a flat total hides both halves moving.** Across the two fixing
 * sessions ELEVEN defects went into the instruments themselves while the app's own defect count fell;
 * one number would have read as progress.
 *
 *   first-look    on the surface, never swept by any pass        → [D69] exempt from the churn count
 *   fix-churn     swept by a prior pass, then CHANGED since it   → the pass read a version that is gone
 *   instrument    on S0's surface and changed since the pin      → the code the fixing itself wrote
 *   off-surface   changed since the pin and on NO inventory      → the hole completeness cannot see
 *
 * ⚠️ **`fix-churn` is the bucket pass 3 had no name for.** A file a pass read and a fix then rewrote is
 * not swept — the sweep describes bytes that no longer exist — but the claims file still says `s1p3`
 * and the coverage gate still counts it as read. Measured 2026-08-28: **48 of the 60** changed S1 files
 * were in exactly that state. `feedback_the_fix_writes_the_next_defect` is the class, and it has been
 * invisible to the instrument that is supposed to see coverage.
 *
 * ⚠️ **`instrument` crosses a surface boundary deliberately.** The eight gates and three test modules
 * written during S1's fixing are on **S0**, which converged, so an S1-only route would hand pass 4 a
 * tree with 2,654 new lines of unaudited checking in it. The LOOP rule — *"every surface audit
 * re-verifies the previous surfaces' guards"* — is what puts them in scope, not an expansion of S1.
 *
 * ⛔ **`off-surface` IS THE ONE THIS FILE WAS NOT BUILT TO FIND, and it found it on the first run.**
 * `lint:surface-complete` proves every tracked source file sits under *a* surface ROOT. It does not — and
 * cannot — prove any surface's INVENTORY contains it, because `excluded` routes files onward to S2, S3 and
 * S4, and **those three surfaces have no claims file at all**. A file routed to S3 is therefore under a
 * root, green on completeness, and on nobody's list.
 *
 * ⚡ Measured 2026-08-28: S1's OWN fixing edited **`apps/rn/src/data/readBackup.ts`**, its test, and
 * **`apps/rn/tests/e2e/data-recovery.spec.ts`** — the `C-7` / `C-7b` restore doors — and all three are
 * routed to S3. Nothing was going to read them. The plan already warned that *"completeness proves every
 * file has a home, not the RIGHT one"*; this is the sharper form: **a home can be a surface that does not
 * yet exist.** `S1.10.6.10` is the standing fix; this bucket is the stop-gap that stops an S1 fix shipping
 * unread in the meantime.
 *
 * ⚠️ **`off-surface` fails toward OVER-inclusion, deliberately.** Its deny-list is documentation and
 * binary assets only. `scripts/` is admitted whole and **without an extension filter** — `SOURCE_EXT` has
 * no `.txt`, which is exactly how `scripts/__fixtures__/crlf-source.ts.txt`, the sole input to the CRLF
 * gate, became invisible while *"a CRLF guard that normalised away the thing under test"* was one of the
 * eleven instrument defects. Repo-root config is admitted for the same reason: `package.json` wires all
 * 38 gates and no surface owns it.
 *
 * Usage:
 *   npx tsx scripts/audit-route.ts --surface=s1 --since=<sha> --out=docs/audits/<dir>
 *   npx tsx scripts/audit-route.ts --surface=s1 --since=<sha> --out=<dir> --check   (assert only)
 *
 * Exits 1 on: an unparseable inventory · a parse that disagrees with the inventory's own totals ·
 * a file in two buckets · a file in two lanes · a routed file missing on disk · a bucket file that
 * reached no lane.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⛔ The inventory path per surface is the ONE thing this file has to know that the generator also
 * knows. It is not a copy of the surface definition — it is where the generator's output lands, and a
 * wrong value here reds immediately on the missing file rather than routing a short list.
 */
const INVENTORY: Record<string, string> = {
  s0: 'docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-SURFACE-INVENTORY.md',
  s1: 'docs/audits/2026-08-26-s1-money/S1-SURFACE-INVENTORY.md',
};

type Origin = 'first-look' | 'fix-churn' | 'instrument' | 'off-surface';

const ORIGINS: readonly Origin[] = ['first-look', 'fix-churn', 'instrument', 'off-surface'];

/**
 * ⛔ **A DENY-LIST, AND THE ONLY ONE IN THIS FILE.** It exists because `off-surface` is defined by
 * subtraction and would otherwise sweep prose and binaries into an auditor's route. It names what is NOT
 * code; anything it fails to name is still ROUTED, so a gap here costs an auditor a wasted read rather
 * than a blind spot. That is the direction every filter in this file leans.
 */
const NOT_CODE = /^(docs|\.github\/ISSUE_TEMPLATE)\/|\.(md|png|jpg|jpeg|gif|svg|webp|mp4|mov|pdf|ttf|otf|woff2?|ico|icns|lock|snap)$|^package-lock\.json$/;

interface Inventory {
  files: string[];
  unswept: Set<string>;
  statedTotal: number;
  statedUnswept: number;
}

function die(msg: string): never {
  console.error(`\n❌ audit-route: ${msg}\n`);
  process.exit(1);
}

/**
 * ⛔ Parses the GENERATED inventory, then checks the parse against the totals the generator printed into
 * the same file. A markdown format change that silently drops rows is the failure mode this guards; the
 * counts are the only thing in the document that can contradict the table.
 */
function readInventory(surface: string): Inventory {
  const rel = INVENTORY[surface];
  if (!rel) die(`unknown surface "${surface}". Known: ${Object.keys(INVENTORY).join(', ')}.`);
  const abs = join(REPO_ROOT, rel);
  if (!existsSync(abs)) die(`${rel} does not exist — run \`npm run lint:${surface}-coverage\` first.`);
  const text = readFileSync(abs, 'utf8');

  const totals = /\*\*(\d+) files on the \S+ surface · (\d+) swept · (\d+) unswept\.\*\*/.exec(text);
  if (!totals) die(`${rel} has no totals line — the generator's format changed and this parse is stale.`);
  const statedTotal = Number(totals[1]);
  const statedUnswept = Number(totals[3]);

  const [tablePart, unsweptPart] = text.split('## ⛔ Unswept');
  if (unsweptPart === undefined) die(`${rel} has no unswept section — the generator's format changed.`);

  const files: string[] = [];
  for (const m of tablePart.matchAll(/^\| `([^`]+)` \|/gm)) files.push(m[1]);

  const unswept = new Set<string>();
  for (const m of unsweptPart.matchAll(/^- `([^`]+)`$/gm)) unswept.add(m[1]);

  if (files.length !== statedTotal) {
    die(`${rel}: parsed ${files.length} table rows but the file states ${statedTotal}. The parse is wrong, not the inventory.`);
  }
  if (unswept.size !== statedUnswept) {
    die(`${rel}: parsed ${unswept.size} unswept rows but the file states ${statedUnswept}.`);
  }
  for (const f of unswept) {
    if (!files.includes(f)) die(`${rel}: "${f}" is listed unswept but is not in the table.`);
  }
  return { files, unswept, statedTotal, statedUnswept };
}

/** Files changed between `since` and HEAD, as tracked paths. Deletions are dropped — a route cannot point at a file that is gone. */
function changedSince(since: string): Set<string> {
  let out: string;
  try {
    out = execFileSync('git', ['diff', '--name-only', '--diff-filter=d', `${since}..HEAD`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    die(`\`git diff ${since}..HEAD\` failed — is "${since}" a commit in this repo?`);
  }
  return new Set(out.split('\n').map((l) => l.trim()).filter(Boolean));
}

/**
 * ⛔ **A TOTAL LANE SPEC.** Ordered, first match wins, and the last entry matches everything. A file
 * cannot be dropped by omitting it from a lane; the worst a bad spec can do is put it in the wrong
 * lane, which a reader of the manifest can see. `assertRouted` proves totality rather than assuming it.
 */
interface Lane {
  id: string;
  what: string;
  match: (f: string, origin: Origin) => boolean;
}

const LANES: Lane[] = [
  {
    id: 'A',
    what: 'The money engine — where a wrong number is computed',
    match: (f, o) => o !== 'instrument' && f.startsWith('packages/core/'),
  },
  {
    id: 'B',
    what: 'Store, storage, formatting — how the number is spelled, dated and remembered',
    match: (f, o) =>
      o !== 'instrument' &&
      (f.startsWith('apps/rn/src/store/') ||
        f.startsWith('apps/rn/src/storage/') ||
        f.startsWith('apps/rn/src/utils/') ||
        f.startsWith('apps/rn/src/data/') ||
        f.startsWith('apps/rn/src/analytics/') ||
        f.startsWith('apps/rn/src/lib/') ||
        f.startsWith('apps/rn/src/config/') ||
        f.startsWith('apps/rn/src/types/')),
  },
  {
    id: 'C',
    what: 'The screens a user reads money off — where a true number becomes a false sentence',
    match: (f, o) => o !== 'instrument' && f.startsWith('apps/rn/src/'),
  },
  {
    id: 'D',
    what: 'The instruments and the edges — the checking code the fixing itself wrote',
    match: () => true,
  },
];

function main(): void {
  const arg = (name: string): string | undefined =>
    process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');

  const surface = (arg('surface') ?? 's1').toLowerCase();
  const since = arg('since');
  const outDir = arg('out');
  const checkOnly = process.argv.includes('--check');

  if (!since) die('--since=<sha> is required — it is the previous pass\'s pin, and "changed since" is what fix-churn means.');
  if (!outDir && !checkOnly) die('--out=<dir> is required unless --check.');

  const inv = readInventory(surface);
  const s0 = surface === 's0' ? inv : readInventory('s0');
  const changed = changedSince(since);

  // ── the four buckets, as set differences ────────────────────────────────────────────────────────
  const s0Files = new Set(s0.files);
  const s1Files = new Set(inv.files);
  const origin = new Map<string, Origin>();

  /**
   * ⛔ **DISJOINTNESS IS ASSERTED, NOT ASSUMED — and the first version of this file assumed it.**
   *
   * That version resolved an overlap by PRECEDENCE (`if (s0Files.has(f) && changed.has(f)) continue`) and
   * then checked for a collision afterwards. The precedence made the collision unreachable, so the
   * `die()` below it was **a check that could not fail** — one commit after the docblock above warned
   * about exactly that class. ⚡ Found by planting an overlapping file: the run went **green** and quietly
   * moved a `packages/core` money file into the instrument lane.
   *
   * The assertion now runs on the inventories themselves, before any bucket exists, so it does not
   * depend on a file having changed. Two surfaces owning one file is a `SURFACES` configuration error,
   * and the routing that results is ambiguous in a way no downstream count can show.
   */
  const overlap = inv.files.filter((f) => s0Files.has(f));
  if (overlap.length) {
    die(
      `${overlap.length} file(s) are on BOTH the ${surface.toUpperCase()} and S0 inventories:\n  ${overlap.join('\n  ')}\n\n` +
        '  ⛔ Two owners is no owner. Fix `excluded` in scripts/surface-coverage.ts — do not let this file\n' +
        '  pick a winner, because whichever it picked would be silent.',
    );
  }

  for (const f of inv.files) {
    if (inv.unswept.has(f)) origin.set(f, 'first-look');
    else if (changed.has(f)) origin.set(f, 'fix-churn');
    // swept and unchanged → accounted for. This is the ONLY exit from the route.
  }
  for (const f of s0.files) {
    if (changed.has(f)) origin.set(f, 'instrument');
  }
  /**
   * ⛔ The remainder, by subtraction. Everything CHANGED that neither inventory contains — S2/S3/S4's
   * files, the fixtures `SOURCE_EXT` cannot see, and the repo-root config no surface owns.
   */
  for (const f of changed) {
    if (origin.has(f) || s1Files.has(f) || s0Files.has(f) || NOT_CODE.test(f)) continue;
    origin.set(f, 'off-surface');
  }

  // ── lanes ───────────────────────────────────────────────────────────────────────────────────────
  const byLane = new Map<string, string[]>(LANES.map((l) => [l.id, []]));
  const laneOf = new Map<string, string>();
  for (const [f, o] of [...origin].sort((a, b) => a[0].localeCompare(b[0]))) {
    const lane = LANES.find((l) => l.match(f, o));
    if (!lane) die(`"${f}" reached no lane — the catch-all is broken.`);
    if (laneOf.has(f)) die(`"${f}" was routed twice.`);
    laneOf.set(f, lane.id);
    byLane.get(lane.id)!.push(f);
  }

  // ── the assertions, every one of them a set identity ────────────────────────────────────────────
  const routedCount = [...byLane.values()].reduce((n, l) => n + l.length, 0);
  const unrouted = [...origin.keys()].filter((f) => !laneOf.has(f));
  const duplicated = routedCount !== new Set(laneOf.keys()).size;
  const missing = [...laneOf.keys()].filter((f) => !existsSync(join(REPO_ROOT, f)));

  if (unrouted.length) die(`${unrouted.length} bucket file(s) reached no lane:\n  ${unrouted.join('\n  ')}`);
  if (duplicated) die('a file was routed into more than one lane.');
  if (missing.length) die(`${missing.length} routed file(s) do not exist on disk:\n  ${missing.join('\n  ')}`);
  if (routedCount !== origin.size) die(`routed ${routedCount} but bucketed ${origin.size} — the lanes are not total.`);

  /**
   * ⛔ **THE ASSERTION THE OTHER FOUR CANNOT MAKE: nothing that MOVED is missing from the route.**
   *
   * The four checks above all reason about files that reached a bucket. None of them can see a file the
   * bucketing never considered, which is the only failure mode that matters — it is the undercount class,
   * and this project has hit it seven times.
   *
   * ⚡ **Added because the naive form of `off-surface` was written first and passed everything.** Filtering
   * that bucket by `SOURCE_EXT` — the obvious, tidy version — silently dropped
   * `scripts/__fixtures__/crlf-source.ts.txt`, the sole input to the CRLF gate, and every check above
   * stayed green because a file that is never bucketed is never routed, never duplicated and never
   * missing. `feedback_plant_the_naive_overfix`: the tidy fix is the one to plant.
   *
   * ⛔ This is a totality proof, not a sample: the route must equal *every changed tracked file that is
   * not documentation or a binary*. `NOT_CODE` is the only permitted subtraction, and it is printed.
   */
  const owed = [...changed].filter((f) => !NOT_CODE.test(f) && !laneOf.has(f)).sort();
  if (owed.length) {
    die(
      `${owed.length} file(s) CHANGED since ${since} and reached no bucket at all:\n  ${owed.join('\n  ')}\n\n` +
        '  ⛔ Every one is code a pass will not read. Widen a bucket — do NOT add it to NOT_CODE unless it\n' +
        '  really is prose or a binary. A route that undercounts is this project\'s oldest defect.',
    );
  }

  const counts = Object.fromEntries(ORIGINS.map((o) => [o, 0])) as Record<Origin, number>;
  for (const o of origin.values()) counts[o] += 1;

  console.log(`\n✅ audit-route ${surface.toUpperCase()} since ${since}`);
  console.log(`   ${routedCount} routed · 0 unrouted · 0 duplicated · 0 missing on disk`);
  console.log(`   by origin: ${ORIGINS.map((o) => `${counts[o]} ${o}`).join(' · ')}`);
  console.log(`   surface: ${inv.statedTotal} files (${inv.statedUnswept} unswept) · S0: ${s0.statedTotal} files`);
  for (const l of LANES) {
    const files = byLane.get(l.id)!;
    const c: Record<string, number> = {};
    for (const f of files) c[origin.get(f)!] = (c[origin.get(f)!] ?? 0) + 1;
    const split = Object.entries(c).map(([k, v]) => `${v} ${k}`).join(' · ') || 'empty';
    console.log(`   ${l.id}: ${String(files.length).padStart(3)} files  (${split})`);
  }
  console.log();

  if (checkOnly) return;

  const abs = join(REPO_ROOT, outDir!);
  mkdirSync(abs, { recursive: true });
  for (const l of LANES) {
    writeFileSync(join(abs, `ROUTING-${l.id}.txt`), `${byLane.get(l.id)!.join('\n')}\n`, 'utf8');
  }
  /**
   * ⛔ The origin of each file travels WITH the route. An auditor who cannot tell first-look from
   * fix-churn cannot report the split, and [D69]'s exemption becomes their judgement instead of a lookup.
   */
  const tsv = ['path\tlane\torigin'];
  for (const [f, lane] of [...laneOf].sort((a, b) => a[0].localeCompare(b[0]))) {
    tsv.push(`${f}\t${lane}\t${origin.get(f)}`);
  }
  writeFileSync(join(abs, 'ROUTING-ORIGINS.tsv'), `${tsv.join('\n')}\n`, 'utf8');
  console.log(`   written: ${outDir}/ROUTING-{${LANES.map((l) => l.id).join(',')}}.txt + ROUTING-ORIGINS.tsv\n`);
}

main();
