import { defineConfig, devices} from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    // CI gate = functional regression only. The screenshot/asset-generation specs still ride the
    // old pre-seed-helper pattern and reference pre-2.8 UI (e.g. a "Dark Mode" button the settings
    // rework replaced with a 3-way selector), so they fail as automated gates — tracked for the v1.6
    // seed migration. Exclude them from CI only; they still run locally for asset regeneration.
    testIgnore: process.env.CI
        ? [
              "**/app-store-screenshots.spec.ts",
              "**/planner-mobile-screenshots.spec.ts",
              "**/planner-visual-state-shots.spec.ts",
          ]
        : [],
    timeout: 60_000,
    // Retry once so a genuinely flaky step gets a second chance without masking
    // a hard failure (a test that only passes on retry still surfaces as flaky).
    retries: 1,
    // A hardened release gate must never pass with a stray `.only` left in a spec.
    forbidOnly: !!process.env.CI,
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
    },
    webServer: {
        // Serve the exported production build, not `next dev`. `next dev` compiles
        // routes lazily on first hit, so the first test to touch a route eats the
        // cold-start compile and flakes on timeout. This app is `output: "export"`
        // (static bundle for Capacitor), so the build emits `out/` and we serve it
        // statically — `next start` is invalid for an exported app. One warm server
        // is shared across every project/suite in the run.
        command: "npm run build && npm run serve:export -- -l 3000",
        url: "http://localhost:3000",
        // Enable the dev/test subscription seam in this production build ONLY (real
        // shipped builds never set this), so premium flows are testable. See useSubscription.ts.
        env: { NEXT_PUBLIC_E2E: "1" },
        // Reuse a warm server locally for fast iteration; always build fresh in CI.
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        // Windows teardown trap: without a graceful shutdown, the `serve` webServer process tree
        // can linger after the run, so the test process hangs on teardown (~5 min force-kill) and
        // POISONS the local exit code (a pass can read as a hang, red as green). SIGTERM + a short
        // wait lets `serve` exit cleanly. CI (ubuntu) was never affected. If a local run still hangs
        // on teardown, trust the HTML report / test-results — NOT the shell exit code — or run
        // against a manually-started server (reuseExistingServer is true locally).
        gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    },
    projects: [
        {
            name: "mobile-chrome",
            use: {
                ...devices["Pixel 7"],
            },
        },
        {
            name: "iphone-pro-max",
            use: {
                ...devices["iPhone 15 Pro Max"],
            },
        },
        {
            name: "ipad-pro-11",
            use: {
                ...devices["iPad Pro 11"],
            },
        },
        {
            name: "ipad-pro-11-landscape",
            use: {
                ...devices["iPad Pro 11 landscape"],
            },
        },
    ],

});