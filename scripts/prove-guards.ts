/**
 * [S1.11.3.1] — **A GUARD IS PROVEN BY MAKING IT RED, NEVER BY FINDING ITS TOKEN.**
 *
 * ⛔ **WHY THIS EXISTS, IN ONE MEASUREMENT.** Pass 4 ran `lint:finding-guards` beside **every un-fix
 * auditor D performed** and it exited **0 every time**. It is a *deletion detector* — it proves a token
 * string is still present on a line of code — and it had been read for three passes as a *closure proof*.
 * Eight registered guards were then proven to survive their own un-fix, and **35 more had never been
 * tested by anyone.** ⚠️ **Until a guard is proven to red, `CLOSED` and `OPEN` are indistinguishable in
 * the record**, which invalidates counts rather than adding to them.
 *
 * ⚡ **The claim this harness makes, and the one it refuses to make.** It says: *restore this finding's
 * defect and THIS command reds, naming this reason.* It does not say the guard is well chosen, that the
 * class is fully enumerated, or that a different spelling of the same defect is caught — a plant is
 * evidence about one path through a test. ⛔ **A `find` string is the spelling the proof was written
 * against**; a sibling spelling that slips past is a PARTIAL, and the entry's own text is where that has
 * to be said out loud.
 *
 * ⚠️ **THE CONTROL RUNS AFTER THE RESTORE, DELIBERATELY.** A plant loop's last action is normally the
 * restore, so nothing runs after it and the tree it leaves behind is unverified — the failure that threw
 * a whole fix away at `S1.10.6.6`. Here the order is **plant → run → restore → assert the bytes → run the
 * control**, so one run carries both claims: *the command is not red unconditionally* ([D63]) and *the
 * restore actually restored*.
 *
 * ⛔ **THE VERDICT IS NOT COMPUTED HERE.** It comes from `lib/verdict.ts`, the same function
 * `test:gate-plants` uses, because `D4-6` is precisely what a second implementation of it produces. And a
 * **harness fault** — a missing target, a dirty tree, an anchor matching zero or many times — is never a
 * verdict: it exits before any command runs and names which of the two it is
 * (`run-the-control-on-the-verifier`).
 *
 * Usage:
 *   npm run prove:guards -- --id=S1P3-B6[,S1P3-M7]
 *   npm run prove:guards -- --all             # every entry carrying a proof block
 *   npm run prove:guards -- --list            # proven · guard-only · never tested
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Failure, verdict } from './lib/verdict';

const REPO_ROOT = join(import.meta.dirname, '..');
/**
 * ⛔ **THE REGISTRY IS AN INPUT, so this harness can itself be PLANTED** — `check-finding-guards.ts`'s
 * own `--registry=` idiom, and for the same reason: a harness nothing can plant is a harness whose green
 * means only that it ran. A flag rather than an env var, so it is visible in the command line a human or
 * a CI log shows. The npm script passes nothing, so a real run always reads the real registry.
 */
const REGISTRY = join(
  REPO_ROOT,
  process.argv.find((a) => a.startsWith('--registry='))?.split('=')[1] ?? 'scripts/finding-guards.json',
);

/** One textual restoration of the original defect. `find` must match EXACTLY once — see `planEdit`. */
export interface Unfix {
  at: string;
  find: string;
  replace: string;
}

export interface Proof {
  /** the un-fix: what has to change for the finding to be live again */
  unfix: Unfix[];
  /** npm script that must RED under the un-fix — the command a human would run */
  run?: string;
  /** or a raw argv, for a check that is not an npm script */
  cmd?: string[];
  /** the planted run's output must contain this, so the red is attributable to THIS defect */
  expect: string;
  /** ISO date the proof last passed, and the sha it passed on — written by `--record` */
  measured?: string;
  sha?: string;
}

interface Entry {
  what: string;
  file?: string;
  token?: string;
  unguarded?: string;
  proof?: Proof;
  /** a MEASUREMENT, not an excuse: what was un-fixed, what stayed green, and what would have to change */
  guardOnly?: string;
}

