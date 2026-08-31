# Pass 6 — the 123 findings, grouped into the classes `S1.13.7` fixes them in

**Twelve lanes · 446/446 money-bearing files read · 29 blockers · 48 majors · 47 minors.**
Lane reports: `{A1,A2,A3,B1,B2,B3,C1,C2,C3,D1,D2,D3}-findings.md`. Read-lists: `READ-*.txt`.

⛔ **ONE ASSERTION PER CLASS THAT ITERATES THE CLASS, never one that names a member.** Fixing ids one at
a time is what produced pass 4's round, then pass 5's, and 13 of pass 4's 34 findings were a single class:
*the fix reached the instance that was reported and left a sibling asserting on the same store.* 🎯 2026-08-31
confirmed the order: **by class, one class at a time, each re-verified before the next starts.**

⛔ **A REMEDY IS A HYPOTHESIS.** Across passes 4 and 5, more than half of the stated remedies would not have
closed their finding and **five would have introduced the defect they described.** Every remedy in these
twelve files is marked *unverified* by its author, and three lanes explicitly named the obvious fix as
wrong. **Verify against current code before writing anything.**

---

## The ordering, and why it is this one

| # | class | n | why here |
|---|---|---|---|
| **I** | ⏱ **The date fuse** | 2 | **Fires on 2026-09-02, two days out.** Small, bounded, and it changes the branch 43 spec files run |
| **II** | **The proof machinery** | 12 | Everything below is *closed* using it. Pass 5 ordered its classes the same way and the reason held |
| **III** | **NaN blindness** | 5 | Two lanes found it independently; it makes suites green over wrong money and renders `NaN` as **`$0`** |
| **IV** | **The trust gate's population** | 9 | **9 blockers.** The loudest claims on the app are the ungated ones |
| **V** | **Two producers of one number** | 8 | Where the app contradicts itself at one instant, on one store |
| **VI** | **Money written or destroyed** | 8 | Persistence and entitlement — includes a purchase the user is charged for and does not receive |
| **VII** | **Cadence as a user variable** | 6 | Pass 5's CLASS V, recurring on the branches that fix did not reach |
| **VIII** | **The fix reached the member** | 6 | The class that produced the last two rounds, still producing |
| **IX** | **Tests that cannot fail** | 18 | Largest class. Fix last — it is what re-verifies everything above, so it must be fixed *knowing* what above was wrong |
| **X** | **`P6.11`'s real blast radius** | 6 | ⚠️ **Not a code fix — a PLAN correction.** Blocks the deletion, not this pass |
| **XI** | **Copy, labels, a11y, dead code** | 43 | The minors. Batch last; several are one-line |

---

## ⏱ CLASS I — the date fuse *(2 findings · fires 2026-09-02)*

| id | sev | what |
|---|---|---|
| `A1-4` | major | The shared fixture writes `dueDate: '2026-07-01'` on the default debt **and** bill. That is 61 days past, so `isOverdue` is true and **43 of 63 spec files have been silently driving the OVERDUE branch since July.** The on-track branch of the shared default is guarded by nobody |
| `A1-5` | major | The `day()` sweep fixed `nextPaycheckDate` and never touched `dueDate`; **eight more fixtures cross into the overdue branch on 2026-09-02** — the date the seed helper's own docblock predicted |

⚠️ **The fix is not "move the dates".** A literal date in a fixture is a fuse by construction; the class
fix is a relative helper, and `helpers/seed.ts`'s own `day()` docblock — 60 lines below the two literals —
already says so.

## CLASS II — the proof machinery *(12 findings)*

⛔ **This is what decides whether anything below is CLOSED.** Two of its members were already fixed during
the dispatch because they blocked it (`D2-3`, `D2-4`); the rest are open.

