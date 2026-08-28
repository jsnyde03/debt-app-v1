/**
 * ⛔ **THE STAND-IN GUARD for `prove:guards --selftest`.** It reds when the marker in
 * `prove-guards-target.ts` is gone and is green otherwise — nothing more, so the self-test measures the
 * HARNESS rather than any real gate.
 *
 * ⚠️ **Its green line prints a token too** (`PROBE: ok`), so the DEAD half of the self-test can assert
 * `failed-open` **alone**: with an `expect` the green output satisfies, `wrong-reason` cannot fire and
 * mask which failure was actually measured.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(import.meta.dirname, 'prove-guards-target.ts');
const text = readFileSync(target, 'utf8');

if (!text.includes("MARKER = 'the guard holds'")) {
  console.error('PROBE: the guard is gone');
  process.exit(1);
}
console.log('PROBE: ok');
