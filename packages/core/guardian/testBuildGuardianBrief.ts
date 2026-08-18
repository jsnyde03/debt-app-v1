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
  return { isPremium: true, floor: 200, discretionary: 210, kept: 200, deployedToDebt: 10, deploySpread: false, shortfall: 0, ...o };
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
  assertTrue(/toward Store Card\b/.test(premClear.detail) && !/across/.test(premClear.detail), "single-target extra names the debt directly ('toward Store Card')");

  // The extra spreads across multiple debts when it exceeds the focus balance — copy must not claim one target.
  const spread = buildGuardianBrief(input({ deployedToDebt: 2660, deploySpread: true, focusDebtName: "Store Card" }));
  assertTrue(/across your debts, starting with Store Card/.test(spread.detail), "a spread extra reads 'across your debts, starting with …', not 'to Store Card'");
  assertTrue(/Apply the spare .*across your debts, starting with Store Card/i.test(spread.safeMove ?? ""), "a spread extra safe move reads 'Apply the spare … across your debts'");

  // ── §2.1 advice boundary (2.4.11.4a): an EF-vs-debt tradeoff → two-sided-with-a-why; mechanical → single ──
  const tradeoff = buildGuardianBrief(input({ deployedToDebt: 40, focusDebtName: "Store Card", deployTradeoff: true, tradeoffTargetName: "Emergency Fund" }));
  assertTrue(/Apply the spare \$40 toward Store Card to save on interest/i.test(tradeoff.safeMove ?? ""), "tradeoff: leads with applying the spare to the debt + the why");
  assertTrue(/or build Emergency Fund/i.test(tradeoff.safeMove ?? "") && /your call/i.test(tradeoff.safeMove ?? ""), "tradeoff: two-sided (the EF alternative) + 'your call'");
  const mechanical = buildGuardianBrief(input({ deployedToDebt: 40, focusDebtName: "Store Card", deployTradeoff: false }));
  assertTrue(/Apply the spare \$40 toward Store Card when you.re ready/i.test(mechanical.safeMove ?? ""), "mechanical: single decisive 'Apply the spare …'");
  assertTrue(!/your call/i.test(mechanical.safeMove ?? ""), "mechanical: no two-sided 'your call'");
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
  assertTrue(/holding all of it as your cushion/i.test(tight.detail), "tight premium keeps everything, deploys nothing");
  assertTrue(/covered this paycheck/i.test(tight.detail) && /rebuilds next paycheck/i.test(tight.safeMove ?? ""), "tight reads CALM — 'covered' + 'rebuilds next paycheck' (2.4.11.2)");

  // ── Acute shortfall → at-risk, extra paused (obligations never cut) ──
  const short = buildGuardianBrief(input({ shortfall: 180, discretionary: 0 }));
  assertEqual(short.state, "at-risk", "a shortfall → at-risk");
  assertTrue(/paused/i.test(short.safeMove ?? ""), "shortfall → paused extra payoff (never cuts an obligation)");
  assertEqual(short.shortfall, 180, "the brief carries the shortfall amount");

  // MF.3 (audit #4): FREE gets the honest shortfall read too — the crisis statement is not premium-gated.
  const freeShort = buildGuardianBrief(input({ isPremium: false, shortfall: 180, discretionary: 0 }));
  assertEqual(freeShort.title, "This paycheck won't cover everything", "free shortfall → the honest title (not softened to 'a bit tight')");
  assertTrue(/\$180 short/i.test(freeShort.detail), "free shortfall → tells the amount short");
  assertEqual(freeShort.safeMove, undefined, "free shortfall → no safeMove (the built plan is premium)");
  assertEqual(freeShort.shortfall, 180, "free shortfall carries the amount for the state-aware invite");

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

  // ── heldReserve viz (2.4.6.1.5): exposed for the "Set aside" bar zone, clamped ≤ cushion ──
  const withReserve = buildGuardianBrief(input({ kept: 220, heldReserve: 20, deployedToDebt: 6 }));
  assertEqual(withReserve.heldReserve, 20, "heldReserve is exposed on the viz for the bar's set-aside zone");
  const overReserve = buildGuardianBrief(input({ kept: 100, heldReserve: 500 }));
  assertEqual(overReserve.heldReserve, 100, "heldReserve clamps to the cushion (can't exceed what it lives inside)");
  assertEqual(buildGuardianBrief(input({})).heldReserve, 0, "no reserve → heldReserve 0 (zone hidden)");

  // ── Amounts are EXACT (2.4.11.1) — a concrete figure the user acts on must be correct, never hedged
  //    down (a $96 payment must read "$96", not "$95"); still never "$0" for a nonzero. ──
  const exact96 = buildGuardianBrief(input({ discretionary: 356, kept: 260, deployedToDebt: 96, floor: 200, focusDebtName: "Store Card" }));
  assertTrue(/spare \$96 toward Store Card/.test(exact96.detail), "a $96 deploy reads EXACTLY '$96' in the detail, never hedged to $95");
  assertTrue(/Apply the spare \$96 toward Store Card/.test(exact96.safeMove ?? ""), "…and '$96' EXACT in the action, matching the plan");
  const tinyDeploy = buildGuardianBrief(input({ discretionary: 210, kept: 205, deployedToDebt: 2, floor: 200, focusDebtName: "Store Card" }));
  assertTrue(!/\$0\b/.test(tinyDeploy.detail + (tinyDeploy.safeMove ?? "")), "a $2 deploy never renders as '$0'");
  assertTrue(/spare \$2/.test(tinyDeploy.detail), "a $2 deploy reads exactly '$2' (exact, not fuzzed)");

  // ── §2.3.1 paused-deploy (2.4.7.7): a missed paycheck → paused-deploy, NEVER a phantom-income clear ──
  // Even with a would-be-CLEAR read (high discretionary), pausedDeploy supersedes everything.
  const paused = buildGuardianBrief(input({ pausedDeploy: true, discretionary: 500, kept: 400, deployedToDebt: 80, focusDebtName: "Store Card" }));
  assertTrue(paused.pausedDeploy === true, "missed paycheck → pausedDeploy flag set");
  assertTrue(/didn't land/i.test(paused.title), "paused: honest 'a paycheck didn't land', not a verdict");
  assertEqual(paused.deployedToDebt, 0, "paused: deploy to debt is 0 (never planned on phantom income)");
  assertTrue(!/covered|clear|spare|sending|put the spare/i.test(paused.title + paused.detail), "paused: no phantom-income clear/deploy copy");
  assertTrue(/paused/i.test(paused.detail), "paused: says it paused moving money to debt");
  const pausedFree = buildGuardianBrief(input({ isPremium: false, pausedDeploy: true, discretionary: 500 }));
  assertEqual(pausedFree.safeMove, undefined, "paused: free gets no safeMove");

  // ── §2.0.d voice gate: the one-hedge budget + the stale hard-cutoff (2.4.6.1.3) ──
  const AGING = /from a little while ago/i;
  const INCOME_HEDGE = /paychecks reliably clear/i;
  const BILLS_HEDGE = /get to know your expenses/i;
  const countHedges = (s: string) => [AGING, INCOME_HEDGE, BILLS_HEDGE].filter((re) => re.test(s)).length;

  // fresh inputs + no live holdback → no hedge at all (auto-maintained-and-recent stays decisive).
  const fresh = buildGuardianBrief(input({ confidence: { freshness: "fresh" } }));
  assertEqual(countHedges(fresh.detail), 0, "fresh + nothing live → no hedge");

  // aging freshness → exactly one hedge (applies to BOTH tiers — a stale read is honest regardless of tier).
  const agingPrem = buildGuardianBrief(input({ confidence: { freshness: "aging" } }));
  assertEqual(countHedges(agingPrem.detail), 1, "aging → exactly one hedge");
  assertTrue(AGING.test(agingPrem.detail), "aging → the refresh hedge");
  const agingFree = buildGuardianBrief(input({ isPremium: false, discretionary: 210, kept: 50, deployedToDebt: 160, confidence: { freshness: "aging" } }));
  assertTrue(AGING.test(agingFree.detail), "aging freshness hedges the FREE read too");

  // premium learning hedges: cold-start (income) and discovery (bills), fresh inputs.
  const coldStart = buildGuardianBrief(input({ confidence: { freshness: "fresh", coldStartHoldbackActive: true } }));
  assertTrue(INCOME_HEDGE.test(coldStart.detail), "cold-start → the income hedge");
  const discovery = buildGuardianBrief(input({ confidence: { freshness: "fresh", discoveryHoldbackActive: true } }));
  assertTrue(BILLS_HEDGE.test(discovery.detail), "discovery → the bills hedge");

  // hedge BUDGET: at most ONE, dominant live uncertainty by priority (stale/aging > lean > bills).
  const stacked = buildGuardianBrief(input({ confidence: { freshness: "aging", coldStartHoldbackActive: true, discoveryHoldbackActive: true } }));
  assertEqual(countHedges(stacked.detail), 1, "three live signals → still exactly ONE hedge");
  assertTrue(AGING.test(stacked.detail), "priority: freshness (aging) wins over the learning hedges");
  const leanOverBills = buildGuardianBrief(input({ confidence: { freshness: "fresh", coldStartHoldbackActive: true, discoveryHoldbackActive: true } }));
  assertTrue(INCOME_HEDGE.test(leanOverBills.detail) && !BILLS_HEDGE.test(leanOverBills.detail), "priority: lean-unverified wins over bills-completeness");

  // learning hedges are PREMIUM-only (free doesn't act/learn → nothing to hedge).
  const freeNoLearn = buildGuardianBrief(input({ isPremium: false, discretionary: 210, kept: 50, deployedToDebt: 160, confidence: { freshness: "fresh", coldStartHoldbackActive: true, discoveryHoldbackActive: true } }));
  assertEqual(countHedges(freeNoLearn.detail), 0, "free + learning holdbacks live → no hedge (free doesn't learn)");

  // stale → the hard cutoff supersedes EVERY read (clear + shortfall, both tiers).
  const staleClear = buildGuardianBrief(input({ confidence: { freshness: "stale" } }));
  assertTrue(staleClear.staleAdvisory === true, "stale → staleAdvisory flag for the neutral card render");
  assertTrue(/refresh your numbers/i.test(staleClear.title), "stale → the 'refresh your numbers' cutoff, not a verdict");
  assertEqual(countHedges(staleClear.detail), 0, "the cutoff replaces the read — no residual hedge");
  const staleShort = buildGuardianBrief(input({ shortfall: 180, discretionary: 0, confidence: { freshness: "stale" } }));
  assertTrue(staleShort.staleAdvisory === true, "stale supersedes even a shortfall read");
  const staleFree = buildGuardianBrief(input({ isPremium: false, confidence: { freshness: "stale" } }));
  assertEqual(staleFree.safeMove, undefined, "stale cutoff: free gets no safeMove");
  assertTrue(/Update your numbers/i.test(buildGuardianBrief(input({ confidence: { freshness: "stale" } })).safeMove ?? ""), "stale cutoff: premium gets the update prompt");

  // ── §2.7 graduation (2.4.8): the Guardian PERSISTS past debt-free, spare → savings, never "debt" ──
  const gradDeploy = buildGuardianBrief(input({ debtFree: true, discretionary: 210, kept: 200, deployedToDebt: 10, deployTargetName: "Emergency Fund" }));
  assertEqual(gradDeploy.state, "clear", "debt-free: the band still follows headroom (clear)");
  assertTrue(gradDeploy.debtFree === true, "debt-free brief carries the debtFree flag (the card relabels the bar legend to 'To savings')");
  assertTrue(/toward your Emergency Fund/.test(gradDeploy.detail), "debt-free clear-deploy: the spare goes 'toward your Emergency Fund'");
  assertTrue(!/\bdebt\b/i.test(gradDeploy.detail + (gradDeploy.safeMove ?? "")), "debt-free clear-deploy: never says 'debt'");
  assertTrue(/toward your Emergency Fund/.test(gradDeploy.safeMove ?? "") && !/payment/i.test(gradDeploy.safeMove ?? ""), "debt-free safe move: savings-framed ('toward your Emergency Fund'), never 'payment'");

  const gradUnnamed = buildGuardianBrief(input({ debtFree: true, deployedToDebt: 40 }));
  assertTrue(/toward your savings/.test(gradUnnamed.detail), "debt-free with no named goal → 'toward your savings'");

  const gradSpread = buildGuardianBrief(input({ debtFree: true, deployedToDebt: 500, deploySpread: true, deployTargetName: "Emergency Fund" }));
  assertTrue(/across your savings, starting with your Emergency Fund/.test(gradSpread.detail), "debt-free spread → 'across your savings, starting with …'");
  assertTrue(/across your savings, starting with your Emergency Fund/.test(gradSpread.safeMove ?? ""), "debt-free spread safe move → 'across your savings, starting with …'");

  const gradTight = buildGuardianBrief(input({ debtFree: true, discretionary: 150, kept: 150, deployedToDebt: 0, floor: 200 }));
  assertTrue(/rebuilds next paycheck/.test(gradTight.safeMove ?? "") && !/payoff/.test(gradTight.safeMove ?? ""), "debt-free tight → calm 'rebuilds next paycheck', never 'payoff'");

  // ── §2.10 tight-case top-up (2.4.11.2): moving savings over holds the line → the 'held' acknowledgment ──
  const held = buildGuardianBrief(input({ toppedUp: true, discretionary: 200, kept: 200, deployedToDebt: 0, floor: 200 }));
  assertTrue(/line's held/i.test(held.title), "topped-up → 'Your line's held', not a plain 'looks clear'");
  assertTrue(/moved some savings/i.test(held.detail), "…acknowledges the savings move");

  const gradHold = buildGuardianBrief(input({ debtFree: true, discretionary: 205, kept: 205, deployedToDebt: 0, floor: 200 }));
  assertTrue(/free up more for your goals/.test(gradHold.safeMove ?? "") && !/for debt/.test(gradHold.safeMove ?? ""), "debt-free clear-no-deploy → 'free up more for your goals'");

  const gradShort = buildGuardianBrief(input({ debtFree: true, shortfall: 180, discretionary: 0 }));
  assertTrue(/\bexpenses\b/.test(gradShort.detail) && !/minimums/.test(gradShort.detail), "debt-free shortfall → 'expenses' (no minimums exist debt-free)");
  assertTrue(/Extra savings is paused/.test(gradShort.safeMove ?? ""), "debt-free shortfall → 'Extra savings is paused'");

  const gradPaused = buildGuardianBrief(input({ debtFree: true, pausedDeploy: true, discretionary: 500 }));
  assertTrue(/moving money to savings/.test(gradPaused.detail), "debt-free paused → 'moving money to savings', not 'to debt'");

  // A brief WITH debt is unchanged by the graduation branch (regression guard).
  assertTrue(/toward Store Card/.test(premClear.detail) && premClear.debtFree !== true, "with-debt brief still names the debt + debtFree unset");

  // ── The trust invariant: everything hedged, no cents (incl. the voice-gate + graduation briefs) ──
  for (const b of [premClear, freeClear, tight, short, agingPrem, coldStart, discovery, staleClear, gradDeploy, gradTight, gradShort]) {
    assertTrue(hedged(b.detail) && hedged(b.safeMove ?? "") && hedged(b.lookahead ?? ""), `hedged (no false-precise $) — ${b.state}`);
  }

  console.log("✅ Payday Cushion Guardian (2.4) tests passed.");
}

runGuardianTests();
