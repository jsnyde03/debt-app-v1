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
    'lint:s2-coverage',
    'lint:s3-coverage',
    'lint:s4-coverage',
    'lint:surface-complete',
    // ⛔ S1.10.6.5.8.4 [GAP-13] — the same completeness argument, applied to what [D49] FINGERPRINTS.
    // `gateSources.ts`'s header argues that scope must be an exclusion list because an inclusion list
    // fails silent — and then defines `ROOTS` as an inclusion list of directories. Removing one reds
    // `lint:gate-freshness` exactly ONCE, and the next `gate:record` blesses the narrower set forever.
    'lint:gate-sources',
    // ⛔ S1.10.6.5.8.4 [GAP-8] — seven gates reported ✅ while reading nothing. This closes the CLASS:
    // every script importing lib/stripCode carries a scan floor, or is exempt for a MEASURED reason.
    'lint:scan-floors',
    // ⛔ S1.10.6.5.8.5 [GAP-12] — CI is ubuntu-latest and CANNOT see the CRLF class even in principle.
    // A committed fixture of real CRLF bytes, asserting lib/stripCode is ending-faithful for all 11 gates.
    'lint:line-endings',
    // ⛔ S1.10.6.5.8.5 [GAP-4 · GAP-5] — three of stripMarkdownCode's four spelling rules could be
    // DELETED with lint:closure green (measured, exit 0). A closure that was never examined is a
    // finding signed off by nobody, and this is M12's shape for the fifth time.
    'lint:closure-stripper',
    // ⛔ S1.10.6.5.8.6 [GAP-18] — the class has recurred THREE times, most recently a raw NUL written
    // straight into the generated strings inventory. A file tooling silently declines to read is the
    // same failure as a gate that silently reads nothing.
    'lint:control-chars',
    // ⛔ S1.10.6.5.8.6 [GAP-9] — eleven gates read through lib/stripCode and NOTHING tested it.
    // Measured: neutering its regex branch leaves all eleven at exit 0, so reverting it is silent
    // by construction. This is the only thing that notices.
    'lint:strip-code',
    // [D67] — finding → guard, the `check-copy-owners` pattern applied to findings. Reds when a guard's
    // assertion is removed even though its file survives.
    'lint:finding-guards',
    // ⛔ S1.11.3.1 — `lint:finding-guards` proves a TOKEN is present; `prove:guards` proves the guard
    // still REDS. Pass 4 ran the first beside every un-fix it performed and it exited 0 every time. This
    // link is the second one's own 2×2 — a guard that holds reads ✅, a plant that lands and changes
    // nothing the check reads is called `failed-open` — because an instrument in no chain is unexecuted
    // ([M5]), which is how `test:gate-plants` itself sat unrun while fifteen gates were reporting green.
    'prove:guards:selftest',
    // ⛔ S1.11.3.3 [pass-4 D4-4] — check-trust-claims shipped two caps computed as `Object.keys(X).length`,
    // so both downward-only ratchets were `n > n`. Nothing could see it: the tokens were present, the gate
    // was green, and no plant existed for a cap. This refuses the class across every script.
    'lint:cap-literals',
    // ⛔ S1.12.5.4 [pass-5 D5-12] — a test file in the tree and in NO runner is silently unexecuted:
    // `test:app` printed ALL PASSED over a file that throws on its first line. Both runners were complete
    // when measured; the gap is that nothing would notice one, and 30 registered guard proofs run
    // `test:app` — such a guard would read as DEAD rather than as UNEXECUTED.
    'lint:runner-completeness',
    // ⛔ S1.12.5.6 [pass-5 A5-4] — 93 inline copies of the money-rounding expression beside the one
    // exported owner. They agree today; the class (two producers of one fact) is what A1, A2 and A-F4
    // each were. Downward-only, so the copies cannot grow while the collapse is scheduled.
    'lint:rounding',
    'lint:store-id-writes',
    // ⛔ S1.12.11 — five tracked files carried unresolved conflict markers for 177 commits. The root Next
    // app could not parse, so its whole e2e suite was un-runnable, and forty-two gates read ✅ over it
    // because not one of them looks at `app/`. Scheduled-for-deletion is not deleted. Population is
    // `git ls-files`, so a scope list can never hide the next one.
    'lint:conflict-markers',
    // ⛔ S1.13.7.1 [pass-6 A1-4/A1-5] — a calendar literal in a fixture is a fuse that burns silently.
    // `seed.ts` wrote `dueDate: '2026-07-01'` on the shared default, so 43 of 63 specs had been driving
    // the OVERDUE branch since July with nothing red to say so. The `imminent` half fires BEFORE the
    // branch changes; the `aged` half is a downward-only cap. Both have a population floor, because
    // pass-6 `D2-3` was exactly the defect of shipping a check whose population can go quietly empty.
    'lint:fixture-dates',
    // ⛔ S1.13.7.8 [pass-6 C1-6] — `?? 0` on an `amountField` parser hands back the distinction the
    // parser exists to keep: `null` is BLANK OR UNPARSEABLE, and neither is a payment of zero. The payday
    // sheet's extra-payment box recorded an unreadable entry as $0.00, and that figure feeds the
    // Interest-Saved Ledger and the Drift Tracker. Population is `git ls-files`; every site is named with
    // a reason, and a permission that covers nothing reds too.
    'lint:amount-collapse',
    'lint:a11y-collapse',
    'lint:contrast',
    'lint:type-scale',
    'lint:press-opacity',
    'lint:icon-glyphs',
    'lint:copy-owners',
    // ⛔ S1.10.6.2 [C-1] — the trust rule's own gate. `trustSelectors.test.ts` proves every repairable
    // field is ROUTED to a claim; this proves every claim is ASKED by production, which is the half that
    // was missing when `'row-figures'` shipped with three grep hits and no callers.
    // ⛔ S1.11.4.3 [pass-4 C4-11] — the restore doors, DERIVED from every production `importStore(` call
    // rather than listed. The registry entry it replaces asserted the WORDING over a hand-counted pair and
    // said "both doors compose from one owner"; there were four, and the two nobody had counted were the
    // two with no disclosure at all.
    'lint:restore-doors',
    // ⛔ S1.11.6.2 [pass-4 A-F4] — the route's fifth origin. `audit-route.ts` built its four buckets out of
    // predicates on CHANGED, so a two-producer disagreement was half-routed by construction: the fix moves
    // one producer and the other is invisible. This pins the import resolver and the two hops against the
    // real pair, because a resolver that stops resolving does not red — it returns a smaller route.
    'lint:import-graph',
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
  console.log(`\n\u001b[1m── ${gate.name} ${'─'.repeat(Math.max(0, 70 - gate.name.length))}\u001b[0m`);
  // `shell: true` on Windows — `npm` is `npm.cmd`, and spawnSync without a shell cannot resolve it.
  const res = spawnSync(gate.cmd, gate.args, { stdio: 'inherit', shell: true });
  // ⚠️ A signal death has a null status and is NOT a pass. `status !== 0` would read `null !== 0` as true,
  // which happens to be right — but it is right by accident, so it is written out.
  const ok = res.status === 0;
  if (!ok) failed.push(gate.name);
}

console.log(`\n\u001b[1m${'═'.repeat(72)}\u001b[0m`);
if (failed.length === 0) {
  console.log(`\u001b[32m✅ lint:rn — all ${GATES.length} gates pass.\u001b[0m`);
  process.exit(0);
}

console.error(`\u001b[31m❌ lint:rn — ${failed.length} of ${GATES.length} gates FAILED:\u001b[0m\n`);
for (const name of failed) console.error(`  ❌ ${name}`);
console.error(
  `\n  Every gate ran; the output for each is above, in order. Re-run one on its own with\n` +
    `  \`npm run <name>\`. ⛔ ${GATES.length - failed.length} passing does not mean the tree is clean —\n` +
    `  it means these ${failed.length} are what is left.\n`,
);
process.exit(1);
