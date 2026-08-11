# How much of the device-QA checklist can Maestro carry?

**Question (Jason, 2026-08-11):** how much of `DEBT_3.5_DEVICE_QA_CHECKLIST.md` can be verified through Maestro?

**Target:** the checklist as it stands at `4c9f38e` — **136 checkboxes**, 9 of which are not checks
(build/install steps, "report back", two "if it fails, note it" clauses).

**Answer: of the 127 real checks, Maestro on an iOS Simulator can fully carry 68 (54%), take a
partial bite out of 26 (20%), and can never touch 33 (26%).**

⚠️ **Corrected 2026-08-11 (same day):** **30**, not 33, are out of reach of *any* automation. Three of
them — §10's ⌘-key checks — are Maestro limits that Appium can clear. See §2 and §7. The original
sentence made the exact mistake this audit exists to catch.

⚠️ **That 54% is a ceiling, not a promise.** Roughly a third of the YES verdicts rest on Maestro
commands and `simctl` conditions this repo has never exercised. §5 below is the one-run probe that
converts them from claimed to known, and it must run before any of this is treated as coverage.

---

## 1 · The six findings that matter more than the number

**① The item nothing guards is simulator-reproducible.** §11.15 — the iPad ring-origin invariant,
flagged in the checklist as *"this fix is currently guarded by NOTHING"* and first in its
priority order. The mechanism is that at iPad width the tab bar becomes a left sidebar, putting
window and local coordinates ~700pt apart. **An iPad simulator has that sidebar.** The reason web
cannot hold this fix — *"the overlay's origin is 0 there"* — is a browser fact, not a device fact,
and it does not apply to a simulator running the real RN renderer. This is the single highest-value
item in the file and it is automatable.

**② The item the whole nested-host mechanism exists for is a native-presentation question.** §13.1 —
the payoff-schedule coach-mark must render *over* a presented Modal, not behind it. That ordering is
a UIKit property; the checklist records that web puts the callout *1266pt down an 874pt screen*
because the browser uses normal document flow. A simulator has genuine `UIViewController`
presentation semantics — this is the same class of bug flow 04 already catches.

**③ Two checks the file declares unreachable are reachable.**
- **§14.3, the first-run fork** — marked *"⏳ Web e2e cannot reach this step — it is verified here or
  nowhere."* The stated blockers are that the paycheck step won't advance without input and "Skip for
  now" walks past the debt step. Maestro has `clearState: true` and `inputText`; it can type into the
  paycheck step and walk the fork properly.
- **§12.0.3, exactly one Example marker** — marked *"⏳ Web cannot answer this"* because RN-web's tab
  navigator leaves the previous screen painted. A simulator renders only the focused tab, which is
  precisely the condition the check needs.

**④ The scripted demo run is drivable, despite the checklist saying otherwise.** §12.1–§12.7 were
re-scoped on 2026-08-11 as *"owed to the capture/embed lane"* because *"a device build cannot pass
`?mode=scripted`"* — true for a human holding a phone, false for Maestro. `app.json` declares
`"scheme": "debtplannerrn"`, `demo.tsx:61` reads `mode` off the route, and Maestro has `openLink`.
`openLink: debtplannerrn:///demo?mode=scripted` should reach the scripted run directly. **That
recovers 17 checks currently owed to nobody.** (Contingent on expo-router's linking config resolving
that path — one line in the probe flow settles it.)

⚠️ **Measured 2026-08-11, probe cycle 1 — the finding HOLDS, the method does not.** Maestro's `openLink`
makes iOS raise a SpringBoard **"Open in …?"** confirmation that nothing in the flow can dismiss, and it
then poisons every later file. Two things were confirmed on the way: the scheme **is** registered (iOS
offered the app by name) and `openLink` works as a command. Cycle 2 uses `xcrun simctl openurl` instead
and runs the deep-link probe **last**. The 17 checks are still live; only the door changed.

**⑤ ⚡ The "Maestro can't wait" rule written into the flows is wrong, and it cost real coverage.**
`06-tutorial-interactions.yaml` records, as a lesson learned across three CI cycles at ~40 minutes
each, that *"this build rejects `extendedWaitUntilVisible` (unknown command) and `timeout` on
assertions (unknown property)"* — and concludes that a timed sequence cannot be waited for, so the
beat-4 release ack is asserted by nobody and *"ledgered as device-QA-owed."*

Both rejections were real. The conclusion drawn from them was not. **The command is
`extendedWaitUntil`** — `extendedWaitUntilVisible` is a name that has never existed in Maestro, and
`timeout` is invalid on an assertion precisely *because* it belongs to `extendedWaitUntil`:

