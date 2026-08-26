# S0 re-verification, pass 4 — the instruments (AUDITOR A · jobs ① and ②)

**Pinned:** `613adf2`, branch `v1.7-dev`.
**Surface:** job ① — the one hunk in `scripts/check-audit-closure.ts`. Job ② — the six never-swept S0
gates (`check-gate-freshness`, `check-contrast`, `check-type-scale`, `preflight-native-lane`,
`check-a11y-collapse`, `check-committed-secrets`) and the **baseline-as-cap** class
(`apostrophe-baseline.json`, `duplicate-copy-baseline.json`, `webkit-flex-controls-baseline.json`).
**Bar:** blocker + major. `minor` appears only where I am recording that something measured is **not** a
major, so pass 5 does not re-open it.

> **Measurement note.** Every claim below is either a **consumer verdict** (the gate's own `exit` code, or
> the set of ids/lines its own pattern produces) or a value **printed** from a run, never a description of
> an intermediate. The one lift I made — `stripMarkdownCode` + `CLOSES` out of the live file — is echoed
> byte-for-byte in the run log so it can be checked against the source it came from.

---

## Result

**0 blockers · 5 majors.** ⛔ **The count restarts.** Job ① is `CLOSED`; all five majors are job ②, and
**all five are on surfaces no pass had ever swept** — the six never-audited gates and the baseline-as-cap
class the brief named. Nothing on passes 1–3's ratchet moved.

| # | finding | evidence |
|---|---|---|
| 1 | `gate-status.json` is fingerprinted at the **END** of `validate:release:rn`, so a mid-run source edit is recorded as tested — and `check-gate-freshness.ts:67-68` then prints *"the fingerprint does [identify what was tested]"*, which is false in that case | call sites printed; the window is closed only by a rule in `DEBT_ELEVATION_PLAN.md:76-79`, and `write-gate-status.ts:12-14` is the file that says a documentation rule cannot close this class |
| 2 | `lint:secrets` takes the file **list** from git and the file **content** from the working tree, so it prints `committed secrets: none` over a `HEAD` holding a live Sentry DSN — in the state its own remediation text tells you to create | run, both sides printed: `git show HEAD:dsn.ts` carries the DSN, gate exits **0** |
| 3 | `duplicate-copy-baseline.json` holds **16** entries of which **3** are live; each of the other 13 — *"Private by design"*, *"Unlock Premium"*, *"Privacy Policy"* … — is a standing permission to re-duplicate that phrase | plant + control: re-typing `"Private by design"` in a second file → **exit 0** with the real baseline, **exit 1** with the phrase removed from it |
| 4 | `lint:type-scale` treats **any** `allowFontScaling` as a clamp, so an unclamped 40pt figure is reported `ok`; two more shapes never reach the verdict, one of them the shape the docstring claims to cover | 6 plants, `--report` verdicts printed. ⚠️ **latent — 0 live instances**, stated plainly |
| 5 | `lint:lane`'s four flow-ordering assertions sit inside `if (iphoneList.length)`, so a refactor of how the flow paths are spelled deletes them and the gate reports success — 87 → **83** checks, with no floor on the count | plant + control: same defect, **exit 1** with paths intact, **exit 0** after the rename |

---

## Job 1 — the fix, re-verified

### `[closes: THE-ID-HERE]` printed at two spaces on the P6.8 branch — **CLOSED**

**Original finding** (`S0-REVERIFY-3.md:140-146`, attack point 5): the `[D37]` branch prints its
remediation with six spaces of indent, so `stripMarkdownCode`'s `^ {4,}\S` rule blanks it and pasting the
gate's own output into `DEBT_ELEVATION_LOG.md` (a closure `SOURCE`) does not mint a closure. **The P6.8
branch at `:279` (at `1782769`) printed the same token with only TWO spaces**, on the same line as the prose, so pasting
*that* one registered `THE-ID-HERE` in `explicit`. Pass 3 rated the consequence **inert** — `explicit` is
read only as `.has(realId)` — and recorded it so the asymmetry was not mistaken for coverage.

**What the fix did.** `scripts/check-audit-closure.ts:283`, commit `b2a8aac`: the token moved onto its
own line at **six** spaces, matching the `[D37]` branch —

```
`\n  Record it where the closure IS:\n      [closes: THE-ID-HERE]   (e.g. ${p68Untokenised[0]?.id})\n`
```

Four comment lines at `:279-282` record why. The pre-fix line is `git show
1782769:scripts/check-audit-closure.ts` line 279, and I diffed my model of it against the real bytes before
using it.

**Is the original behaviour gone? — YES, measured on the real printed bytes.** I forced the branch by
running a scratch copy of the gate with `MAX_UNTOKENISED = { d37: 99999, p68: 0 }` (scratchpad only; the
repo file was not touched) and captured stderr through `cat -A`, giving the emitted line exactly:

```
  Record it where the closure IS:$
      [closes: THE-ID-HERE]   (e.g. M1-1)$
```

Those bytes, and the pre-fix bytes, were then run through the **live** `stripMarkdownCode` and `CLOSES`
lifted out of the file, pasted into a synthetic markdown host
(`scratchpad/p4a/lift.mjs`, `paste.ts`):

