# iOS-Simulator smoke test — true-WKWebView screenshots before TestFlight

**Why this exists.** The v1.6 reconcile-row overlap only appeared in real iOS WKWebView — **neither Chromium nor Playwright's WebKit reproduced it**, so it slipped past every browser test and cost two blind TestFlight fixes. This workflow renders the app in an actual **iOS Simulator** on a GitHub-hosted **macOS** runner and screenshots the reconcile view in both themes, so we can *see* the genuine iOS render **before** cutting a Codemagic build.

**Cost:** $0. GitHub gives public repos free Actions minutes including macOS runners. (If the repo ever goes private, macOS bills at 10× — revisit then.)

**Timing:** it runs on GitHub, i.e. *before* you ever kick off Codemagic — that's the whole point.

## The pieces
| File | Role |
|---|---|
| `lib/testing/simSmokeSeed.ts` | The stress fixture — 9 long-named bills (Klarna, Sleep Number…), mixed manual/autopay, payday 2 days ago. Reproduces the exact "many wrapping labels" condition that broke on-device. |
| `app/page.tsx` (guarded effect) | In a build made with `NEXT_PUBLIC_SIM_SMOKE=1`, seeds the fixture once + reloads. **Inert in every production build** (the env check is inlined and tree-shaken out). |
| `.maestro/reconcile-smoke.yaml` | Drives the app: wait for the payday sheet → Adjust → screenshot reconcile → Mark all paid → screenshot. |
| `.github/workflows/ios-sim-smoke.yml` | macOS runner: build web (with the seed flag) → `cap sync ios` → `xcodebuild` for the simulator (unsigned) → boot sim → Maestro under dark + light appearance → upload screenshots. |

## How to run it
1. GitHub → the repo → **Actions** tab → **ios-sim-smoke** (left sidebar).
2. **Run workflow** ▸ pick the branch (`v1.6-dev`) ▸ **Run workflow**. _(It's manual-only for now — `workflow_dispatch`.)_
3. Wait ~15–20 min (macOS build + sim boot is slower than the Linux e2e).
4. Open the finished run → scroll to **Artifacts** → download **ios-sim-screenshots**.
5. Review `dark/reconcile-current.png`, `dark/reconcile-all-paid.png`, and the `light/` pair. **What to check:** each bill row's card fully contains its label + "Due …" date — no text spilling onto the next card.

## First-run iteration (I can't run macOS locally, so expect one tuning pass)
If the run fails, the two diagnostic steps make it quick to fix — read their logs in the failed run:
- **"List Xcode schemes"** — if `App` isn't the scheme name, update `-scheme` in the workflow.
- **"Boot the simulator" → `simctl list devices available`** — if `iPhone 15 Pro Max` isn't on the runner image, set `env.DEVICE` to one that is.
- App path wrong? It's `ios/build/Build/Products/Debug-iphonesimulator/App.app` — adjust if `xcodebuild` logs a different `CONFIGURATION_BUILD_DIR`.

## Once it's proven
Uncomment the `push:` trigger block in the workflow to auto-run on UI changes (`components/**`, `app/**`, `lib/**`) — free, so the only cost is ~15 min wall-clock per UI push.

## Extending it
Add screens by adding `takeScreenshot` steps to the Maestro flow (e.g. the Plan hero, amortization). To stress a different state, edit `buildSimSmokeState()` — keep due dates **within** the cycle window `[currentDate, nextPaycheckDate]` or bills fall into the next cycle and won't render this paycheck.

---

## Planned enhancements (priority order — implement AFTER the first green run)
_Teed up 2026-07-08. Do NOT start these until the base workflow is green once — a half-working pipeline + new variables = confusion (a stale cache during bring-up would mask real errors)._

### 1. Build caching — the speed win (do first)
The macOS job recompiles every Capacitor plugin from scratch each run (~10 min); Codemagic is <3 min *because* it caches. Mirror it:
- `actions/cache@v4` on `~/Library/Developer/Xcode/DerivedData` (compiled objects + SPM SourcePackages), key `${{ runner.os }}-xcderiveddata-${{ hashFiles('ios/App/App.xcodeproj/project.pbxproj', 'package-lock.json') }}`. Restore before the build step, save after; the key busts on a plugin/version change.
- `cache: npm` (already on setup-node) handles the npm side.
- Expected: subsequent runs ~15 min → a few.

### 2. Golden-image visual regression — turns it into a GATE
Today it's screenshots you eyeball; add a committed baseline + pixel-diff so it **fails automatically** on a layout regression.
- **Prerequisite (also a robustness + marketing win): freeze the status bar.** The sim status bar shows the LIVE clock (note "5:35 PM" in the failure shot) → every screenshot differs → any pixel-diff would always fail. Before screenshots: `xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3` (Apple's canonical 9:41 — deterministic + clean).
- Diff with `pixelmatch` + `pngjs` (pure-JS, no native deps) via a small `scripts/compare-ios-screenshots.mjs baseline/ artifacts/ --threshold 0.1`; on diff → fail + upload the diff image.
- Baselines committed under `tests/ios-baselines/{dark,light}/`, captured on the first green run (a `--update-baselines` path).

### 3. Auto-surface the screenshots (smoother review)
Artifact download is friction. (GitHub comments can't embed artifact images directly.)
- **v1 (simple):** a `$GITHUB_STEP_SUMMARY` table — pass/fail per screen + the artifact link.
- **nicer:** commit shots to an orphan `ios-screenshots` branch, post `raw.githubusercontent` links via `actions/github-script`.

### 4. Coverage — more screens + sizes
- `takeScreenshot` steps for the Plan hero, amortization, onboarding.
- Matrix the job over 2–3 simulators (narrow iPhone SE + Pro Max + iPad) — different widths catch different layout bugs.

### 5. Robustness
- Pin Xcode explicitly (`sudo xcode-select -s /Applications/Xcode_16.app`) so a runner-image bump can't silently break it.
- Wrap sim boot in a short retry (that step can flake).

### 6. Turn it on fully
Once stable: uncomment the `push` path-filter trigger · flip web-e2e's auto-trigger back on · add the workflow to `release/v1` for the manual dispatch button.

**Sequence:** 1 (speed) → 2 (gate, incl. the status-bar freeze) → 5 (robustness) → 4 (coverage) → 3 (review polish) → 6 (turn on).
