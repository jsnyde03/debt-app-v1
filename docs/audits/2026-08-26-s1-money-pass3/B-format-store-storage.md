# S1 pass 3 — auditor B · format · store · storage

**Pin:** `96d1f11` · branch `v1.7-dev` · verified `git rev-parse HEAD` → `96d1f116fe3c7cad5fc5e47d3c53fb84bb21e3a1`, working tree clean except this audit directory.
**Route:** `ROUTING-B.txt` — 81 files, 6,669 lines. `packages/core/{utils,payCycle,recurrence,storage}` · `apps/rn/src/{utils,store,storage,lib,analytics,config,types}`.

⚠️ **Note on the route as generated.** The manifest's 24 `apps/rn/src/store/*` entries are **all `.test.ts`** — the store's production files (`store.ts`, `*Selectors.ts`) are not on this manifest. My store ground is therefore the store's **test suite**, read as instruments (rules 2, 6, 7), not the selectors themselves.

---

## SUMMARY — **1 blocker · 4 majors · 2 minors**

| id | severity | where | one line |
|---|---|---|---|
| **B3** | 🔴 **blocker** | `storage/cloudBackup/service.ts:143-145` | an `unknown` remote passes the clobber guard and the guard **overwrites the other device's backup**, reports success, and then bricks every later backup |
| **B1** | 🟠 major | `scripts/check-money-format.ts:70` | the money gate's two `Intl` patterns **cannot fire on any real call** — plant-proven — and it is green over two live hand-rolled formatters |
| **B2** | 🟠 major | `entities/DebtSheet.tsx:223` · `onboarding/FirstDebtOrBillStep.tsx:55` | the RN hand-entry form is the **only** APR path with no `0–100` bound; `2599` saves as 2599% APR |
| **B4** | 🟠 major | `storage/createAdapter.web.ts:32-38` | unparseable bytes read as "first launch" instead of quarantine, and the one e2e for the class seeds **valid JSON** |
| **B7** | 🟠 major | `utils/scrubBreadcrumb.ts:21` · `scrubBreadcrumb.test.ts:52` | the breadcrumb scrub redacts the amounts and lets the **creditor names** through, and its own test pins that as correct |
| **B5** | 🟡 minor | `analytics/funnel.test.ts:67` | the last **live** copy of the comment-stripper S0 replaced, in the tree that sweep did not walk |
| **B6** | 🟡 minor | `analytics/funnel.ts:10-13` vs `:40,45` | the "no free-form string, no number" privacy invariant is false of two of the file's own eight events |

⛔ **Two standing S0 caveats are still OPEN and must not be read as clean** — `REVERIFY4-2` is
`CLOSED-UNPINNED`, and `REVERIFY4-3`'s guard **prints, it does not red**. Both re-measured at this pin (§2).

⚠️ **`git status` at the end shows `docs/DEBT_ELEVATION_{BACKLOG,LOG,PLAN}.md` as modified.** Those are not
mine — I edited **no** file outside `docs/audits/2026-08-26-s1-money-pass3/`; they were already moving in
the working tree while this ran. No source file was touched.

*(This file was written incrementally; sections were appended as measurements completed.)*

---

## 1. FINDINGS

### B1 · `major` · `scripts/check-money-format.ts:70` — the money gate's two `Intl` patterns **cannot fire on any real call**, and it is green over two live hand-rolled formatters

**User-facing consequence.** The gate that exists to keep the app at two money formatters cannot see the
most common way one is written, so the next file-local `money(n)` — with the `Math.max(0,…)` clamp and the
missing `Number.isFinite` guard that made three of the original nine render `$-45`, `$0.00` and `$NaN` —
ships green, and a user reads a wrong dollar figure that no instrument objected to.

**What I measured.** A faithful plant: `scripts/check-money-format.ts` and `scripts/lib/stripCode.ts` copied
byte-for-byte into a scratch tree with the same `packages/core` + `apps/rn/src` layout and the repo's
`node_modules` junctioned in, so the **real script** runs unmodified over planted files.

```
$ npx tsx scripts/check-money-format.ts            # control, clean tree
✅ money-format: no hand-rolled currency formatters (5 shapes checked).      exit=0

# POSITIVE CONTROL — the plant the gate does catch (proves the harness is live)
apps/rn/src/components/plan/PlantCard.tsx:  const label = `$${n}`;
$ npx tsx scripts/check-money-format.ts
❌ money-format: 1 hand-rolled money formatter(s).
  apps\rn\src\components\plan\PlantCard.tsx:2  a $-prefixed template interpolation (hand-rolled money)
                                                                             exit=1

# PLANT 2 — a TENTH hand-rolled formatter, written the way the two sanctioned ones are
function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(Math.max(0, n));
}
$ npx tsx scripts/check-money-format.ts
✅ money-format: no hand-rolled currency formatters (5 shapes checked).      exit=0    ← GREEN

# PLANT 3 — the same thing on ONE line, i.e. the shape the regex was written for
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
$ npx tsx scripts/check-money-format.ts
✅ money-format: no hand-rolled currency formatters (5 shapes checked).      exit=0    ← ALSO GREEN
```

⛔ **The mechanism is not "the regex is applied per line".** That was my first hypothesis and it is wrong —
plant 3 is one line and still green. Rule 3, caught by printing:

```
$ node regex.js
no      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
no      new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)
no      const o = { style: 'currency' }; new Intl.NumberFormat('en-US', o)
MATCH   new Intl.NumberFormat() ; style: 'currency'
```

`/new Intl\.NumberFormat\([^)]*\)[\s\S]{0,120}?style:\s*['"]currency['"]/` — `[^)]*\)` consumes **through the
first `)`**, which in every real call is the formatter's own closing paren, and `style:` lives *inside* those
parens. The pattern therefore requires `style: 'currency'` to appear **after** the call closes. The only
string that satisfies it is not a formatter. **Line-splitting is a second, independent reason the multi-line
form fails; the regex is unsatisfiable either way.** Both facts must be fixed, not one.

**It is not hypothetical — it is green over two live sites today.** Counting the *whole* result, not a
`head` (rule 5):

```
$ git grep -n "Intl.NumberFormat" -- apps/rn/src packages/core
apps/rn/src/utils/format.ts:16                        (EXEMPT — sanctioned)
packages/core/forecast/projectForecast.ts:122         ← not exempt, not a test harness
packages/core/insights/buildSmartInsights.ts:144      ← not exempt, not a test harness
packages/core/utils/formatCurrency.ts:54              (EXEMPT — sanctioned)
4
```

`formatForecastCurrency` (3 call sites, `projectForecast.ts:69,107,111`) and `formatInsightCurrency`
(**13** call sites, `buildSmartInsights.ts:47,48,56,57,63,78,79,80,93,94,99,109`) are formatters three and
four, inside a root the gate walks, and both carry exactly the drift the gate's own docblock describes:

```
$ node fmt.js
1240       formatCurrency=$1,240      hand-rolled=$1,240.00      ← the cents straddle (L4-1/3/4/5/9)
1240.37    formatCurrency=$1,240.37   hand-rolled=$1,240.37
-45        formatCurrency=-$45        hand-rolled=$0.00          ← the "hide money" clamp
NaN        formatCurrency=$0          hand-rolled=$NaN           ← no Number.isFinite guard
Infinity   formatCurrency=$0          hand-rolled=$∞
```

