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

const REPO_ROOT = join(import.meta.dirname, '..');

interface Runner {
  /** the npm script a human would run, so a failure names it */
  gate: string;
  /** the runner file, repo-relative */
  runner: string;
  /** git pathspecs enumerating the files that MUST be in it */
  pathspecs: string[];
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
    pathspecs: ['apps/rn/src/**/*.test.ts', 'apps/rn/src/**/*.test.tsx'],
    imports: (src, rel) =>
      new Set([...src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => toRepoPath(rel, m[1]))),
  },
  {
    gate: 'test:regression',
    runner: 'packages/core/testing/runRegressionTests.ts',
    // ⚠️ `packages/` uses the `testXxx.ts` convention, NOT `*.test.ts` — the same two-convention split that
    // produced pass-4 `D4-3`, where a classifier knowing one convention read 64 test files as production.
    pathspecs: ['packages/core/**/test[A-Z]*.ts'],
    imports: (src, rel) =>
      new Set([...src.matchAll(/import\s+["']([^"']+)["']/g)].map((m) => toRepoPath(rel, m[1]))),
  },
];

const problems: string[] = [];
const summary: string[] = [];

for (const r of RUNNERS) {
  const tracked = execFileSync('git', ['ls-files', ...r.pathspecs], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const imported = r.imports(readFileSync(join(REPO_ROOT, r.runner), 'utf8'), r.runner);
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
