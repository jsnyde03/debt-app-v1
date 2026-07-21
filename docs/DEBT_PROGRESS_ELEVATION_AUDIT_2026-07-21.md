# Progress screen — elevation audit (2026-07-21)

**Trigger:** the Skia payoff-trajectory chart (1.4.T) reset the bar for this screen. This audit scans every Progress element against that bar and makes decisions.

**Criteria (Jason's three + four I'm adding):**
1. **Tooling fit** — right primitive for the job (Skia for rich viz/glow, SVG for simple vector, RN Views for layout)?
2. **Visually impressive** — does it hit the trajectory's bar, or read flat/indie?
3. **Can we do better** — concrete upgrade.
4. **Liveness** _(added)_ — animates on mount / counts up, or dead-static? Consistency across the screen.
5. **Semantic color coherence** _(added)_ — obeys the system (green = paid/progress · gold = achievement/free · blue = interactive · navy = identity · warn/danger = semantic)? Collisions?
6. **Redundancy / hierarchy** _(added)_ — does each element earn its place, or repeat a fact shown elsewhere?
7. **Content/model freshness** _(added)_ — copy/gating drifted from the reshaped one-tier model?

_All findings verified against current code (per [[feedback_verify_critic_claims_on_user_work]])._

---

## The one-line verdict
The **trajectory rail and journey rail now hit the bar; the hero ring, momentum tiles, and cash-cushion bars do not.** The screen's problem is **inverted craft** — the *hero* (the ring) is the least-crafted visualization on the screen (static SVG) while a secondary chart below it glows and animates. Plus three duplicated facts and an inconsistent "% paid" color. Fixable, and Skia is now available to fix it.

## Per-element decisions

| Element | Tooling now | Impressive? | Decision |
|---|---|---|---|
| **Ring hero** | SVG, **static**, blue arc, plain `{pct}%` | ❌ hero-miss | **P1 — rebuild in Skia:** animated sweep 0→pct on mount, `<CountUp>` on the number, soft glow, arc recolored **green→gold** (paid→free). The hero must be the most crafted viz, not the least. |
| **Milestone rail (1.4.R)** | RN Views + Reanimated + glow | ✅ on-bar | **Keep.** boxShadow glow is enough; no Skia needed. (Cross-pulse already filed → Phase 3.) |
| **MomentumStats** | RN Views, static text | ❌ flat + redundant | **P3 — de-dupe + animate:** "Paid so far" **duplicates** the hero's "$X of $Y paid" → drop it. Keep "Interest saved" (unique), add `<CountUp>`, find one genuinely-additive 2nd metric (months saved / streak). |
| **Cash-cushion bars** | RN Views (flat rects), traffic-light | ❌ weakest viz | **P2 — craft it:** Skia gradient bars w/ rounded caps + subtle glow on tight/pressure. **Decide the color:** traffic-light (success/warn/danger) collides with "green = good everywhere" — health-code is defensible (cushion ≠ progress) but must be resolved deliberately, not by accident. |
| **Trajectory (1.4.T)** | Skia + Reanimated | ✅ the bar | **Keep.** Owed: device QA + nicer web load skeleton. |
| **DriftCard** | RN Views, teaser | ➖ ok as teaser | **Flag (not a viz):** copy + gate say **"Premium+"** but the reshaped model is **one Premium tier** ([[project_debt_v1_5_state_2026-07-01]] D-LIFE). Model drift → fix in Phase-2 revenue spine. |
| **Strategy toggle · Focus · Payoff order** | RN Views, static; Focus has a flat green track | ➖ transitional | **P4 — placement + craft:** these are debt-*management*, not the *journey* — decide Progress-vs-**Money** (IA). Focus track is the same flat bar the milestone chips used to be → elevate or relocate. |

