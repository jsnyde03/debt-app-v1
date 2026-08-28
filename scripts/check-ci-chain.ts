import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * ⛔ **`web-e2e.yml`'s HEADER CLAIMS IT RUNS EVERY LINK OF `validate:release:rn`, AND NOTHING COMPARED THE
 * TWO LISTS.** [S1.10.6.5.8.3]
 *
 * ⚡ **The claim is load-bearing and it has already been FALSE.** `embed-pages.yml`'s [D44] guard refuses
 * to deploy any SHA without a green `web-e2e`, and that edge is built entirely on this equivalence. At
 * `[W1-3]` the step list had drifted: `test:stamp`, `test:e2e:embed` and the `packages/core` half of the
 * typecheck were all missing, so **the guard was gating the marketing embed on a run that never exercised
 * the embed.** Three links absent while the header said *"runs the gate"*.
 *
 * ⚠️ The header's own remedy was a sentence — *"if a link is added to `validate:release:rn`, it must be
 * added here in the same commit, or the claim silently rots again"* — and a documentation rule is exactly
 * what failed the first time. `write-gate-status.ts` makes the same argument about the same class.
 *
 * ⛔ **`gate:begin` and `gate:record` are the two deliberate omissions and they are NAMED, not skipped by
 * a pattern.** `gate:record` writes `gate-status.json`, a local record of a pass on a specific tree, and a
 * runner writing it into a throwaway checkout records nothing anyone reads; `gate:begin` opens that same
 * local record. ⚠️ A new omission has to be added here **by name**, which is the difference between an
 * exception and a hole.
 */

const REPO_ROOT = join(import.meta.dirname, '..');
const WORKFLOW = '.github/workflows/web-e2e.yml';
const CHAIN = 'validate:release:rn';

/**
 * The two links CI deliberately does not run, each with the reason it does not. ⛔ Downward-only in
 * spirit: adding a name here is how a link stops being checked, so it is a two-line edit with a reason
 * rather than a regex someone widens.
 */
const DELIBERATE_OMISSIONS: Record<string, string> = {
  'gate:begin': 'opens the LOCAL gate record; a throwaway checkout has nothing to open',
  'gate:record': 'writes gate-status.json, a local record of a pass on a specific tree — nobody reads a runner’s copy',
};

const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const chain = pkg.scripts[CHAIN];
if (!chain) {
  console.error(`\n❌ ci-chain: package.json has no ${CHAIN} script — this gate is pointed at nothing.\n`);
  process.exit(1);
}

