import { defineConfig, devices } from "@playwright/test";

// Temporary config: the default port 3000 is occupied by another app's
// dev server, so run the debt planner on 3100 for isolated verification.
export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60_000,
    retries: 1,
    forbidOnly: !!process.env.CI,
    use: {
        baseURL: "http://localhost:3100",
        trace: "on-first-retry",
    },
    webServer: {
        // Exported production build served statically (parity with the main config
        // — no `next dev` cold-start flake), on 3100 to avoid the default-port
        // collision. `next start` is invalid for this `output: "export"` app.
        command: "npm run build && npm run serve:export -- -l 3100",
        url: "http://localhost:3100",
        // Premium test seam in this production build only (never in shipped builds).
        env: { NEXT_PUBLIC_E2E: "1" },
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
    projects: [
        { name: "ipad-pro-11", use: { ...devices["iPad Pro 11"] } },
        { name: "ipad-pro-11-landscape", use: { ...devices["iPad Pro 11 landscape"] } },
    ],
});