⚠️ **The severity is `major`, not `blocker`, and the reason is measured, not assumed.** Neither module is
imported by the RN app: the only `apps/` mention of either name is `analysisSelectors.ts:139,147`, and both
are **comment text** ("intentionally NOT surfaced"). I did not take the comment as proof (rule 1) — I checked
for an import:

```
$ git grep -ln "projectForecast\|buildSmartInsights" -- apps
apps/rn/src/store/analysisSelectors.ts        # comment lines 139 and 147 only; no import statement
```

The live consumer is `components/SnowballSection.tsx`, the legacy root tree. So the shipping consequence is
the **blinded gate**, not these two strings — which is precisely the brief's definition of `major`.

**Remedy.** Replace the two `Intl` patterns with an AST check — the file already imports `typescript` and
already does AST work for JSX (`jsxDollarSites`). Match `NewExpression` on `Intl.NumberFormat` whose object
literal argument carries `style: 'currency'`, in any file that is not `EXEMPT`. Then close the two sites the
new check reds on (or exempt them with a stated reason). ⛔ **Do not "fix the regex"** — a corrected regex
still cannot see `const o = {style:'currency'}; new Intl.NumberFormat('en-US', o)` (third row above), and
the gate's own header already records that a regex "physically cannot see" the JSX case for the same reason.

**Direction of the justification.** It runs *gate → class*: the gate claims a class is impossible and the
class is present twice. The opposite direction — "these two sites are harmless, therefore the gate is fine" —
does not apply, because the gate's value is the *next* formatter, and its docblock states the count went
6 → 7 → 9 precisely because instruments kept under-counting this class.

---

### B2 · `major` · `apps/rn/src/components/entities/DebtSheet.tsx:223-226` + `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:55-67` — the RN add/edit-debt form is the **only** APR entry path with no `0–100` bound

**User-facing consequence.** A user who types their 25.99% APR without the decimal point — `2599`, the
commonest slip on a `decimal-pad` field labelled *"APR %"* — has it saved and planned against as **2599%**,
so the app states a $5,000 card accrues **$10,829.17 of interest a month**, ranks it first under avalanche,
and quotes a debt-free date and an "interest saved" figure computed from it — while the CSV import, the
statement scanner and the v1.6 form all refuse the same value.

**What I measured.** ⛔ **Judged by enumerating the entry paths, not the spellings** (rule 4). The whole
result, not a `head` (rule 5):

```
$ git grep -rn "apr.*100\|100.*apr" -- apps/rn/src packages/core   (non-comment, non-test)
packages/core/debt/calculateMonthlyInterest.ts:9    apr / 100 / 12                 (consumer, not a guard)
packages/core/debt/parseDebtFormValues.ts:47        apr > 100  → null              ← legacy ROOT form
packages/core/imports/debtCsv.ts:287                apr < 0 || apr > 100 → error   ← CSV import
packages/core/scan/parseStatementText.ts:113        aprNum >= 0 && aprNum <= 100   ← statement scan

$ git grep -n "addDebt(\|updateDebt(" -- apps/rn/src   (excluding store.ts and tests)
DebtSheet.tsx:180,191 · ImportDebtsSheet.tsx:80 · FirstDebtOrBillStep.tsx:69 · demoRun.ts:69
```

Four ways an APR reaches the store. `ImportDebtsSheet` goes through `debtCsv` (bounded); `demoRun` is
seeded. **The two hand-entry paths are the unbounded ones** — `DebtSheet.tsx:223` and
`FirstDebtOrBillStep.tsx:55` both call `parseOptionalAmount(apr)` (the shared MONEY parser) and then test
only `aprN == null`. Printed side by side:

```
$ npx tsx apr.ts
typed "25.99"    RN form apr=25.99     legacy form=apr 25.99   | monthly interest on a $5,000 card = $108.29
typed "2599"     RN form apr=2599      legacy form=REFUSED     | monthly interest on a $5,000 card = $10829.17
typed "1999"     RN form apr=1999      legacy form=REFUSED     | monthly interest on a $5,000 card = $8329.17
typed "5,5"      RN form apr=55        legacy form=apr 55      | monthly interest on a $5,000 card = $229.17
typed "100"      RN form apr=100       legacy form=apr 100     | monthly interest on a $5,000 card = $416.67
typed "101"      RN form apr=101       legacy form=REFUSED     | monthly interest on a $5,000 card = $420.83
typed "999999"   RN form apr=999999    legacy form=REFUSED     | monthly interest on a $5,000 card = $4166662.5
```

⚡ **A test asserts this guard and still passes** — `packages/core/debt/testParseDebtFormValues.ts:39`
(*"APR > 100 rejected"*) and `:43` (*"APR exactly 100 accepted"*). Rule 2: **the test picked the one member
of the class that works.** `parseDebtFormValues` has exactly one live consumer and it is
`components/DebtsSection.tsx` — the **legacy** root tree:

```
$ git grep -ln "parseDebtFormValues" -- apps packages components app lib
apps/rn/src/data/migrations.ts        (comment references only, lines 72 and 77)
components/DebtsSection.tsx           ← the only import outside core's own test
packages/core/debt/parseDebtFormValues.ts
packages/core/debt/testParseDebtFormValues.ts
```

So the guard and its green test travelled with v1.6 and **did not cross to the RN tree**, while the RN tree
kept the *error string* for the same field (`obligationForm.ts:106`, `FORM_ERRORS.aprInvalid`) and narrowed
what triggers it to "unparseable". `trustSelectors.ts:100` states the intended parity in its own words —
*"the import path doing what `FORM_ERRORS.aprInvalid` exists to refuse on the form path."*

⚠️ **A near-miss on the same parser, which I checked and am NOT reporting** (rule 8 — the observation, the
premise and the remedy fail independently). `parseOptionalAmount`'s docblock at
`amountField.ts:49-51` reads as though a mistyped `"5,5"` APR is refused; it is not —

```
"5,5"        positive=55       optional=55       nonNeg=55
```

My first reading was that the docblock had gone stale under the code. **It has not.** `55` is the
*decided* answer, asserted by name:

```
packages/core/utils/testAmountField.ts:61
  eq(parseOptionalAmount('5,5'), 55, 'a comma in an APR is stripped, not silently zeroed');
```

The docblock's point is only that blank and unparseable stopped collapsing together, and that is true.
It is worth stating here because it is what makes the bound in B2 load-bearing rather than optional: a
comma slip lands *inside* a plausible range and nothing downstream will question 55%.

**Remedy.** Bound the rate where the rate is *entered*, not in `parseOptionalAmount` (which serves every
money field and must not learn about percentages — `debtCsv.ts:249` already argues this). Add
`if (aprN > 100) return setError(FORM_ERRORS.aprOutOfRange)` at both hand-entry sites with a message naming
the range, mirroring `debtCsv.ts:288`. ⚠️ Read the three lines above the site before patching (rule 9):
`DebtSheet.tsx:180` returns early on the edit path and `:191` on the BNPL path, so a guard placed after the
`isEdit` return will not cover an edit.

