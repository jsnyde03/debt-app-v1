/**
 * 4.1.9c.5 — PROVING THE WRITER, IN BOTH DIRECTIONS, BEFORE IT TOUCHES THE REAL FILE.
 *
 * `stamp-coverage.ts` is the first thing in this repo that writes to `DEBT_3.5_DEVICE_QA_CHECKLIST.md`,
 * and that file carries hand-recorded `[x]` results and inline findings that are **not regenerable**. A
 * gate that can only say "fine" is not a gate (the App-Preview conform learned that over seven cycles),
 * so every rule is exercised against a planted input that should make it fire.
 *
 * ⛔ AND EVERY PLANT REPORTS WHETHER IT LANDED. Three of the first eight plants in 4.1.9b.8 reported
 * "the gate missed it" while the files were byte-identical to their backups — a plant that does not apply
 * looks *exactly* like a blind gate, and it fails in the safe-looking direction. Hence
 * `plant-applied=YES|NO` beside every scenario.
 *
 * ⚠️ Nothing here touches the repo's own checklist. Each scenario runs against a COPY in a temp dir,
 * with `--checklist` / `--flow-dir` pointed at it.
 *
 * Usage: npm run test:stamp
 */
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CHECKLIST, FLOW_DIR, parseChecklist } from './coverage-model.ts';

const RUN = '99999999999';
const IPHONE = ['01-launch-smoke', '02-sheet-native-tap', '03-row-context-menu', '04-payoff-schedule',
  '05-tutorial-walkthrough', '06-tutorial-interactions', '07-money-add-and-rescue', '08-coach-marks',
  '10-walkthrough-edges', '09-demo-explore'];
const IPAD = ['01-launch-smoke', 'i01-ipad-boot', 'i02-ipad-step5-landscape', 'i03-ipad-rotate-midstep',
  '05-tutorial-walkthrough'];

