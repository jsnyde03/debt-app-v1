import { type Page, type Locator } from "@playwright/test";

/** Click the top-level Bills nav item (bottom nav on phone, sidebar on iPad). */
export async function gotoBills(page: Page): Promise<void> {
    await page
        .locator(".bottom-nav-item:visible, .sidebar-nav-item:visible")
        .filter({ hasText: /Bills/i })
        .first()
        .click();
}

/**
 * Navigate to Bills and focus the Expenses or Debts section, returning a locator
 * scoped to that section's column.
 *
 * Phone (single column) has a sub-tab switcher — click it to reveal the section.
 * iPad's two-column layout (≥834px) shows BOTH columns with no switcher, so the
 * switcher is absent and there are two "+ Add" buttons on screen; scoping to the
 * column locator disambiguates, and works identically on phone.
 */
export async function billsSection(page: Page, section: "expenses" | "debts"): Promise<Locator> {
    await gotoBills(page);

    const tab = page
        .locator(".mobile-section-switcher")
        .getByRole("button", { name: section === "expenses" ? /Expenses/i : /Debts/i });
    if (await tab.isVisible().catch(() => false)) {
        await tab.click();
    }

    return page.locator(section === "expenses" ? ".bills-expenses-col" : ".bills-debts-col");
}
