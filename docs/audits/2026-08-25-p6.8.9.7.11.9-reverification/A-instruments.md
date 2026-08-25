# A — THE INSTRUMENTS

Second re-verification (P6.8.9.7.11.9). Independent read of `3dc3c22..4877d90` over:

| file | hunk-groups | verdicts |
|---|---|---|
| `scripts/check-apostrophes.ts` | A-1, A-2 | `SOUND-UNPINNED` ×2 |
| `scripts/check-contrast.ts` | A-3 | `SOUND` |
| `scripts/check-copy-owners.ts` | A-4 | `SOUND` |
| `scripts/check-native-a11y-props.ts` | A-5, A-6 | `SOUND-UNPINNED`, **`DEFECT`** |
| `scripts/check-comment-convention.ts` | A-7 | `SOUND` |
| `apps/rn/tests/shots/p6.8-matrix.shot.ts` | A-8 … A-12 | `SOUND` ×2, `SOUND-UNPINNED` ×2, **`DEFECT`** |

Full tally, defect list and open questions are at the **bottom** of this file.

Method: the brief's seven questions, in order, per hunk-group. Verdicts appended
as each group finished. **Nothing here was executed** — every claim is from
reading the source plus read-only `git`/`grep`. Where a claim could only be
settled by running the gate or the suite, it says so.

**Registration, checked once for all five gates** (`package.json:12,13,28,29,38`):
`lint:a11y-props`, `lint:comments`, `lint:apostrophes`, `lint:copy-owners`,
`lint:contrast` are all in the `lint:rn` chain (`package.json:42`), which is in
`validate:release:rn` (`package.json:47`). ⚠️ The chain is `&&`-joined, so the
first gate to exit 1 suppresses every later gate in the same run — a repo-level
property, not this diff's, but it is the same "one CI cycle becomes two" failure
that the apostrophe hunk-group below was written to fix *within* one gate.

---

## A-1 · `check-apostrophes.ts` — the Swift `phrases:` latch rewritten

`scripts/check-apostrophes.ts:216-247`. Replaces the raw-line latch with a
strip-comments-first, slice-the-line scan.

**What it fixes, confirmed.** The old form set `inPhrases` from the RAW line, so a
`///` docblock quoting `phrases: [` opened the latch. It now tests `code`, the line
with `//…` removed (`:221`, `:237`). And the old `else if` could not close a latch
opened on the same line; the new form checks the remainder after the opening match
(`:240`).

**Prior behaviour preserved?** Two things changed that the docblock does not say.

1. **The opening line is now partly scanned** — `scanPart = code.slice(0, open.index)`
   (`:239`). The old code `return`ed the whole line. This is the stated improvement
   and it is correct.
2. ⚠️ **The CLOSING line is now scanned for nothing at all.** `:233-235` sets
   `scanPart = ''` for any line while `inPhrases` is true, *including* the line
   carrying the `]`. The old code cleared the latch and then fell through to scan
   that line. So display copy that shares a line with the closing bracket — 
   `], shortTitle: "Won't"` — was swept before and is not swept now. Same for text
   after `]` on a one-line `phrases: […]`: `:239` keeps only the PREFIX, never the
   suffix.

   This is **latent, not live.** All four sites are multi-line and every close line
   is a bare `],`: `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:105,
   115, 125, 137` open, and the matching closes carry nothing else
   (`SiriQueryIntents.swift:109` is a bare `],`, with `shortTitle:` on `:110`).
   The docblock at `:229-230` claims *"Only the span from `phrases: [` onward is
   exempt"* — the code exempts the span from `phrases: [` **to end of line**, which
   is a strictly larger claim than the comment makes.

**Reach.** `SWIFT_ROOTS` (`:186-190`) covers `apps/rn/plugins`, `targets`, `modules`
— 16 of the 19 `.swift` files in the tree; the 3 under `ios/App/` are deliberately
out (`:183-184`). No Swift file lives outside those roots (verified by `find`).
**Silently not walked:** `.strings`/`.stringsdict`/`Info.plist` copy (none present),
and the widget's SwiftUI copy is covered.

**Two blind spots the change does not introduce but does not close either.**
`code = line.replace(/\/\/.*$/, '')` (`:221`) also truncates at a `//` inside a
string — a `"https://…"` literal would lose everything after it. And `/* … */`
block comments are never stripped, so a block comment containing `phrases: [` still
opens the latch — the exact class the hunk was written to close, one comment syntax
over.

**Would it go red?** Yes for the live shape: a straight apostrophe in a `dialog:` or
`IntentDescription` literal outside a `phrases:` span produces a `swiftHits` entry
(`:244`) and now sets `failed` (`:272`).

### `VERDICT: SOUND-UNPINNED`

Correct for every site in the tree today, and it genuinely closes both defects it
names. Nothing would catch a regression: there is no test for
`check-apostrophes.ts` anywhere in the repo (searched all of `apps/rn`,
`packages/core`, `scripts` — the only references are `package.json:28` and prose in
`docs/`). **The missing test is a fixture-Swift-file case** covering (a) a `///`
comment quoting `phrases: [`, (b) a one-line `phrases: ["…"], shortTitle: "…"`, and
(c) a `dialog:` literal after a closing `]`. (b) and (c) would fail today.

---

## A-2 · `check-apostrophes.ts` — both classes report before either exits

`scripts/check-apostrophes.ts:265-287`. The Swift `process.exit(1)` moved below the
baseline read and became `failed = true`; the TS `fresh` block likewise; one
`if (failed) process.exit(1)` at `:287`.

**Correct and complete.** The `swiftHits` computation at `:211-248` was already
above the baseline read and is unmoved, so nothing about the Swift scan changed
order. The baseline-missing early exit at `:250-253` is still an unconditional exit
— correct, because without a baseline the `fresh` computation at `:256` is
meaningless.

**Prior behaviour preserved.** Exit code 1 on either class: yes (`:287`). Swift
message text: byte-identical (`:268-271` vs the removed block). Ordering of the two
reports: Swift first, then TS — same relative order as before. The stale-count
success line at `:293-296` is still only reached when neither class failed, which
is right: it says *"no new straight-apostrophe copy"*.

