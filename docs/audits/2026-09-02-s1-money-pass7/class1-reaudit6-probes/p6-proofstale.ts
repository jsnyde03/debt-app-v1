/**
 * Probe: does `S1P6-D2-1-PROOFSTALE` still score MATCHED when the ceiling it guards is DEAD?
 *
 * Reproduces exactly what `prove-guards.ts` measures — control run, planted run, `introducedLines`,
 * `expect` — but with an extra plant that neutralises the stale refusal, which `prove:guards` itself
 * cannot do (its pre-flight faults on a dirty target).
 *
 * Byte mode throughout; the original is restored and `cmp`-verified by the caller.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { introducedLines } from '../../../../scripts/lib/verdict';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const TARGET = join(ROOT, 'scripts', 'check-finding-guards.ts');

const CEILING = 'const MAX_STALE_PROOFS = 8;';
const UNFIX = 'const MAX_STALE_PROOFS = -1;'; // the registry's own un-fix
const GUARD_IF = 'if (stale.length > MAX_STALE_PROOFS) {';
const DEAD_IF = 'if (false && stale.length > MAX_STALE_PROOFS) {';
const EXPECT = 'STALE';

const original = readFileSync(TARGET, 'utf8');

function run(): { status: number; out: string } {
  // ⚠️ the same env `prove-guards.ts:169` gives every child of a proof
  const r = spawnSync('npm', ['run', '--silent', 'lint:finding-guards'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, PROVE_GUARDS_DRAINING: '1' },
  });
  return { status: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

function score(label: string, plantedSrc: string, controlSrc: string): void {
  writeFileSync(TARGET, controlSrc, 'utf8');
  const control = run();
  writeFileSync(TARGET, plantedSrc, 'utf8');
  const planted = run();
  writeFileSync(TARGET, original, 'utf8');

  const introduced = introducedLines(planted.out, control.out);
  const rightReason = introduced.some((l) => l.includes(EXPECT));
  const ok = planted.status !== 0 && control.status === 0 && rightReason;
  console.log(`\n### ${label}`);
  console.log(`   planted=exit ${planted.status} · control=exit ${control.status} · rightReason=${rightReason} → ${ok ? 'MATCHED' : 'FAILED'}`);
  console.log('   the introduced line(s) carrying the expect string:');
  introduced.filter((l) => l.includes(EXPECT)).slice(0, 4).forEach((l) => console.log(`     ${l.trim().slice(0, 150)}`));
  console.log('   every problem the planted run reported:');
  planted.out.split('\n').filter((l) => l.trim().startsWith('•')).forEach((l) => console.log(`     ${l.trim().slice(0, 150)}`));
}

try {
  if (!original.includes(CEILING) || !original.includes(GUARD_IF)) {
    console.error('PROBE-FAULT: an anchor moved; do not trust anything below.');
    process.exit(2);
  }
  // A — the proof exactly as recorded, on the real tree
  score('A · the proof as recorded', original.replace(CEILING, UNFIX), original);
  // B — the same proof with the STALE CEILING COMPLETELY DEAD in both runs
  const dead = original.replace(GUARD_IF, DEAD_IF);
  score('B · …with the stale refusal neutralised in BOTH runs', dead.replace(CEILING, UNFIX), dead);
} finally {
  writeFileSync(TARGET, original, 'utf8');
  console.log(`\nrestored: bytes identical = ${readFileSync(TARGET, 'utf8') === original}`);
}
