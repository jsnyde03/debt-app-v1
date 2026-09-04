/**
 * Probe: `preflightRestore` paths `test-plant-safety.ts` does not exercise.
 *
 * Everything happens in a scratch git repo. Nothing here touches the real tree.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { SIDECAR_SUFFIXES, armPlant, notePlant, preflightRestore } from '../../../../scripts/lib/plantSafety';

const rows: string[] = [];
const say = (label: string, got: string) => rows.push(`${label.padEnd(62)} ${got}`);

function fresh(autocrlf: string, eol: 'lf' | 'crlf'): { root: string; abs: string; rel: string; sidecar: string; ORIGINAL: string } {
  const root = mkdtempSync(join(tmpdir(), 'p6-plant-'));
  const rel = 'src/target.ts';
  const abs = join(root, rel);
  const NL = eol === 'crlf' ? '\r\n' : '\n';
  const ORIGINAL = `export const real = 1;${NL}export const two = 2;${NL}`;
  mkdirSync(join(root, 'src'), { recursive: true });
  const git = (...a: string[]) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 't@e.com');
  git('config', 'user.name', 't');
  git('config', 'core.autocrlf', autocrlf);
  writeFileSync(abs, ORIGINAL, 'utf8');
  git('add', '-A');
  git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'base');
  // rewrite after commit so the WORKING TREE keeps `eol` regardless of what git normalised into the index
  writeFileSync(abs, ORIGINAL, 'utf8');
  return { root, abs, rel, sidecar: `${abs}${SIDECAR_SUFFIXES[0]}`, ORIGINAL };
}

const DEAD_PID = '2147483646';

// ── 1. the window between the plant landing and its fingerprint being recorded ────────────────────
{
  const { root, abs, rel, sidecar, ORIGINAL } = fresh('false', 'lf');
  armPlant([{ abs, original: ORIGINAL }]);
  writeFileSync(abs, `${ORIGINAL}export const planted = 9;\n`, 'utf8');
  // ⛔ the kill lands HERE — notePlant() has not run yet
  delete process.env.PLANT_SAFETY_LIVE;
  writeFileSync(`${sidecar}.plant-owner`, DEAD_PID, 'utf8');
  const r = preflightRestore(root);
  say('kill BETWEEN writeFileSync and notePlant', `recovered=${r.recovered.length} refused=${r.refused.length} restored=${readFileSync(abs, 'utf8') === ORIGINAL}`);
  say('  …sidecar left on disk for a human', String(existsSync(sidecar)));
  say('  …target still holds the PLANT', String(readFileSync(abs, 'utf8').includes('planted = 9')));
  void rel;
  rmSync(root, { recursive: true, force: true });
}

// ── 2. autocrlf=true + a CRLF working tree: is a CLEAN file seen as clean? ────────────────────────
for (const [autocrlf, eol] of [['false', 'lf'], ['true', 'crlf'], ['input', 'crlf'], ['true', 'lf']] as const) {
  const { root, abs, sidecar, ORIGINAL } = fresh(autocrlf, eol);
  // the commonest orphan: sidecar beside an ALREADY-CLEAN file
  writeFileSync(sidecar, ORIGINAL, 'utf8');
  delete process.env.PLANT_SAFETY_LIVE;
  writeFileSync(`${sidecar}.plant-owner`, DEAD_PID, 'utf8');
  const gitStatus = execFileSync('git', ['status', '--porcelain', '--', 'src/target.ts'], { cwd: root, encoding: 'utf8' }).trim();
  const r = preflightRestore(root);
  say(
    `orphan beside a CLEAN file  autocrlf=${autocrlf} worktree=${eol}`,
    `git-says-dirty=${gitStatus !== ''}  recovered=${r.recovered.length} refused=${r.refused.length}  sidecar-dropped=${!existsSync(sidecar)}`,
  );
  rmSync(root, { recursive: true, force: true });
}

// ── 3. the same file armed TWICE in one process ───────────────────────────────────────────────────
{
  const { root, abs, sidecar, ORIGINAL } = fresh('false', 'lf');
  const PLANT_A = `${ORIGINAL}export const a = 1;\n`;
  armPlant([{ abs, original: ORIGINAL }]);
  writeFileSync(abs, PLANT_A, 'utf8');
  notePlant(abs, PLANT_A);
  // a second harness in the SAME process arms the same file, reading what is on disk as its "original"
  const disarm = armPlant([{ abs, original: PLANT_A }]);
  writeFileSync(abs, `${PLANT_A}export const b = 2;\n`, 'utf8');
  disarm();
  say('same file armed twice, then disarmed', `on disk == ORIGINAL? ${readFileSync(abs, 'utf8') === ORIGINAL}  == PLANT_A? ${readFileSync(abs, 'utf8') === PLANT_A}`);
  say('  …sidecar and marks removed', String(!existsSync(sidecar) && !existsSync(`${sidecar}.plant-hash`)));
  rmSync(root, { recursive: true, force: true });
}

// ── 4. a hash sidecar left behind by an EARLIER plant of the same file (stale fingerprint) ────────
{
  const { root, abs, sidecar, ORIGINAL } = fresh('false', 'lf');
  const OLD_PLANT = `${ORIGINAL}export const old = 1;\n`;
  writeFileSync(sidecar, ORIGINAL, 'utf8');
  notePlant(abs, OLD_PLANT); // fingerprint of a plant that is no longer on disk
  delete process.env.PLANT_SAFETY_LIVE;
  writeFileSync(`${sidecar}.plant-owner`, DEAD_PID, 'utf8');
  const MY_WORK = `${ORIGINAL}export const myWork = 42;\n`;
  writeFileSync(abs, MY_WORK, 'utf8');
  const r = preflightRestore(root);
  say('STALE fingerprint + real uncommitted work', `recovered=${r.recovered.length} refused=${r.refused.length} work-survives=${readFileSync(abs, 'utf8') === MY_WORK}`);
  rmSync(root, { recursive: true, force: true });
}

// ── 5. the target is dirty AND its bytes happen to equal the recorded plant, but HEAD has moved ───
{
  const { root, abs, sidecar, ORIGINAL } = fresh('false', 'lf');
  const PLANT = `${ORIGINAL}export const planted = 9;\n`;
  writeFileSync(sidecar, ORIGINAL, 'utf8');
  notePlant(abs, PLANT);
  delete process.env.PLANT_SAFETY_LIVE;
  writeFileSync(`${sidecar}.plant-owner`, DEAD_PID, 'utf8');
  writeFileSync(abs, PLANT, 'utf8');
  // somebody committed the PLANT in the meantime (git add -A — the path this cluster has already shipped)
  const git = (...a: string[]) => execFileSync('git', a, { cwd: root, encoding: 'utf8' });
  git('add', '-A');
  git('-c', 'commit.gpgsign=false', 'commit', '-qm', 'oops');
  const r = preflightRestore(root);
  say('the plant was COMMITTED, then the pre-flight runs', `recovered=${r.recovered.length} refused=${r.refused.length} plant-still-on-disk=${readFileSync(abs, 'utf8') === PLANT}`);
  say('  …sidecar dropped (the only record of the original)', String(!existsSync(sidecar)));
  rmSync(root, { recursive: true, force: true });
}

rows.forEach((r) => console.log(r));
