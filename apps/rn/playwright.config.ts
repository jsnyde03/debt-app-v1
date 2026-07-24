import path from 'path';

import { defineConfig, devices } from '@playwright/test';

/**
 * RS.6 — Playwright e2e for the RN WEB app (`apps/rn`). Distinct from the root `playwright.config.ts`,
 * which targets the LEGACY Capacitor/Next.js app on :3000. The Guardian surfaces live only in the RN
 * app, which had no e2e harness — this stands one up.
 *
 * Serves the STATIC web export (`expo export --platform web` → `dist/`, an SPA), not Metro — the same
 * "serve the built bundle, not the dev server" reasoning as the legacy config (a live dev server
 * lazily compiles and flakes the first hit). Run: `npm run test:e2e:rn` from the repo root.
 */

const PORT = 4319;
const RN_DIR = __dirname;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // Build the static web export, then serve it as an SPA (-s → index.html fallback for the router).
    command: `npm --prefix "${RN_DIR}" run export:web && npx serve "${path.join(RN_DIR, 'dist')}" -l ${PORT} -s`,
    url: `http://localhost:${PORT}`,
    // Locally, reuse a hand-started `serve` on :4319 for fast iteration (skips the ~2min re-export).
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } }],
});