**Environment.** No dates, no locale, no platform surface. Node-only.

**Newly possible.** A run can now print two failure blocks. Nothing consumes this
gate's stdout structurally (`gate-status.json` records pass/fail, not text), so
there is no parser to break.

### `VERDICT: SOUND-UNPINNED`

The fix is right and the prior exit contract is intact. Unpinned for the same
reason as A-1 — no test exercises this script, so the ordering could regress to
`process.exit(1)` inside the Swift block and every run would still look correct
whenever Swift is clean, which is the state it is in today.

---

## A-3 · `check-contrast.ts` — `INK_LITERAL` widened, `withoutGradients` dropped from the ink scan

`scripts/check-contrast.ts:345` and `:366-393`. Two coupled changes:
`/\bcolor:\s*'(…)'/` → `/\bcolor\s*[:=]\s*['"](…)['"]/g`, and the per-line scan now
reads `line` instead of `withoutGradients(line)`.

**Widening: strictly a superset, no regression.** Every string the old pattern
matched (`color:` + single quotes) the new one also matches. It adds `color=`,
double quotes, and whitespace before the `:`. ⚠️ It does **not** over-match
`backgroundColor` / `borderColor` / `shadowColor` / `tintColor`: the pattern is
case-sensitive (no `i` flag) and those all spell the word `Color`. It *does* newly
match a bare assignment `const color = '#fff'` — no such line exists in the walked
tree.

**Dropping `withoutGradients`: the stated justification holds today, and I checked
it rather than believing it.** The docblock at `:379-382` claims every gradient in
the repo passes literals through `colors={[…]}` and that neither `expo-linear-gradient`
nor Skia's `LinearGradient` uses a `color` key. Enumerated: `expo-linear-gradient`
at `apps/rn/src/app/(tabs)/progress.tsx:167,243`,
`components/plan/PaidOffBeat.tsx:110`, `PaidOffFinale.tsx:87`, `PlanHero.tsx:130`,
`ShareCard.tsx:32`, `components/progress/CashFlowSection.tsx` — all `colors={[…]}`;
Skia at `components/payoff/TrajectorySkiaChart.tsx:99,123,132`,
`components/plan/CashRunwaySkiaChart.tsx:66,78`,
`components/plan/MeshGradientChart.tsx:20,24,28` — all `colors={[…]}`. The claim is
true of this tree.

⚠️ **But the claim is about a repo state, not about the libraries.** Skia's
gradient *does* have a `color`-keyed form (`<Stop color="…" />`), and
`react-native-svg`'s `Stop` takes `stopColor`. If either is ever used, this scan
produces a **false positive**, not a miss — the failure direction is safe, and the
fix is an `INK_EXEMPT` entry. Noting it because `:379` reads as a property of the
libraries and is really a property of today's call sites.

**Would it go red, and is it reachable?** Yes, and there is a live positive
control: `apps/rn/src/components/payoff/TrajectoryChart.tsx:665` is the one line in
`apps/rn/src` the new pattern matches (`color: '#10264f'`), and it reaches the
exemption check at `:385` rather than the failure push — which proves the regex
reaches real source and that the exemption keying works. The two motivating sites
(`ListRow.tsx`, `SpokenForSheet.tsx`) are gone from the tree; a `grep -E` for the
full pattern over `apps/rn/src` returns exactly that one line.

**Reach — what it silently does NOT walk.** `files = walk(SRC_DIR)` (`:174`,
`SRC_DIR` = `apps/rn/src` at `:36`). Outside its reach: `apps/rn/tests`,
`packages/core`, the whole legacy root surface (`app/`, `components/`, `lib/`), and
every `.swift` file — `apps/rn/targets/widget/DebtViews.swift` paints widget ink and
no gate in this repo checks its contrast. The widget is arguably out of this gate's
declared class (`:1-30` scopes itself to the RN token system), so this is a stated
boundary rather than a defect, but the header does not say it.

**A residual asymmetry the change did not touch.** `never-text` exemptions are
verified from source on every run (`:242-250`) — the file's own boast at `:11-13`.
`INK_EXEMPT` is not: an entry whose literal has been deleted stays in the list
forever and nothing reports it. Compare `check-apostrophes.ts:293`, which at least
prints a stale count.

**Environment.** Pure arithmetic + text scan; no dates, no locale, no platform
divergence. It reasons about both `light` and `dark` (`:181`, `:229`, `:426`), which
is the point.

### `VERDICT: SOUND`

The widening is a superset, the `withoutGradients` removal is verified safe against
every gradient call site in the tree, and there is a live line proving the scan
reaches source. A regression would be caught: any future `color: '#…'` in
`apps/rn/src` reds the gate, which runs in `lint:rn` (`package.json:38,42`).

**Observation, not a finding of this diff:** two `path:line` citations in the
surrounding (unchanged) docblock are stale. `:331` cites
`TrajectoryChart.tsx:603` for the end pill — it is at
`apps/rn/src/components/payoff/TrajectoryChart.tsx:665`. `:360` cites `line 307` for
the component's own gold — it is at `TrajectoryChart.tsx:344`. `TrajectoryChart.tsx`
*was* edited in this same range (`git diff --stat 3dc3c22..4877d90` shows 31 changed
lines in it), so these drifted further during the work being audited without being
re-checked.

---

## A-4 · `check-copy-owners.ts` — fourth pairing added, and comments stripped before the match

`scripts/check-copy-owners.ts:61-69` (new `PRIVACY_CLAIM.noSelling` pairing),
`:76-77` (`stripComments`), `:87` (applied).

**The new pairing is real and lands on a real line.** `WelcomeStep.tsx:32` is
`{ icon: 'lock', title: PRIVACY_CLAIM.headline, body: \`No account needed — and ${PRIVACY_CLAIM.noSelling}.\` }`
— both halves on one line, exactly as the `why` at `:68` says. The site's own
comment quoted at `:62` is at `apps/rn/src/components/onboarding/WelcomeStep.tsx:28`
and reads *"⚠️ Both halves are the CONSTANT, never a literal"* — **the citation is
accurate**, which in this pass is worth stating because most of the others in this
cluster are not.

