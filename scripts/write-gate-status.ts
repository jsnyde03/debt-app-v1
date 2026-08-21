/**
 * [D49] — THE GATE WRITES ITS OWN RECORD. This runs as the LAST link of `validate:release:rn`.
 *
 * ⛔ **On success only, and that is structural rather than a check inside this file.** It is the final
 * `&&` in the chain, so npm never reaches it unless every suite before it exited 0. There is no code path
 * here that could record a green for a red run, because there is no code path here at all until the run
 * is already green.
 *
 * ⚡ **The failure this kills:** `validate:release:rn` was RED from `f4e5e11` (2026-08-19) to 2026-08-20
 * while three consecutive sessions carried a "last green" forward in a document and CI failed on every
 * push the whole time. Each session reasoned correctly from a false premise — *"no source touched **this
 * session**"* — over a tree where source HAD moved. ⛔ **A documentation rule cannot fix that, because a
 * documentation rule is exactly what failed.** The record has to be unforgeable, which means written by
 * the thing it describes. Same [D31] move as `lint:closure`: turn the class into a gate.
 *
 * Usage: npm run gate:record   ·   the tail of `validate:release:rn`
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

import { fingerprintSources, GATE_STATUS_FILE, REPO_ROOT, type GateStatus } from './gateSources';

// ⛔ [D49] says the record is "written BY the gate, NEVER typed into a document" — and a script anyone can
// run by hand is a document with extra steps. `validate:release:rn` passes `--from-gate`; nothing else
// does. Found while mutation-verifying this very file: testing it meant running `npm run gate:record`
// directly, which wrote a green record for a gate run that had not happened. If I can forge it by
// accident while building it, so can a session in a hurry.
//
// ⚠️ It is a SPEED BUMP, not a lock, and stating which is the point. Anyone with commit rights can pass
// the flag or edit the JSON; what this removes is the *easy* wrong path, so that recording a false green
// takes a deliberate act rather than a plausible-looking one-liner.
if (!process.argv.includes('--from-gate')) {
  console.error('\n❌ gate:record is not a standalone command.\n');
  console.error('   [D49]: a green gate is RECORDED BY THE GATE, never typed. This writes the record that');
  console.error('   `lint:gate-freshness` trusts, so running it by hand would forge exactly the claim the');
  console.error('   decision exists to make impossible.\n');
  console.error('   Run `npm run validate:release:rn` — it calls this itself, as its final link, and only');
  console.error('   reaches it if every suite before it passed.\n');
  process.exit(1);
}

function git(...args: string[]): string {
  // ⚠️ `-C REPO_ROOT` always. The cwd drifts between repos in this workspace often enough that the plan's
  // own Env row says so; a status written from the wrong repo would be worse than none.
  return execFileSync('git', ['-C', REPO_ROOT, ...args], { encoding: 'utf8' }).trim();
}

let sha = 'unknown';
let dirty = false;
try {
  sha = git('rev-parse', 'HEAD');
  // Porcelain over the whole tree — untracked included. A new, uncommitted source file is a source change.
  dirty = git('status', '--porcelain').length > 0;
} catch {
  // Not a git checkout (a tarball, a CI shallow oddity). The fingerprint still works and is what
  // freshness turns on, so record what we have rather than refusing to record anything.
}

const { hash, fileCount } = fingerprintSources();

const status: GateStatus = {
  sha,
  at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  sourceHash: hash,
  fileCount,
  dirty,
};

// ⚠️ Trailing newline, stable key order, 2-space indent — this file is COMMITTED, and a record that
// reformats itself on every run turns every gate run into a spurious diff.
writeFileSync(GATE_STATUS_FILE, `${JSON.stringify(status, null, 2)}\n`, 'utf8');

console.log(`✅ gate-status.json written — ${sha.slice(0, 7)} · ${status.at} · ${fileCount} source files${dirty ? ' · TREE WAS DIRTY' : ''}`);
if (dirty) {
  // Not a failure: running the gate before committing is the normal, correct workflow. But the SHA in
  // this record does NOT identify what was tested, so say so at the moment it is recorded rather than
  // letting someone infer it later from a commit hash that never contained the tested bytes.
  console.log('   ⚠️  The recorded SHA does not fully identify what was tested. Freshness turns on the');
  console.log('       source fingerprint, which does — but quote the fingerprint, not the SHA, if it matters.');
}