let failures = 0;
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`      ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

/** a results file in the exact shape `maestro-results.mjs` emits */
function results(tier: string, flows: string[], opts: { fail?: string[]; skipped?: string[]; junitFound?: boolean; runId?: string } = {}) {
  const verdictOf = (f: string) => (opts.fail?.includes(f) ? 'fail' : opts.skipped?.includes(f) ? 'skipped' : 'pass');
  const rows = flows.map((f) => ({ flow: `${f}.yaml`, name: f, verdict: verdictOf(f), time: 1 }));
  const totals = { pass: 0, fail: 0, skipped: 0 } as Record<string, number>;
  for (const r of rows) totals[r.verdict]++;
  return {
    schema: 1, tier, runId: opts.runId ?? RUN, runAttempt: '1', sha: 'deadbeefcafe', ref: 'refs/heads/test',
    generatedAt: '2026-08-17T00:00:00.000Z', junitFound: opts.junitFound ?? true, totals, flows: rows, unresolved: [],
  };
}

interface Sandbox { dir: string; checklist: string; flows: string; write(name: string, r: unknown): string }
function sandbox(): Sandbox {
  const dir = mkdtempSync(join(tmpdir(), 'stamp-proof-'));
  const checklist = join(dir, 'CHECKLIST.md');
  const flows = join(dir, 'maestro');
  cpSync(CHECKLIST, checklist);
  mkdirSync(flows);
  cpSync(FLOW_DIR, flows, { recursive: true });
  return {
    dir, checklist, flows,
    write(name, r) { const p = join(dir, name); writeFileSync(p, JSON.stringify(r, null, 2)); return p; },
  };
}

function run(sb: Sandbox, files: string[], write = true): { out: string; code: number } {
  const args = ['tsx', 'scripts/stamp-coverage.ts', '--results', ...files, '--checklist', sb.checklist, '--flow-dir', sb.flows];
  if (write) args.push('--write');
  try {
    return { out: execFileSync('npx', args, { encoding: 'utf8', stdio: 'pipe', shell: process.platform === 'win32' }), code: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { out: `${err.stdout ?? ''}${err.stderr ?? ''}`, code: err.status ?? 1 };
  }
}

const rowOf = (path: string, id: string) => parseChecklist(path).checks.find((c) => c.id === id)!;

// ── ① REVOKE ON RED ───────────────────────────────────────────────────────────────────────────────
{
  console.log('\n  ① a RED flow takes its rows back out');
  const sb = sandbox();
  const before = parseChecklist(sb.checklist);
  const stamped13 = ['§13.1', '§13.2', '§13.5', '§13.6'].map((id) => before.checks.find((c) => c.id === id)!);
  const planted = stamped13.every((c) => c.stamp && c.done);
  console.log(`      plant-applied=${planted ? 'YES' : 'NO'} (08-coach-marks marked FAIL; its 4 outright rows start stamped+ticked)`);
  if (!planted) failures++;

  const files = [sb.write('iphone.json', results('iphone', IPHONE, { fail: ['08-coach-marks'] })), sb.write('ipad.json', results('ipad', IPAD))];
  const { out } = run(sb, files);
  const after = parseChecklist(sb.checklist);
  const a = (id: string) => after.checks.find((c) => c.id === id)!;

  check('§13.1 stamp removed', !a('§13.1').stamp, `stamp=${a('§13.1').stamp ?? 'none'}`);
  check('§13.1 unticked', !a('§13.1').done);
  check('§13.4 [M◐] stamp removed', !a('§13.4').stamp);
  check("§13.4 [M◐] box KEPT (it is the human's)", a('§13.4').done === before.checks.find((c) => c.id === '§13.4')!.done);
  check('§13.3 revoked too — claimed by a passing 01 AND the red 08 (rule ④)', !a('§13.3').stamp);
  check('§14.x untouched — a different flow', a('§14.1').stamp === RUN && a('§14.1').done);
  check('the report says REVOKED', /\bREVOKED\b/.test(out) && out.includes('⛔ REVOKE'));
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ② A BARE [x] IS NEVER TOUCHED ─────────────────────────────────────────────────────────────────
{
  console.log('\n  ② a human `[x]` with no stamp survives every path');
  const sb = sandbox();
  const before = rowOf(sb.checklist, '§11.15');
  const planted = before.done && !before.stamp;
  console.log(`      plant-applied=${planted ? 'YES' : 'NO'} (§11.15 is [x] with no stamp, claimed by 05 — which PASSES)`);
  if (!planted) failures++;

  // pass, then red, then a tier that never ran it: none of the three may write to that row.
  for (const [label, opts] of [['05 passes', {}], ['05 RED', { fail: ['05-tutorial-walkthrough'] }], ['iPad only', null]] as const) {
    const files = opts === null
      ? [sb.write('ipad.json', results('ipad', IPAD))]
      : [sb.write('iphone.json', results('iphone', IPHONE, opts)), sb.write('ipad.json', results('ipad', IPAD, opts))];
    run(sb, files);
    const after = rowOf(sb.checklist, '§11.15');
    check(`${label}: still \`[x]\`, still unstamped`, after.done && !after.stamp, `done=${after.done} stamp=${after.stamp ?? 'none'}`);
  }
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ③ A PARTIAL IS STAMPED AND NEVER TICKED ───────────────────────────────────────────────────────
{
  console.log('\n  ③ an [M◐] gets a stamp and its box is left alone');
  const sb = sandbox();
  // Strip §11.9's stamp so this exercises the STAMP path, not the refresh path.
  const src = readFileSync(sb.checklist, 'utf8');
  const row = rowOf(sb.checklist, '§11.9');
  const lines = src.split(/\r?\n/);
  const had = lines.slice(row.block[0], row.block[1] + 1).join('\n');
  for (let i = row.block[0]; i <= row.block[1]; i++) lines[i] = lines[i].replace(/[ \t]*`✅auto·\d+`/, '');
  writeFileSync(sb.checklist, lines.join('\n'));
  const now = rowOf(sb.checklist, '§11.9');
  const planted = /✅auto/.test(had) && !now.stamp && !now.done;
  console.log(`      plant-applied=${planted ? 'YES' : 'NO'} (§11.9's stamp stripped; box was and stays \`[ ]\`)`);
  if (!planted) failures++;

  const files = [sb.write('iphone.json', results('iphone', IPHONE)), sb.write('ipad.json', results('ipad', IPAD))];
  const { out } = run(sb, files);
  const after = rowOf(sb.checklist, '§11.9');
  check('§11.9 stamped', after.stamp === RUN, `stamp=${after.stamp ?? 'none'}`);
  check('§11.9 box still `[ ]` — the device-owed half is not proven', !after.done);
  check('the report calls it a STAMP, not a refresh', /⭐ STAMP\s+§11\.9/.test(out));
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ④ ABSENCE IS NOT FAILURE ──────────────────────────────────────────────────────────────────────
{
  console.log('\n  ④ one tier alone revokes nothing');
  const sb = sandbox();
  const before = parseChecklist(sb.checklist).checks.filter((c) => c.stamp).length;
  console.log(`      plant-applied=${before > 0 ? 'YES' : 'NO'} (iPad results only — ${before} stamped rows, most claimed by iPhone-only flows)`);
  if (!before) failures++;

  const { out } = run(sb, [sb.write('ipad.json', results('ipad', IPAD))]);
  const after = parseChecklist(sb.checklist).checks;
  check('no row lost its stamp', after.filter((c) => c.stamp).length === before, `${after.filter((c) => c.stamp).length} of ${before}`);
  check('zero revocations reported', /0 REVOKED/.test(out));
  check('the iPad rows still refreshed', after.find((c) => c.id === '§10.1')!.stamp === RUN);
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ⑤ IDEMPOTENT ──────────────────────────────────────────────────────────────────────────────────
{
  console.log('\n  ⑤ running it twice changes nothing the second time');
  const sb = sandbox();
  const files = [sb.write('iphone.json', results('iphone', IPHONE)), sb.write('ipad.json', results('ipad', IPAD))];
  run(sb, files);
  const first = readFileSync(sb.checklist, 'utf8');
  const { out } = run(sb, files);
  const second = readFileSync(sb.checklist, 'utf8');
  console.log(`      plant-applied=${first !== readFileSync(CHECKLIST, 'utf8') ? 'YES' : 'NO'} (pass 1 did change the file)`);
  check('pass 2 is byte-identical', first === second);
  check('pass 2 reports nothing to change', /nothing to change/.test(out));
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ⑥ A DRIVER STALL WRITES NOTHING ───────────────────────────────────────────────────────────────
{
  console.log('\n  ⑥ `junitFound: false` refuses outright');
  const sb = sandbox();
  const before = readFileSync(sb.checklist, 'utf8');
  console.log('      plant-applied=YES (iPhone results carry junitFound:false, zero flows — the driver stall)');
  const files = [sb.write('iphone.json', results('iphone', [], { junitFound: false })), sb.write('ipad.json', results('ipad', IPAD))];
  const { out, code } = run(sb, files);
  check('exits non-zero', code !== 0, `code=${code}`);
  check('names the stall', /driver stall/i.test(out));
  check('the file is untouched', readFileSync(sb.checklist, 'utf8') === before);
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ⑦ TWO RUNS CANNOT BE MIXED ────────────────────────────────────────────────────────────────────
{
  console.log('\n  ⑦ results from two different runs are refused');
  const sb = sandbox();
  const before = readFileSync(sb.checklist, 'utf8');
  console.log('      plant-applied=YES (iPad results carry a different runId)');
  const files = [sb.write('iphone.json', results('iphone', IPHONE)), sb.write('ipad.json', results('ipad', IPAD, { runId: '11111111111' }))];
  const { out, code } = run(sb, files);
  check('exits non-zero', code !== 0, `code=${code}`);
  check('names both runs', out.includes(RUN) && out.includes('11111111111'));
  check('the file is untouched', readFileSync(sb.checklist, 'utf8') === before);
  rmSync(sb.dir, { recursive: true, force: true });
}

// ── ⑧ FORMAT PRESERVATION ─────────────────────────────────────────────────────────────────────────
{
  console.log('\n  ⑧ a refresh changes ONLY the digits it is meant to');
  const sb = sandbox();
  const before = readFileSync(sb.checklist, 'utf8');
  const files = [sb.write('iphone.json', results('iphone', IPHONE)), sb.write('ipad.json', results('ipad', IPAD))];
  run(sb, files);
  const after = readFileSync(sb.checklist, 'utf8');
  console.log(`      plant-applied=${before !== after ? 'YES' : 'NO'} (the writer did edit the copy)`);
  if (before === after) failures++;
  // Normalise every stamp on BOTH sides: what remains must be identical, or something else moved.
  const norm = (s: string) => s.replace(/✅auto·\d+/g, '✅auto·N');
  check('nothing but the run ids changed', norm(before) === norm(after));
  check('line count unchanged', before.split('\n').length === after.split('\n').length);
  rmSync(sb.dir, { recursive: true, force: true });
}

console.log(`\n${failures ? `❌ stamp-coverage proof: ${failures} assertion(s) failed\n` : '✅ stamp-coverage proof: every rule fires on a planted input, and every plant landed\n'}`);
process.exit(failures ? 1 : 0);
