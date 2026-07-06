// Visual verification — v1.6 pre-submit audit MED fixes, dark + light.
//   C) debt-free hero copy (paycheck set, all balances cleared)
//   E) post-capture "Start Next Pay Cycle" rollover nudge
//
//   (reuse the out/ build the e2e already produced)
//   NODE_OPTIONS=--use-system-ca npx serve out -l 4655
//   VPORT=4655 NODE_OPTIONS=--use-system-ca node tests/visual/audit-fixes-theme.cjs
//
// Then OPEN the four PNGs and LOOK — confirm each renders correctly in BOTH
// themes (no light-in-dark, readable contrast, premium treatment).
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4655";

// --- State C: debt-free (a paid-off debt + a paycheck) ---
function seedDebtFree(theme) {
  const S = (k, v) => localStorage.setItem("debtPlanner." + k, JSON.stringify(v));
  localStorage.clear(); sessionStorage.clear();
  S("hasCompletedOnboarding", true); S("hasConfiguredPaycheck", true);
  S("darkMode", theme); S("amount", "2000"); S("payCycle", "biweekly");
  S("currentDate", "2026-05-01"); S("nextPaycheckDate", "2026-05-15");
  S("debts", [{ id: "paid", name: "Visa", balance: 0, originalBalance: 900, minimumPayment: 50, apr: 22, dueDate: "2026-05-10", originalDueDate: "2026-05-10", type: "debt", recurrence: "monthly", isPaidThisCycle: true, minimumPaidThisCycle: true, snowballPaidThisCycle: false }]);
  S("requiredExpenses", []); S("livingExpenses", []); S("goals", []); S("completedRecommendedActions", []); S("payoffStrategy", "snowball");
}

// --- State E: payday handled, cycle not rolled → awaiting-rollover nudge ---
function seedAwaitingRollover(theme) {
  const S = (k, v) => localStorage.setItem("debtPlanner." + k, JSON.stringify(v));
  localStorage.clear(); sessionStorage.clear();
  const d = new Date(); d.setUTCDate(d.getUTCDate() - 3);
  const payday = d.toISOString().slice(0, 10); // recent past payday
  S("hasCompletedOnboarding", true); S("hasConfiguredPaycheck", true);
  S("darkMode", theme); S("amount", "1950"); S("payCycle", "biweekly");
  S("currentDate", payday); S("nextPaycheckDate", payday);
  S("lastHandledPaydayDate", payday); // handled → nudge, not the sheet
  S("debts", [{ id: "d1", name: "Visa", balance: 2400, originalBalance: 2400, minimumPayment: 60, apr: 22.9, dueDate: "2026-06-10", originalDueDate: "2026-06-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false, minimumPaidThisCycle: false, snowballPaidThisCycle: false }]);
  S("requiredExpenses", []); S("livingExpenses", []); S("goals", []); S("completedRecommendedActions", []); S("payoffStrategy", "snowball");
}

async function shoot(name, seedFn, theme) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(seedFn, theme);
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);

  const calc = p.getByRole("button", { name: /Calculate plan/i });
  if (await calc.isVisible().catch(() => false)) { await calc.click(); await p.waitForTimeout(400); }

  // Make sure we're on the Plan tab (the hero + nudge live there).
  await p.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Plan/i }).first().click().catch(() => {});
  await p.waitForTimeout(500);

  const nudge = await p.locator(".payday-rollover-nudge").first().evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor, borderColor: getComputedStyle(el).borderColor,
  })).catch(() => null);
  const hero = await p.locator(".hero-subtitle, [class*='hero'] p").first().innerText().catch(() => "n/a");

  await p.screenshot({ path: `${OUT}/${name}-${theme}.png`, fullPage: true });
  console.log(`[${name} ${theme}] hero: "${hero}" | nudge: ${nudge ? `bg=${nudge.bg} border=${nudge.borderColor}` : "none"}`);
  await b.close();
}

(async () => {
  await shoot("debtfree", seedDebtFree, "dark");
  await shoot("debtfree", seedDebtFree, "light");
  await shoot("rollover", seedAwaitingRollover, "dark");
  await shoot("rollover", seedAwaitingRollover, "light");
  console.log("DONE");
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
