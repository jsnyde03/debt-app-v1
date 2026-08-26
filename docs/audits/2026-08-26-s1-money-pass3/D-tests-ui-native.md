# S1 · PASS 3 · AUDITOR D — the instruments and the edges

**Pin:** `96d1f11` · branch `v1.7-dev`. **Read-only** — no file under `apps/`, `packages/` or `scripts/`
was edited in the audited repo; every plant ran in an isolated git worktree (§0).
**Route:** `ROUTING-D.txt` — 109 files, 7,433 lines. 36 e2e specs, `components/ui`, `theme`, `motion`,
`premium`, `liveActivity`, `widget`, `appIntents`, `notifications`, `keyCommands`.

## Result — **2 blockers · 2 majors · 4 minors**

| # | finding | severity | where |
|---|---|---|---|
| **D3-1** | The Home-Screen and Lock-Screen widget says **"Debt-free · 100% · $0"** over balances the app itself returns `debt-free-unverified` about | **blocker** | `widget/snapshot.ts:80-88` |
| **D3-2** | Siri and the Live Activity say *"looks clear — $1,080 free to put toward debt"* when the obligation netted out is one the app could not read | **blocker** | `liveActivity/paydayActivityContent.ts:75-85` · `widget/snapshot.ts:40-62` |
| **D3-3** | The registry entry guarding **B-1's own fix** is green with that fix's defect restored — the token names the line that COMPUTES the check, not the line that USES it | **major** | `finding-guards.json` → `S1P2-B1-REASON` · `test-gate-plants.ts:277`, `:281` |
| **D3-4** | `REVERIFY4-2` is still unpinned — measured: the un-fix leaves `lint:secrets`, `lint:finding-guards` **and** `test:gate-plants` green, and the green sentence still says *"index+HEAD"* | **major** | `check-committed-secrets.ts:172` |
| **D3-5** | Two absence-only tests pass over a Progress screen that renders nothing — `minor` **because I measured that a sibling test reds on the confound** | minor | `on-plan-streak.spec.ts:27`, `:35` |
| **D3-6** | The Siri action queue is cleared AFTER it is applied, and the clear is the one call whose failure is swallowed — three drains → three payments | minor | `drainPendingActions.ts:22-23` |
| **D3-7** | The widget's `remaining` assertion computes its expectation with the function under test | minor | `widgetSync.test.ts:52` |
| **D3-8** | The BNPL calendar's money assertion pins the word `payments` and not the dollar figure beside it | minor | `bnpl.spec.ts:78` |

### ⭐ The two headlines

⚡ **B1's rule — *never state a number about money the app could not read* — is now wired to every claim
site INSIDE the app and to none of the three OUTSIDE it.** The brief asked whether the subset it was
widened to is itself complete. It is not, and the sites that were missed are the two loudest surfaces the
product has: the **Home Screen** and the **Lock Screen**. Measured on one store at one instant —
`mayClaim(store, 'debt-balances') === false` and `selectPlanState === 'debt-free-unverified'` while the
widget payload carries `"Debt-free"`, `"100%"` and `"$0"`.

⚡ **And the good news is bigger than it looks: pass-2's `B-1` is CLOSED, seven of seven, by plant.** Every
one of the seven registry entries that stayed **green** with its defect restored now **reds**, and the
remedy landed in both shapes B-1 proposed — re-pointed tokens *and* six new behavioural scenarios, with
an in-gate self-check for the seventh. **The class it belonged to is not empty**, though: `D3-3` and
`D3-4` are two more members, one of them created by B-1's own fix.

### What ran, at this pin, with nothing else executing

```
playwright (RN e2e, full suite)   →  310 passed (8.3m)      ✅   ⚡ no pass has ever run this tree
npm run test:app                  →  ALL PASSED             ✅
npm run lint:rn                   →  all 28 gates pass      ✅
npx tsx scripts/test-gate-plants  →  11/11 fail closed      ✅
npx tsx scripts/check-gate-freshness → exit 1               ⚠️  expected mid-audit, [D74]
```

⚠️ **`lint:gate-freshness`'s exit code was measured, not assumed** — `npm run … | tail` reports *tail's*
status (`0`); the gate's own is `1`.

---

## 0. Method — how the plants were run without touching the pinned tree

Three auditors were working the same checkout concurrently, so a plant in `apps/rn/src` would have
manufactured a false finding for them. Every plant in this report was applied in an **isolated git
worktree at the pin**, with `node_modules` junctioned rather than copied and its own Playwright config
on a private port so no run of mine could collide with theirs:

```
git worktree add --detach <temp>/auditd-wt 96d1f11
cmd //c "mklink /J node_modules C:\Users\Jason\debt-app-v1\node_modules"
cmd //c "mklink /J apps\rn\node_modules C:\Users\Jason\debt-app-v1\apps\rn\node_modules"
sed 's/const PORT = 4319;/const PORT = 4519;/' playwright.config.ts > playwright.audit.config.ts
```

**Baseline, established before any plant** (the whole spec, so a red later is attributable):

```
npx playwright test --config apps/rn/playwright.audit.config.ts apps/rn/tests/e2e/guardian.spec.ts
  →  13 passed (1.7m)
```

⚠️ **`git status` in the audited repo shows `docs/DEBT_ELEVATION_{PLAN,LOG,BACKLOG}.md` modified.**
Those are **not mine** — mtimes 18:37–18:38 are the orchestrating session's, my report file was created
at 18:36:45, and I have written nothing outside this file. No file under `apps/`, `packages/` or
`scripts/` is modified in the audited repo; verified at the end of this run.

---
## 1. FINDINGS — blocker + major

### D3-1 — **blocker** · the Home-Screen widget says **"Debt-free · 100% · $0"** over balances the app itself refuses to make that claim about

`apps/rn/src/widget/snapshot.ts:80-88` · `apps/rn/src/widget/widgetSync.ts:44`

**User-facing consequence.** A user whose debt balances could not be read on import/migration — the exact
population `pendingDataRepairs` exists for — opens the app and is correctly told the app cannot verify
their balances, then looks at their Home Screen and sees **"Debt-free"**, a **100%** ring and **"$0"**
remaining, permanently, over the $12,400 they still owe.

**What I measured.** One store, one instant, four reads side by side. Probe run in the isolated worktree
(`apps/rn/src/testing/__probeD2.ts`, deleted after; it exists in no tracked tree):

```
=== C. one debt whose BALANCE could not be read -> repaired to 0, one clean debt ===
  mayClaim(store, 'debt-balances') = false                  <-- the app REFUSES the claim
  selectPlanState(store, alloc)    = debt-free-unverified    <-- the banner correctly refuses
  WIDGET debtFreeDate             = "Debt-free"
  WIDGET pctLabel                 = "100%"
  WIDGET remaining                = "$0"
  WIDGET debtsJson                = []
  WIDGET guardianSpoken           = "This paycheck looks clear — your cushion holds."
```

