import { defineConfig, devices } from "@playwright/test";

// Temporary config: the default port 3000 is occupied by another app's
// dev server, so run the debt planner on 3100 for isolated verification.
export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60_000,
    use: {
        baseURL: "http://localhost:3100",
        trace: "on-first-retry",
    },
    webServer: {
        command: "npm run dev -- --port 3100",
        url: "http://localhost:3100",
        reuseExistingServer: true,
        timeout: 120_000,
    },
    projects: [
        { name: "ipad-pro-11", use: { ...devices["iPad Pro 11"] } },
        { name: "ipad-pro-11-landscape", use: { ...devices["iPad Pro 11 landscape"] } },
    ],
});
