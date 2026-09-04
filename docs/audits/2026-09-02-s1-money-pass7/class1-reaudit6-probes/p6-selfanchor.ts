/**
 * Probe: the three proofs whose `run` is `lint:finding-guards` all plant INTO that gate's own source.
 * That gate checks every registry anchor still matches exactly once — so an un-fix that edits its own
 * anchor makes the gate exit 1 by itself, whatever the guarded behaviour does.
 *
 * For each proof: apply the un-fix, run the gate, and list every problem it reported. If the ONLY
 * problem is the anchor-integrity one, exit 1 says nothing about the guard.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const REG = JSON.parse(readFileSync(join(ROOT, 'scripts', 'finding-guards.json'), 'utf8')) as Record<
  string,
  { token?: string; proof?: { run?: string; expect?: string; unfix: { at: string; find: string; replace: string }[] } }
>;

const originals = new Map<string, string>();
const readOnce = (rel: string): string => {
  if (!originals.has(rel)) originals.set(rel, readFileSync(join(ROOT, rel), 'utf8'));
  return originals.get(rel) as string;
};

try {
  for (const [id, e] of Object.entries(REG)) {
    if (e.proof?.run !== 'lint:finding-guards') continue;
    console.log(`\n### ${id}`);
    console.log(`   expect: ${JSON.stringify(e.proof.expect)}`);
    for (const u of e.proof.unfix) {
      const inToken = e.token ? e.token.includes(u.find.trim()) || u.find.includes(e.token.trim()) : false;
      console.log(`   unfix at ${u.at} — find is (part of) this entry's own guard token: ${inToken}`);
    }
    let plantedAny = false;
    for (const u of e.proof.unfix) {
      const src = readOnce(u.at);
      if (src.split(u.find).length - 1 !== 1) {
        console.log(`   ⚠️ anchor does not match exactly once in ${u.at} — skipped`);
        continue;
      }
      writeFileSync(join(ROOT, u.at), src.replace(u.find, u.replace), 'utf8');
      plantedAny = true;
    }
    if (!plantedAny) continue;
    const r = spawnSync('npm', ['run', '--silent', 'lint:finding-guards'], {
      cwd: ROOT,
      encoding: 'utf8',
      shell: true,
      env: { ...process.env, PROVE_GUARDS_DRAINING: '1' },
    });
    const problems = `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').filter((l) => l.trim().startsWith('•'));
    console.log(`   planted=exit ${r.status}, ${problems.length} problem(s):`);
    problems.forEach((l) => console.log(`     ${l.trim().slice(0, 165)}`));
    const anchorOnly = problems.length > 0 && problems.every((l) => l.includes("proof's anchor matches"));
    console.log(`   ⛔ EVERY reported problem is the ANCHOR-INTEGRITY check: ${anchorOnly}`);
    for (const [rel, text] of originals) writeFileSync(join(ROOT, rel), text, 'utf8');
  }
} finally {
  for (const [rel, text] of originals) writeFileSync(join(ROOT, rel), text, 'utf8');
  let allBack = true;
  for (const [rel, text] of originals) allBack &&= readFileSync(join(ROOT, rel), 'utf8') === text;
  console.log(`\nrestored: every touched file byte-identical = ${allBack}`);
}
