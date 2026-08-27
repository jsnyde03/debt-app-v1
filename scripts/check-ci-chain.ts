import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
 * ⚠️ Read off `run:` lines only, never the whole file — the header DISCUSSES most of these names in
 * prose, so a bare `includes()` would find every link in the comment that explains the drift and report
 * the drift fixed.
 */
const ciRuns = new Set(
  workflow
    .split(/\r?\n/)
    .filter((l) => /^\s*run:\s/.test(l) || /^\s{8,}npm run /.test(l))
    .flatMap((l) => [...l.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1])),
);

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
