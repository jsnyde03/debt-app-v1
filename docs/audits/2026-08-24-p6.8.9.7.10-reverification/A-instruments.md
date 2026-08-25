# Cluster A — THE INSTRUMENTS

Independent re-verification of `8e4540a..3dc3c22` over:

| file | change |
|---|---|
| `scripts/check-apostrophes.ts` | +65 — a second, Swift-only scan |
| `scripts/check-contrast.ts` | +80 — a literal-ink scan + a rewritten `border.strong` exclusion comment |
| `scripts/check-copy-owners.ts` | **new**, +80 — asserts fix-sites still read their copy constant |
| `scripts/check-native-a11y-props.ts` | +51 — an `OWNED` list (`accessibilityLiveRegion`) + a corrected tally |
| `apps/rn/tests/shots/p6.8-matrix.shot.ts` | +237 — new frames / assertions |

Method: `git diff`, then each file read in full in its site, plus registration in root
`package.json` / `apps/rn/package.json`, plus the code each gate claims to police.
Nothing was executed. Sections are appended as each hunk-group is finished.

**Registration, checked once for all four gates** (`package.json:29`, `package.json:42`):
`lint:copy-owners` is newly declared and **is** spliced into the `lint:rn` chain
(`package.json:42`), which `validate:release:rn` runs (`package.json:47`). The other three
gates were already in that chain. So all four fire in the aggregate run, not only by hand.

---
## A1 — `scripts/check-apostrophes.ts`: the Swift scan (`check-apostrophes.ts:173-236`)

### Verdict: `DEFECT` (latent, plus one live ordering defect)

**Q1 — prior properties.** The TS half is untouched. The new block is inserted at
`check-apostrophes.ts:173`, i.e. **after** the `--fix` early-exit (`:160`) and the
`--baseline` early-exit (`:170`), and **before** the baseline-existence check (`:238`) and the
`fresh` diff (`:244`). Two consequences the hunk cannot show:

- `--fix` (`:149-161`) **never sweeps Swift** — it `process.exit(0)`s before the block. The
  docstring at `:106-120` sells the sweep as "the fixer shares the gate's AST walk on purpose…
  here they cannot disagree." For Swift they *do* disagree: the gate reports, the fixer is
  silent. Not wrong, but the file's own stated invariant no longer holds across both halves.
- `--baseline` (`:167-171`) never records Swift, which is intended and stated (`:233`).

**Live ordering defect — Swift masks TypeScript.** `swiftHits` exits 1 at
`check-apostrophes.ts:235`, *before* the missing-baseline check at `:238` and before the
`fresh` report at `:246`. So the moment one Swift string trips, the gate stops reporting **new
TS copy apostrophes entirely** — the class it was originally built for. The TS work is already
done at `:163-165`, so this is pure sequencing: `swiftHits` should join the same failure
report, not short-circuit ahead of it. A developer who adds a Swift contraction *and* a TS
contraction in one commit fixes the Swift one, re-runs, and only then discovers the second.

**Q2 — environments.** Windows/CI path handling is right: `relative(...).replace(/\/g,'/')`
at `:214` matches the TS half's spelling (`:83`). `walkSwift` guards `existsSync` (`:201`),
which the TS `walk` does not — correct, since `targets/` and `modules/` are optional trees.
Coverage is genuinely complete against the tree: all 16 live `.swift` files sit under the three
`SWIFT_ROOTS` (`:186-190`); the only Swift outside is `ios/App/**` (3 files), excluded on
purpose (`:183`).

**Q3/Q6 — does it reach its class, and would it go red?** It reds (`process.exit(1)`, `:235`)
and it is in `lint:rn` → `validate:release:rn` → `.github/workflows/web-e2e.yml:92`. But the
scanner is a **line-based string matcher, not a parser**, and three holes follow from that:

