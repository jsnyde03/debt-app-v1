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
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Failure, verdict } from './lib/verdict';
import { armPlant, notePlant, preflightRestore } from './lib/plantSafety';
import { bucketGuards } from './lib/guardBuckets';

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
 * ⛔ **S1.11.6.0 — `planEdit` MOVED TO `lib/anchor.ts`, AND THE MOVE IS THE FIX.**
 *
 * ⚡ `lint:finding-guards` was red in CI for six consecutive pushes while reading green locally: a
 * recorded anchor carrying a Windows line break matches a CRLF working tree and **0×** in CI's LF
 * checkout, and the
 * gate reports *"the proof is VOID"* about a proof that is fine. ⛔ Every comparison happens in LF now,
 * on both sides — and the logic lives in a module with **no side effects on import**, so
 * `test-line-endings.ts` can assert it directly. This file reads the registry and parses argv at module
 * scope; importing it to test the matcher would run a CLI.
 *
 * ⚠️ ONE copy, shared with `check-finding-guards.ts`. Two normalisers that drift is how the checker and
 * the planter would begin disagreeing about what a proof means.
 */
export { planEdit } from './lib/anchor';
import { planEdit } from './lib/anchor';


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

/** Every path git reports as changed — the baseline a run is measured against, not a verdict. */
const dirtyPaths = (): string[] =>
  execFileSync('git', ['status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter(Boolean);

const gitStatus = (rel: string): string =>
  execFileSync('git', ['status', '--porcelain', '--', rel], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();

/** Never throws: a non-zero exit is the signal, and the output is what says WHY. */
function run(p: Proof): { status: number; out: string } {
  const argv = p.cmd ?? ['npm', 'run', p.run as string];
  const res = spawnSync(argv[0], argv.slice(1), {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    shell: true,
  });
  return { status: res.status ?? 1, out: `${res.stdout ?? ''}${res.stderr ?? ''}` };
}

/**
 * ⛔ **S1.13.7.12.3a — A RUN WHOSE WEB SERVER NEVER CAME UP HAS NO VERDICT IN IT, AND THIS FILE WAS
 * ISSUING ONE.**
 *
 * ⚡ **Measured, and it is why `.12.3a` was written against the wrong cause.** The plan recorded a guard
 * reading `reason=WRONG` batched and `MATCHED` solo, and asked for the batch case to be proven equivalent
 * to N single runs. Reproduced with the real ids: `S1P3-C1-ROWFIGURES` read **`WRONG` SOLO and `MATCHED`
 * BATCHED** — the stated direction inverted — while three identical hermetic entries gave identical
 * verdicts both ways. ⛔ **Batching is not the variable.** In every anomaly the planted run's output
 * carried `Process from config.webServer was not able to start`.
 *
 * ⚡ **What that produces is the dangerous shape:** planted red + control green + the expected string
 * absent = **`reason=WRONG`**, which reads as *"your guard redded, but not for your defect"* — a finding
 * against the guard. Nothing redded. The server never started, so no assertion ever ran.
 *
 * ⛔ **AND THE VERDICT IS RECORDED.** In the batch that read `MATCHED`, a `measured`/`sha` stamp was
 * persisted for a guard that had just read `WRONG` — so the ledger's evidence turns on whether a server
 * happened to come up.
 *
 * ⚠️ **The cause is NOT in this repo, and four hypotheses were measured and refuted before saying so:**
 * `expo export --clear` (3/3 clean standalone) · the port not being released (`:4319` free at **t=+1s**,
 * two back-to-back runs both passed) · `spawnSync`'s 1 MB `maxBuffer` (real output **618 bytes**) · `tsx`
 * injecting loader env (`NODE_OPTIONS` unset under both). Reproduced at **1 in 3** through `run()`'s exact
 * shape, with the spawned server dying on **two different Windows abnormal-termination codes**
 * (`0xC0000409` STATUS_STACK_BUFFER_OVERRUN, `0x80000003` STATUS_BREAKPOINT) — it is being killed, not
 * exiting. This machine carries `NODE_EXTRA_CA_CERTS` pointing at Norton.
 *
 * ⛔ **So this does not try to prevent it. It refuses to MISREPORT it** — the same move the netstat
 * pre-flight above makes, extended from *before the planted run* to *after every run*.
 *
 * ⚠️ **ONE ANCHOR, NOT A SPELLING LIST.** Playwright's two failures here — `Process from config.webServer
 * was not able to start` and `Timed out waiting …ms from config.webServer` — share the config KEY, which
 * cannot drift without the config drifting with it. An enumeration of messages is the move that has
 * failed eight times in this repo.
 */
const webServerNeverStarted = (r: { status: number; out: string }): boolean =>
  r.status !== 0 && /config\.webServer/.test(r.out);

/**
 * ⛔ **[D78] — THE ONE RETRY [D74]'s NEVER-RETRY RULE DOES NOT COVER, AND WHY THE LINE IS HERE.**
 *
 * [D74]: *"an OOM is a FINDING and never a retry"* — because an OOM is a **true signal about the
 * workload**, and retrying it discards the signal. ⚡ **This is provably the opposite case:** the server
 * was killed *before any assertion ran*, so there is no measurement to discard. Retrying does not re-roll
 * a result I did not like; it re-attempts a setup that never happened. ⛔ **The rule is NARROWED, not
 * broken** — every other failure, including a red one, is still a finding and is never retried. The
 * predicate is exactly `webServerNeverStarted`, which requires a non-zero exit AND Playwright's own
 * `config.webServer` marker.
 *
 * ⚠️ **THE CAP IS SIX BECAUSE OF ARITHMETIC, NOT COMFORT**, and the arithmetic is written down so the
 * next person can re-derive it instead of trusting it. At the measured p ≈ ⅓ per invocation, with 2
 * invocations per proof and **17** playwright-backed proofs in the registry, the chance that a full
 * `--all` hits an unrecoverable kill is `1 − (1 − 2p^k)^17`:
 *
 *     k=1 (no retry) → ~100%     k=3 → ~78%     k=5 → ~16%     k=6 → ~6%
 *
 * ⚡ **The tail is what is expensive; the expectation is cheap.** Expected attempts per run is
 * `1/(1−p)` ≈ **1.5**, so a cap of six costs ~50% more wall-clock on average and only rarely more —
 * a low cap buys nothing back and leaves `--all` unable to finish, which is the state this repairs.
 *
 * ⛔ **EVERY RETRY IS PRINTED.** A retry that smooths the rate out of view would turn a measured
 * environmental fault into folklore — and the rate is the thing that says whether this is still the
 * intermittent kill or something new. Six consecutive kills is no longer plausibly intermittent
 * (`p^6` ≈ 0.14%) and the fault says so.
 */
const MAX_SERVER_ATTEMPTS = 6;

/**
 * Runs until the web server actually comes up, or the cap is reached. ⚠️ **It never faults** — the
 * planted run happens with the plant ON DISK, and `fault()` exits the process, which would strand the
 * plant and leave the next run's pre-flight refusing a dirty target. The caller faults after the restore.
 */
function runUntilServed(id: string, phase: 'planted' | 'control', p: Proof): { status: number; out: string; attempts: number } {
  let r = run(p);
  let attempts = 1;
  while (webServerNeverStarted(r) && attempts < MAX_SERVER_ATTEMPTS) {
    attempts++;
    console.log(
      `       ⚠️ ${id}: the ${phase} run's web server was killed before any assertion ran — ` +
        `re-attempting (${attempts}/${MAX_SERVER_ATTEMPTS}).`,
    );
    r = run(p);
  }
  return { ...r, attempts };
}

const faultOnDeadServer = (
  id: string,
  phase: 'planted' | 'control',
  r: { status: number; out: string; attempts: number },
): void => {
  if (!webServerNeverStarted(r)) return;
  const line = r.out.split('\n').find((l) => /config\.webServer/.test(l))?.trim() ?? '(message not found)';
  fault(
    id,
    `the ${phase} run never got its web server up in ${r.attempts} attempt(s), so no assertion ever ran:\n` +
      `   ${line.slice(0, 200)}\n` +
      '   ⛔ This is NOT a verdict about the guard. Left to score, it reads as `reason=WRONG` —\n' +
      '   "it redded, but not for your defect" — about a run in which nothing redded at all.\n' +
      '   ⚠️ Measured intermittent at ~1 in 3 on this machine, and NOT caused by anything here:\n' +
      '   the export, the port, `maxBuffer` and the tsx env were each measured and refuted. The\n' +
      `   server is killed with a Windows abnormal-termination code.\n` +
      `   ⛔ ${r.attempts} CONSECUTIVE kills is no longer plausibly that (p^${r.attempts} ≈ 0.1%) —\n` +
      '   check the environment before re-running: an occupied port, a broken config, or an AV\n' +
      '   rule that has started killing every spawn rather than the occasional one.',
  );
};

const ids = Object.keys(registry);
// ⛔ D5-2 — the buckets come from ONE producer. This file used to compute its own, and it had never been
// taught the third state (`unguarded`), so it printed 120 where the gate printed 119. See `guardBuckets`.
const { withProof, guardOnly, untested, unguarded } = bucketGuards(registry);

if (has('list')) {
  console.log(`\n  prove:guards — ${ids.length} registry entries\n`);
  // ⛔ **`authored` is not `executed`, and conflating them is D5-1.** A proof block is a plan to measure;
  // `measured`/`sha` are the only evidence it ever ran. The two are counted apart because the whole point
  // of this ledger is the distinction — `CLOSED` and `OPEN` are indistinguishable until a proof has RUN.
  const executed = withProof.filter((id) => (registry[id].proof as Proof).measured);
  console.log(`  proofs          : ${withProof.length}  — ${executed.length} EXECUTED · ${withProof.length - executed.length} authored, never run`);
  for (const id of withProof) {
    const p = registry[id].proof as Proof;
    const when = p.measured ? `${p.measured} @ ${p.sha ?? '?'}` : '⛔ never run';
    console.log(`     ${id.padEnd(28)} ${(p.run ?? p.cmd?.join(' ')) as string}  (${when})`);
  }
  console.log(`\n  guard-only      : ${guardOnly.length}  — measured NOT to hold; the entry says what would`);
  for (const id of guardOnly) console.log(`     ${id}`);
  console.log(`\n  never tested    : ${untested.length}  — nobody has ever made these red`);
  for (const id of untested) console.log(`     ${id}`);
  console.log(`\n  unguarded       : ${unguarded.length}  — a written reason for having no guard; NOT part of the untested backlog`);
  for (const id of unguarded) console.log(`     ${id}`);
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

  /**
   * ⛔ `U15` — RECOVER BEFORE THE CLEANLINESS CHECK, not after it. The comment below already named *"a
   * stale plant left behind by a killed run"* as the hazard and then only REFUSED on it, which leaves the
   * planted file in the tree for the next `git add -A` — the exact path that committed a vacuous gate.
   */
  const preflight = preflightRestore(REPO_ROOT);
  for (const rel of preflight.recovered) {
    console.log(`  ⚠️  pre-flight restored ${rel}, left planted by an interrupted run.`);
  }
  // ⛔ `V4` — a refusal is a HARNESS FAULT, never a verdict: the pre-flight has found a dirty tracked
  // file it cannot prove it planted, and planting on top of it would put the verdict on somebody's work.
  if (preflight.refused.length) fault(id, preflight.refused.join('\n   '));
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
  /**
   * ⛔ **A PLAYWRIGHT PROOF IS VOID IF SOMETHING IS ALREADY SERVING.** `apps/rn/playwright.config.ts` sets
   * `reuseExistingServer: !process.env.CI`, so a listener on the port makes the run skip `expo export` —
   * and the plant is in APP SOURCE, so the browser would be handed the **pre-plant bundle**. The verdict
   * that produces is `failed-open`: a working guard reported dead, in the safe-looking direction.
   *
   * ⚠️ **Not hypothetical.** Pass 4 found two `serve` processes on 4319 left over from Aug 8 and Aug 10,
   * either of which would have served a days-old `dist/` to anything that bound after it.
   *
   * ⛔ **S1.12.5.1 [pass-5 D5-3] — THE PREDICATE USED TO BE `p.cmd.includes('playwright')`, AND IT WAS
   * BLIND TO HALF THE PROOFS THAT NEED IT.** A proof written as `run: "test:e2e:trust-claims"` names an
   * npm script; the word `playwright` is in `package.json`, not in the argv, so the check never fired.
   * Lane D measured it with a control: the `cmd:` form faulted, the `run:` form sailed past to the anchor
   * check with a listener bound on the port. **Two live entries were affected** (`S1P4-C4-8-SINGULAR`,
   * `S1P4-A-F5-PATHS`), both added by pass 4's own fixing — a form the predicate's author had not seen.
   *
   * ⛔ **AND THE OBVIOUS REPAIR IS REFUSED HERE.** Resolving `p.run` through `package.json` and looking
   * for the word again still loses to `a && b`, to `npm --prefix`, and to the next spelling nobody has
   * written yet. ⚡ **An enumeration of spellings has failed in this repo eight times.** The question that
   * is actually being asked is *"could this run be handed a stale server"*, and the honest answer does not
   * depend on the command at all: **no proof runs while that port is listening.** Strictly larger, strictly
   * cheaper, and it cannot be out-spelled — the cost is that a listener now blocks proofs that would not
   * have cared, which is the safe direction and is a fault a human clears in one command.
   */
  {
    const port = /-l\s*(\d+)/.exec(readFileSync(join(REPO_ROOT, 'apps/rn/playwright.config.ts'), 'utf8'))?.[1] ?? '4319';
    const listening = spawnSync('netstat', ['-ano'], { encoding: 'utf8', shell: true }).stdout ?? '';
    if (new RegExp(`[:.]${port}\\s+.*LISTEN`, 'i').test(listening)) {
      fault(
        id,
        `something is already listening on :${port}, so NO proof can run.\n` +
          '   ⛔ `apps/rn/playwright.config.ts` sets `reuseExistingServer`, so any proof that reaches\n' +
          '   playwright — by argv, by npm script, or through a script that chains to one — would be\n' +
          '   handed the PRE-PLANT bundle and read as failed-open: a working guard reported dead.\n' +
          '   ⚠️ This refuses every proof rather than the ones whose command spells "playwright",\n' +
          '   because that spelling missed two live entries. Stop that server and re-run.',
      );
    }
  }

  // ⚠️ The baseline, so the stray-file report below names what THIS run wrote rather than whatever the
  // working tree was already carrying.
  const dirtyBefore = new Set(dirtyPaths());
  const originals = new Map<string, string>();
  for (const u of p.unfix) {
    if (!originals.has(u.at)) originals.set(u.at, readFileSync(join(REPO_ROOT, u.at), 'utf8'));
  }
  /**
   * ⛔ **THE ORIGINALS WERE HELD IN MEMORY ONLY, AND A KILLED RUN LOST THEM.** [`U15`, from `T13`]
   *
   * ⚡ **This is not hypothetical and it did not stay in the working tree.** A `prove:guards` run was
   * interrupted, its plant stayed on disk, a later `git add -A` swept it up, and
   * `check-runner-completeness.ts` was COMMITTED as `const missing: string[] = [];` - a gate that
   * reported every test file wired, forever, over any hole. `finally` does not run on a signal, and
   * `fault()` here calls `process.exit`, so neither path reached this restore.
   *
   * `armPlant` writes a sidecar BEFORE the plant and arms signal/exit handlers; the pre-flight at the top
   * of the run recovers anything a `SIGKILL` left behind.
   */
  const disarm = armPlant([...originals].map(([rel, original]) => ({ abs: join(REPO_ROOT, rel), original })));
  const restore = (): void => {
    disarm();
  };

  let planted = true;
  let withPlant: { status: number; out: string; attempts: number };
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
    for (const [rel, text] of working) {
      const absRel = join(REPO_ROOT, rel);
      writeFileSync(absRel, text, 'utf8');
      // ⛔ `V4` - the pre-flight recovers only bytes this mechanism recorded writing.
      notePlant(absRel, text);
    }
    for (const [rel, text] of originals) {
      if (readFileSync(join(REPO_ROOT, rel), 'utf8') === text) planted = false;
    }
    withPlant = runUntilServed(id, 'planted', p);
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

  // ⚠️ AFTER the restore, never before it: a fault exits the process, and leaving the plant on disk
  // would hand the next run a dirty target — which its own pre-flight would then refuse.
  faultOnDeadServer(id, 'planted', withPlant);

  const withoutPlant = runUntilServed(id, 'control', p);
  // ⚠️ The control gets the same check. Left to score it reads as `control-red` — "the command is red
  // with or without the plant" — which is a claim about the COMMAND, and equally untrue here.
  faultOnDeadServer(id, 'control', withoutPlant);

  /**
   * ⛔ **THE DRAIN EXEMPTION LIVES HERE NOW, AND IT READS THE CONTROL'S OUTPUT.**
   * [`S5-DEADLOCK`; re-audit 6 `W9`]
   *
   * ⚡ **The deadlock:** past either ledger ceiling `lint:finding-guards` is red, and this harness requires
   * a GREEN control — so every proof whose `run` reads the ledger became unprovable and the ceiling could
   * never be drained. Measured: **8 of 9 drains failed on `control=exit 1` in one pass.**
   *
   * ⛔ **The first fix was an env var the GATE honoured, and that was wrong** — `W9` measured it as an
   * ambient fail-open: anything that exported `PROVE_GUARDS_DRAINING` disabled two ratchets for every
   * reader, including `validate:release:rn`. **A gate must not be weakenable from the environment.**
   *
   * ⚠️ So the gate is strict again and the judgement sits here, where it belongs: *this harness decides
   * how to read its own control.* It proceeds only when **every** problem the control reported is one of
   * the two ceilings — the exact numbers this run exists to lower — and it says so out loud. Any other
   * problem, and the control is red and the proof does not count.
   */
  if (withoutPlant.status !== 0) {
    const problems = [...withoutPlant.out.matchAll(/^ {2}• (.+)$/gm)].map((m) => m[1]);
    const drainable =
      problems.length > 0 &&
      problems.every((line) => /executed proof\(s\) were measured against a tree/.test(line) || /proof blocks have NEVER been executed/.test(line));
    if (drainable) {
      console.log(
        `  ⚠️  ${id}: the control is red ONLY on the ledger ceilings this drain is lowering — proceeding.\n` +
          problems.map((l) => `        • ${l.slice(0, 110)}`).join('\n'),
      );
      withoutPlant.status = 0;
    }
  }

  /**
   * ⚠️ **THE REST OF THE TREE, because the restore check only covers the files this proof edits.** Some
   * gates regenerate an artifact as they run — `surface-coverage.ts` rewrites its inventory markdown — and
   * under a plant that artifact is written from the PLANTED state. Reported rather than faulted: the
   * writing is legitimate, and the thing that is not legitimate is committing it without noticing.
   */
  const strays = dirtyPaths().filter((f) => !dirtyBefore.has(f) && !originals.has(f));
  if (strays.length) {
    console.log(`       ⚠️ this run left ${strays.length} other file(s) modified — check them before committing:`);
    for (const f of strays.slice(0, 6)) console.log(`          ${f}`);
  }

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
  /**
   * ⛔ **S1.13.7.12.3b — THE TWO `.12.3a` REPAIRS, GUARDED. THESE RUN AS SUBPROCESSES BECAUSE BOTH END
   * IN `process.exit`**, and a case that cannot be reached in-process is a case that would have been
   * written as a comment instead.
   *
   * ⚡ **Why they exist at all:** `.12.3a` fixed two ways this harness could speak about something that
   * never happened, and both fixes shipped resting on nothing — the *"119 entries rest on a token
   * alone"* shape, occurring **inside the instrument built to measure it.**
   *
   * ⚠️ **The registry is a REAL FILE under a gitignored name and is removed afterwards**, the same idiom
   * `test:gate-plants` uses — `--registry=` is resolved against the repo root, so a path in the OS temp
   * directory cannot be addressed.
   */
  const subprocessCases: { id: string; what: string; wantExit: number; wantAll: string[] }[] = [
    {
      id: 'selftest:a dead web server faults, never scores',
      what: 'deadserver',
      wantExit: 1,
      wantAll: ['HARNESS FAULT', 'never got its web server up'],
    },
    {
      id: 'selftest:an unrecordable pass is NAMED',
      what: 'persist',
      wantExit: 1,
      wantAll: ['could NOT be recorded', 'registry is INTACT', 'Measured and DISCARDED'],
    },
  ];

  const REL = 'scripts/__gate_plant_selftest-registry.json';
  const ABS = join(REPO_ROOT, REL);
  for (const c of subprocessCases) {
    const probe = `scripts/__fixtures__/prove-guards-${c.what}-probe.mjs`;
    const entry: Entry = {
      what: `self-test fixture — ${c.what}`,
      proof: {
        unfix: [
          {
            at: 'scripts/__fixtures__/prove-guards-target.ts',
            find: "MARKER = 'the guard holds'",
            replace: "MARKER = 'the guard is gone'",
          },
        ],
        cmd: ['node', probe],
        expect: 'PROBE: the guard is gone',
      },
    };
    let out = '';
    let status = -1;
    try {
      writeFileSync(ABS, `${JSON.stringify({ FIXTURE: entry }, null, 2)}\n`, 'utf8');
      // ⛔ The persist case needs the WRITE to fail, for every user including root — so the temp path
      // the record write renames from is made a DIRECTORY. See the probe's own note.
      if (c.what === 'persist') mkdirSync(`${ABS}.tmp`, { recursive: true });
      const res = spawnSync('npx', ['tsx', 'scripts/prove-guards.ts', `--registry=${REL}`, '--id=FIXTURE'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        shell: true,
      });
      status = res.status ?? -1;
      out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
    } finally {
      rmSync(`${ABS}.tmp`, { recursive: true, force: true });
      rmSync(ABS, { force: true });
    }
    const missing = c.wantAll.filter((s) => !out.includes(s));
    const ok = status === c.wantExit && missing.length === 0;
    console.log(
      `  ${ok ? '✅' : '❌'} ${c.id.padEnd(34)} exit ${status} (want ${c.wantExit})` +
        `${missing.length ? ` · MISSING ${JSON.stringify(missing)}` : ' · said all of it'}`,
    );
    if (!ok) broken++;
  }

  if (broken) {
    console.error(
      `\n❌ prove:guards --selftest — ${broken} of ${cases.length + subprocessCases.length} controls wrong.\n` +
        '   ⛔ No proof this harness has ever recorded means anything: it can no longer tell a guard that\n' +
        '   holds from one that does not, or a real red from a run in which nothing ever executed.\n',
    );
    process.exit(1);
  }
  console.log(
    '\n✅ prove:guards --selftest — a guard that holds reads ✅, one that does not reads failed-open,\n' +
      '   a dead web server faults instead of scoring, and an unrecordable pass says so.\n',
  );
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
/** ids whose `measured`/`sha` this run wrote — used to print the cap edit that must follow. */
const recorded: string[] = [];

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
      // ⚠️ The FAILURE lines, not the last lines. A suite's tail is its stack trace, and the message a
      // human needs — *which* assertion fired — is at the top of it. Printing the tail sent me
      // hand-reproducing a plant to read a message the harness already had.
      const lines = v.plantedOut.split('\n').map((l) => l.trimEnd()).filter(Boolean);
      // ⛔ `✓` lines carry the word "expected" too — a filter matching it selects the PASSES, which is
      // the same trap as grepping for "failed" and hitting `0 failed`. Match the failure markers only.
      const named = lines.filter((l) => /FAIL \[|Error:|❌/.test(l) && !l.includes('✓') && !/^\s+at /.test(l));
      for (const l of (named.length ? named : lines).slice(0, 4)) console.log(`         │ ${l.slice(0, 220)}`);
    }
    if (v.failed.includes('control-red')) {
      console.log('       ⛔ the control redded too, so this run measured nothing: the command is red with or without the plant.');
    }
  } else if (!has('no-record')) {
    /**
     * ⛔ **S1.12.5.1 [pass-5 D5-1] — RECORDING IS THE DEFAULT NOW, BECAUSE `--record` WAS INVOKED BY
     * NOTHING.** `measured`/`sha` were written only under an opt-in flag that no npm script and no
     * workflow ever passed, and read only by `--list`. The result: **66 of 66 proofs read `(never run)`
     * and zero of 186 entries carried a recorded execution on any sha** — while `lint:finding-guards`
     * printed *"66 carry a re-runnable proof"* on its green path and three passes read that as 66
     * closures. ⚡ **The ratchet drained as JSON was AUTHORED, not as proofs were EXECUTED.**
     *
     * ⚠️ **An opt-in flag on the one field that distinguishes authored from executed is the same defect
     * as no field at all.** A proof that passes has, by definition, just been measured; making the
     * caller ask for that to be written is how the distinction stayed theoretical for three passes.
     * `--no-record` remains for a read-only run (a dirty-tree check, or CI wanting no write-back).
     */
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    const raw = JSON.parse(readFileSync(REGISTRY, 'utf8')) as Record<string, Entry>;
    const rp = raw[id].proof as Proof;
    rp.measured = new Date().toISOString().slice(0, 10);
    rp.sha = sha;
    /**
     * ⛔ **S1.13.7.12.3a — THE WRITE IS ATOMIC, AND ITS FAILURE IS NAMED. Measured, not reasoned.**
     *
     * ⚡ Reproduced by locking the registry between records in a three-id batch: the guard printed
     * `✅ PROBE-B … reason=MATCHED`, the write threw, and the run died on a raw `EPERM` stack from
     * `node:fs`. Verified on the file afterwards — **the first id's stamp was on disk, the second's was
     * not, and the third never ran.**
     *
     * ⛔ **NOTHING DETECTS THAT GAP.** `MAX_AUTHORED` in `check-finding-guards.ts` is a **CEILING**
     * (`authored.length > MAX_AUTHORED`) and deliberately so — see its own note. A crash that drains the
     * count pushes it further UNDER the cap, so `lint:finding-guards` stays **green** over a registry
     * that just lost measurements. ⚠️ The direction is the safe one — the ledger under-claims rather
     * than over-claims — but the evidence is gone and nothing says which ids lost it.
     *
     * ⛔ **AND `writeFileSync` REWRITES THE REGISTRY IN PLACE.** `EPERM` fails before the open and does
     * no damage; a failure *after* it truncates the one file 267 entries rest on. Temp + rename removes
     * that direction entirely: a reader sees the old file or the new one, never a half-written one.
     */
    const tmp = `${REGISTRY}.tmp`;
    try {
      writeFileSync(tmp, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
      renameSync(tmp, REGISTRY);
    } catch (err) {
      // ⚠️ Best-effort: if the temp survived a failed rename it is untracked litter, and the next
      // `git add -A` is what would commit it. A failure to clean up must not mask the real error.
      try {
        rmSync(tmp, { force: true });
      } catch {
        /* the original error below is the one that matters */
      }
      const rest = selected.slice(selected.indexOf(id) + 1);
      console.error(
        `\n❌ prove:guards — ${id} HELD, but its measurement could NOT be recorded:\n` +
          `   ${err instanceof Error ? err.message : String(err)}\n\n` +
          `   ⛔ The registry is INTACT — the write is temp-then-rename, so nothing was half-written.\n` +
          `   ⛔ Stamped before this and still on disk: ${recorded.length ? recorded.join(', ') : '(none)'}\n` +
          `   ⛔ Measured and DISCARDED (re-run it): ${id}\n` +
          `   ⛔ Never run: ${rest.length ? rest.join(', ') : '(none)'}\n\n` +
          '   ⚠️ `lint:finding-guards` will NOT red over this — its authored count is a ceiling, so a\n' +
          '   drained registry reads green. This message is the only notice you get.\n',
      );
      process.exit(1);
    }
    recorded.push(id);
  }
}

/**
 * ⛔ **S1.12.5.1 — RECORDING DRAINS A STRICT-EQUALITY RATCHET, SO SAY SO BEFORE IT REDS.**
 *
 * `MAX_AUTHORED` in `check-finding-guards.ts` must equal the count of never-executed proofs. This run
 * just lowered that count, so the gate is red **until the cap follows** — and a session that meets that
 * red without this line diagnoses a broken gate instead of an unfinished edit. ⚡ **Measured:** the first
 * batch drained 66 → 17 mid-run, which redded `lint:finding-guards` and produced a **false `control-red`**
 * on the one proof whose command runs it as a control.
 */
if (recorded.length) {
  // ⚠️ Only the ids that were UNMEASURED before this run reduce the backlog. Subtracting every recording
  // over-counts by one for each proof that already carried a `measured` and was simply re-run — which is
  // exactly what happened the first time this line printed: it said 11 against a true 12, the ceiling was
  // set to 11, and `lint:finding-guards` redded. An instrument that is off by one about its own backlog is
  // the class this whole item is fixing.
  const newlyMeasured = recorded.filter((id) => !registry[id].proof?.measured).length;
  const stillAuthored = Object.values(registry).filter((e) => e.proof && !e.proof.measured).length - newlyMeasured;
  console.log(
    `\n  📌 recorded ${recorded.length} execution(s). ${stillAuthored} proof(s) remain never-executed —\n` +
      `     set \`MAX_AUTHORED = ${stillAuthored}\` in scripts/check-finding-guards.ts, in this same edit.\n` +
      '     ⚠️ Until you do, lint:finding-guards reds, and so does every gate that runs it as a control.',
  );
}

if (failures) {
  console.error(`\n❌ prove:guards — ${failures} of ${selected.length} guard(s) did not hold.\n`);
  process.exit(1);
}
console.log(`\n✅ prove:guards — ${selected.length} guard(s) red on their own defect, and the control is green.\n`);
