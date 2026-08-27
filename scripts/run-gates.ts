/**
 * [P6.8.9.7.11.13.1 · from `.11.9`'s tail] — RUN EVERY GATE, THEN REPORT.
 *
 * ⛔ **`lint:rn` was 22 npm scripts joined by `&&`, so the FIRST red hid the other 21.** That is not a
 * cosmetic complaint about output: it means a session that fixes the first failure has no idea whether it
 * has one problem or fifteen, and every green after a red push is a green whose scope nobody knows. The
 * chain reported *"a gate failed"* when the question is always *"which gates failed."*
 *
 * ⚡ **And it costs nothing when the tree is clean.** A green run already executes all 22; short-circuiting
 * only ever saves time on a run that is going to fail anyway — the one run whose full output is worth the
 * most. The trade was backwards.
 *
 * ⚠️ **`stdio: 'inherit'`, deliberately.** Capturing each gate's output to re-print it would buffer, lose
 * colour, and — the failure this repo has actually shipped — risk a wrapper that summarises instead of
 * showing. Every gate's own output streams exactly as it did before; this file adds a summary AFTER it,
 * and adds nothing else.
 *
 * ⛔ **THE EXIT CODE IS THE PRODUCT.** `.11.12.13` closed a gate that printed `❌` and exited 0, and this
 * plan records **seven** instances of the harness reporting exit 0 over a red gate. So: any non-zero child
 * → exit 1, and the summary names every one.
 *
 * Usage: npm run lint:rn   ·   a single gate is still `npm run lint:<name>` as before.
 */
import { spawnSync } from 'node:child_process';

/**
 * The gates, in the order the `&&` chain ran them.
 *
 * ⚠️ **This list is the only copy.** It used to live in `package.json`'s `lint:rn` string, where a
 * 22-link one-liner is unreadable and unreviewable — which is part of how the `&&` went unnoticed.
 */
const GATES: { name: string; cmd: string; args: string[] }[] = [
  { name: 'eslint (apps/rn)', cmd: 'npm', args: ['--prefix', 'apps/rn', 'run', 'lint'] },
  ...[
    'lint:a11y-props',
    'lint:comments',
    'lint:rn-style',
    'lint:local-dates',
    'lint:month-arithmetic',
    'lint:copy',
    'lint:glossary',
    'lint:money',
    'lint:apostrophes',
    'lint:closure',
    'lint:destructive',
    'lint:sandbox',
    'lint:secrets',
    'lint:selectors',
    'lint:coverage',
    // [D69] — the S0 surface inventory. Reds when a file joins or leaves the instrument surface without
    // its coverage being recorded, which is what keeps "first look" a lookup rather than a claim.
    'lint:s0-coverage',
    'lint:s1-coverage',
    'lint:surface-complete',
    // ⛔ S1.10.6.5.8.4 [GAP-13] — the same completeness argument, applied to what [D49] FINGERPRINTS.
    // `gateSources.ts`'s header argues that scope must be an exclusion list because an inclusion list
    // fails silent — and then defines `ROOTS` as an inclusion list of directories. Removing one reds
    // `lint:gate-freshness` exactly ONCE, and the next `gate:record` blesses the narrower set forever.
    'lint:gate-sources',
    // ⛔ S1.10.6.5.8.4 [GAP-8] — seven gates reported ✅ while reading nothing. This closes the CLASS:
    // every script importing lib/stripCode carries a scan floor, or is exempt for a MEASURED reason.
    'lint:scan-floors',
    // [D67] — finding → guard, the `check-copy-owners` pattern applied to findings. Reds when a guard's
    // assertion is removed even though its file survives.
    'lint:finding-guards',
    'lint:a11y-collapse',
    'lint:contrast',
    'lint:type-scale',
    'lint:press-opacity',
    'lint:icon-glyphs',
    'lint:copy-owners',
    // ⛔ S1.10.6.2 [C-1] — the trust rule's own gate. `trustSelectors.test.ts` proves every repairable
    // field is ROUTED to a claim; this proves every claim is ASKED by production, which is the half that
    // was missing when `'row-figures'` shipped with three grep hits and no callers.
    'lint:trust-claims',
  // ⛔ S1.10.6.5.8.3 — the workflow's header claims it runs every link of `validate:release:rn`, the
  // embed deploy's [D44] guard is built on that claim, and it has already been false once ([W1-3]).
  'lint:ci-chain',
    'lint:lane',
    // ⛔ S1.5.4 [M5] — THE ONLY THING IN THE TREE ASSERTING A GATE FAILS **CLOSED**, and it was in no
    // chain at all: not here, not `validate:release:rn`, not CI. A repo-wide search for `gate-plants`
    // returned eleven files and not one runner. ⚡ All FIFTEEN of S0's majors were gates reporting green
    // while doing less than they claimed, so the instrument built for that class was itself unexecuted —
    // and `REVERIFY4-4`'s only BEHAVIOURAL guard is one of its scenarios.
    // ⚠️ Not deliberate: `lint:gate-freshness` is the file that IS deliberately outside every chain and
    // says so in its own docstring (GAP-14). This one carried no such statement.
    // ⚠️ Last, and it costs ~50s: it plants into a scratch file and runs five gates, so it is the most
    // expensive link here. It does not recurse — it invokes named gates, never `lint:rn`.
    'test:gate-plants',
  ].map((name) => ({ name, cmd: 'npm', args: ['run', name] })),
];

const failed: string[] = [];

for (const gate of GATES) {
  console.log(`\n[1m── ${gate.name} ${'─'.repeat(Math.max(0, 70 - gate.name.length))}[0m`);
  // `shell: true` on Windows — `npm` is `npm.cmd`, and spawnSync without a shell cannot resolve it.
  const res = spawnSync(gate.cmd, gate.args, { stdio: 'inherit', shell: true });
  // ⚠️ A signal death has a null status and is NOT a pass. `status !== 0` would read `null !== 0` as true,
  // which happens to be right — but it is right by accident, so it is written out.
  const ok = res.status === 0;
  if (!ok) failed.push(gate.name);
}

console.log(`\n[1m${'═'.repeat(72)}[0m`);
if (failed.length === 0) {
  console.log(`[32m✅ lint:rn — all ${GATES.length} gates pass.[0m`);
  process.exit(0);
}

console.error(`[31m❌ lint:rn — ${failed.length} of ${GATES.length} gates FAILED:[0m\n`);
for (const name of failed) console.error(`  ❌ ${name}`);
console.error(
  `\n  Every gate ran; the output for each is above, in order. Re-run one on its own with\n` +
    `  \`npm run <name>\`. ⛔ ${GATES.length - failed.length} passing does not mean the tree is clean —\n` +
    `  it means these ${failed.length} are what is left.\n`,
);
process.exit(1);
