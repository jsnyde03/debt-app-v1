/**
 * ⛔ **A STAND-IN FOR A WEB SERVER THAT NEVER CAME UP** — `prove:guards --selftest`, case D.
 *
 * Under the plant it emits Playwright's own message verbatim and exits non-zero. That is the exact
 * shape measured at ~1 in 3 on real proofs (`S1.13.7.12.3a`): the run reds, but no assertion in it ever
 * ran, so scoring it produces `reason=WRONG` — a FALSE FINDING against a guard that is fine.
 *
 * ⚠️ Green otherwise, so the control half of `proveOne` behaves normally.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(import.meta.dirname, 'prove-guards-target.ts');
if (!readFileSync(target, 'utf8').includes("MARKER = 'the guard holds'")) {
  console.error('Error: Process from config.webServer was not able to start. Exit code: 3221226505');
  process.exit(1);
}
console.log('PROBE: ok');
