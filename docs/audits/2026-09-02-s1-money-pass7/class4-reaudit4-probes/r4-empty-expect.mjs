/**
 * R4 — does `expect: ""` still reach verdict() with nothing to attribute the red to?
 * prove-guards.ts:538 comment claims: "there is no path here that reaches `verdict()` with nothing
 * to attribute the red to [R3-3]".  `expected = p.expect ?? e.token!` — and `'' ?? x` is `''`.
 * The selection fault at :735 requires BOTH `!expect` AND `!token`, so an entry with a token and an
 * empty-string expect is selected, reaches verdict(), and verdict() skips the reason check on a
 * falsy expect (lib/verdict.ts:113).
 */
import { writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REL = 'scripts/__gate_plant_selftest-registry.json';
const unfix = [{
  at: 'scripts/__fixtures__/prove-guards-target.ts',
  find: "MARKER = 'the guard holds'",
  replace: "MARKER = 'the guard is gone'",
}];
const base = {
  what: 'R4 fixture',
  file: 'scripts/__fixtures__/prove-guards-target.ts',
  token: "export const MARKER = 'the guard holds';",
};
const cases = {
  'A · expect ABSENT (defaults to the token)': { ...base, proof: { unfix, cmd: ['node', 'scripts/__fixtures__/prove-guards-probe.mjs'] } },
  'B · expect = "" WITH a token': { ...base, proof: { unfix, cmd: ['node', 'scripts/__fixtures__/prove-guards-probe.mjs'], expect: '' } },
  'C · expect = "" and NO token': { what: base.what, proof: { unfix, cmd: ['node', 'scripts/__fixtures__/prove-guards-probe.mjs'], expect: '' } },
  'D · expect = a string nothing prints (control)': { ...base, proof: { unfix, cmd: ['node', 'scripts/__fixtures__/prove-guards-probe.mjs'], expect: 'THIS STRING IS PRINTED BY NOTHING' } },
};
for (const [label, entry] of Object.entries(cases)) {
  let out = '', status = -1;
  try {
    writeFileSync(REL, `${JSON.stringify({ FIXTURE: entry }, null, 2)}\n`, 'utf8');
    const r = spawnSync('npx', ['tsx', 'scripts/prove-guards.ts', `--registry=${REL}`, '--id=FIXTURE', '--no-record'], { encoding: 'utf8', shell: true });
    status = r.status ?? -1;
    out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  } finally { rmSync(REL, { force: true }); }
  const line = out.split('\n').find((l) => l.includes('FIXTURE')) ?? '(no verdict line)';
  console.log(`\n--- ${label}`);
  console.log(`    exit=${status}`);
  console.log(`    ${line.trim()}`);
  console.log(`    reason= present: ${/reason=/.test(out) ? 'YES' : 'NO'}   ·   HARNESS FAULT: ${/HARNESS FAULT|carries a proof with neither/.test(out) ? 'YES' : 'no'}`);
}
