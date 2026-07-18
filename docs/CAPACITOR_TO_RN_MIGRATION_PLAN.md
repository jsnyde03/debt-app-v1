# Debt Planner — Capacitor → React Native (Expo) Migration Plan (2026-07-18)

> **What this is:** the thorough migration audit Jason ordered — evaluating the app as it stands now and returning **(1)** an implementation plan for the rewrite, **(2)** the LOE, and **(3)** a parallel-execution plan that makes progress **without stopping the Debt release train** (large versions acceptable). Plus added criteria I deemed essential: data/storage continuity, portability census, native-parity + Freedom reuse, App-Store cut-over & rollback, and a risk register with portfolio opportunity cost.
>
> **Method:** 7 parallel read-only audit agents (surface/parity census · portability census · native-parity + Freedom reuse · data/storage continuity · migration strategy & cut-over · LOE & phasing · parallel-execution + risk). Synthesized here.
>
> **Honest framing up front:** three independent angles (this repo's `CAPACITOR_CONSTRAINT_AUDIT.md`, the strategy angle, and the risk angle) each concluded the migration's benefit is **"ergonomic, not capability"** — *no roadmap item hits a Capacitor wall*, and the v1.10 native surfaces reach Freedom's ceiling in **both** stacks. So this migration is **not technically forced**; it is a **strategic bet** (stop the recurring Capacitor tax + decision-debt, and standardize Debt on the portfolio's RN stack). This document is the plan **for executing it well if/when committed** — and the recommendation (bottom) is a low-regret way to commit incrementally on evidence rather than all at once.

---