| id | sev | what |
|---|---|---|
| `D2-1` | major | `measured`/`sha` never expire — **30 of 85 "EXECUTED" proofs were measured against a tree their target file has since left** |
| `D2-2` | major | Every plant rewrites its whole target to **LF**; 60 of 62 proof targets are CRLF on disk, and one plant changed **202 of 203 lines** |
| `D2-5` | major | A suite's load-bearing control row can be deleted and **both** gates stay green — `lint:import-graph` has no floor on its own assertion count |
| `D2-6` | major | `audit-sublanes.ts` inherits `D2-3`'s blind spot — its `⭐ exit reachable` is filtered by the predicate it checks, with no floor |
| `D2-7` | minor | `MIN_SCENARIOS` is a `<` floor **in the harness that plants the `<`-floor defect elsewhere** |
| `D2-11` | minor | `audit-sublanes.ts` has no `package.json` entry — the split that produced this dispatch is invoked only from a docstring |
| `D2-13` | minor | `junitFound` means *"some file had bytes"*, not *"a flow ran"*; the stall refusal never fires |
| `D1-8` | major | Nothing asserts `run-gates.ts`'s `GATES` list is complete — **a gate in the tree and in no chain is silently unexecuted, and there is a live instance** |
| `D1-2` | major | `check-runner-completeness`'s git pathspecs cannot match a test file at the top level of either root, so `D5-12`'s own defect is still reachable |
| `D2-8` · `C3-11` | major | `lint:runner-completeness` is blind to `scripts/`, where **six of eight test-shaped instruments live** — and a live instance is executed by nothing |
| `D3-4` | major | `check-conflict-markers` needs the open **and** close marker, so a **half-resolved** conflict — the commonest leftover — reads green. ⚠️ **The plant is OWED**: D3 correctly declined to plant into a tracked file while eleven lanes shared the tree |
| ✅ `D2-3` `D2-4` | — | **CLOSED 2026-08-31 in `S1.13.5`** — planted, restored byte-identical, control re-run |

## CLASS III — NaN blindness *(5 findings)*

⚡ **Found independently by two lanes**, in different files, on different spellings. `NaN` compares `false`
to everything, so **every guard written as a comparison is blind to it** — and the app renders the result
as **`$0`**, not as `NaN`, to the screen and to VoiceOver.

| id | sev | what |
|---|---|---|
| `A2-6` | major | Every tolerance assertion in the debt engine's tests is `Math.abs(a−b) > tol`. **PLANTED:** `NaN` in `projectCurrentBalance` printed `✓` over two money assertions. **Six copies across three directories** |
| `D1-3` | major | Both assertions guarding `endingBalance ≥ 0` are spelled `x < 0`, so `test:regression` prints **✅ All regression tests passed** over a `NaN` cycle balance |
| `C2-5` | minor | `ListRow`'s progress clamp cannot clamp `NaN`, and reads exactly like a guard that does |
| `B2-5` | minor | The balance clamp in `verifyDebtBalance` is shaped like a NaN guard and is not one |
| `A3-9` | blocker | `|| 0` on a blank `typicalAmount` anchors the income FLOOR to the **highest** paycheck ever recorded — `[1000, 1000, 50000]` → suggested lean **$42,500** |

⛔ **The class assertion iterates the spellings**, and the six helper copies collapse to one.

## CLASS IV — the trust gate's population *(9 findings · 6 blockers)*

⚡ **Pass 5's `C4-7` recurring, on more surfaces.** The pattern is exact: the refusal reaches *some*
consumers of a number and not the loudest one, or it is computed **over** different fields than the number
is computed **from**.

| id | sev | what |
|---|---|---|
| `C1-3` | **blocker** | `PlanHero` — the first and loudest card on Today — states *"On track · debt-free by ⟨date⟩"* on the store where the Guardian card **directly beneath it** refuses to say anything. Two independent doors bias the date early |
| `C1-10` | **blocker** | The Windfall Autopilot itemises where a bonus lands on that same blind plan — **and offers a Confirm that spends it.** Same class, second file |
| `B1-1` | **blocker** | The once-ever debt-free **finale** is stamped over an unread balance and fires when the user answers the repair card — *"$15,000 paid off"* over a live $12,000 debt. It cannot be got back |
| `B1-3` | **blocker** | The What-If projection is not gagged, so Progress prints an ungated date on the same card whose own legend it just suppressed |
| `B1-5` | **blocker** | The reserve offer says *"the full $415.38 your expenses average out to"* against a true $535.38, on a store whose own guard says it may not speak |
| `C3-5` | **blocker** | The widget and Siri state a total **$2,431 too low** (and $2,869 too high in the mirror case) — the pass-5 fix changed what the number is computed FROM without changing what the guard is computed OVER |
| `C3-1` | major | Siri **speaks the refusal sentinels aloud**: *"You're on track to be debt-free by Balances unread."* |
| `C3-4` | major | A debt the app could not read **silently disappears from Siri's list** — the one debt the user cannot name in order to fix it |
| `B1-2` | major | `totalPaid` sums every debt's `originalBalance`, live ones included, while `debtsCleared` beside it counts only the guarded partition |

## CLASS V — two producers of one number *(8 findings)*

