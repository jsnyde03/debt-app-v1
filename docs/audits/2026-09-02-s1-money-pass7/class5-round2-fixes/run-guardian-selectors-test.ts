/**
 * Runs `guardianSelectors.test.ts` alone, so a plant on the Guardian's band costs that one suite rather than all of `test:app`.
 *
 * ⛔ **The file runs ITSELF on load** — it ends `try { run(); } catch (err) { …; throw err; }` and exports nothing, and
 * `runAppTests.ts` loads it with a bare `await import(...)`. So importing it IS running it: a failing assert rethrows through that
 * `catch`, rejects the import, and exits non-zero here.
 *
 * ⚠️ Two earlier versions of this runner looked for an exported function — first the flat `default`, then `default.default` — both
 * shapes borrowed from OTHER test files instead of read from this one. Both reported a fault AFTER the suite had already run and
 * passed on import (117 asserts). A runner is an instrument: read how the thing under test is invoked before writing it.
 * Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1';

(async () => {
  await import(pathToFileURL(`${ROOT}/apps/rn/src/store/guardianSelectors.test.ts`).href);
  console.log('RUN-GUARDIAN-SELECTORS-TEST: imported, and it ran itself without throwing');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
