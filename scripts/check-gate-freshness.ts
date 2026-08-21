/**
 * [D49] — IS THE RECORDED GREEN STILL TRUE? Reds when source has moved since the gate last passed.
 *
 * ⛔ **THIS IS DELIBERATELY *NOT* WIRED INTO `lint:rn`, AND THE PLAN SAID TO WIRE IT THERE.** Building it
 * surfaced why that cannot work: `lint:rn` runs INSIDE `validate:release:rn`, second of eight links. Edit
 * a source file and the record is stale by definition — so the check would red, `lint:rn` would abort,
 * and the gate could never reach the step that refreshes the record. **A freshness check inside the thing
 * that establishes freshness is a deadlock**, and it locks hardest in exactly the state you most need the
 * gate: source has changed. (A textbook [[preauthored-items-fail-two-ways]] miss — the premise survived
 * the switch-in before-scan intact, because the before-scan confirms a thing exists, not that it works.)
 *
 * ⚡ **So it is a top-level script, and the consumer is whoever is about to CLAIM the gate is green** —
 * which is precisely who failed. Three sessions in a row wrote "last green: …" into a document from
 * memory while CI was red on every push. `npm run lint:gate-freshness` answers that question in under a
 * second, from the record the gate wrote itself, and it cannot be answered from memory at all.
 *
 * ⚠️ Freshness turns on a CONTENT FINGERPRINT, not on the SHA — see `gateSources.ts`. Uncommitted work is
 * a source change like any other, and the failure this exists for happened on a tree with both kinds.
 *
 * Usage: npm run lint:gate-freshness
 */
import { readFileSync } from 'node:fs';

import { fingerprintSources, GATE_STATUS_FILE, type GateStatus } from './gateSources';

function fail(lines: string[]): never {
  console.error(`\n❌ lint:gate-freshness — ${lines[0]}\n`);
  for (const l of lines.slice(1)) console.error(`   ${l}`);
  console.error('');
  process.exit(1);
}

let status: GateStatus;
try {
  status = JSON.parse(readFileSync(GATE_STATUS_FILE, 'utf8')) as GateStatus;
} catch {
  fail([
    'no gate-status.json — the gate has never recorded a pass on this tree.',
    'Run `npm run validate:release:rn`. It writes the record itself, on success only.',
    '⛔ Until then there is no green to inherit, and "I remember it passing" is the exact',
    '   failure [D49] exists to make impossible.',
  ]);
}

const { hash, fileCount } = fingerprintSources();

if (hash !== status.sourceHash) {
  fail([
    'SOURCE HAS CHANGED since the gate last passed — the recorded green does not describe this tree.',
    `recorded: ${status.sha.slice(0, 7)} · ${status.at} · ${status.fileCount} files`,
    `now:      ${fileCount} files · fingerprint differs`,
    '',
    '⛔ Do NOT carry the recorded result forward. Run `npm run validate:release:rn`.',
    '   This is the shape that went wrong: the gate was red from f4e5e11 to 2026-08-20 and three',
    '   sessions recorded it green, each reasoning "no source touched THIS session" over a tree',
    '   where source had moved. A remembered gate result is an unrun one.',
  ]);
}

const age = Date.now() - Date.parse(status.at);
const days = Math.floor(age / 86_400_000);
console.log(
  `✅ lint:gate-freshness — the recorded pass still describes this tree ` +
    `(${status.sha.slice(0, 7)} · ${status.at}${days > 0 ? ` · ${days}d ago` : ''} · ${fileCount} source files).`,
);
if (status.dirty) {
  console.log('   ⚠️  That pass ran on a DIRTY tree, so its SHA does not identify what was tested.');
  console.log('       The fingerprint does, and it matches — but do not quote the SHA as if it did.');
}