/** Every `npm run X` in the chain, in order. */
const links = [...chain.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
if (links.length === 0) {
  console.error(`\n❌ ci-chain: parsed ZERO links out of ${CHAIN} — the parser is broken, not the chain.\n`);
  process.exit(1);
}

const workflow = readFileSync(join(REPO_ROOT, WORKFLOW), 'utf8');

/**
 * ⛔ **S1.11.2 [pass-4 D4-5] — PRESENCE WAS NEVER THE PROPERTY THAT FAILED.**
 *
 * This read `run:` lines with a regex and asked *"does the string `npm run <link>` appear?"*. Measured on
 * four plants against the embed step: deleting the step **reds**, commenting the `run:` line **reds** —
 * but adding **`if: false`** or **`continue-on-error: true`** both leave it **green**, printing *"all 8
 * gating links run in web-e2e.yml"* over a step that never gates. ⚡ The green sentence is then a false
 * statement, and `embed-pages.yml`'s `[D44]` guard trusts exactly that sentence.
 *
 * ⛔ **This file's own docblock diagnosed the class and then rebuilt it:** *"the header's own remedy was a
 * sentence … and a documentation rule is exactly what failed the first time."* The rewrite replaced the
 * sentence with a check on **presence** — and `[W1-3]` was three links **absent**, so absence is the one
 * spelling of *"does not run"* it could see.
 *
 * ⚠️ **A line regex over YAML cannot express "this step executes"; a parser can.** So the workflow is
 * parsed with the `yaml` dependency the repo already carries, and a link counts only if some step runs it
 * **unconditionally** — no step `if:`, no step `continue-on-error: true`, and the same for the job that
 * owns it. ⚡ The parse also fixes the multi-line `run: |` block the regex handled only by accident.
 */
const isGating = (job: Record<string, unknown>, step: Record<string, unknown>): boolean => {
  const truthy = (v: unknown) => v === true || v === 'true';
  if ('if' in step || 'if' in job) return false; // a conditional step/job is not a gating one
  if (truthy(step['continue-on-error']) || truthy(job['continue-on-error'])) return false;
  return true;
};

const doc = parseYaml(workflow) as { jobs?: Record<string, { steps?: unknown[] } & Record<string, unknown>> };
const jobs = Object.values(doc?.jobs ?? {});
const ciRuns = new Set<string>();
let stepsSeen = 0;
for (const job of jobs) {
  for (const step of (job.steps ?? []) as Record<string, unknown>[]) {
    stepsSeen++;
    if (!isGating(job as Record<string, unknown>, step)) continue;
    const run = typeof step.run === 'string' ? step.run : '';
    for (const m of run.matchAll(/npm run ([\w:-]+)/g)) ciRuns.add(m[1]);
  }
}

/**
 * ⛔ **NON-VACUITY, in the shape this file already uses for `links`.** A parse that silently yields no
 * steps would report every link missing — noisy but safe — while a parse that yields steps and no `run`
 * strings would report the chain broken for the wrong reason. Both are parser failures, not chain
 * failures, and they must say so.
 */
if (stepsSeen === 0 || ciRuns.size === 0) {
  console.error(
    `\n❌ ci-chain: parsed ${stepsSeen} step(s) and ${ciRuns.size} \`npm run\` invocation(s) out of ${WORKFLOW}.\n` +
      `   ⛔ The PARSER is broken, not the chain. Fix this before reading any verdict below it.\n`,
  );
  process.exit(1);
}

/** ⛔ Module scope — the gating predicate asserted on the two spellings `D4-5` measured as invisible. */
{
  const CASES: readonly (readonly [Record<string, unknown>, Record<string, unknown>, boolean, string])[] = [
    [{}, { run: 'npm run x' }, true, 'a plain step gates'],
    [{}, { run: 'npm run x', if: 'false' }, false, '⛔ D4-5 — a step with if: does not gate'],
    [{}, { run: 'npm run x', 'continue-on-error': true }, false, '⛔ D4-5 — continue-on-error: true does not gate'],
    [{}, { run: 'npm run x', 'continue-on-error': 'true' }, false, 'the string spelling of the same thing'],
    [{ if: 'github.ref == 1' }, { run: 'npm run x' }, false, 'a step inside a conditional JOB does not gate'],
    [{ 'continue-on-error': true }, { run: 'npm run x' }, false, 'nor one inside a continue-on-error job'],
  ];
  for (const [job, step, want, why] of CASES) {
    if (isGating(job, step) !== want) {
      console.error(`\n❌ ci-chain — its own isGating() is wrong: ${why}\n   got ${isGating(job, step)}, expected ${want}\n`);
      process.exit(1);
    }
  }
}

const problems: string[] = [];
for (const link of links) {
  if (ciRuns.has(link)) continue;
  const why = DELIBERATE_OMISSIONS[link];
  if (why) continue;
  problems.push(
    `[missing] ${CHAIN} runs \`npm run ${link}\` and ${WORKFLOW} does not.\n` +
      `        The header claims this workflow runs every link, and embed-pages.yml's [D44] guard is built on that claim.\n` +
      `        Add the step, or name it in DELIBERATE_OMISSIONS with the reason it is not run.`,
  );
}
for (const [name, why] of Object.entries(DELIBERATE_OMISSIONS)) {
  if (!links.includes(name)) {
    problems.push(
      `[stale] '${name}' is declared a deliberate omission (${why}) and is no longer in ${CHAIN}. Remove the row.`,
    );
  }
  if (ciRuns.has(name)) {
    problems.push(`[stale] '${name}' is declared a deliberate omission and ${WORKFLOW} runs it anyway. Remove the row.`);
  }
}

if (problems.length > 0) {
  console.error(`\n❌ ci-chain: ${problems.length} problem(s)\n`);
  problems.forEach((p) => console.error(`  ✗ ${p}`));
  console.error(
    '\n  The equivalence in this workflow’s header is not a comment — it is what the embed deploy trusts.\n',
  );
  process.exit(1);
}

const omitted = Object.keys(DELIBERATE_OMISSIONS).join(', ');
console.log(
  `✅ ci-chain: all ${links.length - Object.keys(DELIBERATE_OMISSIONS).length} gating links of ${CHAIN} run in ${WORKFLOW} ` +
    `(${omitted} deliberately omitted, by name).`,
);
