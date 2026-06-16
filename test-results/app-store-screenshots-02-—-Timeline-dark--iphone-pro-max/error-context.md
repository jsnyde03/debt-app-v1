# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-store-screenshots.spec.ts >> 02 — Timeline (dark)
- Location: tests\e2e\app-store-screenshots.spec.ts:212:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.bottom-nav-item').filter({ hasText: /Plan/i })
    - locator resolved to <button type="button" class="bottom-nav-item active">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <nextjs-portal></nextjs-portal> from <script data-nextjs-dev-overlay="true">…</script> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <nextjs-portal></nextjs-portal> from <script data-nextjs-dev-overlay="true">…</script> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    36 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <nextjs-portal></nextjs-portal> from <script data-nextjs-dev-overlay="true">…</script> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - button "Populate Demo Data" [ref=e5] [cursor=pointer]
      - generic [ref=e6]:
        - heading "Debt Planner" [level=1] [ref=e7]
        - paragraph [ref=e8]: Enter a paycheck and see exactly what to do next.
        - paragraph [ref=e9]: Saved locally · 9:24 PM
        - button "Switch To Light Mode" [ref=e10] [cursor=pointer]: ☀
      - button "Open Plan Settings" [ref=e12] [cursor=pointer]: ⚙
      - generic [ref=e13]:
        - generic [ref=e15]:
          - heading "This Paycheck" [level=2] [ref=e16]
          - paragraph [ref=e17]: You're on track this cycle.
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: Required
            - strong [ref=e21]: $1,493.00
          - generic [ref=e22]:
            - generic [ref=e23]: Extra Payoff
            - strong [ref=e24]: $357.00
          - generic [ref=e25]:
            - generic [ref=e26]: Remaining Cushion
            - strong [ref=e27]: $357.00
          - generic [ref=e28]:
            - generic [ref=e29]: Status
            - strong [ref=e30]: On Track
        - generic [ref=e31]:
          - button "Required Actions Bills and minimums due this paycheck. 7 ▼" [ref=e32] [cursor=pointer]:
            - generic [ref=e33]:
              - generic [ref=e34]:
                - heading "Required Actions" [level=2] [ref=e35]
                - paragraph [ref=e36]: Bills and minimums due this paycheck.
              - generic [ref=e37]: "7"
            - generic [ref=e38]: ▼
          - generic [ref=e39]:
            - generic [ref=e40]:
              - generic:
                - generic: → Mark Paid
              - generic [ref=e41]:
                - generic [ref=e42]:
                  - generic [ref=e43]: Pay Rent
                  - generic [ref=e44]: Due 2026-06-18
                - generic [ref=e45]:
                  - strong [ref=e46]: $850.00
                  - button "Mark Paid" [ref=e47] [cursor=pointer]
            - generic [ref=e48]:
              - generic:
                - generic: → Mark Paid
              - generic [ref=e49]:
                - generic [ref=e50]:
                  - generic [ref=e51]:
                    - text: Reserve autopay for Electric
                    - generic [ref=e52]: Autopay
                  - generic [ref=e53]: Due 2026-06-20
                - generic [ref=e54]:
                  - strong [ref=e55]: $95.00
                  - button "Mark Paid" [ref=e56] [cursor=pointer]
            - generic [ref=e57]:
              - generic:
                - generic: → Mark Paid
              - generic [ref=e58]:
                - generic [ref=e59]:
                  - generic [ref=e60]:
                    - text: Reserve autopay for Internet
                    - generic [ref=e61]: Autopay
                  - generic [ref=e62]: Due 2026-06-22
                - generic [ref=e63]:
                  - strong [ref=e64]: $65.00
                  - button "Mark Paid" [ref=e65] [cursor=pointer]
            - generic [ref=e66]:
              - generic:
                - generic: → Mark Paid
              - generic [ref=e67]:
                - generic [ref=e68]:
                  - generic [ref=e69]: Pay Car Insurance
                  - generic [ref=e70]: Due 2026-06-25
                - generic [ref=e71]:
                  - strong [ref=e72]: $138.00
                  - button "Mark Paid" [ref=e73] [cursor=pointer]
            - generic [ref=e74]:
              - generic:
                - generic: → Mark Paid
              - generic [ref=e75]:
                - generic [ref=e76]:
                  - generic [ref=e77]: Pay minimum on Capital One Platinum
                  - generic [ref=e78]: Due 2026-06-21
                - generic [ref=e79]:
                  - strong [ref=e80]: $75.00
                  - button "Mark Paid" [ref=e81] [cursor=pointer]
            - generic [ref=e82]:
              - generic:
                - generic: → Mark Paid
              - generic [ref=e83]:
                - generic [ref=e84]:
                  - generic [ref=e85]:
                    - text: Reserve autopay minimum for Car Loan
                    - generic [ref=e86]: Autopay
                  - generic [ref=e87]: Due 2026-06-24
                - generic [ref=e88]:
                  - strong [ref=e89]: $245.00
                  - button "Mark Paid" [ref=e90] [cursor=pointer]
            - button "Show 1 More" [ref=e91] [cursor=pointer]
        - button "Recommended Actions 1 Best next move for this paycheck. ▼" [ref=e93] [cursor=pointer]:
          - generic [ref=e95]:
            - heading "Recommended Actions 1" [level=2] [ref=e96]:
              - text: Recommended Actions
              - generic [ref=e97]: "1"
            - paragraph [ref=e98]: Best next move for this paycheck.
          - generic [ref=e99]: ▼
      - button "Timeline Your paycheck flow through the next pay cycle. ▼" [ref=e101] [cursor=pointer]:
        - generic [ref=e103]:
          - heading "Timeline" [level=2] [ref=e104]
          - paragraph [ref=e105]: Your paycheck flow through the next pay cycle.
        - generic [ref=e106]: ▼
    - navigation [ref=e107]:
      - button "🏠 Plan" [ref=e108] [cursor=pointer]:
        - generic [ref=e109]: 🏠
        - generic [ref=e110]: Plan
      - button "💳 Bills" [ref=e111] [cursor=pointer]:
        - generic [ref=e112]: 💳
        - generic [ref=e113]: Bills
      - button "📈 Payoff" [ref=e114] [cursor=pointer]:
        - generic [ref=e115]: 📈
        - generic [ref=e116]: Payoff
      - button "🎯 Goals" [ref=e117] [cursor=pointer]:
        - generic [ref=e118]: 🎯
        - generic [ref=e119]: Goals
  - generic [ref=e124] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e125]:
      - img [ref=e126]
    - generic [ref=e131]:
      - button "Open issues overlay" [ref=e132]:
        - generic [ref=e133]:
          - generic [ref=e134]: "0"
          - generic [ref=e135]: "1"
        - generic [ref=e136]: Issue
      - button "Collapse issues badge" [ref=e137]:
        - img [ref=e138]
  - alert [ref=e140]
