/**
 * [S1.10.6.5.8.5 · GAP-12] — **THE `\r` SWEEP GETS A BEHAVIOURAL GUARD, NOT A SYNTACTIC ONE.**
 *
 * ⛔ **The class is real and CI cannot see it.** 30 sites were moved to `split(/\r?\n/)` because a `\r`
 * left on the end of a line breaks anchored matches and equality comparisons. CI runs on
 * **`ubuntu-latest`**, an LF-only checkout, so a reintroduced defect **cannot red there even in
 * principle** — it reds only on a Windows clone, which is where it was found.
 *
 * ⚡ **GAP-12 PROPOSED BANNING `split('\n')`, AND THAT WAS MEASURED AND REJECTED.** The repo holds
 * **12** such sites today and **every one is benign** on inspection: five split an in-process
 * `Error.message`, one an in-process `ariaSnapshot()`, three split `git ls-files` output (git emits LF
 * terminators regardless of `core.autocrlf`), and the rest `.trim()` each line or match with an
 * anchor-free regex. A ban would ship **12 exemptions against 1 rule** — a gate that is mostly exemption
 * is a gate nobody believes, and this cluster has already paid for one of those.
 *
 * ⭐ **So the guard is behavioural**: a fixture of REAL CRLF bytes, and the assertion that the stripper
 * all eleven gates depend on is line-ending faithful. If it ever becomes `\r`-naive, all eleven change
 * verdict at once — that is the failure worth pinning, and it is pinned by behaviour rather than by
 * grepping for a spelling.
 *
 * ⛔ **THE FIRST VERSION OF THIS FILE WAS VACUOUS AND A PLANT PROVED IT.** It compared
 * `strip(crlf).replace(/\r\n/g, '\n')` against `strip(lf)` — which **normalises away the very thing
 * under test** — so a stripper rewritten to delete every `\r` passed it unchanged. Measured, not
 * reasoned: planting `scan(src.split('\r').join(''), false)` left the file green. The load-bearing
 * assertion is that the endings **survive**.
 *
 * ⚠️ **`.gitattributes` marks the fixture `-text`**, so git cannot normalise it on checkout. The controls
 * below assert the CRLF bytes actually survived — **without them this file compares a string to itself
 * and passes forever.**
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { stripCommentsAndStrings, stripCommentsOnly } from './lib/stripCode';

const FIXTURE = join(import.meta.dirname, '__fixtures__', 'crlf-source.ts.txt');

let passed = 0;
const failures: string[] = [];
function check(cond: boolean, label: string) {
  if (cond) passed++;
  else failures.push(label);
}

const crlf = readFileSync(FIXTURE, 'utf8');
const lf = crlf.replace(/\r\n/g, '\n');

// ── The non-vacuity controls ───────────────────────────────────────────────────────────────────────
const crlfCount = (crlf.match(/\r\n/g) ?? []).length;
check(crlfCount >= 5, `the fixture still carries CRLF bytes (${crlfCount}) — .gitattributes -text is holding`);
check(!/[^\r]\n/.test(crlf), 'the fixture carries NO bare LF — a mixed file tests neither ending cleanly');
check(crlf !== lf, 'the two inputs genuinely differ (the control for every comparison below)');

// ── The property that catches a \r-eating stripper ─────────────────────────────────────────────────
for (const [name, strip] of [
  ['stripCommentsOnly', stripCommentsOnly],
  ['stripCommentsAndStrings', stripCommentsAndStrings],
] as [string, (s: string) => string][]) {
  const out = strip(crlf);

  // ⛔ THE ONE THE VACUOUS VERSION MISSED. Eleven gates split this output with `split(/\r?\n/)`; that
  // idiom is only correct if the `\r` is still there to be optional about.
  const kept = (out.match(/\r\n/g) ?? []).length;
  check(
    kept === crlfCount,
    `${name} PRESERVES every CRLF (${kept} of ${crlfCount}) — a stripper that eats \r changes what all ` +
      'eleven consumer gates see, and not one of them would report it',
  );

  // The complement: a stripper could preserve endings and still blank the wrong columns. Kept for that,
  // NOT relied on alone — on its own this is the assertion that was vacuous.
  check(out.replace(/\r\n/g, '\n') === strip(lf), `${name} strips the same CONTENT under both endings`);
  check(
    out.split(/\r?\n/).length === strip(lf).split('\n').length,
    `${name} preserves the line count across endings`,
  );
}

// ── The DISCRIMINATING control ─────────────────────────────────────────────────────────────────────
// ⛔ Proves the fixture can tell the two idioms apart. Without it, everything above could pass on a
// fixture git had quietly normalised — the failure `.gitattributes -text` exists to prevent, asserted
// rather than trusted.
const naive = stripCommentsOnly(crlf).split('\n').filter((l) => l.endsWith('\r')).length;
const safe = stripCommentsOnly(crlf).split(/\r?\n/).filter((l) => l.endsWith('\r')).length;
check(naive >= 5, `the NAIVE idiom leaves ${naive} lines carrying a trailing CR — the defect class, reproduced`);
check(safe === 0, `the SAFE idiom leaves ${safe} — this is what the eleven gates use`);
check(naive !== safe, 'the fixture DISCRIMINATES the two idioms (if it did not, nothing above means anything)');

if (failures.length > 0) {
  console.error(`\n❌ line endings: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error(
    '\n  ⛔ CI is ubuntu-latest and cannot see this class. A `\r` mishandled in the stripper changes\n' +
      '  anchored matching in all eleven gates that route their input through lib/stripCode.\n',
  );
  process.exit(1);
}

console.log(`✅ line endings: stripCode is CRLF-faithful (${passed} assertions, fixture holds ${crlfCount} CRLF).`);
