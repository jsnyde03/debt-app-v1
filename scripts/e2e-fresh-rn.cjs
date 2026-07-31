#!/usr/bin/env node
/**
 * Fresh, correct-by-construction e2e run for the RN app — the `apps/rn` twin of `e2e-fresh.cjs`.
 *
 * Sets CI=1, which flips `apps/rn/playwright.config.ts` to `reuseExistingServer: false`: Playwright
 * re-exports `apps/rn/dist` FRESH, serves it on :4319, runs the suite, and tears the server down.
 *
 * Why this exists (3.5.3.2, 2026-07-31): a `serve` left running on :4319 from a PREVIOUS session is
 * reused silently by a plain `npm run test:e2e:rn`, so the suite runs against a day-old bundle. It cost
 * a confusing false RED here — but the same trap gives a false GREEN just as easily, which is the
 * version that ships a bug. Owning the server lifecycle is the fix; this makes that one command.
 *
 * Extra args pass through, e.g. `npm run e2e:fresh:rn -- tutorial-invite`.
 */
const { spawnSync } = require("node:child_process");

process.env.CI = "1";

const result = spawnSync("npx", ["playwright", "test", "--config", "apps/rn/playwright.config.ts", ...process.argv.slice(2)], {
    stdio: "inherit",
    shell: true,
});

process.exit(result.status ?? 1);
