# Capacitor-Constraint Evidence Audit (v1.7 §0.4) — 2026-07-17

> **Remit (verbatim intent):** an adversarial architectural audit scoped SOLELY to whether Capacitor has become a constraint on Debt's future evolution. **Assume no rewrite is approved; gather evidence, do NOT recommend one; identify every place Capacitor IS measurably limiting the product AND every place it is NOT; distinguish problems caused by (a) Capacitor vs (b) legacy architecture vs (c) normal software aging; assess the future-scope impacts of staying on Capacitor.** Benchmark: Debt should be able to be 100% as native + modern as the sibling Freedom app (React Native / Expo). Pulled into the active queue 2026-07-17 (decoupled from the old "after Freedom v1.0 approved" trigger — the benchmark now exists since Freedom's build is done).

## Conclusion: **STAY on Capacitor. No rewrite. The migration re-eval is NOT triggered by any v1.7→v2.0 demand.**

Nothing in the roadmap hits a Capacitor wall. IAP/Premium+ is pure JS store-wiring; the Drift Tracker is pure TS engine math; Android is a *net advantage* under Capacitor (the static export serves the same `out/` bundle to both platforms); and the v1.10 native surfaces (widget + Live Activity) reach the **same native ceiling as Freedom** because those surfaces are Swift extension processes in *both* stacks — the WebView is not involved. Staying costs a ~1–2 day per-surface toolchain tax on the widget/LA versions vs Expo's turnkey `@bacons/apple-targets`; it does not cap the ceiling and it saves the entire Android port.

## Where Capacitor IS measurably limiting (evidence)

| Place | Evidence | Caused by |
|---|---|---|
| WKWebView-only CSS render bugs invisible to browser tests | The v1.6 reconcile-row overlap "only appeared in real iOS WKWebView… neither Chromium nor Playwright's WebKit reproduced it," costing 2 blind TestFlight fixes + a bespoke iOS-sim screenshot pipeline (`docs/IOS_SIM_SMOKE.md:3`) | **(a) Capacitor** — strongest signal |
| WebKit flex-`<button>` control breakage | A whole custom lint guard + 19-row migration backlog exist solely to police a WebKit flex quirk (`scripts/check-webkit-flex-controls.ts`, `V17_PLAN §1.6`) | **(a) Capacitor/WebKit** |
| iOS Dynamic Type doesn't scale the UI | `app/page.css` has **826 px-based vs 250 rem-based** size declarations; a11y (v1.10) must convert px→rem app-wide because the WebView doesn't honor iOS text-size like native text | **Mixed (a) WebView + (b)** px-authored CSS |
| Committed (non-generated) `ios/` project | A Widget/Live-Activity target must be added + maintained by hand in Xcode and survive `cap sync`; Freedom's `@bacons/apple-targets` re-generates it declaratively on every prebuild | **(a) Capacitor toolchain ergonomics** (one-time setup tax, not a blocker) |

## Where Capacitor is NOT limiting (parity with native / Freedom)
- **Premium+ IAP** — `@revenuecat/purchases-capacitor@13.1.5` = full parity with RN's `react-native-purchases`; the v1.7 work is pure JS.
- **Drift Tracker** — pure TS engine math; byte-identical on RN.
- **Local notifications / biometric App-Lock / haptics / StatusBar / in-app review / app-state** — all first-class plugins on par with native.
- **Android** — a *positive*: shared static bundle, `@capacitor/android` installed, `codemagic.yaml` half-wired. Same "one codebase, both platforms" win RN/Expo gives.
- **Rollover perf lag** — **NOT Capacitor.** Algorithmic (`buildPayoffTrajectory` loops to 600 months; `computeInterestSaved` runs `projectDebtPayoff` twice in a sync useMemo cascade). **(b) legacy architecture** — would lag identically in RN. *Do not let this be cited as migration justification.*
- **v2.0 backend need** — the `output:"export"` no-server constraint is **(b) a Next-static-export choice, not Capacitor**; the plan already externalizes it to a thin standalone backend. Sound.
- **Dead `expo`/`react-native` deps** — confirmed **zero imports**; pure cruft (a leftover, not a half-migration). The §1.4 dead-dep purge is safe.

## Future-scope impact of staying on Capacitor
- **v1.10 native surfaces (widget + payoff Live Activity):** FEASIBLE to Freedom's ceiling. The plan's own design (App Group + JS-written summary blob + tiny native plugin + WidgetKit/ActivityKit) mirrors exactly how Freedom already does it (`src/widget/widgetSync.ts` debounces + change-gates writes to stay inside WidgetKit's reload budget — a proven pattern to copy directly). Delta vs Freedom = **ergonomic, not capability**: manual Xcode target + a thin App-Group bridge plugin + a **second `codemagic.yaml` signing profile** for `…​.widget` + a `docs/WIDGET_SIGNING_SETUP.md`. Adding the App Group is a new App-ID capability → **regenerate provisioning profiles** (hard rule). Timebox the target plumbing before committing to the feature.
- **v1.8 Android:** FEASIBLE, Capacitor neutral-to-positive. Blockers are ordinary (B1 per-platform key, B2 notification drawable, Gradle signing, Play billing) — same class RN would require; the shared bundle is a genuine saving.

## Recommended plan adjustments (carried into the feasibility audit)
1. Add a **"native-surfaces infra spike"** to the widget/LA version (manual target · App Group + profile regen · App-Group bridge plugin porting Freedom's debounce/change-gate · second signing profile + `WIDGET_SIGNING_SETUP.md`).
2. Keep prioritizing the **iOS-sim golden-image gate** (its planned enhancements) — it's the cheapest insurance against the recurring "browser-green, device-broken" WKWebView cost, and *why* Capacitor stays viable.
3. Annotate the §1.5 perf work as explicitly **not Capacitor-caused** so it can't be misread as migration evidence.

**Bottom line:** the evidence does not point to a rewrite. The Capacitor→RN migration re-eval remains untriggered; revisit only if the v1.10 native-surface plumbing proves painful in practice.
