/**
 * ⛔ **S1.12.5.4 [pass-5 `D5-12`] — A TEST FILE IN THE TREE AND IN NO RUNNER IS SILENTLY UNEXECUTED.**
 *
 * ⚡ Lane D wrote a new test file that throws on its first line, added it to no runner, and ran the suite:
 * `npm run test:app` → **EXIT 0, "✅ App-layer regression tests: ALL PASSED."** `typecheck:tests` was green
 * too. A file that cannot pass, in the tree, reported as passing.
 *
 * ⛔ **Both runners were COMPLETE when measured** — 73 of 73 and 64 of 64 — and that is the point: the gap
 * is not a missing test, it is that **nothing would notice one.** The standing control was a sentence in a
 * docstring (*"New app-layer tests: add the file + one line here"*), and `check-ci-chain.ts` is this repo's
 * own written verdict on that: *"the header's own remedy was a sentence … and a documentation rule is
 * exactly what failed the first time."*
 *
 * ⚡ **It composes with the guard ledger, which is why it is a major and not a tidiness note.** **30 of the
 * registered guard proofs run `test:app`** and 8 run `test:regression`. A guard whose test file quietly left
 * the runner would score `failed-open` — and be read as *a dead guard* rather than as *an unexecuted one*.
 *
 * ## Why this is a set difference and not a count
 *
 * ⛔ `D5-9` is what a count does here: `lint:cap-literals` held a floor with one unit of slack, a cap
 * silently left its population, and the gate printed a tick. **A count with slack cannot see a member that
 * never joins.** So this asserts SET INCLUSION — every tracked test file appears in its runner — and names
 * the missing paths rather than reporting a number.
 *
 * ⚠️ **Matched on the repo-relative PATH, never on the basename.** Lane D's own measurement matched on
 * basename and said so; two same-named test files in different directories would have collided and one
 * would have been read as present because the other was.
 *
 * Usage: npm run lint:runner-completeness
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stripCommentsOnly } from './lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '..');

interface Runner {
  /** the npm script a human would run, so a failure names it */
  gate: string;
  /** the runner file, repo-relative */
  runner: string;
  /** git pathspecs — the ROOTS to look under, never a shape */
  pathspecs: string[];
  /**
   * ⛔ **S1.13.7.2 [pass-6 `D1-2`] — THE SHAPE IS A REGEX, NOT A GLOB, and that is the whole fix.**
   * `apps/rn/src/**\/*.test.ts` requires a directory between the root and the file, so a test sitting at
   * the TOP LEVEL of either root matched nothing at all — the gate was green over a hole shaped exactly
   * like the defect it exists to catch. A root plus a regex has no depth to get wrong.
   */
  match: (repoPath: string) => boolean;
  /** how the runner names a member — returns repo-relative paths */
  imports: (src: string, runnerRel: string) => Set<string>;
}

/** Resolve a runner's own relative specifier to a repo-relative path, so the comparison is path-based. */
function resolveFrom(runnerRel: string, spec: string): string {
  const dir = runnerRel.slice(0, runnerRel.lastIndexOf('/'));
  const parts = `${dir}/${spec}`.split('/');
  const out: string[] = [];
  for (const p of parts) {
    if (p === '.' || p === '') continue;
    if (p === '..') out.pop();
    else out.push(p);
  }
  return out.join('/');
}

/**
 * ⚠️ The two runners use different specifier styles, so each names its own extraction rather than sharing
 * one regex that would have to be right about both. `@core/…` and `@/…` are alias forms and are resolved
 * to the paths they mean, because the pathspecs below are paths.
 */
