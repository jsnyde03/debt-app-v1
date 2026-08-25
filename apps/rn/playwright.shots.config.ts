import path from 'path';

import { defineConfig, devices } from '@playwright/test';

/**
 * 3.5.8.7 — the evidence config. Same app, same server as `playwright.config.ts`; different job.
 *
 * Separate because `tests/e2e` is the release gate and everything in it is an assertion that can fail.
 * The demo beat-shooter asserts nothing — it produces the web reference set the native capture is judged
 * against — and putting it in the gate would spend ~50s of every `validate:release:rn` on screenshots
 * nobody is reading that run.
 *
 * `npm run shots:demo` (from `apps/rn`, or `npm run shots:demo` at the root).
 */

const PORT = 4319;
const RN_DIR = __dirname;

export default defineConfig({
  testDir: './tests/shots',
  testMatch: '**/*.shot.ts',
  timeout: 180_000,
  // Evidence, not a gate: a retry would silently overwrite the very frames being investigated with a
  // second attempt's, which is the opposite of what this exists to produce.
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    // ⛔ **[P6.8.9.7.11.14.3] `--clear`, AND THIS IS THE THIRD CONFIG TO NEED IT.** 3.5.7.4 measured that
    // Metro's transform cache does NOT invalidate on an `EXPO_PUBLIC_*` change, and wrote the fix into
    // `playwright.embed.config.ts`. `playwright.config.ts`'s own comment then records applying it to *"ONE
    // of the two configs"* — and nobody looked at the third. This one exports flag-free, so after any
    // `test:e2e:embed` run (flag=1) it could reuse the embed's transforms and emit a `dist/` whose storage
    // backing is `sessionStorage`.
    //
    // ⚡ **That failure is worse HERE than in the gate.** `reseed` writes `localStorage`, so the matrix
    // would photograph the un-seeded app — 300+ plausible frames of the wrong state, which is precisely
    // the *"photographs the wrong thing, quietly"* class this instrument exists to catch, turned on the
    // instrument itself. ⚠️ Not re-measured for THIS config; the mechanism is the one already measured
    // and the fix costs a cold export, so the cheap side of the bet is to take it.
    command: `npm --prefix "${RN_DIR}" run export:web -- --clear && npx serve "${path.join(RN_DIR, 'dist')}" -l ${PORT} -s`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } }],
});
