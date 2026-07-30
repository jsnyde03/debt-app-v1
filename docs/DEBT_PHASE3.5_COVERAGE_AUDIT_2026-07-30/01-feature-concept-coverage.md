# 01 — Feature / Concept Coverage (lens 1)

**VERDICT: COVERAGE GAPS: 9 — 4 load-bearing.** The tutorial's happy-path arc is sound but it teaches only the "yes" answer to "will I make it this paycheck?" — the shortfall answer (**Recovery Plan**, which the log itself calls "the single biggest differentiator" and THE churn moment) is taught NOWHERE in (A), (B), or (C). Scope is otherwise right (the tutorial correctly does NOT try to teach Can-I-Afford/BNPL/Windfall/scan); the fix is 3 small tutorial beats + 1 demo scene + an explicit coach-mark inventory, not a bigger tutorial.

Audited: `DEBT_ELEVATION_PLAN.md` §Phase 3.5 (A)/(B)/(C) vs the shipped premium surface (`DEBT_PREMIUM_STRATEGY_2026-07-21.md`, `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` v6, `DEBT_ELEVATION_LOG.md`).

---

## 1. Concept inventory — what a new premium user must "get" vs what 3.5 covers

Legend: **A** = tutorial · **B** = demo · **C** = coach-marks · ✅ covered · ◐ partial · ❌ missed · — deliberately out of scope (and that's correct).

| # | Concept (shipped surface) | Must-grasp for value? | A | B | C | Coverage note |
|---|---|---|---|---|---|---|
| 1 | The Guardian read — "will I make it this paycheck?" | YES (the headline) | ✅ | ✅ | | "meet it" beat; demo is a scripted run |
| 2 | The cushion bar + zones (Safety net / Cushion / To debt) | YES | ✅ | ✅ | | tap-each-zone reveal |
| 3 | "Your line" (floor) + live re-plan on drag | YES | ✅ | ✅ | | the strongest beat in the spec |
| 4 | Floor auto-protect = day-one, confidence-independent value | YES (the paywall promise) | ◐ | ✅ | | demo leads with it; tutorial implies it via the line beat but never SAYS "protected from your first paycheck, before I've learned anything" |
| 5 | Settling-in reserve: hold → surprise absorbs → release | YES | ✅ | ◐ | | tutorial's absorb/release beat; demo shows reserves HELD (honest cold-start bound) |
| 6 | Attestation ("my bills are complete") + walk-back | no (in-context) | — | — | | fine for in-app discovery; the reserve beat gives the mental model |
| 7 | Guardian STATE vocabulary + a state TRANSITION (clear→tight→back) | YES | ◐ | ◐ | | **GAP (G2):** the tutorial teaches the bar's spatial zones but never shows a state CHANGE; a user who only ever sees "clear" in the tutorial doesn't know what tight/at-risk LOOKS like — yet the states are the answer format of the headline question. The "surprise lands" beat could carry this but the spec doesn't say the surprise flips the state |
| 8 | Tight-case one-tap top-up ("move $X to hold your line") | YES | ◐ | ✅ | | demo's "tight one-tap"; tutorial's "safe move" may be this — underspecified (see G7) |
| 9 | **Recovery Plan** (shortfall: cover-now / safe-to-defer / gap math / one-tap apply / honest un-closeable) | **YES — the differentiator** | ❌ | ❌ | ❌ | **GAP (G1, top miss).** The tutorial poses "will you make it?" and only ever shows the making-it path. The one place a chatbot is useless, the churn-moment answer, the biggest differentiator — untaught and unshown |
| 10 | Two-sided safe move + "your call" (guidance-not-advice) | YES | ✅ | ◐ | | covered; which SIDE (save vs surplus) the beat shows is unspecified (G7) |
| 11 | Water-fill / prefunded reserve ("setting aside $X for the lumpy bill") | YES | ❌ | ✅ | | demo's smoothing scene carries it; tutorial's reserve beat is the *uncertainty* reserve, not the *prefund* — acceptable split, demo owns it |
| 12 | Earn-trust narrative + calibration scorecard ("I keep score; you'll see when I'm right") | YES (the paywall pitch) | ◐ | ✅ | | **GAP (G4):** demo covers it as "what I'll show once I learn your income"; the tutorial's "once I've learned you" release beat gestures at learning but never shows the scorecard/proof-strip — the just-converted buyer (the tutorial's exact audience) is the person the earn-trust story must land on |
| 13 | Honest / on-device / private-by-default moat ("engine-grounded — I can't make up your numbers; nothing leaves this device") | YES (positioning claim (a)) | ❌ | ❌ | | **GAP (G3):** the locked positioning leads with engine-grounded honesty + privacy, and neither surface says a word of it. One wrap-line is nearly free |
| 14 | Paused-deploy / missed paycheck | mostly in-context | ❌ | ❌ | ◐ | **GAP (G6, medium):** state self-explains in-app with honest copy; the DISCOVERY gap is the "this paycheck didn't arrive" toggle + the varies-toggle (lean/typical) for variable earners — a first-class v1.7 audience. Belongs in (C)/capture-flow, not the tutorial arc |
| 15 | Variable income: varies toggle, lean/typical, learning nudge | in-context + (C) | — | ◐ | ◐ | demo's "once I learn your income" implies it; discovery of the toggle itself is unowned (fold into G6/G5) |
| 16 | Proactive notification contract (risk-only, ≤2/month) | light | ❌ | — | | **GAP (G8, low):** one expectation-setting wrap line ("I'll only ping you for real risk, at most twice a month") builds trust and prevents "why didn't it warn me" / "why is it quiet" |
| 17 | Cash Runway chart + tap-receipt + drag-scrub | discovery | — | ◐ | ❌ | drag-select scrub + tap-cycle receipt are **hidden gestures** — exactly (C)'s stated class — but (C) lists only the context menu + widget nudges (G5) |
| 18 | Can-I-Afford-This? (inverse Guardian) | discovery | — | — | ❌ | correctly NOT in the tutorial; but no discovery home either (G5) |
| 19 | BNPL first-class ("2 of 4", calendar, between-paycheck heads-up) | discovery | — | — | ❌ | in-app surfaces are self-evident once seen; entry-point discovery → (G5) |
| 20 | Windfall Autopilot (routing + one-tap confirm) | discovery | — | — | ❌ | same → (G5) |
| 21 | Scan-to-prefill · projection auto-maintenance | discovery | — | — | ❌ | same → (G5); auto-maintenance is invisible-by-design, one coach-mark line at most |
| 22 | Graduation (Guardian persists past debt-free) | no (month-one user) | — | — | | correctly excluded — the demo honesty rule ("not a matured Guardian") applies doubly; the churn-answer pitch belongs on the paywall, not here (G9, low/optional) |
| 23 | Free at-risk read + premium invitation | YES (GTM) | — | ✅ | | (B)'s free at-risk showcase state — but see G1b: it shows free's honest read without the premium ANSWER (Recovery) as the conversion contrast |
| 24 | Long-press context menu · widget · Lock Screen · Live Activity · Siri | discovery | — | — | ◐ | (C) covers context menu + widget/Lock Screen; **Siri/App-Intents phrase discovery is unowned** (fold into G5's inventory decision) |

---

## 2. The misses, ranked by load

1. **G1 — Recovery Plan absent everywhere (LOAD-BEARING, #1).** The tutorial's framing question is "will I make it this paycheck?" but it only teaches the yes-path. The honest, complete answer includes "and if you won't — I build your actual plan from your bills: cover now, safe to defer, one tap." This is (per the log) the single biggest differentiator, the churn-moment feature, and — critically for the demo — it is **confidence-independent** (it works from the user's entered data on day one, needing no learned income), so it fits inside (B)'s honesty bound perfectly. Its absence also weakens (B)'s conversion story: **G1b** — the free at-risk showcase shows the fear with no premium answer next to it; the at-risk→Recovery contrast is the strongest conversion frame the demo can legally show.
2. **G2 — No state transition taught (LOAD-BEARING).** The tutorial teaches the bar spatially but never shows the sandbox CHANGE state. The "surprise lands" beat is the natural vehicle: spec it so the surprise visibly flips clear→tight, the reserve absorbs, the bar returns — which simultaneously teaches the state vocabulary AND makes the reserve's value legible ("without this held money, that surprise would have made you short").
3. **G3 — The honesty/on-device moat is never stated (LOAD-BEARING).** Positioning claim (a) (engine-grounded honesty) and "private by default" appear nowhere in (A) or (B). One tutorial wrap-line + one demo caption ("everything you just saw runs on this device — I only know what you give me, and I can't invent your numbers") lands the moat for ~zero scope.
4. **G4 — Earn-trust/scorecard beat missing from the tutorial (LOAD-BEARING, lighter).** The demo represents the scorecard honestly; the tutorial — whose audience is the just-converted buyer inside the guarantee window — never shows "I keep score and you'll see my record." One tap-reveal after the reserve-release beat closes it.
5. **G5 — (C)'s coach-mark target list is under-specified (MEDIUM).** "Priority target: context menu + widget nudges" is two items; the shipped surface has a real inventory of hidden gestures and unfindable entry points: Cash-Runway drag-scrub + tap-receipt · Can-I-Afford entry · Windfall entry · scan-to-prefill at add-debt · the varies-toggle · BNPL calendar entry · Siri phrase. (C) needs the enumerated inventory with the hidden-GESTURE class prioritized, else discovery of half the premium tier is silently unowned.
6. **G6 — Variable-income discovery unowned (MEDIUM).** Paused-deploy and lean/typical self-explain once reached, but the varies-toggle and "this paycheck didn't arrive" affordances are the doorway for a first-class v1.7 audience. Home: a (C) coach-mark on the capture flow — NOT a tutorial beat.
7. **G7 — "Safe move" beat underspecified (LOW/spec-precision).** The Guardian is two-sided (save + surplus); the tutorial spec doesn't say which side the beat demonstrates. Pin it (recommend the save side — it answers the headline fear; the demo's tight one-tap already shows the acting side).
8. **G8 — Notification contract unstated (LOW).** One wrap line.
9. **G9 — Graduation/churn-answer unmentioned (LOW, optional).** Correctly out of both surfaces; if wanted anywhere, it's one paywall/wrap sentence ("and when your debt hits zero, I don't stop"), not a beat.

## 3. Mis-scoping — where the line sits (and that it's mostly right)

- **The tutorial is NOT under- or over-scoped in feature count — it's mis-shaped on the core arc** (see §4). Keep it to the Guardian mental model only. Do **not** add Can-I-Afford / BNPL / Windfall / scan / graduation beats — that's the feature-tour anti-pattern; those live in (C) + in-app discovery.
- **The right division of labor:** tutorial (A) = the Guardian mental model (bar → line → reserve → states → shortfall answer → safe move → trust/privacy wrap); demo (B) = cold-start day-one VALUE (floor auto-protect · tight one-tap · water-fill · at-risk→Recovery contrast · scorecard-as-promise); coach-marks (C) = hidden gestures + unfindable entry points (the enumerated inventory, G5); everything else = in-app discovery on self-evident surfaces.
- **Cut/guard candidates:** none hard. Two guards: (i) absorbing the 2.4.11.3 intro must REPLACE it, not double-teach (one discovery system — the same reason TipKit was dropped); (ii) keep the tutorial ≤ ~7 beats even after the additions below — G1/G2 fold INTO existing beats rather than appending, and the Recovery beat is a *glimpse* (one scripted card), not a walkthrough.

## 4. Core-job completeness — does the arc land the ONE uncopyable job?

The arc (meet → bar → line → reserve → safe move → done) lands the *mechanics* but not the *promise*. Four steps missing from the specific "will I make it?" arc: (a) the **state transition** — the user never sees the answer change (G2); (b) the **no-path answer** — Recovery (G1); (c) the **trust close** — how they'll know it's right (scorecard, G4); (d) the **honesty/privacy close** (G3). With those, the arc reads: *here's the question → here's how I show the answer → here's your line and how I protect it → here's what happens when life hits (surprise → absorb; paycheck can't cover → Recovery) → here's the safe move and your call → here's how you'll know I'm right, and it all stays on your device.* That is the complete uncopyable job.

## 5. Recommended spec changes (concrete)

**ADD to (A) — folded into existing beats, arc stays ≤7 beats:**
1. **Re-spec the "surprise lands" beat as a state-transition beat:** the surprise visibly flips the sandbox clear→tight, the reserve absorbs it, the bar returns to clear — with one line naming the states ("this is what tight looks like"). *(closes G2, half of the state vocabulary)*
2. **Add ONE Recovery glimpse beat after the reserve beat:** script the sandbox into a shortfall → show the Recovery Plan card (cover now / safe to defer / gap math / one-tap) as a single scripted reveal — "if a paycheck ever can't cover it, I build your plan from YOUR bills." Not a full Recovery walkthrough. *(closes G1)*
3. **Extend the wrap ("done") beat with the trust close:** a scorecard tap-reveal ("I keep score — you'll see how often my reads match what really happened") + the honesty/privacy line ("all of this runs on your device; I can't make up your numbers") + the notification contract line ("I'll only ping you for real risk, at most twice a month"). *(closes G3, G4, G8)*

**ADD to (B):**
4. **A premium at-risk→Recovery scene** as the counterpart to the existing free at-risk showcase — the strongest honest conversion contrast, and fully inside the cold-start bound (Recovery is confidence-independent). *(closes G1b)*
5. One caption carrying the on-device/honesty moat. *(G3)*

**CHANGE in (C):**
6. Replace "priority target: context menu + widget nudges" with an **enumerated coach-mark inventory**, hidden-gestures first: long-press context menu · Cash-Runway drag-scrub + tap-receipt · widget/Lock Screen · Siri phrase · Can-I-Afford entry · Windfall entry · scan-to-prefill · varies-toggle ("income change each check?") · BNPL calendar. *(closes G5, G6)*

**PIN (spec precision):** which side the safe-move beat shows (rec: the save side) *(G7)*; the 2.4.11.3-absorption-replaces-not-duplicates guard.

**CUT:** nothing — but hold the no-feature-tour line if later lenses propose adding Can-I-Afford/Windfall/BNPL beats to the tutorial.
