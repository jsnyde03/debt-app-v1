// Visual verification — 3.5.3.5 beat 4: the user confirms their bills, the net shrinks, a surprise is
// absorbed, and three paydays later the REAL release ack lands. Dark + light.
//
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-reserve-story-theme.cjs
//
// Shoots the three moments of the story, because this is the beat where a screenshot answers something
// assertions can't: does a sequence the app plays FOR you read as calm and legible, or as the screen
// changing under your hands?
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4319";

const KEY = "debtPlanner.rnStore";
const STORE = {
  storeVersion: 7,
  subscriptionPlan: "premium",
  cushionFloor: 200,
  genuineCycleCount: 6,
  paycheck: { amount: "2000" },
  debts: [{ id: "d0", name: "Card", balance: 5000, minimumPayment: 100, apr: 20, dueDate: "2026-07-01", type: "debt", recurrence: "monthly" }],
  prefs: { onboardingComplete: true, tutorialSeen: "premium" },
};

function seedFn(arg) {
  window.localStorage.setItem(arg.key, arg.blob);
}

async function shoot(theme) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, colorScheme: theme });
  const blob = JSON.stringify({ ...STORE, prefs: { ...STORE.prefs, themeMode: theme } });
  await ctx.addInitScript(seedFn, { key: KEY, blob });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/tutorial`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  for (let i = 0; i < 3; i++) {
    await p.getByText("Next", { exact: true }).click();
    await p.waitForTimeout(600);
  }
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/rn-reserve-1-before-${theme}.png` });

  await p.getByText(/All your regular bills entered/).click();
  await p.waitForTimeout(700); // the net has shrunk; the surprise has not landed yet
  await p.screenshot({ path: `${OUT}/rn-reserve-2-confirmed-${theme}.png` });

  // …the surprise lands at ~900ms, the rollovers at ~2100ms.
  await p.getByText(/safety net was there when a surprise came up/).waitFor({ timeout: 12000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/rn-reserve-3-released-${theme}.png` });

  const ack = await p.getByText(/safety net was there when a surprise came up/).innerText().catch(() => "(no ack)");
  console.log(`${theme}: ack="${ack.replace(/\s+/g, " ").slice(0, 120)}"`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) await shoot(theme);
})();