| paste shape | `explicit` after `stripMarkdownCode` |
|---|---|
| **PRE-FIX** P6.8 remediation, bare into prose | ⚠️ `{THE-ID-HERE}` |
| **SHIPPED** P6.8 remediation, bare into prose | ✅ `{}` |
| SHIPPED, inside a ``` ``` ``` fence | ✅ `{}` |
| SHIPPED, under a `- ` bullet | ✅ `{}` |
| SHIPPED, **CRLF** paste | ✅ `{}` |
| `[D37]` branch (unchanged by this commit), bare | ✅ `{}` |

The defect the finding named is gone, and it is gone under CRLF too.

**Preserved?** Yes, and the change cannot over-match: **it edits a template literal, not a matcher.**
`stripMarkdownCode`, `CLOSES`, `p68Recorded`, the caps and both `exit(1)` conditions are byte-identical
across `1782769..613adf2` (the diff is one hunk of four comment lines plus one string). The message still
carries the same four things — the instruction, the placeholder token, the real example id outside the
brackets, and the do-not-raise-the-cap warning — and `npm run lint:closure` is green on this tree:
`55 of 55` · `39 of 87 in no ledger` · `48 of 48` · `62 low-tier, 0 unnamed`.

⚠️ **One thing the fix does not change, and it was already true of the `[D37]` branch it now matches:** the
real id is still printed inside the six-space line, and `p68Recorded` reads the **raw** file, not the
stripped one (`:259-263`). A bare paste therefore still registers `M1-1` as a *mention*. That is the
deliberately-capped mention half pass 1 settled, not a regression — and it is the same before and after.

**Residual, measured, and identical on both branches:** three paste shapes still register the placeholder —
**blockquoted** (`> ` prefix defeats `^ {4,}`), **tab-indented**, and **re-indented to 3 spaces** by an
editor. All three do it to the `[D37]` branch as well, i.e. the fix reached parity with the shape pass 3
accepted as closed rather than leaving the P6.8 branch behind. The consequence is the one pass 3 already
measured and recorded under "Measured, and NOT a defect": `explicit` is consumed only via `.has(realId)`
(6 sites), so a junk id can move nothing but the printed `${explicit.size}` at `:219`. **Not a major, on
pass 3's measurement, which I did not beat and am not re-opening.**

**Pinned?** ⛔ **No — nothing would catch it un-fixing.** `grep -rn "check-audit-closure\|stripMarkdownCode"`
over the whole tree excluding `docs/` and `node_modules` returns **6 hits**, all of them the file itself,
its own docstring, `package.json:28` (`"lint:closure": "tsx scripts/check-audit-closure.ts"`) and one
mention in `scripts/lib/stripCode.ts:127`. **There is no test.** The registered gate `lint:closure` cannot
carry it, for a reason worth stating precisely: **the remediation branch is never executed on a green run**
— it is inside `if (p68Untokenised.length > MAX_UNTOKENISED.p68)`, and the tree prints `48 of 48`, i.e. the
count sits exactly **on** the cap. Reverting the hunk leaves `lint:closure` green.
⚠️ **And the branch is one finding away from firing**, not dead: both caps (`55/55`, `48/48`) are exactly
equal to their current counts, so the next untokenised high+ finding executes this text.
*This is a job-③ GAP, not a job-①/② finding, and it does not restart the count.* The guard it needs, in
one line: *assert that `stripMarkdownCode` applied to the exact string each remediation branch emits yields
no `CLOSES` match* — a unit test over the two template literals, not over the gate's exit code.

**Verdict: `CLOSED` · unpinned.**

---

## Job 2 — sweep for blocker + major

*(findings appended as they are measured)*

### 1. The freshness record is fingerprinted at the END of `validate:release:rn`, so a mid-run source edit is recorded as tested — **major**

**User-facing consequence:** a source file edited during the ~15-minute `validate:release:rn` run is
hashed into `gate-status.json` as though the suites had seen it, and `lint:gate-freshness` then tells the
developer *"the recorded pass still describes this tree"* — so untested code ships behind a green the
instrument minted itself, which is [D49]'s own failure mode arriving through the gate built to close it.

**Mechanism, measured.** `fingerprintSources()` has exactly **two** call sites in the whole tree —
`scripts/check-gate-freshness.ts:45` and `scripts/write-gate-status.ts:59` (grep over `scripts/`, `apps/`,
`packages/`, 5 hits, 2 of them the import lines and 1 the definition at `scripts/gateSources.ts:152`).
`write-gate-status.ts` is the **ninth and last** link of `package.json:50`'s `&&` chain, and `:59` runs
*there* — after `typecheck`, `lint:rn`, `test:stamp`, `test:regression`, `test:app`, `test:scenarios`,
`test:e2e:rn`, `test:e2e:embed` have all finished. **Nothing captures a fingerprint at the start**, so
nothing can compare the two and nothing can even detect afterwards that the tree moved.

**And the gate prints a sentence that is false in exactly that case.** `check-gate-freshness.ts:66-68`:

```
   ⚠️  That pass ran on a DIRTY tree, so its SHA does not identify what was tested.
       The fingerprint does, and it matches — but do not quote the SHA as if it did.
