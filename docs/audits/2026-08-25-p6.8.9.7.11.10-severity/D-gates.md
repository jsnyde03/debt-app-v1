# Cluster D — THE GATES AND THE EVIDENCE INSTRUMENTS

**Surface:** every script `lint:rn` runs (`package.json:41`), `apps/rn/tests/shots/p6.8-matrix.shot.ts`,
and the `validate:release:rn` chain (`package.json:47`).
**Job 1 base** `4877d90` → **head** `01fc7ec`. Read-only. **No gate or suite was executed** — every claim
below is from reading the source, and where a red/green outcome is *inferred* rather than observed it says so.

Severity vocabulary is `BRIEF.md`'s. Calibration applied throughout: **a gate that cannot catch the class it
exists for is `major`**; a gate whose prose is imprecise while its matching is correct is `minor` and is
therefore **not reported** in Job 2.

---

# JOB 1 — verify the fixes

## J1-1 · `check-native-a11y-props.ts:186` — the bare-`announce()` detector taught the second spelling

**The finding.** [P6.8.9.7.11.9 · A-6, `DEFECT`] The detector matched `announce\s*\(` only, so
`AccessibilityInfo.announceForAccessibility(msg)` — *the* direct spelling, and the one the failure text at
`:191` names as the mechanism — walked past the gate.

**1 — is the behaviour gone?** For the spelling the finding named, yes.
`scripts/check-native-a11y-props.ts:186` now reads
`stripped.match(/\b(announce|announceForAccessibility)\s*\(/g)`. I traced the alternation by hand against
`AccessibilityInfo.announceForAccessibility(msg)`: `\b` holds at the `.`→`a` boundary; the first branch
consumes `announce`, `\s*` consumes nothing, `\(` meets `F` and fails; the engine backtracks to the second
branch, which consumes the whole identifier and then matches `(`. **One match, correctly counted.** The
aliased-import spelling the finding also mentioned (`import { announce as say }`) is still invisible, which
the fix never claimed to address.

**2 — what does it now do to inputs the finding never mentioned?** Nothing harmful, and I checked the two
ways this could have over-matched:
- **No new hit at head.** Every `announceForAccessibility` occurrence in the two `ROOTS` (`:22`) outside the
  excluded owner file is inside a comment and is blanked by `stripComments` (`:83-87`) before the match runs:
  `apps/rn/src/store/tutorialPath.test.ts:87,117`, `apps/rn/tests/e2e/affordability.spec.ts:63`,
  `apps/rn/tests/e2e/tutorial-invite.spec.ts:279`. The only live call,
  `apps/rn/src/utils/a11y.ts:144`, is under the `rel !== 'apps/rn/src/utils/a11y.ts'` skip at `:178`.
  So `BARE_ANNOUNCE_BASELINE` (`:147-153`) is still exactly right and the gate is **inferred green** at head.
- **No double-counting.** A single `announceForAccessibility(` yields one match, not two, because the
  alternation resolves at one start position and `lastIndex` advances past the whole identifier. A file that
  wrote both spellings would count 2, which is the intended arithmetic.
- **No adjacent-identifier over-match.** `\b` before the branch rules out `reannounce(`; case-sensitivity
  rules out `stepAnnouncement(` at `apps/rn/src/components/plan/TutorialOverlay.tsx:57`, whose real
  `announce(` on the same line is the one that is (correctly) counted.

**3 — would anything catch it un-fixing?** **No.** No test anywhere exercises any script in `scripts/` —
I searched every `*.test.ts` / `*.spec.ts` in the repo for a reference to `scripts/check-` and found none,
and no `scripts/**` file is imported by a test. Reverting `:186` to the old single-branch regex would produce
an identical green run and an identical summary line at `:240-243`.

### `VERDICT: CLOSED-UNPINNED`

⚠️ **But see J2-1 below** — the fix teaches the gate one of the two spellings that were missing, and the
one it still does not read is the one written in this repo today.

---

## J1-2 · `storeActions.test.ts:484-516` — the finale→beat arm now actually reaches a beat

