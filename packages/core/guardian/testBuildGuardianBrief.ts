import { buildGuardianBrief, type GuardianInput } from "./buildGuardianBrief";

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  console.log(`  ✓ ${label}`);
}
function assertTrue(actual: boolean, label: string) {
  if (!actual) throw new Error(`FAIL [${label}]: expected true`);
  console.log(`  ✓ ${label}`);
}

function input(o: Partial<GuardianInput>): GuardianInput {
  return { isPremium: true, floor: 200, discretionary: 210, kept: 200, deployedToDebt: 10, shortfall: 0, ...o };
}
/** No brief states a false-precise dollar verdict: amounts are hedged, never shown with cents. */
function hedged(text: string): boolean {
  return !/\$\d[\d,]*\.\d/.test(text);
}

function runGuardianTests() {
  console.log("Running Payday Cushion Guardian (2.4) tests...");

  // ── The band follows HEADROOM, not the keep-vs-deploy split — the demo-data lesson ──
  // $210 after obligations is above the $200 line, so BOTH tiers read clear even though the split differs.
  const premClear = buildGuardianBrief(input({ isPremium: true, discretionary: 210, kept: 200, deployedToDebt: 10, focusDebtName: "Store Card" }));
  assertEqual(premClear.state, "clear", "premium: covered with headroom above the line → clear (not a false 'tight')");
  assertTrue(premClear.detail.includes("holding") || (premClear.safeMove ?? "").includes("Store Card"), "premium clear names the kept cushion + the deployed payment");
  const freeClear = buildGuardianBrief(input({ isPremium: false, discretionary: 210, kept: 50, deployedToDebt: 160 }));
  assertEqual(freeClear.state, "clear", "free: SAME headroom → clear (the split doesn't change the band)");
  assertEqual(freeClear.safeMove, undefined, "free gets no safeMove (the card shows the invitation)");
  assertTrue(!/I['’]?ve|I['’]?m|holding|paused/i.test(freeClear.detail), "free copy never claims the app acted");

  // viz carries the kept-vs-deploy split for the bar (differs by tier, same headroom)
  assertEqual(premClear.cushion, 200, "premium viz cushion = kept ($200)");
  assertEqual(freeClear.cushion, 50, "free viz cushion = kept ($50 — under the line, the value prop)");

  // ── Genuinely tight: headroom under the line ──
  const tight = buildGuardianBrief(input({ discretionary: 150, kept: 150, deployedToDebt: 0, floor: 200 }));
  assertEqual(tight.state, "tight", "headroom under the line → tight");
  assertTrue(/keeping all of it as cushion/i.test(tight.detail), "tight premium keeps everything, deploys nothing");

  // ── Acute shortfall → at-risk, extra paused (obligations never cut) ──
  const short = buildGuardianBrief(input({ shortfall: 180, discretionary: 0 }));
  assertEqual(short.state, "at-risk", "a shortfall → at-risk");
  assertTrue(/paused/i.test(short.safeMove ?? ""), "shortfall → paused extra payoff (never cuts an obligation)");

  // ── reachedFloor tracks the kept cushion vs. the line ──
  assertTrue(premClear.reachedFloor, "reachedFloor true when kept cushion meets the line");
  assertEqual(freeClear.reachedFloor, false, "reachedFloor false when the kept cushion is under the line");

  // ── Lookahead (premium only) ──
  const withLook = buildGuardianBrief(input({ lookahead: { status: "pressure", cushion: 40, label: "Sep 2" } }));
  assertTrue(!!withLook.lookahead && withLook.lookahead.includes("Sep 2"), "an upcoming non-clear cycle → a lookahead heads-up");
  const noLook = buildGuardianBrief(input({ lookahead: { status: "stable", cushion: 800, label: "Sep 2" } }));
  assertEqual(noLook.lookahead, undefined, "a clear upcoming cycle → no lookahead noise");

  // ── $NaN guard: non-finite upstream values degrade safely, never reach a screen ──
  const nan = buildGuardianBrief(input({ discretionary: NaN, kept: Infinity, deployedToDebt: NaN, floor: NaN, shortfall: NaN }));
  assertTrue(!/NaN|Infinity/.test(nan.title + nan.detail + (nan.safeMove ?? "") + (nan.lookahead ?? "")), "no NaN/Infinity in any copy");
  assertTrue(Number.isFinite(nan.cushion) && Number.isFinite(nan.deployedToDebt) && Number.isFinite(nan.floor), "viz numbers are always finite");
  assertEqual(nan.floor, 200, "a NaN floor falls back to the $200 default");

  // ── The trust invariant: everything hedged, no cents ──
  for (const b of [premClear, freeClear, tight, short]) {
    assertTrue(hedged(b.detail) && hedged(b.safeMove ?? "") && hedged(b.lookahead ?? ""), `hedged (no false-precise $) — ${b.state}`);
  }

  console.log("✅ Payday Cushion Guardian (2.4) tests passed.");
}

runGuardianTests();
