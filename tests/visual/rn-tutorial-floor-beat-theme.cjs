// Visual verification — 3.5.3.4 the drag-the-floor beat: the spotlit control, the in-sheet coaching
// line, and the before→after impact payoff. Dark + light, BOTH tiers.
//
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-floor-beat-theme.cjs
//
// The free run is the one to actually LOOK at: [D8] lets a free user move the line as a taste, so the
// question a screenshot answers and an assertion can't is whether the invite underneath still reads as
// an honest "premium holds this for you" rather than as a lock on something they just used.
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
  cushionFloor: 200,
  genuineCycleCount: 6,
  paycheck: { amount: "2000" },
  debts: [{ id: "d0", name: "Card", balance: 5000, minimumPayment: 100, apr: 20, dueDate: soon(7), type: "debt", recurrence: "monthly" }],
  prefs: { onboardingComplete: true, tutorialSeen: "premium" },
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

  // Step to beat 3 (the line).
  for (let i = 0; i < 2; i++) {
    await p.getByText("Next", { exact: true }).click();
    await p.waitForTimeout(600);
  }
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/rn-floor-beat-${tier}-${theme}.png` });

  // …into the real sheet, where the coaching line rides.
  await p.getByText("Adjust your line").click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/rn-floor-sheet-${tier}-${theme}.png` });

  // Actually MOVE the line — a no-op Save proves nothing about the payoff.
  const track = await p.getByLabel("Cushion line amount").boundingBox();
  if (track) {
    await p.mouse.move(track.x + track.width * 0.5, track.y + track.height / 2);
    await p.mouse.down();
    await p.mouse.move(track.x + track.width * 0.12, track.y + track.height / 2, { steps: 12 });
    await p.mouse.up();
    await p.waitForTimeout(300);
  }

  // …and back out to the payoff.
  await p.getByText("Save", { exact: true }).click();
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/rn-floor-impact-${tier}-${theme}.png` });

  const impact = await p.getByTestId("floor-impact").innerText().catch(() => "(none)");
  console.log(`${tier}/${theme}: impact="${impact.replace(/\s+/g, " ")}"`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) {
    for (const tier of ["premium", "free"]) await shoot(theme, tier);
  }
})();
