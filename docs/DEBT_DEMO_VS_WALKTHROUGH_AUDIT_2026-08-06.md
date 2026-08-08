# Debt — Demo vs Walkthrough Audit

Target version: v1.7. Date: 2026-08-06.

Scope: `tutorialSession`/`tutorialPath`/`TutorialOverlay` (the walkthrough) vs
`demoSession`/`demoRun`/`demoExit`/`demo.tsx`/`DemoDock` (the bounded demo),
and their shared substrate (`sandboxScenarios`, `sandboxStore`, `sandboxRun`,
`ExampleCanvasMarker`, `qa.ts`, root/tabs layout).

Files read directly (repo-relative to `debt-app-v1/`):
- `docs/DEBT_ELEVATION_PLAN.md` (§3.5.4/3.5.5 only)
- `apps/rn/src/store/tutorialSession.ts`
- `apps/rn/src/store/tutorialPath.ts`
- `apps/rn/src/components/plan/TutorialOverlay.tsx`
- `apps/rn/src/store/demoSession.ts`
- `apps/rn/src/store/demoRun.ts`
- `apps/rn/src/store/demoExit.ts`
- `apps/rn/src/app/demo.tsx`
- `apps/rn/src/components/plan/DemoDock.tsx`
- `apps/rn/src/store/sandboxScenarios.ts`
- `apps/rn/src/store/sandboxStore.ts`
- `apps/rn/src/store/sandboxRun.ts`
- `apps/rn/src/components/plan/ExampleCanvasMarker.tsx`
- `apps/rn/src/config/qa.ts`
- `apps/rn/src/app/_layout.tsx`
- `apps/rn/src/app/(tabs)/_layout.tsx`
- `docs/DEBT_TUTORIAL_AUDIT_R8_LENS_REPORTS.md` (Lens C section only)

**Load-bearing fact found while reading `qa.ts`:** `isDemoReachable()` (`apps/rn/src/config/qa.ts:26-28`)
unconditionally returns `true`, with a comment dated 2026-08-06 recording that Jason
decided the demo ships to real users in v1.7 — it is *not* QA-gated. This bears directly
on Q1 (whether to strip the demo out of the shipped app is already answered "no" by Jason)
and is called out there.

---

## Q1 — Should they be separate features at all?

### How much they genuinely share

**Confirmed: `personalScenario` falls back to `personaScenario` when the user has no usable income.**
`sandboxScenarios.ts:276-278`:
```
const income = Number(store.paycheck.amount);
if (!Number.isFinite(income) || income <= 0) return personaScenario(state, opts);
```
When that fires, a walkthrough user gets `id: 'persona-<state>'`, `PERSONA_INCOME = 2000`
(`sandboxScenarios.ts:56`), and `personaDebts()` (`:101-106`) — byte-for-byte the same build the demo
always uses (`demoScenario` → `personaScenario(stage.state, { premium: true })`, `demoRun.ts:47-49`).
So the claim is true, but narrower than it sounds: a walkthrough is only reachable once
`prefs.onboardingComplete` is set (`_layout.tsx:154,165`), and onboarding requires a paycheck amount —
so the full zero-income fallback is an edge case for the tutorial (a user who somehow cleared
onboarding without a valid `paycheck.amount`), not its normal path. The **partial** fallback is the
normal path for anyone with income but no debts yet: `personalScenario` still scales *their* income but
substitutes `personaDebts()` for the empty debt list (`:281,291`) — same debts as the demo, different
paycheck number. So "identical to the demo" is exactly true only in the true-zero-income case, and
half-true (same debts, different income) for anyone with income and no debts. The demo itself never
takes the `personalScenario` path at all — `demoScenario` calls `personaScenario` directly, never
`scenarioFor`/`personalScenario` (`demoRun.ts:47-49` vs `sandboxScenarios.ts:311-313`).

### What's genuinely different (verified in code)

| Axis | Tutorial | Demo |
|---|---|---|
| Length | 7 beats, `TUTORIAL_STEPS` (`tutorialPath.ts:105-187`) | 3 timed stages, `DEMO_STAGES` (`demoRun.ts:31-35`) |
| Pacing | User-driven (Back/Next/Skip), `TutorialOverlay.tsx:332-341` | Auto-timed (`setTimeout` via `scheduleStoryStep`, `demoRun.ts:59-67`) — see Q2 for the pending tap-through change |
| Chrome | Coaching dock: title, body, spotlight ring, scrim cut around the live control (`TutorialOverlay.tsx`) | Kiosk dock: position + one line + two exit buttons, no spotlight, no scrim (`DemoDock.tsx`) |
| Reachability | Guardian-card replay link + More row (`tutorialSession.ts:284-294`), plus a deep link to `/tutorial`; gated on `onboardingComplete` | `/demo` route, gated only on `isDemoReachable()` which is unconditionally `true` (`qa.ts:26-28`) — reachable **pre-onboarding** |
| Money seed | `scenarioFor`/`personalScenario` — the user's own paycheck (and debts, if any) blended with the persona (`sandboxScenarios.ts:276-305`) | Always the pure persona, never the user's numbers (`demoRun.ts:47-49`) |
| Ending | Hand-back beat with audience-specific copy (`tutorialPath.ts:158-187`); `end()` just drops the session, no forced navigation | Terminal-only: `exitDemo` always leaves via `/onboarding` or `/onboarding` + `/paywall` (`demoExit.ts:25-40`) |
| Writes to real store | None — `tutorialSession` never touches `appStore` except to *read* it for scaling (`tutorialSession.ts:120,296-297`) | None during the run; `exitDemo`'s `/paywall` destination writes the real store *after* teardown, by design (`demoExit.ts:14-17`) |
| Interactivity | Two beats are genuinely operable (drag the floor, attest bills), scrim cut around them (`tutorialPath.ts:200`, `TutorialOverlay.tsx` `Scrim`) | Billed as "watched rather than operated" (`DemoDock.tsx:18`), but **nothing in the read files actually fences the live Guardian card during a demo** — see Q2 |

