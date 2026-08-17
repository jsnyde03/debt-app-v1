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
    //
    // ⛔ `--clear` IS LOAD-BEARING HERE TOO, AND IT WAS MISSING FOR THREE DAYS. 3.5.7.4 measured the
    // matrix and wrote it into `playwright.embed.config.ts` — Metro's transform cache does NOT
    // invalidate on an `EXPO_PUBLIC_*` change:
    //
    //     flag=0, no --clear  →  sessionStorage=1  localStorage=0   ⛔ wrong artifact
    //     flag=0, --clear     →  sessionStorage=0  localStorage=1   ✅ correct
    //
    // …and then applied the fix to ONE of the two configs. The embed build (flag=1, `--clear`) is safe.
    // THIS build is the flag=0 row: after `test:e2e:embed` has run even once on a machine, the next
    // `export:web` reuses the embed's transforms and `dist/` comes out reading **sessionStorage**. The
    // e2e suite seeds through localStorage, so the app boots with no data and ~60 specs fail on missing
    // content — with nothing anywhere naming the cause.
    //
    // ⚡ MEASURED 2026-08-17, not reasoned: `dist/` and `dist-embed/` had the SAME content hash, and
    // `dist/`'s storage backing was inlined as `()=>globalThis.sessionStorage`. Grepping the artifact
    // settled in one command what reading the test could not — 3.5.7.4's own lesson, one config over.
    //
    // ⚠️ CI was green only by ORDERING: `test:e2e:rn` runs BEFORE `test:e2e:embed` and each job starts
    // with a cold cache. The gate was broken for the SECOND local run onward — the run a human does.
    command: `npm --prefix "${RN_DIR}" run export:web -- --clear && npx serve "${path.join(RN_DIR, 'dist')}" -l ${PORT} -s`,
    url: `http://localhost:${PORT}`,
    // Locally, reuse a hand-started `serve` on :4319 for fast iteration (skips the ~2min re-export).
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
  },
  projects: [{ name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } }],
});
