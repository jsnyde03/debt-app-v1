# Debt Elevation — Phase 0 Design Synthesis (2026-07-20)

> Synthesizes the six best-in-class benchmarks + the internal readiness audit into concrete Phase 0 design decisions. Feeds **0.1** (IA + per-surface content), **0.2** (visual/motion), **0.3** (premium reshape), **0.5** (native). Design-first — everything here is a **proposal for Jason to shape**, behind the design-foundation sign-off gate.
>
> **Sources:** `DEBT_IA_BENCHMARK` · `DEBT_BENCH_VISUAL_MOTION` · `DEBT_BENCH_PREMIUM_MONETIZATION` · `DEBT_BENCH_TRUST_FIRSTRUN` · `DEBT_BENCH_NATIVE` · `DEBT_ELEVATION_READINESS_AUDIT` (all 2026-07-20).

## 1. The converged direction

The evidence converges on one identity: **a calm, honest, on-device payday companion whose emotional payload is the journey to debt-free.** Premium isn't "smarter text" — it's the app *doing the payday job with you every cycle*. The daily surfaces are premium-by-subtraction (one hero number each); the rare emotional beats (a debt paid off) are the licensed delight. Trust is shown by structural absence (we never surface "borrow more"), not preached.

## 2. IA skeleton (✅ AGREED 2026-07-20)

3-tab bottom bar + a "•••" More corner:
- **Today** — home; the payday "what to pay now" moment (the wedge).
- **Progress** — first-class journey (debt-free date · milestones · momentum · the debt-paid-off celebration).
- **Money** — consolidated management, opens to **Debts** (hero) → **Bills** → **Goals**.
- **More** ("•••" corner) — Data · Preferences · About.

_Precedent: Oura Today·My Health·Vitals + Rocket Money "Recurring". Debts→own-tab = a one-line promote if it ever tests as buried._

## 3. Per-surface content design (proposal)

### TODAY — the payday moment (calm; one hero)
- **Hero:** "Here's what to pay this paycheck" — the payday allocation (the uncopyable job), one animated count-up number (Robinhood-style rolling). This is the front door and the reason to open weekly.
- **Debt-free date** as reassurance beneath it — and it **animates when anything changes** (the linchpin, §5).
- **Payday Partner loop** anchors here: FREE = the plan + payday-eve nudge + manual mark-paid; **PREMIUM** = the automated accountability loop (reminders → mark-paid → **verify** → carry-forward reconcile).
- **Between paydays:** a calm "on track · next payday in N days" state — never an empty screen.
- **Trust T1:** a quiet on-device line at first data entry.
- Depth (subtle gradient/glass) on the hero only; everything else flat.

### PROGRESS — the journey (calm 95% / delight 5%)
- **Hero:** debt-free date + a single-hue **progress ring** (% paid); momentum at a glance.
- **Celebration tiers (0.2):** payday = quiet count-up + one light haptic · band milestones (25/50/75%) = inline ring-pulse + light haptic (surfaces milestone math that currently renders nothing) · **debt paid off = the one licensed spectacle** — ring completes, balance rolls to $0, success haptic, and the freed payment visibly **cascades** onto the next debt. Composed screen, **never confetti**, never anchored to an upsell.
- **Momentum:** interest-saved + "how far you've come." FREE = basic momentum + basic celebration; **PREMIUM** = streaks + full milestone system (Duolingo-grade loss-aversion) + Drift (ahead/behind each cycle) + the momentum history chart.
- **Share card:** basic free; custom art is premium but **rides along, never the headline**.

### MONEY — consolidated management (calm; reference/edit)
- Opens to **Debts** (hero section: list · balances · focus debt) → **Bills** (recurring) → **Goals** (savings). Sectioned sub-surfaces (Rocket "Recurring" model), each genuinely distinct — not a junk-drawer segmented control.
- Flat, quiet lists. **No celebration/depth here** — management stays calm so the beats land elsewhere.

### MORE — the "•••" corner
- Data · Preferences · About + a **"Privacy at a glance"** panel (Trust T4 — elevate the one buried About row into felt proof).

## 4. Premium — the reshape (0.3 position)

### The free/premium line
**Principle:** free *finishes the job* (the generous portfolio front-door); premium *does the job WITH you every cycle* (the flywheel). Gating the core math or basic sharing is a documented rating-killer.

| FREE (finishes the job) | PREMIUM (~$4.99/mo — does it with you) |
|---|---|
| All payoff strategies + comparison | **Payday Partner** automated loop (reminders · verify · carry-forward) |
| Payoff / debt-free date + trajectory chart | **Momentum**: streaks + full milestone system |
| What-if scenarios | **Drift** (ahead/behind each cycle) |
| Unlimited debts | **Auto-adjusting** plan |
| Payday-eve nudge + manual mark-paid | Silent **depth**: full amortization · unlimited history · PDF/partner |
| Recent history | Custom share art (rides along) |
| Basic milestone celebration + basic share card | _(Widget — see open decision W)_ |

