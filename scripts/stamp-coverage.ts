/**
 * 4.1.9c — THE WRITER: a run's per-flow verdicts become the checklist's stamps.
 *
 * 🎯 Jason 2026-08-14: *"Nothing should be marked covered unless it's proven to be. And as items are
 * proven, they should be checked off."* The reader (`coverage-split.ts`) made the gap countable. This is
 * what closes it — and, more importantly, what can RE-OPEN it when a flow goes red.
 *
 * ⛔ MEASURED BEFORE IT WAS BUILT, AND THE ROW'S OWN HEADLINE CLAIM WAS FALSE. The plan said this would
 * "turn the two green runs into stamped rows". It does not add a single covered row: `claimed but
 * unproven` was already **0** — 32 rows stamped, 1 human-ticked, 33 distinct ids claimed. Its whole value
 * is forward: **revocation on regression**, and a stamp that means *proven at HEAD* rather than *proven by
 * a run five days and forty commits ago.* Building it to move a number would have been building it for a
 * reason that does not exist.
 *
 * ── THE FIVE RULES, each of which came out of the before-scan ────────────────────────────────────────
 *
 * ① **Automation manages only rows carrying its own stamp.** §11.15 is `[x]` with NO stamp, claimed by
 *    `05-tutorial-walkthrough`, which passes on every run. A writer that stamps "every claimed row whose
 *    flow passed" silently converts the report's one human-earned row into a machine-earned one, and the
 *    provenance split — the thing 4.1.9c exists to keep — stops meaning anything. A bare `[x]` is never
 *    touched, in either direction.
 *
 * ② **Absence is not failure.** The iPad results carry 5 flows and the iPhone 10. Fed one tier, this
 *    script sees ~20 claiming flows with no verdict at all; revoking on that wipes two dozen stamps in a
 *    single invocation. Only an explicit `fail`/`skipped` may revoke.
 *
 * ③ **`junitFound: false` writes nothing at all.** That is this lane's signature failure — the iOS driver
 *    stall that produces zero flows, costs a full build, and is indistinguishable from a green suite in
 *    wall-clock. It has happened twice. A stall must not be able to revoke the whole checklist.
 *
 * ④ **Every claiming flow that RAN must have passed.** §13.3 is claimed by two flows (`01` PARTIAL, `08`
 *    COVERS). Understating is the only direction this instrument is allowed to be wrong in.
 *
 * ⑤ **A `[M◐]` gets a stamp and NO tick.** A partial keeps a device-owed half however green the lane
 *    goes, so its box belongs to whoever runs the device pass. Ticking it would claim a human verified
 *    something no human has looked at. (The reader's gate already encodes the same exemption.)
 *
 * ── AND IT IS THE FIRST THING EVER TO WRITE TO THE CHECKLIST ─────────────────────────────────────────
 *
 * `coverage-split.ts` states the file is read-only *by design*: it carries hand-recorded `[x]` results and
 * inline findings that are not regenerable. So: **dry-run by default**, edits confined to the stamp token
 * and the single checkbox character, and no line is ever re-emitted from parsed parts.
 *
 * Usage:
 *   npm run stamp:coverage -- --results a.json b.json          # dry run — prints the plan, writes nothing
 *   npm run stamp:coverage -- --results a.json b.json --write
 *   npm run stamp:coverage -- --run 32042253465 [--write]      # pulls both tiers' artifacts via `gh`
 *   [--checklist <path>] [--flow-dir <path>]                   # for the planted-defect proofs
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseChecklist, parseFlows, claimsById, blockEnd,
  AUTOMATABLE, CHECKLIST, FLOW_DIR, ROW, STAMP_RE, STAMP_TOKEN_RE, stampToken,
  type Check, type Claim,
} from './coverage-model.ts';

// ── args ──────────────────────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(`--${name}`);
const opt = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 || i + 1 >= argv.length ? undefined : argv[i + 1];
};
const list = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return [];
  const out: string[] = [];
  for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) out.push(argv[j]);
  return out;
};

const WRITE = flag('write');
const checklistPath = opt('checklist') ?? CHECKLIST;
const flowDir = opt('flow-dir') ?? FLOW_DIR;

const die = (msg: string): never => { console.error(`\n⛔ ${msg}\n`); process.exit(1); };

// ── the results files ─────────────────────────────────────────────────────────────────────────────
interface FlowResult { flow: string | null; name: string; verdict: 'pass' | 'fail' | 'skipped' }
interface Results {
  schema: number; tier: string; runId: string | null; sha: string | null;
  junitFound: boolean; totals: Record<string, number>; flows: FlowResult[]; unresolved: string[];
}

/**
 * `gh run download` is the only friction between "the lane went green" and "the checklist knows it", so
 * `--run` removes it. ⚠️ It is a convenience over `--results`, never a second code path: it downloads,
 * then hands the same file list to the same logic.
 */
