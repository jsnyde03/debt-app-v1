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
  window.__debtSandboxHarness = { scenarioId: arg.scenarioId };
}

async function shoot(theme, scenarioId, beats, name, viewport = { width: 402, height: 874 }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, colorScheme: theme });
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
    // 3.5.3.3.2 — beat 5 with NO harness pin: the arc itself must have staged the shortfall.
    await shoot(theme, undefined, 5, "tutorial-beat5-recovery");
    // 3.5.3.3.4.3 — the iPad two-column layout: Today reflows to read|do with a width-capped centred
    // column, so the spotlight's window-space rect has to survive a layout it was never designed against.
    await shoot(theme, undefined, 2, "tutorial-ipad-bar", { width: 1024, height: 768 });
  }
})();