| id | sev | what |
|---|---|---|
| `C3-2` | **blocker** | The widget states **"95% paid"** and **"$0 remaining"** on the same face, at the same instant, from the same store |
| `C3-3` | **blocker** | `Math.round` reports **100% paid** while the same face says **$5 left**; Progress lights the gold "Free" node and VoiceOver says *"all milestones reached"* |
| `C3-9` | **blocker** | Money and Progress name a **different focus debt** for the same store at the same instant |
| `A2-1` | **blocker** | An uncollapsed **third** producer of the negative-amortisation guard: headline **February 2029**, chart clears at month 30, and the sheet says the debt *"never gets paid off"* |
| `A2-4` | minor | The debt-free date and the payoff chart have different tolerances to a missing `apr` — on the one pair `S1.11.4.5` collapsed so they could not disagree |
| `C2-2` | major | The payoff chart's y-axis labels a $2,500 gridline **"$3k"** and a $7,500 gridline **"$8k"** |
| `D3-3` | minor | `formatMonths` has two definitions; the legacy copy still rounds, so *"30 months saved"* reads **"3 years"** — a benefit claim rounded in the app's own favour |
| `C1-18` | minor | `RESERVE_OPACITY` is declared twice, in two files, one of which documents that it must match the other |

## CLASS VI — money written or destroyed *(8 findings · 6 blockers)*

| id | sev | what |
|---|---|---|
| `C3-8` | **blocker** | **A purchase made inside the demo is charged by Apple and dropped by the app** — shows *"You're on Premium"*, leaves `subscriptionPlan: free` |
| `A2-2` | **blocker** | After an extra payment on a BNPL, **renaming the plan** silently rewrites its balance by up to half an installment, in either direction. Measured: $40 deleted, $40 invented |
| `B3-1` | **blocker** | `runMigrations` repairs money in four **lists** and in **none** of the money fields on the store itself; the same `'1,200'` is *recovered* in a debt and **nothing** in `leanAmount` |
| `A3-5` | **blocker** | Restoring a backup whose payday has gone stale reports **$0 of bills due** and recommends **$1,450 of a $1,500 paycheck** to debt |
| `C3-6` | **blocker** | Two taps of the Lock Screen *"Payday landed"* roll the plan **two whole cycles on one payday**; Undo takes back one |
| `A3-18` | **blocker** | On the **last payment of every debt** the cycle ledger charges the full stated minimum instead of the balance — **and a test asserts the wrong number as correct** |
| `C3-10` | major | *"Delete all data"* never touches the App Group: names and balances stay readable, and a queued payday survives the wipe |
| `B3-4` | major | The forward-incompatibility refusal reads the **envelope's** `storeVersion`, so a payload that contradicts it is accepted and re-stamped |

## CLASS VII — cadence as a user variable *(6 findings)*

⚡ Pass 5's CLASS V closed *"a cadence whose period is a USER VARIABLE replaced by a constant"* — on the
branches it reached.

| id | sev | what |
|---|---|---|
| `A3-1` | **blocker** | A weekly/biweekly **debt** that is not a BNPL reserves **one payment of three**, and the engine offers the rest to the snowball. The seam gates on `debt.type === 'bnpl'` |
| `A3-2` | **blocker** | A weekly/biweekly **bill** under a monthly payer: ticking one occurrence marks all of them paid, and the others cannot be ticked at all |
| `A3-11` | **blocker** | Hysteresis holds the band at `tight` while headroom is **above** the floor, then prints *"$230 … a little under your $200 line"* beside a *"To debt $30"* bar it says does not exist |
| `A2-3` | major | The BNPL calendar shows **one installment of four** for a `per-paycheck` plan, captioned *"payment 1 of 4"* |
| `A2-8` | minor | The *"2 × $100"* explanation is gated on `scheduledPaymentAmount` while the doubling is gated on cadence |
| `A3-13` | minor | The CSV importer refuses `quarterly`/`annually` on a debt the app's own sheet offers |

## CLASS VIII — the fix reached the member, left the sibling *(6 findings)*