**Direction of the justification.** It runs *product decision → missing path*: the product decided
`0 ≤ apr ≤ 100` on three paths and states it in a user-facing error string on the fourth. The opposite
direction — "no bound is the deliberate choice, and the other three are over-strict" — is refuted by
`FORM_ERRORS.aprInvalid` existing on the form path at all, and by `parseDebtFormValues`' test asserting the
bound as a requirement rather than a convenience. ⚠️ I am **not** claiming a bound of exactly 100 is right
for BNPL or for a payday-style product; the finding is that this path enforces *nothing*, up to 999999%.

---

### B3 · `blocker` · `apps/rn/src/storage/cloudBackup/service.ts:143-145` — an `unknown` remote is let through the clobber guard, and the guard **writes over it**

**User-facing consequence.** When iCloud is reachable but `stat()` fails — the exact "file exists, not yet
materialised on this device" window a fresh install restoring from iCloud lives in — the guard that exists to
stop B3 permits the write, so the user's other device's backup is **overwritten without being shown to
them**, the sheet reports *"Backed up"*, and every later automatic backup is then refused forever because the
install recorded its own clock as the file's identity.

**What I measured.** ⛔ The docblock at `service.ts:134-135` states the safety property explicitly —
*"An `unknown` remote (iCloud unreachable) is allowed through to `backupToCloud`, **which refuses it at the
availability check and returns `unavailable`**"*. Rule 1: I did not take it. I ran it, against the real
module, with a fake provider:

```
$ cd apps/rn && npx tsx --tsconfig ./tsconfig.json cloud.ts
foreign        inspectRemote=unclaimed  guarded={"ok":false,"reason":"remote-unclaimed",…}  writes=0
unavailable    inspectRemote=unknown    guarded={"ok":false,"reason":"unavailable"}         writes=0
stat-throws    inspectRemote=unknown    guarded={"ok":true,"at":"2026-08-26T22:47:44.973Z"} writes=1  <<< GONE

remote after the stat-throws run:
  {"cloudFormat":"debt-planner-cloud-backup","cloudFormatVersion":1,"codec":"plaintext","payload":"{…
```

**The docblock is right about one of the two ways `unknown` is produced and wrong about the other.**
`inspectRemote` returns `unknown` from `isAvailable() === false` **and** from its `catch` (`service.ts:120`).
The first is refused downstream. The second is not: `backupToCloud` re-checks `isAvailable()`, which is
`true`, and writes. `backupToCloudGuarded` treats `unknown` and `ours` identically — it only branches on
`unclaimed` (`service.ts:144`).

**`stat()` throwing while `isAvailable()` is `true` is not hypothetical on the shipping platform.** iOS's
`stat` is two native calls plus a date construction (`createCloudBackupProvider.ios.ts:87-91`):

```ts
async stat(): Promise<CloudBackupMetadata | null> {
  if (!(await CloudStorage.exists(BACKUP_PATH, SCOPE))) return null;
  const s = await CloudStorage.stat(BACKUP_PATH, SCOPE);
  return { modifiedAt: new Date(s.mtimeMs).toISOString() };   // ← throws on a missing/NaN mtimeMs
}
```

```
$ node d.js
undefined  -> THROWS RangeError: Invalid time value
NaN        -> THROWS RangeError: Invalid time value
null       -> 1970-01-01T00:00:00.000Z
0          -> 1970-01-01T00:00:00.000Z
```

⚠️ Note the last two rows: an absent `mtimeMs` that arrives as `null` or `0` does **not** throw — it
silently becomes `1970-01-01`, which `inspectRemote` then compares as a real identity. Both directions of
that field are unhandled. Meanwhile `isAvailable()` **cannot** throw (`ios.ts:76-79` swallows and returns
`false`), so "available but un-stat-able" is a reachable pair by construction, not by accident.

**The second half: the install bricks its own backup.** `use-cloud-backup.ts:130` stamps
`cloudBackupRemoteAt: result.at` under the comment *"`result.at` is the observed mtime, not our clock — see
`backupToCloud`."* On this path it **is** our clock (`service.ts:66`'s `?? now.toISOString()` fallback):

```
$ cd apps/rn && npx tsx --tsconfig ./tsconfig.json cloud2.ts
1. guarded backup while stat throws : {"ok":true,"at":"2026-08-26T22:48:36.752Z"}
   writes                            : 1 (the other device's file is gone)
   file's REAL mtime now             : 2026-08-26T12:00:00.000Z
   claim recorded by the hook        : 2026-08-26T22:48:36.752Z
   claim === real mtime?             : false
2. next automatic backup            : {"ok":false,"reason":"remote-unclaimed",…}  writes=1
3. next automatic backup            : {"ok":false,"reason":"remote-unclaimed",…}  writes=1
```

That is precisely the regression `service.test.ts:333-336` names — *"every later backup is refused as a
foreign clobber, and the feature bricks itself"* — reached through a path that test does not take.

**⚡ The test that covers this line reports on the member of the class that works** (rule 2).
`service.test.ts:302-308` builds a `throwing` provider and asserts exactly one thing:

```ts
eq((await inspectRemote(throwing, undefined)).state, 'unknown', 'a throwing stat is contained as `unknown`');
```

It stops at `inspectRemote`. **No assertion anywhere in the file calls `backupToCloudGuarded` with a
throwing stat, and none asserts `writeCount` on an `unknown` claim** — the two `writeCount` assertions
(`:323`, `:329`) are both on the `unclaimed` provider. And case 4's `first.at === state.modifiedAt` (`:344`)
uses `clockedProvider`, whose `stat` always succeeds, so the `?? now.toISOString()` fallback is never
executed by any test in the suite. `npm run test:app` is **green** at this pin with the defect present,
which by the brief's rule makes the test file's coverage of this function `major` in its own right; I am
folding it into this blocker rather than double-counting.

**Remedy.** Refuse `unknown` in `backupToCloudGuarded` — it is the only caller that can distinguish it:

```ts
const claim = await inspectRemote(provider, store.prefs?.cloudBackupRemoteAt);
if (claim.state === 'unclaimed') return { ok: false, reason: 'remote-unclaimed', remoteAt: claim.at };
if (claim.state === 'unknown')   return { ok: false, reason: 'unavailable' };   // ← the missing line
return backupToCloud(store, provider, codec, opts);
```