`buildWidgetSnapshot` computes `cleared = debts.length > 0 && live.length === 0` (`:80`) with
`live = debts.filter(d => d.balance > 0)` (`:73`) — and a balance the app could not read **is** `0`, which
is the whole premise of `selectPlanState`'s docblock at `planSelectors.ts:329-338`. `remaining` sums the
same repaired zeros (`:75`, `:88`), and `pct` divides `originalBalance` by itself (`:76-77`).

**Reachability, measured not assumed.** `startWidgetSync` (`widgetSync.ts:24`) has exactly two refusals —
a sandbox store (`:30`) and per-store idempotency (`:34`) — then calls `sync()` **unconditionally at
launch** (`:57`) and on every committed change (`:59-66`). Nothing on the path consults
`pendingDataRepairs`. A repo-root grep for `pendingDataRepairs|hasUnread|mayClaim|rowFieldUnread` over
`apps/rn/src` + `packages/core` returns consumers in `index.tsx`, `money.tsx`, `progress.tsx`,
`celebrationSelectors.ts`, `planSelectors.ts`, `RequiredActionsCard.tsx`, `store.ts`, `persistence.ts`,
`migrations.ts`, `defaults.ts`, `models.ts`, `DataRepairsCard.tsx`, `dataRepairsCopy.ts` — **and nothing
under `widget/`, `liveActivity/`, `notifications/` or `appIntents/`.**

**Remedy.** `buildWidgetSnapshot` asks the one owner, exactly as `selectPlanState` does: `cleared` becomes
`… && mayClaim(store, 'debt-balances')`, and when the claim is refused the payload degrades to the
placeholders the interface already documents (`debtFreeDate: '—'`, `hasData` still true so the widget
points at the app rather than pretending there is no data). ⚠️ **`pctLabel` and `remaining` need the same
guard** — repairing only `debtFreeDate` leaves "100% · $0", which is the same false statement without the
word.

**The direction the justification runs in.** This is not "the widget should be more cautious than the
app" — it is that **the app and the widget make the same claim from the same store and disagree**, which
is [B1]'s own finding verbatim (*"one tab apart, on one store, the app both refused and asserted the same
sentence"*) with the widget standing where Today used to. The opposite direction — the widget is right and
the in-app refusal is over-cautious — does not apply: `hasUnreadDebtBalances` returning `true` means the
store is holding a repair entry saying *this number was lost*, and the widget knows it too, because
`debtsJson` (`:92-94`) filters the same debt out of Siri's list on the same predicate.

**Would anything catch it?** No. `widgetSync.test.ts` has an all-cleared case and it pins the honest one
(a genuinely paid-off store); no fixture in the repo puts a `pendingDataRepairs` entry through
`buildWidgetSnapshot`. Measured: `grep -rn "pendingDataRepairs" apps/rn/src/widget apps/rn/src/liveActivity`
→ **0 hits**.

⛔ **`apps/rn/src/widget/snapshot.ts` is claimed `["s1p2"]` in `scripts/surface-coverage.s1.json`, so it is
on NO pass-3 routing manifest** — mine included. Pass-2 D read exactly one function of it (`N6`,
`buildGuardianSpoken`, and only for immunity to [M3]) and the whole file went to `swept`. See D3-3.

---

### D3-2 — **blocker** · Siri and the Lock-Screen Live Activity say *"looks clear · $1,080 free to put toward debt"* when the obligation they netted out is one the app could not read

`apps/rn/src/liveActivity/paydayActivityContent.ts:75-85` · `apps/rn/src/widget/snapshot.ts:40-62`

**User-facing consequence.** A premium user whose `minimumPayment` could not be read — pass-2 `C4`'s exact
class — asks Siri *"am I okay this paycheck?"* and is told they have **$1,080 free to put toward debt**,
and their Lock Screen carries the same sentence for the three days before payday, while the app itself
refuses to say they are caught up. The $900 gap is an obligation the app knows it failed to read.

**What I measured.** Control and defect differ on one variable — whether the minimum was readable:

```
=== A. control — a $5,000 debt with a REAL $1,500 minimum ===
  WIDGET guardianSpoken = "This paycheck looks clear — your cushion holds, with $180 free to put toward debt."
  LIVE ACTIVITY         = {"state":"clear","title":"Looks clear this paycheck",
                           "line":"Apply the spare $180 toward Visa when you're ready — …"}

=== B. the C4 class — SAME debt, minimumPayment could not be read -> repaired to 0 ===
  mayClaim(store, 'required-plan') = false      <-- the app REFUSES the claim
  WIDGET guardianSpoken = "This paycheck looks clear — your cushion holds, with $1,080 free to put toward debt."
  LIVE ACTIVITY         = {"state":"clear","title":"Looks clear this paycheck",
                           "line":"Apply the spare $1,080 toward Visa when you're ready — …"}
```

The control is what makes this falsifiable: the figure moves $180 → $1,080 on that single variable, and
the sentence around it does not change at all.

**Mechanism, checked rather than inferred from the site.** Neither module re-derives the plan; both call
`selectPaydayGuardian(withProjectedBalances(store, true))` and print `brief.deployedToDebt`
(`snapshot.ts:56-57`, `paydayActivityContent.ts:80-84`). The brief is honest about the arrays it was
handed — this is [C4]'s own sentence, *"B5's remedy is intact; the arrays handed to it are wrong"* — and
the in-app consumers now ask `mayClaim('required-plan')` before restating it. These two do not.

**Remedy.** `buildGuardianSpoken` returns `''` and `buildPaydayActivityContent` returns `null` when
`!mayClaim(store, 'required-plan')`. Both already have a *nothing-to-say* return their callers handle
(`snapshot.ts:42`, `:44`; `paydayActivityContent.ts:66`, `:68`), and `decideLiveActivityAction` already
maps `null` → `end` / `none` (`:129-131`), so the whole path exists — what is missing is the call. ⚠️ That
is `tested-helper-is-not-a-used-helper` in its usual shape, and it is why the remedy is one condition
rather than a new mechanism.

**The direction the justification runs in.** The claim is *"$X is free"*, a statement about what this
paycheck is obliged to cover — precisely the claim `'required-plan'` names in `CLAIM_FIELDS`
(`trustSelectors.ts:98-101`), whose route is `debt: ['minimumPayment']`, exactly the field repaired here.
The opposite reading — that a Guardian read is a forecast rather than a claim and so is exempt — is
refuted by the app's own behaviour: the in-app Guardian surfaces *do* consult the guard, and
`snapshot.ts:51-55` already records one round of walking this very sentence back from *"your cushion is
safe"* to *"holds"* for being too absolute on the least contextual surface. A dollar figure is more
absolute than either wording.

