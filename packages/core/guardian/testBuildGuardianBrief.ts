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
  return { thisCushion: 500, thisStatus: "stable", shortfall: 0, safeExtra: 0, ...o };
}

/** No brief ever states a false-precise dollar verdict: amounts are hedged, never shown with cents. */
function hedged(text: string): boolean {
  return !/\$\d[\d,]*\.\d/.test(text); // no "$123.45"
}

function runGuardianTests() {
  console.log("Running Payday Cushion Guardian (2.4) tests...");

  // Acute shortfall wins the read regardless of the cushion band.
  const short = buildGuardianBrief(input({ shortfall: 180, thisStatus: "stable", thisCushion: 500 }));
  assertEqual(short.state, "at-risk", "a shortfall forces at-risk even if the raw cushion band looks stable");
  assertTrue(/short/i.test(short.detail), "shortfall detail names the shortfall");

  // Pressure (thin cushion, no shortfall) → at-risk 'covered but tight'.
  const pressure = buildGuardianBrief(input({ thisStatus: "pressure", thisCushion: 60 }));
  assertEqual(pressure.state, "at-risk", "pressure band → at-risk");
  assertTrue(/tight/i.test(pressure.title + pressure.detail), "pressure reads as tight, not an alarm");

  // Tight band.
  const tight = buildGuardianBrief(input({ thisStatus: "tight", thisCushion: 140 }));
  assertEqual(tight.state, "tight", "tight band → tight");

  // Clear + surplus → the best-move names the focus debt.
  const surplus = buildGuardianBrief(input({ thisStatus: "stable", thisCushion: 640, safeExtra: 220, focusDebtName: "Store Card" }));
  assertEqual(surplus.state, "clear", "stable band → clear");
  assertTrue(surplus.safeMove.includes("Store Card"), "surplus best-move targets the focus debt");

  // Clear + no surplus → 'nicely on plan', no forced payoff push.
  const clearNoExtra = buildGuardianBrief(input({ thisStatus: "stable", thisCushion: 300, safeExtra: 0 }));
  assertEqual(clearNoExtra.state, "clear", "stable + no extra → clear");
  assertTrue(!/toward/i.test(clearNoExtra.safeMove), "no surplus → no 'put $X toward debt' push");

  // Lookahead: this cycle clear, next cycle pressure → a forewarning surfaces.
  const withLook = buildGuardianBrief(input({ thisStatus: "stable", thisCushion: 500, lookahead: { status: "pressure", cushion: 40, label: "Sep 2" } }));
  assertTrue(!!withLook.lookahead && withLook.lookahead.includes("Sep 2"), "an upcoming non-clear cycle produces a lookahead heads-up");
  const noLook = buildGuardianBrief(input({ lookahead: { status: "stable", cushion: 800, label: "Sep 2" } }));
  assertEqual(noLook.lookahead, undefined, "a clear upcoming cycle produces no lookahead noise");

  // The trust invariant: every surface of every brief is hedged (no cents / false precision).
  for (const b of [short, pressure, tight, surplus, clearNoExtra, withLook]) {
    assertTrue(hedged(b.detail) && hedged(b.safeMove) && hedged(b.lookahead ?? ""), `hedged (no false-precise $) — ${b.state}`);
    assertTrue(/about \$/.test(b.detail) || /about \$/.test(b.safeMove), `speaks in "about $X" — ${b.state}`);
  }

  console.log("✅ Payday Cushion Guardian (2.4) tests passed.");
}

runGuardianTests();