**The finding.** [P6.8.9.7.11.9 · E-1, `WEAK-TEST`] The block claimed to be the only arm guarding
*a later beat must not displace an unconsumed finale*, but its scenario produced **finale → finale**:
after clearing the only debt, adding **one** debt and clearing it leaves `liveAfter.length === 0`, so
`payoffCelebration.ts:46` returns a second `finale`. The block therefore passed under the very loose guard
its docblock named.

**1 — is the behaviour gone? Yes, and I walked the state machine rather than trusting the comment.**
`storeActions.test.ts:497-499` adds `d2` (`balance: 3000`) alongside `d1`. At
`storeActions.test.ts:500` (`updateDebt('d1', { balance: 0 })`) the real transform sees
`before.debts = [d0@0, d1@900, d2@3000]` → `liveBefore = [d1, d2]` (`payoffCelebration.ts:28`),
`crossed = [d1]` (`:35-40`), `liveAfter = [d2]` → `:46` is skipped and `:52-58` returns
**`{ kind: 'beat' }`**. Against `store.ts:64`
(`if (next.pendingPayoff && !(payoff.kind === 'finale' && next.pendingPayoff.kind !== 'finale')) return next`)
that evaluates `finale && !(false)` → early return → identity preserved, assert passes. Against the loose
form the docblock names (`payoff.kind !== next.pendingPayoff.kind`): `'beat' !== 'finale'` → `!true` → false
→ **no early return, `store.ts:65` overwrites the finale with the beat**, `pendingPayoff === finale` fails.
**The block now discriminates the defect it names.** The narrated scenario in the docblock
(`:475-479`) was corrected to match.

**2 — what does it do to inputs the block never mentioned?** It is purely additive and does not disturb the
two blocks above it (`storeActions.test.ts:425-441` beat→finale upgrade, `:448-466` beat→beat preserve) —
those are byte-identical in the diff. The two intervening `addDebt` calls cannot themselves stamp anything:
`addDebt` is not one of `withPayoffCelebration`'s call sites (`store.ts:428, 437, 451, 619`), and even if it were, `d1`'s add sees
`liveBefore = []` → `payoffCelebration.ts:29` returns `null`, and `d2`'s add sees `crossed = []` → `:41`
returns `null`. No hidden third transition was introduced.

**3 — would anything catch it un-fixing?** The assert at `:512-515` is itself the instrument, and it now
fails on the original defect (shown above). Removing `d2` again would silently return the block to
finale→finale — **and the new control at `:503-511` would not notice**, because it calls `detectPayoff` on a
hand-built pair of arrays rather than on the store's own `before`/`after`. That is a `minor` maintenance
hazard, not a defect: for today's data the proxy and the real transition are arithmetically identical
(`d0@0` is filtered out by `payoffCelebration.ts:28` and `:45` either way), and the partial objects cast at
`:505-506` survive `rankDebts` (`payoffSelectors.ts:49-51` reads only `balance`/`apr`).

### `VERDICT: CLOSED`

---

## J1-3 · `check-comment-convention.ts` — **no fix was made, and none was owed**

`git diff 4877d90..01fc7ec -- scripts/check-comment-convention.ts` is **empty**; the file is byte-identical
at both ends. The prior round's verdict on it was `A-7 · SOUND`, so there was no finding to close.

I did check the question that actually matters here, because the fix commit wrote new prose *into a root this
gate had just been widened to walk* (`check-comment-convention.ts:38-43` now includes `scripts`): **does
`01fc7ec` trip the gate it did not change?** I tested the new docblock at
`check-native-a11y-props.ts:179-185` and the new docblock at `storeActions.test.ts:468-483` against all
eleven `META` patterns (`:47-59`) and all three `COUNTS` patterns (`:69-73`) by hand. **No match.** The two
near-misses are `check-native-a11y-props.ts:183` (*"the single direct call today"* — `single` is not in the
number alternation) and `storeActions.test.ts:475` (*"NEEDS TWO NEW DEBTS"* — `TWO` is present in
`COUNTS[0]`'s alternation but is preceded by `NEEDS`, not by one of `all|every|both|only|the|at|is|to`, and
is followed by `NEW`, not by one of the five nouns). ⚠️ Inferred from reading the regexes, not from running
the gate.