function download(runId: string): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'lane-results-'));
  const found: string[] = [];
  for (const tier of ['iphone', 'ipad']) {
    try {
      execFileSync('gh', ['run', 'download', runId, '-n', `lane-diagnostics-${tier}`, '-D', join(dir, tier)], { stdio: 'pipe' });
    } catch {
      console.error(`⚠️  no \`lane-diagnostics-${tier}\` artifact on run ${runId} — that tier is simply absent (rule ②), not failed.`);
      continue;
    }
    const f = join(dir, tier, `native-lane-results-${tier}.json`);
    if (existsSync(f)) found.push(f);
  }
  if (!found.length) die(`run ${runId} carried no \`native-lane-results-*.json\`. Older runs predate 4.1.9b.5; nothing to write from.`);
  return found;
}

const resultPaths = opt('run') ? download(opt('run')!) : list('results');
if (!resultPaths.length) die('nothing to read. Pass --results <files...> or --run <id>.');

const all: Results[] = resultPaths.map((p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')) as Results; }
  catch (e) { return die(`${p} is not readable JSON: ${(e as Error).message}`); }
});

// ⛔ RULE ③ — a stall writes nothing. Not "writes what it can": a tier that produced no report has no
// opinion about any flow, and letting the other tier proceed alone would silently apply rule ② to
// twenty rows that a working run would have re-proved.
for (const r of all) {
  if (!r.junitFound) {
    die(`${r.tier} tier reports \`junitFound: false\` — no flow ran. This is the iOS-driver stall, and it has\n   burned two full cycles already. Refusing to write anything from a run that produced no result.`);
  }
}
if (all.some((r) => r.unresolved.length)) {
  const u = all.flatMap((r) => r.unresolved);
  die(`${u.length} testcase name(s) did not resolve to a flow file: ${u.join(', ')}.\n   The stem-to-filename mapping has drifted, so a verdict cannot be attributed. Fix that first.`);
}

const runIds = [...new Set(all.map((r) => r.runId).filter(Boolean))] as string[];
if (runIds.length !== 1) {
  die(runIds.length === 0
    ? 'these results carry no `runId` (a local run). A stamp records a CI run; there is nothing to record.'
    : `these results come from different runs (${runIds.join(', ')}). One stamp cannot name two runs — pass one run's files.`);
}
const RUN = runIds[0];

/**
 * ⚠️ THE WORSE VERDICT WINS. `01` and `05` run on BOTH tiers, so one flow can arrive with two verdicts.
 * A flow that passes on the iPhone and fails on the iPad has not proved its check — rule ④ in the small.
 */
const RANK = { pass: 0, skipped: 1, fail: 2 } as const;
const flowVerdict = new Map<string, keyof typeof RANK>();
for (const r of all) {
  for (const f of r.flows) {
    if (!f.flow) continue;
    const prev = flowVerdict.get(f.flow);
    if (!prev || RANK[f.verdict] > RANK[prev]) flowVerdict.set(f.flow, f.verdict);
  }
}

// ── the plan ──────────────────────────────────────────────────────────────────────────────────────
type Action = 'stamp' | 'refresh' | 'revoke' | 'skip';
interface Step { check: Check; action: Action; why: string; tick?: boolean }

