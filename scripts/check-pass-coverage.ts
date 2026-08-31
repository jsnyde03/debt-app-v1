/**
 * ⛔ **S1.13.1 + S1.13.2 — A PASS'S COVERAGE IS A CHECKABLE EXIT, NOT LANE PROSE.**
 *
 * ⚡ Every surface pass so far has ended with lanes *reporting* what they read. 🎯 2026-08-30, answering
 * `S1.12.6`: *"Coverage is what I want. Not unneeded files."* Pass 5 routed **393 files** and the lanes
 * read **126** of them — and nothing in the tree could say so, because *"I swept the surface"* is exactly
 * the unfalsifiable claim this round has spent itself killing. This makes it falsifiable: name the pass,
 * and every money-bearing file it did not read is printed.
 *
 * ## ⛔ IT DOES NOT PRUNE, AND THAT WAS THE FIRST PLAN
 *
 * The plan said *drop the 71 files that carry no money claim from the route*. ⚠️ **The switch-in scan
 * killed it against the code**: S1's roots are **whole directories** (`apps/rn/src`, `packages/core`,
 * `apps/rn/tests`) and `excluded` fails safe — *"an exclusion list's whole virtue is that a file nobody
 * thought about is still counted."* Those roots have been widened **five separate times**, each one
 * undoing a hand-narrowed set, and `surface-coverage.ts` records the last as *"adding
 * `packages/core/timeline` would have been the fifth hand-named directory, which is M9's defect
 * verbatim."* ⛔ **Removing 71 files would have re-committed it in a new place.**
 *
 * So nothing leaves the surface. Files are CLASSIFIED, and only the money-bearing ones are owed a read.
 *
 * ## ⚠️ The predicate is over CONTENT, and it fails toward INCLUSION
 *
 * `carriesMoneyClaim` reads the file and asks whether the money vocabulary appears in it. It is not a
 * path list and not a directory list — both are the shape that has undercounted this class every time it
 * has been measured *(19 → 67 → 93 for `A5-4`; five files → six for the conflict markers; five root
 * widenings here)*. **A file with one money word is money-bearing.** The cost of a false positive is a
 * lane reading a `Button.tsx`; the cost of a false negative is a money defect nobody was pointed at.
 *
 * ## ⛔ DELIBERATELY NOT IN `lint:rn`
 *
 * This reds for the whole duration of a pass, by design — that is what an exit line IS. Wiring it into
 * every push would make it permanently red mid-pass, and `web-e2e.yml`'s header records that exact
 * failure killing the previous lane: *"a permanently-red gate is worse than no gate — it trains you to
 * ignore the one signal that is supposed to mean something."* Same reasoning [D74] applies to
 * `lint:gate-freshness` (GAP-14). It is run AT the exit:
 *
 *     npm run audit:coverage -- --surface=s1 --pass=s1p6
 *     npm run audit:coverage -- --surface=s1            (classification report only, always exit 0)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');

const CLAIMS: Record<string, string> = {
  s0: 'scripts/surface-coverage.s0.json',
  s1: 'scripts/surface-coverage.s1.json',
};

/**
 * The money vocabulary. ⚠️ Deliberately broad: a term earns its place by being unable to appear in a file
 * that could NOT hold a money defect. `price`/`cost` are here because the paywall is money; `apr` and
 * `interest` because the projection is; `cycle`/`payday` because a cadence error IS a money error, which
 * is what CLASS V cost three files to learn.
 */
const MONEY_WORDS = [
  'balance', 'amount', 'paycheck', 'payday', 'payment', 'debt', 'reserve', 'goal', 'apr', 'interest',
  'cash', 'money', 'currency', 'dollar', 'surplus', 'shortfall', 'allocat', 'budget', 'expense', 'income',
  'payoff', 'snowball', 'avalanche', 'premium', 'price', 'cost', 'bnpl', 'minimum', 'cushion', 'buffer',
  'cycle', 'forecast', 'projection', 'milestone', 'subscription', 'refund', 'billing',
  // ⚠️ Added after LOOKING at what the first cut classified as non-money, rather than trusting its count.
  // `packages/core/guardian/testComputeState.ts` had been excluded, and the Guardian state is derived from
  // cash against a floor — a misclassification would have pointed no lane at a money state machine.
  // ⛔ The lesson is the count is not the check: 43 looked plausible and one of the 43 was wrong.
  'floor', 'guardian', 'owe', 'spend', 'afford',
];
const MONEY_RE = new RegExp(`(${MONEY_WORDS.join('|')})`, 'i');