⚠️ **Do not fix it in `backupToCloud`** (rule 9 — read around the site): `backupToCloud` is deliberately the
*unguarded, informed* path (`service.ts:41-42`, and `use-cloud-backup.ts:125`'s `replaceUnclaimed` branch),
and hardening it would break the "the user read the date and chose to replace it" flow that
`service.test.ts:326-329` pins. Separately, harden `ios.ts:90` against a non-finite `mtimeMs`
(return `null` rather than an epoch date or a throw), and add the two missing assertions: `writeCount === 0`
for a guarded backup over an `unknown` claim, and an `at` assertion that exercises the stat-after-write
fallback.

**Direction of the justification.** It runs *guard contract → behaviour*: the module's own stated contract
is "an implicit backup must never destroy an unaccounted-for copy", and one of the four `RemoteClaim` states
does destroy one. The opposite direction — "`unknown` should be permissive because refusing it would block
backups whenever iCloud is flaky" — is refuted by the file's own reasoning at `service.ts:86-88`: *"the
failure direction is also the safe one: a mtime that moved for a reason other than a foreign write makes us
ASK, and asking never destroys."* A refused backup is recoverable on the next background; an overwritten
remote is not.

---

### B4 · `major` · `apps/rn/src/storage/createAdapter.web.ts:32-38` — the web adapter reports **unparseable** bytes as "first launch", and the one e2e for the class picked the member that works

**User-facing consequence.** On the web build, a store blob that is corrupt in the ordinary way — a write
truncated by a killed tab or a quota error — is read as *"nothing is stored"*, so the user is dropped into
onboarding with no warning, nothing is quarantined, and the first autosave overwrites the last copy of their
plan — the exact silent wipe `data-recovery.spec.ts` exists to prove cannot happen.

**What I measured.** The two implementations of one `StorageAdapter` contract disagree on the same bytes:

```
$ cd apps/rn && npx tsx --tsconfig ./tsconfig.json adapters.ts
the e2e's corrupt blob (VALID json)    | web adapter read() = string -> runMigrations refuses -> QUARANTINED
a TRUNCATED write (invalid json)       | web adapter read() = null  -> FIRST LAUNCH; nothing quarantined; next save overwrites
garbage bytes                          | web adapter read() = null  -> FIRST LAUNCH; nothing quarantined; next save overwrites
a real store                           | web adapter read() = object -> hydrates

native adapter (createAdapter.ts) for the same bytes:
  JSON.parse in a try; on throw it `return raw` (the string) -> runMigrations refuses -> QUARANTINED
```

`createAdapter.ts:28-34` states the doctrine and implements it — *"Corrupt bytes: hand the raw string back so
the store's hydrate → runMigrations throws → the blob is quarantined (never silently dropped)."*
`createAdapter.web.ts:33-38` has a single `catch { return null }` around **both** `getItem` (the private-mode
degradation the docblock is about) **and** `JSON.parse` (a corrupt blob, which is a different answer).
`adapter.ts:14` writes the contract as *"never lose the user's bytes"*.

**The follow-on is the loss, not just the omission.** `persistence.ts:62` branches on the same value —
`if ((await adapter.read()) === null) ({ seed } = await runLegacyBridge(...))` — under the comment *"only
when RN storage is genuinely empty"*. A corrupt blob is not genuinely empty, so on this path the app runs
the v1.6 legacy import against a device that already had a v1.7 store, and then autosaves over the bytes.

**⚡ Rule 2, exactly.** `data-recovery.spec.ts:54-61` is the one test of "bytes the app cannot open", and its
`seedCorrupt` writes:

```ts
{ key: KEY, blob: JSON.stringify('this is not a store') }
```

That is **valid JSON** — a JSON string. `JSON.parse` succeeds and returns `'this is not a store'`, which
`runMigrations` then refuses. It is the one member of the class on which the web adapter and the native
adapter agree, and the whole `data-recovery.spec.ts` suite (10 tests at this pin, all green) rests on it.
Change the blob to `'{"debts":[{"id":"d1","balance":12'` and the spec is asserting against a build that
silently onboards. ⛔ And it is the *only* coverage — counting the whole result (rule 5):

```
$ git grep -ln "createStorageAdapter" -- apps packages
apps/rn/src/app/_layout.tsx
apps/rn/src/storage/adapter.ts
apps/rn/src/storage/createAdapter.ts
apps/rn/src/storage/createAdapter.web.ts
```

**Neither adapter has a unit test.** `MemoryStorageAdapter` (`adapter.ts:28`) is what every store test uses,
and it has no parse step at all, so no test in either runner executes a `JSON.parse` of a persisted blob.

⚠️ **Scope, stated honestly.** iOS ships the native adapter, which is correct, so I am **not** claiming an
iOS data-loss path — that is why this is `major` and not `blocker`. What I can prove is (a) the web build,
which is where the entire Playwright suite runs and what `apps/rn/dist` exports, violates the stated
contract, and (b) the class has no test on either platform. Whether the RN web export is served to end users
is outside my route; if it is, re-rate this to `blocker` rather than re-measuring it.

**Remedy.** Split the two catches in `createAdapter.web.ts`:

```ts
async read() {
  let raw: string | null;
  try { raw = backing()?.getItem(KEY) ?? null; } catch { return null; }   // storage unavailable
  if (raw === null) return null;                                          // genuinely empty
  try { return JSON.parse(raw); } catch { return raw; }                   // corrupt → quarantine, as native
}
```

and add the missing member to `seedCorrupt` as a second fixture — ⛔ **as an additional test, not by
changing the existing blob**: the valid-JSON member is itself a real case and dropping it would trade one
uncovered member for another.

**Direction of the justification.** It runs *contract → implementation*: `adapter.ts` and `createAdapter.ts`
both state quarantine-don't-destroy for unreadable bytes, and one implementation of that interface does not
do it. The opposite direction — "returning `null` is the correct web degradation" — is the argument for the
`getItem` catch and is right there; it is not an argument for the `JSON.parse` catch, and the fix above keeps
the first while closing the second.

---

### B5 · `minor` · `apps/rn/src/analytics/funnel.test.ts:67` — the last live copy of the comment-stripper S0 replaced, in the app tree the sweep did not reach

**Consequence (why it is `minor`, not `major`).** The guard it weakens still fires on every realistic
spelling I could construct; only a `//` *inside a string, earlier on the same line as the call* hides it.
No user-visible consequence and the instrument is degraded rather than blinded, which is the brief's own
line for `minor`.

**What I measured.** `check-money-format.ts:84-88` records the fix — *"This file used to carry the
`(^|[^:])//` pair … Six gates carried that pair after the 'fix' that named it"* — and that sweep went
through `scripts/`. Counting the **whole** result across all three trees (rule 5):

```
$ git grep -n '\^|\[\^:\])' -- scripts apps packages
apps/rn/src/analytics/funnel.test.ts:67    ← LIVE CODE
scripts/check-glossary.ts:63               (docblock prose — the file uses stripCommentsOnly)
scripts/check-local-dates.ts:55            (docblock prose)
scripts/check-money-format.ts:85           (docblock prose)
scripts/check-native-a11y-props.ts:81      (docblock prose)
scripts/check-press-opacity.ts:59          (docblock prose)
6
```

Five of six are the *note about* the fix; one is the pattern itself, and it is in `apps/rn/src`, which the
`scripts`-scoped sweep never walked. Behaviour, printed:

```
$ node strip.js
SEEN   | setFunnelSink(makeSink('a//b'));                       -> call precedes the //
MISSED | const p = 'assets//x'; setFunnelSink(makeSink(p));      -> the rest of the line is blanked
SEEN   | if (u === 'https://x') setFunnelSink(s);                -> [^:] protects this one case only
MISSED | // setFunnelSink(s);                                    -> correct: a real comment
```

The guard's own failure message says what is at stake — *"a sink is being installed, so the 'Share anonymous
usage' control must return to More in this same commit, and the live privacy page's 'no behavioral
analytics' claim must be retired with it."*

**Remedy.** Use the shared owner. `scripts/lib/stripCode.ts` already exports `stripCommentsOnly` and ten
gates import it; this one test re-derives it. ⚠️ It is under `apps/rn/src` and the scripts lib is at the
repo root, so the honest fix is either a relative import or a copy that carries the same test — not a
silent re-derivation, which is how this pattern reached six files.

**Direction of the justification.** *Owner exists → copy diverged.* The opposite direction — "the app tree
should not reach into `scripts/`" — is a real objection to the import, not to the finding; it argues for
where the shared code lives, not for keeping the known-broken regex.

---

### B6 · `minor` · `apps/rn/src/analytics/funnel.ts:10-13` vs `:40,45` — the privacy invariant the file states about itself is not true of its own types

**Consequence (why `minor`).** Nothing is sent — `sink` is `null` and `funnel.test.ts:80-85` reds the moment
a production caller of `setFunnelSink` appears — so there is no user-visible consequence today. It is
recorded because the docblock is the *stated review surface* for a privacy claim, and a Phase-6 privacy
audit that reads it will be reading something false.

**What I measured.** The claim, verbatim (`funnel.ts:10-13`):

> **No financial data — by CONSTRUCTION, not by review.** Every event's payload is a closed union of
> literals below. There is no `Record<string, unknown>`, **no free-form string, and no number anywhere in
> this file's types**, so a balance, a paycheck, a debt name or a date cannot be passed even by mistake.

Two of the eight events contradict it in the same file:

```
funnel.ts:40   | { name: 'demo_stage'; stage: string }        ← a free-form string
funnel.ts:45   | { name: 'tutorial_skipped'; beat: number }   ← a number
```

⚠️ **The practice is safe and I checked it rather than assuming** (rule 1, the inverse direction — a
docblock is not proof of *mis*behaviour either). Every call site passes a closed value:

```
$ git grep -n "track({" -- apps/rn/src   (production only)
demo.tsx:71          source: from === 'welcome' || from === 'paywall' ? from : 'direct'
demoSession.ts:114   stage: s.id                 ← s ∈ DEMO_STAGES, a module constant
demoSession.ts:117   name: 'demo_completed'
demoExit.ts:35       (ExitReason union)
tutorialSession.ts:178,261,262   audience: run · beat: index   ← a step index, not money
```

**Remedy.** Either narrow the two types (`stage: (typeof DEMO_STAGES)[number]['id']`, `beat: number` kept
with an explicit "an index, not an amount" note), or amend the docblock to state the invariant that is
actually true. ⛔ Do not simply delete the sentence — it is the thing a privacy audit reads.

**Direction of the justification.** *Stated invariant → types.* The opposite direction — "the types are
fine, so the claim is fine" — fails because the claim is specifically *"by construction, not by review"*,
and `stage: string` is the exact construction it says does not exist.

---

### B7 · `major` · `apps/rn/src/utils/scrubBreadcrumb.ts:21` + `scrubBreadcrumb.test.ts:52` — the breadcrumb scrub redacts the amounts and lets the **creditor names** through, and its own test blesses that

**User-facing consequence.** A crash on the Money tab sends Sentry a breadcrumb reading
*"Visa, Focus, $[redacted] · 22.99% APR, estimated verified Jun 3, $[redacted]/mo"* — so the user's list of
**who they owe, at what rate, and when they last checked** leaves the device with the dollar figures
removed, on a build where the DSN is live.

**What I measured.** `ListRow.tsx:83` writes the utterance verbatim in its own comment, and
`ListRow.tsx:85-90` builds it from `title` (`money.tsx:547 title={debt.name}`, `:822 title={item.name}`,
`:1103 title={g.name}` — all user-authored), badges, meta, caption and amount. Run through the real scrub:

```
$ cd apps/rn && npx tsx --tsconfig ./tsconfig.json scrub2.ts
label   : Visa, Focus, $2,400 · 22.99% APR, estimated verified Jun 3, $65.00/mo
scrubbed: Visa, Focus, $[redacted] · 22.99% APR, estimated verified Jun 3, $[redacted]/mo

label   : Delete Chase Sapphire Reserve            (ListRow.tsx:256)
scrubbed: Delete Chase Sapphire Reserve
```

The amounts go; the name, the rate and the verification date stay. `MONEY = /\$\s?\d[\d,]*(?:\.\d+)?/g`
matches a currency sign and nothing else, which the docblock states and which I confirmed against every
shape the app emits — including `$4k` (the `TrajectoryChart` axis) and `$ 12`:

```
"Housing, 3 expenses, $1,240.75"     -> "Housing, 3 expenses, $[redacted]"
"$4k"                                -> "$[redacted]k"
"-$45 short"                         -> "-$[redacted] short"
"12,400 paid off"                    -> "12,400 paid off"      ← a grouped number with no sign survives
"Chase Freedom · 24.99% APR"         -> "Chase Freedom · 24.99% APR"
```

⚡ **This is `major` because of the test, not only the regex.** `scrubBreadcrumb.test.ts:52` asserts the
passthrough as *correct*, and its fixture is itself a user-authored bill name:

```ts
eq(redactMoney('Mark Pay Rent paid'), 'Mark Pay Rent paid', 'a plain label is untouched');
eq(redactMoney('19.99% APR'), '19.99% APR', 'a rate carries no currency sign and is diagnostic');
```

So the gap is *pinned green*. Any future widening of the scrub reds this file, and the reader will see an
assertion that says the current behaviour is intended. That is the brief's "a test that cannot catch the
class it exists for": the class is *user financial data in a breadcrumb*, and the test's own example is a
member of it filed under "not money".

**And the premise it was decided under has changed since.** The docblock's cost/benefit —
*"a diagnostic trail nobody can read gets turned off"* — was written while the scaffold was inert.
`docs/DEBT_SENTRY_SETUP.md:28` records *"✅ **Done 2026-08-20:** DSN received, `EXPO_PUBLIC_SENTRY_DSN`
added to the Codemagic `AppleConnect` group"*, and `sentry.ts:19-20` only hard-returns when it is unset.
Nothing re-read this decision when it stopped being hypothetical.

⚠️ **Two premises I did NOT verify, stated so nobody reads them as measured** (rules 1 and 8). First, that
Sentry's touch integration attaches these specific labels — that claim comes from this module's own
docblock, and a docblock is not proof; it needs a device or a TestFlight event. Second, the exact wording of
the live privacy claim. **If both hold, this is a `blocker`** ("a statement to the user that is false about
their own data"); I am rating what I can prove, which is the scrub's scope and the test that fixes it.

**Remedy.** Not a wider regex — a name cannot be pattern-matched. Drop the categories whose content is
user-authored, the way `console` is already dropped (`scrubBreadcrumb.ts:47`): keep `navigation` and
`http`, drop or strip the `message` of `ui.click` / touch breadcrumbs, since a row's *identity* is the part
that is never diagnostic. Then change `test.ts:52`'s fixture to a genuinely app-authored string
(`'Add a debt'`) so the assertion still says what it means. ⛔ Keep `:53` — a rate with no name attached
really is diagnostic and really is not identifying.

**Direction of the justification.** *What the labels contain → what the scrub removes.* The opposite
direction — "the scrub is narrow on purpose, so the residue is fine" — is the docblock's argument and it is
sound for **counts, routes and step indices**, which is what it names. It is not an argument for creditor
names, which the docblock never considers.

---

## 2. STANDING RE-CHECKS

⚠️ **A re-read is not a re-verification** — every row below is a command I ran at this pin, or a plant.

| id | verdict | the measurement |
|---|---|---|
| `REVERIFY4-2` — `lint:secrets` reads the working tree | **OPEN — `CLOSED-UNPINNED`, caveat unchanged** | `npm run lint:secrets` → `✅ committed secrets: none across 1206 tracked files in index+HEAD (4 shapes checked, 2 exemption(s), cap 2).` exit 0. The gate still reads `index+HEAD` rather than a pinned baseline, so the caveat pass 2 narrowed is **still live and must not be read as clean**. ⚠️ The file count moved 1199 → **1206** since pass 2 — quoted, not typed. |
| `REVERIFY4-3` — the stale-baseline guard **prints, it does not red** | **OPEN — confirmed at the line** | `npm run lint:copy` → `✅ duplicate copy: no new cross-file phrases (3 baselined).` And `strings-inventory.ts:549-556` is `console.log(...)` inside `if (stale.length)` with **no non-zero exit anywhere in the branch** — the ✅ line is printed unconditionally after it. Currently 0 stale, so the branch does not even execute; the caveat is structural, not situational. |
| `M7` — tokens surviving on a comment line (`lint:finding-guards`) | **CLOSED** | `npm run lint:finding-guards` → `✅ finding-guards: 79 of 95 findings carry a standing guard; 16 unguarded (cap 16, downward-only).` exit 0, matching the brief's stated instrument reading. |
| `B-1` (pass 2) — guarded entries that survive their own un-fix | **PARTIAL — extended, not re-litigated** | I did not re-run pass 2's 57-entry un-fix sweep (auditor D's ground). What I add is a **new** instance of the same class from my route: `lint:money` is not in `scripts/test-gate-plants.ts` at all — `grep -n "money" scripts/test-gate-plants.ts` returns **nothing**, and the plant registry covers only `lint:finding-guards`, `lint:s1-coverage`, `lint:secrets`, `lint:month-arithmetic`, `lint:local-dates`, `lint:glossary`, `lint:a11y-props`, `lint:type-scale`. **B1 is what an un-fix plant of `lint:money` would have found.** |
| S1 / S0 surface instruments | **CLOSED** | `npm run lint:s1-coverage` → `✅ s1-coverage: 470 surface files classified · 331 unswept.` · `npm run lint:s0-coverage` → `✅ s0-coverage: 97 surface files classified · 50 unswept.` · `npm run lint:surface-complete` → `✅ surface-complete: every tracked source file is under a surface root (1207 tracked, 11 trees skipped by name).` |
| `lint:gate-freshness` | **OPEN, as the brief states** | RED at this pin; the run prints the [D74] note that a mid-audit red is the expected state. ⛔ **I quote no green.** |
| Runner wiring — "does every test file actually run?" | **CLOSED (new check, both trees)** | Mechanical diff of the file list against the runners' import lists: `apps/rn/src` → **69 test files on disk · 69 imported** by `runAppTests`/`runScenarioTests` · **0 not imported**. `packages/core` → **64 `testXxx` files on disk · 64 imported** by `runRegressionTests` · **0 not imported**. And the exit paths hold: `runAppTests.ts` ends `main().catch(err => { console.error(...); process.exit(1); })`, while the three files using the non-throwing `check(name, cond)` idiom (`substrateProducers`, `projectedIncome`, `guardianPrediction`) each `process.exit(1)` on `failures > 0`. |
| The app suite is green at this pin | **CLOSED** | `npm run test:app` → `✅ App-layer regression tests: ALL PASSED.` ⚠️ Recorded as *"nothing else broke"*, never as coverage — B3 and B4 are both present while it is green. |

**Not re-verified, and named rather than implied.** Pass 2's `C1`–`C4`, `A1` and `D2-1`–`D2-3` are against
`money.tsx`, `trustSelectors.ts`, `celebrationSelectors.ts`, `guardianSelectors.ts`, `topUpSelectors.ts`,
`planSelectors.ts`, `forecastCycles.ts` and `buildMultiCycleTimeline.ts` — **none of which is on
`ROUTING-B.txt`**; the store's selector files are absent from my manifest entirely (see the note at the top).
I read none of them and claim nothing about them.

⚡ **No file on `ROUTING-B.txt` was modified by `4b58d75..96d1f11`.** I intersected the manifest with
`git diff --name-only 4b58d75..96d1f11` — the fix range's three `apps/rn/src/store/*.test.ts` files
(`guardianSelectors.test.ts`, `storeActions.test.ts`, `trustSelectors.test.ts`) are all *outside* the
manifest. So the brief's "a clean verdict does not survive an edit" re-check has **nothing to bite on**
inside my route, and every finding above is against ground the fix range did not touch.

---

## 3. SWEPT AND FOUND CLEAN — BY PATH

⚡ **"No blocker or major in `<area>`" is a real result.** These are paths I actually read at this pin.

### `packages/core` — read, no finding

- `packages/core/utils/localDate.ts` — the `Date` ⇄ `YYYY-MM-DD` owner. Both directions use local
  components; `parseLocalDate`'s `T00:00:00` suffix is present, so neither half can route through UTC.
- `packages/core/utils/addMonths.ts` — the month-clamp owner. Clamps against `anchorDay`, and
  `addMonthsISO` routes through `localDate` in both directions, so the month step cannot reintroduce the
  UTC class the date linter guards.
- `packages/core/utils/dayBefore.ts` — parses with the `T00:00:00` suffix and reformats from local
  components. No `toISOString`.
- `packages/core/utils/money.ts` — `roundMoney` / `clampMoney`. See §4 for the `-0` property, which is a
  formatter-side question and not a defect here.
- `packages/core/utils/amountField.ts` — all three parsers printed across 16 inputs (B2's table). The
  three-channel blank/zero split behaves exactly as documented and `Number.isFinite` is present on all three.
- `packages/core/utils/testAmountField.ts` · `testLocalDate.ts` · `testAddMonths.ts` — read for **class**
  coverage, not pass/fail. `testLocalDate` runs its whole body under multiple `TZ` values. `testAddMonths`
  asserts the clamp forward **and backward**, leap February, the anchor-recovery case *and its negative*
  (`"without an anchor the short month persists"`), and that `addMonthsToDate` does not mutate its argument.
  `testAmountField` asserts the JSON round-trip, which is the actual failure mode (`NaN` serialises to
  `null`).
- `packages/core/payCycle/cyclesPerYear.ts` · `payCyclesPerMonth.ts` · `rollPaydayToFuture.ts` ·
  `getNextPaycheckDate.ts` — `MONTHLY_FACTOR` in `apps/rn/src/utils/format.ts` and `payCyclesPerMonth` agree
  to 1e-9 on all four cadences (printed). `rollPaydayToFuture`'s 500-step cap covers ~9.6 years at the
  tightest cadence.
- `packages/core/payCycle/testPayCycle.ts` · `testPayCyclesPerMonth.ts` · `testRollPaydayToFuture.ts` —
  `testPayCyclesPerMonth` pins the regression *direction*, not only the value (`> 4`, `> 2`);
  `testRollPaydayToFuture` covers already-future, `== today`, empty, multi-step weekly, and phase
  preservation.
- `packages/core/recurrence/rolloverPayCycle.ts` · `testRolloverDueDates.ts` — Jan-31 → Feb-28, the
  Feb-28 → Mar-31 anchor recovery, paid vs unpaid one-time, and unpaid-keeps-its-overdue-date are all
  asserted. `advanceDueDateOnce`'s `default:` returns the date unchanged, so an unknown recurrence
  terminates the `while` on the safety counter rather than spinning.
- `packages/core/storage/debtPlannerStorage.ts` — **types and one constant only**, no runtime behaviour.
  Read in full to establish that.
- `packages/core/utils/formatCurrency.ts` — the `Number.isFinite` guard and `minimumFractionDigits: 0` are
  both present; printed against `formatWhole` on ten inputs (§4).

### `apps/rn/src` — read, no finding

- `apps/rn/src/utils/format.ts` **(the brief's highest-value file)** + `format.test.ts` — every export
  exercised directly (§4). `summariseNames`' `max + 1` boundary is correct, and the test pins it **as a
  string length as well as a count**, which is what stops a helper that returned all 23 names from passing.
- `apps/rn/src/utils/reportError.ts` · `sentry.ts` · `sentry.web.ts` — `scrubBreadcrumb` **is actually
  wired**, at `sentry.ts:37-39` (`beforeBreadcrumb`), not merely exported and tested. And the `extra`
  payload is safe: I enumerated **all 36** `reportError` call sites across both live trees, and every context
  value is a string literal or a comma-joined list of **field names** (`realWriteGuard.ts:143`,
  `StoreContext.tsx:97`). `service.ts:169`'s `decoded.message` resolves to one of three module constants
  (`NOT_A_CLOUD_BACKUP`, `NO_CODEC`, `DAMAGED` — `data/cloudBackup.ts:116-147`). No amount and no
  user-authored string reaches `extra`.
- `apps/rn/src/utils/a11y.ts` — `groupLabel` is a pure join of already-formatted parts. Read because it is
  the mechanism behind B7; its own example at `a11y.ts:17` is *"Visa, 18.9% APR, Focus, $4,210"*, which is a
  second, independent statement of what these labels contain.
- `apps/rn/src/utils/confirm.ts` · `ecosystem.ts` · `sizeClass.ts` · `share-card.ts` · `share-card.web.ts` ·
  `debtFreeSound.ts` · `debtFreeSound.web.ts` · `skia-ready.ts` · `canvaskit.ts` — read in full.
- `apps/rn/src/lib/app-lock.ts` · `app-lock.web.ts` · `review.ts` · `review.web.ts` · `scan.ts` ·
  `scan.web.ts` — read in full; every `.web` stub exports the same surface as its native sibling.
- `apps/rn/src/config/qa.ts` — read in full. `qaEnabled()` is the single spelling and all eight consumers
  use it, so the Phase-6 `git grep QA_TOOLS` flip reaches every one (see §4 for the standing note).
- `apps/rn/src/analytics/funnel.ts` + `funnel.test.ts` — see B5 and B6. The opt-out choke point itself is
  correct, and the no-production-sink guard is real: it walks the tree and reads source, not a token.
- `apps/rn/src/storage/adapter.ts` · `cloudBackup/provider.ts` · `cloudBackup/index.ts` ·
  `cloudBackup/createCloudBackupProvider.ts` · `createCloudBackupProvider.ios.ts` — read in full. The
  `CLOUD_BACKUP_SUPPORTED` vs `isAvailable()` split is coherent: iOS keeps the constant `true` even when
  native setup throws and degrades to `unavailableCloudBackupProvider`, which is what keeps "Delete all
  data" blocking there while not blocking on web/Android.
- `apps/rn/src/storage/cloudBackup/service.ts` + `service.test.ts` — read in full. Everything **except** the
  `unknown`-claim path is right and well covered: the four `RemoteClaim` states, the foreign-mtime cases in
  **both** directions (older and newer), stat-before-read on restore, `unavailable` as a delete *refusal*,
  and "already gone" as a delete *success*. B3 is the one hole.
- `apps/rn/src/storage/createAdapter.ts` — the native adapter is the **correct** implementation of the
  quarantine contract. B4 is against its web sibling, not this file.
- `apps/rn/src/store/realWriteGuard.test.ts` (`:1-80`) — notable for the right reason: it defends against
  the no-op-looks-like-a-refusal trap explicitly (`:52-56`, *"a value the setter rounds reads as 'the write
  was refused'"*; `:59-62`, onboarding first so `onboardingComplete: false` is a real change). Rule 2,
  applied by its author.
- `apps/rn/src/store/substrateProducers.test.ts` · `projectedIncome.test.ts` · `guardianPrediction.test.ts`
  — read in full. Their `check(name, cond)` helper does not throw, which is why I verified the exit path
  (§2): all three `process.exit(1)` on `failures > 0`, so a failed assertion does fail the run.
- `apps/rn/src/store/paycheckForm.test.ts` + `paycheckForm.ts` — the three payday-field refusals are shared
  and **both** hosts consume them (`PaycheckStep.tsx:51`, `PaycheckSheet.tsx:56`), so an invalid
  semi-monthly config cannot be committed — which is what keeps `getNextPaycheckDate`'s three `throw`s
  (`:22`, `:52`, `:81`) off the rollover path. `nextPaycheckFrom` wraps the call and returns `null` rather
  than the biweekly-derived guess it used to.

### ⛔ In my manifest and NOT reached — pass 4 must not read these as swept

**18 of the 24 store test files.** For all 24 I verified runner wiring and a green suite; I **read** six.
The other eighteen are unexamined at the assertion level:

```
apps/rn/src/store/affordability.test.ts          apps/rn/src/store/onboardingFinish.test.ts
apps/rn/src/store/bnplCadence.test.ts            apps/rn/src/store/payoffCelebration.test.ts
apps/rn/src/store/celebrationSelectors.test.ts   apps/rn/src/store/paywallLead.test.ts
apps/rn/src/store/debtFreeBand.test.ts           apps/rn/src/store/planSelectors.test.ts
apps/rn/src/store/debtIds.test.ts                apps/rn/src/store/proofOfWork.test.ts
apps/rn/src/store/expenseReserve.test.ts         apps/rn/src/store/steadyStateProjection.test.ts
apps/rn/src/store/glossary.test.ts               apps/rn/src/store/storeContext.test.ts
apps/rn/src/store/greeting.test.ts               apps/rn/src/store/windfallSplit.test.ts
apps/rn/src/store/guardianSubjects.test.ts       apps/rn/src/store/milestoneCross.test.ts
```

⚠️ **`expenseReserve.test.ts` (48 assertions) and `planSelectors.test.ts` are the two to take first** — they
are the money ones, and `planSelectors.ts` is in the pass-2 fix range even though its test is not.
`celebrationSelectors.test.ts` and `payoffCelebration.test.ts` are next for the same reason.

**Partially read — I am not claiming these:**

- `apps/rn/src/store/persistenceLifecycle.test.ts` (696 lines) — I read the header and `MockAdapter`
  (`:29-52`) only. That much is load-bearing for B4 (`MockAdapter.blob` is assigned directly, so **no test
  in this file executes a real adapter's `JSON.parse`**), but its 99 assertions are unexamined.
- `apps/rn/src/store/realWriteGuard.test.ts` — read `:1-80` of 139.
- `apps/rn/src/utils/scrubBreadcrumb.test.ts` — read its assertions (`:28-64`), not the whole file.

**Not opened:**

```
apps/rn/src/utils/skia-ready.web.ts                    (98 lines — read the export signature only)
apps/rn/src/types/react-native-ios-context-menu.d.ts   (51 lines — ambient .d.ts, no runtime)
```

---

## 4. MEASURED, AND NOT A DEFECT

Each of these looked like a finding and is not. Stated so pass 4 does not spend a day on the same suspicion.

### `formatDisplayAmount` truncates instead of rounding, and renders `$NaN` — and it is **not** on a shipping surface

The function is six lines and has no `Number.isFinite` guard, and `(abs % 1).toFixed(2).slice(2)` throws the
carry away:

```
$ node p1.js
1240.995  -> $1,240.99   | true: 1240.99
0.999     -> $0.00       | true: 1        ← a dollar lost
1.995     -> $1.00       | true: 2
99.999    -> $99.00      | true: 100
12399.995 -> $12,399.00  | true: 12400
NaN       -> $NaN.N
Infinity  -> $∞.N
```

⛔ **But it is not reachable from the product.** Counted whole, not `head`ed:

```
$ git grep -n "formatDisplayAmount" -- . | grep -v ^docs/
components/ResultsSection.tsx:3,616,623,630     ← the LEGACY Capacitor/Next root tree
packages/core/utils/formatDisplayAmount.ts:1
scripts/surface-inventory.ts:16
CLAUDE.md:243
```

Zero consumers in `apps/rn/src`. `lint:money`'s `ROOTS` are `packages/core` and `apps/rn/src` only
(`check-money-format.ts:27`), with the legacy root tree explicitly out of scope and dying at 5.5.1. It is
worth recording because the file **is** on the S1 surface manifest, so it will keep looking like a finding
until that tree is deleted — and because it is the fourth money formatter, which is the count B1 is about.

### `formatWhole` renders `-$0`, and so does `formatCurrency` — but nothing in my route feeds it one

```
$ npx tsx negzero.ts
-0.004                 roundMoney=-0     clampMoney=0   formatWhole=-$0   formatCurrency=-$0
-0.4                   roundMoney=-0.4   clampMoney=0   formatWhole=-$0   formatCurrency=-$0.4
-0.49                  roundMoney=-0.49  clampMoney=0   formatWhole=-$0   formatCurrency=-$0.49
-0.5                   roundMoney=-0.5   clampMoney=0   formatWhole=-$1   formatCurrency=-$0.5
1200 - 1200.004        roundMoney=-0     clampMoney=0   formatWhole=-$0   formatCurrency=-$0
```

`roundMoney` **can return `-0`** (row 1), and `formatWhole` renders anything in `(-0.5, 0)` as `-$0`.
`clampMoney` is what protects; a value that has not been through it is exposed. ⛔ **I am not filing this,
because I could not put a site behind it and the sites are not on my route.** The three call sites that pass
an unclamped subtraction are all on auditor **C**'s ground:

```
$ git grep -nE "format(Whole|Currency)\([^)]*-[^)]*\)" -- apps/rn/src   (excluding Math.max and tests)
apps/rn/src/app/(tabs)/index.tsx:1082          formatWhole(impact.after - impact.before)
apps/rn/src/components/plan/FloorImpactBar.tsx:67   formatWhole(after - before)
apps/rn/src/components/payday/PaydayCaptureSheet.tsx:227  formatCurrency(requiredTotal - carryForward)
3
```

⚠️ **Handed to auditor C as a property, not a claim:** in all three the subtraction sits in a branch that
reads as though the sign is already known, and I did not verify that. If any of them can go slightly
negative, the screen prints `-$0`. `formatWhole`'s docblock is right that the *absence* of a clamp is
deliberate; `-0` is a different question and the docblock does not consider it.

### `summariseNames(names, NaN)` returns `{shown: '', more: NaN}` — unreachable

```
max 0  -> {"shown":"a · b · c","more":0}
max -1 -> {"shown":"a · b · c","more":0}
NaN    -> {"shown":"","more":null}          ← JSON.stringify(NaN); the value is NaN
```

`max < 1` is `false` for `NaN`, so the guard does not cover it and the caller would render *"+NaN more"*
with no names. **The only call site passes the literal `3`** (`RecoveryPlanSection.tsx:45`), so it is not
reachable. Recorded because the docblock invites a computed `max` (*"a caller with a hard line budget wants
a smaller `max`"*), and the day someone computes one the guard will not catch it.

### `"5,5"` parsing to `55` is a **decision**, not drift

My first read was that `amountField.ts:49-51`'s docblock had gone stale. It has not:
`testAmountField.ts:61` asserts `parseOptionalAmount('5,5') === 55` by name — *"a comma in an APR is
stripped, not silently zeroed"*. Beating a measurement needs a measurement; this is a settled call. It is
folded into B2 as the reason a range bound matters rather than reported on its own.

### `QA_TOOLS = true` at this pin, with no gate enforcing the Phase-6 flip

`config/qa.ts:9` ships `true`, and `run-gates.ts`'s 30-gate list contains nothing that asserts it is `false`.
⛔ **Not filed as a finding**: the flip is an explicitly tracked P6.17 step, the single spelling `qaEnabled()`
is used by all eight consumers so `git grep QA_TOOLS` genuinely reaches them, and `check-icon-glyphs.ts:46,62`
already reasons about the post-flip state. Recorded only so the next reader does not re-derive it: **the flip
is a manual pre-submission step with no automated backstop.**

### `reportError`'s `extra` payload — checked for PII, and clean

`beforeSend` (`sentry.ts:26-31`) deletes `user`, `request` and `contexts.device` but does **not** touch
`extra`, and `setErrorReporter` at `:48-50` passes the whole context through as `extra`. So I enumerated all
36 call sites rather than sampling. Every value is a literal or a comma-joined list of **field names**; the
one computed message (`service.ts:169`) resolves to one of three module constants. **No amount and no
user-authored string.** This is the class B7 is about, checked in the other direction and found sound.

### Line-number citations in comments have drifted — worth knowing, not a defect

`scrubBreadcrumb.ts:7` cites *"`money.tsx:828` … and `:980`"* as the money-bearing accessibility labels. The
fix range added +99 lines to `money.tsx`; those labels are now at `:919` and `:1204`. The *claim* is still
true and the file is still the right one. ⚠️ Flagged because two of my own first drafts nearly cited these
numbers as though they were current — a line number in a comment decays exactly like the premise around it.

### `runMigrations` refusing a valid-JSON non-store is the right shape

`data-recovery.spec.ts`'s `seedCorrupt` blob is criticised in B4 for picking one member of a class. To be
clear about what is *not* wrong: routing "parsed, but not a store" through `runMigrations` → quarantine is
correct, and the ten tests in that file assert real things about the reset screen (the copy does not claim
deletion; the import route is offered; onboarding is blocked until answered). The defect is the missing
second member, not the member it has.

### The web `confirmDelete` fallback resolves `true` when `window.confirm` is absent

`confirm.ts:12-14` — a destructive confirm returns `true` if the environment has no `window.confirm`.
Measured as not a defect for the shipping surface: iOS takes the `Alert.alert` branch, and the only web
environments in play (Playwright, the embed iframe) both provide `window.confirm`. Recorded because "fail
open on a destructive action" is a shape worth someone deciding on rather than inheriting.

### `advanceDueDateToPlanDate`'s `safety < 60` cap is bounded, and correctly so

`rolloverPayCycle.ts:74` caps the catch-up loop at 60 steps. For a *weekly* bill that is ~14 months, so a
bill more than that far in the past would stop short of the plan date and surface as overdue rather than
advancing. That is the safe direction (an overdue bill is visible; a silently-advanced one is not), the
input is not reachable from a live store, and the alternative — an uncapped loop — is the failure this cap
exists to prevent.
