/**
 * Probe 2 — run the REAL `inWindowMinimum.test.ts` with the clock moved, nothing else changed.
 * `npx tsx <this> 2026-01-15`
 */
const target = process.argv[2];
const [y, m, d] = target.split("-").map(Number);
const FIXED = new Date(y, m - 1, d, 12, 0, 0).getTime();
const Real = Date;
class Faked extends Real {
  constructor(...args: any[]) {
    if (args.length === 0) super(FIXED);
    else super(...(args as []));
  }
  static now() { return FIXED; }
}
(globalThis as any).Date = Faked;

import("../../../../apps/rn/src/store/inWindowMinimum.test.ts")
  .then(() => console.log(`\n=== ${target}: PASSED`))
  .catch((e) => console.log(`\n=== ${target}: RED -> ${(e as Error).message}`));
