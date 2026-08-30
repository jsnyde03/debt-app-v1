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
 * ## The six origins, and why the split is the point
 *
 * ⚡ **Report the round split by ORIGIN or a flat total hides both halves moving.** Across the two fixing
 * sessions ELEVEN defects went into the instruments themselves while the app's own defect count fell;
 * one number would have read as progress.
 *
 *   first-look    on the surface, never swept by any pass        → [D69] exempt from the churn count
 *   fix-churn     swept by a prior pass, then CHANGED since it   → the pass read a version that is gone
 *   instrument    on S0's surface and changed since the pin      → the code the fixing itself wrote
 *   off-surface   changed since the pin and on NO inventory      → the hole completeness cannot see
 *   neighbour     did NOT change, but sits in the import neighbourhood → the two-producer blind spot
 *   s0-first-look on S0's surface and never swept by any pass       → routed by nobody until S1.11.6.3
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
 * a file in two buckets · a routed file missing on disk · a bucket file that reached no lane · a CHANGED
 * tracked non-prose file that reached no bucket at all.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// ⛔ S1.11.6.2 — the import neighbourhood, in a module with no side effects so `test-import-graph` can
// assert the resolver directly. See its header for why a route built on `changed` alone is half-blind.
import { lf } from './lib/anchor';
import { buildImportGraph, neighbourhood } from './lib/importGraph';
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

/**
 * The DATA behind each inventory. ⛔ S1.12.5.2 [D5-10] — `readInventory` hashes this and requires the
 * document's stamp to match, so an inventory that has gone stale under its own claims file is refused
 * rather than routed from. Kept beside `INVENTORY` because the two are one fact in two halves.
 */
const CLAIMS: Record<string, string> = {
  s0: 'scripts/surface-coverage.s0.json',
  s1: 'scripts/surface-coverage.s1.json',
};

/**
 * ⛔ **S1.11.6.2 [pass-4 `A-F4`] — `neighbour` IS THE FIFTH ORIGIN, AND IT EXISTS BECAUSE THE OTHER FOUR
 * ARE ALL PREDICATES ON *CHANGED*.**
 *
 * ⚡ A two-producer disagreement is **half-routed by construction**: the fix touches one producer, the
 * route sees one producer, and the disagreement is only visible from the side that moved.
 * `projectDebtPayoff.ts` and `buildPayoffTrajectory.ts` compute one fact; `A1` corrected one of them and
 * the other **routed to nobody** — it had not changed. ⚠️ They are not producer/consumer: they are
 * **siblings through a common consumer**, which is why one hop does not reach it.
 *
 * ⚠️ **The cost is stated.** Measured at pass 4's own endpoints, the neighbourhood is ~3.7× the changed
 * set — 95 changed, 101 consumers, 155 siblings. That is the price of the exit line, and it buys the two
 * money screens where **3 of C's 4 blockers lived** plus `A-F4`'s producer.
 */
type Origin = 'first-look' | 'fix-churn' | 'instrument' | 'off-surface' | 'neighbour' | 's0-first-look';

