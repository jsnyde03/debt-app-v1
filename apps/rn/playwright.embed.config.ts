import path from 'path';

import { defineConfig, devices } from '@playwright/test';

/**
 * 3.5.7.4 — THE EMBED'S PRIVACY GATE.
 *
 * [D32] makes 3.5.7's privacy stance **a gate, not a promise**: the embed is the one surface where
 * *"financial data never leaves your device"* is easiest to doubt, because it is a web page. So the
 * claims are held by a test that runs on every push rather than asserted in prose and re-checked at
 * review time.
 *
 * ⛔ A SEPARATE CONFIG, AND IT HAS TO BE. `EXPO_PUBLIC_EMBED` is INLINED by the bundler, so the embed is
 * a different artifact from the app — `playwright.config.ts`'s server builds without the flag. Adding a
 * spec there would have asserted the three claims against the build that does NOT ship publicly, which
 * is this repo's own "green while testing nothing" failure ([D30]'s named void condition, and the
 * 744pt-iPad-mini run that committed it).
 *
 * ⚠️ Its own `--output-dir` and its own port, so the two builds can never overwrite or shadow each
 * other. `dist-embed/` is generated; it is git-ignored alongside `dist/`.
 */

const PORT = 4320;
const RN_DIR = __dirname;
const OUT = path.join(RN_DIR, 'dist-embed');

export default defineConfig({
  testDir: './tests/embed',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // ⛔ `--clear` IS LOAD-BEARING, AND IT IS MEASURED. Metro's transform cache does NOT invalidate on an
    // `EXPO_PUBLIC_*` change, so an embed export can silently reuse transforms produced by the APP build:
    //
    //     flag=0, no --clear  →  sessionStorage=1  localStorage=0   ⛔ wrong artifact
    //     flag=0, --clear     →  sessionStorage=0  localStorage=1   ✅ correct
    //
    // Without it the flag is advisory. ⚡ Found because a planted defect PASSED — and the first
    // conclusion, "the gate is vacuous", was wrong: the gate was fine and the PLANT had not changed the
    // build. Grepping the artifact settled in one command what reasoning about the test could not.
    // ⚠️ Costs a cold export on every gate run. Correctness over speed here: this is the test standing
    // behind a public privacy claim, and a cached artifact is the one failure it cannot survive.
    command:
      `npm --prefix "${RN_DIR}" run export:web -- --output-dir "${OUT}" --clear ` +
      `&& npx serve "${OUT}" -l ${PORT} -s`,
    // ⭐ THE FLAG IS SET HERE AND NOWHERE ELSE. It is what makes this build the embed: `sessionStorage`
    // instead of `localStorage` (3.5.7.3). Drop it and the storage assertion fails — the intended
    // failure, not a flake.
    // ⚠️ Playwright's own `env`, deliberately NOT a `VAR=1 cmd` prefix and NOT `cross-env`: the prefix
    // form is not portable to Windows shells, and `cross-env` is not a dependency of this repo (checked,
    // not assumed) — adding one to set a single variable Playwright already supports setting.
    env: { EXPO_PUBLIC_EMBED: '1' },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
  projects: [{ name: 'embed-chrome', use: { ...devices['Desktop Chrome'] } }],
});