function carriesMoneyClaim(rel: string): boolean {
  // ⚠️ The PATH counts too, not only the contents: a file named `moneyFormatters.test.ts` whose body is
  // all fixtures still belongs to the money surface, and a reader looking only at contents would miss it.
  if (MONEY_RE.test(rel)) return true;
  try {
    return MONEY_RE.test(readFileSync(join(REPO_ROOT, rel), 'utf8'));
  } catch {
    // ⛔ Unreadable → money-bearing. Failing toward inclusion is the whole posture of this file: an
    // unreadable file is an UNKNOWN, and silently classifying unknowns as "no money here" is how a
    // population goes quietly empty.
    return true;
  }
}

const args = process.argv.slice(2);
const arg = (k: string): string | undefined => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const surface = arg('surface') ?? 's1';
const pass = arg('pass');

const claimsPath = CLAIMS[surface];
if (!claimsPath) {
  console.error(`\n❌ pass-coverage: no claims file known for surface '${surface}'. Known: ${Object.keys(CLAIMS).join(', ')}.\n`);
  process.exit(1);
}

const claims: Record<string, string[]> = JSON.parse(readFileSync(join(REPO_ROOT, claimsPath), 'utf8'));
const files = Object.keys(claims);

if (files.length === 0) {
  console.error(`\n❌ pass-coverage: ${claimsPath} lists no files — the population is empty, so any coverage number it produced would be meaningless.\n`);
  process.exit(1);
}

// ⚠️ Every claimed file must still exist. A claims file that has drifted off the tree reports coverage
// over files nobody can read, which is a pass that cannot fail by a different route.
const tracked = new Set(
  execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean),
);
const ghosts = files.filter((f) => !tracked.has(f));
if (ghosts.length > 0) {
  console.error(
    `\n❌ pass-coverage: ${ghosts.length} claimed file(s) are not tracked — coverage over a file that does not exist is not coverage.\n\n` +
      ghosts.map((g) => `  ${g}`).join('\n') +
      '\n',
  );
  process.exit(1);
}

const money = files.filter(carriesMoneyClaim);
const other = files.filter((f) => !money.includes(f));

/**
 * ⛔ **THE FLOOR, AND IT CLOSES A FAIL-OPEN IN THIS FILE THAT WRITING ITS GUARD FOUND.**
 *
 * If `carriesMoneyClaim` ever goes blind — a broken regex, an unreadable root, a refactor that drops the
 * content read — then `money` is empty, `unread` is empty, and **the exit reports every pass fully
 * covered.** ⚡ A coverage check that passes because it found nothing to cover is this round's defining
 * shape, and it was in the instrument built to end it. Measured 446 of 484 on 2026-08-31; floored at 95%
 * per `gate-scan-floors.json`'s stated margin.
 */
const MIN_MONEY_BEARING = 424;
if (money.length < MIN_MONEY_BEARING) {
  console.error(
    `\n❌ pass-coverage: only ${money.length} of ${files.length} file(s) read as money-bearing, and the floor is ${MIN_MONEY_BEARING}.\n` +
      '  The predicate has gone blind, so "0 unread" would mean "nothing was looked at" — not "covered".\n',
  );
  process.exit(1);
}

if (!pass) {
  console.log(
    `✅ pass-coverage [${surface}]: ${files.length} routed · ${money.length} money-bearing · ${other.length} carry no money vocabulary.\n` +
      `   ⚠️ Classification only — no --pass given, so nothing was checked. The non-money set stays ON the surface;\n` +
      `      it is not owed a READ, and it is not pruned.` +
      (other.length > 0 ? `\n${other.map((f) => `     no-money-claim: ${f}`).join('\n')}` : ''),
  );
  process.exit(0);
}

const unread = money.filter((f) => !(claims[f] ?? []).includes(pass));

if (unread.length > 0) {
  console.error(
    `\n❌ pass-coverage [${surface} · ${pass}]: ${unread.length} of ${money.length} money-bearing file(s) were never read by this pass.\n\n` +
      unread.map((f) => `  unread: ${f}`).join('\n') +
      `\n\n  ⛔ This is the exit line, not a gate — a lane reporting "I swept the surface" is the claim this\n` +
      `  check exists to make falsifiable. Pass 5 routed 393 files and read 126.\n`,
  );
  process.exit(1);
}

console.log(
  `✅ pass-coverage [${surface} · ${pass}]: all ${money.length} money-bearing file(s) read; ` +
    `${other.length} classified as carrying no money vocabulary (on the surface, not pruned).`,
);
