/**
 * Class 1 probe 5 — does each new stripper consumer FAIL CLOSED when the stripper reads nothing?
 *
 * ⛔ `lint:scan-floors` exempts a consumer only with a MEASURED reason — "Verified red under a blanked
 * stripper". This performs that measurement rather than asserting it. [GAP-8]
 *
 * Run: node docs/audits/2026-09-02-s1-money-pass7/class1-probes/p5-blanked-stripper.mjs
 */
import { copyFileSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../../..');
const STRIPPER = join(ROOT, 'scripts/lib/stripCode.ts');
const backup = `${STRIPPER}.blankprobe-backup`;

/** Everything blanked except newlines — the "stripper read nothing" failure mode GAP-8 names. */
const BLANKED = `
export function stripCommentsAndStrings(src: string): string {
  return src.replace(/[^\\n]/g, ' ');
}
export function stripCommentsOnly(src: string): string {
  return src.replace(/[^\\n]/g, ' ');
}
`;

function run(cmd, args) {
  try {
    const out = execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? -1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const original = readFileSync(STRIPPER, 'utf8');
copyFileSync(STRIPPER, backup);

const SUBJECTS = [
  ['check-runner-completeness.ts', ['npx', ['tsx', 'scripts/check-runner-completeness.ts']]],
  ['check-fixture-dates.ts', ['npx', ['tsx', 'scripts/check-fixture-dates.ts']]],
  ['check-sandbox-writes.ts', ['npx', ['tsx', 'scripts/check-sandbox-writes.ts']]],
];

console.log('baseline (real stripper):');
for (const [name, [cmd, args]] of SUBJECTS) {
  const r = run(cmd, args);
  console.log(`  ${name.padEnd(44)} exit=${r.code}`);
  // ⛔ A control that reds is not a control. Print why, rather than reporting a verdict over it.
  if (r.code !== 0) console.log(r.out.split('\n').filter(Boolean).slice(-8).map((l) => `      ${l}`).join('\n'));
}

try {
  writeFileSync(STRIPPER, BLANKED, 'utf8');
  const applied = readFileSync(STRIPPER, 'utf8') !== original;
  console.log(`\nblanked stripper applied=${applied ? 'YES' : 'NO'}:`);
  for (const [name, [cmd, args]] of SUBJECTS) {
    const r = run(cmd, args);
    const verdict = r.code !== 0 ? 'FAILS CLOSED (red)' : 'FAILS OPEN — needs a floor';
    console.log(`  ${name.padEnd(44)} exit=${r.code}  ${verdict}`);
  }
} finally {
  copyFileSync(backup, STRIPPER);
  unlinkSync(backup);
}

const restored = readFileSync(STRIPPER, 'utf8') === original;
console.log(`\nrestored byte-identical=${restored ? 'YES' : 'NO'}`);
if (!restored) process.exit(1);