// ⚠️ A missing registry is a harness fault too, and an ENOENT stack trace reads like a broken tool
// rather than a mistyped flag.
if (!existsSync(REGISTRY)) {
  console.error(`\n❌ prove:guards — no registry at ${REGISTRY}\n`);
  process.exit(1);
}
const registry = JSON.parse(readFileSync(REGISTRY, 'utf8')) as Record<string, Entry>;

const arg = (name: string): string | undefined =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const has = (name: string): boolean => process.argv.includes(`--${name}`);

/**
 * ⛔ **THE ANCHOR IS COUNTED, NOT SEARCHED.** `String.replace` takes the FIRST match and says nothing
 * about the others, so an anchor appearing twice silently un-fixes one of two sites and the plant then
 * measures a half-defect. ⚠️ Zero matches is the more dangerous direction: it reads as
 * `plant-not-applied`, which looks like a broken plant rather than what it is — **a proof whose anchor
 * the code has moved out from under**, i.e. a recorded measurement that no longer describes this tree.
 */
export function planEdit(text: string, u: Unfix): { next: string; count: number } {
  const count = text.split(u.find).length - 1;
  return { next: count === 1 ? text.split(u.find).join(u.replace) : text, count };
}

/**
 * ⛔ **MODULE SCOPE — the import fires it**, the `S1P3-SELFCHECK-CALL` idiom. Every plant in this file
 * goes through `planEdit`, so a `planEdit` that has stopped counting is a run whose every verdict is
 * about an edit that may never have happened.
 */
{
  const die = (name: string, detail: string): never => {
    console.error(`\n❌ prove:guards — its OWN planEdit() is broken: ${name}\n   ${detail}\n`);
    process.exit(1);
  };
  const one = planEdit('a B c', { at: '', find: 'B', replace: 'X' });
  if (one.count !== 1 || one.next !== 'a X c') die('a single match is replaced', JSON.stringify(one));
  // ⚠️ An ambiguous anchor must leave the text ALONE. Replacing one of two would plant a defect the
  // registry does not describe, and the verdict would then be about that instead.
  const two = planEdit('a B c B d', { at: '', find: 'B', replace: 'X' });
  if (two.count !== 2 || two.next !== 'a B c B d') die('an ambiguous anchor edits nothing', JSON.stringify(two));
  const none = planEdit('a c', { at: '', find: 'B', replace: 'X' });
  if (none.count !== 0 || none.next !== 'a c') die('a missing anchor edits nothing', JSON.stringify(none));
  // ⛔ A no-op un-fix would score `plant-not-applied` — a REGISTRY error wearing a harness fault's face.
  const noop = planEdit('a B c', { at: '', find: 'B', replace: 'B' });
  if (noop.next !== 'a B c') die('a no-op replacement is detectable', JSON.stringify(noop));
}

const fault = (id: string, detail: string): never => {
  console.error(`\n❌ prove:guards — HARNESS FAULT on ${id}, so there is no verdict here:\n   ${detail}\n`);
  process.exit(1);
};