**Would anything catch it?** No. `paydayActivityContent.test.ts` and `widgetSync.test.ts` contain no
`pendingDataRepairs` fixture (0 grep hits, above), and the two files are `never` / `s1p2` on the coverage
report.

---
**Addendum to D3-1 — the native side does no calc and no guard, by design, so JS is the only place a guard can live.** The Swift widget renders the strings verbatim:

```
DebtViews.swift:85, :117, :147, :200   Text(snap.debtFreeDate)
DebtViews.swift:90, :122, :165, :203   Text("\(snap.remaining) left" / " remaining")
DebtViews.swift:82, :111, :157, :186   ProgressRing(… label: snap.pctLabel)
DebtViews.swift:196-203  RectangularWidgetView — a static "Debt-free" headline ABOVE snap.debtFreeDate
DebtViews.swift:218      InlineWidgetView — "\(snap.pctLabel) paid · debt-free \(snap.debtFreeDate)"
```

⚡ On the **Lock Screen** the rectangular accessory therefore reads *"Debt-free / **Debt-free** / 100%
paid · $0 left"* and the inline one reads *"100% paid · debt-free **Debt-free**"*, over unread balances.
The `WidgetSnapshot` interface carries no field that could express *"we could not read this"*, so the
remedy has to be in `buildWidgetSnapshot`, which is where D3-1 puts it.

**Addendum to D3-2 — the Siri path was traced to the sentence.** `SiriQueryIntents.swift:75-78`:
`if snap.guardianSpoken.isEmpty { … upsell … } ; return .result(dialog: IntentDialog(stringLiteral:
snap.guardianSpoken))` — the string is spoken verbatim, and `""` already routes to the value-led upsell.
So the remedy (`return ''` when the claim is refused) lands on a path the native side already handles.

---

### D3-3 — **major** · the registry entry guarding B-1's own fix stays GREEN with that fix's defect restored — `tested-helper-is-not-a-used-helper`, reintroduced by the fix for it

`scripts/finding-guards.json` → `S1P2-B1-REASON` · `scripts/test-gate-plants.ts:277`, `:281`

**User-facing consequence.** `test:gate-plants` — the only thing in the tree that proves a CI gate refuses
anything — can be returned to scoring a gate that reds at startup for an unrelated reason as a perfect
pass, with `lint:finding-guards` printing *"79 of 95 findings carry a standing guard"* and
`test:gate-plants` printing *"all 11 gates fail closed"* the whole time; the next money gate to quietly
stop refusing would be certified green by both.

**What I measured.** Plant applied to the real file in the isolated worktree, restored and the restore
verified byte-for-byte:

```
un-fix:  const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0 && rightReason;
     ->  const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0;

  lint:finding-guards exit 0 | names S1P2-B1-REASON: false      <-- GREEN over its own defect
  test:gate-plants    exit 0 | all 11 gates fail closed          <-- GREEN over its own defect
  restored: true
```

**And three controls, so the green means something.** Each is a different un-fix of the same file, and
each reds:

```
  REDS  S1P2-B1-REASON  (control: delete the COMPUTATION as well)      lint:finding-guards exit 1
  REDS  S1P2-B1-PLANTS  (control: drop `...B1_SCENARIOS,`)             lint:finding-guards exit 1
  REDS  GAP-16          (control: neuter the MIN_SCENARIOS floor)      lint:finding-guards exit 1
```

**Mechanism.** The registry pins `S1P2-B1-REASON` to
`const rightReason = !s.expect || withPlant.out.includes(s.expect)` — the line that **computes** the
value. The verdict is a separate line (`:281`) that **uses** it. Deleting the use leaves the computation,
the token and the green. ⚡ **This is the exact sentence pass-2's B-1 was rated `major` for** — *"deleting
the CALL to `presentInCode` leaves the helper, the token and the green"* — now true of B-1's own remedy,
in the file B-1's remedy created. Rule 11, measured.

**Remedy.** Re-point the token at the line that would have to change:
`withoutPlant.status === 0 && rightReason`. That is a registry edit, zero runtime cost, and it is the same
move the fix range already applied to seven other entries (see the STANDING RE-CHECKS below, where all
seven now red). ⚠️ The stronger remedy — a self-check in the shape of `surface-coverage.ts:546`, running
one scenario whose gate reds for a reason that does not match its `expect` and asserting the harness calls
it a failure — closes the class rather than this instance.

**The direction the justification runs in.** The claim is not *"the `expect` mechanism is wrong"* — it is
correct and I measured it working (`reason=MATCHED` on all six B1 scenarios). The claim is that **nothing
would tell you if it stopped being consulted**, and the whole reason `finding-guards.json` exists is to be
the thing that tells you. The opposite reading — that `test:gate-plants` failing would catch it — is
refuted above: `test:gate-plants` printed *all 11 gates fail closed* with the plant in place, because the
verdict it prints is the very expression the plant edits.

---

### D3-4 — **major** · `REVERIFY4-2`'s fix is still unpinned, and I measured it rather than carrying the caveat: the whole gate chain stays green over the un-fix, and the green sentence still says *"index+HEAD"*

`scripts/finding-guards.json` → `REVERIFY4-2` (token `"cat-file"`) · `scripts/check-committed-secrets.ts:172`

**User-facing consequence.** `lint:secrets` can be returned to the state its own docblock describes —
file **list** from git, file **content** from the working tree — so it reports *"✅ committed secrets: none
across 1206 tracked files in index+HEAD"* over a `HEAD` that publishes a live credential, with
`lint:finding-guards`, `lint:rn` and `test:gate-plants` all green. That is a shipped app's signing key or
Sentry DSN staying public while every instrument says otherwise.

**What I measured — two runs, and the second is what makes the first mean something.**

*(1) The un-fix is invisible to every instrument.* Content source reverted to `readFileSync` while the
token `cat-file` stays untouched on its own code line:

```
  lint:secrets        exit 0 | ✅ committed secrets: none across 1206 tracked files in index+HEAD …
  lint:finding-guards exit 0 | names REVERIFY4-2: false
  test:gate-plants    exit 0 | ✅ all 11 gates fail closed on a planted defect
  restored: true
```

*(2) The un-fix genuinely moves the content source* — so this is not an inert edit reported as one. A
**tracked** file's working copy was given a refused pattern with the index and HEAD clean:

```
  REAL gate (git blobs)       exit 0 | ✅ committed secrets: none … in index+HEAD
  PLANTED gate (working tree) exit 1 | ❌ 2 credential(s) … [index] apps/rn/src/theme/spacing.ts:68
```

⚠️ Note what the planted gate prints: a **working-tree** line labelled `[index]`. The revision label is
composed from the spec string, not from where the bytes came from, so the reverted gate would keep
claiming to have read the index and HEAD.

