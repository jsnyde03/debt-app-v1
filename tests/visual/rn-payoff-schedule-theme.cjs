// Visual verification — 3.7.A0 payoff schedule (ROUTE + iPad detail pane), dark + light.
//
// Why this exists: the payoff schedule has now rendered wrong on TWO stacks. On the legacy Capacitor
// app it rendered light-in-dark-mode (the bug that created this whole standard — see amort-theme.cjs);
// on RN it rendered behind a presented Modal on device. Geometry/text assertions passed both times.
// So this fix gets looked at, in both themes, on both layouts.
//
//   cd apps/rn && npm run export:web
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-payoff-schedule-theme.cjs
//
// Then OPEN the PNGs and look. The logged background-color is the machine-checkable theme proof.
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4319";

// A due date relative to the RUN, never a literal: a hardcoded date silently drifts into the past and
// the seeded plan starts rendering "Overdue payments need attention" — which makes every screenshot
// review harder by showing a broken-looking app that is working fine. Same trap the e2e fixtures hit.
const soon = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };

const KEY = "debtPlanner.rnStore";
const STORE = {
  storeVersion: 5,
  subscriptionPlan: "premium",
  cushionFloor: 200,
  genuineCycleCount: 6,
  paycheck: { amount: "2000" },
  debts: [
    { id: "d0", name: "Card", balance: 5000, minimumPayment: 100, apr: 20, dueDate: soon(7), type: "debt", recurrence: "monthly" },
  ],
  prefs: { onboardingComplete: true },
};

function seedFn(arg) {
  window.localStorage.setItem(arg.key, arg.blob);
}

const VIEWPORTS = {
  compact: { width: 402, height: 874 },
  ipad: { width: 1194, height: 834 },
};

async function shoot(theme, layout) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: VIEWPORTS[layout], deviceScaleFactor: 2, colorScheme: theme });
  const blob = JSON.stringify({ ...STORE, prefs: { ...STORE.prefs, themeMode: theme } });
  await ctx.addInitScript(seedFn, { key: KEY, blob });
  const p = await ctx.newPage();

  if (layout === "compact") {
    // The real journey: Money → open the debt → the sheet's schedule row → the pushed route.
    await p.goto(`http://localhost:${PORT}/money`, { waitUntil: "networkidle" });
    await p.waitForTimeout(600);
    await p.getByText("Card", { exact: true }).first().click();
    await p.waitForTimeout(400);
    await p.getByTestId("debt-view-schedule").click();
  } else {
    // iPad: the same tap fills the detail pane beside the master list (no push).
    await p.goto(`http://localhost:${PORT}/money`, { waitUntil: "networkidle" });
    await p.waitForTimeout(600);
    await p.getByText("Card", { exact: true }).first().click();
    await p.waitForTimeout(400);
    await p.getByTestId("debt-view-schedule").click();
  }
  await p.waitForTimeout(900);

  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const text = await p.evaluate(() => (document.body.innerText || "").slice(0, 160).replace(/\s+/g, " "));
  const file = `${OUT}/rn-schedule-${layout}-${theme}.png`;
  await p.screenshot({ path: file, fullPage: false });
  console.log(`${layout}/${theme}: bg=${bg}\n   text="${text}"\n   -> ${file}`);
  await b.close();
}

(async () => {
  for (const layout of ["compact", "ipad"]) {
    for (const theme of ["dark", "light"]) await shoot(theme, layout);
  }
})();
