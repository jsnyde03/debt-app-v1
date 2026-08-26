# S1 — the driving session's own verification of the auditors' findings

⛔ **[D68] the session does not run the pass; it records the result — and recording includes MEASURING the
stated mechanism.** In one prior round **4 findings had a sound observation and a wrong explanation, and in
3 of the 4 building the proposed fix would not have closed the defect.** This file is where each finding's
mechanism is re-derived independently before anything is built from it.

Verdicts: `CONFIRMED` (mechanism re-measured here) · `CONFIRMED-BY-READING` (sites verified, behaviour not
re-run) · `MECHANISM-WRONG` (observation may still stand) · `REFUTED`.

---

## D-2 — premium + shortfall renders "You're caught up for this paycheck." — **blocker · CONFIRMED**

**Sites verified by reading, all four exactly as cited:**

| claim | verified |
|---|---|
| `index.tsx:506` empties `unfunded` when a recovery plan exists | ✅ `unfunded={recovery ? [] : (allocation.unfundedRequiredItems ?? [])}` |
| `RequiredActionsCard.tsx:77` computes `outstanding` from that prop | ✅ `rows.filter((r) => !rowHandledNow(r)).length + unfunded.length` |
| `:121-124` renders the success sentence on `outstanding === 0 && hasAnyBills` | ✅ verbatim, in `c.accent.success` |
| `allocatePaycheck.ts:423` only pushes a row when `coveredAmount > 0 \|\| potShare > 0` | ✅ — so a wholly-unfundable item has **no row** |

**Re-measured independently** (own probe, `selectAllocation` + `selectRequiredRows` + `selectRecoveryPlan`,
$1,000 paycheck · rent $1,000 marked paid · Electric $120 · Phone $80):

```
=== PREMIUM ===                        === FREE (control) ===
  shortfall              : 200           shortfall              : 200
  unfundedRequiredItems  : [Electric,      unfundedRequiredItems  : [Electric,
                            Phone]                                  Phone]
  recovery plan exists   : true          recovery plan exists   : false
  unfunded PROP -> card  : 0             unfunded PROP -> card  : 2
```

⭐ **The decisive asymmetry is measured twice by two people from different directions:** the engine knows
about both unpaid bills in *both* tiers, and only the premium path throws that knowledge away before the
card counts it. **The tier changes what the card is told, not what is true.**

⚠️ **One correction to my own probe, recorded rather than hidden:** my first attempt imported
`selectAllocation` from `@/store/planSelectors` and died — it lives in `@/store/selectors`. The label field
I guessed at printed `undefined`, so my `outstanding` arithmetic is approximate; **the quantity that carries
the finding is `unfunded PROP -> card`, which is exact.**

---

## C-2 — "Every balance is cleared" on Today and Progress — **blocker · CONFIRMED-BY-READING**

⭐ **This is S1.1's ⓪-1 blocker on the two screens that were never given the guard**, and it is the more
important half: ⓪-1 was one screen reading a misclassified repair; **C-2 is two screens that read no repair
at all.**

| claim | verified |
|---|---|
| `selectPlanState` returns `'debt-free'` from `liveDebts.length === 0` with no repairs conjunct | ✅ `planSelectors.ts:299` |
| `progress.tsx` never consults `pendingDataRepairs` | ✅ **0 occurrences in the file** |
| `GraduationCards.tsx:28-31` renders the sentence `money.tsx` refuses | ✅ verbatim: *"You're debt-free … Every balance is cleared."* |
| the whole app has exactly two trust guards, both in `money.tsx` | ✅ `:360` `unreadDebts`, `:955` `unreadGoals` |

⚡ **C measured the decisive pair on one store**: `unreadDebts = true` on Money *(so S1.1's fix is working)*
while `selectPlanState = "debt-free"` on Today. **One tab apart, the app both refuses and makes the claim.**

⛔ **DO NOT FIX THIS WITH A THIRD COPY OF THE CONJUNCT.** C says so and it is right: three call sites
already disagreed once this week — that was M9, and it cost a release. **The guard needs ONE owner** every
celebration reads, because the class recurs every time a new screen learns to say *"cleared"*.

---

## ⛔ A GAP IN MY OWN SURFACE DEFINITION, found by verifying D-2

The blocker's wiring site is `apps/rn/src/app/(tabs)/index.tsx` and its allocation comes from
`apps/rn/src/store/selectors.ts` and `recoverySelectors.ts`. **None of the three is on the S1 surface**
(`scripts/surface-coverage.s1.json`) — so the file where the defect is actually wired is not on the money
surface's inventory at all, and neither is the selector that produces the number.

⚡ **This is the docstring's own warning landing on its author within the hour.** `surface-coverage.ts`
says *"an inclusion list fails **silent** — a surface file nobody thought to enumerate is simply absent"*,
and S1's roots are a hybrid: three directories plus a hand-listed set of `store/` files. **The hand-listed
half is an inclusion list.**

⚠️ **D found it anyway, by following the data flow across the seam** — which is the argument for cutting
surfaces along data flow rather than directories, already written into the plan and not yet applied to this
config.

⭐ **AUDITOR B REACHED THIS INDEPENDENTLY AND MEASURED IT HARDER** *(its major 5, arrived after this
section was written)*: `index.tsx` is **1,087 lines and imports 19 `components/plan` modules**; on-surface
coverage is **6 of 88** files in `store/`, **3 of 21** in `data/`, **1 of 4** in `(tabs)/`.
⛔ **And it refutes a sentence I wrote in the instrument's own docstring** — *"the FILE LIST is walked from
disk (mechanical, **cannot undercount**)"*, repeated at `DEBT_ELEVATION_LOG.md:1109`. **That is true of S0's
directory roots and false of S1's hybrid**, and I did not notice the claim stopped holding when I widened
the tool. ⚠️ B also found the claim-value validation is missing: **any value that is not exactly
`never`/`unknown`/`partial` reads as SWEPT**, so a typo silently marks a file covered.

**Missing from S1 and squarely money** *(to be added at S1.4, once the auditors stop reading the file)*:
`app/(tabs)/index.tsx` · `store/selectors.ts` · `store/recoverySelectors.ts` · `store/balanceSelectors.ts` ·
`store/celebrationSelectors.ts` · `store/guardianSubjects.ts` · `store/incomeLearning.ts`.
⛔ **That list is a floor, not an enumeration** — it came from one file's import block. The fix is to widen
the ROOTS to whole directories and route the exclusions, not to extend the hand-list.
