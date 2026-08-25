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
    'lint:a11y-collapse',
    'lint:contrast',
    'lint:type-scale',
    'lint:icon-glyphs',
    'lint:copy-owners',
    'lint:lane',
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
