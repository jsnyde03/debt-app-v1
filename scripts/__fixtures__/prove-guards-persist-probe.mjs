/**
 * ⛔ **A STAND-IN FOR A GUARD THAT HOLDS BUT CANNOT BE RECORDED** — `prove:guards --selftest`, case P.
 *
 * Identical to `prove-guards-probe.mjs`. The write failure is not produced here: the self-test makes
 * `<registry>.tmp` a DIRECTORY, so the temp-then-rename write throws `EISDIR`.
 *
 * ⚠️ **A directory rather than a read-only file, deliberately** — `chmod 0o444` does not stop **root**,
 * and CI containers routinely run as root, so a permissions-based fixture would pass locally and prove
 * nothing in CI. `EISDIR` is refused for every user on every platform.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(import.meta.dirname, 'prove-guards-target.ts');
if (!readFileSync(target, 'utf8').includes("MARKER = 'the guard holds'")) {
  console.error('PROBE: the guard is gone');
  process.exit(1);
}
console.log('PROBE: ok');