```

The fingerprint identifies **the tree at record time**, not what was tested. Under a mid-run edit those are
different, and the one line the human is told to trust is the one that is wrong.

⚠️ **This is not a new discovery and I am not claiming it as one — but nothing in the instrument carries
it.** `docs/DEBT_ELEVATION_PLAN.md:76-79` (present at `613adf2`) already says *"⛔ DO NOT EDIT SOURCE WHILE
`validate:release:rn` IS RUNNING. The record is written at the END and fingerprints the tree then."* ⚡ **It
is closed by a documentation rule — and `scripts/write-gate-status.ts:12-14` is the file that says a
documentation rule cannot close this class:** *"A documentation rule cannot fix that, because a
documentation rule is exactly what failed. The record has to be unforgeable, which means written by the
thing it describes."* Neither script mentions the window; a reader of `check-gate-freshness.ts` gets the
contradicting sentence above instead. That is why I file it at `major` rather than as a recorded residue:
the `docs/` residue is stated **in the code** with its trade-off (`gateSources.ts:31-36`) and is caught by
CI on every push; this one is stated only in a plan file the instrument never reads.

**Confidence:** the mechanism is **measured** (call sites printed, chain position printed). The frequency
of a mid-run edit is **read-only inference** — it cannot be measured from the repo.

**Would anything catch it?** No. CI (`.github/workflows/web-e2e.yml:31-35`, `push: branches: ["**"]`) runs
the equivalent chain on a pinned checkout, which bounds the damage at *push* time — but CI deliberately
does **not** run `gate:record` (`web-e2e.yml:16`), so it never writes or checks the record. Between the
local green and the push, the record is the only claim, and it is wrong.

**What the guard would have to assert (buildable):** a `gate:begin` link at the head of the chain writes
`fingerprintSources()` to a temp file; `write-gate-status.ts` re-fingerprints and **refuses to record** (or
records `driftedDuringRun: true`, which `check-gate-freshness.ts` then reds on) when the two differ.

### Measured, and NOT a defect — `lint:gate-freshness` is RED on this tree for exactly the right reason

The brief handed me the RED as a reading. **It is correct behaviour, and the cause is one file.**

I re-implemented `gateSources.ts`'s walk and hash byte-for-byte (`scratchpad/p4a/fp.mjs`) and ran it over
three trees — `git archive`d copies of `1782769` and `613adf2`, and the live working tree:

```
045a310083448aa3046cb005a5ae2eee39e5f4559a8b04d7f1184ffff3dc8b2f   789 files  tree @ 1782769
c89b67e8528e5bfc0aae31312df8e542c01980074976faac4157ae9e230a0711   789 files  tree @ 613adf2
c89b67e8528e5bfc0aae31312df8e542c01980074976faac4157ae9e230a0711   789 files  live working tree

files differing between the two trees: 1
  CHANGED scripts/check-audit-closure.ts
