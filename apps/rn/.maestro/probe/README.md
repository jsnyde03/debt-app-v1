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

## What each file settles

| file | gates | if it fails |
|---|---|---|
| `p01-extended-wait.yaml` | every timed payoff currently asserted by screenshot-and-hope | the existing note in `06-tutorial-interactions.yaml` stands; those checks stay device-owed |
| `p02-openlink-scripted.yaml` | **§12.1–§12.7 — 15 checks** | the scripted run really is capture-lane-only; check the hierarchy for *which* failure it was |
| `p03-set-orientation.yaml` | §10's layout checks · §11.8's rotation half | 4.1.3's iPad boot loses rotation but keeps §11.15 |
| `p04-assert-screenshot.yaml` | §11.5 · §11.15 · §11.16 · theme parity, held between builds | visual checks stay "a human looks at a frame" |
| `p05-repeat.yaml` | §11.2's ten runs · §11.13's cold launches | both stay single-shot |
| `p06-evalscript.yaml` | derived assertions (§13.6's count, §12.0.3's count) | those two stay judged by eye |
| `../probe-conditions/p07-ax5-dark.yaml` | §11.1 · §11.5 · §8's theme half | three hand-run passes stay hand-run |

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
