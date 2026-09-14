/**
 * L1 — run ONE app-layer test file the way `runAppTests.ts` does: import it (it self-runs, or default-exports
 * its runner) and exit non-zero on any throw.
 * Usage (from <tree>/apps/rn): npx tsx --tsconfig <tree>/apps/rn/tsconfig.json run-test.ts <abs path to *.test.ts>
 */
import { pathToFileURL } from 'node:url';

async function main() {
  const target = process.argv[2];
  if (!target) throw new Error('run-test: no test path given');
  const mod = (await import(pathToFileURL(target).href)) as { default?: unknown };
  const runner = (mod.default as { default?: unknown } | undefined)?.default ?? mod.default;
  if (typeof runner === 'function') await (runner as () => Promise<void>)();
  console.log(`RUN-TEST DONE ${target}`);
}
main().catch((e) => {
  console.error(`RUN-TEST RED: ${(e as Error).message}`);
  process.exit(1);
});
