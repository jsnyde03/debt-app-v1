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
    command: `npm --prefix "${RN_DIR}" run export:web && npx serve "${path.join(RN_DIR, 'dist')}" -l ${PORT} -s`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } }],
});