```

Three things fall out, and the first one validates the other two:

1. **`045a310…` reproduces the recorded `sourceHash` exactly** (`gate-status.json` in the working tree:
   `sha 1782769…` · `at 2026-08-26T00:29:38Z` · `sourceHash 045a310083…` · `789` · `dirty: true`). So my
   re-implementation is faithful, **and the recorded green genuinely describes `1782769`'s committed source
   tree** — the `dirty: true` came from `docs/`, which is outside the fingerprint by design. **No mid-run
   source drift occurred on that run**; finding 1 above is the open window, not a fired one.
2. **The live tree's fingerprint is byte-identical to `613adf2`'s** — so nothing uncommitted is
   contributing, and `git status`'s two modified files are both under `docs/`, correctly excluded.
3. **`c89b67e8… ≠ 045a310…` because of exactly one file: `scripts/check-audit-closure.ts`** — the one hunk
   of job ①. The gate reds and prints `recorded: 1782769 · 2026-08-26T00:29:38Z · 789 files` /
   `now: 789 files · fingerprint differs`, real exit code **1** (measured without a pipe — `| tail`
   reports `tail`'s status, which is how this reads as 0).

**The `789 files` on both sides is honest, not a bug:** the hunk changed a file's contents, not the file
set, and the message says *"fingerprint differs"* rather than quoting a count difference.

### 2. `lint:secrets` reads the tracked file LIST from git and the file CONTENT from the working tree, so it prints "committed secrets: none" over a HEAD that holds the credential — **major**

**User-facing consequence:** a credential that is live in the repository's committed content — a public
GitHub repo, which is the entire premise of this gate — is reported clean, in **exactly the state the
gate's own remediation text creates**: delete the secret from the file, run the gate, get a green, and
leave the credential public.

**Mechanism, measured, not read.** `scripts/check-committed-secrets.ts:54-57` takes the file **list** from
`git ls-files -z`; `:62` and `:75` then read that path off the **filesystem** (`readFileSync(abs, 'utf8')`).
Index for the list, working tree for the bytes. The docstring at `:14` states the opposite —
*"It reads `git ls-files`, i.e. exactly what is COMMITTED"* — and that sentence is what makes the gap
invisible to a reader.

I ran the real script (path-retargeted in scratch, `secrets-probe.ts`; the only edit is `REPO_ROOT`)
against a scratch git repo in that state:

```
$ git show HEAD:dsn.ts
const dsn = "https://0123456789abcdef0123456789abcdef@o4507.ingest.us.sentry.io/4508";
$ cat dsn.ts
const dsn = "REDACTED";
$ tsx secrets-probe.ts
✅ committed secrets: none across 8 tracked files (4 shapes checked).   EXIT=0
```

⚡ **And `:95-97` is the gate telling you to enter that state:** *"⛔ Removing it from the working tree is
NOT enough — it stays in git history. Rotate the credential…"*. Follow the first half of that sentence and
re-run the gate, and it now says you are clean.

**Confidence: measured** (consumer verdict — the gate's own exit code and printed line, over a tree whose
`HEAD` I printed alongside it).

**Would anything catch it?** Partly, and the part it does not catch is the dangerous half.
`lint:secrets` is registered in `scripts/run-gates.ts:47` and CI runs `lint:rn` on `push: branches:
["**"]` (`.github/workflows/web-e2e.yml:92`, `:31-35`), over a clean checkout — so **this exact state reds
in CI once pushed**. What nothing catches: **there is no pre-commit hook at all** (`ls .git/hooks` shows no
non-sample hook, no husky, no lint-staged), so the only automatic run is *after* the push that makes the
credential public, and the only pre-push run is the manual local one — which is the run this defect makes
green.

**What the guard would have to assert (buildable):** read the blob, not the file — `git cat-file
--batch` over `git ls-files -s`, or simply `git grep -I -n -e <pattern> HEAD` — and add a unit test that
plants a secret in `HEAD` with a clean working copy and asserts the gate exits 1.

### Measured, and NOT a defect — `lint:secrets`, three things that look like blind spots and are not

- **All four patterns survive the cheap pre-filter — except in one unreachable case.** `:79`'s
  `text.includes('sentry.io') || 'sntry' || 'sk_' || 'PRIVATE KEY'` is a second enumeration that must agree
  with `PATTERNS`; I checked each of the four regexes against it and all four contain their pre-filter
  substring literally. ⚠️ **The one disagreement: the DSN regex carries the `i` flag (`:31`) and the
  pre-filter is case-sensitive**, so an UPPERCASE DSN passes the regex and never reaches it. Measured — of
  8 planted shapes the gate caught 6, and `dsn-upper.ts` was one of the two misses. **Not a major: the `i`
  flag is dead, not the gate.** Sentry emits DSNs lowercase; there is no artifact in this repo or in any
  Sentry output that is uppercase.
- **The 8 MB skip (`:71`) is inert on this tree.** Largest tracked file: `docs/DEBT_ELEVATION_LOG.md` at
  **1,803,559 bytes**; the next four are PNGs at 1.0–1.6 MB. **Nothing tracked exceeds 4 MB**, so nothing
  is skipped and the printed `1167 tracked files` is the whole set (1168 tracked minus `SELF`). The 9 MB
  plant *was* silently skipped, which is the shape to watch: the ✅ line does not say how many files were
  skipped for size. Recorded, not filed — a skip count in the summary is the cheap fix if a bundle ever
  lands.
- **⚠️ `:16`'s claim that `apps/rn/dist-embed/**` is covered is a stale premise.** `git ls-files | grep -c
  dist-embed` → **0**. Nothing under `dist-embed` is tracked, so the place the docstring names as *"where
  an inlined secret would actually surface"* is not in the scanned set — **and cannot leak either**, for
  the same reason. A comment to correct, not a hole.
- **The four shapes are caught, verified by plant.** Realistic spellings of all four `PATTERNS` — a Sentry
  DSN (plain, line-wrapped, and split mid-token across a line break), an `sntrys_` auth token, an
  `sk_`-prefixed RevenueCat key and a PEM `-----BEGIN PRIVATE KEY-----` — planted into the scratch repo:
  **6 hits, exit 1**, each naming the file, line and credential. The gate catches its enumerated class.

### `lint:a11y-collapse` — **no blocker or major.** The gate catches its class, and its green is not a coincidence

Never re-verified since an older round's clean list. Both halves measured.

**Does it catch the defect it was built for?** 16 shapes planted into a scratch tree and run through the
real script, path-retargeted only (`scratchpad/p4a/a11y-probe.ts`, `a11y/apps/rn/src/Plants.tsx`):
**11 flagged, 5 not, and all 5 are the three classes the docstring already names at `:17-23`.**

| planted | verdict |
|---|---|
| `<View accessible><Pressable/></View>` · `accessible={true}` + `TouchableOpacity` · `Animated.Pressable` · `TextInput` · `<Animated.View accessible>` | **flagged** ✅ |
| three levels deep · inside `{cond && …}` · inside a `<>` fragment · inside a `renderItem={() => …}` arrow | **flagged** ✅ — the walk is AST-wide, not shallow |
| `accessible` **plus** `accessibilityRole="header"` | **flagged** ✅ — `:40`'s claim that role alone is not enough is true |
| `accessible={false}` · wrapper carrying `onPress` · a control behind a child component `<Row/>` · `{...{accessible:true}}` spread · `accessible={!!true}` | not flagged — **all four documented**, and `accessible={false}`/`onPress` are *correct* not-flags |
| `<View accessible><View accessible><Pressable/></View></View>` | flagged **once** ✅ — `:100-101`'s de-dup works |

**Is the live green meaningful?** Yes — measured with the gate's own predicates re-run over the real tree
(`scratchpad/p4a/a11ycount.ts`):

```
.tsx walked: apps/rn/src 141 · packages/core 0     files past the "accessible" prefilter: 17
elements with a LITERAL accessible: 15   self-interactive (skipped): 0   ACTUALLY JUDGED: 15
accessible={false}: 1   accessible={<computed>}: 0   JSX spreads anywhere in those files: 13
```

**15 real wrappers are judged and none contains a static control** — including
`apps/rn/src/components/plan/CoachMarkLayer.tsx:371`, the component whose 2026-08-13 defect created this
gate. `npm run lint:a11y-collapse` → `✅ a11y collapse: no `accessible` wrapper statically contains a
control.`

**The documented blind spots have zero live foothold, measured rather than assumed:** `accessible={<computed>}`
occurs **0** times, and `grep -rn "accessible\s*:"` over `apps/rn/src` + `packages/core` (excluding
`accessibility*` props) returns **0 hits** — so none of the 13 JSX spreads can be carrying `accessible`
through, which is the one blind class with a plausible route into the tree.

⚠️ **Two facts recorded so pass 5 does not re-open them, neither a defect:** `packages/core` contributes
**0** `.tsx` files, so half of `SRC_DIRS` (`:32`) is currently empty — harmless, and correct to keep for
when a component lands there. And the walk takes **all** `.tsx`, so the **22 `.web.tsx`/`.web.ts` and 3
`.ios`/`.native` platform forks** under `apps/rn/src` are inside the scanned set, not beside it.

### 3. `duplicate-copy-baseline.json` is 13 entries stale, and each stale entry is a standing permission to re-duplicate that phrase — **major**

**User-facing consequence:** thirteen phrases that were de-duplicated into one authority — including the
privacy promise *"Private by design"*, *"Unlock Premium"*, *"Privacy Policy"*, *"Payoff schedule"*,
*"Current balance"*, *"Minimum payment"* and *"Emergency fund"* — can be hard-coded into a second file
again with **no red**, so two screens drift apart and the user is told two different things about the same
number or the same promise. `vocabulary.ts:99` records that this already happened once: *"three of them
independently re-typed the heading 'Private by design'."*

**Mechanism, measured.** `scripts/strings-inventory.ts:500` computes `fresh = gateFindings.filter((f) =>
!baseline.has(f.text))` — a **set** membership test, so every baseline entry is a permanent per-phrase
exemption, live or not. The committed baseline holds **16** entries. The current accepted set is **3**.

I computed the current set with the gate's own code, path-retargeted only (`scratchpad/p4a/si-probe.ts`,
`BASELINE_PATH` and `OUT_DIR` redirected into scratch so nothing was written to the repo — note that
`--update-baseline` does **not** exit and falls through to writing `docs/audits/strings-inventory.md`):

```
duplicate-copy baseline updated: 3 accepted
["A little tight this paycheck", "Looks clear this paycheck", "Very tight this paycheck"]
```

The probe is faithful: in `--gate` mode against the real committed baseline it prints the byte-identical
line `npm run lint:copy` prints — `✅ duplicate copy: no new cross-file phrases (16 baselined).`

**Decisive test — plant and control, both run.** In a `git archive` copy of `613adf2` I added a file at the scratch path
`<archive>/apps/rn/src/components/PlantedPrivacy.tsx` re-typing `"Private by design"` as a literal, the exact
regression the baseline entry covers:

```
PLANT   (against the REAL committed baseline)      → ✅ no new cross-file phrases (16 baselined)   EXIT=0
CONTROL (same tree, phrase removed from baseline)  → ❌ "Private by design"
                                                        apps/rn/src/components/PlantedPrivacy.tsx
                                                        packages/core/copy/vocabulary.ts             EXIT=1
```

**The control is what makes the plant admissible:** it proves the planted file is scanned and the phrase is
bucketed as `copy`, so the green in the first run is the baseline silencing a real hit, not the scanner
missing it.

**Confidence: measured** (consumer verdict — the gate's own exit code, both directions).

**And this is the failure its sibling gate names in a comment.** `scripts/check-apostrophes.ts:298-301`:
*"an unreported drift means the baseline silently stops describing the tree — the T8.4 failure, where a
baseline 12 too high left a +1 detector unable to detect +1."* `check-apostrophes` therefore counts and
reports its stale entries. **`strings-inventory` has no stale report at all** — `:534` prints only
`(${baseline.size} baselined)`, a number that is currently **13 too high** and that a reader will take as
the size of the accepted-repetition list.

**Would anything catch it?** No. `lint:copy` is registered (`run-gates.ts:40`) and runs in CI, and it is
green — that is the problem, not the mitigation. Nothing recomputes the baseline, nothing compares its size
to the live set, and `--update-baseline` (`:494-496`) writes `gateFindings` wholesale with no downward-only
assertion.

**What the guard would have to assert (buildable, and the cheapest version fixes the class not the file):**
in `--gate` mode compute `stale = [...baseline].filter((t) => !gateFindings.some((f) => f.text === t))`,
print it, and — since a set baseline can only ever shrink honestly — **fail when `baseline.size` exceeds
the live count by more than the run that recorded it**, or simply print `N baselined · M stale` the way
`check-apostrophes` does.

### 4. `lint:type-scale` accepts `allowFontScaling` as a clamp regardless of its value, so an unclamped 40pt figure can be reported `ok` — **major**

**User-facing consequence:** a large figure written `<Text style={styles.amount} allowFontScaling>` — the
prop's *default-on* spelling, which clamps nothing — is reported as capped, so at the largest Dynamic Type
size it scales to roughly 99pt and pushes its neighbours off the screen, on the accessibility surface this
gate exists to protect.

**Mechanism, measured by plant.** `scripts/check-type-scale.ts:115`:

```ts
if (name === 'maxFontSizeMultiplier' || name === 'allowFontScaling') clamped = true;
```

It tests the **presence** of the prop, never its value. Only `allowFontScaling={false}` disables scaling;
`allowFontScaling` bare and `allowFontScaling={true}` are the React Native default and clamp nothing. Six
shapes planted into a `git archive` copy of `613adf2` and run through the real script, path-retargeted only
(`scratchpad/p4a/ts-probe.ts --report`):

```
FAIL apps/rn/src/components/PlantScale.tsx:4  Text · big     <- StyleSheet key, unclamped        ✅ correct
ok   apps/rn/src/components/PlantScale.tsx:5  Text · big     <- allowFontScaling (bare)          ⛔ FALSE PASS
ok   apps/rn/src/components/PlantScale.tsx:6  Text · big     <- allowFontScaling={true}          ⛔ FALSE PASS
ok   apps/rn/src/components/PlantScale.tsx:8  Text · big     <- maxFontSizeMultiplier={1.3}      ✅ correct
(no row at all)                              <- const loose = { fontSize: 34 }                   ⛔ INVISIBLE
(no row at all)                              <- style={{ fontSize: 34 }} inline                  ⛔ INVISIBLE
```

**This is a wrong predicate, not a missing spelling** — the gate prints an affirmative `ok` for an input
that carries the defect, which is why I file it at `major` rather than as an enumeration residual.

⚠️ **And two shapes never reach the verdict at all.** `largeStyleKeys` (`:68-82`) requires
`ts.isPropertyAssignment(node) && ts.isObjectLiteralExpression(node.initializer)`, so a style object
declared as `const x = { fontSize: 34 }` — a `VariableDeclaration` — is not collected. ⛔ **The docstring at
`:65-66` claims the opposite:** *"Walks every object literal rather than only `StyleSheet.create`, because
a style constant declared as a plain object is the same hazard."* The plant refutes it. An **inline**
`style={{ fontSize: 34 }}` is likewise invisible, and unlike the two entries at `:23` it is not in the
"what it cannot see" list.

**Confidence: measured.** ⚠️ **All three are LATENT — zero live instances, and I say so rather than
dressing the finding up.** Every `fontSize` ≥ 30 in `apps/rn/src` (13 sites plus 4 in
`theme/typography.ts`) is a **named property assignment** inside a styles object, so all of them are
reachable by the gate; `grep -rn "style={{[^}]*fontSize"` returns **0**; and all **11** live
`allowFontScaling` sites are `={false}` (all in `components/plan/ShareCard.tsx`, where disabling scaling on
a rendered share image is correct). `npm run lint:type-scale` → `every large figure carries a font-scale
cap (19 checked)`, and that green is true of this tree.

**Would anything catch it?** No. `lint:type-scale` is registered (`run-gates.ts:47`) and runs in CI, and it
is the thing that would report `ok`. There is no test over the script itself.

**What the guard would have to assert (buildable):** treat the prop as a clamp only when it is
`allowFontScaling={false}` (`initializer` is a `JsxExpression` whose expression is `FalseKeyword`); collect
`fontSize` from `VariableDeclaration` initialisers and from inline JSX style object literals as well; and
add a unit test planting each of the five shapes above and asserting the verdict.

### 5. `lint:lane`'s flow-ordering checks are inside `if (iphoneList.length)`, so a refactor of the path spelling deletes them and the gate reports success — **major**

**User-facing consequence:** the Maestro flow-ordering rule — 01 seeds, 07 clears the state 08 needs, 09 is
terminal and clears state — silently stops being enforced, so the native e2e lane runs flows against state
they did not intend and its verdict stops meaning what the pre-flight says it means, on the last guard
before a device build.

⚡ **This is the exact class the file's own docstring says it exists for** (`scripts/preflight-native-lane.ts:7-8`):
*"its characteristic failure is a step that quietly did not run, which is indistinguishable from a step
that found nothing."*

**Mechanism, measured by plant AND control.** `:327-337` derives the flow order by regex from the run
steps' text — `.flatMap(... String(s.run).matchAll(/\.maestro\/([\w-]+\.yaml)/g))` — and then wraps all
four ordering assertions in `if (iphoneList.length) { … }`. **Nothing checks that the list is non-empty**,
and nothing puts a floor under the total check count. Both runs used the real script, path-retargeted only
(`scratchpad/p4a/lane-probe.ts`), against a `git archive` copy of `613adf2`:

```
BASELINE   unmodified tree                                        EXIT 0   ✅ 87 structural checks pass
PLANT A    flow 09 moved early, paths left as `.maestro/NN-…`     EXIT 1   ⛔ 2 problems:
                                                                            • flow 10 precedes 09
                                                                            • flow 09 runs last (terminal)
PLANT B    the SAME defect, plus `.maestro/NN-…` → `"$FLOW_DIR"/NN-…`
                                                                  EXIT 0   ✅ 83 structural checks pass
RESTORED   unmodified tree                                        EXIT 0   ✅ 87 structural checks pass
```

**Plant A is the control that makes Plant B admissible:** it proves the four assertions genuinely fire on
the defect. Plant B leaves the defect in place, changes only how the flow paths are *spelled*, and the gate
goes green — 87 → **83**, and the only trace is a number nothing compares. ⚠️ `scripts/gateSources.ts:24`
even quotes *"exits 1 on 87 structural assertions"* — a figure in a comment, with nothing asserting it.

**Confidence: measured** (consumer verdict — exit code and printed count, four runs, plant and control).

**Two more guards in the same file have the identical fail-open shape**, read not planted:
`:259` `if (terminalIdx !== -1) { … }` — rename the step whose `name` matches `/terminal flow/i` and two
"runs BEFORE the terminal flow" checks disappear; and `:188` `if (wf?.jobs) { … }` — a `native-e2e.yml`
that parses but has no `jobs:` key skips the entire job block with **no** recorded failure (`:157`'s
`exists` check and `:161-165`'s parse check both pass in that state). The upload-artifact loop at `:351`
and the `include-hidden-files` loop likewise contribute zero checks when nothing matches.

**Would anything catch it?** No. `lint:lane` is registered (`run-gates.ts:56`) and runs in CI — and in
Plant B it is the thing reporting green. There is no test over the pre-flight itself and no floor on `ok.length`.

**What the guard would have to assert (buildable):** `check('the iphone job's maestro flow list was
parsed', iphoneList.length > 0, …)` — and the general form, which fixes the class rather than the site:
assert a **minimum check count** (`ok.length + problems.length >= N`) so that any block which silently
stops contributing reds the run.

### The other two baselines — the brief's question answered directly

**"Does anything stop a baseline being regenerated wider to make a red gate green?"** For all three: **no
mechanism does.** Each regenerator writes the full current set unconditionally —
`check-apostrophes.ts:168-171` (`--baseline`), `strings-inventory.ts:495-497` (`--update-baseline`),
`check-webkit-flex-controls.ts:154-158` (`--update-baseline`). None compares against the previous size, and
none carries `MAX_UNTOKENISED`'s *"downward only"* assertion. What stands between them and a widening is
**the committed diff and a human reading it** — which is a documentation rule, and the same class as
finding 1. ⚠️ **The exposure differs sharply per file, and only one of the three is a live defect:**

| baseline | entries | live | verdict |
|---|---|---|---|
| `apostrophe-baseline.json` | **`[]`** | — | **not a defect.** The cap is already at zero, so a widening is maximally visible in the diff, and the gate prints `(0 baselined)`. It is also the only one of the three that **reports stale drift** (`check-apostrophes.ts:296-301`). `npm run lint:apostrophes` → `✅ no new straight-apostrophe copy (0 baselined)` |
| `duplicate-copy-baseline.json` | 16 | **3** | **finding 3 — major** |
| `webkit-flex-controls-baseline.json` | 9 keys | — | **not a defect for what ships.** See below |

**`lint:webkit` is RED right now** — `app/page.tsx:1653  <button> uses flex/grid class ".premium-pill"`,
real exit **1**. It is **not** in `run-gates.ts` and **not** in CI (only in the legacy `"lint"` script,
`package.json:10`), and its `DEFAULT_SRC_DIRS` (`:23`) are `REPO_ROOT/components` and `REPO_ROOT/app` — the
legacy Capacitor/Next tree that P6.11 deletes and that does not ship in `2.0.0`. `.11.17`'s
`E-gates-instruments.md` already settled its absence from the RN lane as correct. **Recorded, not filed:**
a standing red on a dead surface is worth knowing about only so that the next reader does not mistake it
for a live regression, and so that it is deleted with the tree rather than baselined into silence.

### `QA_TOOLS` / `__DEV__` — measured, and it reaches none of this surface

`grep -rn "QA_TOOLS\|__DEV__" scripts/` → **3 hits, all prose**: `check-audit-closure.ts:383` (generated
`REMAINING.md` text), `check-icon-glyphs.ts:46` and `:62` (two exemption *reasons*). **No gate's control
flow reads either flag**, so the P6.17 flip and a production web export (`__DEV__ === false`) make nothing
on the S0 instrument surface unreachable. Recorded so pass 5 does not re-ask.

---

## Measured, and NOT a defect — recorded so pass 5 does not re-open them

*(the per-gate entries above are the rest of this list: `lint:gate-freshness`'s RED · `lint:secrets`'s
pre-filter, 8 MB skip and stale `dist-embed` claim · `lint:a11y-collapse`'s documented blind spots ·
`lint:type-scale`'s zero live instances · the apostrophe and webkit baselines · `QA_TOOLS`)*

- **`lint:contrast` drops no alpha.** `solid()` (`:85`) takes `parse(value).rgb` and discards the alpha
  channel, so an `rgba()` foreground or ground would be scored as if opaque — a silently **overstated**
  ratio. Measured over every token the grid, `EXTRA_PAIRS` and `GROUNDS` touch (21 token paths × 2 schemes,
  `scratchpad/p4a/contrast.ts`): **0 are anything but an opaque 6-digit hex.** The one alpha token in the
  file, `border.control` (`rgba(16,38,84,0.58)` / `rgba(255,255,255,0.40)`), is the one that *is*
  composited (`:428`). The arithmetic is right for the tokens it is given.
- **`lint:contrast`'s token-drift scan matching only 6-digit literals costs nothing.** `TOKEN_VALUES` is
  built from `text.*`/`accent.*` and the scan is a 6-digit-only pattern. Of those token values, exactly
  **2** are expressible as a 3-digit hex — `text.inverse.light` and `text.onAccent.light`, both `#ffffff` —
  and `PRIMITIVE` (`:279`) excludes `#ffffff` deliberately. **Zero reachable misses.** The *ink* scan
  (`INK_LITERAL`, `:345`) accepts 3-to-8 digits anyway, which is where `#fff` was caught before.
- **`lint:contrast`'s `color:` / `color=` anchor does not miss another ink-bearing prop.** The `\b` before
  a lowercase `color` cannot match inside `backgroundColor`, `borderColor`, `tintColor` or
  `placeholderTextColor`, so those are outside the scan — and measured, **0** of the 8 live uses of
  `placeholderTextColor` / `selectionColor` / `tintColor` / `underlineColorAndroid` in `apps/rn/src` carry
  a hex literal, and there are **0** `color` assignments to the word literals `white` / `black`.
  `npm run lint:contrast` → `every rendered token pair clears its floor.`
- **There is no `theme/colors.web.ts` fork.** `ls apps/rn/src/theme/` → `colors.ts elevation.ts icons.ts
  index.ts motion.ts spacing.ts typography.ts`. The gate's direct import of `apps/rn/src/theme/colors.ts`
  reads the only definition, so the react-native-web build cannot be running a palette the gate never saw.
- **`check-audit-closure`'s residual paste shapes stay `minor` on pass 3's measurement** — blockquoted,
  tab-indented and 3-space-re-indented pastes still register the placeholder, on **both** branches, and
  `explicit` is consumed only via `.has(realId)`. I did not beat that measurement and am not re-opening it.
- **The `git archive` copies of `1782769` and `613adf2` carry CRLF**, and every gate I ran against them
  behaved identically to the LF tree — the lane pre-flight reproduced `87 structural checks pass`
  byte-for-byte. A free CRLF re-confirmation of pass 2's line-ending sweep, on three scripts pass 2 did not
  cover.

---

## Swept and found clean — at the blocker/major bar

⛔ **This EXTENDS `S0-REVERIFY-3.md`'s list; nothing there is re-walked or re-reported.** Pass 5 should
ratchet off both.

**`scripts/check-gate-freshness.ts` (69 lines) — first sweep, and it is clean apart from finding 1.**

- **The RED on this tree is correct and its cause is exactly one file**, proved by re-implementing
  `gateSources.ts`'s walk and hash and reproducing the recorded `sourceHash` `045a310…` at `1782769` before
  believing anything else it said. Live tree fingerprint is identical to `613adf2`'s, and the single
  differing file is `scripts/check-audit-closure.ts`.
- **Every malformed-record path fails SAFE.** A missing file reds with the "never recorded a pass" message
  (`:36-43`); an empty object or a number gives `status.sourceHash === undefined`, which cannot equal the
  hash, so it reds; `null` throws, which exits non-zero. **There is no shape of `gate-status.json` that
  produces a green over a moved tree.**
- **`gate-status.json` is not itself fingerprinted** — it is at the repo root, outside `ROOTS` and outside
  `EXTRA_FILES` (`gateSources.ts:52-80`), which is what stops the record from invalidating itself.
- **`write-gate-status.ts` cannot record a green over a red run** — the `&&` chain (`package.json:50`)
  never reaches it, confirmed by `.11.17`'s exit-code experiment; I re-read the chain and it is unchanged,
  and the `--from-gate` speed bump (`:32-40`) is intact.
- ⚠️ **The `docs/` residue is stated in the code with its trade-off** (`gateSources.ts:31-36`) and is
  covered by CI on every push, since `lint:closure` runs inside `lint:rn`. Not a finding.

**`scripts/check-committed-secrets.ts` (101 lines) — first sweep.** All four `PATTERNS` plant-verified
(6 hits, exit 1, over 8 planted shapes including a line-wrapped and a mid-token-split DSN); the `:79`
pre-filter proved consistent with all four regexes; the 8 MB skip inert (largest tracked file 1.8 MB of
1168 tracked); the `SELF` exclusion correct and the printed count (`1167`) consistent with it. Finding 2 is
the one hole.

**`scripts/check-a11y-collapse.ts` (134 lines) — re-verified, clean.** 16 plants, 11 correctly flagged,
5 correctly not; 15 live wrappers judged including the one whose defect created the gate; the documented
blind spots measured at 0 live instances; the `.web.tsx` forks inside the scanned set.

**`scripts/check-contrast.ts` (457 lines) — first sweep, clean.** The WCAG arithmetic reads correctly
against SC 1.4.3 and 1.4.11; the alpha, 3-digit and prop-anchor attacks all measure to zero exposure; the
`never-text` exemption is re-verified from source on every run (`:243-248`), and the `border.control`
reachability assertion (`:255-262`) is a real one — the gate refuses to be arithmetic about a colour
nothing paints. `npm run lint:contrast` green.

**`scripts/check-type-scale.ts` (144 lines) — first sweep.** The threshold argument at `:41-45` holds
(`title1` is 28 and is prose, so clamping it would overrule an accessibility user); `TEXTUAL` misses no
live component — a scan for `<XxxText` names over `apps/rn/src` returns **no** name outside the regex; all
17 `fontSize >= 30` sites are reachable by the collector. Finding 4 is the condition, not the coverage.

**`scripts/preflight-native-lane.ts` (537 lines) — first sweep.** 87 checks, reproduced on an archived
tree; the composite-action `shell:` / `working-directory:` assertions, the cache-key rules (hash the
action, do not hash a workflow, namespace per lane), the artifact-name uniqueness scan, the `path: |`
comment scan, the GitHub-expression evaluator's `return undefined -> check(false)` failure mode
(`:476-479`, which fails **safe** — an expression it cannot model is reported rather than assumed true),
and the app-icon block (key, file, 1024×1024, no alpha channel) all read correct, and the icon checks were
confirmed live. Finding 5 is the fail-open guard class.

**Cross-cutting, measured this pass**

- **Eight gates run green on this tree**: `lint:closure`, `lint:secrets`, `lint:a11y-collapse`,
  `lint:contrast`, `lint:type-scale`, `lint:lane`, `lint:copy`, `lint:apostrophes`.
  `lint:gate-freshness` is red (correctly — finding 1's sibling); `lint:webkit` is red on the dead legacy
  tree.
- **CI reach re-confirmed against `run-gates.ts`'s registry**: all eight of the above are in the 23-gate
  list and therefore in `lint:rn`, which `.github/workflows/web-e2e.yml:92` runs on
  `push: branches: ["**"]`.
- **No pre-commit hook exists** — `ls .git/hooks` shows no non-sample hook, and there is no husky or
  lint-staged wiring in `package.json`. Every gate's first automatic run is *after* the push.

---

## Could not determine

- **How often a source file is actually edited during a `validate:release:rn` run** (finding 1). The
  mechanism is measured; the frequency is a property of how the repo is worked and nothing in the tree
  records it. The one run I could reconstruct — the record at `2026-08-26T00:29:38Z`, 13 minutes after
  `1782769` was committed — did **not** drift, because the recorded `sourceHash` reproduces `1782769`'s
  committed source tree exactly.
- **Whether `lint:secrets` has ever been green over a `HEAD` carrying a credential** (finding 2).
  Answering it means scanning history, which no instrument in this repo does and which this round's
  read-only scope does not cover. The present tree is clean: 1167 files, 4 shapes, 0 hits.
- **Whether any of the 13 stale `duplicate-copy-baseline.json` phrases was de-duplicated deliberately or
  merely moved** (finding 3). The gate cannot distinguish them and neither can the file; only the commits
  that removed each one would say — and it does not change the finding, because a stale entry is a
  standing permission either way.
- **Whether the `.web.tsx` fork of any judged component diverges in a way these gates cannot see.** All 22
  `.web.*` files are *inside* every scanned set I checked, so nothing sits beside the scan — but
  react-native-web's own handling of `accessible`, `maxFontSizeMultiplier` and Dynamic Type is a runtime
  property no static gate here models. Only a browser and a device settle it.
