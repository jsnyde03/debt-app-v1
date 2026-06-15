import { chromium, devices } from "@playwright/test";
import path from "path";

const browser = await chromium.launch();
const context = await browser.newContext({
    ...devices["Pixel 7"],
});
const page = await context.newPage();
const outDir = "tmp-screens";

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Populate demo data so premium cards have real content to render.
const populateBtn = await page.$(".dev-populate-button");
if (populateBtn) {
    await populateBtn.click({ force: true });
    console.log("clicked populate demo data");
    await page.waitForTimeout(1500);
} else {
    console.log("no populate button found");
}

const isDarkInitial = await page.evaluate(() => document.querySelector(".app")?.classList.contains("dark-theme"));
console.log("initial dark:", isDarkInitial);

await page.screenshot({ path: path.join(outDir, "01-plan-light.png"), fullPage: true });

// Toggle to dark mode
const toggle = await page.$(".theme-toggle");
if (toggle) {
    await toggle.click({ force: true });
    await page.waitForTimeout(600);
} else {
    console.log("no theme toggle found");
}

const isDarkAfter = await page.evaluate(() => document.querySelector(".app")?.classList.contains("dark-theme"));
console.log("after toggle dark:", isDarkAfter);

await page.screenshot({ path: path.join(outDir, "02-plan-dark.png"), fullPage: true });

// Go to snowball tab to capture strategy/what-if cards and upgrade modal
const navButtons = await page.$$(".bottom-nav-item");
console.log("nav buttons:", navButtons.length);
for (const btn of navButtons) {
    const text = await btn.textContent();
    if (text && text.toLowerCase().includes("snowball")) {
        await btn.click({ force: true });
        break;
    }
}
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(outDir, "03-snowball-dark.png"), fullPage: true });

// Try to open the upgrade modal
const upgradeBtn = await page.$("button:has-text('Upgrade')");
if (upgradeBtn) {
    await upgradeBtn.click({ force: true });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, "04-upgrade-dark.png"), fullPage: true });
} else {
    console.log("no upgrade button found on snowball tab");
}

// Switch back to light mode while modal/snowball still visible
const toggle2 = await page.$(".theme-toggle");
if (toggle2) {
    await toggle2.click({ force: true });
    await page.waitForTimeout(600);
}
await page.screenshot({ path: path.join(outDir, "05-upgrade-light.png"), fullPage: true });

await browser.close();
