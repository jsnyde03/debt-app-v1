/**
 * Runs `dataRepairsCopy.test.ts` alone, so a plant on the repairs copy costs that one suite rather than all of `test:app`.
 * Handles either export shape (`default` or `run`) rather than assuming one. Exits non-zero on any throw.
 * Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { pathToFileURL } = require('node:url') as typeof import('node:url');
const ROOT = process.env.ROOT ?? 'C:/Users/Jason/debt-app-v1';

(async () => {
  const mod = await import(pathToFileURL(`${ROOT}/apps/rn/src/components/plan/dataRepairsCopy.test.ts`).href);
  const run = mod.default ?? mod.run;
  if (typeof run !== 'function') throw new Error(`dataRepairsCopy.test.ts exports no runnable function (keys: ${Object.keys(mod).join(', ')})`);
  await run();
  console.log('RUN-COPY-TEST: returned');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
