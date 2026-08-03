// Visual verification — 3.5.3.6 the E1 hand-back finale, dark + light, BOTH audiences.
//
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-finale-theme.cjs
//
// The FREE finale is the one to actually read. [D9] shows every audience a premium Guardian, and the
// PremiumInvite doesn't render during a session — so this screen is the entire conversion framing, and
// the only thing standing between the walkthrough and "free dressed as premium". A screenshot is the
// only way to ask the real question: does it read as honest, or as a bait-and-switch?
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4319";

const soon = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };

const KEY = "debtPlanner.rnStore";
const STORE = {
  storeVersion: 7,
  cushionFloor: 200,
  genuineCycleCount: 6,
  paycheck: { amount: "2000" },
  debts: [{ id: "d0", name: "Card", balance: 5000, minimumPayment: 100, apr: 20, dueDate: soon(7), type: "debt", recurrence: "monthly" }],
  prefs: { onboardingComplete: true },
};

function seedFn(arg) {
  window.localStorage.setItem(arg.key, arg.blob);
}

async function shoot(theme, tier) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, colorScheme: theme });
  const blob = JSON.stringify({ ...STORE, subscriptionPlan: tier, prefs: { ...STORE.prefs, themeMode: theme } });
  await ctx.addInitScript(seedFn, { key: KEY, blob });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/tutorial`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  for (let i = 0; i < 6; i++) {
    await p.getByText("Next", { exact: true }).click();
    await p.waitForTimeout(450);
  }
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/rn-finale-${tier}-${theme}.png` });

  // …and the hand-back itself: their OWN card, where the real invitation lives for a free user.
  await p.getByText("Finish", { exact: true }).click();
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/rn-finale-handedback-${tier}-${theme}.png` });

  const body = await p.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 110));
  console.log(`${tier}/${theme}: after hand-back -> "${body}"`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) {
    for (const tier of ["free", "premium"]) await shoot(theme, tier);
  }
})();