What only *appears* different: both are a session store wrapping one `SandboxStoreInstance`
(`tutorialSession.ts:39-52` vs `demoSession.ts:26-33`), both drive the real engine off scripted
`SandboxScenario`s, both use the exact same timer registry (`sandboxRun.ts`), both rely on the same
containment primitive (`useInBoundedRun`, referenced from `(tabs)/_layout.tsx:38`), and both are
disclosed through the same `ExampleCanvasMarker` (`ExampleCanvasMarker.tsx`). The "kiosk vs. coached"
framing is real, but the plumbing under it is one substrate wearing two skins.

### ⚠️ RE-RUN (2026-08-06) — the first pass below was built on a stale premise

**Superseded verdict (kept for the record, not to be acted on):** *"keep separate — `qa.ts:18` records
Jason's decision that the demo ships to real users in v1.7, so pulling it is not a live option."*
**Why it was wrong:** that reading treated a same-day decision as settled and closed off the actual
question being asked. It has since been superseded — Jason is now actively weighing pulling the demo
out of the shipped app entirely, keeping it only as the vehicle for the App Preview (3.5.8) and the
marketing embed (3.5.7). The verdict below replaces it; everything above this note (the sharing/
difference analysis) still stands and is not re-litigated. One fact also changed the ground under F-A in
Q2: `sandboxRun.ts:29-41` now has `claimRun`/`releaseRun`, wired into both `demoSession.ts:45,74` and
`tutorialSession.ts:124,246` — confirmed by direct read — so two bounded runs can structurally never be
live at once. F-A in Q2 is closed; that is not re-litigated here either, only noted because it removes
one argument the superseded verdict could have leaned on for "keep separate" and does not.

### (a) Should the demo ship to real users in v1.7, or be pulled to capture/embed only?

**Pull it.** Keep it solely as the vehicle for 3.5.7/3.5.8, and instead open `/tutorial` to a
not-yet-onboarded visitor — the exact `guard={onboardingComplete || inDemo}` shape already proven at
`_layout.tsx:154` for `/demo`, applied to the walkthrough's own guard at `:165` instead.

The case: for the precise audience in question — a real, not-yet-onboarded visitor — the two are not
just similar, they are **identical by construction**. A visitor who hasn't onboarded has no
`paycheck.amount`, so if `/tutorial` were opened to them the same way `/demo` is,
`personalScenario`'s `income <= 0` branch (`sandboxScenarios.ts:277-278`) fires every time, and
`startTutorial()` produces byte-identical money to `demoScenario()` — same `persona-<state>` id, same
`PERSONA_INCOME`, same `personaDebts()`. There is no scenario in which the demo shows a cold visitor
something the walkthrough, opened to the same visitor, would not. Given that, the walkthrough's ending
is strictly the better asset for this audience: it hands the visitor their *own* Guardian card with an
audience-specific upgrade invite (`tutorialPath.ts:158-187`, the `free`/`premium` `bodyByRun` split),
which is the app's own best paywall per Jason's standing read of it. The demo's ending, by contrast, is
a hard, terminal exit that always routes to `/onboarding` (optionally with `/paywall` pushed on top —
`demoExit.ts:25-40`) and whose dock copy is "This is what your Guardian does with a paycheck" /
"Start my real plan" (`DemoDock.tsx:60-64`) — asking the visitor to start over rather than handing them
anything. Shipping both to real users means running the same money through a strictly weaker close for
no return, and it adds a second whole user-facing surface to the cohesion and wording/voice audits still
ahead of v1.7 (new fact 4) for a surface that duplicates rather than extends what the walkthrough covers.

### (b) If pulled, does anything of real value to a *user* get lost?

**One real thing: a zero-commitment, zero-tap glance.** The demo is watched, not operated
(`DemoDock.tsx:18`) — a visitor sees three states auto-play with no input beyond arriving
(`demoRun.ts:31-35,59-67`). The walkthrough is a 7-beat, Back/Next/Skip-driven sequence
(`tutorialPath.ts:105-187`) with two beats that ask for an actual drag/tap (`INTERACTIVE_STEP_IDS`,
`tutorialPath.ts:200`). Skip is always reachable (`TutorialOverlay.tsx:339-341`), so the walkthrough
isn't a forced march, but it is not the same *shape* of low-friction as something that plays itself —
for a visitor who wants a ten-second "what is this" before deciding to engage at all, the demo's autoplay
is a real, distinct affordance the walkthrough doesn't structurally offer today. That said, it's a UX
nuance, not a capability gap the walkthrough is incapable of closing — an optional "just show me" /
autoplay mode inside the walkthrough could supply it, at the cost of being new scope rather than a free
byproduct of pulling the demo.

### (c) Strongest argument against (a)

