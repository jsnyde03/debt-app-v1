// Visual verification — amortization "View Schedule" sheet, dark + light.
// Reference example for the UI-fix visual-verification standard (see README.md).
//
//   NEXT_PUBLIC_E2E=1 NODE_OPTIONS=--use-system-ca npm run build
//   NODE_OPTIONS=--use-system-ca npx serve out -l 4655
//   VPORT=4655 NODE_OPTIONS=--use-system-ca node tests/visual/amort-theme.cjs
//
// Then OPEN amort-dark.png / amort-light.png and look at them. The logged sheet
// background-color is the machine-checkable proof of theme scoping.
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4655";

function seedFn(theme) {
  const S = (k, v) => localStorage.setItem("debtPlanner." + k, JSON.stringify(v));
  localStorage.clear(); sessionStorage.clear();
  S("hasCompletedOnboarding", true);
  S("darkMode", theme); // "dark" | "light"
  S("amount", "2000"); S("payCycle", "biweekly");
  S("currentDate", "2026-05-01"); S("nextPaycheckDate", "2026-05-15");
  S("debts", [{ id: "focus-debt", name: "Focus Card", balance: 1000, originalBalance: 1000, minimumPayment: 50, apr: 24, dueDate: "2026-05-10", originalDueDate: "2026-05-10", type: "debt", recurrence: "monthly", isPaidThisCycle: false, minimumPaidThisCycle: false, snowballPaidThisCycle: false }]);
  S("requiredExpenses", []); S("livingExpenses", []); S("goals", []); S("completedRecommendedActions", []); S("payoffStrategy", "snowball");
  // Premium seam — read as a BARE string (not JSON) by useSubscription.
  localStorage.setItem("debtPlanner.mockSubscription", "premium");
}

async function shoot(theme) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(seedFn, theme);
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);

  const calc = p.getByRole("button", { name: /Calculate plan/i });
  if (await calc.isVisible().catch(() => false)) { await calc.click(); await p.waitForTimeout(400); }

  await p.locator(".bottom-nav-item:visible, .sidebar-nav-item:visible").filter({ hasText: /Payoff/i }).click();
  await p.waitForTimeout(500);
  await p.getByRole("button", { name: "View Schedule" }).click();
  await p.waitForTimeout(700);

  const dialog = p.getByRole("dialog", { name: "Payoff schedule for Focus Card" });
  const visible = await dialog.isVisible().catch(() => false);
  const info = await dialog.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight, bg: getComputedStyle(el).backgroundColor };
  }).catch(() => null);

  await p.screenshot({ path: `${OUT}/amort-${theme}.png` });
  console.log(`[${theme}] dialog visible: ${visible} | rect: ${info ? `top=${info.top} bottom=${info.bottom} vh=${info.vh}` : "n/a"} | sheet bg: ${info ? info.bg : "n/a"}`);
  await b.close();
}

(async () => {
  await shoot("dark");
  await shoot("light");
  console.log("DONE");
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
