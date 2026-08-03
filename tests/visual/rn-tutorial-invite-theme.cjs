// Visual verification — 3.5.1 tutorial invitation (Today ack-slot) + the tutorial scaffold, dark + light.
//
//   cd apps/rn && npm run export:web
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-invite-theme.cjs
//
// Then OPEN the PNGs and look — assertions prove behaviour, screenshots prove appearance.
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4319";

// A due date relative to the RUN, never a literal: a hardcoded date silently drifts into the past and
// the seeded plan starts rendering "Overdue payments need attention" — which makes every screenshot
// review harder by showing a broken-looking app that is working fine. Same trap the e2e fixtures hit.
const soon = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };

const KEY = "debtPlanner.rnStore";
const STORE = {
  storeVersion: 7,
  subscriptionPlan: "premium",
  cushionFloor: 200,
  genuineCycleCount: 6,
  paycheck: { amount: "2000" },
  debts: [{ id: "d0", name: "Card", balance: 5000, minimumPayment: 100, apr: 20, dueDate: soon(7), type: "debt", recurrence: "monthly" }],
  prefs: { onboardingComplete: true },
};

function seedFn(arg) {
  window.localStorage.setItem(arg.key, arg.blob);
}

async function shoot(theme, route, name) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, colorScheme: theme });
  const blob = JSON.stringify({ ...STORE, prefs: { ...STORE.prefs, themeMode: theme } });
  await ctx.addInitScript(seedFn, { key: KEY, blob });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  const text = await p.evaluate(() => (document.body.innerText || "").slice(0, 140).replace(/\s+/g, " "));
  const file = `${OUT}/rn-${name}-${theme}.png`;
  await p.screenshot({ path: file, fullPage: false });
  console.log(`${name}/${theme}: "${text}"\n   -> ${file}`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) {
    await shoot(theme, "/", "tutorial-invite");
    await shoot(theme, "/tutorial", "tutorial-scaffold");
  }
})();
