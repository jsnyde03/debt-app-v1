// Visual verification — 3.5.3.3.1 the per-beat spotlight (cutout scrim + ring), dark + light.
//
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-spotlight-theme.cjs
//
// Shoots beat 1 (subject = the whole Guardian card) and beat 2 (subject = the cushion bar), because
// the thing to LOOK at is whether the lit area reads as "this bit" rather than as a rectangle sitting
// on top of the screen — geometry assertions can't tell the difference.
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
  prefs: { onboardingComplete: true },
};

function seedFn(arg) {
  window.localStorage.setItem(arg.key, arg.blob);
  window.__debtSandboxHarness = { scenarioId: arg.scenarioId };
}

async function shoot(theme, scenarioId, beats, name) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, colorScheme: theme });
  const blob = JSON.stringify({ ...STORE, prefs: { ...STORE.prefs, themeMode: theme } });
  await ctx.addInitScript(seedFn, { key: KEY, blob, scenarioId });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/tutorial`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  for (let i = 1; i < beats; i++) {
    await p.getByText("Next", { exact: true }).click();
    await p.waitForTimeout(700); // measure → scroll → re-measure
  }
  await p.waitForTimeout(400);

  const box = await p.getByTestId("tutorial-spotlight").boundingBox();
  const file = `${OUT}/rn-${name}-${theme}.png`;
  await p.screenshot({ path: file, fullPage: false });
  console.log(`${name}/${theme}: ring=${box ? `${Math.round(box.width)}x${Math.round(box.height)} @${Math.round(box.y)}` : "none"}\n   -> ${file}`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) {
    await shoot(theme, "persona-clear", 1, "tutorial-spot-card");
    await shoot(theme, "persona-clear", 2, "tutorial-spot-bar");
    await shoot(theme, "persona-at-risk", 1, "tutorial-spot-atrisk");
  }
})();
