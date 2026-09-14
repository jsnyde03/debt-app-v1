// Runner for the default-export suite, same call runAppTests.ts makes. Copy to apps/rn/src/__run_L2_las.ts.
import run from './liveActivity/liveActivitySync.test';

run().then(
  () => process.exit(0),
  (e) => { console.error(String(e && e.message ? `Error: ${e.message}` : e)); process.exit(1); },
);