```

# Test source

```ts
  115 |             isAutopay: false,
  116 |         },
  117 |     ],
  118 | 
  119 |     goals: [
  120 |         {
  121 |             id: "goal-emergency",
  122 |             name: "Emergency Fund",
  123 |             targetAmount: 1000,
  124 |             currentAmount: 450,
  125 |             type: "emergency",
  126 |         },
  127 |         {
  128 |             id: "goal-vacation",
  129 |             name: "Vacation Fund",
  130 |             targetAmount: 2500,
  131 |             currentAmount: 800,
  132 |             type: "savings",
  133 |         },
  134 |     ],
  135 | 
  136 |     completedRecommendedActions: [],
  137 |     payoffStrategy: "avalanche",
  138 |     darkMode: true,
  139 | };
  140 | 
  141 | const OUT_DIR = "test-results/app-store-screenshots";
  142 | 
  143 | async function seedAndCalculate(page: Page) {
  144 |     await page.goto("/");
  145 | 
  146 |     await page.evaluate((state) => {
  147 |         localStorage.clear();
  148 |         localStorage.setItem("debtPlanner.mockSubscription", "premium");
  149 |         localStorage.setItem("debtPlanner.amount", JSON.stringify(state.amount));
  150 |         localStorage.setItem("debtPlanner.payCycle", JSON.stringify(state.payCycle));
  151 |         localStorage.setItem("debtPlanner.currentDate", JSON.stringify(state.currentDate));
  152 |         localStorage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify(state.nextPaycheckDate));
  153 |         localStorage.setItem("debtPlanner.semiMonthlyFirstDay", JSON.stringify(state.semiMonthlyFirstDay));
  154 |         localStorage.setItem("debtPlanner.semiMonthlySecondDay", JSON.stringify(state.semiMonthlySecondDay));
  155 |         localStorage.setItem("debtPlanner.monthlyPayDay", JSON.stringify(state.monthlyPayDay));
  156 |         localStorage.setItem("debtPlanner.requiredExpenses", JSON.stringify(state.requiredExpenses));
  157 |         localStorage.setItem("debtPlanner.livingExpenses", JSON.stringify(state.livingExpenses));
  158 |         localStorage.setItem("debtPlanner.debts", JSON.stringify(state.debts));
  159 |         localStorage.setItem("debtPlanner.goals", JSON.stringify(state.goals));
  160 |         localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify(state.completedRecommendedActions));
  161 |         localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify(state.payoffStrategy));
  162 |         localStorage.setItem("debtPlanner.darkMode", JSON.stringify(state.darkMode));
  163 |     }, screenshotState);
  164 | 
  165 |     await page.reload();
  166 | 
  167 |     // Dismiss first-run settings sheet if it appears
  168 |     const overlay = page.locator(".settings-overlay");
  169 |     if (await overlay.isVisible().catch(() => false)) {
  170 |         await page.getByRole("button", { name: /Calculate plan/i }).click();
  171 |         await overlay.waitFor({ state: "hidden" });
  172 |     }
  173 | 
  174 |     // Wait for the plan heading to confirm app is fully loaded
  175 |     await page.getByRole("heading", { name: "Debt Planner" }).waitFor({ state: "visible" });
  176 |     await page.waitForTimeout(400);
  177 | }
  178 | 
  179 | async function shot(page: Page, name: string) {
  180 |     fs.mkdirSync(OUT_DIR, { recursive: true });
  181 |     await page.screenshot({
  182 |         path: path.join(OUT_DIR, `${name}.png`),
  183 |         fullPage: false,
  184 |     });
  185 | }
  186 | 
  187 | // ─── Tests ──────────────────────────────────────────────────────────────────
  188 | // Run with: npx playwright test app-store-screenshots --project=iphone-pro-max
  189 | 
  190 | test("01 — Plan overview (dark)", async ({ page }) => {
  191 |     await seedAndCalculate(page);
  192 | 
  193 |     // Navigate to Plan tab
  194 |     await page.locator(".bottom-nav-item").filter({ hasText: /Plan/i }).click();
  195 |     await page.waitForTimeout(300);
  196 | 
  197 |     // Ensure Required Actions is expanded (it should be by default)
  198 |     const requiredSection = page.locator(".section-collapse-button").filter({ hasText: /Required Actions/i });
  199 |     const isExpanded = await page.locator(".plan-section-body.expanded").first().isVisible().catch(() => false);
  200 |     if (!isExpanded) {
  201 |         await requiredSection.click();
  202 |         await page.waitForTimeout(200);
  203 |     }
  204 | 
  205 |     // Scroll to the top of the plan section so execution summary strip is visible
  206 |     await page.locator(".plan-dashboard").first().scrollIntoViewIfNeeded();
  207 |     await page.waitForTimeout(200);
  208 | 
  209 |     await shot(page, "01-plan-overview-dark");
  210 | });
  211 | 
  212 | test("02 — Timeline (dark)", async ({ page }) => {
  213 |     await seedAndCalculate(page);
  214 | 
> 215 |     await page.locator(".bottom-nav-item").filter({ hasText: /Plan/i }).click();
      |                                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  216 |     await page.waitForTimeout(300);
  217 | 
  218 |     // Expand the timeline
  219 |     const timelineButton = page.locator(".timeline-collapse-button");
  220 |     await timelineButton.click();
  221 |     await page.waitForTimeout(300);
  222 | 
  223 |     // Scroll so the timeline is centered in the viewport
  224 |     await page.locator(".timeline-card").scrollIntoViewIfNeeded();
  225 |     await page.waitForTimeout(200);
  226 | 
  227 |     await shot(page, "02-timeline-dark");
  228 | });
  229 | 
  230 | test("03 — Smart Insights premium (dark)", async ({ page }) => {
  231 |     await seedAndCalculate(page);
  232 | 
  233 |     // Navigate to Payoff tab
  234 |     await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
  235 |     await page.waitForTimeout(300);
  236 | 
  237 |     // Smart Insights is expanded by default (expandedPremiumSection === "insights")
  238 |     // Scroll to the payoff premium section
  239 |     await page.locator(".premium-payoff-hero").scrollIntoViewIfNeeded().catch(() => undefined);
  240 |     await page.waitForTimeout(200);
  241 | 
  242 |     // Scroll down slightly so Smart Insights card is in view
  243 |     await page.locator(".smart-insight-list").first().scrollIntoViewIfNeeded().catch(() => undefined);
  244 |     await page.waitForTimeout(200);
  245 | 
  246 |     await shot(page, "03-smart-insights-dark");
  247 | });
  248 | 
  249 | test("04 — Forecasting premium (dark)", async ({ page }) => {
  250 |     await seedAndCalculate(page);
  251 | 
  252 |     await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
  253 |     await page.waitForTimeout(300);
  254 | 
  255 |     // Click the Forecast section header to expand it
  256 |     const forecastHeader = page.locator(".strategy-comparison-header.premium-collapsible-header").filter({ hasText: /Forecast/i });
  257 |     await forecastHeader.scrollIntoViewIfNeeded();
  258 |     await forecastHeader.click();
  259 |     await page.waitForTimeout(400);
  260 | 
  261 |     // Scroll forecast card into view
  262 |     await page.locator(".forecast-list").first().scrollIntoViewIfNeeded().catch(() => undefined);
  263 |     await page.waitForTimeout(200);
  264 | 
  265 |     await shot(page, "04-forecast-dark");
  266 | });
  267 | 
  268 | test("05 — Strategy Comparison premium (dark)", async ({ page }) => {
  269 |     await seedAndCalculate(page);
  270 | 
  271 |     await page.locator(".bottom-nav-item").filter({ hasText: /Payoff/i }).click();
  272 |     await page.waitForTimeout(300);
  273 | 
  274 |     // Click Strategy Comparison header to expand it
  275 |     const comparisonHeader = page.locator(".strategy-comparison-header.premium-collapsible-header").filter({ hasText: /Strategy Comparison/i });
  276 |     await comparisonHeader.scrollIntoViewIfNeeded();
  277 |     await comparisonHeader.click();
  278 |     await page.waitForTimeout(400);
  279 | 
  280 |     await page.locator(".premium-strategy-grid").first().scrollIntoViewIfNeeded().catch(() => undefined);
  281 |     await page.waitForTimeout(200);
  282 | 
  283 |     await shot(page, "05-strategy-comparison-dark");
  284 | });
  285 | 
  286 | test("06 — Mark paid interaction (light)", async ({ page }) => {
  287 |     // Use light mode for this shot
  288 |     const lightState = { ...screenshotState, darkMode: false };
  289 | 
  290 |     await page.goto("/");
  291 |     await page.evaluate((state) => {
  292 |         localStorage.clear();
  293 |         localStorage.setItem("debtPlanner.mockSubscription", "premium");
  294 |         localStorage.setItem("debtPlanner.amount", JSON.stringify(state.amount));
  295 |         localStorage.setItem("debtPlanner.payCycle", JSON.stringify(state.payCycle));
  296 |         localStorage.setItem("debtPlanner.currentDate", JSON.stringify(state.currentDate));
  297 |         localStorage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify(state.nextPaycheckDate));
  298 |         localStorage.setItem("debtPlanner.semiMonthlyFirstDay", JSON.stringify(state.semiMonthlyFirstDay));
  299 |         localStorage.setItem("debtPlanner.semiMonthlySecondDay", JSON.stringify(state.semiMonthlySecondDay));
  300 |         localStorage.setItem("debtPlanner.monthlyPayDay", JSON.stringify(state.monthlyPayDay));
  301 |         localStorage.setItem("debtPlanner.requiredExpenses", JSON.stringify(state.requiredExpenses));
  302 |         localStorage.setItem("debtPlanner.livingExpenses", JSON.stringify(state.livingExpenses));
  303 |         localStorage.setItem("debtPlanner.debts", JSON.stringify(state.debts));
  304 |         localStorage.setItem("debtPlanner.goals", JSON.stringify(state.goals));
  305 |         localStorage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify(state.completedRecommendedActions));
  306 |         localStorage.setItem("debtPlanner.payoffStrategy", JSON.stringify(state.payoffStrategy));
  307 |         localStorage.setItem("debtPlanner.darkMode", JSON.stringify(state.darkMode));
  308 |     }, lightState);
  309 | 
  310 |     await page.reload();
  311 |     const overlay = page.locator(".settings-overlay");
  312 |     if (await overlay.isVisible().catch(() => false)) {
  313 |         await page.getByRole("button", { name: /Calculate plan/i }).click();
  314 |         await overlay.waitFor({ state: "hidden" });
  315 |     }
```