const { checks, problems, lines, eol } = parseChecklist(checklistPath);
if (problems.length) die(`the checklist does not parse:\n   ${problems.join('\n   ')}`);
const claims = parseFlows(flowDir);
const byId = claimsById(claims);

const steps: Step[] = [];
for (const check of checks) {
  const cl: Claim[] = byId.get(check.id) ?? [];
  const ran = cl.map((c) => ({ c, v: flowVerdict.get(c.flow) })).filter((x) => x.v !== undefined);

  // ⛔ RULE ① — a bare `[x]` is a human's. It is not automation's to confirm, refresh or remove, and the
  // check that would otherwise catch it is exactly the one boundary case in the file today (§11.15).
  if (check.done && !check.stamp) {
    if (ran.length) steps.push({ check, action: 'skip', why: `human \`[x]\` — not automation's to touch (claimed by ${cl.map((c) => c.flow.replace(/\.yaml$/, '')).join(', ')})` });
    continue;
  }

  // ⛔ RULE ② — no verdict is not a red. A tier that did not run has no opinion.
  if (!ran.length) {
    if (check.stamp) steps.push({ check, action: 'skip', why: cl.length ? 'no claiming flow ran in this run — left as it was' : 'stamped but unclaimed (the reader gates this)' });
    continue;
  }

  // ⛔ RULE ④ — every claiming flow that ran must have passed.
  /**
   * ⛔ RULE ⑤ — A PARTIAL'S BOX IS NOT AUTOMATION'S, IN EITHER DIRECTION.
   *
   * ⚠️ The first version of this line read `tick = verdict !== 'M◐'`, which is the rule stated as *"a
   * partial is never ticked"* — and the dry run showed it about to **UNTICK six human `[x]`** (§B2.3,
   * §4.1, §11.7, §11.8, §11.16, §13.4). The rule is *automation never TICKS a partial*; those boxes were
   * earned on real hardware for the device-owed half, and a partial's box belongs to whoever ran it.
   * `undefined` means "do not touch the box", which is not the same value as `false`.
   */
  const isPartial = check.verdict === 'M◐';

  const bad = ran.filter((x) => x.v !== 'pass');
  if (bad.length) {
    if (!check.stamp) { steps.push({ check, action: 'skip', why: `claimed by a ${bad[0].v} flow, and carries no stamp — already unproven` }); continue; }
    // ⚠️ A NON-PARTIAL'S TICK GOES WITH ITS STAMP, and that is an accepted, stated loss. The reader's
    // gate requires a stamped non-partial to be ticked, so the two are placed together and cannot be
    // told apart afterwards — the stamp claims the row. A partial's box survives revocation untouched.
    steps.push({ check, action: 'revoke', why: bad.map((x) => `\`${x.c.flow.replace(/\.yaml$/, '')}\` ${x.v}`).join(' · '), tick: isPartial ? undefined : false });
    continue;
  }

  // The reader already gates a stamp on an un-automatable verdict; the writer must not CREATE one.
  if (!AUTOMATABLE.includes(check.verdict)) {
    steps.push({ check, action: 'skip', why: `verdict [${check.verdict}] — a ${check.verdict === '—' ? 'not-a-check' : 'device-only'} row cannot be machine-proven` });
    continue;
  }

  const tick = isPartial || check.done ? undefined : true;
  if (check.stamp === RUN && tick === undefined) { steps.push({ check, action: 'skip', why: 'already recorded against this run' }); continue; }
  steps.push({
    check,
    action: check.stamp ? 'refresh' : 'stamp',
    why: check.stamp ? `${check.stamp} → ${RUN}` : `proven by ${ran.map((x) => `\`${x.c.flow.replace(/\.yaml$/, '')}\``).join(' · ')}`,
    tick,
  });
}

// ── the edit ──────────────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ SURGICAL, AND THAT IS THE WHOLE DESIGN. Two operations, both token-level:
 *   • the checkbox character on the row's FIRST line, via `ROW`'s capture groups
 *   • the `✅auto·<id>` token anywhere in the row's logical block
 * A new stamp goes on the block's LAST line — a row's first line routinely ends mid-sentence (§11.11
 * ends on a colon), and the existing hand-placed stamps already sit there on the wrapped rows.
 */
function applyStep(buf: string[], step: Step): void {
  const [start] = step.check.block;
  const end = blockEnd(buf, start);

  if (step.tick !== undefined) {
    // ⚠️ ONE CHARACTER, BY INDEX. Re-emitting the line from `ROW`'s capture groups would drop the
    // ` — ` / `**` separator the regex consumes between the id and the title, silently reformatting a
    // hand-written row. Replacing the box character at its known offset provably cannot.
    const m = buf[start].match(ROW);
    if (!m) throw new Error(`the row at line ${start + 1} stopped matching mid-edit — refusing to guess`);
    const at = m[1].length;
    buf[start] = `${buf[start].slice(0, at)}${step.tick ? 'x' : ' '}${buf[start].slice(at + 1)}`;
  }

  for (let i = start; i <= end; i++) {
    if (!STAMP_RE.test(buf[i])) continue;
    if (step.action === 'revoke') buf[i] = buf[i].replace(STAMP_TOKEN_RE, '').replace(/[ \t]+$/, '');
    if (step.action === 'refresh') buf[i] = buf[i].replace(STAMP_RE, `✅auto·${RUN}`);
  }
  if (step.action === 'stamp') buf[end] = `${buf[end].replace(/\s+$/, '')} ${stampToken(RUN)}`;
}

// ── report ────────────────────────────────────────────────────────────────────────────────────────
const acted = steps.filter((s) => s.action !== 'skip');
const icon: Record<Action, string> = { stamp: '⭐', refresh: '🔁', revoke: '⛔', skip: '·' };

console.log(`\n── stamp-coverage · run \`${RUN}\` · ${all.map((r) => `${r.tier} ${r.totals.pass}/${r.flows.length}`).join(' · ')} ──`);
console.log(`   sha ${all[0].sha?.slice(0, 8) ?? '(local)'} · ${flowVerdict.size} flows with a verdict · checklist ${checklistPath}\n`);

