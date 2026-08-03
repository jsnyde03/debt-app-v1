// Visual verification — 3.5.3.8.2: EVERY beat of the arc, dark + light, in one sweep.
//
//   npx serve apps/rn/dist -l 4319 -s
//   VPORT=4319 node tests/visual/rn-tutorial-arc-theme.cjs
//
// Every previous capture shot beats piecemeal — whichever one the leaf in flight happened to touch.
// This walks the whole arc in order so the run can be read as a SEQUENCE, which is the only way to see
// the things that are invisible beat-by-beat: does the tone hold, does the dock jump around, does any
// beat land on nothing, do the two themes stay at parity the whole way down.
const { chromium } = require("playwright");
const OUT = __dirname;
const PORT = process.env.VPORT || "4319";

const soon = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };

const KEY = "debtPlanner.rnStore";
const STORE = {
  storeVersion: 7,
  subscriptionPlan: "premium",
  cushionFloor: 200,
  genuineCycleCount: 6,
  paycheck: { amount: "2000" },
  debts: [{ id: "d0", name: "Card", balance: 5000, minimumPayment: 100, apr: 20, dueDate: soon(7), type: "debt", recurrence: "monthly" }],
  prefs: { onboardingComplete: true, tutorialSeen: "premium" },
};

function seedFn(arg) {
  window.localStorage.setItem(arg.key, arg.blob);
}

async function sweep(theme) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, colorScheme: theme });
  await ctx.addInitScript(seedFn, { key: KEY, blob: JSON.stringify({ ...STORE, prefs: { ...STORE.prefs, themeMode: theme } }) });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}/tutorial`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);

  const notes = [];
  for (let beat = 1; beat <= 7; beat++) {
    await p.waitForTimeout(650); // measure → scroll → re-measure settles
    const title = await p.getByTestId("tutorial-step-title").innerText().catch(() => "(none)");
    const ring = await p.getByTestId("tutorial-spotlight").boundingBox().catch(() => null);
    notes.push(`${beat}. ${title}${ring ? "" : "  ⚠ NO SPOTLIGHT"}`);
    await p.screenshot({ path: `${OUT}/rn-arc-${beat}-${theme}.png` });
    if (beat < 7) await p.getByText("Next", { exact: true }).click();
  }

  console.log(`\n[${theme}]\n  ${notes.join("\n  ")}`);
  await b.close();
}

(async () => {
  for (const theme of ["dark", "light"]) await sweep(theme);
})();
