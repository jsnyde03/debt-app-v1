// Visual verification — 3.5.3.2 the persistent "Example" marker on the Guardian card, dark + light.
//
//   cd apps/rn && npm run export:web
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-example-marker-theme.cjs
//
// Shoots BOTH the calm opening state and the at-risk one, because at-risk is the case the marker
// exists for: the card turns red and says the user is short, about money that isn't theirs. If the
// marker reads as decoration there, it has failed at the only moment that matters.
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
  // 3.5.0.7 harness seam — name the scripted state the walkthrough opens in.
  window.__debtSandboxHarness = { scenarioId: arg.scenarioId };
}

async function shoot(theme, scenarioId, name) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, colorScheme: theme });
  const blob = JSON.stringify({ ...STORE, prefs: { ...STORE.prefs, themeMode: theme } });
  await ctx.addInitScript(seedFn, { key: KEY, blob, scenarioId });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/tutorial`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  const marker = p.getByTestId("guardian-example-marker");
  await marker.scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);

  // A machine-checkable proof alongside the eyeball: the marker's own colors, per theme.
  const style = await marker.evaluate((el) => {
    const chip = getComputedStyle(el);
    const label = getComputedStyle(el.firstElementChild || el);
    return { chipBg: chip.backgroundColor, labelColor: label.color, text: el.innerText.trim() };
  });

  const file = `${OUT}/rn-${name}-${theme}.png`;
  await p.screenshot({ path: file, fullPage: false });
  console.log(`${name}/${theme}: "${style.text}" chip=${style.chipBg} label=${style.labelColor}\n   -> ${file}`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) {
    await shoot(theme, "persona-clear", "tutorial-example-clear");
    await shoot(theme, "persona-at-risk", "tutorial-example-at-risk");
  }
})();
