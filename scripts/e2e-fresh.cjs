#!/usr/bin/env node
/**
 * Fresh, correct-by-construction e2e run — use after ANY app/CSS/build change.
 *
 * Sets CI=1, which flips playwright.config.ts to `reuseExistingServer: false`:
 * Playwright builds the static `out/` bundle FRESH, serves it, runs the suite,
 * and tears the server down — so you never accidentally test a stale warm
 * server (the trap that gives a false green on old code). CI=1 also applies the
 * functional-gate `testIgnore` (excludes the 3 screenshot/asset specs) and
 * `forbidOnly`, so this mirrors the CI gate locally, on a clean build.
 *
 * The webServer sets NEXT_PUBLIC_E2E=1 for its build, so the premium test seam
 * is present. Extra args pass through, e.g. `npm run e2e:fresh -- planner-history-flow`.
 *
 * Note: expects port 3000 free (no lingering warm server) — the standing
 * practice is to let this command own the server lifecycle, not a background serve.
 */
const { spawnSync } = require("node:child_process");

process.env.CI = "1";

const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
    stdio: "inherit",
    shell: true,
});

process.exit(result.status ?? 1);