### `VERDICT: NOT-A-DEFECT` (no change to verify)

---

# JOB 2 — the major+ sweep

## J2-1 · `check-native-a11y-props.ts:186` — the fixed regex still cannot see the spelling this repo actually writes — **`major`**

**Consequence:** a new screen announces a state change to VoiceOver only, every react-native-web user
(including the whole Playwright suite's platform and the web export) hears nothing, and
`npm run lint:a11y-props` stays green.

`scripts/check-native-a11y-props.ts:186` matches
`/\b(announce|announceForAccessibility)\s*\(/`. Between the identifier and the `(` it allows only
whitespace. **The one call to this API that exists in the repo is written with an optional call:**

```
apps/rn/src/utils/a11y.ts:144    AccessibilityInfo.announceForAccessibility?.(message);
```

`?.` is neither `\s` nor `(`, so **`announceForAccessibility?.(…)` does not match, and neither does
`announce?.(…)`.** The gate is blind to the exact form its own owner file demonstrates — which is the form
a new author copies, because `a11y.ts:144` is where anyone goes to see how this app calls the API.

**Why this is `major` and not the `minor` residue of J1-1.** This is the same failure the fix was written
to repair (*"reads one spelling of the thing it polices"*), one character over, and the class is not covered
anywhere else: `apps/rn/eslint.config.mjs:36-49` restricts only
`accessibilityElementsHidden|importantForAccessibility|accessibilityState|accessibilityValue`, with no rule
for any announcement spelling, and `apps/rn/src/utils/a11y.ts:160-162` states plainly that the script is the
sibling instrument for this asymmetry. **The defect it would miss:** a new file writing
`AccessibilityInfo.announceForAccessibility?.(msg)` — the copy-the-owner-file spelling — ships an
iOS-only announcement with no live region, and every browser is silent.

⚠️ Inferred from reading the regex, not from executing the gate. The alternation itself is correct for the
non-optional spelling — see J1-1.

---

## J2-2 · `p6.8-matrix.shot.ts` — the `ready` guard is on 1 surface of 10 and in 1 block of 5, while `:318` says every surface carries it — **`major`**

**Consequence:** an audit lens reads `textscale-2x-onboarding.png` as evidence about the onboarding screen
when the file is a photograph of Today, and the defect on the screen it thinks it examined is never found.

The instrument's stated job is its own completeness — `apps/rn/tests/shots/p6.8-matrix.shot.ts:23-24`:
*"What it DOES assert is its own completeness: every recipe that fails to reach its subject prints
`⛔ UNREACHED` and fails the run softly."* The known failure mode it cannot detect that way is the one at
`:303-317`: **a recipe that reaches a page and photographs the WRONG screen**, which produced ten plausible
`onboarding.png` files that four visual lenses read as evidence, and which the `⛔ UNREACHED` path cannot
see because nothing threw. `ready` (`:129`) is the answer to that, and `:317-318` asserts *"That is why
every surface now carries a `ready` assertion."*

**Measured against the file:**
- `ready` is set on **one** of the eleven entries in `SURFACES` — `onboarding` at `:220`. `today`,
  `money-debts`, `progress`, `more`, `history`, `living-expenses`, `cushion-forecast`, `paywall`,
  `not-found` (`:137-223`) have none.
- `s.ready` is consulted in **one** of the five shooting blocks — the route block at `:391`. The sheets
  block (`:408-450`), the states block (`:453-495`), the text-scale block (`:509-566`) and the expanded
  block (`:639-666`) never call it.

⚡ **The concrete hole this leaves.** The text-scale block loops the same `SURFACES` array
(`:536`) across two scales × two viewports × two themes and never calls `s.ready` — so **eight
`textscale-{1.35,2}x-onboarding.png` frames are shot with the guard that exists for that exact route
switched off**, on the one route whose seed is documented at `:197-206` as being silently overruled
(`runMigrations` → `inferOnboarding` promotes `onboardingComplete` to `true` whatever the blob says).
A frame that photographs Today under the name `onboarding` exits 0, prints `✓`, and is indistinguishable
from a correct one.

**Why `major`, not `minor`.** The prose at `:318` is wrong, which on its own is `minor` — but it is
load-bearing prose: it is the sentence that tells the next author the class is closed and stops them adding
`ready` to a new surface. And the instrument genuinely cannot catch the class it names in its own header.
`docs/audits/2026-08-25-p6.8.9.7.11.9-reverification/A-instruments.md:799-802` recorded the ratio as an
"observation that is not a verdict"; **no round has rated it, and by this brief's calibration it is `major`.**

⚠️ Undetermined: whether any current `textscale-*-onboarding.png` frame is in fact Today. The frames are
gitignored (`:50`) and this pass shot nothing. **Only observable by running `npm run shots:demo` and
looking.**

---

## J2-3 · `check-destructive-writes.ts:64` — the allow-list is per FILE, so a second `importStore` call inside a sanctioned file is unpoliced forever — **`major`**

**Consequence:** a new unconfirmed code path that replaces the user's entire portfolio can be added inside
`_layout.tsx` or `use-cloud-backup.ts` and `npm run lint:destructive` stays green, which is exactly the
arrival-without-review this gate was built to make impossible.

`scripts/check-destructive-writes.ts:56-67` walks every call, then at `:64` does
`if (rel in ALLOWED) return;` — **file-level, before the call is ever examined.** Six files are sanctioned
(`:28-39`), each with a reason that describes **one specific call site**: *"the fresh-install iCloud
restore OFFER"* for `apps/rn/src/app/_layout.tsx`, *"the iCloud restore (P6.3.3.5) … behind an in-sheet
two-tap confirm"* for `apps/rn/src/hooks/use-cloud-backup.ts`. Nothing binds the exemption to that call.
A second, unguarded `importStore(blob)` fifty lines away in the same file is admitted silently.

The gate's own header (`:9-10`) states the class as *"a new caller of a wholesale overwrite can be added
without anyone noticing it is one"* and (`:13-14`) *"an allow-list tells you WHICH file appeared, which is
the question a reviewer actually has."* **A second call site in an already-listed file is a new caller that
makes no file appear.** The sibling gate in this same cluster argues the opposite discipline explicitly —
`scripts/check-native-a11y-props.ts:52-53`: *"Per-PROP rather than per-file deliberately: exempting a whole
file to permit one prop silently un-gates the other six in it."* `importStore` is the most destructive
operation in the app (`apps/rn/src/store/store.ts:799`), and it is the one place the weaker discipline is used.

**Latent today, not live.** I grepped every `importStore` reference in `apps/rn/src`: each of the six
sanctioned files contains exactly one call — `_layout.tsx:228`, `DataResetScreen.tsx:92`,
`BackupSheets.tsx:117`, `use-cloud-backup.ts:159`, `persistence.ts:203`, `store.ts:799` — so the gate is
correct at head. The staleness check at `:82-95` also only asks whether the file still contains *a* call,
so it cannot notice the count changing either.

---

## J2-4 · `strings-inventory.ts:514` — `--gate` mode throws away the instrument's own self-check verdict — **`major`**

**Consequence:** the string inventory can silently mis-bucket user-facing copy as `unclassified`, which
removes it from the duplicate-copy gate's input, and `npm run lint:copy` prints `✅` and exits 0 while
saying in the same output that its own labelling is broken.

`scripts/strings-inventory.ts:454-466` is a self-check the file explains in exactly these terms:
*"An audit instrument that is silently wrong is worse than none, because its output is trusted."* When an
`origin` label contains whitespace or exceeds 48 characters it prints an error and sets
`process.exitCode = 1` at `scripts/strings-inventory.ts:465`.

`lint:copy` runs this file as `strings-inventory.ts --gate` (`package.json:23`). The `--gate` branch ends at
`scripts/strings-inventory.ts:514` with `process.exit(0)`.

**`process.exit(0)` sets the exit code explicitly and overrides `process.exitCode`,** so the self-check's
verdict is discarded in the one mode that gates anything. In report mode (`audit:strings`) the script falls
off the end and the `1` survives — the failure exists only where it matters.

**Why this blinds the gate rather than merely losing a warning.** The bad-origin condition is a symptom of
`calleeLabel` (`:235-267`) breaking, and `origin` is what decides the bucket:
`scripts/strings-inventory.ts:412` —
`const bucket = COPY_ORIGINS.has(origin) ? 'copy' : TECHNICAL_ORIGINS.has(origin) ? 'technical' : 'unclassified';`
The gate's finding set is filtered on that bucket at `:492` (`es.some((e) => e.bucket === 'copy')`). A broken
label therefore moves copy strings out of `copy` and out of `gateFindings` in one step. **The defect it
would miss:** a new user-facing phrase duplicated across two files — the class
`duplicate-copy-baseline.json` exists to stop growing — disappears from the gate's view and `lint:copy`
stays green. The file's own comment at `:455-456` records that this pass *"introduced two bugs in them that
only a human reading the generated file caught"*, one of which was *"a SECOND unnormalised label
producer"* — i.e. the exact condition, already observed once.

⚠️ Inferred from reading, not from executing: I did not run the script, and I did not find an input that
currently produces a bad origin. The defect is in the exit path, and it is unconditional.

---

## J2-5 · `check-audit-closure.ts:129` — the P6.8 traceability count treats the audit's OWN synthesis as a closure record, so the number the phase exits on is 12 short — **`major`**

**Consequence:** twelve blocker/major findings from the P6.8 finish sweep read as "traceable" purely
because their id is printed in the audit that raised them, so P6.8.9's mechanical exit criterion reports
39 outstanding when 51 have no closure record anywhere — and the gate is chartered to flip to
`process.exit(1)` the moment that number reaches zero.

The [D37] half of this gate builds its recorded set from three closure records only —
`scripts/check-audit-closure.ts:44-48`: `docs/DEBT_ELEVATION_PLAN.md`, `docs/DEBT_ELEVATION_LOG.md`,
`findings/L9-refutations.md` — and the file argues at `:181-184` that mixing the *"has anyone written this
id down"* question into the *"is this closure traceable"* question is precisely what must not happen:
*"Two questions, two strictnesses, deliberately not merged."*

The P6.8 half does exactly that. `scripts/check-audit-closure.ts:129` adds a fourth source —
`[...SOURCES, join(REPO_ROOT, 'docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md')]` — and `:130-131` then
adds **every** `[A-Z]{1,2}\d?-\d+` token found in it to `p68Recorded`. `SYNTHESIS.md` is the finish sweep's
own summary and it names its findings in its section headings —
`docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md:72` (`*(M1-5 · R2 CONFIRMED, strengthened)*`) and `:79`
(`*(M1-1/2/6 · R2)*`). The docstring at `:34-39` justifies the inclusion as an **alias map** (*"`C5` is
M2-9, `C6` is M4-8"*), but the code does not use it as a map: it treats a bare mention as a closure.

**Measured, by re-implementing the file's own parser over the same inputs** (`slices/*.md` headings
`^#{2,4} [A-Z]{1,2}\d?-\d+[a-z]?` plus a mid-line `\*\*Severity:\*\*` capture, slash-lists expanded):

| | |
|---|---|
| high+ findings parsed from `slices/` | **87** — matches the figure the file itself records at `:117` |
| in NO ledger, as the gate counts it (plan · log · refutations · SYNTHESIS) | **39** |
| in no *closure* ledger (plan · log · refutations only) | **51** |
| **counted traceable on SYNTHESIS alone** | **12** — `M1-1, M1-2, M1-5, M1-6, M2-1, M2-2, M2-5, M2-6, O1-9, V1-0, V1-1, V4-7` |

Spot-checked three: `M1-1`, `M1-2` and `M1-5` appear zero times in `DEBT_ELEVATION_PLAN.md` and zero times
in `DEBT_ELEVATION_LOG.md`, and only in the two SYNTHESIS headings quoted above.

**Why `major` and not `minor`.** The gate is report-only today (`:152-159`), so it produces no false red or
green — but the number it prints **is** the deliverable: `:145-148` states it exists to give P6.8.9 *"a
mechanical exit criterion"* in place of reading a 60-row table by eye. A count that is 12 short of the
honest figure is the failure this same file records as its own headline at `:117-118`: *"an instrument that
under-reports is worse than no instrument, because it is believed."* And the flip to gating at `:150-151`
is conditioned on this count reaching zero, so the weakness is inherited by the gate the moment it becomes
one.

⚠️ Reproduced with a hand-written emulation of the parser, not by executing the gate (the brief forbids
running it). The 87 figure matching the file's own recorded count is the control that the emulation is
faithful; the 39/51/12 split follows from the same pass.

---

## Swept and found clean at the blocker/major bar

Read in full, no `blocker` or `major` found:

- `scripts/check-comment-convention.ts` — `META`/`COUNTS` traced against both new docblocks in `01fc7ec`
  and against the two new roots; matching is correct for the forms it claims, and `:22-23` states the
  approximation rather than hiding it.
- `scripts/check-local-dates.ts` — I grepped every `toISOString` / `getUTC` / `Date.UTC` / `toJSON` site in
  `packages/core` and `apps/rn/src`. Every one is an **instant** (`backup.ts:95` `exportedAt`,
  `use-notification-sync.ts:60`, `cloudBackup/service.ts:66`, `createCloudBackupProvider.ios.ts:90`), not a
  calendar date — so the Sydney/Auckland class the gate exists for has no live site it is currently missing.
  The gate's own reach limits (line-based; a `getUTCFullYear()` composition unmatched) are stated at `:35-36`.
- `scripts/check-money-format.ts` — the JSX `$` + `{expr}` case is handled through the TypeScript AST
  (`:100-121`), which is the one form a regex cannot see, and the five text patterns cover the written
  shapes. Whole-file `EXEMPT` entries (`:33-37`) are three, each with a reason.
- `scripts/check-a11y-collapse.ts` — AST-based, and `:17-23` enumerates exactly what a green does not mean.
- `scripts/check-committed-secrets.ts` — the `:79` pre-filter is a strict superset of all four patterns
  (each requires one of the four literal substrings), so it cannot cause a miss for the shapes declared.
- `scripts/check-rn-style-divergence.ts` — side-specific spellings and same-file numeric consts are both
  resolved, and `:110-111` states that an unresolvable identifier is deliberately not flagged.
- `scripts/check-copy-owners.ts`, `scripts/check-icon-glyphs.ts`, `scripts/check-destructive-writes.ts`
  (staleness half), `scripts/check-sandbox-writes.ts` (staleness half), `scripts/check-apostrophes.ts`
  (both classes report before either exits) — each carries a stale-entry check, which is the failure mode an
  allow-list gate otherwise decays into.
- `scripts/gateSources.ts` / `scripts/write-gate-status.ts` — the fingerprint set is an **exclusion** list
  (`:16-20`), `gate-status.json` is deliberately outside it so the record cannot invalidate itself, the
  symlinked `apps/rn/core` is skipped (`:88-93`), and the one accepted residue (`docs/`) is stated at
  `:31-36`. `scripts/check-gate-freshness.ts` being outside `lint:rn` is argued at `:4-10` and is correct —
  a freshness check inside the chain that establishes freshness deadlocks.

## Could not determine

- **Whether any gate actually exits non-zero.** The brief forbids executing them; every red/green claim
  above is from control flow plus a grep proving the matcher does or does not reach a real line.
- **Whether any `textscale-*-onboarding.png` frame is currently a photograph of Today** (J2-2). The frames
  are gitignored and this pass shot nothing; only `npm run shots:demo` plus looking answers it.
- **`scripts/preflight-native-lane.ts`, `scripts/check-maestro-selectors.ts`, `scripts/check-contrast.ts`,
  `scripts/check-type-scale.ts`, `scripts/check-glossary.ts` and `scripts/coverage-split.ts`** were checked
  for reach, exit path and stale-exemption handling but **not** line-by-line against their classes. No
  blocker/major surfaced in what I read; that is not the same as a clean sweep of those six.