**Does the strip actually change the verdict on today's tree?** Checked all three
files. `PaycheckStep.tsx:115` mentions `PRIVACY_CLAIM` inside a docblock and
`:117` reads `{PRIVACY_CLAIM.atEntry}` in JSX; `FirstDebtOrBillStep.tsx:117` is the
real read; `WelcomeStep.tsx:1` is the bare import (which does **not** contain any
dotted form, so it cannot satisfy the check on its own) and `:32` is the real read.
So all four pairings resolve after stripping, and the gate is green — while the
"delete the JSX, keep the comment" attack described at `:24-28` now reds. The
mechanism claim in that docblock is correct.

**`stripComments` correctness.** `:77`. Block comments first, then `//`.
- The `(^|[^:])` guard genuinely protects `https://` — at the `:` position `[^:]`
  fails and no later start position can re-align on the `//` pair. Verified by
  hand-tracing the alternatives.
- `^` is anchored without the `m` flag, but `[^:]` matches `\n`, so a `//` at the
  start of a line is still stripped. Correct by accident rather than by design; it
  works.
- ⚠️ **Two false-RED shapes it can produce, both safe-direction.** A `//` inside a
  string literal truncates the rest of that line, and an unterminated `/*` inside a
  string or a `//` comment makes the non-greedy block regex swallow source up to the
  next `*/` anywhere later in the file. Neither shape exists in the three pinned
  files today. Both would fail loudly rather than silently.

**Prior behaviour preserved.** The `existsSync` branch (`:83-86`), the failure
message (`:89-91`), exit 1 (`:100`) are unchanged. The success line at `:103` now
prints 4, not 3.

**Reach — what it cannot see.** This gate walks nothing; it is a fixed list of four
`(file, owner)` tuples. **It is blind to a fifth site adopting the constant and then
losing it**, and blind to the constant being renamed in
`packages/core/copy/vocabulary.ts:111,115` — a rename that updated all three call
sites would keep the gate green while the pairing string it hunts no longer exists
anywhere. Nothing verifies that `PRIVACY_CLAIM.noSelling` is still a real export.
That is the same "an exemption that stops being true" hazard `check-contrast.ts:11-13`
makes a virtue of catching, unhandled here.

**The e2e claim at `:20-22` is true.** `apps/rn/tests/e2e/earlyjourney.spec.ts:45-46`
does assert the rendered words (`'Private by design'` and `/never be sold more debt/`),
so the "two instruments failing in different directions" argument is not a story —
the other instrument exists.

### `VERDICT: SOUND`

The added pairing closes a real half-pinned finding, the comment strip closes a real
green-light path, and both are checkable against the tree. A regression is caught by
the gate itself, which is registered at `package.json:29,42`.

⚠️ **Undetermined:** whether the gate would go red is inferred from reading, not
observed — the brief forbids executing it. The inference rests on
`WelcomeStep.tsx:32` being the only surviving dotted read of `noSelling` in that
file, which I did confirm by grep.

---

## A-5 · `check-native-a11y-props.ts` — `OWNED` split out of `hits`, `EXEMPT` consulted, headlines separated

`scripts/check-native-a11y-props.ts:156` (`ownedHits`), `:165` (`allowed`), `:171`,
`:211-219`.

**The diagnosis fix is correct, and I checked the mechanism rather than the prose.**
The old single headline said *"dropped silently by react-native-web"* over both
lists. That is false of `accessibilityLiveRegion`: this file's own docstring at
`:115-118` says RNW forwards it to `aria-live`, and `apps/rn/src/utils/a11y.ts:153`
independently states the same in its platform table. So the split into two headlines
(`:203` for `BANNED`, `:212` for `OWNED`) is a real correction, and the new `OWNED`
wording at `:214` — *"they work on web and do nothing on iOS"* — matches the
mechanism.

**`EXEMPT` consultation: honours the promise, changes nothing today.** `:165` reads
`EXEMPT[rel] ?? []` and `:171` skips a prop the file is allowed. `EXEMPT` (`:55-61`)
declares `accessibilityElementsHidden`/`importantForAccessibility` for
`utils/a11y.ts` and `accessibilityActions`/`onAccessibilityAction` for
`components/ui/Slider.tsx`. **No entry names `accessibilityLiveRegion`**, so the new
branch is inert on today's tree — it is a promise-keeping change, not a behaviour
change. That is fine, and it is what the comment at `:161-164` claims.

**Prior behaviour preserved.** `BANNED` scanning is identical in effect: same
`stripComments`, same `\b<prop>\b` per stripped line, same `raw[i]` echo. `OWNED`
hits still red (via `failed` at `:218` then `:229`). Exit code unchanged.

**Would `ownedHits` go red?** The only three `accessibilityLiveRegion` occurrences in
the walked roots are `apps/rn/src/components/SaveFailedBanner.tsx:35` (inside a
docblock, blanked by `stripComments` at `:83-87`) and `utils/a11y.ts:153,174` (the
owner file, skipped at `:171`). So the list is empty at head — correct — and a new
hand-written live region anywhere in `apps/rn/src` or `apps/rn/tests` would land in
it. WARNING: **there is no positive control** — nothing in the repo proves
`ownedHits` can be non-empty, because the one historical instance was converted. The
`BANNED` list has the same property.

**Cosmetic defect in the new failure text.** `:216-217` ends the first string with a
literal `\n` and then makes a second `console.error` call that continues the same
sentence. `console.error` already appends a newline, so the sentence prints with a
blank line inside it. Compare `:206-207`, which spells the same sentence across two
calls without the stray `\n`. Trivial, but it is in the output a reader reads while
debugging a red gate.

### `VERDICT: SOUND-UNPINNED`

The correction is real and the prior red-paths are intact. Unpinned: no test
exercises this script, and — more to the point — **nothing in the repo demonstrates
that either `hits` or `ownedHits` can be produced at all.** The missing instrument
is a self-test that plants one `accessibilityLiveRegion` and one banned prop in a
fixture and asserts a non-zero exit. Without it, a refactor that broke
`stripComments` (blanking too much) would look exactly like the green run it looks
like today.

