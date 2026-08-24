# P6.8.9.2 — the verification pass, all 33 ids

**Method.** Seven independent verifiers, one per build cluster, none of which built the fix it checked and
none of which was told what had been built. Each got the finding text, `DEBT_ELEVATION_LOG.md`, the code,
the re-shot matrix, and [`BRIEF.md`](BRIEF.md)'s three questions. Per-id detail with `path:line` citations
is in the `cluster-*.md` files beside this one.

## The result

| verdict | n | |
|---|---|---|
| `CLOSED` | **11** | observation gone, preserved properties intact, a test pins it |
| `CLOSED-UNPINNED` | **10** | observation gone, **nothing would catch a regression** |
| `PARTIAL` | **11** | named property fixed; another regressed, or sites unreached |
| `WRONG-REMEDY` | **1** | V2-6 |
| `OPEN` | **0** | |
| `NOT-A-DEFECT` | **0** | |

⚡ **Zero OPEN and zero NOT-A-DEFECT is the headline.** Every observation the audit made was real and
every remedy that shipped was aimed at something true. **The entire residue sits in the two places the
brief predicted** — *what else the site was doing* (11 partials) and *whether anything stops it un-fixing*
(10 unpinned). This is the **fifth** independent confirmation of the law a–g produced.

⛔ **Consequence for the exit criterion.** `lint:closure` counts **mentions in a ledger**. It cannot see
either failure category, so it can go clean while 21 of 33 fixes are unpinned or partial. **P6.8.9.6 must
not be read as "the sweep is done."**

## By cluster

| cluster | ids | result |
|---|---|---|
| **b** copy | A4 · M1-9 · C6 · M1-8 · L1-22 · P1-10 | 4 unpinned · 2 partial |
| **c** data | B1 · B4 · W1-6 · M3-20 | 2 closed · 2 partial |
| **d** cloud | B3 · C9 · M3-5 | 3 unpinned — one shared cause |
| **e** core loop | B2 · C1 · C2 · C5 | 3 closed · 1 partial |
| **f** a11y | A1-2 · A1-7 · A1-8 · A1-9 · A1-10 | 3 closed · 1 unpinned · 1 partial |
| **f** visual | B6/V1-2 · V1-5 · V2-1 · V2-6 · V3-1 · V3-5 · V3-6 · V4-8 | 2 closed · 2 unpinned · 3 partial · **1 wrong-remedy** |
| **g** new surfaces | C8 · P1-3 · C7 | 1 closed · 2 partial |

## ⛔ The eight that are new work, not re-reads

| id | what the verifier found | why it matters |
|---|---|---|
| **V2-6** | the fix closed the refuter's *addendum* and left the finding. `ESTIMATED_CALLOUT_H 132 → 144` moved the callout top y437 → **y415, 22 px FURTHER into the card**. `CoachMarkLayer.tsx:115` still reads no sibling's frame — the cure V2-6 actually named | **the only fix that made its own defect worse** |
| **B1** 🔒 | `SaveForItSheet.tsx:79` never converted, still admits `Infinity`; `runMigrations` leaves `paycheck.amount` and `goals` **unrepaired for blobs already on disk from v1.6** | a blocker, recorded closed, residue on the **upgrade path** — the one population a reinstall cannot rescue |
| **C7** | when a strategy never reaches zero (**16 of 960** portfolios, measured on the real engine) `compareStrategies.ts:108` returns the literal `"."`; `strategy-compare.spec.ts:77` asserts `text.length > 0` and **passes over it** | new 2.0 surface, empty exactly where the strategies most disagree |
| **B2** | `store.ts:44`'s "never overwrite a pending payoff" can **silently swallow the once-ever finale** when two debts clear in separate actions — and its comment claims a later finale check **that does not exist** | irreversible; the user cannot get it back |
| **`lint:contrast`** | clean on the token grid, **not as a class**: `GROUNDS` is `background.*` only and `#ffffff` is treated as primitive, so white ink on a semantic accent fill is uncovered. Two live dark AA failures behind it — `ListRow.tsx:205` **2.69:1**, `SpokenForSheet.tsx:166` **2.72:1** | the gate that out-found its slice has a blind class of its own |
| **A1-10** | the primitive was built and is correct; **the finding's own quoted line was never touched** (`SaveFailedBanner.tsx:30-31`, one commit `fb9a821`, pre-dating f). `check-native-a11y-props.ts` still does not ban bare `accessibilityLiveRegion` | a **remedy built and not applied** — a new failure shape |
| **M1-8** | `DEBT_3.5_DEVICE_QA_CHECKLIST.md:575` still tells a tester to confirm the **deleted** control exists, ticked `[x]` — in the file the plan calls *"the runnable truth"* for P6.14 | it will mis-drive the **final device pass** |
| **L1-22** | `ROOTS` is `packages/core` + `apps/rn/src` only. **7 user-facing straight apostrophes ship in Swift**, 6 of them Siri/Shortcuts copy in `plugins/app-intents-swift/` | the class is closed for TypeScript and **open everywhere else** |

## Two results worth keeping as method

- ⭐ **P1-3 is the model.** The lens had flagged one of its own clauses as unresolvable from stills. The
  builder resolved it **by running the engine** instead of inheriting it — which is what stopped the item
  being spent hunting a rendering bug that did not exist. *A lens usually knows which of its claims is soft.*
- ⭐ **C6 and M3-5 were right to REFUSE their finding's remedy.** C6's pre-written wording ("nothing
  uploaded… airplane mode") became false when cloud backup shipped; M3-5's remedy would have shipped an
  explanation with no action. **Refusing a stale remedy is a correct outcome, not a skipped one.**
