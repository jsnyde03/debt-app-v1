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
  const imported = r.imports(stripCommentsOnly(readFileSync(join(REPO_ROOT, r.runner), 'utf8')), r.runner);
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
const runGates = stripCommentsOnly(readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8'));
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
