import { defineConfig, devices} from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 30_000,
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
    },
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
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
    ],

});