---

## A-6 · `check-native-a11y-props.ts` — the new bare-`announce()` class + baseline

`scripts/check-native-a11y-props.ts:147-153` (`BARE_ANNOUNCE_BASELINE`), `:177-188`
(the scan), `:221-227` (the report), `:233-236` (the summary line).

**The baseline is accurate — I recounted it against the tree.** Occurrences of the
`announce(` call form in `apps/rn/src` + `apps/rn/tests`, minus comments:

| file | raw | in comments | real | baseline |
|---|---|---|---|---|
| `apps/rn/src/app/(tabs)/index.tsx` (`:958`, `:1063`) | 3 | 1 (`:936`, a `//` line) | 2 | 2 — ok |
| `apps/rn/src/app/cushion-forecast.tsx:33` | 1 | 0 | 1 | 1 — ok |
| `apps/rn/src/app/demo.tsx:76` | 1 | 0 | 1 | 1 — ok |
| `apps/rn/src/app/schedule/[id].tsx:26` | 1 | 0 | 1 | 1 — ok |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:57` | 1 | 0 | 1 | 1 — ok |
| `apps/rn/src/store/tutorialSession.ts:100` | 1 | 1 (inside a block comment) | 0 | absent — ok |
| `apps/rn/src/utils/a11y.ts` (`:143`, `:172`) | 3 | 1 | 2 | excluded at `:178` |

`tutorialSession.ts:100` is the one that would have red-gated a naive count, and the
`stripComments` ordering at `:84-86` (block comments before line comments) handles
it. **The gate is green at head, and the six-calls-across-five-files figure at `:140`
and `:235` is right.**

**DEFECT — the detected class is narrower than the class the failure message names.**
`:179` matches the identifier `announce` immediately followed by `(`. The failure
text at `:184` states the mechanism as *"announceForAccessibility is an empty
function on react-native-web"* — i.e. the class is *speaking to iOS without speaking
to the browser*. **A direct `AccessibilityInfo.announceForAccessibility(…)` call does
not match**, because the character after `announce` is `F`, not `(`. So the most
direct spelling of the very defect walks straight past this gate. The same is true
of an aliased import (`import { announce as say }`). Today the only direct call is
`apps/rn/src/utils/a11y.ts:144`, which is excluded anyway — so the class *is* fully
covered, by the accident that exactly one spelling is in use. **The input that breaks
it:** any new file doing `import { AccessibilityInfo } from 'react-native'` and
calling `AccessibilityInfo.announceForAccessibility(msg)` — silent on web, and this
gate stays green. This is the same "reads one spelling of the thing it polices"
failure that `check-contrast.ts:340-343` was corrected for in this same diff.

**The baseline is a per-file COUNT, and the docblock over-claims what that detects.**
`:143-144` says *"a NEW file, or a NEW call in a baselined one, reds"*. A new call in
a baselined file reds **only if that file's total rises**. Deleting one bare
`announce()` in `(tabs)/index.tsx` and adding a different one elsewhere in the same
file keeps the count at 2 and the gate stays green — the new call is not new to the
gate. The apostrophe gate avoids exactly this by keying per SITE
(`check-apostrophes.ts:93`, a `path|text` key) rather than per count.

**No stale-baseline reporting.** `:181` reds only on `calls > baselined`. A file that
drops to zero leaves its entry in place forever, and `:235` goes on counting it as a
guarded file. `check-apostrophes.ts:289-296` explicitly solves this for its own
baseline — *"an unreported drift means the baseline silently stops describing the
tree"* — and that reasoning applies here unchanged.

**Reach.** Same `ROOTS` as the rest of the file (`:22`): `apps/rn/src` +
`apps/rn/tests`, extensions at `:63`. **Silently not walked:** `packages/core`,
`apps/rn/playwright*.config.ts`, the legacy root surface (`app/`, `components/`,
`lib/`, `tests/`), and every Swift file. `packages/core` is the one that could
matter; it holds no RN components today, so the omission is currently harmless.

**Environment.** The class is by definition a platform-divergence class, and the gate
is a build-time text scan, so it is correct on both platforms because it runs on
neither. `QA_TOOLS` / `__DEV__` are irrelevant here.

**Newly possible.** A file can now be silenced by editing a number in
`BARE_ANNOUNCE_BASELINE`. The failure text at `:225` explicitly invites this
(*"raise its BARE_ANNOUNCE_BASELINE entry … and say why"*) — but the type is
`Record<string, number>` (`:147`), which has **nowhere to put the why**. Compare
`EXEMPT`'s per-prop structure at `:55-61` and `INK_EXEMPT`'s `{ file, literal, why }`
at `check-contrast.ts:352-364`, both of which force the reason into the data. Here
the instruction the gate gives cannot be followed in the shape the gate provides —
the same "an instruction a gate gives and does not honour" critique the author wrote
at `:161-164` about `EXEMPT`, reintroduced one field over.

### `VERDICT: DEFECT`

The baseline is accurate and the class is real, but the detector is keyed on a helper
identifier while the failure message asserts a platform-API class.
`AccessibilityInfo.announceForAccessibility(…)` — the direct spelling, and the one
the message names — is invisible to it. **Breaking input:** a new call site importing
`AccessibilityInfo` from `react-native` directly. Severity moderate, not high: the
helper is the established house spelling, and the one direct call today sits in the
excluded owner file `apps/rn/src/utils/a11y.ts:144`.

---

## A-7 · `check-comment-convention.ts` — `ROOTS` widened to `packages/core` + `scripts`, plus a self-exemption

`scripts/check-comment-convention.ts:38-43` (`ROOTS`), `:82` (`OWNER_FILE`), `:142`
(the skip).

**The "zero existing violations" claim at `:35-36` is verifiable, and it holds.** I
ran each of the three `COUNTS` regexes (`:70-72`) and all eleven `META` regexes
(`:47-59`) as raw-line greps over `packages/core/**` (134 `.ts`) and `scripts/**`
(30 `.ts`, no subdirectories) — a raw-line grep is a strict superset of what
`commentLines` feeds the matchers, so zero raw hits proves zero comment hits. Result:

- `COUNTS[0]` and `COUNTS[1]` match only `scripts/check-comment-convention.ts:14,67,78`
  — the owner file, now skipped — plus `components/PlanSettings/PlanSettingsSheet.tsx:8`,
  which is in the legacy root surface and is not a root.
- `COUNTS[2]` (`which today is …`) matches only the owner file at `:14`.
- The `META` near-misses are `packages/core/utils/formatCurrency.ts:12,22`
  ("the comment below …", with no `claimed|said|was wrong` inside the 60-char window
  and a sentence-ending `.` blocking it anyway), `packages/core/utils/amountField.ts:23`,
  `packages/core/guardian/buildGuardianBrief.ts:320`, `scripts/coverage-split.ts:149`,
  and `scripts/check-maestro-selectors.ts:146`. I traced each against the full regex
  — none matches. The matchers run per LINE (`:143-146`), so none of them can span
  into a following line either.

**The self-exemption is correctly keyed.** `:142` normalises backslashes before
comparing, so it holds on Windows and on CI, matching the same convention
`check-native-a11y-props.ts:93` uses. WARNING: `hits.push` at `:145-146` uses the
*un-normalised* `rel`, so a Windows failure prints `scripts\foo.ts:12` while the
exemption key is written with forward slashes — cosmetic, but it is the one place a
reader copying a path from output would get a string that does not match the
constant they need to edit.

**It is a whole-file exemption, and that is a real hole with a stated reason.** `:79-80`
says it is *"Scoped to this exact file, never to `scripts/` as a whole"*, which is
true — but within that file, a genuine `[meta-comment]` violation is now unpoliced
forever. The rest of this cluster's gates express exemptions per-prop
(`check-native-a11y-props.ts:52-53` argues explicitly against whole-file exemptions)
or per-literal (`check-contrast.ts:349-351`). This one is the exception, and the
justification given is only that the file must quote its own examples — which a
per-pattern or per-line-range exemption would also satisfy.

**Reach — what it still silently does not walk.** The docblock at `:32-33` argues
*"[D17] is a convention about how this repo writes comments, not about one
directory"*. Measured against that stated principle, four directories remain
outside: `apps/rn/playwright.config.ts`, `playwright.embed.config.ts`,
`playwright.shots.config.ts`; the legacy root surface `app/`, `components/`, `lib/`,
`tests/`; every `.js`/`.mjs` file anywhere (`EXTS` is `.ts`/`.tsx` only, `:44`); and
every `.swift` file. The legacy root has a documented death date and is a defensible
omission; the three `playwright*.config.ts` files are not covered by any argument
here. **The widening is real and reaches 164 new files; the stated principle reaches
further than the code does.**

**Would it go red?** Yes — the mechanism is unchanged from the two roots that were
already walked, and those have red-gated before. `walk` (`:84-93`) throws on a
missing root rather than silently walking zero files, which is the correct failure
mode; both new roots exist.

**Newly possible.** Two things. (1) `packages/core` and `scripts` authors now have a
constraint they did not have, applied retroactively to ~164 files — verified
zero-cost today, but any future comment in `scripts/` explaining *why a gate's
earlier comment was wrong* now reds, which is a heavily-used form in this very
cluster's docblocks. (2) The block-comment latch at `:126-131` now runs over
`scripts/`, where several files contain regex literals for comment-stripping
(`check-copy-owners.ts:77`, `check-native-a11y-props.ts:85`). I checked those: the
escaped forms (`/\/\*…\*\//`) contain no literal `/*` or `*/` character pair, so the
latch is not tripped. The failure direction if it ever were is false-GREEN (a missed
block), not false-red.

### `VERDICT: SOUND`

The widening is measured, the measurement checks out independently, the
self-exemption is necessary and correctly keyed, and a regression in either new tree
would now red. Registered at `package.json:13,42`.


---

## Preamble to A-8 … A-12 — where this file runs

`apps/rn/tests/shots/p6.8-matrix.shot.ts` is reached by exactly one script,
`shots:demo` (`package.json:18`), which is **not** in `validate:release:rn`
(`package.json:47`) — deliberate, and argued in `apps/rn/playwright.shots.config.ts:7-12`.
It is also **not linted** (`apps/rn/eslint.config.mjs:95` global-ignores `tests/**`)
and **not typechecked** (`apps/rn/tsconfig.json` excludes `tests`). Three of this
cluster's remaining hunk-groups depend on that, so it is stated once here: **nothing
in CI reads this file, and no type error or lint error in it can be discovered
except by running the matrix by hand.**

---

## A-8 · shot matrix — the `expect.soft` rationale rewritten in the header

`apps/rn/tests/shots/p6.8-matrix.shot.ts:33-39`.

**The retraction is correct.** The old sentence justified `expect.soft` by "the
text-scale block loops surfaces INSIDE one test", and A-10 below removes that
structure — so the justification had to move. It does.

⚠️ **But the replacement reason is now empty, and the header does not notice.**
After the split, every block in this file is one-test-per-item: routes (`:388`),
sheets (`:415`), states (`:459`), text-scale (`:537`), expanded (`:644`). In all
five, the `expect.soft(...)` call is the **last statement in a `catch` block** —
`:399`, `:445`, `:491`, `:561`, `:661`. There is no code after it that a hard throw
would skip. So soft and throw now produce the identical outcome: that one test
fails, every other test still runs, the run exits non-zero. The stated reason at
`:33-34` — *"one surface failing to reach its subject must not read as 'the pass is
broken'"* — describes a reporting preference, not a behavioural difference, and the
header presents it as the reason the choice is still right.

This is not a defect; the code does the right thing. It is a comment asserting a
mechanism the code no longer has, which is the class this whole re-verification
turns on.

### `VERDICT: SOUND`

The behaviour is unchanged and correct. The stale half of the rationale was
retracted; the surviving half is weaker than the header claims.

---

## A-9 · shot matrix — `cycleHistory: []` in `STATES.empty`, and the `empty` guard

`:76-78` (the state) and `:460-483` (the guard).

**The key fix is right, and it changes exactly the two frames it should.**
`scenario()` (`apps/rn/tests/e2e/helpers/seed.ts:34-46`) seeds **no** `cycleHistory`,
so adding `cycleHistory: []` to `STATES.empty` is a no-op for `today`,
`money-debts`, `progress` and `living-expenses` — the only surface whose `seedOver`
sets that key is `history` (`:159-167`, five snapshots). So `state-history-empty`
in both themes is the entire blast radius, and that is the frame that was
photographing the populated screen.

**Would the guard fail on the defect it claims to pin? Yes — checked directly.**
Remove `cycleHistory: []` from `:78` and `merged` for `history/empty` carries five
snapshots; `:474-476` collects `['cycleHistory']` and `:478` throws. Not vacuous,
and there is a real positive control: `/living-expenses` proves the same merge path
produces an empty array when the state names the key.

**Would the naive over-fix pass it?** The naive fix *is* `cycleHistory: []`, and it
passes — correctly. The guard's value is the next `seedOver`, and it delivers that.

**Three things the guard does not cover, none live today.**
1. **Only `stateName === 'empty'`** (`:473`). `single`, `many`, `huge`, `long-names`
   and `divergent` have the identical override hazard and are unguarded. Today no
   surface pairs a `seedOver` with any of those (`history` and `living-expenses` are
   `states: ['empty']`, `:168` and `:192`; `progress` carries `divergent` but has no
   `seedOver`, `:140`). **Newly possible:** adding `states: ['single']` to `/history`
   produces a frame with one debt *and five pay cycles* and nothing notices. The
   docblock's *"Gated as a class"* (`:468`) is true of the empty class only.
2. **Only ARRAY values** (`:475`). A `seedOver` of `paycheck: {…}`, `subscriptionPlan`
   or `cushionFloor` on an `empty` state passes the guard. `paywall` (`:195`) and
   `onboarding` (`:209-216`) both carry non-array `seedOver` keys; neither declares
   `states`, so this is latent too.
3. **It reasons about the SEED, not the frame.** `:471` says *"This asserts the
   property the state's NAME claims"* — it asserts a property of the merged seed's
   array fields. `scenario()` still supplies `paycheck: {amount:'2000'}`,
   `subscriptionPlan: 'premium'` and `genuineCycleCount: 6` to every "empty" frame.
   That is fine and pre-existing, but the docblock's claim is larger than the check.

**Placement.** The throw at `:478` is **outside** the `try` (`:485`), so a
configuration error fails the test hard and does not print an `⛔ UNREACHED` line —
correct, because it is not a reachability hole. Worth knowing when reading the run
log: this class of failure appears only in Playwright's failure list.

### `VERDICT: SOUND-UNPINNED`

The fix and the guard are both correct and the guard is non-vacuous. Unpinned in the
strict sense: the guard only runs under `npm run shots:demo`, which no CI job
invokes (see the preamble), so a regression is caught only when someone shoots the
matrix. There is no cheaper instrument, and building one would be disproportionate —
recording it as the honest state rather than as a defect.

---

## A-10 · shot matrix — the text-scale block split to one test per surface

`:514-566`, with the softness note rewritten at `:559-561`.

**The defect it fixes is real and the fix is the right one.** The old block ran
`for (const s of SURFACES)` *inside* one `test`, sharing one `page`. The file's own
`reseed` docstring at `:312-314` states the mechanism — *"the previous surface's app
is still alive when the next seed is written, and its 500 ms autosave debounce puts
its own store back over the blob"* — and the route block at `:376-385` already
carried the rule. Playwright gives each `test` a fresh context and page, so
one-test-per-surface is the only structure that makes `reseed` reliable. The stated
measurement (`:522-525`: `textscale-2x-history.png` showing *"No finished cycles
yet."* from the same `seedOver` as `history.png`) is exactly the signature that
mechanism predicts, and I could not falsify it from source.

**Prior behaviour preserved.** Frame paths are unchanged
(`shot(page, vpName, theme, \`textscale-${scale}x-${s.name}\`)`, `:555`), the CSS
scaling `page.evaluate` (`:548-553`) is untouched, the 450 ms settle at `:554` is
untouched, and the `⛔ UNREACHED` log line at `:558` is unchanged. Test titles gain
`${s.name}` (`:537`) and stay unique because `SURFACES` names are unique.

**Cost, stated because nobody else will.** The block goes from
2 viewports × 2 themes × 2 scales = **8 tests** to × 10 surfaces = **80 tests**, each
now paying a fresh browser context, a fresh navigation and `settle`'s 1,800 ms floor
(`:366`). The per-test 180 s budget (`apps/rn/playwright.shots.config.ts:22`) is no
longer a shared hazard, which is the trade `:532-534` claims — that part is right.

**⚠️ The split multiplies an existing false guarantee.** `:316-318` asserts *"why
every surface now carries a `ready` assertion"*. **Only one does** —
`onboarding` at `:220` — and `s.ready` is consulted in exactly one place, the route
block at `:391`. The text-scale block does not call it (`:539-541`), nor does the
states block (`:484-486`). So the 80 new text-scale tests include
`textscale-1.35x-onboarding` and `textscale-2x-onboarding` at two viewports and two
themes — **8 frames of a route whose known failure mode is silently photographing
Today** (`:304-305`), with no door-check at all. This is pre-existing, but the split
was the moment to carry `ready` across and it did not.

**Formatting.** `:536-538` opens the `for` outside `test(…)` and leaves a
lone block statement `{` at `:538` / `}` at `:563` so the body keeps its old
indentation. Valid JS; `no-lone-blocks` would flag it if the file were linted, and
it is not (`apps/rn/eslint.config.mjs:95`). Cosmetic.

### `VERDICT: SOUND`

The isolation defect is real, the measurement is consistent with the mechanism, and
nothing the block did before was lost.

---

## A-11 · shot matrix — three corrected comments

`:176-181` (the `/history` false deferral), `:575-580` ("all 226 frames" → "every
other frame"), `:586-591` (`coachMarksSeen` "nowhere else in this file").

**Two of the three corrections check out.**

- **`:176-181`** — the retracted sentence claimed `/history` needed "a real fixture
  and not a one-liner". It is a one-liner: `:159-167` is a five-element
  `Array.from`, and `cycleHistory` is a plain array. The correction is accurate.
  ⚠️ It says the `seedOver` *"sits fifteen lines above this"* (`:179`); `seedOver:`
  is at `:159` and this comment block opens at `:176` — 17 lines, or 20 to the line
  making the claim. **A positional count in prose is the same shape of claim as the
  "all 226 frames" total that `:578-580` was written in this same diff to retire.**
- **`:575-580`** — replacing a literal total with *"every other frame in the
  matrix"* is correct and cannot go stale. Verified that the claim itself is true:
  `EXPANDED` (`:607-637`) is the only block that opens a disclosure; the route,
  sheet, state and text-scale blocks all shoot the card at rest.

**⚠️ The third correction replaces a false sentence with a mechanism this same file
records as measured-false.** `:586-587` now reads: *"the mark's card **sits over the
control**, so without it a recipe that CLICKS can mis-tap or time out."* But
`:421-423`, 165 lines above, says the opposite in as many words:

> *"The mark does NOT intercept: `coach-marks.spec.ts:89` asserts 'the marked control
> stays live — a hint is not a modal' … So the first guess here (pointer
> interception) was wrong, and the spec had already written down why."*

and `:417-419` gives the actual web mechanism: the mark *"renders INSIDE the debt
sheet's footer, **in flow** … having displaced it."* The e2e spec confirms it
independently — `apps/rn/tests/e2e/coach-marks.spec.ts:31-33` records that RN-web
lays the callout out in normal document flow, landing below the fold, and
`:89` is the "stays live" test the matrix cites. **On the platform this file runs
on, the mark displaces layout; it does not sit over anything.** The correction is
right that the seeding is needed and right that "nowhere else" was false; the
mechanism sentence it introduces walks back into the trap the file documents.

**A convention question, on the file the convention gate walks.** All three of these
corrections — plus `:33-39` — annotate a wrong comment rather than delete it.
`scripts/check-comment-convention.ts:10-13` states [D17] half 1: *"No
meta-commentary about which earlier COMMENT was wrong … correcting a false comment
means DELETING it, not annotating it"*, and `apps/rn/tests` is one of that gate's
`ROOTS` (`check-comment-convention.ts:40`). I traced all eleven `META` patterns
(`check-comment-convention.ts:47-59`) against these four passages: **none matches**,
because the gate is *"deliberately approximate"* (`:22-23`) and these phrasings
("THIS COMMENT WAS FALSE", "This used to claim", "This read …") sit just outside the
written forms. So this is not a red gate — it is four instances of the class the
gate exists for, in a walked file, surviving because the matchers are narrow. Worth
Jason's call rather than mine, since the annotate-vs-delete tradeoff is a house-style
decision.

### `VERDICT: DEFECT`

Not for the corrections themselves — two are accurate and useful — but for the
mechanism introduced at `:586-587`. **The environment that breaks it:** react-native-web,
which is the only platform this file ever runs on. A reader who takes "sits over the
control" at face value will look for a pointer-interception fix that
`coach-marks.spec.ts:89` already measured to be the wrong theory, and `:421-423`
already paid for once. Severity low — comment-only, no behavioural effect — but it is
precisely the recurrence pattern the brief asks about.

---

## A-12 · shot matrix — `DIVERGENT` de-duplicated to `STATES.divergent`

`:600-605`.

**Byte-for-byte identical, so behaviour is unchanged.** I compared the deleted
literal against `STATES.divergent` (`:90-95`) field by field: same two debts, same
`balance` 800 / 6000, same `apr` 8.0 / 26.99, same `day(6)` / `day(11)`, same ids.
Both were module-level constants evaluated in the same tick, so folding `day()` into
one evaluation changes nothing. `seedOver: DIVERGENT` (`:628`) is spread into a fresh
object at `:647-650` and then `JSON.stringify`'d in `reseed` (`:325`); nothing
mutates the shared `debts` array, so the new aliasing is safe.

**The dedupe reasoning is sound** — two portfolios that must disagree about strategy
order, maintained in two places, is a real drift hazard.

**⚠️ What it made possible that nothing checks.** `STATES` is typed
`Record<string, Record<string, unknown>>` (`:74`), so `STATES.divergent` is an
**unchecked index lookup**. A typo, or someone renaming the state key, yields
`undefined` — and `seedOver: undefined` (`:628`) means `{...(s.seedOver ?? {})}` at
`:648` silently falls back to the default `scenario()` seed, which has **one debt**.
That is exactly the failure the docblock at `:593-595` says this seed exists to
prevent: *"the first version of `strategy-compare-full` photographed two identical
columns."* The byte copy could not fail that way; the alias can. And nothing would
notice — the frames assert nothing (`:22-23`), the file is not typechecked
(`apps/rn/tsconfig.json` excludes `tests`), not linted
(`apps/rn/eslint.config.mjs:95`), and not in `validate:release:rn`. A one-line
`if (!DIVERGENT) throw` — or typing `STATES` as `const` so the key is checked — would
close it.

### `VERDICT: SOUND-UNPINNED`

Correct and behaviour-preserving. Nothing would catch the regression it newly makes
possible: a `STATES.divergent` rename silently reverts `strategy-compare-full` to a
one-debt portfolio and the frame comes back looking plausible. **The missing check:**
a non-null assertion on `DIVERGENT` at module scope, or `STATES` declared
`as const` / with a `keyof` type so the lookup is compile-checked.

---

# TALLY

| # | hunk-group | verdict |
|---|---|---|
| A-1 | `check-apostrophes.ts` — Swift `phrases:` latch rewritten | `SOUND-UNPINNED` |
| A-2 | `check-apostrophes.ts` — both classes report before either exits | `SOUND-UNPINNED` |
| A-3 | `check-contrast.ts` — `INK_LITERAL` widened, gradient exclusion dropped | `SOUND` |
| A-4 | `check-copy-owners.ts` — 4th pairing + comments stripped | `SOUND` |
| A-5 | `check-native-a11y-props.ts` — `OWNED` split, `EXEMPT` consulted | `SOUND-UNPINNED` |
| A-6 | `check-native-a11y-props.ts` — bare-`announce()` class + baseline | **`DEFECT`** |
| A-7 | `check-comment-convention.ts` — `ROOTS` widened + self-exemption | `SOUND` |
| A-8 | shot matrix — header `expect.soft` rationale rewritten | `SOUND` |
| A-9 | shot matrix — `cycleHistory: []` + the `empty` guard | `SOUND-UNPINNED` |
| A-10 | shot matrix — text-scale split to one test per surface | `SOUND` |
| A-11 | shot matrix — three corrected comments | **`DEFECT`** |
| A-12 | shot matrix — `DIVERGENT` de-duplicated | `SOUND-UNPINNED` |

**5 `SOUND` · 5 `SOUND-UNPINNED` · 2 `DEFECT` · 0 `REGRESSION` · 0 `WEAK-TEST` ·
0 `DEAD` · 0 `UNREACHABLE-GATE`.**

Every gate in this cluster is registered and would go red on its own class; none is
unreachable. No hunk removed a property the site had before — the one candidate
(A-1's closing-`]` line, no longer scanned) is latent against every site in the tree
and is recorded inside A-1 rather than as a `REGRESSION`.

## Defects, in severity order

1. **A-6 — `check-native-a11y-props.ts:179`** detects the identifier `announce(`
   while the failure message at `:184` asserts the
   `announceForAccessibility`-is-empty-on-web class.
   `AccessibilityInfo.announceForAccessibility(…)` does not match the pattern
   (`announce` is followed by `F`, not `(`), so the most direct spelling of the
   defect is invisible. Covered today only by the accident that the sole direct
   call is `apps/rn/src/utils/a11y.ts:144`, which the gate excludes at `:178`.
   Adjacent, same file: the baseline is a per-file **count** (`:147-153`), so
   delete-one-add-one inside a baselined file stays green while `:143-144` claims
   *"a NEW call in a baselined one, reds"*; and the failure text at `:225` tells the
   reader to *"say why"* in a `Record<string, number>` that has no field for a why.
2. **A-11 — `apps/rn/tests/shots/p6.8-matrix.shot.ts:586-587`** states the coach-mark
   mechanism as *"the mark's card sits over the control"*. The same file records that
   theory as measured-false at `:421-423`, gives the real web mechanism (in-flow
   displacement) at `:417-419`, and
   `apps/rn/tests/e2e/coach-marks.spec.ts:31-33,89` documents it independently.
   Comment-only; no behavioural effect.

## Unpinned, in order of what a regression would cost

1. **A-12** — `const DIVERGENT = STATES.divergent` (`:605`) is an unchecked index
   lookup in a file that is neither typechecked nor linted. A key rename yields
   `undefined`, `seedOver` falls back to the one-debt default seed, and
   `strategy-compare-full` silently returns to the two-identical-columns frame the
   seed exists to prevent.
2. **A-5 / A-1 / A-2** — no test anywhere exercises any of these five gate scripts,
   and nothing in the repo demonstrates that `hits`, `ownedHits`, or the Swift scan
   can produce a non-empty list at all.
3. **A-9** — the `empty` guard only runs under `npm run shots:demo`
   (`package.json:18`), which no CI job invokes.

## Observations that are not verdicts

- **Stale `path:line` in unchanged prose.** `check-contrast.ts:331` cites
  `TrajectoryChart.tsx:603` (actual `:665`) and `:360` cites `line 307`
  (actual `:344`) — and `TrajectoryChart.tsx` was edited in this same range.
  `check-native-a11y-props.ts:120` cites `utils/a11y.ts:166` for
  `useLiveAnnouncement` (actual `:167`); `:137` cites `a11y.ts:152` for the platform
  table (it runs `:151-154`).
  `p6.8-matrix.shot.ts:179` says the `/history` `seedOver` is *"fifteen lines above"*
  (it is 17-20) — the same shape of ageing positional claim that `:578-580` was
  written in this diff to retire.
- **`p6.8-matrix.shot.ts:318`** asserts *"every surface now carries a `ready`
  assertion"*. One of ten does (`:220`), and `s.ready` is consulted in one of five
  blocks (`:391`). A-10's split adds 8 unchecked `textscale-*-onboarding` frames of
  the route whose known failure mode is silently photographing Today.
- **[D17] annotate-vs-delete.** Four passages in this diff correct a wrong *comment*
  in place (`p6.8-matrix.shot.ts:33-39`, `:176-181`, `:578-580`, `:589-591`) in a
  file that `check-comment-convention.ts:40` walks. None matches any of the eleven
  `META` patterns, so no gate reds — but `check-comment-convention.ts:10-13` says
  correcting a false comment means deleting it. A house-style call, flagged not
  decided.
- **`lint:rn` is `&&`-chained** (`package.json:42`), so the first failing gate hides
  every later one — the same "one CI cycle becomes two" problem A-2 fixed *inside*
  `check-apostrophes.ts`, still present one level up.

## Could not determine

- Whether any gate actually exits 1 — the brief forbids executing them. Every "would
  go red" above is inferred from reading the control flow plus a grep proving the
  matcher does or does not reach a real line.
- Whether the text-scale frames now carry the seeds the split was meant to preserve.
  That is only visible by shooting the matrix and looking at
  `apps/rn/capture-ref/p6.8/phone/dark/textscale-2x-history.png`, which this pass did
  not do. The mechanism at `:312-314` predicts it, and the evidence quoted at
  `:522-525` is consistent with it, but I re-derived neither.
- Whether the ten `border.strong` consumers and the `INK_EXEMPT` reasoning in
  `check-contrast.ts` are still accurate — outside this diff's hunks, not re-measured.
