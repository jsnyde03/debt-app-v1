# W1 — the duplicate-copy triage (2026-08-12)

**Input:** `docs/audits/strings-inventory.md` → "Duplicated across files — copy only".
**Judgement lives here** because the inventory is generated and overwritten on every run.

> ⛔ **The headline number was wrong, and the before-scan caught it.** The plan carried *"210 cross-file
> duplicates, the wording gate's first task."* Measured from the JSON sidecar: **210 repeated strings, of
> which 110 carry copy and 100 do not** — `space-between`, `decimal-pad`, `chevron-right`, `/paywall`,
> `optional_goal`. Style tokens, icon names, routes and enum ids, presented as a wording queue.
>
> ⚡ The cause was one inconsistency **inside T1**: the T2 gate filtered `bucket === 'copy'`
> (`strings-inventory.ts:317`) and the report section did not (`:292`) — while the T3 table's own note
> twelve lines away states the rule it broke: *"reuses one classification instead of inventing a second
> heuristic."* Fixed in W1.1; the gate was deliberately left untouched so its baseline keeps meaning what
> it was accepted for.

---

## ⭐ Cluster 1 — the paycheck form is implemented TWICE, verbatim

`PaycheckStep.tsx` (onboarding) and `PaycheckSheet.tsx` (edit) share **~13 strings**, including the
whole `CYCLES` array — byte-identical, sublabel included:

`Weekly` · `Bi-Weekly` · `Semi-Monthly` · `e.g. 1st & 15th` · `Monthly` · `Paycheck amount` · `e.g. 1500`
· `My income varies` · `The amount you can count on` · `Pay cycle` · `First payday` · `Second payday` ·
`Payday (day of month)` · `Next paycheck` · `Continue` ·
`Your plan runs on this floor, so a lighter paycheck never breaks it.`

**The largest single "two places, one rule" instance in the app.** They agree today; nothing makes them.

**→ EXTRACT** one `payCycleOptions` + shared field-label module.

## ⭐ Cluster 2 — recurrence labels have ALREADY DIVERGED (a live, user-visible defect)

Not a latent duplicate — a **shipped inconsistency**:

| where | value | label |
|---|---|---|
| `ExpenseSheet.tsx:19` | `one-time` | **"One time"** |
| `DebtSheet.tsx:46` (BNPL cadence) | `one-time` | **"One-time"** |
| `money.tsx:631` (section title) | — | **"One-time"** |

**A user sets a bill to "One time" and Money files it under a heading called "One-time".** One object, two
spellings, one screen apart.

The two `RECURRENCE` arrays have also drifted in *content*: `DebtSheet` has six options and no `one-time`;
`ExpenseSheet` has seven and includes it. *(That difference may be deliberate — a debt is terminating by
definition — but it is undeclared, which is the problem.)*

⚠️ Also inside `DebtSheet` alone: `quarterly` is **"Quarterly"** in `RECURRENCE` and **"Every 3 months"**
in `BNPL_CADENCE`. Plausibly deliberate for BNPL, and nothing says so.

**→ EXTRACT + settle the spelling.** This one is a defect, not hygiene.

## Cluster 3 — bill category labels, kept as two records

`money.tsx:496` `BILL_CATEGORY_LABEL` (a `Record`) and `ExpenseSheet.tsx:22` `CATEGORY` (an ordered array
carrying a `[D25]` comment). Same seven categories, same seven labels, agreeing today.

**→ EXTRACT** one authority exporting order *and* labels.

## Cluster 4 — sheet validation messages, written per sheet

`Enter a name.` ×5 · `Enter an amount greater than 0.` ×3 · `Enter the current balance.` ×2 ·
`Enter the minimum payment.` ×2 — across `DebtSheet`, `ExpenseSheet`, `GoalSheet`, `LivingExpenseSheet`,
`FirstDebtOrBillStep`.

⚠️ **`FirstDebtOrBillStep` duplicates `DebtSheet`'s field copy too** (`Current balance`,
`Minimum payment`, `e.g. 2400`, `e.g. 22.99`, `Amount`) — Cluster 1's shape a second time: an onboarding
step re-implementing a sheet.

**→ EXTRACT** to one validation/field-copy module.

---

## Leave alone — and the reason is already measured

- **Generic UI verbs** — `Save` `Add` `Close` `Cancel` `Undo` `Got it` `Not now` `Done` `Back` `Share`
  `Delete` `Name` `Amount` `Type` `More`. T2's threshold note settles this: *"Below 20 the set is
  'Add'/'Save'/'Done'/'/mo' — words two screens are entitled to share, and a gate that fires on them gets
  suppressed, which is worse than no gate."* Extracting a shared `"Save"` constant buys nothing and costs
  a lookup.
- **Guardian band strings** (`Looks clear this paycheck`, `A little tight this paycheck`,
  `Very tight this paycheck`) — the second copy is `LiveActivityQA`'s sample content, which **dies at the
  Phase-6 `QA_TOOLS` flip.** Already in T2's baseline. No action.
- **`copy+unclassified` coincidences** — `at-risk`, `one-time`, `Paid`, `Required`, `Today`, `Progress`.
  The same text is a user-facing string in one place and an enum id or route in another. Coincidence, not
  divergence; judge only the copy instance.

## → The wording/voice gate (judgement, not structure)

`Private by design` · `See it in action` · `Unlock Premium` · `An ongoing cost that doesn't end.` ·
`reserved per paycheck` · `Start my real plan` · `Keep going` · `Share your win` · `Overdue` ·
`Vanquished` / `Paid off` · **`Safety net` vs `your emergency fund` vs `Emergency fund`** — a vocabulary
question the gate owns, adjacent to `[D22d]`'s "bills" vernacular.

## ⚠️ Filed — T1 over-reports the `copy` bucket in two identifiable ways

Both measured, both false positives, and they matter because **794 "copy" is the wording gate's scope
claim** — and this script's own line 121 says *"an inventory that over-reports is as useless for review as
one that under-reports."*

1. **`key:label` when the value is a colour.** `CashFlowSection.tsx:25-30`'s `barTone()` returns
   `{ grad, glow, label }` where `label` is a **hex chart tone** — so `#fb7185` `#dc2626` `#fbbf24`
   `#b45309` `#a6b9d4` `#5a6b82` all sit in the copy bucket.
2. **`return` when the function returns an enum union.** `computeState.ts:33/49/54` bare-returns
   `"at-risk"` / `"tight"` / `"clear"` — `GuardianState` values, not user-facing copy.

**→ the classification pass that owns the 928 unclassified**, which is the same lens pointed the other way.