## Cross-cutting findings
- **Liveness split (P1–P3 fold this in):** ring, momentum, cash bars are dead-static while trajectory + rail animate. Target: every meaningful number/viz animates on mount (CountUp, ring sweep, bars grow), restraint + Reduce-Motion respected. `<CountUp>` already exists (used on Today, unused on Progress).
- **Semantic color — unify "% paid":** the ring arc is **blue**, the rail fill is **green** — same fact, two colors. Decision needed: **green→gold** (my lean — matches rail + trajectory finish, one story: paid = green, free = gold) vs. blue stays the hero-panel accent. Load-bearing for P1.
- **Redundancy — one home per fact:** debt-free date (hero + trajectory footer), "$4,200 paid" (hero + momentum). Tighten.
- **Cohesion:** the screen is a tall stack of ~9 independent cards. Consider grouping: *where you are* (hero + rail) · *where you're going* (trajectory + cushion) · *premium* (drift) · *management* (strategy/focus/order → maybe Money).

## Recommended sequence
1. **P1 — Ring hero → Skia** (animated sweep + CountUp + green→gold). Biggest bar-miss, it's the hero. _Decide the arc-color question first._
2. **P2 — Cash-cushion bars → crafted Skia** + traffic-light ruling.
3. **P3 — MomentumStats** de-dupe + CountUp + metric rethink.
4. **P4 — Transitional cluster** placement (Progress vs Money) + Focus-track craft.
5. **Flag → Phase 2:** DriftCard Premium+ → Premium.

Each is design-first (agree the treatment, then build in Skia/RN, then both-theme web-verify; native = Phase-E device gate).

---

## Recompose log (Jason: "treat Progress like Today — full composition review, not just the ring")

The element audit above missed the Today-scale lever: **Progress was a ~9-element firehose that told "where you are" 3+ ways** (% paid in the ring AND the milestone rail; debt-free date in the hero AND the trajectory footer; "$ paid" in the hero AND momentum) with a debt-*management* cluster (strategy · focus · payoff-order) that the IA assigns to Money. The recompose:
- **✅ DriftCard pulled off Progress (2026-07-21)** — premium teaser with stale "Premium+" copy + placeholder gate; re-placed with the reshaped model in Phase 2 (component + C.4 engine preserved).
- **✅ Management cluster → Money (2026-07-21)** — strategy toggle · focus · payoff-order removed from Progress; rebuilt in Money's **Debts** section (strategy control preserved · debts ranked in payoff order · blue "Focus" pill on the top target). Both themes verified; tsc 0. _Money's Debts gets its full visual elevation at 1.5._
- **Journey hero — decided: milestones ON the ring** (Jason 2026-07-21), green→gold arc, count-up, glow; a **status display** (interactivity deferred → Phase 3 tappable-milestone detail).
  - **⏳ WIP (pick up here next session):** the Skia ring is **BUILT but not yet wired** — `JourneyRingChart.tsx` (full ring from 12 o'clock · progress arc green→gold SweepGradient + glow · sweep 0→pct on mount · 25/50/75/Free nodes on the arc: passed=green, next/free=gold-glow) + `JourneyRingCanvas.tsx`/`.web.tsx` (platform-split, CanvasKit lazy-load). Standalone, tree still runs the old SVG ring.
  - **▶ NEXT = wire it into the Progress hero:** in `progress.tsx`, replace the `LinearGradient` + SVG `ProgressRing` + the separate `<MilestonesRow>` with the navy hero panel holding `<JourneyRingCanvas>` (compute milestone states from `pct`; palette green→gold on navy) + a **centered `<CountUp>` %** overlay + the DEBT-FREE date/paid meta beside it. Then **both-theme screenshot-verify + iterate on the on-ring node readability** (fall back to the rail-in-panel treatment if the arc nodes read too subtle — Jason OK'd that fallback). Keep `MilestonesRow.tsx` until the on-ring version is confirmed. tsc after wiring.
  - Then: **P2 Skia cushion bars** · **de-dupe** (drop momentum "Paid so far"; the ring hero already owns % + date + paid). Target: **hero → trajectory → interest-saved → cash-flow**.