const gitStatus = (rel: string): string =>
  execFileSync('git', ['status', '--porcelain', '--', rel], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();

/** Never throws: a non-zero exit is the signal, and the output is what says WHY. */
function run(p: Proof): { status: number; out: string } {
  const argv = p.cmd ?? ['npm', 'run', p.run as string];
  const res = spawnSync(argv[0], argv.slice(1), { cwd: REPO_ROOT, encoding: 'utf8', shell: true });
  return { status: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
}

const ids = Object.keys(registry);
const withProof = ids.filter((id) => registry[id].proof);
const guardOnly = ids.filter((id) => registry[id].guardOnly && !registry[id].proof);
const untested = ids.filter((id) => !registry[id].proof && !registry[id].guardOnly);

if (has('list')) {
  console.log(`\n  prove:guards — ${ids.length} registry entries\n`);
  console.log(`  proven by plant : ${withProof.length}`);
  for (const id of withProof) {
    const p = registry[id].proof as Proof;
    const when = p.measured ? `${p.measured} @ ${p.sha ?? '?'}` : 'never run';
    console.log(`     ${id.padEnd(28)} ${(p.run ?? p.cmd?.join(' ')) as string}  (${when})`);
  }
  console.log(`\n  guard-only      : ${guardOnly.length}  — measured NOT to hold; the entry says what would`);
  for (const id of guardOnly) console.log(`     ${id}`);
  console.log(`\n  never tested    : ${untested.length}  — nobody has ever made these red`);
  for (const id of untested) console.log(`     ${id}`);
  console.log('');
  process.exit(0);
}

/**
 * One entry, measured. ⛔ **The order is plant → run → restore → assert the bytes → run the CONTROL**,
 * so the control is simultaneously [D63]'s *"this command is not red unconditionally"* and the restore
 * verification a plant loop structurally omits.
 */
function proveOne(id: string, e: Entry): { ok: boolean; line: string; failed: Failure[]; plantedStatus: number; plantedOut: string } {
  const p = e.proof as Proof;
  if (!p.run && !p.cmd) fault(id, 'the proof names neither an npm script (`run`) nor an argv (`cmd`)');

  // ⚠️ PRE-FLIGHT. Every target must exist and be CLEAN — a dirty target makes the restore ambiguous,
  // and a stale plant left behind by a killed run would score as a real defect.
  for (const u of p.unfix) {
    if (!existsSync(join(REPO_ROOT, u.at))) fault(id, `${u.at} does not exist; the un-fix has nothing to edit`);
    const dirty = gitStatus(u.at);
    if (dirty) fault(id, `${u.at} is already modified (${dirty}); commit or revert it first`);
  }

  /**
   * ⛔ **EDITS ACCUMULATE PER FILE, and the first cut did not — found by planting, exactly like every
   * other defect in these instruments.** `S1P3-M7`'s proof moves one statement below another: two edits,
   * one file. Each was computed from the file's ORIGINAL text and written in turn, so the second write
   * simply erased the first, the awaited call stayed where it was, and the gate — correctly — reported
   * green. ⚠️ **The verdict that produced was `failed-open`**: a real guard, reported dead, by a harness
   * bug that reads as a finding. That is the safe-looking direction, and it is why the self-test below
   * carries a same-file case.
   *
   * ⚠️ Each anchor must still match the PRISTINE file exactly once — `lint:finding-guards`'s VOID check
   * reads the file on disk, so a proof whose second edit is only anchorable after the first would be
   * unverifiable statically. Counting here against the accumulated text keeps the two consistent and
   * turns an edit that destroys another's anchor into a loud 0×.
   */
  const originals = new Map<string, string>();
  for (const u of p.unfix) {
    if (!originals.has(u.at)) originals.set(u.at, readFileSync(join(REPO_ROOT, u.at), 'utf8'));
  }
  const restore = (): void => {
    for (const [rel, text] of originals) writeFileSync(join(REPO_ROOT, rel), text, 'utf8');
  };

  let planted = true;
  let withPlant: { status: number; out: string };
  try {
    const working = new Map(originals);
    for (const u of p.unfix) {
      const { next, count } = planEdit(working.get(u.at) as string, u);
      if (count !== 1) {
        // ⚠️ Named rather than guessed at: this tree is checked out with CRLF, so a multi-line anchor
        // written with bare `\n` matches nothing and reads as "the code moved" when nothing moved.
        const crlf =
          count === 0 && u.find.includes('\n') && (originals.get(u.at) as string).includes('\r\n')
            ? '   ⚠️ this anchor spans lines and the file is CRLF — the newlines in `find` must be `\\r\\n`.\n'
            : '';
        fault(
          id,
          `the anchor matches ${count}× in ${u.at}: ${JSON.stringify(u.find)}\n` +
            crlf +
            `   ⛔ this proof is VOID, not failing — ${
              count === 0
                ? 'the code moved out from under a recorded measurement'
                : 'one anchor, two sites: the un-fix would restore half the defect and the verdict would be about that'
            }.\n` +
            '   Re-derive the un-fix against the current file, then re-run.',
        );
      }
      if (next === working.get(u.at)) fault(id, `the un-fix for ${u.at} changes nothing — its replace equals its find`);
      working.set(u.at, next);
    }
    for (const [rel, text] of working) writeFileSync(join(REPO_ROOT, rel), text, 'utf8');
    for (const [rel, text] of originals) {
      if (readFileSync(join(REPO_ROOT, rel), 'utf8') === text) planted = false;
    }
    withPlant = run(p);
  } finally {
    restore();
  }

  // ⛔ THE RESTORE IS ASSERTED ON THE BYTES, and then again by git — an in-memory compare cannot see a
  // command that wrote to the file itself.
  for (const [rel, text] of originals) {
    if (readFileSync(join(REPO_ROOT, rel), 'utf8') !== text) {
      fault(id, `${rel} was NOT restored. The original is not on disk — recover it before doing anything else.`);
    }
    const dirty = gitStatus(rel);
    if (dirty) fault(id, `${rel} is dirty after the restore: ${dirty}`);
  }

  const withoutPlant = run(p);
  return { ...verdict(id, p.expect, planted, withPlant, withoutPlant), plantedStatus: withPlant.status, plantedOut: withPlant.out };
}

/**
 * ⛔ **THE HARNESS'S OWN 2×2, AND IT IS HERMETIC ON PURPOSE.** A control built on a real defect inverts
 * silently the day that defect is fixed. These two entries share one throwaway target and one stand-in
 * guard, so what they measure is *this harness* — that a guard which holds reads ✅, and that a plant
 * which lands while changing nothing the check reads is called **`failed-open`** rather than passed.
 *
 * ⚡ **Both halves are needed and the second is the load-bearing one** (`plant-both-directions`): a
 * harness that reported everything sound would pass the LIVE row on its own. ⚠️ The DEAD row's `expect`
 * is a string the GREEN output contains, so `wrong-reason` cannot fire and hide which failure was
 * actually measured.
 */
function selfTest(): never {
  const at = 'scripts/__fixtures__/prove-guards-target.ts';
  const probe = ['node', 'scripts/__fixtures__/prove-guards-probe.mjs'];
  const cases: { id: string; e: Entry; want: Failure[] }[] = [
    {
      id: 'selftest:a guard that holds',
      e: {
        what: 'the probe reds when the marker it reads is gone',
        proof: {
          unfix: [{ at, find: "MARKER = 'the guard holds'", replace: "MARKER = 'the guard is gone'" }],
          cmd: probe,
          expect: 'PROBE: the guard is gone',
        },
      },
      want: [],
    },
    {
      id: 'selftest:a guard that does not',
      e: {
        what: 'the plant lands on a line the probe never reads, so the probe stays green',
        proof: {
          unfix: [{ at, find: 'this line is not what the probe reads', replace: 'this line is still not what the probe reads' }],
          cmd: probe,
          expect: 'PROBE: ok',
        },
      },
      want: ['failed-open'],
    },
    /**
     * ⛔ **TWO EDITS, ONE FILE — the case that shipped broken.** Each un-fix used to be computed from the
     * file's original text, so the second write erased the first and the plant was half-applied. ⚠️ It
     * failed in the safe-looking direction: `S1P3-M7`'s real, working guard came back **`failed-open`**.
     * Under that bug this row's second edit restores the marker and the probe goes green.
     */
    {
      id: 'selftest:two edits, one file',
      e: {
        what: 'edits accumulate; the second does not overwrite the first',
        proof: {
          unfix: [
            { at, find: "MARKER = 'the guard holds'", replace: "MARKER = 'the guard is gone'" },
            { at, find: 'this line is not what the probe reads', replace: 'nor is this one' },
          ],
          cmd: probe,
          expect: 'PROBE: the guard is gone',
        },
      },
      want: [],
    },
  ];

  let broken = 0;
  for (const c of cases) {
    const got = proveOne(c.id, c.e);
    const ok = got.failed.join(',') === c.want.join(',');
    console.log(`  ${ok ? '✅' : '❌'} ${c.id.padEnd(34)} expected [${c.want.join(', ')}] · got [${got.failed.join(', ')}]`);
    if (!ok) broken++;
  }
  if (broken) {
    console.error(
      `\n❌ prove:guards --selftest — ${broken} of ${cases.length} controls wrong. ⛔ No proof this harness\n` +
        '   has ever recorded means anything: it can no longer tell a guard that holds from one that does not.\n',
    );
    process.exit(1);
  }
  console.log('\n✅ prove:guards --selftest — a guard that holds reads ✅, and one that does not reads failed-open.\n');
  process.exit(0);
}

if (has('selftest')) selfTest();

const selected = has('all')
  ? withProof
  : (arg('id') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

if (!selected.length) {
  console.error('\n❌ prove:guards — nothing selected. Pass --id=<ID[,ID]>, --all, --list or --selftest.\n');
  process.exit(1);
}

for (const id of selected) {
  if (!registry[id]) fault(id, 'no such entry in the registry');
  if (!registry[id].proof) {
    fault(id, `carries no proof block${registry[id].guardOnly ? ' — it is marked guardOnly' : ''}`);
  }
}

let failures = 0;

for (const id of selected) {
  const p = registry[id].proof as Proof;
  const v = proveOne(id, registry[id]);
  console.log(v.line);
  if (!v.ok) {
    failures++;
    console.log(`       ⛔ ${registry[id].what.slice(0, 150)}`);
    if (v.failed.includes('failed-open')) {
      const cmd = (p.run ?? p.cmd?.join(' ')) as string;
      console.log(`       ⛔ the defect was restored and ${cmd} stayed GREEN — this guard does not hold.`);
    }
    // ⚠️ `wrong-reason` also fires on a GREEN planted run — the output of a check that never redded
    // contains nothing to match — so this line is printed only when there WAS a red to attribute.
    // Saying "it redded, but not for X" over an exit 0 is the harness contradicting the line beside it,
    // which is `D4-6` in miniature.
    if (v.failed.includes('wrong-reason') && v.plantedStatus !== 0) {
      console.log(`       ⛔ it redded, but not for ${JSON.stringify(p.expect)} — the red is not attributable to this defect.`);
      // ⚠️ The red it DID produce is printed, because the usual cause is an earlier assertion firing
      // first and hiding the one being measured — and a verdict with no output to read sends you
      // hand-reproducing the plant to find that out (`plant-that-reds-early-hides-assertions`).
      const tail = v.plantedOut.split('\n').map((l) => l.trimEnd()).filter(Boolean).slice(-6);
      for (const l of tail) console.log(`         │ ${l.slice(0, 160)}`);
    }
    if (v.failed.includes('control-red')) {
      console.log('       ⛔ the control redded too, so this run measured nothing: the command is red with or without the plant.');
    }
  } else if (has('record')) {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const raw = JSON.parse(readFileSync(REGISTRY, 'utf8')) as Record<string, Entry>;
    const rp = raw[id].proof as Proof;
    rp.measured = new Date().toISOString().slice(0, 10);
    rp.sha = sha;
    writeFileSync(REGISTRY, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  }
}

if (failures) {
  console.error(`\n❌ prove:guards — ${failures} of ${selected.length} guard(s) did not hold.\n`);
  process.exit(1);
}
console.log(`\n✅ prove:guards — ${selected.length} guard(s) red on their own defect, and the control is green.\n`);