### Model (confirms the locked direction, now evidence-backed)
- **One Premium tier (~$4.99/mo)** — market norm for focused apps (YNAB/Copilot/Strava/Rocket). Two tiers only appear with a separable complexity job → reserve a 2nd tier (net-worth/Ava) for later.
- **Annual seam built now, launch data-gated.**
- **Lifetime (~$79–99)** shown as a *second offer after the sub is declined* (PocketGuard $79.99 precedent) — monetizes the graduate before debt→0 cancels them; hedges sub-fatigue.
- **Portfolio subscription** = the graduation mechanic: Apple lets a sub span apps (a Lifetime non-consumable can't), so "debt = $0" becomes **graduation into the ecosystem** (Freedom/net-worth), not a cancellation.

### Feature ranking by willingness-to-pay
1. Payday Partner loop (the only *inherently recurring* debt job) · 2. Momentum (streaks/milestones — Duolingo 8.9% conv.) · 3. Drift · 4. Auto-adjust · 5. silent depth. Custom share art rides along, never the headline.

### Success = churn answer
The recurring payday loop + Drift approximate a never-finishing job; the Lifetime monetizes the graduate; the portfolio subscription turns payoff into graduation-into-the-ecosystem rather than cancellation.

## 5. Cross-cutting build-order linchpin

The **animated debt-free-date recalculation** ("add $50 → date jumps ~18 days earlier") is simultaneously the **cold-start wow**, the **core delight beat**, a **trust beat**, and the **store's first frame** (trust + visual benchmarks converged on it independently). **Build it once, early** — it pays off four ways and should lead Phase 1.

## 6. Decisions

- **D-LINE — the free/premium line (§4) — ✅ APPROVED (Jason 2026-07-20).** "Free finishes the job / premium does it with you every cycle," as drawn in §4.
- **D-LIFE — Lifetime unlock — ✅ APPROVED (Jason 2026-07-20).** ~$79–99 Lifetime, shown as a second offer after the sub is declined.
- **W — widget's tier — ✅ RESOLVED (Jason 2026-07-20):** **free** glanceable debt-free countdown + a **premium** interactive/plan widget.
- **Per-surface content (§3)** — proposal on the table; Today/Progress/Money block designs stand as the working IA content, refined into comps in 0.2 / Phase 1.

## 8. Visual language — 0.2 first draft (2026-07-20)

First-draft comp of all three tabs + the beat (Today · Progress · **Money** · debt-paid-off beat) in both themes, both-theme screenshot-verified. Jason ✅ likes it ("clean · light mode looks like it belongs now"). Money confirmed the language holds on a dense calm management surface (flat cards lift by shadow; no navy/celebration — the calm counterpoint). **Live comp: claude.ai artifact** (source `scratchpad/debt-comp-artifact.html`). The identity, to be ratified/refined with Jason:
- **Cool slate/navy identity** kept from the current Debt app (which nailed dark); **single blue accent** (dropped the blue/purple split), green + gold are **semantic** not brand, and **warmth (gold) is spent only on the beats**.
- **Navy hero/beat panels are CONSTANT in both themes** — the payday number, the progress ring, and the paid-off moment always sit on the deep navy. This is the parity + identity move: the emotional beats are byte-identical premium in light and dark, and light finally carries the brand ground it was missing.
- **Light-mode diagnosis + fix (Jason's ask):** light trailed dark because (1) near-white cards on a near-white ground gave almost no elevation, and (2) the navy identity vanished entirely. Fix: light lifts white cards via a **soft navy-tinted shadow** (depth without value-jump), on a cooler tinted ground; navy panels restore the identity. Verified light == dark premium bar ([[feedback_light_mode_equal_premium]]).
- **Maps to** `apps/rn/src/theme/colors.ts` (refine, don't reinvent). **First-draft caveats:** motion (count-ups, ring fills, cascade, haptics) reads static; icons are SF-Symbols placeholders; not final pixels.
- **Remaining 0.2:** Jason's react → motion spec (the vocabulary + the celebration tiers as real animations) + the Money surface + token updates in the RN theme. Resolves D7 (full deliberate reset now).

## 7. Cut / deferred (from the benchmarks)
- **Live Activity / Dynamic Island** — confirmed hollow for a multi-year countdown (Apple ~8h cap); only an honest bounded "payday-day checklist session" version, prototype-only, never a v1.7 dependency.
- **Android native edges** (Glance widgets · Material 3 Expressive/dynamic color · App Actions/Quick-Settings · list-detail adaptive · Wear tile) → **v1.8, as Android's OWN treatment, not a port.**

## 9. Native-capability tech-choice map (0.5)

Per surface: RN vs. native, the tool, and when. From `DEBT_BENCH_NATIVE_2026-07-20.md`. Principle: **use native only where it earns a first-class result RN can't; each platform first-class on its own terms; iOS native edges in v1.7, Android's own edges at v1.8.** Verdict up front: **nothing forces leaving Expo** — the iOS-native surfaces are authored as SwiftUI targets *inside* the Expo app via `expo-apple-targets`.

| Surface | Call | Tool | When |
|---|---|---|---|
| **Home-screen widget** | **Native — worth it (the flagship edge)** | SwiftUI target inside Expo (`expo-apple-targets`) + App-Group bridge, ~1 Swift file | v1.7 (iOS) |
| **App Intents / Siri / Spotlight** | **Native — near-free rider on the widget** | App Intents, reuses the widget's plumbing | v1.7 (iOS) |
| **Haptics** | **RN + one tiny native module** | `expo-haptics` (≈90%) + 1 Core Haptics payoff pattern | v1.7 |
| **Progress / celebration visuals** | **RN GPU** | Skia (per the motion spec) | v1.7 |
| **iPad adaptive layout** | **RN** — escalate a single pane to native only if device QA shows a gap | RN adaptive three-column; Fabric-embedded `UISplitView` fallback | v1.7 |
| **Accessibility** | **RN cross-cutting + platform hooks** (a first-class surface, §10) | RN a11y props (labels/roles/live-regions) + native VoiceOver, Dynamic Type, Reduce Motion/Transparency | designed-in Phase 1 · device-audited at the gate |
| **Live Activity / Dynamic Island** | **CUT — confirmed hollow** (Apple ~8h cap vs. a multi-year countdown) | bounded payday-session = prototype-only, never a launch dep | — |
| **Android native edges** | **Android's OWN treatment (not an iOS port)** | Glance widgets · Material 3 Expressive/dynamic color · App Actions + Quick-Settings tile · list-detail adaptive · Wear tile · `VibrationEffect` | v1.8 |

**Scope call for v1.7 iOS:** widget + App Intents + haptics + Skia visuals + RN-adaptive iPad + accessibility (§10). Live Activity cut. Android edges → v1.8. _(Rec: yes — the widget is the flagship acquisition-grade native edge with a real on-device advantage over bank-connected rivals; App Intents ride nearly free on it; native iPad is required for the bar.)_

## 10. Accessibility design-standard (0.6 — first-class, designed-in)

Accessibility is a **foundation concern, not a Phase-4 checkbox** — designed into every surface, verified in both themes. The **standard is universal (WCAG 2.2 AA + Apple/Android a11y HIG)**; the **expression is Debt's own** — first-class a11y for Debt (the payday-plan read-aloud order, the debt-paid-off announcement) is Debt-specific, not a Freedom port. Freedom's shipped `ACCESSIBILITY.md` is a proven **method + floor** we borrow (the systematic single-utterance labeling, the ASC Nutrition-Label discipline) — a reference, **not the ceiling or the identity** ([[feedback_sibling_app_reference_not_ceiling]]). It's both a cross-cutting design principle and a platform surface.

**The standard (WCAG 2.2 AA + Apple/Android a11y HIG, expressed for Debt's own surfaces):**
- **Screen readers (VoiceOver / TalkBack):** heading roles on every screen; cards/rows collapse to **single-utterance labels** (name · sub · tag · amount) with action hints; decorative visuals — progress rings, glow, gradients, **the Skia celebration** — are hidden from the a11y tree with their meaning surfaced in words.
- **Announcements / live regions:** count-ups announce the **final** value (never mid-roll — Freedom's stat-row lesson); the debt-free-date recalc, what-if activation, validation errors, and blocking states announce on change; **the debt-paid-off celebration announces the milestone in words** ("Visa paid off — $740 saved; your $600 now goes to Car loan") with the haptic retained.
- **Differentiate-without-color (both themes):** every color signal has a text/shape/glyph backup — Focus debt = a "Focus" label (not accent-only) · milestone hits = ✓ · "18 days sooner" reads in words · on/behind states stated in text. (Our palette already avoids APR traffic-lighting.)
- **Dynamic Type / Larger Text:** no `allowFontScaling={false}`; rows use `minHeight` (grow, don't clip); hero numbers `adjustsFontSizeToFit`; layouts reflow, never truncate.
- **Contrast:** both themes to WCAG AA; the navy hero text is constant across themes (contrast holds by construction); spot-verify ratios at the gate.
- **Reduce Motion:** done (motion spec) — final frame, haptics retained. **Reduce Transparency:** glass/overlay tokens get a solid fallback.
- **Tap targets ≥ 44pt;** Switch/Voice-Control reachability; sane focus order.

**ASC Accessibility Nutrition Labels (declare only what's verified):** VoiceOver · Larger Text · Sufficient Contrast · Differentiate Without Color · Reduced Motion · Dark Interface. (Captions / Audio Descriptions = N/A.)

**Process:** a11y-as-built in Phase 1 (shared primitives carry labels → one fix propagates) → the systematic gap-closing pass + web-harness role/label verification in Phase 4 (quality) → the **device half** (real VoiceOver/TalkBack rotor walk + Dynamic-Type sweep + contrast spot-checks) at the Phase-6 release gate + the pre-submit gate. Native verification is the honest one. iOS a11y now; TalkBack + Android a11y at the v1.8 Android pass (its own treatment).