for (const s of acted) {
  const box = s.tick === true ? '☑ tick ' : s.tick === false ? '☐ untick' : `· box \`[${s.check.done ? 'x' : ' '}]\` kept`;
  console.log(`  ${icon[s.action]} ${s.action.toUpperCase().padEnd(7)} ${s.check.id.padEnd(9)} [${s.check.verdict}]`.padEnd(34) + `${box.padEnd(17)} ${s.why}`);
}
if (!acted.length) console.log('  (nothing to change — every claimed row already records this run)');

const skipped = steps.filter((s) => s.action === 'skip');
const human = skipped.filter((s) => s.why.startsWith('human'));
console.log(`\n  ${acted.filter((s) => s.action === 'stamp').length} stamped · ${acted.filter((s) => s.action === 'refresh').length} refreshed · ${acted.filter((s) => s.action === 'revoke').length} REVOKED · ${skipped.length} untouched (${human.length} human-earned)`);

if (!WRITE) {
  console.log(`\n  ⚠️  DRY RUN — nothing written. Re-run with \`--write\` to apply.\n`);
  process.exit(0);
}
if (!acted.length) { console.log(`\n  nothing to write.\n`); process.exit(0); }

const buf = [...lines];
// ⚠️ LAST ROW FIRST. A `stamp` appends to a block's last line, which does not move earlier rows — but
// editing back-to-front means a step can never be invalidated by an earlier step's edit, whatever the
// operation grows into later. Cheap insurance against a class of bug that is invisible until it is not.
for (const s of [...acted].sort((a, b) => b.check.block[0] - a.check.block[0])) applyStep(buf, s);

// ⛔ `eol`, NOT `'\n'` — see `parseChecklist`. This file is CRLF, and joining on LF would rewrite all
// 593 line endings in a document nobody asked this script to reformat.
writeFileSync(checklistPath, buf.join(eol), 'utf8');
console.log(`\n  ✅ wrote ${checklistPath}`);
console.log(`     ▶ regenerate the report: npm run audit:coverage\n`);
