/**
 * Runs `trustSelectors.test.ts` alone (the file `runAppTests.ts:313` awaits as `.default()`), so a plant on it costs the one
 * suite, not the whole of test:app. Run from the worktree's apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/audit-c5r1-L3';

(async () => {
  const mod = await import(pathToFileURL(`${ROOT}/apps/rn/src/store/trustSelectors.test.ts`).href);
  await mod.default();
  console.log('RUN-TRUST-TEST: default() returned');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
