/**
 * [D49] extended at S0.13 — CAPTURE THE TREE AT THE **START** OF THE GATE RUN.
 *
 * ⚡ **The defect this closes** [P6.8.9.7.11.18 · S0.12 · REVERIFY-4 finding 1, `major`]: **nothing
 * fingerprinted the tree at the START of a run.** The record was written
 * by `write-gate-status.ts` as the last `&&` link of `validate:release:rn`, fingerprinting the
 * tree *then* — so a source file edited during the ~15-minute run was hashed into `gate-status.json` as
 * though the suites had seen it, and `lint:gate-freshness` then reported that the recorded pass still
 * described the tree. **Untested code shipping behind a green the instrument minted itself**, which is
 * [D49]'s own failure mode arriving through the gate built to close it.
 *
 * ⛔ **It was "closed" by a documentation rule** — a line in `DEBT_ELEVATION_PLAN.md` saying not to edit
 * source during a run — **in a class `write-gate-status.ts` itself argues a documentation rule cannot
 * close:** *"A documentation rule cannot fix that, because a documentation rule is exactly what failed.
 * The record has to be unforgeable, which means written by the thing it describes."* A reader of the two
 * scripts saw no mention of the window at all; they saw the contradicting sentence in the freshness gate.
 *
 * ⚠️ **DIRECTION CHECK, and the asymmetry is the whole argument.** This makes recording *stricter*, so its
 * failure mode is refusing to record a run that was genuinely green — a **false red**, which costs a
 * re-run and is loudly visible. The opposite policy (record anyway, flag it) admits a **false green**,
 * which is silent and ships. ⛔ **The failures are not symmetric, so an ambiguous run refuses to record.**
 *
 * ⚠️ **A SPEED BUMP, NOT A LOCK — same standing as `--from-gate`, and stating which is the point.** Anyone
 * with commit rights can run `gate:begin`, skip the suites and run `gate:record --from-gate` by hand. What
 * this removes is the *accidental* path: the mid-run edit nobody noticed. It does not, and cannot, stop a
 * deliberate forgery.
 *
 * Usage: npm run gate:begin   ·   the HEAD of `validate:release:rn`
 */
import { writeFileSync } from 'node:fs';

import { fingerprintDetail, GATE_RUN_FILE, type GateRunStart } from './gateSources';

const { hash, fileCount, files } = fingerprintDetail();

const start: GateRunStart = {
  at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  sourceHash: hash,
  fileCount,
  files,
};

writeFileSync(GATE_RUN_FILE, `${JSON.stringify(start)}\n`, 'utf8');

console.log(`✅ gate:begin — tree captured at start of run: ${fileCount} source files · ${hash.slice(0, 7)}…`);
