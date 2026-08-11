# The capability probe (4.1.1)

**These files are not part of the suite.** They are expected to fail until each command is confirmed to
work on this Maestro build — that failure *is* the result. Run them with the workflow's `mode: probe`
input, never alongside flows 01–06.

```
gh workflow run native-e2e.yml --ref v1.7-dev -f mode=probe
```

## Why a probe exists at all

`docs/audits/2026-08-11-maestro-coverage/` measured that a Maestro simulator lane can carry **68 of the
device checklist's 127 real checks**. About a third of that number rests on commands and simulator
conditions this repo has never exercised. This directory converts them from *claimed* to *known* in one
CI cycle instead of one command per cycle.

⚠️ **One command per file, and each file is run in its own `maestro test` invocation.** Maestro validates
an entire file before executing any of it, so risk ordering only works at file granularity — and the
workflow records a verdict per file rather than stopping at the first red, because every file here
answers an independent question.

⛔ **That isolation was incomplete, and cycle 1 proved it.** It covered what a file fails to PARSE and not
what a file leaves BEHIND on the device. A leaked system modal is invisible to the design above: every
later file reports a red for its own command, and the verdict table reads as five capability gaps. **Any
file that can change device state outside the app under test runs LAST**, and the ordering is the
isolation — there is no per-file cleanup that can be relied on here.

## What each file settles

| file | gates | cycle 1 (2026-08-11) |
|---|---|---|
| `p01-extended-wait.yaml` | every timed payoff currently asserted by screenshot-and-hope | ✅ **PASS — `extendedWaitUntil` exists.** The limit recorded in `06-tutorial-interactions.yaml` was never real |
| `p06-evalscript.yaml` | derived assertions (§13.6's count, §12.0.3's count) | ✅ **PASS — `evalScript` + `assertTrue` work** |
| `p03-set-orientation.yaml` | §10's layout checks · §11.8's rotation half | ⛔ **never reached its command** — see below |
| `p04-assert-screenshot.yaml` | §11.5 · §11.15 · §11.16 · theme parity, held between builds | ⛔ **never reached its command** |
| `p05-repeat.yaml` | §11.2's ten runs · §11.13's cold launches | ⛔ **never reached its command** |
| `../probe-conditions/p07-ax5-dark.yaml` | §11.1 · §11.5 · §8's theme half | ⛔ **never reached its question** — and its red read as "the app breaks at AX5", which was false |
| `../probe-deeplink/p09-deeplink-scripted.yaml` | **§12.1–§12.7 — 15 checks** | ⛔ rewritten for cycle 2 — was `p02`, using Maestro's `openLink` |

## ⚡ What cycle 1 actually found

**One file's side effect masked five files' questions.** `p02` used Maestro's `openLink`, which made iOS
raise a SpringBoard-owned **"Open in "Debt Planner (RN)"? · Cancel / Open"** confirmation. Nothing
dismissed it. Maestro could not: the flow is scoped to the app, and the hierarchy captured at the next
failure contained **three elements, all status bar** — not the alert's buttons, and not the app's UI.

So every file after `p02` failed on its first assertion with its target text plainly rendered in the
screenshot. `p06` survived only because it asserts nothing about the screen.

⚠️ **The first diagnosis fit the verdict table perfectly and was wrong.** "p01 is the only file that
waited, so cold launches outrun the default timeout" explained every PASS and every FAIL — and the
contradicting evidence was already in hand, because flow 01 does the same bare assertion after the same
launch and has always been green. The hierarchy dump settled it; the table never could have.

**Two facts were confirmed anyway:** the URL scheme IS registered (iOS recognised it and offered the app
by name), and `openLink` works as a command. Only the confirmation is in the way — hence `simctl openurl`
in cycle 2, with the deep-link probe ordered **last** so a leaked modal cannot poison anything after it.

## ⛔ The rule that governs what happens next

**Anything that fails gets ledgered as device-owed. It does not get weakened until it passes.**

`06-tutorial-interactions.yaml` states this in its own header, and states why: *"an assertion that cannot
fail is worse than an absent one: it reports confidence nobody earned. This gate has already shipped four
of those."* Building out this lane roughly doubles the surface for that mistake.

## Known gaps in the probe itself

- **Reduce Motion is deliberately NOT probed.** It can be set (`simctl spawn booted defaults write
  com.apple.Accessibility ReduceMotionEnabled -bool true` + a `notifyutil` post), but the app exposes no
  observable that says whether RN's `AccessibilityInfo` picked it up — so a flow could set the condition
  and assert nothing about it. Setting a condition whose effect nobody checks is the exact
  cannot-fail trap above. Deferred to **4.1.6**, which needs an app-side observable first.
- **`p04` proves `assertScreenshot` runs, not that it DETECTS a difference** — a self-compare passes
  trivially. Detection is proven in **4.1.3** against a real committed baseline. The file says so itself.