```yaml
- extendedWaitUntil:
    visible:
      id: "release-ack"
    timeout: 15000
```

Two wrong spellings of one command produced a documented capability limit that isn't one. The same
audit found **seven** other commands the repo has never used, several of them load-bearing here:

| command | what it unlocks |
|---|---|
| `extendedWaitUntil` | every timed/animated payoff currently asserted by screenshot-and-hope |
| `assertScreenshot` | ring geometry, dock frost, theme parity — with a threshold, against a baseline |
| `setOrientation` | §10 and §11.8's rotation halves, on an iPad sim |
| `repeat` | §11.2's ten runs, §11.13's repeated cold launches |
| `retry` | flake containment without weakening an assertion |
| `runScript` / `evalScript` | JS between steps — counting elements, deriving expectations |
| `waitForAnimationToEnd` | the paint races in §11.13 and §12.5 |
| `startRecording` / `stopRecording` | §11.12's travelling highlight as video, not stills |

**⑥ Accessibility text size and theme are `simctl` one-liners.** `xcrun simctl ui booted content_size
accessibility-extra-extra-extra-large` and `xcrun simctl ui booted appearance dark` are scriptable,
and unlike RN-web (`PixelRatio.getFontScale()` is permanently 1) the native renderer honours them.
That makes §11.1 (Skip on screen at AX3/AX5, both themes) and §11.5 (the header eating the highlight
at AX5) fully automatable — two of the checklist's more laborious human loops.

---

## 2 · What Maestro can never do — the honest floor

These **30** are not "hard", they are structurally out of reach, and no amount of lane investment moves
them. The 31st–33rd rows below are the ones that turned out to be *tool* limits, kept in place with the
correction visible rather than deleted:

| class | items | why |
|---|---|---|
| **Haptics** | finale AHAP crescendo · §3 chart detents + payday capture · §11.6 | A hand is the only instrument. |
| **Siri / Shortcuts** | 4 checks | No Siri on a simulator. |
| **Camera** | §3 scanner | No camera on a simulator. |
| **Home Screen / Lock Screen / StandBy** | all 7 of §5 (widget) · 6 of §6 (Live Activity + Dynamic Island) | Springboard surfaces outside the app under test. The App-Group *bridge* is testable another way; the *placement* is not. |
| **Real StoreKit** | §12.4 prices · §3 RevenueCat | The sim serves the local config, so "not the $4.99 fallback" is exactly what it cannot prove. |
| **iPad hardware input** | §10's pointer hover (2 checks) | There is no pointer. |
| **⚠️ CORRECTED 2026-08-11** | §10's ⌘N · ⌘1/2/3 · ⌘ HUD (3 checks) | **Not impossible — impossible in MAESTRO.** `pressKey` has no modifier chords, but Appium's XCUITest driver has `mobile: keys` with a `modifierFlags` bitmask (iPad-only, Xcode 15/iOS 17+ — which is exactly §10's scope). Filed as the trigger case below, not as a floor item. The original wording made the same mistake this audit was written to catch: a limit of one lane recorded as a limit on automation. |
| **Split View / Stage Manager** | §10 · §11.8(b) | Not scriptable. |
| **Real-hardware performance** | §11.12 travelling highlight · §11.2's premise · §11.14 press feedback | The runner is desktop-class. The checklist already says this itself. |
| **VoiceOver speech** | §12.6 rotor headings · §11.7(c) speaking while locked | Simulator has no VoiceOver. |
| **Audio** | the debt-free chime | Unobservable. |

⚠️ **One nuance worth keeping.** Maestro drives the **accessibility tree**, so a large part of the
"VoiceOver" checks are machine-checkable even though speech is not. Flows 03 and 04 already document
that a `ListRow` surfaces as one composite element whose *full* text is the whole sentence — which is
exactly the property §12.6's "the dock reads as **one** utterance" is asking about, and exactly how
§11.4's "you cannot reach any control on the card behind the panel" would be proven. What stays
device-owed is announcement *timing* and *rotor traits*, not exposure and grouping.

---

## 3 · Section map

Verdicts: **✅** Maestro can carry it · **◐** partial (the automatable half is named) · **❌**
device-only · **—** not a check.

| section | ✅ | ◐ | ❌ | — | notes |
|---|---:|---:|---:|---:|---|
| BUILD 3 delta (finale · beat · shelf · Sentry) | 4 | 6 | 2 | 0 | the celebration *fires* and *dismisses* cleanly; the crescendo, the chime and "feels premium" do not automate |
| BUILD 2 delta (2 fixes · log payment · Siri) | 4 | 1 | 4 | 1 | payoff-schedule fix is already flow 04; all three log-payment checks are plain in-app journeys |
| §0 install | 0 | 0 | 0 | 4 | |
| §1 launch & foundation | 3 | 0 | 0 | 0 | both-theme via `simctl ui appearance` |
| §2 QA mode | 3 | 0 | 0 | 0 | |
| §3 app surface re-sanity | 3 | 2 | 3 | 0 | |
| §4 context menu | 5 | 1 | 0 | 1 | flow 03 covers the opening; only "is the blur *real*" is a judgement |
| §5 widget | 0 | 0 | 7 | 0 | springboard |
| §6 Live Activity / Island | 2 | 6 | 6 | 0 | the ◐ pattern is uniform: the in-app half (QA button, the resulting Undo/Keep card, undo reverts) is automatable; the Lock-Screen render is not |
| §7 preferences | 1 | 0 | 0 | 0 | |
| §8 both-theme spot check | 0 | 1 | 0 | 0 | Today + context menu yes; LA + widget no |
| §10 iPad | 2 | 0 | 6 | 0 | layout + rotation yes; keyboard, pointer, Split View no |
| §11 walkthrough | 8 | 5 | 3 | 0 | incl. **§11.15** ⭐ and **§11.11**, which nothing currently covers |
| §12.0 explore run | 7 | 1 | 0 | 0 | incl. **§12.0.3** ⭐ |
| §12.1–§12.7 scripted run | 15 | 2 | 2 | 0 | **gated on finding ④** — worthless if `openLink` doesn't route |
| §13 coach-marks | 5 | 1 | 0 | 0 | incl. **§13.1** ⭐ |
| §14 Money / mis-file rescue | 6 | 0 | 0 | 0 | the whole section, incl. **§14.3** ⭐ |
| §9 report back | 0 | 0 | 0 | 3 | |
| **total** | **68** | **26** | **33** | **9** | ⚠️ 3 of the 33 are Maestro-only limits — see §7 |

### The 8 walkthrough items Maestro can carry, itemised

| item | how |
|---|---|
| **§11.1** Skip on screen at AX3/AX5, both themes | `simctl ui content_size` × `appearance`, assert Skip visible on steps 1–6, tap it, assert the overlay is gone |
| **§11.5** the header must not eat the highlight at AX5 | same conditions + `assertScreenshot` against a baseline, or frames for a human |
| **§11.9** long debt name + the "Example" marker | rename via the sheet, walk to beat 5, assert the marker — the file's own highest-severity failure mode |
| **§11.10** the RNGH drag | already in flow 06 |
| **§11.11** scrolling near the slider must not move it | vertical `swipe` starting on the slider strip, then assert the floor value is unchanged — **currently covered by nothing, on either lane** |
| **§11.13** the cushion bar painted on arrival | `repeat` cold launches + `takeScreenshot`; 3.5.8 already found unpainted Skia *on the simulator*, so the condition demonstrably reproduces |
| **§11.15** the iPad ring lands on its subject | iPad sim, all 7 beats, both orientations ⭐ |
| **§11.16** step 5 on iPad landscape | screenshot for the composition call |

---

## 4 · What this costs

- The lane already exists and is free: `native-e2e.yml` on `macos-15`, GitHub minutes rather than the
  Codemagic 500. **~40 min wall-clock per run**, manual dispatch (plus release tags).
- The expensive failure mode is already documented in the flows: **Maestro validates a whole file
  before executing any of it**, so one unsupported command kills every beat in that file. Risk
  ordering has to be at *file* granularity. Every new command below therefore belongs in its own
  file until it is proven.
- An iPad simulator is a second boot + a second Maestro pass in the same job — no new
  infrastructure, and `native-e2e.yml` picks its device by name today, so it is a small change.

---

## 5 · The probe that has to run first

One throwaway flow, one CI cycle, ~40 minutes — it decides which third of the YES column is real.
Each command gets its own file so a parse failure costs one check, not the run:

1. `extendedWaitUntil` with `visible:` + `timeout:` (finding ⑤)
2. `openLink: debtplannerrn:///demo?mode=scripted` → assert the scripted dock renders (finding ④ —
   this alone gates 17 checks)
3. `setOrientation: LANDSCAPE_LEFT` on an iPad sim (findings ①, §10)
4. `assertScreenshot` with a `thresholdPercentage` against a committed baseline
5. `repeat` with `times`
6. `xcrun simctl ui booted content_size accessibility-extra-extra-extra-large` → does the RN tree
   actually reflow (finding ⑥)
7. Reduce Motion via `simctl spawn booted defaults write com.apple.Accessibility
   ReduceMotionEnabled -bool true` + a `notifyutil` post → **the least certain item here**; if RN's
   `AccessibilityInfo` doesn't observe it, §11.7(a) and the finale's reduce-motion check stay
   device-owed

⚠️ **The standing rule in `06-tutorial-interactions.yaml` applies to every check built on top of
this**: if a command cannot be made to work, ledger the check as device-owed — **do not weaken it
into something that passes.** The file already carries four assertions that shipped confidence
nobody earned, and this analysis would double the surface for that mistake.

---

## 6 · Recommendation

**Build the lane out, in this order — but run §5's probe first and re-read this document against its
result.** The deferred-backlog entry that scopes this work says extending Maestro to an iPad
simulator *"would take four items off the device's plate"*. Measured, it is far more than four: the
iPad boot alone carries §10's two layout checks, §11.8's rotation half, §11.16, and **§11.15 — the
item the checklist names as guarded by nothing.**

The sequencing that gets the most per CI cycle:

1. **The probe** (§5) — everything else is conditional on it.
2. **§14 + §13** — 11 checks, all on the existing iPhone sim, no new conditions. Cheapest real
   coverage in the file, and §14.3 stops being "verified here or nowhere".
3. **The iPad boot** — §11.15, §11.16, §10's two, §11.8's rotation half.
4. **§12.0 explore** — 7 checks on a run that has *never been on hardware*.
5. **§12.1–§12.7** — only if the probe's `openLink` step went green.
6. **AX/theme conditions** — §11.1, §11.5, §8's automatable half.

**What this does not change:** the device pass still has to happen. **30** checks are permanently a
human with a phone, and they include the most expensive failures in the file (Siri, StoreKit, the
widget bridge, haptics). The prize is that the pass gets *shorter and repeatable*, and that the
checks which currently regress silently between builds stop doing so.

---

## 7 · Appium — evaluated 2026-08-11. Recommendation: NO, for now

**Stay on Maestro; add Appium later as a second small lane, on a stated trigger.** Maestro carries 68
checks in flows that read at a glance, six of them already working, plus hard-won knowledge of this exact
CI setup. Appium buys ~3 new checks and one quality upgrade, for a WebDriverAgent build, session
management, and roughly 10× the code.

**The three real advantages, for the record:**

1. **System alerts.** Appium handles them natively (`autoAcceptAlerts` / `alert().accept()`). The
   SpringBoard modal that poisoned probe cycle 1 would have been a capability flag — an Appium session is
   not scoped to one bundle the way a Maestro flow is.
2. **⌘-key chords** — `mobile: keys` with a `modifierFlags` bitmask, **iPad-only, Xcode 15/iOS 17+**,
   which is exactly §10's scope. This is the §2 correction: those three checks are not floor items.
3. **Numeric geometry.** `rect`/`frame` are exposed element attributes, so **§11.15 becomes a containment
   assertion between two frames** rather than a human comparing screenshots. For the item the checklist
   calls guarded by nothing, that is stronger than `assertScreenshot`, not merely equivalent.

⚠️ **Checked against the driver docs, not recalled — and one assumption was wrong.**
`accessibilityTraits` is **not** exposed through XCUITest's element-attribute API (the list is
`label`/`name`/`type`/`value`/`rect`/`visible`/`accessible`/…). So §12.6's "rotor → Headings" stays
device-owed on **both** tools. Haptics, audio, frame rate and Siri are unchanged. And real-device Appium
needs WebDriverAgent **signing**, which lives in Codemagic — so it costs the free-lane property this whole
approach depends on.

**⏳ THE TRIGGER:** if probe cycle 2 returns `assertScreenshot` or `setOrientation` as missing, §11.15's
geometry has no Maestro answer at all, and a lane scoped to **§11.15 + §10's three ⌘ checks** becomes the
right call. Revisit this section then, and not before.

---

_Method: read against `4c9f38e` (`v1.7-dev`). Maestro's command set verified against
`docs.maestro.dev` 2026-08-11, not from memory; `native-e2e.yml` installs unpinned latest via
`get.maestro.mobile.dev`, so current docs apply. iOS **physical**-device support is still not in
official Maestro — simulator only — so every verdict here assumes a simulator._