## ✅ DECISION (Jason, 2026-07-18) — **Option B: full migration COMMITTED**
Jason chose to commit the full migration, over the "commit Gate 1 first" recommendation. Rationale (stronger than the audits' "not forced today" framing): the migration is **inevitable** given the v2.0+ feature/polish hyperdrive, and its LOE only grows with surface area — so the cheapest version of an inevitable migration is the soonest. "Not forced" ≠ "not right."
- **The commitment is to the destination; execution still runs through the gates** (now execution checkpoints, not go/no-go-on-the-decision) — the live earner stays protected and every step abort-able.
- **The release train does not stop:** v1.7 (Premium+/Drift) + v1.8 (Android) ship on Capacitor behind the **v1.8 UI Freeze Line**; RN cuts over after.
- **Data-continuity is proven on a real upgraded device before cut-over** — non-negotiable.
- **D1 resolved:** the migration IS v1.7's debt-kill → v1.7-on-Capacitor **drops** the throwaway in-place God-file/CSS/Tailwind refactor and **keeps** the revenue spine + the stack-agnostic core work (= the `packages/core` extraction, Gate 1). God-files die by being rebuilt clean in RN.
- **Own standalone portfolio initiative**, interleaved — never a monopolizing block; must not preempt the protected finance slot or starve the bet rotation.
- **First concrete step: Gate 1** (extract `packages/core` + stand up `apps/rn` with one screen at parity). Sequencing of when Gate 1 becomes active work vs. shipping v1.7's revenue spine first = confirm with Jason.

---

## Headline numbers

- **Portability:** ~**55% of the TypeScript** (13,030 LOC) and **68% of files** port essentially unchanged. Only **2.8% (8 files, 668 LOC)** is genuine native re-glue. The rewrite is **the presentation layer**, not the domain.
- **The rewrite cost concentrates in two places:** the **3 God-files** (`page.tsx` 1,513 · `SnowballSection` 1,396 · `ResultsSection` 908 = 3,817 LOC) and the **11-file hand-written CSS system** (8,861 LOC, **1,531 px declarations** + a separate 790-LOC dark-theme pass) → RN `StyleSheet` + theme tokens.
- **LOE:** ~**6–10 weeks ≈ 6–9 version-blocks** central (band: ~5 blocks optimistic → ~10+ pessimistic). **Half the effort (P3) is rebuilding screens.**
- **The two decisive risks:** **data-loss** (Critical, solvable — the true cut-over blocker) and **portfolio opportunity cost** (High, irreducible — one pair of hands vs. the finance core + bet cadence).
- **Why it's viable at all:** the pure-TS **engine + the ~8k-LOC reconciliation test suite are a frozen, verified island** that moves untouched — so the migration is a UI re-skin over a shared, test-locked brain, and it's **parallelizable against the release train.**

---

## Deliverable #1 — Implementation Plan

### Target stack — clone Freedom's spine, one deviation
Verified against `FinancialFreedom/package.json` + `app.json`:

| Layer | Target | 
|---|---|
| Runtime | **Expo SDK ~56 · RN 0.85 · React 19**, New Architecture ON |
| Router | **expo-router** (file-based, typed routes), `Stack` + `Stack.Protected` for the onboarding/lock gates |
| **State** | **zustand vanilla store** + thin React binding (Debt has *no store* today — this is a re-architecture, not a port) |
| **Persistence** | **react-native-mmkv** (encrypted) via a platform-split adapter, debounced autosave + flush-on-background |
| Styling | **`StyleSheet.create` + a token theme** (colors/typography/spacing/motion). No styling library. |
| Animation/gesture | **Reanimated 4 + react-native-gesture-handler** (for `SwipeActionCard`, accordions, pull-to-refresh) |
| Charts | **react-native-svg** (SnowballSection's inline SVG trajectory) |
| Sheets | **@gorhom/bottom-sheet** (the ~8 overlay/sheet patterns collapse to one primitive) |
| Native | expo-haptics · expo-notifications · expo-local-authentication · expo-store-review · expo-status-bar · react-native-purchases |
| Widget (v1.10) | **@bacons/apple-targets** — declarative, regenerated on prebuild (the ergonomic win over Capacitor's hand-maintained Xcode target) |
| Observability | @sentry/react-native · posthog-react-native |

**The one deviation: the paywall reference is Gig, not Freedom.** Freedom is zero-upsell — it has `react-native-purchases` installed but **no wrapper code, no paywall, no biometric lock, no in-app review.** Debt's RevenueCat paywall, biometric app-lock, and in-app review have **no Freedom reference** — they're standard-library drop-ins Debt writes fresh (copy Gig's RN IAP), and **IAP needs real StoreKit-sandbox device-verification budget.**

### Strategy — big-bang parallel rebuild (the only physically possible option)
The Capacitor↔RN boundary is a hard process boundary: an RN `<View>` can't mount in a WKWebView and vice-versa. So a **strangler** or **screen-by-screen-behind-a-flag** approach is *physically impossible* without shipping both runtimes in one binary (two persistence worlds fighting over the same data). **Reject on physics, not preference.** The only real choices are big-bang or two-apps, and big-bang wins because:
- the engine is already portable (the parallel app starts with ~14k LOC of proven, test-covered logic on day one);
- Debt is local-only/no-backend (no live data plane to keep in sync during a long dual-run);
- Freedom is a finished reference for ~90% of the surface;
- parity is **measurable** (the ported reconciliation suite is the oracle).

### Structure — monorepo-ify the single Debt repo (do NOT fork)
```
debt-app-v1/                 (same repo, same git history, same App Store record)
├─ packages/core/            ← ~67 pure-TS files: engine, debt math, forecast, timeline,
│                              payCycle, recurrence, insights, history, storage schema +
│                              migrations, types, constants, + the reconciliation suite.
│                              ONE copy, imported by BOTH shells → logic can't drift.
├─ apps/capacitor/           ← existing Next/Capacitor app = the LIVE earner, keeps shipping
└─ apps/rn/                  ← new Expo app (seeded from Freedom's template)
```
A shared `packages/core` makes engine parity **structural, not disciplined** — every v1.7→v1.9 engine change (Drift `computeDrift`, BNPL math, AU/NZ date formatter, `roundMoney` dedup) is written once and flows to both shells. **This within-Debt monorepo does not violate the no-shared-code-across-apps rule** ([[user_debt_app_learning_sandbox]]) — `packages/core` is consumed by the two Debt shells only.

### Native re-glue (8 files, near-1:1 swaps)
`revenueCat` (→ react-native-purchases, copy Gig) · `safeStorage` (→ MMKV; **sync→async is the one real friction** — ripples into every persisted hook's init) · `scheduleNotifications` (→ expo-notifications + **lift Freedom's `with-local-notifications-only.js` config-plugin** to avoid an accidental Push entitlement) · `useAppLock` (→ expo-local-authentication, net-new native → **profile regen + device-verify**) · `useDarkMode` (→ Appearance + expo-status-bar) · `haptics` (→ expo-haptics) · `requestAppReview` (→ expo-store-review) · `icons` (→ lucide-react-native).

### Build order (structure-first, [[feedback_structure_first_build_order]])
scaffold → **port engine + tests (green oracle first)** → storage/state rewire → rebuild screens (design-system foundation → nav shell → 3 God-files → secondary → onboarding/misc) → native re-glue → data-continuity bridge → parity QA → cut-over. **Screens last, never screen-first.**

---

## Deliverable #2 — LOE

Unit = relative effort (normalized to ~100). Calendar assumes the portfolio's solo + heavy-AI cadence. "Version-block" ≈ ~1 focused week.

| Phase | Scope | Units | Calendar |
|---|---|---:|---|
| P0 | Scaffold Expo app (clone Freedom config/CI/theme skeleton) | 3 | 1–2 d |
| P1 | Port engine/logic/tests (get the reconciliation suite green on RN = the parity oracle) | 5 | 2–3 d |
| P2 | Storage + state rewire (localStorage→MMKV; hooks vs. zustand fork) | 7 | 3–5 d |
| **P3** | **Rebuild screens — THE BULK** (design-system 9 · nav shell 6 · SnowballSection 9 · ResultsSection 6 · Debts cluster 7 · Timeline+Amort 4 · sheets/settings/goals 6 · onboarding/misc 3) | **50** | **4–5 wk** |
| P4 | Re-glue native plugins (thin; app-lock is net-new) | 8 | 4–6 d |
| P5 | **Data-continuity bridge** (WKWebView→MMKV on a live paying app) | 8 | 3–6 d **(HIGH variance)** |
| P6 | Parity QA (reconciliation suite on RN + Maestro + functional audit + TestFlight) | 12 | 1–1.5 wk |
| P7 | Cut-over / staged release / rollback | 7 | 2–4 d |
| | **TOTAL** | **100** | **~6–10 wk ≈ 6–9 blocks** |

**Band:** ~85 units optimistic → ~150+ pessimistic. Optimism = Freedom donates cleanly + simple data bridge. Pessimism = God-files resist decomposition, the two-release data dance slips, parity QA surfaces number-drift on the live earner. **Excludes** net-new features, native-iPad adaptation, and RN-Android re-QA (Capacitor already gives Debt Android; an RN Android target adds ~1 block).

---

## Deliverable #3 — Parallel-Execution Plan ("don't stop the train")

### The mechanism
1. **Shared `packages/core`** (above) → logic is written once; **logic drift is zero by construction.** Both shells import the same test-locked engine.
2. **The "UI Freeze Line" — after v1.8 (Android) ships.** v1.7 (the debt-killer + Premium+ + Drift) and v1.8 (Android — net-positive under Capacitor, net-negative to abandon mid-migration) ship on the **stable Capacitor shell**. At the line, Capacitor → **maintenance + engine-only** (still gets every `packages/core` feature for free, takes **no net-new UI**). After the line, net-new UI (v1.9 multi-scenario UI, v1.10 widget/Live-Activity) builds **RN-first.** This converts parity from a moving target into a **fixed screen inventory frozen at v1.8** that RN must match once — without it, RN chases a target that regenerates every version and cut-over never arrives (the perpetual band-aid Jason is escaping).
3. **Four abortable go/no-go gates**, each leaving the Capacitor earner fully shippable:

| Gate | Deliverable | Abort cost / salvage |
|---|---|---|
| **Gate 0** | Decision: migration approved as the path | — |
| **Gate 1** | `packages/core` extracted; **both** apps build against it; RN shell boots + renders **one real screen (the plan/allocation result) at parity on device** | **~Days. Fully salvageable** — the extraction *also* serves the in-place refactor + the shipping app's tech-debt paydown. Aborting loses almost nothing. |
| **Gate 2** | Core flows (onboarding→add debt→plan→payday→paywall) work in RN on device | RN parked, Capacitor keeps shipping. Engine work already banked. |
| **Gate 3** | Full cut-over certification (below) incl. **data-migration shim proven** + rollback ready | Don't flip; keep shipping Capacitor. No user impact. |

**Gate 1's deliverable is the shared prerequisite of BOTH the in-place refactor and the migration** — so the first, riskiest commitment is fork-agnostic; you learn the real per-screen port cost and untangle the God-files before betting the version on RN.

### Cut-over certification (Gate 3 — all green, or don't flip)
Per-screen parity checklist (same inputs → same plan output, easy because both call one core) · ported test suites green (reconciliation + Maestro) · both portfolio release-gate HARD RULES against the RN binary ([[feedback_presubmit_functional_audit]], [[feedback_pre_submit_testflight_qa]]) · **Premium & Premium+ purchase/restore device-verified** (close the blind spot — this path has zero automated coverage today) · **data-migration shim proven on a real populated upgrade** · rollback binary ready + phased release armed.

---

## Added criterion — Data & Storage Continuity (SHIP-BLOCKER)

**The single highest-severity item.** Debt stores **100% of user data in WKWebView `localStorage`** (`lib/storage/safeStorage.ts`; keys `debtPlanner.*`) — no native prefs, no SQLite, no cloud. **A fresh RN app cannot read WKWebView `localStorage`** (WebKit-private, origin-partitioned by `capacitor://localhost`). A naive same-bundle-id update from Capacitor→RN boots to an **empty MMKV store → every existing user's debts/goals/history appear gone.** For a local-only, no-cloud financial app, that is catastrophic, irreversible, and review-bombing.

**Reconciliation of the agents:** the schema *shape* + migration code port intact (portability census — true), **but the runtime byte-migration is a real ship-blocker** (data + strategy censuses — authoritative). Don't conflate the two.

**The plan (belt + suspenders — data loss gets all three):**
1. **Primary — a two-release handoff.** Ship a **final Capacitor `1.6.x`** that, on launch, writes the full `debtPlanner.*` snapshot to a location the RN app can read natively (an **App-Group container** or `Documents/` via `@capacitor/preferences`/filesystem). RN `2.0.0` reads it on first launch, **carries `schemaVersion` verbatim**, runs the ported `migrateState()`, deletes the blob. (Avoid reading WebKit's undocumented on-disk `.localstorage` format directly — build the handoff, not the archaeology.)
2. **Backstop — a first-launch WebView bridge** in the RN app (a hidden `react-native-webview` at `capacitor://localhost` that reads `localStorage` and posts it out) for users who skip straight from an old Capacitor build to `2.0.0` and never ran the interim `1.6.x`.
3. **Fallback — the JSON export/import** (port Gig/Freedom's `expo-document-picker` path). ⚠️ **The current JSON export is PARTIAL** (`app/page.tsx` `buildBackupData` omits settings, `schemaVersion`, milestone/streak counters) — **widen the export envelope before the cut-over** or the JSON path silently drops data.
- **Mandatory validation:** prove it on a **real device with a real pre-populated Capacitor install** across an OS restart (WebKit can evict "cache" localStorage under pressure; browser/sim will not reproduce any of this — matches Debt's documented "browser-green, device-broken" history). **No cut-over until a real upgraded install shows its data intact.**

## Added criterion — App-Store Cut-over & Rollback
- **Same bundle id** `com.jasonsnyder.debtplanner` + team `CVCY985YCD` → in-place upgrade, ratings/rank preserved (a new id would orphan the install base — never). Ship as **`2.0.0`**, build number monotonic above current `4`.
- **Regenerate provisioning profiles** for the new native modules + App Group ([[feedback_regenerate_profiles_on_capability_change]]).
- **Phased App-Store release ON** (1→2→5→10→20→50→100%); **watch Sentry per phase** ([[feedback_check_sentry_before_guessing]]) — a first-launch-crash or empty-store spike = the data bridge failing in the field; halt before widening. Hold 100% until the phased population clears a background→relaunch cycle clean (exercises the MMKV flush-on-background path a fresh-install test can't).
- **Rollback is ASYMMETRIC — design around it.** You can't downgrade installed users, and **reverting to Capacitor is *itself* data-loss** for anyone already on RN (they wrote MMKV; a Capacitor build reads empty localStorage). So: **primary lever = halt the phased release; rollback = expedited forward-fix `2.0.1`, not revert.** Build a **break-glass reverse-import bridge into the RN app from day one** (write a reverse-handoff snapshot on background) so a catastrophic Capacitor re-submit is *possible*. Keep the last green Capacitor build tagged (`debt-capacitor-1.6-final`) + its signed archive retained.

## Risk register (for the migration, if executed; post-mitigation)

| # | Risk | Sev | Likelihood (raw→mitigated) | Core mitigation |
|---|---|---|---|---|
| 1 | Live-earner regression | High | Med→**Low** | Shared core (logic byte-identical) · phased rollout + rollback binary · both release-gate hard rules on the RN binary |
| 2 | App-Store continuity/rejection | Med | Med→**Low** | Binary swap on same record · same RevenueCat account/entitlements · re-verify 3.1.2 · profile regen |
| 3 | **Data loss** | **Critical** | High→**Low (only if shim built + device-proven)** | The three-layer handoff above; Gate-3 hard blocker; real-device upgrade rehearsal |
| 4 | Feature-parity drift | High | High→**Med/Low** | Shared core (logic zero-drift) + the v1.8 UI Freeze Line + per-screen checklist |
| 5 | Dual-maintenance burden | Med | High→**Med** | Logic fixed once · freeze line kills double-*feature* build · ship-blocker-only UI double-fix triage |
| 6 | Scope-blowout (re-skin → de-facto rewrite) | High | Med/High→**Med** | Gates 1–2 force an empirical port-cost read on days' investment · line-budget ratchet carries into `apps/rn` · cut RN scope to the frozen v1.8 inventory |
| 7 | **Portfolio opportunity cost** | **High** | High→**High (irreducible)** | **Not mitigable by mechanism — only by decision.** Run as its own interleaved initiative ([[feedback_no_bet_goes_vaporware]] / [[feedback_bet_block_rotation_and_exit_line]]); do not preempt the protected finance slot or starve the bet rotation. The evidence ("ergonomic, not capability") tilts toward the in-place refactor; (B) is justified only if "stop band-aiding / one clean native end-state" is weighted above the displaced finance+bet output — a values call. |

---

## Recommendation

**Commit to Gate 1 now — not the whole migration yet.** Gate 1 (extract `packages/core`, decompose the 3 God-files, stand up `apps/rn` with one screen at parity on device) is the rare move that is right under *every* interpretation of your two decisions:
- It **IS the v1.7 debt-kill your D1 demands** (no-split, kill it in v1.7) — the God-file decomposition + core extraction is the highest-value, stack-agnostic robustness work, and it pays down debt on the *shipping* app immediately.
- It's the **migration's foundation** (the shared core + the first real RN screen).
- It **converts the A-vs-B decision from a guess into an evidence-based call** — you'll have the actual per-screen port cost in hand before betting 6–9 blocks on the full rebuild.
- It's **low-regret**: everything in Gate 1 is valuable whether or not you proceed to full migration.

Then make the **full-migration commit (Gates 2–3) deliberately, after Gate 1**, weighed against the finance core + bet cadence — with the honest knowledge that the evidence says it's a strategic bet, not a forced one, and that data-continuity is the real ship-blocker to prove out. Run it as its own interleaved initiative behind the v1.8 UI Freeze Line so the Debt release train (v1.7 debt-killer → v1.8 Android) never stops.

**Net:** the migration is feasible, de-risked by the portable core + Freedom, and the "don't stop the train" mechanism is real — but the disciplined path is to earn the big commitment at Gate 1 rather than declare it now.