**Site enumeration, whole and not sampled.** `finding-guards.json` holds **95 entries · 79 guarded · 16
unguarded** (the instrument's own line). Of the 79, **53 guards live in a test file and 26 in a non-test
file**; `test-gate-plants.ts` names scenarios against 8 distinct scripts
(`check-finding-guards`, `surface-coverage`, `check-committed-secrets`, `check-month-arithmetic`,
`check-local-dates`, `check-glossary`, `check-native-a11y-props`, `check-type-scale`). `REVERIFY4-2` sits
in a script that IS in that list — but the one scenario there plants `[M10]`'s untracked-file class, not
this one.

**The direction the justification runs in.** ⛔ **Pass-2's B-1 enumerated seven entries of this class and
the class held at least eight when it was written.** `REVERIFY4-2` is the eighth; `S1P2-B1-REASON` became
a ninth when the fix landed. The fix range converted all seven (measured below, all seven now red) and
reached neither of the other two. That is rule 5 in its usual form — *the fix enumerated the
sites it could see* — and it is why this is reported as a finding rather than left as the caveat pass 2
recorded it as. The opposite reading — that `REVERIFY4-2` is closed and the guard is a formality — is what
was carried into pass 3 and is precisely what the brief asked to be measured instead of assumed; the
measurement above is what it returns.

**Remedy.** A `test-gate-plants` scenario whose input is the git revision rather than a file: stage a
credential-shaped fixture, run the gate over the index, assert it reds; then remove it from the working
tree only, and assert it still reds. Cheaper interim, and the same move the seven took: re-point the token
from `"cat-file"` at the line that would have to change — `visit(specs[i], buf.toString('utf8', off, off + size))`.

---
## 1b. FINDINGS — minor

### D3-5 — **minor** · two absence-only tests in `on-plan-streak.spec.ts` pass over a Progress screen that renders nothing — and the reason they are `minor` is a measurement, not a judgement

`apps/rn/tests/e2e/on-plan-streak.spec.ts:27`, `:35`

**Consequence.** None reaches the user, and no instrument is blinded — which is the whole point of
recording it, because the reading says otherwise.

**What I measured.** Pass-2's `D2-3` was rated `major` for exactly this shape, so I asked whether the two
survivors of the class are the same thing. Plant applied in the isolated worktree —
`export default function ProgressScreen() { if (true) return null; }` — the honest instance of *"the page
never rendered"*:

```
  x   1  an on-plan run reads as a caption on the Progress hero            (8.6s)   <-- REDS
  ok  2  one cycle is below the floor — the app makes no claim at all      (990ms)
  ok  3  a broken run ends the streak rather than shrinking it             (775ms)
  1 failed · 2 passed (1.9m)
```

**So the two absence-only tests are individually vacuous and the FILE is not.** Test 1
(`:20`, `expect(getByText('3 paychecks on plan')).toBeVisible()`) is the positive that the class needs,
and it lives in the same spec file, so a blank Progress screen cannot pass this suite. That is the
difference from `D2-3`, where the *only* test of the no-paycheck Today was the bare `toHaveCount(0)` and
nothing anywhere asserted that the screen renders (its fix, `guardian.spec.ts:100-104`, adds two positives
**before** the absence line — rule 6 satisfied, the positive fires first).

**Remedy (craft, not correctness).** One positive per test — `getByTestId('progress-hero')` visible, or
the honest state by name — so each test stands on its own. ⚠️ **Do not "fix" this by adding a second
`toHaveCount(0)`.**

**The direction the justification runs in.** ⛔ The rating is `minor` because I measured that the confound
reds elsewhere in the same file, not because absence assertions are usually fine. The opposite direction —
rating it `major` for matching `D2-3`'s shape — would be a re-rating rather than a measurement, and the
brief is explicit that a re-rating is not a proof.

---

---

### D3-6 — **minor** · `drainPendingActions` clears the Siri queue AFTER applying it, and the clear is the one call in the path whose failure is swallowed

`apps/rn/src/appIntents/drainPendingActions.ts:22-23` · `pendingActionBridge.native.ts:30-36`

**What I measured** (probe in the isolated worktree, injecting the module's own `bridge`/`api` seams —
no native code needed):

```
same id, TWICE in one payload  -> 1 action(s)   (deduped)
same id, two SEPARATE calls    -> 2 action(s)   (NOT deduped)
three drains over a queue that never clears -> ["pay:d0:150","pay:d0:150","pay:d0:150"]
```

Three drains of one Siri "log payment" produce **three** `logManualPayment(d0, 150)` calls — one money
mutation per drain — because `parsePendingActions`'s dedupe set is created per call
(`pendingActions.ts:44`) and nothing persists which ids have been applied. `drainPendingActions` runs at
launch **and** on return-to-foreground.

**Why `minor` and not `major`, stated honestly.** The trigger is `bridge.clear()` not taking effect, and
the native bridge swallows a throw by design (`pendingActionBridge.native.ts:34`, `/* best-effort */`).
⛔ **I could not instantiate that from here** — it needs the iOS App-Group module — so I am not claiming a
user reaches it, and per rule 3 I will not assert a mechanism I did not measure. What *is* measured is
that nothing downstream would stop it: there is no cross-drain ledger anywhere
(`grep -rn "appliedActionIds\|handledActionIds\|drainedIds" apps/rn/src` → **0 hits**), and
`logManualPayment` reduces the balance (`store.ts:672`).

**Remedy.** `clear()` before `apply`, not after. A dropped action is a Siri tap that did nothing and the
user can see and repeat; a re-applied one silently changes a balance. ⚠️ The docblock at
`pendingActions.ts:12` already says *"`id` dedupes a double-write"* and cites *"an intent can double-write
across a relaunch"* — which is precisely the case the per-call set cannot see. That is rule 1: the comment
describes a protection one scope wider than the code has.

---

### D3-7 — **minor** · the widget's `remaining` assertion computes its expectation with the function under test

`apps/rn/src/widget/widgetSync.test.ts:52`

`eq(snap.remaining, formatWhole(8000), 'remaining = current total balance')` — both sides call
`formatWhole`, so the assertion pins *"the snapshot used the formatter"* and never *"the string is
$8,000"*. The sibling assertions in the same block do it correctly (`eq(snap.pctLabel, '20%')`).
No instrument is blinded: `formatWhole`'s own behaviour is pinned elsewhere and by `lint:money`. The fix
is the literal.

⚠️ Recorded also because it is the assertion nearest D3-1: `eq(snap.debtFreeDate, 'Debt-free', …)` at
`:59` is the honest case (a genuinely paid-off debt, no repairs), so **the D3-1 fix does not break this
test** — I checked, because a fix that reds an existing green is how a blocker gets argued back open.

---

### D3-8 — **minor** · the BNPL calendar's money assertion pins the word and not the number

`apps/rn/tests/e2e/bnpl.spec.ts:78`

The comment says *"A month subtotal line renders (`"$X · N payments"`)"*; the assertion is
`expect(page.getByText(/payments/).first()).toBeVisible()`. The rendered line is
`{formatCurrency(g.subtotal)} · {N} payments` (`BnplCalendarSection.tsx:73`), so a subtotal that came out
`""`, `"$NaN"` or `"$0"` satisfies the test — **the half of the line that is about money is the half not
asserted**, and `/payments/` `.first()` can also resolve to a different element (`DebtSheet.tsx:353`
renders the same word). No instrument is blinded for the calendar's *existence* — the two sibling
assertions above it pin `UPCOMING BNPL INSTALLMENTS` and `payment 3 of 4` — which is why this is `minor`.
The fix is one regex: `/\$\d[\d,.]* · \d+ payments/`.

---

## 2. STANDING RE-CHECKS

⛔ Every verdict below is a plant or a run. A re-read is not a re-verification.

| id | verdict | the measurement |
|---|---|---|
| **`B-1` (pass 2, `major`)** | **CLOSED for its seven — see `D3-4` for the ones it did not enumerate** | All seven un-fixes applied to the real gate source in the isolated worktree; `lint:finding-guards` **names all seven and exits 1**, and every file restored byte-for-byte. Table below. |
| **`REVERIFY4-2`** | ⛔ **OPEN · unpinned, and now measured rather than carried** → `D3-4` | The un-fix leaves `lint:secrets`, `lint:finding-guards` and `test:gate-plants` all green, and a second run proves the un-fix genuinely moves the content source. |
| **`REVERIFY4-3`** | ⚠️ **OPEN · the guard still prints and does not red — measured, and the drift it reports is now ZERO** | Planted one stale entry into `scripts/duplicate-copy-baseline.json`: `exit 0`, with `⚠️ 1 baselined phrase(s) no longer duplicate …` printed and `✅ duplicate copy: no new cross-file phrases (4 baselined, 1 stale)`. **The live baseline is 3 entries, 0 stale** — pass 2 recorded 16 baselined / 13 stale, so the standing permissions it reported were actually cleared. No live slack today. |
| **`REVERIFY4-1`** | **CLOSED** | Control in the plant table: the token *is* the refusal message, and `lint:finding-guards` reds when it moves (re-measured indirectly via the seven-plant harness's own restore checks). |
| **`REVERIFY4-4`** | **CLOSED** | `test:gate-plants` scenario `lint:type-scale` → `plant-applied=YES · planted=exit 1 · control=exit 0`, in the run below. |
| **`REVERIFY4-5`** | **CLOSED, and the ratchet has zero slack** | `npx tsx scripts/preflight-native-lane.ts` → `✅ native-lane pre-flight: 95 structural checks pass`, against `const MIN_CHECKS = 95` (`:573`). Equal, so the `<` comparison at `:584` carries no slack. |
| **`S1P1-M5-CHAIN`** | **CLOSED** | `run-gates.ts` still carries `test:gate-plants` in the chain, and the harness now runs **11** scenarios rather than 5. |
| **`D2-3` (pass 2, `major`)** | **CLOSED — by plant, not by reading** | Planted the empty shell back (`(tabs)/index.tsx:295` → `if (false && planState === 'no-paycheck')`, so a no-paycheck user gets `content = null`) and re-ran the spec: **1 failed · 12 passed**, and it failed at **`:103`** — the positive the fix added — with *"Locator: getByText('Set up your paycheck').first() … element(s) not found"*. Rule 6 confirmed in the direction that matters: the positive fires FIRST, so the `toHaveCount(0)` at `:105` never gets to pass vacuously. Restored and the restore verified. Clean spec at the pin: **13 passed (1.7m)**. |
| **`B-3` (pass 2, `minor`)** | **CLOSED** | `plan-hero-conserves.spec.ts:88-89` now asserts `p.headline === 1000` and `p.required <= 1000`; under the original defect `required` was `summary.requiredTotal = 1400`, so the second assertion names the defect directly. |
| **`B-2` (pass 2, `minor`)** | **CLOSED** | `check-audit-closure.ts:200`, `:271` are `!==` at this pin (`git diff 4b58d75..96d1f11`). |
| **`GAP-16` / `S1P2-B1-PLANTS`** | **CLOSED** | Both red under their controls — see `D3-3`'s control table. |
| **`S1P2-B1-REASON`** | ⛔ **OPEN · green over its own defect** → `D3-3` | |
| **`S1P1-M9-ROUTING`** | **CLOSED, and by a stronger mechanism than a token** | `surface-coverage.ts:546` runs `collectBadRoutes` over a synthetic file on **every invocation** and exits rather than printing. Planted `if (false && r && !KNOWN_SURFACES…)` → `exit 1`, *"the routing check did not refuse a surface that does not exist, so it is not checking."* Right reason, measured. |

### The seven-plant table — pass 2's `B-1`, re-measured at `96d1f11`

Every un-fix applied to the **real** gate source in the isolated worktree, `lint:finding-guards` run
against it, then restored and the restore verified:

```
  RED  S1P1-M8-STRICT      plant-applied=YES · exit 1 and NAMES this id · restored=YES
  RED  S1P1-M7-CODELINE    plant-applied=YES · exit 1 and NAMES this id · restored=YES
  RED  S1P1-M6-BOUNDARY    plant-applied=YES · exit 1 and NAMES this id · restored=YES
  RED  S1P1-M10-AUTHORING  plant-applied=YES · exit 1 and NAMES this id · restored=YES
  RED  D69-INVENTORY       plant-applied=YES · exit 1 and NAMES this id · restored=YES
  RED  S1P1-M9-VOCAB       plant-applied=YES · exit 1 and NAMES this id · restored=YES
  RED  S1P1-M9-ROUTING     plant-applied=YES · exit 1 and NAMES this id · restored=YES
```

⚡ **Seven of seven, where pass 2 measured seven of seven GREEN.** The remedy was applied in both of the
shapes B-1 proposed: the tokens were re-pointed at *the line that would have to change*, **and** six
behavioural scenarios were added to `test:gate-plants` (the seventh, `M9-ROUTING`, got an in-gate
self-check instead, which is stronger). Measured, live:

```
npx tsx scripts/test-gate-plants.ts
  gate plants — 11 scenarios, each proving its gate fails CLOSED
  ✅ lint:month-arithmetic  ✅ lint:local-dates  ✅ lint:glossary  ✅ lint:a11y-props  ✅ lint:type-scale
  ✅ lint:finding-guards [M7] · [M6] · [M8]        (all reason=MATCHED)
  ✅ lint:s1-coverage [M9-vocab] · [D69-inventory] (all reason=MATCHED)
  ✅ lint:secrets [M10-authoring]                  (reason=MATCHED)
  ✅ test:gate-plants — all 11 gates fail closed on a planted defect.
```

### The instruments, quoted not typed

```
npm run lint:s1-coverage     → ✅ 470 surface files classified · 331 unswept
npm run lint:finding-guards  → ✅ 79 of 95 findings carry a standing guard; 16 unguarded (cap 16)
npm run lint:secrets         → ✅ none across 1206 tracked files in index+HEAD (4 shapes, 2 exemptions, cap 2)
npm run lint:copy            → ✅ duplicate copy: no new cross-file phrases (3 baselined)
npx tsx scripts/preflight-native-lane.ts → ✅ 95 structural checks pass
npx tsx scripts/check-gate-freshness.ts  → ❌ exit 1 — recorded green describes 818f934 (EXPECTED mid-audit, [D74])
npm run test:app             → ✅ App-layer regression tests: ALL PASSED
```

⚠️ **`lint:gate-freshness`'s exit code was measured, not assumed.** `npm run … | tail` reports **tail's**
exit status, which is `0`; the gate's own is `1`. Run bare and redirected, it exits `1`.

---
### The suites, run at this pin — there was no current gate record, so I made one

⛔ **Everything below was run in the isolated worktree at `96d1f11` with a clean `git status` and
nothing else executing.** It is not a gate RECORD ([D74] — the record is written at convergence) but it
is a measurement of this tree.

```
npx playwright test --config apps/rn/playwright.audit.config.ts     →  310 passed (8.3m)     ✅
npm run test:app                                                    →  ALL PASSED            ✅
npm run lint:rn                                                     →  all 28 gates pass     ✅
npx tsx scripts/test-gate-plants.ts                                 →  11/11 fail closed     ✅
npx tsx scripts/check-gate-freshness.ts                             →  exit 1 (expected)     ⚠️
```

⚡ **310 of 310 e2e tests pass.** Pass 2 measured that CI had not run since `78c6020` and that four specs
had *never been executed by anything*; two more commits have landed since, `96d1f11` among them. **The
whole RN e2e suite is green at this pin**, and `lint:gate-freshness` is red for the reason its own text
gives — it is deliberately outside every chain (`run-gates.ts:70-71`, GAP-14), so *"all 28 gates pass"*
and *"freshness is red"* are both true and are not in tension.

---

## 3. SWEPT AND FOUND CLEAN — BY PATH

⛔ **Read this as "opened and checked at the parts named", not "every line read."** 109 files / 7,433
lines is more than a careful read of everything, and the brief says so.

### Carries a finding — swept, NOT clean

| path | finding |
|---|---|
| `apps/rn/src/widget/snapshot.ts` (`:40-62`, `:71-95`) | **D3-1**, **D3-2** |
| `apps/rn/src/liveActivity/paydayActivityContent.ts` (`:65-96`) | **D3-2** |
| `scripts/test-gate-plants.ts` (`:277`, `:281`) | **D3-3** |
| `scripts/check-committed-secrets.ts` (`:148-176`) · `scripts/finding-guards.json` (`REVERIFY4-2`) | **D3-4** |
| `apps/rn/tests/e2e/on-plan-streak.spec.ts` (`:27`, `:35`) | **D3-5** |
| `apps/rn/src/appIntents/drainPendingActions.ts` · `pendingActions.ts` (`:44`) | **D3-6** |
| `apps/rn/src/widget/widgetSync.test.ts` (`:52`) | **D3-7** |

### Read in full and clean at the blocker + major bar

- `apps/rn/src/widget/widgetSync.ts` — every refusal on the write path (`:30`, `:34`), the change-gate
  (`:46-49`), the launch mirror (`:57`) and the subscription (`:59-66`). It is *correct at what it does*;
  the finding is the payload it mirrors.
- `apps/rn/src/liveActivity/liveActivitySync.ts` — the sandbox refusal (`:29`), `areActivitiesEnabled`
  (`:37`), the debounce, and the four `LiveActivityAction` arms; `decideLiveActivityAction`
  (`paydayActivityContent.ts:124-136`) — start/update/end/none, and the `null` → `end`/`none` mapping the
  D3-2 remedy relies on.
- `apps/rn/src/appIntents/pendingActions.ts` — the whole defensive parser. **Not a defect and I measured
  it:** a non-finite or non-positive `amount`, a non-string `debtId`, an unknown `kind` and a repeated
  `id` in one payload are each dropped whole, never partially applied (`:52-58`).
- `apps/rn/src/appIntents/drainPendingActions.ts`, `pendingActionBridge{,.native,.types}.ts` — the read →
  parse → apply → clear order and every `try`/`catch`.
- `apps/rn/src/premium/purchases.ts` — the facade, `isPremiumActive` / `isLifetimeActive`, and the
  `introPrice` shape. `apps/rn/src/premium/introOffer.ts` — `introPrefix`, both branches: eligibility is a
  required argument, `'unknown'` renders plain pricing, and *"free"* is never said for a non-zero intro
  (`:43`). `premiumKind.ts` + `canManageSubscription` — the `unresolved` third state.
- `apps/rn/src/premium/premiumSync.ts` — never downgrades on a failed fetch (`:48-50`), waits for
  `isHydrated` (`:25`). ⚠️ I checked the one thing `premiumKind` depends on and could have been missing:
  `premiumResolved` is set by `setPremiumIsLifetime` (`store.ts:723`), which `apply` calls (`:39`), so the
  `unresolved` state does resolve. **A tested helper that IS called.**
- `apps/rn/src/premium/config.ts`, `legal.ts` — the kill-switch and the four URLs.
- `apps/rn/src/notifications/notificationCopy.ts`, `notifications.ts` (`:1-60`), `notifications.web.ts` —
  ⚡ **the risk push carries no figure and no verdict, deliberately** (`notificationCopy.ts:22-32`), so the
  `mayClaim` gap that produced D3-1/D3-2 has no third instance here. That is a design decision doing the
  work a guard would otherwise have to.
- `apps/rn/src/components/ui/Slider.tsx` — the whole file: `setFromX`'s clamp/step order (`:49-60`),
  `clampStep` (`:75`), the a11y value going through `a11yAdjustableValue` + `formatWhole` rather than a
  raw `$` template (`:105`), and the 44pt hit strip.
- `apps/rn/src/motion/CountUp.tsx` — the format ref, the Reduce-Motion path, and the fact that the
  animation lands on `value` exactly.
- `apps/rn/src/components/ui/RowContextMenu{,.ios,.types}.tsx` — `destructive` is presentation only;
  confirmation belongs to the consumer, and no consumer is bypassed from here.
- `apps/rn/tests/e2e/helpers/seed.ts` — every line. `scenario()` seeds `storeVersion: 5` against
  `CURRENT_STORE_VERSION = 7` (`models.ts:200`), so **every fixture in the suite runs the migrations**,
  which is what makes the `data-recovery` fixtures reach the repair layer at all. `day()`'s local-date
  body is correct and matches `@core/utils/localDate`'s rule.

### Read at the parts this job needed, and clean there

- `apps/rn/tests/e2e/amount-guards.spec.ts` — all three tests. ⭐ **The best-built spec on my route:** it
  asserts what landed in the **store**, not that an error appeared; its third test settles before
  asserting and its own comment records the plant that proved why (*"with the old guard planted back, this
  test PASSED while the other two went red"*). ⚠️ My first scan flagged its opening test as having zero
  `expect(` — that was **my regex**, which could not see `expect\n  .poll(`. Corrected before it became a
  finding.
- `apps/rn/tests/e2e/trials.spec.ts` — all four. ⭐ **Rule 2 satisfied deliberately:** `$15.99` (cents) and
  `$16` (whole) are the two members of the cents-convention class and both are asserted, with
  `toHaveCount(0)` on `$16.00` as the second direction. The converted/not-yet-converted pair differs only
  in the kick-in date.
- `apps/rn/tests/e2e/data-recovery.spec.ts` — the four tests the fix range added (`C4` `:381` + control
  `:402`, `C2` `:419` + control `:456`, `C3` `:473`, `C1` `:517` + control `:561`). Every absence
  assertion is preceded by a positive, and `C4`'s control is the discriminating one (a *real* `0` minimum,
  where the only difference from the defect is the repair record). ⚠️ `C3` has no in-file positive
  control; the finale's happy path lives in `celebration.spec.ts:200`.
- `apps/rn/tests/e2e/guardian.spec.ts` — the `D2-3` fix at `:100-104`, and all 13 tests re-run.
- `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` — the `B-3` fix at `:88-89`.
- `apps/rn/tests/e2e/expense-reserve.spec.ts` — the five money assertions (`:85`, `:126`, `:150`, `:240`,
  `:244`) and the fixture. `:240` and `:244` are the two directions of one class (smoothed shares are
  whole; the real bill keeps its cents).
- `apps/rn/tests/e2e/paywall.spec.ts` — both tests, and the reason the static prices are legitimate there:
  `paywall.tsx:151-156` sets `loadError` when the SDK is attached and the offering is empty, so the
  static fallback is unreachable on a device. ⚠️ **That branch has no e2e coverage and structurally cannot
  have any on web** (`client` is `null`), which the spec's own docstring states.
- `apps/rn/tests/e2e/windfall.spec.ts`, `swipe-mark-paid.spec.ts` (`:99-136`), `sheet-polish.spec.ts`,
  `on-plan-streak.spec.ts` — the absence-assertion audit below.
- `apps/rn/src/components/ui/TextField.tsx` — it is a pass-through for `keyboardType`; it parses nothing,
  so no money guard belongs in it.
- `apps/rn/src/premium/purchasesClient.ts`, `purchasesClient.web.ts`, `apps/rn/src/widget/widgetStorage{,.native}.ts`,
  `apps/rn/src/liveActivity/liveActivityBridge{,.native,.types}.ts`, `liveActivityKeys.ts`,
  `apps/rn/src/widget/widgetKeys.ts` — read for the platform-split re-export trap and the lazy
  `requireNativeModule`; all correct, all guarded.

### The mechanical sweeps, run over the whole route rather than sampled

```
absence assertions in the 35 routed spec files                     44
  … with NO positive assertion earlier in the same test             7
  … of those, genuinely vacuous after reading the helper/siblings   2   (on-plan-streak, D3-5)
tests with no expect() at all                                       1   (enh-audit-screens — a screenshot
                                                                         capture loop, correct as written)
test.skip / test.only / test.fixme in the routed specs              0
money-figure assertion lines across the routed specs               20   (enumerated in full, by file)
money formatters outside the app screens on this route              3 sites, all named above
```

### ⛔ Routed to me and NOT reached

Named, because silence reads as swept.

- `apps/rn/src/components/ui/` — **19 of 31 files unopened**: `AddRow`, `AppIcon{,.ios}`, `Button`,
  `Card`, `ChartSkeleton`, `CheckCircle`, `DateField{,.web}`, `EmptyState`, `MasterDetail`, `Pill`,
  `PressableScale`, `RadioGroup`, `SegmentedToggle`, `Select`, `SheetBackdrop`, `SheetScrim`,
  `SwitchRow`, `TwoColumn`, `sheet-styles.ts`. Checked only that **none of them formats or parses money**
  (grep for `formatWhole|formatCurrency|toLocaleString` over the whole route → 3 hits, all named above).
- `apps/rn/src/theme/` — all 7 files (`colors`, `elevation`, `icons`, `index`, `motion`, `spacing`,
  `typography`) unopened; they are covered by `lint:contrast`, `lint:type-scale` and `lint:icon-glyphs`,
  which pass in the chain run below, and none of them touches money.
- `apps/rn/src/motion/` — `Motion.tsx`, `haptics.ts`, `hooks.ts`, `index.ts` unopened (`CountUp` read).
- `apps/rn/src/keyCommands/` — all 4 files unopened; `keyCommandBus.test` passes in `test:app`
  (5 assertions).
- **e2e specs opened only for the mechanical sweeps, not read as tests**: `a11y-axe`, `a11y-row-labels`,
  `absorb-entry`, `ack-coordinator`, `analytics-optout`, `blur-glass`, `bnpl`, `celebration`,
  `earlyjourney`, `enh-audit-screens`, `greeting`, `hero-date-fit`, `ipad-layouts`, `money-add-chooser`,
  `payday-reopen`, `payoff-schedule`, `premium-entry`, `proofofwork`, `saveforit-pace`, `sheet-remove`,
  `spoken-state`, `strategy-compare`, `swipe-delete`, `trajectory-domain`, `trajectory-interactivity`,
  `variable-income`, `vis5-cone`. **All 27 ran in the full-suite execution below**; none was read line by
  line for the "which member of its class did it pick?" question.

---
## 4. MEASURED, AND NOT A DEFECT

### N1. ⚡ The 36 e2e specs were "never swept" and they are, with one exception, carefully built

This is the result I most expected to be wrong and it held. The specs I read line by line assert the
**store**, not the screen, wherever the defect lives in the store (`amount-guards`, `saveforit-pace`,
`absorb-entry`); they carry explicit controls; and several name the exact vacuity the brief's rules warn
about, in their own comments, having already been bitten by it:

- `amount-guards.spec.ts:76-79` — *"Settle before asserting, or this test passes for free. … Measured:
  with the old guard planted back, this test PASSED while the other two went red."*
- `strategy-compare.spec.ts:92-95` — *"`text.length > 0` IS WHAT LET C7's DEFECT SHIP … the takeaway was
  the literal string `"."`, which has length 1 and sailed through this assertion."*
- `absorb-entry.spec.ts:50` — *"The control: the log is empty first. A growth assertion against an
  already-populated log proves nothing."*
- `saveforit-pace.spec.ts:96` — *"Assert the VALUE, not merely that a goal exists: `Number("1,200")` is
  `NaN`, and a goal written with a `NaN` pace serialises to `null` — which is still a goal, and would
  satisfy a length check."*
- `payoff-schedule.spec.ts:195` — *"Both directions are asserted deliberately. A one-sided test passes an
  implementation that hardcodes 'the minimum'."* — rule 2, satisfied on purpose.

**No blocker or major in the construction of the routed e2e specs**, beyond `D3-5`'s two absence-only
tests and `D3-8`'s one weak assertion.

### N2. The static paywall prices are NOT reachable on a device — checked, because $29.99 in a spec looked like a hardcoded price

`paywall.spec.ts:25-27` asserts `$29.99` / `$79.99` / `$4.99` against `STATIC_PLANS`
(`paywall.tsx:74-76`). Those are a fallback, and the fallback is unreachable with the SDK attached:
`loadPlans` sets `loadError` when the offering yields no mappable packages (`:151-156`) and on a throw
(`:157`), and only the `!client` branch (`:137`) — web/dev — leaves the static list standing. ⚠️ **Stated
as a limitation rather than a clean bill:** that branch has no e2e coverage and structurally cannot have
any on web, because `client` is `null` there. Its only guard is a human reading the diff.

### N3. The risk push carries no figure, so `D3-1`/`D3-2`'s class has no third instance in notifications

`notificationCopy.ts:22-32` — `RISK_NOTIFICATION` is a neutral prompt by design: *"never a verdict a
reconcile-to-clear would turn into cried-wolf, and never a figure (the hedged number stays in-app)."*
Verified there is no other copy source: `notifications.ts` re-exports it (`:9-11`) and formats no money
(grep for `formatWhole|formatCurrency|toLocaleString` over `apps/rn/src/notifications` → **0 hits**).

### N4. `widgetSync.test.ts`'s `Debt-free` case pins the HONEST state, so the `D3-1` fix does not red it

`:56-61` seeds `balance: 0, originalBalance: 8000` and **no** `pendingDataRepairs`, so
`mayClaim(store, 'debt-balances')` is `true` and the guarded `cleared` is still `true`. I checked this
before proposing the remedy, because a fix that reds an existing green is how a blocker gets argued back
open.

### N5. The four self-ratcheting constants have ZERO slack today — the whole class enumerated, not sampled

Pass-2's `B-2` was about a `>` cap acquiring slack. The comparison operators across every gate script:

```
!==  check-audit-closure.ts:200, :271   (both FIXED in this range)
!==  check-committed-secrets.ts:319 (MAX_EXEMPT)
!==  check-finding-guards.ts:224 (MIN_ENTRIES), :234 (MAX_UNGUARDED)
<    preflight-native-lane.ts:584 (MIN_CHECKS = 95)   → measured: 95 checks ran. Equal. No slack.
<    test-gate-plants.ts:307 (MIN_SCENARIOS = 11)     → measured: 11 scenarios.  Equal. No slack.
>    surface-coverage.ts:446 (MAX_INVISIBLE = 0)      → `> 0` on a non-negative count IS `!== 0`.
```

⚠️ The two `<` floors become the `B-2` shape the moment a check or a scenario is added without bumping
the constant. Today neither is slack, so no instrument is blinded → not a finding.

### N6. `pendingActions`' parser is genuinely defensive — measured on the whole class, not the example

`parsePendingActions` drops, whole and without partial application: a non-array, unparseable JSON, an
unknown `kind`, a missing/empty `id`, a repeated `id` in one payload, a non-string `debtId`, and an
`amount` that is non-numeric, non-finite (`NaN`, `Infinity`) or `<= 0` (`:33-64`). The one thing it does
not do is remember across calls — that is `D3-6`.

### N7. `lint:s0-coverage` and `eslint` failed in my first gate-chain run, and BOTH failures were mine

Recorded so the next pass does not read a red into the pin. `npm run lint:rn` in the worktree returned
`❌ 2 of 28 gates FAILED — eslint (apps/rn), lint:s0-coverage`. The cause was three probe files I had
written into `apps/rn/src/testing/`:

```
UNCLASSIFIED  apps/rn/src/testing/__probeD.ts   — new on the surface; record who swept it, or "never"
UNCLASSIFIED  apps/rn/src/testing/__probeD2.ts  — new on the surface; record who swept it, or "never"
UNCLASSIFIED  apps/rn/src/testing/__probeD3.ts  — new on the surface; record who swept it, or "never"
```

⚡ **That is `D69-INVENTORY` working, live and unplanted** — three new files under a surface root, caught
on their first gate run. With the probes deleted, `eslint` exits 0 and `s0-coverage` prints
`✅ 97 surface files classified · 50 unswept`.

### N8. Ten `enh-audit-screens` "tests" carry no assertion at all, and that is correct

`enh-audit-screens.spec.ts:43` is a 2-themes × 5-surfaces screenshot capture loop — it navigates,
waits 900 ms and calls `page.screenshot`. **Ten tests that cannot fail.** They are a capture harness, not
tests, and the class a blank capture would represent is covered by `route-smoke.spec.ts` over **exactly
the same five paths** (`/`, `/progress`, `/money`, `/more`, `/paywall`), which asserts rendered content.
Not a finding; recorded so the next pass does not spend the time I did confirming it.

### N9. The C3 finale has a positive control — it is in the other file

`data-recovery.spec.ts:473` (`C3`, the finale must NOT fire over an unread balance) has no in-file
counter-fixture, which is the shape that usually means *the fix bought its correctness by refusing to
speak*. It did not: `celebration.spec.ts:200` — *"a FREE user who clears their LAST debt gets the
finale"* — asserts `getByRole('button', { name: 'Continue' })` **visible** on a fully-read portfolio, and
both files ran green in the same 310-test execution. Both directions of the class are covered; they are
just not adjacent.

### N10. My own first full e2e run reported 85 failures and every one of them was my fault

⛔ **Recorded because an 85-failure number in an audit file would be believed.** The failures began at
`progress-*` and covered everything alphabetically after it, including `route-smoke: / renders
(non-blank)` for **every** route. The error was `net::ERR_CONNECTION_REFUSED at http://localhost:4519/` —
the dev server had died, because I had started `npm run lint:rn` in the same worktree while the suite was
running. The re-run below was done with nothing else executing. **This is the same shape as rule 11 one
level up: the measurement apparatus is where the next wrong finding comes from.**

⚡ **The clean re-run: `310 passed (8.3m)`, zero failures.** ⛔ **The 85 is not a property of this tree and
must not be carried forward.**