const ALIASES: [RegExp, string][] = [
  [/^@core\//, 'packages/core/'],
  [/^@\//, 'apps/rn/src/'],
];

function toRepoPath(runnerRel: string, spec: string): string {
  for (const [re, to] of ALIASES) if (re.test(spec)) return spec.replace(re, to);
  return resolveFrom(runnerRel, spec);
}

const RUNNERS: Runner[] = [
  {
    gate: 'test:app',
    runner: 'apps/rn/src/testing/runAppTests.ts',
    pathspecs: ['apps/rn/src'],
    match: (p) => /\.test\.tsx?$/.test(p),
    imports: (src, rel) =>
      new Set([...src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => toRepoPath(rel, m[1]))),
  },
  {
    gate: 'test:regression',
    runner: 'packages/core/testing/runRegressionTests.ts',
    // ⚠️ `packages/` uses the `testXxx.ts` convention, NOT `*.test.ts` — the same two-convention split that
    // produced pass-4 `D4-3`, where a classifier knowing one convention read 64 test files as production.
    pathspecs: ['packages/core'],
    match: (p) => /(^|\/)test[A-Z][A-Za-z0-9]*\.ts$/.test(p),
    imports: (src, rel) =>
      new Set([...src.matchAll(/import\s+["']([^"']+)["']/g)].map((m) => toRepoPath(rel, m[1]))),
  },
];

/**
 * ⛔ **S1.13.7.2 [pass-6 `D2-8` · `C3-11`] — THE THIRD POPULATION, AND IT IS WHERE THE CHECKING CODE LIVES.**
 *
 * This gate closed *"a test in no runner"* for two trees and was blind to **`scripts/`**, which holds
 * **six of the repo's eight test-shaped instrument files** — the harnesses that certify every other gate.
 * A test could be added there, or stop being run, with `lint:rn` fully green.
 *
 * ⚡ **And `test-gate-plants.ts` planted its proof of this very gate into
 * `apps/rn/src/store/__gate_plant_unwired__.test.ts` — inside one of the two populations it already
 * covered.** The scenario could not discover the third by construction. *"Which member of its class did
 * this test pick?"*, asked of the plant rather than the code.
 *
 * ⚠️ Here the "runner" is `package.json`: a script in `scripts/` is run because an npm script names it.
 * So the membership test is *"does the script map mention this file"*, and the extraction is a path match
 * rather than an import parse.
 */
RUNNERS.push({
  gate: 'package.json (npm script map)',
  runner: 'package.json',
  pathspecs: ['scripts'],
  match: (p) => /(^|\/)test-[A-Za-z0-9._-]+\.(ts|mjs|cjs|sh)$/.test(p),
  imports: (src) => new Set([...src.matchAll(/scripts\/(test-[A-Za-z0-9._-]+\.(?:ts|mjs|cjs|sh))/g)].map((m) => `scripts/${m[1]}`)),
});

const problems: string[] = [];
const summary: string[] = [];

for (const r of RUNNERS) {
  const tracked = execFileSync('git', ['ls-files', ...r.pathspecs], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((p) => r.match(p));
  /**
   * ⛔ **COMMENTS ARE BLANKED BEFORE THE IMPORTS ARE EXTRACTED** — pass-7 `D1-2`. The runner was read raw,
   * so a suite commented out of it stayed in `imported` and this gate reported every file wired. Measured:
   * `// import "./testAbuseScenarios";` left **301 lines of break-it money assertions unexecuted**, and
   * both `test:regression` and this gate printed green. The gate's own premise — *"a test file in the tree
   * and in NO runner is silently unexecuted"* — was satisfied by a `//`.
   */
  const imported = wiredIn(r);
  // A runner names a module without its extension; compare on the stem so `.ts`/`.tsx` cannot disagree.
  const stem = (p: string) => p.replace(/\.(ts|tsx)$/, '');
  const importedStems = new Set([...imported].map(stem));
  const missing = tracked.filter((t) => !importedStems.has(stem(t)));

  if (tracked.length === 0) {
    // ⛔ A pathspec that matches nothing makes this gate vacuous for that runner — the check would pass
    // over an empty set forever. This is the `run-the-control-on-the-verifier` row.
    problems.push(
      `[${r.gate}] the pathspecs ${JSON.stringify(r.pathspecs)} match NO tracked file.\n` +
        '        ⛔ This gate would then be green over an empty set. Fix the pathspec, not the count.',
    );
    continue;
  }
  if (missing.length) {
    problems.push(
      `[${r.gate}] ${missing.length} tracked test file(s) are in the tree and in NO runner:\n` +
        missing.map((m) => `          ${m}`).join('\n') +
        `\n        ⛔ ${r.gate} would print ALL PASSED over them. Add each to ${r.runner}.`,
    );
  }
  summary.push(`${r.gate}: ${tracked.length} tracked · ${tracked.length - missing.length} wired`);
}

/**
 * ⛔ **S1.13.7.2 [pass-6 `D1-8`] — AND NOTHING ASSERTED THE GATE LIST ITSELF WAS COMPLETE.**
 *
 * `run-gates.ts`'s `GATES` is a hand-written literal array. A gate script can exist in the tree, be wired
 * into `package.json`, and be in **no chain** — so it is never executed, and `lint:rn` still announces
 * *"all N gates pass."* **There is a live instance** (`lint:webkit`, already on the backlog), which is how
 * this was found rather than reasoned about.
 *
 * ⚠️ Same shape as the file check above, transposed onto script names: the population is derived from
 * `package.json` rather than typed here, so a gate added tomorrow is covered without editing this file.
 * An intentional omission is **named with a reason** — an exclusion list fails safe; an inclusion list is
 * what produced the hole.
 */
const EXEMPT_FROM_CHAIN: Record<string, string> = {
  'lint:rn': 'is the runner itself — it executes the chain',
  'lint:webkit': 'red and unchained, tracked on the deferred backlog; chaining it now would red every push',
  // ⚠️ Verified against the code rather than assumed — `run-gates.ts:140` states it in as many words:
  // *"`lint:gate-freshness` is the file that IS deliberately outside every chain"*. [D49]/[D74]: it reds
  // for the whole duration of an audit by design, so chaining it would make mid-pass red the normal state.
  'lint:gate-freshness': 'deliberately outside every chain — it reds for the duration of a pass by design ([D49]/[D74])',
  // ⚠️ `--working-tree` variant of `lint:secrets`, which IS chained. Built for [M10], an auditor writing a
  // new report; running both in one chain would double the scan and refuse the authoring case.
  'lint:secrets:authoring': 'the --working-tree variant of lint:secrets, which is chained; authoring mode only',
};

const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
/**
 * ⛔ **COMMENTS BLANKED FIRST** — pass-7 `D1-1`. This was `readFileSync` raw, and membership was
 * `String.includes("'lint:money'")` over the whole text, so **commenting a gate out of `GATES` left it
 * counted as chained**: `lint:rn` then printed `✅ all 47 gates pass` while the 48th — the money-format
 * gate — did not run. Measured: baseline exit 0, `// 'lint:money',` exit 0 with a byte-identical success
 * line, and the control (line deleted) exit 1 naming it.
 *
 * ⚠️ **This also makes the check STRICTER in a second way, deliberately:** a gate named only inside a
 * docblock no longer counts as chained. That is the correct reading — a mention is not an execution.
 */
/**
 * ⛔ **ONLY THE `GATES` ARRAY COUNTS AS THE CHAIN** — class-1 re-audit `R13`. Blanking comments was half
 * the fix; membership was still `String.includes` over the **whole file**, so a gate deleted from `GATES`
 * but named anywhere else still live — an error message, a docstring's code sample, another array — counted
 * as chained. The subject is the array, so the array is what is read.
 *
 * ⚠️ **Both bounds are asserted.** A rename that made either marker unfindable would otherwise leave this
 * searching an empty string, and every gate would read as unchained — or, worse, a `slice` that silently
 * returned the whole file would restore exactly the defect being fixed.
 */
/**
 * ⛔ **THESE TWO FUNCTIONS ARE THE PRODUCTION PATH, AND THE FIXTURES BELOW CALL THEM.**
 * [class-1 re-audit `N-3`]
 *
 * Round 2 added fixture self-checks and left production with its own inline copy of the same logic, so
 * `chainRegion` had exactly ONE caller — the fixture — and the import fixture supplied its own stripping.
 * **`D1-1`, `D1-2` and `R13` were each one-line un-fixable with this gate green**: the self-check asserted
 * a private copy while the shipping code went unchecked. That is `R14`'s own mechanism, committed inside
 * `R14`'s fix. One producer, called by both.
 */

/**
 * A runner's declared imports: **read, strip, extract — one function, and production passes no source.**
 *
 * ⛔ `U8` — this used to be `importsOf(r, rawSrc)` with production doing its own `readFileSync`, so
 * `importsOf(r, readFileSync(…))` → `r.imports(readFileSync(…), r.runner)` was a one-line un-fix that
 * dropped the strip and re-opened `D1-2` verbatim: the fixture kept passing because it called `importsOf`
 * directly, while production no longer did. With the read INSIDE, there is no raw source in scope to hand
 * to the wrong function.
 *
 * ⚠️ The `src` parameter exists only so the fixture can inject a synthetic runner; production never passes it.
 */
function wiredIn(r: Runner, src?: string): Set<string> {
  return r.imports(stripCommentsOnly(src ?? readFileSync(join(REPO_ROOT, r.runner), 'utf8')), r.runner);
}

/** The `GATES` array literal region of `run-gates.ts`, or `null` if its bounds cannot be found. */
function chainRegion(src: string): string | null {
  const start = src.indexOf('const GATES');
  if (start === -1) return null;
  const end = src.indexOf('\n];', start);
  if (end === -1) return null;
  return src.slice(start, end);
}

/**
 * ⛔ **THE WHOLE COMPOSITION, UNDER ONE NAME — read → strip → bound.**
 * [class-1 re-audit 4 `U8`, major]
 *
 * ⚡ Round 3 asserted the HELPERS; round 4 asserted two of the VALUES; neither asserted the dataflow
 * BETWEEN them, so `D1-1` and `D1-2` were each re-openable by a one-line edit with this gate green:
 *
 *     const runGates = chainRegion(runGatesRaw);   →   chainRegion(runGatesFile)
 *
 * That drops the comment strip. A gate commented out of `GATES` then counts as chained, `lint:rn`
 * silently stops running it — **and every round-4 assertion still held**, because `runGatesRaw` was
 * still computed and still differed from the file. Nothing said `runGates` came out of it.
 *
 * ⚡ This is `N-3`'s mechanism at its FOURTH recurrence: *a self-check that exercises the helper says
 * nothing about whether the shipping code uses its result.* Each round closed the un-fix route it had
 * just imagined.
 *
 * ⛔ **A composition cannot be fully closed from inside one file** — a determined edit can always call
 * the parts. What this does is remove the tempting intermediate (`runGatesRaw` is gone as a name to pass
 * to `chainRegion`), put ONE path under test end to end, and hand the residue to the instrument built
 * for un-fixes: `S1P7-U8-CHAIN-COMPOSITION` in `finding-guards.json` plants exactly the edit above,
 * together with a real commented-out gate, and requires this gate to red.
 */
function chainedGatesFrom(src: string): string | null {
  return chainRegion(stripCommentsOnly(src));
}

/**
 * ⛔ **BOTH HALVES ASSERTED ON FIXTURES EVERY RUN** — class-1 re-audit `R14`. Each was measured green over
 * a real defect: a gate commented out of the chain (`D1-1`), a suite commented out of its runner (`D1-2`),
 * and a gate deleted from `GATES` but still named elsewhere in the file (`R13`). A membership test that
 * finds everything wired looks identical when it is simply not reading the right text.
 */
{
  /**
   * ⛔ `U8` — the fixture is on the function PRODUCTION CALLS, and its input carries BOTH defects at once:
   * a gate outside the array (`R13`) and a gate commented out inside it (`D1-1`). A fixture on
   * `chainRegion` alone said nothing about the strip, which is how `D1-1` stayed re-openable.
   */
  const region = chainedGatesFrom(
    "const GATES = [\n  'lint:in',\n  // 'lint:commented',\n];\nconst note = 'lint:outside';\n",
  );
  if (region !== null && region.includes("'lint:commented'")) {
    console.error(
      '\n❌ runner completeness: a gate COMMENTED OUT of GATES still counts as chained.\n' +
        `  Got: ${JSON.stringify(region)}\n` +
        '  ⛔ D1-1 — lint:rn then silently stops running it while printing a full green. The chain text\n' +
        '  must be read through `stripCommentsOnly` before the region is bounded.\n',
    );
    process.exit(1);
  }
  if (region === null || !region.includes("'lint:in'") || region.includes("'lint:outside'")) {
    console.error(
      '\n❌ runner completeness: the chain region is not bounded to the GATES array.\n' +
        `  Got: ${JSON.stringify(region)}\n` +
        '  ⛔ R13 — a gate named anywhere else in the file would count as chained.\n',
    );
    process.exit(1);
  }
  /**
   * ⛔ **THE CALL SITES ARE PINNED IN THIS GATE'S OWN SOURCE, AND THAT IS THE ONLY THING THAT CLOSES `U8`.**
   * [class-1 re-audit 4 `U8`, major]
   *
   * ⚡ **Measured, after the composition refactor above.** Both of `U8`'s one-line un-fixes STILL fail
   * open — with the real defect planted alongside:
   *
   *     const imported = r.imports(readFileSync(…), r.runner)   + a suite commented out of its runner
   *     const runGates = chainRegion(runGatesFile)              + a gate commented out of GATES
   *     → `✅ every tracked test file is wired into its runner`, both times
   *
   * ⛔ **A composition cannot be closed from inside the file that composes it**, and neither instrument
   * this repo has can catch it either: a `finding-guards` token pins a LINE, and both call sites are
   * declarations, so `D3-3`'s rule correctly refuses them (*a declaration survives its use being
   * deleted*); and `prove:guards` requires the un-fix to make something RED, while this un-fix's whole
   * signature is that it makes something GREEN.
   *
   * ⚡ So the gate reads its own source and requires every call site listed below to be present. The exact
   * spelling is what makes the swap visible — the un-fix stops being one identifier nobody would notice
   * and becomes an edit that reds `lint:runner-completeness` by name.
   *
   * ⚠️ Comments are stripped first, or the paragraph you are reading would satisfy the pin.
   */
  const selfSrc = stripCommentsOnly(readFileSync(join(REPO_ROOT, 'scripts/check-runner-completeness.ts'), 'utf8'));
  for (const [site, why] of [
    ['chainedGatesFrom(runGatesFile)', 'D1-1 — a gate COMMENTED OUT of GATES counts as chained'],
    ['const imported = wiredIn(r);', 'D1-2 — a suite COMMENTED OUT of its runner counts as wired'],
  ] as const) {
    /**
     * ⛔ **COUNTED, NOT `includes` — THE PIN SATISFIED ITSELF.** Measured on the first cut: the site
     * strings are string literals in the array above, which is CODE, so `selfSrc.includes(site)` was true
     * with production's call swapped out. The check passed over both un-fixes with the real defect
     * planted, exactly as before it was written.
     *
     * ⚡ **`a check that cannot fail`, in the check written to close a check that could not fail** — the
     * fourth location of that shape this round. Two occurrences are required: the pin's own literal, and
     * the call.
     */
    if (selfSrc.split(site).length - 1 < 2) {
      console.error(
        `\n❌ runner completeness: production no longer calls \`${site}\`.\n` +
          `  ⛔ ${why}, and this gate would print a full green over it.\n` +
          '  ⛔ U8 — the helper being correct and tested says nothing about the shipping code using it.\n' +
          '  Restore the call, or move the pin deliberately in the same edit.\n',
      );
      process.exit(1);
    }
  }

  const reg = RUNNERS.find((r) => r.gate === 'test:regression');
  if (reg) {
    const live = wiredIn(reg, 'import "./testThing";');
    const commented = wiredIn(reg, '// import "./testThing";');
    if (live.size !== 1 || commented.size !== 0) {
      console.error(
        '\n❌ runner completeness: a COMMENTED-OUT import is still counted as wired.\n' +
          `  live=${live.size} (want 1) · commented=${commented.size} (want 0)\n` +
          '  ⛔ D1-2 — a suite can leave its runner behind a `//` while this gate reports every file wired.\n',
      );
      process.exit(1);
    }
  }
}

const runGatesFile = readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8');
const runGatesRaw = stripCommentsOnly(runGatesFile);
// ⛔ `U8` - ONE call, the same function the fixture above exercises end to end. The previous spelling
// was `chainRegion(runGatesRaw)`, one identifier away from `chainRegion(runGatesFile)` - which drops the
// strip, re-opens `D1-1`, and satisfied every assertion below.
const runGates = chainedGatesFrom(runGatesFile);

/**
 * ⛔ **THESE ASSERT THE PRODUCTION VALUES, NOT THE FUNCTIONS** — [class-1 re-audit 3 · `N-3` `R14`/`D1-1`].
 *
 * Round 3 gave this gate fixture self-checks and made production call the same helpers. That closed one of
 * three un-fixes and **left two green**, because a self-check that exercises `chainRegion` and `importsOf`
 * says nothing about whether the shipping code still *uses* their results:
 *
 * - `const runGates = runGatesRaw` (bypass the region) → the chain search widens to the whole file, and a
 *   gate deleted from `GATES` but named in any live string counts as chained. **`R13`, re-openable.**
 * - `readFileSync(…)` with no strip → a gate commented out of `GATES` counts as chained. **`D1-1`.**
 *
 * ⚡ **So the values are checked, not the helpers.** `run-gates.ts` demonstrably contains comments, and the
 * chain region is demonstrably a proper subset of the file — both are facts about the shipping variables,
 * and neither can be satisfied by a helper nobody calls.
 */
if (runGatesRaw === runGatesFile) {
  console.error(
    '\n❌ runner completeness: `run-gates.ts` was read WITHOUT stripping comments.\n' +
      '  ⛔ D1-1 — a gate commented out of GATES then counts as chained, and lint:rn silently\n' +
      '  drops it while printing a full green. The file certainly contains comments; the stripped\n' +
      '  text being byte-identical to the file means the strip is gone.\n',
  );
  process.exit(1);
}
if (runGates !== null && runGates.length >= runGatesRaw.length) {
  console.error(
    '\n❌ runner completeness: the chain region is not a proper subset of `run-gates.ts`.\n' +
      '  ⛔ R13 — the search has widened to the whole file, so a gate named in ANY live string —\n' +
      '  an error message, another array — counts as chained. The region must be the GATES array.\n',
  );
  process.exit(1);
}
if (runGates === null) {
  console.error(
    '\n❌ runner completeness: could not find the bounds of `GATES` in scripts/run-gates.ts.\n' +
      '  ⛔ Without them this check would search the whole file and count a gate as chained because its\n' +
      '  name appears in a message. Fix the markers rather than widening the search.\n',
  );
  process.exit(1);
}
const unchained = Object.keys(pkg.scripts)
  .filter((n) => n.startsWith('lint:'))
  .filter((n) => !(n in EXEMPT_FROM_CHAIN))
  .filter((n) => !runGates.includes(`'${n}'`));

if (unchained.length) {
  problems.push(
    `[lint:rn] ${unchained.length} lint script(s) exist in package.json and are in NO chain:\n` +
      unchained.map((n) => `          ${n}`).join('\n') +
      "\n        ⛔ `lint:rn` would still print \"all N gates pass\" — the gate is never executed. Add it to\n" +
      '        GATES in scripts/run-gates.ts, or name it in EXEMPT_FROM_CHAIN with the reason.',
  );
}
// ⚠️ A stale exemption is a hole with a comment in front of it — the MAX_EXEMPT shape this repo uses.
for (const [name, why] of Object.entries(EXEMPT_FROM_CHAIN)) {
  if (!(name in pkg.scripts)) problems.push(`[lint:rn] EXEMPT_FROM_CHAIN names "${name}" (${why}) and package.json has no such script.`);
}

if (problems.length) {
  console.error(`\n❌ runner completeness: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error(
    '\n  ⛔ A test file nobody wired in passes review, ships, and asserts nothing — and 30 of the\n' +
      '  registered guard proofs run `test:app`, so such a guard would read as DEAD rather than as\n' +
      '  UNEXECUTED. [pass-5 D5-12]\n',
  );
  process.exit(1);
}

console.log(`✅ runner completeness: every tracked test file is wired into its runner (${summary.join(' · ')}).`);