1. ⛔ **`SWIFT_EXEMPT_CONTEXT` is a one-way latch that can disable the rest of the file.**
   `check-apostrophes.ts:217-220`:
   ```js
   if (SWIFT_EXEMPT_CONTEXT.test(line)) inPhrases = true;
   else if (inPhrases && /\]/.test(line)) inPhrases = false;
   ```
   The close-test is in an `else if`, so a **single-line** `phrases: ["a", "b"]` sets
   `inPhrases = true` and can never clear it on that line — and nothing later in the file is
   likely to be a bare `]`. **Every subsequent line of that file is then silently skipped**, and
   the gate prints green. That is precisely the failure mode the block's own docstring says it
   was written to avoid (`:179-181`: "would have silently walked zero Swift files and gone on
   reporting green — the same shape of blindness, one layer down"). Not live today: all four
   arrays in `SiriQueryIntents.swift:105,115,125,137` are multi-line and close on their own
   `],`. It is one reformat away.
2. ⛔ **The exempt test runs on the RAW line, before comments are stripped.** Comment removal
   happens at `:222`, three lines *after* the `inPhrases` test at `:218`. So a doc comment
   containing the text `phrases: [` — in a file whose whole subject is `phrases:` arrays;
   `SiriQueryIntents.swift:85` already discusses them in prose — flips the latch and suppresses
   scanning until the next `]`.
3. **Comment handling is `//` only.** `:222` strips `//`-to-EOL, which covers `///` docs, but
   **no `/* … */` block comments**. `KeyCommandsModule.swift:1-20` and
   `ScanVisionModule.swift:1-20` are `/* … */` headers, and both already contain contractions
   (`KeyCommandsModule.swift:8,12,13,14`). They pass today only because those particular lines
   happen to contain no `"` characters. A block-comment line that quotes a phrase —
   `* the "you're all set" banner` — produces a **false red with no exemption mechanism**, since
   `SWIFT_EXEMPT_CONTEXT` is the only escape hatch and it is keyed on `phrases:`. Conversely
   `line.replace(/\/\/.*$/,'')` truncates at a `//` **inside** a string literal (a URL), so
   `"https://x — you're set"` is a false negative.

**Q5 — would a test have failed on the defect?** **No test proves any of it.** There is no
self-test for this gate anywhere (`grep` for `check-apostrophes` outside the script itself
returns only `package.json:28` and one unrelated comment at
`apps/rn/src/analytics/funnel.test.ts:64`). The Swift scan's correctness rests entirely on it
currently finding zero hits, which is indistinguishable from it walking zero lines.

**Q7 — newly possible.** Swift files can now red the release gate, and there is **no per-string
exemption** — only the `phrases:` context. A legitimate non-copy Swift literal (`NSLog`, a
dictionary key, an `NSPredicate` format) that contains a contraction has no way to be declared
correct short of editing the gate. `check-contrast.ts` solved exactly this with a keyed
`INK_EXEMPT` (`check-contrast.ts:337-350`); this gate did not get the same affordance.

---
## A2a — `scripts/check-contrast.ts`: the LITERAL-INK scan (`check-contrast.ts:313-375`)

### Verdict: `DEFECT` — the exclusion it inherits blinds it to the most common RN spelling

**Q1 — prior properties.** Purely additive: a fourth pass appended after the
literal-equals-a-token loop (`:296-311`), before the `border.control` block (`:407`). `failures`
is shared, so a hit reaches the same report and the same `process.exit(1)` (`:436`). The
`theme/colors.ts` skip is re-implemented (`:357`) consistently with `:297`. Nothing earlier
regressed.

**Q6 — does it reach its class?** Partly, and the gaps are structural:

1. ⛔ **`withoutGradients` is reused, and it blanks any bracketed array containing a hex — which
   is exactly what an inline RN style array looks like.** `check-contrast.ts:361` calls
   `withoutGradients(line)` (defined `:295`:
   `line.replace(/\[[^\]]*'#[0-9a-fA-F]{3,8}'[^\]]*\]/g, '[]')`). Given
   `style={[styles.row, { color: '#fff' }]}` the whole bracketed run matches and is replaced by
   `[]`, so **the ink literal is deleted before `INK_LITERAL` ever sees the line.** That spelling
   is pervasive in this codebase — `ImportDebtsSheet.tsx:128`, `BackupSheets.tsx:68,156`,
   `PaydayCaptureSheet.tsx:348,439,481`, `AddRow.tsx:43` all carry `color:`/`borderColor:` inside
   an inline array. The two defects this gate was written for happened to live in
   `StyleSheet.create` object literals (`ListRow.tsx:205` and `SpokenForSheet.tsx:166` at
   `8e4540a`, both verified — the citations in the new docblock are accurate for that SHA), so
   the gate catches the two it was shown and misses the whole conditional-inline half of the
   class. The docblock at `:290-294` argues the gradient exclusion must blank *the array, not the
   line* precisely so nothing is over-skipped; applied to `color:` it over-skips a different way.
2. **`\bcolor:` only — the `color=` JSX spelling is not scanned.** `INK_LITERAL`
   (`check-contrast.ts:336`) requires a colon. RN paints ink through props too
   (`<AppIcon color=… />`, `<ActivityIndicator color=… />`), and the file's own `textUses` helper
   at `:160` already handles both spellings: `\bcolor\s*[:=]\s*\{?`. The new check regressed to
   the narrower form. No live site today (`grep -rE 'color=("#…"|\{'#…'\})' apps/rn/src` → 0), so
   this is a hole, not a live miss.
3. **Double-quoted literals are missed.** The pattern demands `'`. `color: "#fff"` passes.
   Prettier config makes this unlikely, not impossible.
4. **Comments are not stripped.** Unlike `check-native-a11y-props.ts`, which runs
   `stripComments` first, this loop reads raw lines. A commented-out `color: '#fff'` is a
   **false red** with no way out except an `INK_EXEMPT` entry that would then be a lie.

**Q2 — environments.** The arithmetic is theme-correct by construction: `INK_LITERAL` fires on
the literal regardless of scheme, which is the whole point (`:322-325`). It reads `.ts`/`.tsx`
under `apps/rn/src` only (`files = walk(SRC_DIR)`, `:174`, `:141-149`) — so SwiftUI ink in
`apps/rn/targets/widget/DebtViews.swift` is out of reach. That matches the file's declared scope
but means the widget's colours are policed by nothing.

**Q3 — `INK_EXEMPT` mechanics.** `check-contrast.ts:337-350`. Keyed on file+literal, matched
`rel.endsWith(e.file) && e.literal.toLowerCase() === m[1].toLowerCase()` (`:362`). Correct, and
the per-literal keying is the right call as argued at `:333-335`.
⚠️ **Unlike `EXEMPTIONS`, this exemption is never verified.** `check-contrast.ts:242-250` reds
when a `never-text` claim stops being true; an `INK_EXEMPT` entry whose site is deleted just
becomes dead config, silently. The file's own opening principle — *"an exemption that stops
being true fails the run that makes it false, which is the only kind of exemption worth having"*
(`:12-13`) — is not honoured by the new one.
⚠️ **Its cited lines are already stale.** The `why` at `:344-349` names
`TrajectoryChart.tsx` "line 307" for `gold`; at `8e4540a` that was right, but the same commit
range grew the file and it is now `TrajectoryChart.tsx:328`. The docblock's `TrajectoryChart.tsx:603`
is now `:638`. Nothing checks a line number in a comment.

**Q5 — would a test have failed?** **No test proves it.** There is no fixture-driven self-test
for `check-contrast.ts`; its only proof is that it currently finds exactly one literal
(`TrajectoryChart.tsx:638`) and that one is exempt. A regression in `withoutGradients` or in
`INK_LITERAL` would show as "still green".

**Q7 — newly possible.** A developer told "use a token or declare an exemption" who writes the
literal inside an inline style array gets silence. That is the same *shape* as the bug the block
was written to close, one spelling over.

---

## A2b — `scripts/check-contrast.ts`: the rewritten `border.strong` exclusion (`check-contrast.ts:391-406`)

### Verdict: `SOUND-UNPINNED`

**Q1 — is the new comment true?** Comment-only hunk; no arithmetic changed. I enumerated
`border.strong` independently and the claim holds exactly:
- 8 `Switch` off-tracks — `more.tsx:317,323,343,352,360,396`, `CloudBackupSheet.tsx:86`,
  `SwitchRow.tsx:15`
- 1 onboarding step dot — `OnboardingLayout.tsx:32`
- `AddRow` — moved out; it now reads `border.control` (`AddRow.tsx:43`)

Ten consumers, none of them "a divider, a card edge, an underline". The correction is accurate.

**Q2/Q6 — but the moved consumer is the one the check does not model.** The 3:1 block
(`check-contrast.ts:407-426`) hard-codes the control's fill:
```ts
const fill = solid(colors.background.secondary[scheme]);
const stroke = composite(colors.border.control[scheme], fill);
```
`AddRow` has **no `backgroundColor` at all** (`AddRow.tsx:50-60` — only `borderWidth: 1`,
`borderStyle: 'dashed'`), which is the reason given for moving it (`AddRow.tsx:34-35`). So the
pixel the gate computes for `border.control` is a composite `AddRow` never performs, and the
`best = Math.max(border, fillOnly)` escape at `:414` can clear the floor on a **fill** that
`AddRow` does not have. I computed the un-modelled case by hand: `rgba(255,255,255,0.40)` over
`background.primary.dark` `#07111f` is ≈`rgb(106,112,121)`, **3.79:1** against that ground —
above 3:1, so this is **not a live failure**, but the margin is 0.79 and the gate is not the
thing that proved it. The dashed stroke is also modelled as solid.

**Q6 — the exclusion is still an unverified claim.** The hunk's own headline is that an
exclusion is a claim and this one *"was never true"* (`:391-393`). The replacement is true today
and is enforced by **nothing**: `border.strong` has no `never-control` verification the way
`never-text` exemptions are re-proved from source every run (`:242-250`). The next `border.strong`
consumer that *is* a control boundary re-creates V1-5 with the comment still reading correct.
That is the missing instrument: an enumeration check over `border.strong` consumers, or a
`textUses`-style source assertion.

**Q7 — newly possible.** `AddRow`'s outline went from 1.41:1 to ≈3.8–4.0:1 — a **visible**
change to a shipped surface in both themes. Whether any reference frame covers it is answered in
A5; nothing in `scripts/` does.

---
## A3 — `scripts/check-copy-owners.ts` (new file, 80 lines)

### Verdict: `WEAK-TEST`

**Q6 — registration.** `package.json:29` declares `lint:copy-owners`, and `package.json:42`
splices it into `lint:rn` between `lint:icon-glyphs` and `lint:lane`. `lint:rn` runs in
`validate:release:rn` (`package.json:47`) and in CI (`.github/workflows/web-e2e.yml:92`). It
`process.exit(1)`s (`check-copy-owners.ts:77`). ✅ It is a real gate in the aggregate run.

**Q1/Q6 — all three pairings are true of the tree right now**, verified independently:
`PaycheckStep.tsx:117`, `FirstDebtOrBillStep.tsx:117` and `WelcomeStep.tsx:32` each read the
declared owner, and `PRIVACY_CLAIM` is defined at `packages/core/copy/vocabulary.ts:109`.

**⛔ Q5 — the assertion is `src.includes('PRIVACY_CLAIM.atEntry')` over the RAW FILE**
(`check-copy-owners.ts:71`). It measures *"the character sequence appears somewhere in this
file"*, and it claims *"the site is still asking the owner rather than answering for itself"*
(`:22`). Those are different, and the gap is wide open in **this** codebase specifically:

- **Comments count.** Every one of these three files carries a long docblock about
  `PRIVACY_CLAIM` right beside the JSX — `PaycheckStep.tsx:115`, `WelcomeStep.tsx:28-31`,
  `FirstDebtOrBillStep.tsx:114-116`. They pass today only because none of them happens to write
  the **dotted** form. The gate's own failure message tells the reader *"If the site genuinely
  moved, update the pairing here and say where it went"* (`:75`) — a developer who deletes the
  `<Text>` and leaves `// was PRIVACY_CLAIM.atEntry, moved to …` keeps the gate green while the
  closure is undone. That is precisely the scenario at `:15-16`
  (*"the closure could be undone by deleting one line and no suite would notice"*).
- **Import lines count.** `PaycheckStep.tsx:4` imports `PRIVACY_CLAIM`; an unused import
  (`apps/rn` lints with `--max-warnings=0`, so this would likely be caught there — but by ESLint,
  not by this gate) would satisfy a bare-identifier pairing. The dotted spelling narrows this
  usefully; it does not close it.
- **Rendering is not measured.** `WelcomeStep.tsx:32` is an entry in a module-scope `BULLETS`
  array. If the render stopped mapping bullet 3, the array entry — and the gate — are untouched.

An AST check (does an identifier `PRIVACY_CLAIM` with property `atEntry` appear as an
*expression*?) would measure the claim. The repo already owns that machinery:
`check-apostrophes.ts:80-103` walks TS/TSX with `typescript` for exactly this reason, and its
docblock explains why line scanning was wrong there (`:19-22`: *"the comments about this class
outnumber the class"*). This new gate re-adopts the rejected method.

**⚠️ The pairing pins only half of one closure it names.** `WelcomeStep.tsx:32` renders **two**
constants — `PRIVACY_CLAIM.headline` *and* `PRIVACY_CLAIM.noSelling` — and the site's own comment
insists *"Both halves are the CONSTANT, never a literal"* (`WelcomeStep.tsx:28`). `PAIRINGS`
declares only `PRIVACY_CLAIM.headline` (`check-copy-owners.ts:66`). Replacing `noSelling` with a
literal keeps this gate green, and `lint:copy` reads literals so it would see a new string with
no owner — but nothing connects the two.

**⚠️ The docblock contradicts the array.** `:24-27` says the gate deliberately covers only
surfaces the e2e cannot reach, *"(A4/M1-9 are pinned in `earlyjourney.spec.ts`)"*. The A4/M1-9
pairing is nevertheless in `PAIRINGS` (`:63-68`). The e2e pin is real — `earlyjourney.spec.ts:33`
— so this is duplicated coverage described as excluded. Harmless, but the stated scope is not the
implemented scope.

**Q2 — environments.** Pure Node file reading; no dates, no locale, no platform surface. Windows
paths handled (`join` for the read, `relative(...).replace(/\/g,'/')` for the message, `:74`).
The missing-file branch (`:67-70`) is a genuinely good touch — a deleted site fails loudly rather
than passing vacuously.

**Q3 — style drift, non-blocking.** Imports `'fs'`/`'path'` (`:1-2`) where every sibling gate uses
`node:fs`/`node:path` (`check-apostrophes.ts:27-28`, `check-contrast.ts:31-32`). No gate enforces
it — root `eslint` is not part of `lint:rn`, only `npm --prefix apps/rn run lint` is.

**Q7 — newly possible.** `PRIVACY_CLAIM` has **eight** consumers
(`more.tsx:455,457`, `paywall.tsx:274`, `CompletionStep.tsx:19`, `DemoDock.tsx:109`, plus the
three pinned). The five unpinned ones can silently revert to literals. Nothing in the file says
the list is partial, so the green line *"3 closure(s) still read the constant that owns their
claim"* (`:80`) reads as coverage of the class rather than of three chosen sites.

---
## A4 — `scripts/check-native-a11y-props.ts`: the `OWNED` list (`check-native-a11y-props.ts:110-167`)

### Verdict: `DEFECT` (in the gate's output contract, not its detection)

**Q1 — prior properties preserved.** The `BANNED` loop (`:89-108`) is untouched, `EXEMPT`
(`:55-61`) still applies to it, and the new loop appends into the same `hits` array so both
classes share one `process.exit(1)` (`:159`). The `rel` spelling (`:137`) matches `:93`, so
Windows/CI parity holds. ✅

**Q3 — the technical claim is right, and I checked it against the repo's own record.**
`check-native-a11y-props.ts:117` asserts RNW forwards `accessibilityLiveRegion` to `aria-live`
and that iOS ignores it. `apps/rn/src/utils/a11y.ts:153` — written independently, by the
primitive — states the same table: *dropped on iOS, works on web*. Consistent. Correctly kept
out of `BANNED`, whose meaning is "RNW drops this" (`:115-116`).

**Q6 — does it reach its class and go red?** Yes. `ROOTS` (`:22`) is `apps/rn/src` +
`apps/rn/tests`; `stripComments` (`:83-87`) blanks docblocks so the long explanations in
`SaveFailedBanner.tsx:35` and `affordability.spec.ts:62-64` do not self-trip; `:144` skips only
the owner file. The tree is currently clean — the sole live `accessibilityLiveRegion` is
`a11y.ts:174`, inside `useLiveAnnouncement`, and both consumers go through the hook and spread
its props (`AffordabilityCard.tsx:124,186`; `SaveFailedBanner.tsx:43,50`). ✅

**⛔ DEFECT — a hit from the new loop prints under a header that says the opposite of the truth,
with remediation that does not exist.**
- `check-native-a11y-props.ts:154` prints
  `'❌ Native-only a11y props found (dropped silently by react-native-web):'`. The entire point of
  the `OWNED` docblock (`:115-118`) is that RNW does **not** drop this prop. Every `OWNED` hit is
  announced under a false diagnosis.
- `:156-158` then instructs: *"Use the aria-* equivalent"* — wrong; `aria-live` alone is exactly
  the half-fix the entry exists to forbid — and *"declare it per-prop in `EXEMPT`"* — **`EXEMPT`
  is never consulted by the `OWNED` loop.** `:144` skips on `rel === o.ownerFile` and nothing
  else, so there is no exemption path at all. A developer following the printed advice writes an
  `EXEMPT` entry that does nothing and the gate stays red with no explanation.

The per-hit string at `:146` does carry the correct guidance, so this is recoverable by a
careful reader; it is still a gate that mis-states its own finding, which `:80` identifies as how
a guard *"gets deleted rather than obeyed"*.

**Q1 — the tally comment.** `:161-166` is correct and the arithmetic is right
(`BANNED.length` 7 + `OWNED.length` 1). No issue.

**Q5 — would a test have failed on the defect this pins?** **No test proves it.** There is no
self-test for this gate. Its proof of life is that it finds zero hits, which is
indistinguishable from a broken regex — `new RegExp(\`\b${o.prop}\b\`)` (`:145`) is built from
a literal that a typo would silently neuter. A one-line fixture (a temp file containing the prop,
asserted to produce a hit) would pin it; nothing like it exists.

**⚠️ Redundant traversal.** `:134-135` re-`walk`s both roots and re-reads every file already read
at `:90-96`. Cost only, but it means adding a root to `ROOTS` is safe while adding a *second*
`OWNED`-style class invites a third full pass.

**⛔ Q7 — the OTHER half of the same asymmetry is now conspicuously ungated, and it has six live
sites.** `a11y.ts:156` states the rule symmetrically: *"a live region alone is silence on the
phone the app ships on, and an `announce()` alone is silence in every browser."* This change
instruments only the first sentence. Bare `announce(…)` calls with no live region ship at
`app/(tabs)/index.tsx:958`, `app/(tabs)/index.tsx:1063`, `app/cushion-forecast.tsx:33`,
`app/demo.tsx:76`, `app/schedule/[id].tsx:26`, `components/plan/TutorialOverlay.tsx:57`. Several
are route-entry announcements where a live region has no obvious host, so some may be deliberate
— but nothing in the repo records which, and no gate distinguishes them. The gate's own
justification (*"the rule is ownership"*, `:120`) applies to both directions and was applied to
one.

**⚠️ Also unchecked: the SPREAD.** `useLiveAnnouncement` returns props that must be spread onto a
host (`a11y.ts:167-175`). Calling the hook and dropping the return value leaves iOS speaking and
web silent — the exact failure inverted — and passes every gate. Both current call sites do spread
it; nothing enforces that they keep doing so.

---
## A5 — `apps/rn/tests/shots/p6.8-matrix.shot.ts` (+237)

Five distinguishable changes; a verdict per change.

### A5.1 — `expect.soft(...)` in every `catch` (`:391`, `:437`, `:459`, `:507`, `:600`)

### Verdict: `SOUND-UNPINNED`

`expect.soft(<non-empty string>, msg).toBeNull()` always fails, is recorded, does not abort, and
makes the run exit non-zero. Mechanically correct, and the soft-not-throw reasoning at `:33-36` is
right for the text-scale block (`:487-509`), which loops surfaces inside one test.

**⚠️ The failure Playwright prints is `Expected: null / Received: 'phone/light/today'`.** The
underlying `e.message` goes only to `console.log` (`:390`, `:436`, …). In a report or on CI the
cause is not in the failure; only the coordinates are.

**⚠️ It changes nothing about who runs it.** `apps/rn/playwright.shots.config.ts` is invoked by
`shots:demo` only; that script is in neither `lint:rn` nor `validate:release:rn`
(`package.json:42,47`) nor any workflow step (`.github/workflows/web-e2e.yml:70-140`). The config
docblock states the exclusion deliberately (*"putting it in the gate would spend ~50s of every
`validate:release:rn` on screenshots nobody is reading"*). So *"still exits 1"* (`:35`) is true of
a hand-run command. Reasonable by design; recorded plainly because the header now reads like a gate.

---

### A5.2 — `settle()` gains a `chart-skeleton` assertion (`:357-360`)

### Verdict: `DEFECT` — it destroys the frames `expect.soft` was added to preserve

**Q1/Q3 — the assertion itself is well-founded.** `chart-skeleton` is a real, live testID:
`ChartSkeleton.tsx:32` exports it and both render branches set it (`:44`, `:52`); it is the
Suspense `fallback` in all five `*Canvas.web.tsx` wrappers (`AllocationBarCanvas.web.tsx:16`,
`TrajectoryCanvas.web.tsx:20`, `CashRunwayCanvas.web.tsx:19`, `CushionBarCanvas.web.tsx:15`,
`JourneyRingCanvas.web.tsx:15`). So `toHaveCount(0)` is not vacuous, and the timer-then-absence
ordering argued at `:348-352` is the right guard against the absence-passes-on-a-blank-page trap. OK.

**⛔ But `settle()` is called INSIDE each `try`, before `shot()`.** Route `:384-386`, sheet
`:432-434`, state `:454-455`, text-scale `:487-501`, expanded `:596-598` all read
`await settle(page); … await shot(...)`. Before this change `settle` could not throw, so a frame was
always produced. Now a chart that has not resolved within 15 s **throws, the frame is never taken,
and the surface is logged `UNREACHED`.** The header's justification for `expect.soft` is *"Soft
keeps every frame this run can produce"* (`:35`); the change 20 lines below actively removes frames.
Neither comment acknowledges the other. A blank-chart frame is bad evidence, but converting it to
*no* evidence is a different decision than the one documented.

**⛔ And it can kill the text-scale test outright — the exact failure `soft` exists to prevent.**
`:484` loops all 10 `SURFACES` inside ONE test, and the config `timeout` is `180_000`
(`playwright.shots.config.ts:21`). Per surface the fixed cost is ~1.8 s settle + 0.45 s + a reseed
navigation + a screenshot. Each surface whose chart stalls adds **up to 15 s** on top. Four stalled
surfaces is roughly +60 s — and the condition the docblock itself reports is *"with four browsers
competing on a 4-core box, 10/10 blank"* (`:344-345`), i.e. the loaded case is precisely when
several stall at once. Blowing the 180 s test timeout costs every remaining surface its frame,
silently, which is what `:33-35` was written to make impossible.

**Q5 — nothing pins it.** `ChartSkeleton.tsx:28-30` says *"Do not remove or rename without changing
`p6.8-matrix.shot.ts`. Losing it does not fail a build"* — correctly identifying that the coupling
is unenforced. A renamed testID silently returns `settle` to a bare 1.8 s timer and the matrix to
timing-dependent frames. No gate connects the two files.

**⚠️ Orphaned docblock.** `:322-335` (the 700 ms / `CountUp` rationale) is now a docblock followed
immediately by a second docblock (`:336-356`); only the latter attaches to `settle`. The first is
stranded prose about a constant it no longer documents.

---

### A5.3 — `/history` gains `seedOver: { cycleHistory: … }` (`:140-165`)

### Verdict: `REGRESSION` — the EMPTY history branch now has zero frames in the matrix

**Q1 — the seed itself is correct.** `PayCycleSnapshot` requires `cycleEndDate`,
`totalDebtBalance`, `totalPaidThisCycle`, `completedRecommendedActions`, `payoffStrategy`
(`packages/core/storage/debtPlannerStorage.ts:200-216`) — the fixture supplies exactly those.
Balances descend 5000 → 2440, so `selectHistoryRows`'s `debtDelta` is negative
(`historySelectors.ts:46`) and `selectHistorySummary`'s `paidDown` is 2560 (`:27`). The docblock's
claims about what renders are accurate.

**⛔ The STATES loop cannot clear it.** `p6.8-matrix.shot.ts:452`:
```ts
await reseed(page, seed(theme, { ...(s.seedOver ?? {}), ...STATES[stateName] }), s.goto);
```
`STATES.empty` is `{ debts: [], requiredExpenses: [], goals: [], livingExpenses: [] }` (`:73`). It
has **no `cycleHistory` key**, so the spread cannot override the surface's `seedOver`, and
`state-history-empty` in both themes now hydrates with five cycles. `history.tsx:54` branches on
`rows.length === 0`, so `<EmptyHistory>` (`history.tsx:62`) appears in **no frame of the matrix at
all** — the ten default frames and the two state frames are now twelve pictures of the *populated*
design. That is the identical defect this hunk's own docblock says it is fixing (`:143-146`:
*"twelve pictures of one design"*), inverted.

`/living-expenses` is safe only by luck: `STATES.empty` happens to list `livingExpenses: []`
(`:73`), so its override works. The fix for `/history` is one key — `cycleHistory: []` in
`STATES.empty` — and it was not made.

**⛔ The `/living-expenses` comment now contradicts the code 15 lines above it.** `:171-173` still
reads *"`/history` has the SAME defect and is NOT fixed here … Filed to P6.8.9.5 rather than guessed
at."* `/history` **is** fixed here, at `:152-164`, in the same commit range. And the reason given —
*"its rows come through `selectHistoryRows` off cycle records, not off a plain array"* — is
contradicted by the new history docblock at `:147-149`, which calls that deferral *"overcautious"*
and notes `cycleHistory` **is** a plain array. Two live comments in one file asserting opposite
facts about the same route.

---

### A5.4 — `coachMarksSeen` seeded in the SHEET block (`:408-428`)

### Verdict: `SOUND` mechanism, `DEFECT` in the documentation shipped with it

**Q1 — the prefs merge is correct, and I checked the trap it could have walked into.** `seed()`
destructures `prefs` out of `over` and re-merges it *after* its own defaults
(`p6.8-matrix.shot.ts:66-67`), so `themeMode: theme` survives — every sheet frame is still in the
theme its name claims. The block additionally spreads `over.prefs` (`:425`) before adding
`coachMarksSeen`, so a sheet with its own prefs is not clobbered. No theme regression.

**⛔ The EXPANDED block's header states the opposite of the sheet block's, and both are new.**
- `:528-529`: *"`coachMarksSeen` is seeded here **and nowhere else in this file**: the mark's
  overlay **intercepts pointer events**, so without it this recipe would time out rather than click."*
- `:412-414`: *"The mark does **NOT** intercept: `coach-marks.spec.ts:89` asserts 'the marked control
  stays live — a hint is not a modal' … So the first guess here (pointer interception) was **wrong**."*

I verified the citation: `coach-marks.spec.ts:89` is exactly that test, and lines 29-37 of that file
document the flow-layout artifact. **`:412-414` is right; `:528-529` is wrong on both of its
claims** — it is seeded in two places (`:425` and `:588`), and the overlay does not intercept. A
reader debugging a sheet recipe meets the false explanation first, because it is the one attached to
the block that carries the workaround without justifying it.

**⚠️ Stale count in the same comment block:** `:520-521` says *"all **226** frames photograph the
card at rest"* while the file header at `:30` — corrected in the same range — says *"The true size
was **230**."* The correction did not propagate 490 lines down.

**Q7 — newly possible.** Suppressing all three coach marks means the sheet frames now show a layout
**no first-run user sees**. `:417-420` argues that is fine because the mark has its own pinned frames
at `capture-ref/phase35/<theme>/coach-payoff-schedule.png` — true for `payoff-schedule`; I found no
equivalent claim for `debt-row-actions` or `trajectory-scrub`, which the same array suppresses.
Nothing states where those two are photographed.

---

### A5.5 — the `EXPANDED` block and `DIVERGENT` (`:517-604`)

### Verdict: `SOUND-UNPINNED`, with one duplication defect

**Q3 — every locator resolves against real source.** `strategy-compare-toggle`
(`TrajectoryChart.tsx:587`), `strategy-compare-takeaway` (`StrategyCompare.tsx:60`) and the role
name `/What if you paid extra/i` (`TrajectoryChart.tsx:570`, an `accessibilityLabel`) all exist. The
two disclosures are **sibling** `Pressable`s (`TrajectoryChart.tsx:566-594`), so
`strategy-compare-full` clicking only the compare toggle without opening what-if is correct.

**⛔ `DIVERGENT` is a second, byte-identical copy of `STATES.divergent`.** `:85-90` and `:539-544`
declare the same two debts twice; `STATES.divergent` was available by name. This repo names that
exact hazard in its own words — `apps/rn/src/theme/colors.ts:100-101`: *"a hand-written rgb triple
beside a hex token is a second copy of the same colour that no gate compares, and a contrast fix
moves one of them."* Editing one APR here moves the expanded frames and leaves
`state-progress-divergent` behind, or the reverse.

**⚠️ And `STATES.divergent` on `progress` (`:135`) photographs a state whose distinguishing property
is invisible.** `compareOpen` defaults to `false` and the `[D59]` comment at `TrajectoryChart.tsx:579-582`
says collapsed-by-default is deliberate, so `state-progress-divergent` is a resting card with two
debts. The reason the state was created — *"the portfolio where the two strategies disagree … C7's
whole surface has nothing to say"* (`:81-84`) — is served only by the EXPANDED frames, which use the
other copy.

**⚠️ The EXPANDED seed drops `seedOver.prefs`.** `:585-589` writes `prefs: { coachMarksSeen: [...] }`
with no `...(s.seedOver.prefs ?? {})` spread — unlike the sheet block at `:425`, written carefully
for exactly this. `DIVERGENT` carries no `prefs`, so it is latent, not live.

**⚠️ Locator fragility, stated but not mitigated.** `:550-552` justifies using an
`accessibilityLabel` rather than adding a `testID` (*"a source edit owes its own
`validate:release:rn`"*). That label is user-visible copy (`TrajectoryChart.tsx:570,573`), so a copy
sweep renaming it turns this recipe into a silent `UNREACHED`. Its sibling on the same card has a
`testID`; this one does not.

**⚠️ Could not determine — the framing claim.** `:571-573` asserts that
`scrollIntoView({ block: 'center' })` on `strategy-compare-takeaway` "actually puts the whole
comparison in the frame". The takeaway is the last element of `StrategyCompare`
(`StrategyCompare.tsx:60`); whether centring it keeps the two column headers above the fold at
402x874 depends on rendered height and is observable only by running the shooter, which this audit
does not do. **Unverified.**

**Q5 — nothing about these frames is asserted.** By design (`:22-24`) — appearance is judged by
looking, and the only assertion is reachability. Recorded so no later step reads "the C7 comparison
is covered" as "the C7 comparison is checked".

---

## Summary

| # | subject | verdict |
|---|---|---|
| A1 | `check-apostrophes.ts` Swift scan | `DEFECT` |
| A2a | `check-contrast.ts` literal-ink scan | `DEFECT` |
| A2b | `check-contrast.ts` `border.strong` exclusion | `SOUND-UNPINNED` |
| A3 | `check-copy-owners.ts` | `WEAK-TEST` |
| A4 | `check-native-a11y-props.ts` `OWNED` | `DEFECT` |
| A5.1 | shot matrix — `expect.soft` | `SOUND-UNPINNED` |
| A5.2 | shot matrix — `settle()` skeleton wait | `DEFECT` |
| A5.3 | shot matrix — `/history` seed | `REGRESSION` |
| A5.4 | shot matrix — sheet `coachMarksSeen` | `SOUND` + doc `DEFECT` |
| A5.5 | shot matrix — `EXPANDED` / `DIVERGENT` | `SOUND-UNPINNED` |

**Registration is the one thing that is unambiguously right**: all four gates run in `lint:rn` →
`validate:release:rn` → `.github/workflows/web-e2e.yml:92`, and `lint:copy-owners` was added to the
chain in the same commit that created it (`package.json:29,42`).

**The cross-cutting pattern in this cluster:** four of the five files reject a documented method and
then re-adopt it one layer down. `check-apostrophes.ts` explains at `:19-22` why line scanning is
wrong and then line-scans Swift; `check-copy-owners.ts` argues literals are the wrong instrument and
then greps for a literal; `check-contrast.ts` insists an exemption must be re-proved every run and
then adds one that never is; the shot matrix adds `expect.soft` to stop losing frames and adds a
15 s throw that loses them. **Every one of these is a correct diagnosis applied to the previous
instance and not to the new one.**

**And nothing in this cluster has a self-test.** Four gates, zero fixtures. Each one's only proof of
life is that it currently finds nothing — which is what a broken walker also reports.