const ORIGINS: readonly Origin[] = ['first-look', 'fix-churn', 'instrument', 'off-surface', 'neighbour', 's0-first-look'];

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

  /**
   * ⛔ **S1.12.5.2 [pass-5 D5-10] — THE STAMP IS CHECKED BEFORE ANYTHING ELSE IS PARSED.**
   *
   * ⚡ Every check below this point is INTERNAL: parsed rows against the totals line the same generator
   * wrote. A wrong inventory is perfectly self-consistent, so all of them pass. Lane D measured the
   * consequence: delete one entry from the claims file and `lint:s1-coverage` exits 1 — while having
   * already written a document that lists the file as unswept — and then this function read it at
   * **exit 0** and routed a swept file as `first-look`, **which [D69] exempts from the convergence
   * count.** ⛔ The corruption moved in the direction that makes convergence EASIER to declare, with
   * every number on the route's success line still green.
   *
   * The generator now writes below its own refusal, so a rejected run publishes nothing. That leaves
   * **stale** — and this is what tells stale from current: the stamp is a hash of the CLAIMS FILE, so
   * it stops matching the moment the data moves under the document.
   */
  const stamp = /<!-- claims-sha256: ([0-9a-f]{16}) -->/.exec(text);
  if (!stamp) {
    die(
      `${rel} carries no claims stamp. Regenerate it with \`npm run lint:${surface}-coverage\`.\n` +
        '   ⛔ An unstamped inventory predates D5-10 and cannot be told apart from one a REJECTED gate run left behind.',
    );
  }
  const claimsRel = CLAIMS[surface];
  const actual = createHash('sha256').update(lf(readFileSync(join(REPO_ROOT, claimsRel), 'utf8'))).digest('hex').slice(0, 16);
  if (stamp[1] !== actual) {
    die(
      `${rel} is STALE: its stamp says the claims were ${stamp[1]}, and ${claimsRel} is now ${actual}.\n` +
        `   ⛔ Routing from it would describe coverage that no longer exists — and a file wrongly read as\n` +
        `   unswept becomes \`first-look\`, which [D69] exempts from the convergence count.\n` +
        `   Run \`npm run lint:${surface}-coverage\` and re-run this.`,
    );
  }

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
  /**
   * ⛔ **A HOLDS THE ENGINE AND THE SPECS THAT GUARD IT, IN ONE HEAD — deliberately, and it is also what
   * balances the load.** Pass 3 put the e2e tree in the instrument lane, where its auditor had the gates
   * in front of them and not the arithmetic. But pass 2's `A1` — *every test written for `AS-3` used
   * `topUp 200` against `shortfall 400`, the single input shape where blanket-zero and netting agree
   * exactly* — is only visible to a reader who knows what the engine does with the other shapes.
   * ⚡ *"Which member of its class did this test pick?"* is an engine question wearing a test's clothes.
   */
  {
    id: 'A',
    what: 'The money engine, and the specs that claim to guard it',
    match: (f, o) => o !== 'instrument' && (f.startsWith('packages/core/') || f.startsWith('apps/rn/tests/')),
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
    what: 'The instruments — the checking code the fixing itself wrote, plus the config no surface owns',
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
  /**
   * ⛔ **S1.11.6.3 [pass-4 `D4-7`] — THIS EMITTED `first-look` FOR S1 AND NEVER FOR S0.** The S1 loop
   * above routes a surface file that no pass has ever swept; the S0 loop asked only whether it CHANGED.
   * So S0's never-swept files were in **no lane of any round** — 57 of them at this pin, against a surface
   * declared CONVERGED.
   *
   * ⚠️ **[D76] settled that S0's convergence STANDS**, and that the coverage gate printing those files on
   * its green path is deliberate. *"What is real is that `audit-route.ts` can never route them"* — which
   * is this, and only this.
   *
   * ⚠️ **Its own origin rather than `first-look`.** Conflating them would put two surfaces' never-swept
   * sets behind one number, and *"report the round split by ORIGIN or a flat total hides both halves
   * moving"* is this file's own rule. ⛔ `changed` still wins: a file that is both never-swept and changed
   * is `instrument`, because what the fixing just wrote is the sharper claim about it.
   */
  for (const f of s0.files) {
    if (changed.has(f)) origin.set(f, 'instrument');
    else if (s0.unswept.has(f)) origin.set(f, 's0-first-look');
  }
  /**
   * ⛔ The remainder, by subtraction. Everything CHANGED that neither inventory contains — S2/S3/S4's
   * files, the fixtures `SOURCE_EXT` cannot see, and the repo-root config no surface owns.
   */
  for (const f of changed) {
    if (origin.has(f) || s1Files.has(f) || s0Files.has(f) || NOT_CODE.test(f)) continue;
    origin.set(f, 'off-surface');
  }

  /**
   * ⛔ **S1.11.6.2 [pass-4 `A-F4`] — THE FOUR BUCKETS ABOVE ARE ALL PREDICATES ON *CHANGED*, SO A FILE
   * THAT DID NOT MOVE CANNOT REACH THEM.** That is the half-blindness: a fix corrects one of two
   * producers, the route emits the one that moved, and the disagreement is invisible from the other side.
   *
   * ⚠️ **LAST, and only for files nothing else claimed** — a neighbour that is also `first-look` or
   * `fix-churn` keeps the stronger origin, because those say something about the file itself while this
   * says only *"something near it moved"*.
   *
   * ⚠️ The graph is built over tracked `.ts`/`.tsx` only: an import edge is the whole mechanism, and a
   * file with no imports cannot be a neighbour of anything. `edges` is printed so a resolver that stops
   * resolving shows as a number collapsing rather than as an empty bucket.
   */
  const sourceFiles = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .sort();
  const graph = buildImportGraph(REPO_ROOT, sourceFiles);
  const { consumers, siblings } = neighbourhood(graph, changed, sourceFiles);
  for (const f of [...consumers, ...siblings]) {
    if (!origin.has(f) && !NOT_CODE.test(f)) origin.set(f, 'neighbour');
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

  /**
   * ── the assertions that can actually fail ───────────────────────────────────────────────────────
   *
   * ⛔ **S1.11.6.1 [pass-4 `D4-11`] — THREE OF THE FIVE COULD NOT.** They read as set identities and were
   * tautologies of the loop above: every key of `origin` either gets a lane or is killed by the inner
   * `die` (which returns `never`), so `unrouted` was always `[]`; `laneOf` gains exactly one key per
   * iteration and `byLane` exactly one entry, so `duplicated` and `routedCount !== origin.size` were
   * always `false`. ⚡ Measured: narrowing lane D's catch-all — the state `unrouted` exists to report —
   * fires the **inner** `die`, and execution never reaches the block. **There is no tree state that
   * reaches it.**
   *
   * ⛔ **In the file whose own docblock records shipping *"a check that could not fail"* one commit
   * earlier.** Deleted rather than repaired: the inner `die` already covers the first, and a `Map` covers
   * the second. What is left below is the two that can fail — and `owed`, which is the only one that
   * proves anything about totality.
   */
  const routedCount = [...byLane.values()].reduce((n, l) => n + l.length, 0);
  const missing = [...laneOf.keys()].filter((f) => !existsSync(join(REPO_ROOT, f)));
  if (missing.length) die(`${missing.length} routed file(s) do not exist on disk:\n  ${missing.join('\n  ')}`);

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
  // ⛔ [D4-11] The one permitted subtraction, COUNTED — the success line names it, so a widening `NOT_CODE`
  // shows up as a number moving rather than as silence. It is the only way `owed` can be emptied dishonestly.
  const excludedByNotCode = [...changed].filter((f) => NOT_CODE.test(f)).length;
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
  /**
   * ⛔ **S1.11.6.1 [pass-4 `D4-11`] — THIS LINE ADVERTISED TWO CONSTANTS BESIDE ONE MEASUREMENT.** It read
   * `N routed · 0 unrouted · 0 duplicated · 0 missing on disk`, and a reader treating *"0 unrouted · 0
   * duplicated"* as evidence the route is total was reading nothing at all. ⚠️ **The totality proof is
   * `owed`**, which the line never mentioned — and `owed`'s quantifier is **changed**, so the sentence has
   * to say so ([D4-7]: this route cannot speak for a file that did not move).
   */
  console.log(
    `   ${routedCount} routed · ${missing.length} missing on disk · ` +
      `every CHANGED tracked file since ${since} is accounted for (${excludedByNotCode} excluded as prose or binary)`,
  );
  console.log(`   by origin: ${ORIGINS.map((o) => `${counts[o]} ${o}`).join(' · ')}`);
  console.log(`   surface: ${inv.statedTotal} files (${inv.statedUnswept} unswept) · S0: ${s0.statedTotal} files`);

  /**
   * ⛔ **S1.12.5.2 [pass-5 D5-8] — WHAT THE NEIGHBOURHOOD STILL CANNOT SEE, PRINTED RATHER THAN IMPLIED.**
   *
   * `neighbour` was added because every other bucket is a predicate on **changed**, so a two-producer
   * disagreement is half-routed by construction. ⚡ **It was then SEEDED with `changed`** — so the
   * identical half-blindness survives on the other axis: a file that has **never been swept by any pass**
   * does not pull its neighbourhood in either, and a disagreement between a never-swept producer and a
   * swept-unchanged sibling is still invisible from the side that did not move. Lane D measured **72**
   * such files, and they are money screens — `PlanHero.tsx`, `RecoveryPlanSection.tsx`, `TimelineLedger.tsx`.
   *
   * ⚠️ **The seed is NOT widened here, and that is deliberate.** Doing so adds ~18% to every future round,
   * and pass 5 read **32% of the 393 files it was given** — so a wider seed buys unread files, not
   * coverage. That is a dispatch decision and it is [DECISION] S1.12.6 on the plan, not a silent code change.
   *
   * ⛔ **What IS fixed is the sentence.** *"N routed · 0 unrouted · 0 owed"* is what a dispatch, a brief and
   * four manifests repeat, and a reader takes it as coverage. The line below states the blind spot in the
   * same breath, so the claim can no longer over-read.
   */
  const unsweptSeed = new Set([...inv.unswept, ...s0.unswept].filter((f) => !NOT_CODE.test(f)));
  const fromUnswept = neighbourhood(graph, unsweptSeed, sourceFiles);
  const unseen = [...fromUnswept.consumers, ...fromUnswept.siblings].filter((f) => !laneOf.has(f) && !NOT_CODE.test(f)).sort();
  console.log(
    `   ⛔ blind spot: ${unseen.length} file(s) sit in the import neighbourhood of a NEVER-SWEPT file and reached no lane.\n` +
      `      The neighbourhood is seeded with CHANGED only, so this route cannot speak for them. See [D5-8].`,
  );
  /**
   * ⛔ **S1.12.5.2 — ROUTED, BUT OWNED BY NO CLAIMS FILE, AND [D69] TREATS THAT AS AN EXEMPTION.**
   *
   * A routed file that appears in neither `surface-coverage.s0.json` nor `.s1.json` has **no record of
   * whether anyone ever read it** — so a finding on it is exempted from the convergence count not because
   * nobody swept it, but because **there is no file in which to say whether anyone did.** ⚡ Pass 5
   * measured 50 such files, and two of them carried findings: `readBackup.ts` a **blocker**, and
   * `parseStatementText.ts` a **major**.
   *
   * ⚠️ The standing fix is `S1.10.6.10` — S2/S3/S4 have no claims file at all, and creating them is that
   * surface's setup, not this route's job. What belongs here is the COUNT, printed every run, so the hole
   * is a number a dispatch reads rather than something a synthesis has to rediscover.
   */
  const claimed = new Set([...inv.files, ...s0.files]);
  const homeless = [...origin.keys()].filter((f) => !claimed.has(f)).sort();
  if (homeless.length) {
    console.log(
      `   ⛔ no claims file owns ${homeless.length} routed file(s), so [D69] would exempt a finding on them\n` +
        `      for the WRONG reason — not "nobody read it" but "nothing records whether anyone did". See S1.10.6.10.`,
    );
  }

  // ⚠️ `--check` writes nothing anywhere, so the list is printed by count only in that mode. The file is
  // for a real dispatch, where the next round needs the names in order to price widening the seed.
  if (unseen.length && outDir && !checkOnly) {
    writeFileSync(join(REPO_ROOT, outDir, 'UNSEEN-NEIGHBOURS.txt'), `${unseen.join('\n')}\n`, 'utf8');
    console.log(`      Written to ${outDir}/UNSEEN-NEIGHBOURS.txt — the names, so the next dispatch can price widening the seed.`);
  }
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

  /**
   * ⛔ **S1.11.6.4 — THE MEMORY PROTOCOL SHIPS WITH THE ROUTE, NOT IN A DOC A ROUND MAY NOT OPEN.**
   *
   * ⚡ Pass 4's dispatch crashed. Three auditors died mid-round, and the recovery was written down in
   * `RESUME-PROTOCOL.md` — a file the NEXT round has to know exists. ⛔ The rules below are the ones that
   * cost something to rediscover, and the sharpest is not about memory at all: **an OOM is a FINDING and
   * never a retry.** The retry with `--max-old-space-size=6144` on a 6 GB box is what did the killing.
   *
   * ⚠️ Written beside the manifests every time the route is generated, so it arrives with the work rather
   * than being remembered. ⭐ Incremental writing is what saved that round — 11 findings were already on
   * disk when the three auditors died — so it is rule one.
   */
  const protocol = [
    '# Running a pass against this route',
    '',
    'Generated by `scripts/audit-route.ts` beside the manifests. Read before dispatching.',
    '',
    '1. **Write findings to disk as you go.** Pass 4 lost three auditors mid-round and kept 11 findings',
    '   because they were already written. A round that reports at the end reports nothing when it dies.',
    '2. **Cap the heap at 1536 MB.** ⛔ **An OOM is a FINDING, never a retry** — the retry with',
    '   `--max-old-space-size=6144` on a 6 GB box is what killed pass 4\'s dispatch.',
    '3. **No whole-monorepo typecheck.** Typecheck the project you touched.',
    '4. **Kill any server you start**, in the step that starts it. Two `serve` processes were found',
    '   listening weeks stale, one of them serving a days-old `dist/` to whatever bound after it.',
    '5. **Verify every restore.** `git checkout --` on an uncommitted fix throws the fix away with the',
    '   plant, and the loop never re-runs to notice. Restore from a copy taken AFTER the fix, and diff it.',
    '6. **Read a command\'s own `$?`.** A pipeline reports the LAST stage: `| tail` has reported exit 0',
    '   over a failed run ten times in this project.',
    '',
    'Origins in `ROUTING-ORIGINS.tsv`, and what each means for the report:',
    '',
    '- `first-look` / `s0-first-look` — never swept by any pass. [D69] exempts findings here from the',
    '  convergence count; they are still fixed.',
    '- `fix-churn` — swept, then rewritten. The recorded sweep describes bytes that are gone.',
    '- `instrument` — the checking code the fixing itself wrote. Report the round SPLIT BY ORIGIN, or a',
    '  flat total hides the app improving while the instruments regress.',
    '- `off-surface` — changed and on no inventory at all.',
    '- `neighbour` — did NOT change, but a file it imports or shares a consumer with did. This is where a',
    '  two-producer disagreement is visible from the side that did not move.',
    '',
  ].join('\n');
  writeFileSync(join(abs, 'RESUME-PROTOCOL.md'), `${protocol}\n`, 'utf8');
  console.log(
    `   written: ${outDir}/ROUTING-{${LANES.map((l) => l.id).join(',')}}.txt + ROUTING-ORIGINS.tsv + RESUME-PROTOCOL.md\n`,
  );
}

main();