The `/demo` route, `demoSession`/`demoRun`/`demoExit`, and `DemoDock` are **already built, already
closed on the F-A collision risk, and already the audience-appropriate design** — they were purpose-
built and audited for a cold, pre-purchase visitor (the Lens C report's whole "3.5.4 entry list" is
built around exactly that containment problem). Opening `/tutorial` to the same audience is not the
free one-line change the guard's syntax makes it look like: the guard is copy-pasteable, but the
walkthrough's copy, its coaching chrome (a dock that says "Step 3 of 7," a spotlight ring, Back/Next/
Skip), and its pacing were all designed for someone who already has the app and is learning *their own*
Guardian, not for a total stranger deciding in the first few seconds whether to keep looking. Repurposing
it for that job is itself a design-shaped decision with its own audit surface (new fact 4 cuts both
ways — vetting the walkthrough for a new audience isn't free either), and until that vetting happens,
pulling the demo trades a working, audited, low-friction surface for an unvetted repurposing of a
different one on the promise that a guard change is most of the work.

---

## Q2 — Are they implemented correctly?

### F-A. Shared timer registry can let one session cancel the other's — SHOW-STOPPER (if the collision is reachable), otherwise MAJOR as a latent risk

**Verified fact:** `storyTimers` is one module-level array (`sandboxRun.ts:18`), and *every* caller —
`tutorialSession.goTo/playReserveStory/end` (`tutorialSession.ts:162,189,242`) and
`demoSession.start/end` (`demoSession.ts:46,69`) — calls the same `clearStoryTimers()` /
`scheduleStoryStep()` pair with no session-identity check beyond each call's own `isCurrent` closure.
`isCurrent` only guards *that* run's steps from firing on a *replaced sandbox of the same kind*; it does
nothing to stop `tutorialSession`'s `clearStoryTimers()` from wiping timers that `demoSession` queued
(or vice versa) — `clearStoryTimers()` (`sandboxRun.ts:21-24`) clears the whole array unconditionally.

**What I could not verify (flagged, out of the read-file list):** whether the two sessions can ever
*both* be `active: true` at once. `demoSession.start()` never checks `tutorialSession.active`, and
`tutorialSession.start()` never checks `demoSession.active` (`demoSession.ts:40-57`,
`tutorialSession.ts:120-156`) — nothing in the files I read stops it at the session-store level. The
route guard admits `/tutorial` while `inDemo` is true (`_layout.tsx:154`, `guard={onboardingComplete ||
inDemo}` — `/tutorial` is inside that `Stack.Protected` block at `:163`), and `startTutorial()`
(`tutorialSession.ts:296-325`) is invoked directly from the Guardian card's replay link and the More
row per its own comment (`:284-294`) — neither of which is in my read list (`(tabs)/index.tsx`,
`PaydayGuardianCard.tsx`, `boundedRun.ts` are not among the 17 files). **SUSPECTED, not confirmed:** if
either of those controls is reachable while a demo is running (i.e. not fenced by whatever
`useInBoundedRun` actually gates — see F-C below), a viewer could start a tutorial session mid-demo,
and the first `goTo`/`end`/`playReserveStory` call from either session would silently cancel the other's
pending stage transitions or story steps. That would show as: a demo frozen on `tight` forever (its
`at-risk` timer got cancelled by a tutorial action), or a tutorial's reserve story visually stalling.
**How I verified what I could:** direct read of `sandboxRun.ts`, `tutorialSession.ts`, `demoSession.ts`
in full; the gap is that the three files that would prove or disprove reachability
(`(tabs)/index.tsx`, `PaydayGuardianCard.tsx`, `boundedRun.ts`) were not in scope for this pass.
**Recommendation:** this is the single highest-value thing to check next — grep `startTutorial(` and
confirm every call site is disabled/hidden when `demoSession.getState().active` is true (or vice
versa), or gate session start itself (`tutorialSession.start()` / `demoSession.start()` each refuse if
the other is `active`). The second option is a two-line, low-risk fix if the collision is real.

### F-B. Re-seeding the sandbox on every stage discards viewer interaction, and the pending tap-through change does not fix this — MAJOR

`demoRun.ts:59-67`'s `playDemoRun` calls `seedSandbox(sandbox, demoScenario(stage))` on every stage
transition — a full re-seed, not a merge (`sandboxStore.ts:225-248`: `seedSandbox` replaces `store`
wholesale via `setState`). Nothing fences the live Guardian card during a demo: `(tabs)/_layout.tsx`'s
comment says explicitly "a demo renders no scrim" (`:36-37`), unlike the tutorial's `Scrim`
(`TutorialOverlay.tsx:207` renders unconditionally, per its own comment at `:183-188`). So if a viewer
drags the cushion floor or taps the bills-attestation control during the `clear` or `tight` stage
(nothing in the read files disables those controls in demo mode — `DemoDock.tsx` fences only the tab
bar via `(tabs)/_layout.tsx:65-69` and, per the task's own framing, `useInBoundedRun`), the next
scheduled `seedSandbox` call overwrites it with the next stage's scripted state, silently discarding the
interaction.

Switching from timer-driven to tap-through pacing does **not** fix this — it plausibly makes it worse.
Today the window per stage is fixed and short (3200ms — `demoRun.ts:33-34`), which limits how much a
viewer can do before the re-seed lands. Under tap-through pacing (viewer-paced, no timeout), a viewer
sits on `clear` or `tight` for as long as they like before advancing — more time for the live card
underneath to be touched, and the re-seed on the *next* tap still wipes it exactly the same way. The
defect is orthogonal to who triggers the stage change (a `setTimeout` vs. a tap handler); it's about
whether anything the viewer did to the sandbox survives a stage transition, and nothing in the read
files suggests that changes with tap-through. **Fix scope, if the demo is meant to allow interaction:**
either fence the Guardian card the same way the tutorial's non-interactive beats do (cut no hole, no
pass-through), or accept that the card is inert-by-convention only and say so; re-seeding itself is the
right mechanism for a scripted demo (it's what keeps every take byte-identical — `sandboxStore.ts:199-
202`), the gap is the missing fence around what re-seeding can clobber. **Verified via:** `demoRun.ts`
full read, `(tabs)/_layout.tsx` full read, `TutorialOverlay.tsx` full read for the scrim contrast; the
Guardian card's own control code was not in the read list, so whether it independently checks
`demoSession.active` is SUSPECTED, not confirmed.

### F-C. Containment: tabs and (per the task's framing) More are fenced; other escapes are unverifiable from the given files — MAJOR (as an open question), not confirmable as SHOW-STOPPER or clean

Verified: `(tabs)/_layout.tsx:38-39` computes `inBoundedRun` from `useInBoundedRun()` and uses it only
to `preventDefault()` on `progress`/`money` tab presses (`:82,87`) — **not** on `index` (Today), which
is correct since both bounded runs render over Today. `(tabs)/_layout.tsx:65-69` separately hides the
tab bar entirely (`display: 'none'`) when `inDemo`, on top of holding it. Both are real, verified fences.

Not verifiable from the 17 read files: `useInBoundedRun` itself, and the "More button" the task
description says it also fences, live in `boundedRun.ts` and presumably `more-button.tsx` /
`(tabs)/index.tsx` — none in scope. What **is** verifiable is that the route guard in `_layout.tsx:154`
(`guard={onboardingComplete || inDemo}`) admits the *entire* protected route group — `more`, `history`,
`living-expenses`, `cushion-forecast`, `schedule/[id]`, `tutorial` (`_layout.tsx:155-164`) — while a demo
is running, constrained only by whatever UI controls choose to navigate there. If any live control on
Today besides the tab bar (a forecast link, a "History" link, an edit sheet trigger) is not itself gated
on `useInBoundedRun`, it is a real escape: the destination screen would still render sandbox data (since
`StoreProvider` wraps the whole `Stack`, not just Today — `_layout.tsx:147`), so it would not leak real
user data, but it would break the demo's kiosk framing mid-recording and is exactly the class of bug the
task asked me to look for. **I cannot confirm or deny this without `(tabs)/index.tsx` and
`PaydayGuardianCard.tsx`, which were out of scope.** Flagging as the second most valuable thing to check
next, alongside F-A (both point at the same two unread files).

One comment worth noting as **claim drift** (MINOR): `_layout.tsx:176-177` still says the `/demo` route
is "QA-gated inside the route itself, so it disappears with the Phase-6 `QA_TOOLS` flip" — but
`qa.ts:12-28` shows `isDemoReachable()` was deliberately decoupled from `QA_TOOLS` on 2026-08-06
precisely so the demo *doesn't* disappear at the Phase-6 flip. The comment describes the pre-2026-08-06
behaviour. Cheap one-line fix, no design decision.

### F-D. `maxGenuineCycles` omission — verified clean, no defect

`demoRun.ts:47-49`'s `demoScenario` calls `personaScenario(stage.state, { premium: true })` with no
third field, and `personaScenario` (`sandboxScenarios.ts:251-265`) passes `opts.maxGenuineCycles`
straight through — `undefined` here — to the `SandboxScenario`, which defaults to
`SANDBOX_MAX_GENUINE_CYCLES = 1` (`sandboxStore.ts:81,157`). Grepped mentally across `demoSession.ts`,
`demoRun.ts`, `demoExit.ts`, `demo.tsx`, `DemoDock.tsx` in full: no reference to `maxGenuineCycles`
anywhere in the demo's own files, so nothing reintroduces it. The reserve stays HELD for the whole demo
by construction. **Verified**, not suspected — all five files were read in full.

### F-E. Honesty marker coverage — largely verified, one gap identified, rest unverifiable

`ExampleCanvasMarker` is keyed on `isSandboxStore(useActiveStore())` and withheld only when
`tutorialSession.active` (`ExampleCanvasMarker.tsx:37-38`), so it renders during a demo (`inWalkthrough`
is false). Its own doc comment (`:24-27`) asserts `Screen` mounts it unconditionally so "a surface a
demo can reach cannot forget to carry it" — I could not verify `Screen`'s implementation (not in the
read list) so this is the component's own claim, not independently confirmed. The one gap I *can*
confirm from the read files: `DemoDock.tsx` (mounted as a `Stack` sibling, not inside any `Screen`) does
not visually render "Example money" as text at all — only a screen-reader-only `accessibilityLabel`
carries it (`DemoDock.tsx:47-48`); the caption row shows only "N of 3" (`:54-56`). That's fine as
designed (the comment at `:49-53` explains the marker's visible half deliberately lives in
`ExampleCanvasMarker`, not the dock, to avoid doubling) — flagging only because a screenshot cropped to
just the dock (rather than the canvas above it) would show no visible disclosure, which is the same
failure class F1 in the Lens C report (`DEBT_TUTORIAL_AUDIT_R8_LENS_REPORTS.md:486-494`) was written to
prevent. Not a new defect, just a reminder that the fix's coverage depends on `Screen` actually being
universal, which I could not check.

---

## Q3 — What should the App Preview capture?

Apple's rules, as already recorded in the plan (`DEBT_ELEVATION_PLAN.md:111`, verified 2026-07-30):
**15–30s, constant 30fps, <500MB, in-app footage only, one video at the largest device-family size.**
No narration is required by the format (and the demo produces none — `DemoDock.tsx` has no audio).
Portrait is the shipped app's only orientation (nothing in the read files suggests landscape support),
so that constraint is satisfied by construction.

### What the code can actually produce today

The only scripted, deterministic sequence in scope is `DEMO_STAGES` (`demoRun.ts:31-35`):
`clear` at 0ms → `tight` at 3200ms → `at-risk` at 6400ms, each a real engine-solved state
(`sandboxScenarios.ts:150-176`), applied via `seedSandbox` (synchronously for the first frame —
`demoRun.ts:65`, `:55-58` doc). Nothing beyond `at-risk` is scripted; the demo simply holds on `at-risk`
indefinitely until the viewer exits (`DEMO_STAGES` has no fourth entry, and `playDemoRun` schedules
exactly `DEMO_STAGES.length` steps — `:60-67`). That means the capture's own duration has to come from
how long the recording holds on the final frame, not from anything the app signals.

### Proposed shot list (targets ~22s, inside the 15–30s window)

1. **0:00–0:02 — Entry.** Launch straight into `/demo` (`demo.tsx`), landing on `(tabs)` with the
   `clear` stage already applied synchronously. Skip showing the `/demo` redirect itself (renders
   nothing — `demo.tsx:51`); start the take a beat after landing so the first frame is the settled
   Today screen, not a blank transition.
2. **0:02–0:08 — `clear` stage (persona-clear).** Hold on the paycheck hero + Guardian card showing the
   line held, `ExampleCanvasMarker` visible above the fold (`ExampleCanvasMarker.tsx:48-53`, deliberately
   outside the scroll body). This is the "everything's fine" establishing beat.
3. **0:08–0:14 — `tight` stage.** The auto-transition at `t=3200ms` (`demoRun.ts:33`) lands here if the
   capture starts recording at the same moment the session starts; the headline figure and card colour
   change (`demoRun.ts:26-29` doc: "each stage changes a headline figure and a colour"). `DemoDock`'s
   position indicator moves to "2 of 3" (`DemoDock.tsx:33,55-56`).
4. **0:14–0:20 — `at-risk` stage.** The `t=6400ms` transition (`demoRun.ts:34`) — this is the paid-tier
   contrast beat: "Recovery is the thing a free user does not get, shown rather than described"
   (`demoRun.ts:15-17`). Hold here; nothing further is scripted, so this is also the frame where the
   Recovery/what-can-wait treatment gets its longest look.
5. **0:20–0:22 — Close on the dock.** End the take on `DemoDock`'s copy ("This is what your Guardian
   does with a paycheck", `DemoDock.tsx:60-62`) and its two exits visible ("Start my real plan" /
   "Unlock Premium", `:64-71`) — **without tapping either**, since Apple's in-app-footage rule doesn't
   require showing the destination and `exitDemo` is a hard, terminal navigation
   (`demoExit.ts:25-40`) that would cut away from the demo screen entirely if actually pressed.

### What the storyboard needs that does not exist yet

- **No signalled "end of script" moment.** After `at-risk` there is nothing in `demoRun.ts` to cue a
  recording tool to stop — the capture has to be timed externally (matches the already-flagged open
  practicality in `DEBT_ELEVATION_PLAN.md:107-113`: ffmpeg, exact resolution, forced dark mode, where the
  artifact lands — all still open per the plan itself, not new findings here).
- **No confirmed simulator fidelity for the visual elements the capture depends on.** The plan's own
  caveat (`DEBT_ELEVATION_PLAN.md:112`) is that the simulator "may not render Skia, `expo-blur` UIKit
  material, or the finale mesh-gradient faithfully" — `DemoDock`'s frosted look is not blur-based
  (plain `backgroundColor` — `DemoDock.tsx:77-83`), so the dock itself is low-risk, but the Guardian
  card's own rendering (not in scope here) may carry the same risk the plan already names.
- **No stage beyond `at-risk`.** If the storyboard wants a fourth beat — e.g. explicitly showing the
  hand-back / "your own plan" moment the tutorial has (`tutorialPath.ts:158-187`) — the demo has nothing
  equivalent; `DemoDock`'s copy is static across all three stages, it does not change at the final stage
  the way the tutorial's `bodyByRun` finale does. That is a real gap between "what the demo shows" and
  "what the tutorial teaches," relevant if the App Preview is meant to end on a persuasive beat rather
  than just holding on `at-risk`.

---

## Q4 — What becomes deletable if the demo is pulled out of the shipped app?

**Precondition, stated plainly:** this is currently hypothetical. `qa.ts:18-27` records that Jason
decided on 2026-08-06 the demo *does* ship to real users in v1.7, specifically reversing an earlier
version that gated it behind `QA_TOOLS` (which would have pulled it at the Phase-6 flip). Answering Q4
as asked, in case the decision changes or for scoping a hypothetical marketing-only build:

### Deletable outright (real-user entry points, not the capture substrate)

- Whatever UI affordances surface `/demo` to real users — per `demo.tsx:19-21`'s own comment, "the
  Welcome slot and the paywall's 'See it in action'." **Not in the read file list** (Welcome screen,
  `paywall.tsx`); flagged as SUSPECTED locations, not verified paths. These are the actual public
  entry points and are what "pulled out of the shipped app" would mean in practice.
- `qa.ts:26-28`'s `isDemoReachable()` would need to change from unconditional `true` back to something
  like `__DEV__ || QA_TOOLS` — not a deletion, a re-gating, and it's a one-function, one-place change by
  design (`qa.ts:22-24`: "the demo's reachability is one decision in one place").
- `demo.tsx`'s `?from=welcome|paywall` funnel discrimination (`demo.tsx:39-42`) would become dead
  branches once those entry points are gone, though the code itself is harmless to leave.

### Must stay — the capture still needs it

- `apps/rn/src/app/demo.tsx` — the entry route itself. The App Preview capture needs *some* way to reach
  the demo state even in a build where real users can't; re-gating `isDemoReachable()` (above) is what
  keeps this route alive for capture while closing it to the public.
- `apps/rn/src/store/demoSession.ts`, `demoRun.ts`, `demoExit.ts` — this is the entire mechanism that
  produces the three scripted states the capture is built from (Q3). Nothing here is demo-UI-specific;
  it's the substrate the capture depends on.
- `apps/rn/src/components/plan/DemoDock.tsx` — needed if the capture is meant to show the kiosk chrome
  (position indicator + copy); deletable only if the App Preview is reshot chromeless, which would also
  mean losing the "N of 3" pacing cue and the persuasive copy at shot 5 in Q3.
- The entire shared substrate — `sandboxScenarios.ts`, `sandboxStore.ts`, `sandboxRun.ts`,
  `ExampleCanvasMarker.tsx` — must stay unconditionally regardless of the demo's fate, because the
  walkthrough depends on every one of them (`tutorialSession.ts` imports `sandboxRun`'s
  `clearStoryTimers`/`scheduleStoryStep` at `:8`, and `sandboxScenarios`' `scenarioForBeat` at `:16`;
  `ExampleCanvasMarker` is shared honesty chrome, not demo-specific — `ExampleCanvasMarker.tsx:29-31`).
- `(tabs)/_layout.tsx`'s `inDemo`-keyed tab-bar hiding (`:44,65-69`) and `_layout.tsx`'s
  `demoSandbox`/`inDemo` reads (`:63-64`) and route-guard OR-clause (`:154`) would need to stay exactly
  as-is for the capture build, since the capture is recorded through the same route guard and provider
  wiring a real user would hit.

### Limitation

Both the "what surfaces the demo to real users" question and the "does every sandbox-rendered screen use
`Screen`" question (Q2/F-E) resolve to the same two-to-three files outside my read list — `(tabs)/index.tsx`,
`PaydayGuardianCard.tsx`, and whichever screen hosts the Welcome flow. I was not able to verify either
without stepping outside the assigned 17 files, per the hard constraint on this pass.

---

## Capture verification — 2026-08-06, all five beats shot and reviewed

Shot in both themes, then re-shot with `?capture=1`. The suite was green throughout; every finding below
came from looking at the frames.

**Fixed:** the dock covered the payoff trajectory (beat 4) and cut the Guardian card in half (beat 5) —
two of the five frames the video exists for. `?capture=1` now strips it. Its Guardian-specific copy sitting
over the Money list at beat 1 goes with it.

### ⚠️ OPEN — the debt-free date shifts a year on the closing beat only

**Measured, not inferred:** unprimed Today reads *"debt-free by September 2029"* and Progress reads
*"September 2029"* — **they agree**, so there is no second producer and plan item A7 stays closed. The
2030 appears **only** on beat 5, after `primePayoff` runs.

Raising `minimumPayment` was the first cause and is fixed; the date still moves, so the remaining suspect
is `balanceAsOfDate` being anchored 35 days back — **suspected, not proven.** A year-worse date between
two consecutive shots is the kind of thing a viewer registers without being able to name, so it needs
settling before the capture is cut. Cheapest next probe: prime with the anchor left at `currentDate` and a
balance already at zero-projection, and see whether the date holds.

### ⚠️ OPEN — Skia canvases were UNPAINTED in one capture-mode frame

The Progress beat came back with the ring arc, the cash-flow bars and the payoff curve all missing —
labels and axes present, geometry absent. The same frame painted correctly in the earlier pass, so this is
timing, not layout. It is the CanvasKit-paint artifact the device ledger already carries for beat 1 of the
walkthrough, and **on the iOS simulator the native Skia path painted correctly** in the 2026-08-06 Maestro
run — so this may be web-only. It still sets a hard requirement for 3.5.8: **hold each beat long enough
after navigation for Skia to paint, and verify the first frame of every beat**, rather than trusting the
stage timings.

### Deferred — the persona's debt load reads thin for an opening frame

Beat 1 shows *$2,260 across 2 debts*. The approved storyboard imagined a number a viewer recognises. This
is a taste call about who the app is for, so it is Jason's rather than a defect. → 3.5.8 storyboard review.

---

## Capture verification — CYCLE 8 (2026-08-07), the native simulator, reviewed frame by frame

Run `app-preview-20260807-08` (31202129089), green in 27m05s. `PREROLL=3`, `LAUNCH_ALLOWANCE=5` →
`MOUNT=8.00s`; trim `8.40s + 25s`. Frames pulled at `MOUNT + stage.at + 0.20` (FIRST) and `+ 3.30`
(settled). **Every finding below came from opening the PNGs, not from the exit code — which was green.**

### What the frames actually show

| raw t | frame | what is on screen |
|---|---|---|
| 8.20 | `beat-1-debts-FIRST` | **black** — status bar only, 28 KB |
| 11.30 / 12.20 | `beat-1-settled` / `beat-2-FIRST` | **Money, painted** — byte-identical (435,646 B) |
| 15.30 / 17.20 | `beat-2-settled` / `beat-3-FIRST` | **Today: header + "Example money", body EMPTY** — byte-identical (59,768 B) |
| 20.30 / 22.20 | `beat-3-settled` / `beat-4-FIRST` | **Progress: cards, labels and axes present, Skia geometry ABSENT** (ring arc, cash-flow bars, trajectory line) — byte-identical (425,935 B) |
| 25.30 | `beat-4-settled` | **Progress, fully painted** — ring, bars, curve |
| 28.20 | `beat-5-FIRST` | **Today, correct** — payoff invitation + the `$2,000` paycheck |
| 31.30 | `beat-5-settled` | **no frame extracted** |

**The byte-identity is the load-bearing evidence.** Two samples 0.9–1.9s apart being the *same bytes* means
the screen was static across that window — so the empty Today and the geometry-less Progress are not
mid-animation samples that would have healed on the next frame. They are seconds of held blankness.

### Against the three checks this cycle was run to answer

- ❌ **`beat-1-debts-FIRST` is Money** — it is black. The in-point is ~3s ahead of the app.
- ❌ **all five settled frames extracted** — four. The `-ss`-after-`-i` accurate seek fixed 8 of 10
  extractions; the tail one still yields nothing.
- ✅ **`contact-sheet.jpg` exists** — and it is the thing that made the timeline legible in one glance.

### Resolved by this cycle

- **The `$1,747` did not reproduce.** Beat 5 reads `$2,000`, matching every web reference. Cycle 7's
  anomaly is closed as not-reproducing rather than explained.
- **The unpainted-Skia artifact is NOT web-only** — the hypothesis this doc recorded on 2026-08-06. It is
  right there on the native simulator, at two consecutive samples, on the beat the video exists for.

### Root cause — one cause, three symptoms

`CaptureAutoStart` fires on the root layout's mount and `playDemoRun` starts its wall clock there. On a
cold launch on a shared macOS runner the app paints seconds later, so **the script runs ahead of the
screen** — the beats are advancing against a tree that has not rendered. That single fact produces the
black opening frame, the empty Today, and the geometry-less Progress; and it is why three successive
attempts to *guess* the anchor (`blackdetect`, screenshot polling, a fixed allowance) each failed
differently. `LAUNCH_ALLOWANCE` is not a number that can be tuned into correctness — it is measuring the
wrong thing.

⚠️ **`warm.png` does not discriminate sim-from-device.** The warm run played the same script with the same
per-stage re-seeds and its 25s screenshot is flawless — but that is a *settled* frame, not an arrival
frame, so it tells us the app is not broken and nothing about the arrival lag. The open question for
3.5.8.8 stays open: runner CPU starvation would vanish on a device; `seedSandbox` blanking the tree on
every stage (F-B's neighbour) would not.

---

## Capture verification — CYCLE 9 (2026-08-07), the slate works and fires one beat too soon

Run `app-preview-20260807-09` (31208978159), green in 18m14s — the first cycle with a found anchor
(`T0 = 2.393s`) rather than a declared one.

### ✅ What the anchor fixed

- **All ten frames extracted**, five FIRST and five settled. Cycle 8 got eight; the static-tail fallback
  (last frame at or before the target) closed the gap that had made every prior cycle's evidence partial.
- **The beats land where the script says.** Beat 2 arrives at `T0 + 4.1s` against a declared `at: 4000` —
  the offsets are now trustworthy, which is the precondition for every other measurement here.
- **No multi-second blank screens.** ⚠️ But this runner painted **~1s** after launch where cycle 8 took
  **8–11s**, so this is not yet evidence the arrival lag is fixed — it is evidence of how much the runner
  varies, which is the same fact that killed `LAUNCH_ALLOWANCE`.

### ❌ The slate fires before the app is on screen

`beat-1-FIRST` (`T0 + 0.2s`) is the **iOS launch-zoom animation** — the app's black window scaling out of
the home screen. Nothing had rendered. So the cut still opens on the launch transition.

**The tell was in the detector's own output, and nothing was reading it:** the app holds the slate for
**350ms**; `blackdetect` reported `black_duration:0.205`. The missing 145ms happened before the window was
composited into the recording. `rAF ×2 + runAfterInteractions` is a *the JS thread got a turn* signal, not
a *content is on screen* one, and on a warm launch the JS thread is free almost immediately.

→ Fixed by gating on `AppState` reaching `active` (the OS saying the launch transition is done) plus an
800ms compositing settle, **and** by asserting the recorded slate is as long as the held one — so this
failure is loud next time instead of green.

### ⚠️ The FIRST-frame offset was too tight to survive a navigation

`beat-4-FIRST` shows Today with the *tight* Guardian — beat 3's screen. At `+0.20s` the navigation the
stage triggers has not landed, so the sample catches the outgoing screen and says nothing about the
incoming one. Moved to `+0.80s`: far enough to clear the navigation, early enough that an unpainted Skia
canvas has not healed.

### ⚠️ A transient wrong number on Today's arrival

The 2fps sheet catches Today showing **`$790`** with a half-rendered Guardian card for roughly half a
second as beat 2 arrives, before settling to the persona's `$2,000`. Brief, but it is a number nobody can
account for in a store video — the same class as cycle 7's `$1,747`, which did not reproduce. Needs
settling before the asset is cut. *(Cycle 10: did not reproduce — `beat-2-FIRST` is fully painted at
`$2,000`. Like `$1,747`, an arrival-render transient on a slow runner, not a wrong number.)*

---

## Capture verification — CYCLE 10 (2026-08-07): every beat's first frame is painted

Run `app-preview-20260807-10` (31211254519), green in 18m41s. **`T0 = 5.267s`, and the slate recorded
`0.377s` against the `0.350s` the app holds** — so the window was composited when it fired, which is the
thing cycle 9 got wrong and the new assertion now guards.

| beat | `FIRST` (`T0 + at + 0.80`) |
|---|---|
| 1 debts | **Money, fully painted** — `$19,440` across 3 debts, all three cards, the Focus badge |
| 2 held | **Today, fully painted** — `$2,000`, Guardian "Looks clear this paycheck", Can-I-Afford below |
| 3 absorbed | **Today, tight** — the Guardian's "A little tight this paycheck" state |
| 4 trajectory | **Progress**, charts at the start of their reveal (below) |
| 5 payoff | **Today**, the payoff invitation |

5 of 5 distinct settled frames; no extraction fell back to the static-tail path. **The check cycles 8 and 9
both failed — "is `beat-1-FIRST` a painted Money screen" — passes.**

### ⚠️ The empty charts are a DESIGNED REVEAL, not a paint stall — and that reframes cycle 8

`TrajectorySkiaChart` animates its progress over **850ms** (`Easing.out(Easing.cubic)`), and
`CushionBarChart` and `JourneyRingChart` animate alongside it. So Progress arriving with an undrawn ring,
no bars and no curve is the **first frame of the entrance animation**, which in a store video is
desirable — a chart drawing itself is the shot.

The 2fps sheet measures the whole reveal at **~1.7s** on this runner (Progress arrives ≈19.3s, charts
complete ≈21.0s) against a 6s beat.

**But cycle 8 showed byte-identical frames 1.9s apart with nothing drawn**, which an 850ms animation
cannot produce. The two observations reconcile into one explanation with a sharp consequence:

> On a fast runner the reveal plays and the footage is good. On a slow runner the JS/UI thread is starved,
> **the animation does not start at all**, and the same beat is a still, empty chart. Cycle 8's runner
> painted 8–11s after launch; cycle 10's painted in ~1s.

### → This is the evidence 3.5.8.8 was missing

The simulator's risk was never Skia *fidelity* — 3.5.8.4b settled that, and cycle 10's settled frames are
beautiful. It is that a shared CI runner's speed decides whether the motion happens, and nothing in a green
run says which one you got. A device removes that variable. **The honest reading is the one the plan
predicted: the simulator lane is the draft/iteration path, and the submitted asset wants a device.**

⚠️ Note what would happen without this: a cycle that ran fast would look perfect, ship, and the next
re-shoot after a UI tweak could silently produce a video whose charts never draw.

## Capture verification — CYCLE 14 (2026-08-08): ✅ APPROVED, and the ending has its room

Run `app-preview-20260808-14` (31244485894), green in 18m59s. **`T0 = 6.176667s`, slate held `0.36s`
against the app's `0.350s`.** Cycles 11–13's frame reviews are in `DEBT_ELEVATION_LOG.md`; this is the
approved cut, so its verification returns to this series.

**Every guard green:** the screen changed across beats · the chart reveal ran (the Progress beat changed
as it settled) · the celebration fired (the closing beat resolved) · conform `886x1920, 28.933008s,
constant 30fps, H.264 high@4.0 — within Apple's App Preview spec`.

### The check no guard covers, measured rather than assumed

Cycle 13 put the celebration in the file and in its final **0.1s** — present, and effectively absent. The
guards cannot see that: they compare frames, and a frame one tenth of a second before the end is a frame.
So the tail was decoded by hand (Edge, per [[reference_no_local_h264_decoder]]) and the celebration's
on-screen life measured directly.

| | |
|---|---|
| celebration enters | **24.13s** (transition frame at 24.13, settled from 24.19) |
| file ends | **28.93s** |
| **room** | **4.80s** — against cycle 13's 0.1s |
| final frame | the composed card, not a fade |
| frame `0.05s` | a painted **Money** screen — no black open, no surviving slate |

`beat-6-celebration.png` shows the correct beat: **Store card · Vanquished · $1,900**, "Freed $45/mo now
flows to Credit card." — the per-debt `VanquishedBeat` that 3.5.8.6b intends, not the finale.

### ⚠️ A flat aggregate is not evidence of a still frame

The gold-fraction and mean-luma readings were **byte-constant to five decimals across the last 4.7s**,
which reads exactly like a video ending on a freeze — and would have been reported as one. Checksumming
the frames instead showed continuous change from `0.2s` through the end: after its entrance the
celebration settles into a small ~0.3s looping element that a whole-frame average cannot see.

The aggregate was insensitive, not the footage static. **When the question is "did anything move", diff
the frames; do not infer it from a summary statistic** — the statistic was chosen to answer a different
question (is the celebration on screen) and it answered that one correctly.