| id | sev | what |
|---|---|---|
| `C2-3` | **blocker** | Converting an **autopay** bill into a debt drops the flag at two hops, so the app reports money **the bank already took** as still owed. The file's own comment records the identical fix being made for `recurrence` |
| `B3-3` | **blocker** | Pass 5's `B5-11` reached the backup path and not `getCloudBackupStatus` — the sheet tells a signed-in user to sign in **and hides the restore door**. The old answer is pinned by a test 140 lines above the corrected one |
| `A3-12` | **blocker** | Scan-to-prefill accepts **Feb 30**, silently rolls it to **Mar 2**, and the debt drops out of the cycle. `debtCsv`'s calendar check never reached `parseStatementText` |
| `D2-10` | minor | `D5-14`'s fixture fix reached `cycleHistory` and left `completedRecommendedActions` and `lastSavedAt` |
| `C1-1` | major | *"set it again **above**"* survives the acknowledgement, after which there is nothing above |
| `C1-6` | major | `?? 0` re-collapses the distinction `amountField.ts` exists to keep, on the one money input that round-trips through a parser |

## CLASS IX — tests and instruments that cannot fail *(18 findings)*

⛔ **Fix LAST and fix knowing what the classes above got wrong** — these are what re-verify everything, so
repairing them first would re-verify against the same blind spots.

`A1-1` `A1-2` `A1-3` `A1-6` `A1-7` `A1-8` `A1-9` `A1-10` `A1-11` · `A2-7` · `A3-4` `A3-14` `A3-15` `A3-16`
`A3-17` · `B2-4` · `D1-4` `D1-5` `D1-6`

Highlights: the What-If test's only assertion is satisfied **before the What-If is opened** (`A1-9`);
`testAllocationsAppearAfterExpensesAndDebts` executes **zero assertions** (`D1-5`); the migration audit's
oracle is **already a no-op for 542 of 1,084 outcomes** while printing *"all 9 invariants fire"* (`D1-4`);
eight release-gate assertions named *"backup …"* test `JSON.stringify` on an object literal (`A3-17`);
the store-action suite **still never deletes anything**, so pass 5's `$10,967.54` blocker was verified
against a hand-built object (`B2-4`).

## ⚠️ CLASS X — `P6.11`'s real blast radius *(6 findings — a PLAN correction, not a code fix)*

⛔ **This does not belong to `S1.13.7`. It blocks `P6.11`.**

| id | what |
|---|---|
| `D3-1` | **The legacy root is LIVE.** `packages/core` imports **7 files out of it across 8 edges**; `typecheck:core` and `test:regression` both compile *and execute* them, and both are steps of `validate:release:rn` **and** `web-e2e.yml` (every push and PR). `P6.11`'s written scope does not name this |
| `A3-8` | The same coupling, found independently — counted at four/five files. **Two lanes, two counts, both under D3's seven** |
| `D3-2` | The live gate spends **23 assertions** certifying a three-tier subscription product the app no longer has |
| `A2-9` | `getDebtsWithDisplayBalances.ts` says P6.11 deletes it; P6.11 deletes `app/`, and the file is in `packages/core` |
| `D2-9` | `compare-ios-screenshots.mjs` auto-captures a missing baseline **and passes**; its baselines live in the tree `P6.11` deletes |
| `D2-14` | `preflight:xcuitest`'s only fixture is the legacy Capacitor project, and its written expiry plan is enforced by nothing |

⚠️ `packages/core/tsconfig.json` says *"three files"*; D3 counted four on that edge alone. **Every count of
this coupling so far has been short** — the standing rule applies: budget the enumeration, not the list.

## CLASS XI — copy, labels, a11y, dead code *(43 minors)*

Batched last; several are one-line. Full list in the lane files. Notables: a payday sheet printing a raw
ISO date (`C1-5`), *"CASH FLOW · NEXT 1 PAY CYCLES"* (`C2-7`), a trending-**up** arrow on a card asking the
user to **lower** their floor (`C1-11`), a hard-coded focus tint that cannot follow the theme (`C1-13`),
and `C1-19` — an auto-confirm that marks itself fired **before** it fires, so any re-render inside its
2-second window cancels it permanently.

---

## ⚠️ What the lanes recorded as NOT findings — do not re-chase

Five lanes closed with explicit negative results, which is the half a round usually loses:
**B1** five (windfall conservation clean over **5,184 splits**, `selectProvisionalPayoffs`, the widget
payload, the Recovery Plan, `money.tsx`'s ungagged `PayoffView`) · **C1** **nine** false premises · **B3**
five controls · **B2** one finding **downgraded from blocker by its own author** after measuring that the
path is unreachable · **D3** three. `A3` corrected two of its own findings in place mid-lane.

⚡ **A2 declined to file a finding by running `prove:guards --id=S1P5-CADENCE-IDENTITY` rather than reading
its token** — the *"already closed"* trap that cost pass 4 four findings.
