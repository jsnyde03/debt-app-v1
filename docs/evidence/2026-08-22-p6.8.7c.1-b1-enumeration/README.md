# B1 — `NaN <= 0` amount guards: the ENUMERATION

**P6.8.7c.1, 2026-08-22.** The step's own instruction was *enumerate before editing*, because three
different counts existed and **none of them was the answer**.

## The counts, and why each was wrong

| source | count | what it actually was |
|---|---|---|
| original filing | **4 sites / 2 files** | the two onboarding files only |
| P6.8 audit (SYNTHESIS B1) | **12 sites / 7 files** | the right files, two sites short |
| 7b after-scan crude grep | **14 sites / 8 files** | 13 real + **a code COMMENT** in `data/migrations.ts:34`; the 8th "file" is that comment |
| ⭐ **measured here** | **14 sites / 7 files** | 13 inline + **1 hoisted** the grep shape cannot see |

⛔ **The 7b grep and this enumeration both say 14 and they are NOT the same 14.** A matching total is not
a matching membership — the grep counted a comment and missed a real site.

## What the shape-grep structurally cannot find

`DebtSheet.tsx` hoists the coercion before comparing:

```ts
const bnplSched = Number(scheduledPaymentAmount);   // line 134
...
if (bnplSched <= 0) return setError('Enter the payment amount.');   // line 163
```

Same defect, no `Number(x) <= 0` on one line. **Any enumeration of this class done by grepping the
literal expression undercounts by construction.**

## The 14 defective sites

| # | file:line | field | persists |
|---|---|---|---|
| 1 | `components/entities/DebtSheet.tsx:187` | balance | `balance: NaN` |
| 2 | `components/entities/DebtSheet.tsx:188` | minimumPayment | `minimumPayment: NaN` |
| 3 | `components/entities/DebtSheet.tsx:163` ⚠️ hoisted | scheduledPaymentAmount | `balance` **and** `minimumPayment: NaN` (derived) |
| 4 | `components/entities/ExpenseSheet.tsx:53` | fullAmount | `fullAmount: NaN` |
| 5 | `components/entities/ExpenseSheet.tsx:56` | amount | `amount: NaN` |
| 6 | `components/entities/GoalSheet.tsx:34` | target | `targetAmount: NaN` |
| 7 | `components/entities/LivingExpenseSheet.tsx:33` | amount | `amount: NaN` |
| 8 | `components/onboarding/FirstDebtOrBillStep.tsx:44` | balance | `balance: NaN` |
| 9 | `components/onboarding/FirstDebtOrBillStep.tsx:48` | minimumPayment | `minimumPayment: NaN` |
| 10 | `components/onboarding/FirstDebtOrBillStep.tsx:52` | amount | `amount: NaN` |
| 11 | `components/onboarding/PaycheckStep.tsx:40` | amount | ⚠️ `paycheck.amount` is a **string by design** — persists `"1,200"` |
| 12 | `components/onboarding/PaycheckStep.tsx:56` | lean | `leanAmount: NaN` |
| 13 | `components/plan/PaycheckSheet.tsx:50` | amount | ⚠️ persists `"1,200"` (string field) |
| 14 | `components/plan/PaycheckSheet.tsx:61` | lean | `leanAmount: NaN` |

**Three comparison guards fall open as a consequence** and need no separate fix — they are correct once
their operands are: `DebtSheet.tsx:189` (`min > balance`), `PaycheckStep.tsx:57` and
`PaycheckSheet.tsx:62` (`lean > amount`). `NaN > NaN` is `false`, so each passes.

## Two sites that LOOK defective and are not — measured, not assumed

- **`DebtSheet.tsx:164`** — `bnplRem <= 0 || !Number.isInteger(bnplRem)`. `Number.isInteger(NaN)` is
  **`false`**, so the second clause catches NaN. ⚡ **Accidentally safe** — the integer check is doing
  finite-checking work nobody wrote it to do. It is *not* a pattern to copy.
- **`ExpenseSheet.tsx:52`** — `amount !== '' && !(Number(amount) >= 0)`. `NaN >= 0` is `false`, negated
  → `true` → errors. **Correct**, and a third distinct correct shape in the tree.

## The tree already contains FOUR correct expressions and they do not agree on form

| site | expression |
|---|---|
| `plan/WindfallSheet.tsx:50` | `!!amount.trim() && Number.isFinite(n) && n > 0` |
| `plan/AffordabilityCard.tsx:65` | `amount.trim() && Number.isFinite(n) && n > 0` |
| `entities/LogPaymentSheet.tsx:24-25` | `Number.parseFloat` + `Number.isFinite(parsed) && parsed > 0` |
| `payday/PaydayCaptureSheet.tsx:119` | `Number.isFinite(typed) && typed >= 0` |

⚠️ **`LogPaymentSheet` uses `parseFloat`, the others use `Number`** — and they disagree on `"1,200"`
only by accident (`parseFloat("1,200")` is **1**, not NaN). That divergence is its own latent defect and
is why the fix must be **one shared parser**, not fourteen copies of a good line.

## Measured semantics — `b1-semantics.output.txt`

Five inputs pass the shipped guard and persist as `null` through `JSON.stringify`:

```
raw        Number()     old-guard-passes   new-guard-passes
"1,200"    NaN          true               false
"abc"      NaN          true               false
"Infinity" Infinity     true               false     ← not in the finding
"$1200"    NaN          true               false
"1 200"    NaN          true               false
"1.200"    1.2          true               true      ← accepted by both; see the locale note
```

⚡ **`Infinity` is a site the finding never mentioned.** `Infinity <= 0` is `false`, so it passes, and
`JSON.stringify({b: Infinity})` is `{"b": null}` — identical corruption, different keystroke.

## Reachability — what is claimed and what is measured

**Measured (code-certain):** the guard admits the value and the value round-trips to `null`.

**NOT yet measured — the keystroke.** `keyboardType="decimal-pad"` does not restrict **paste**, a
hardware keyboard (the app ships iPad key commands), or a device whose locale decimal separator is a
comma. The v1.6 → RN bridge is the vector that needs no keystroke at all: R1 verified the identical
guard in `v1.6-dev:components/Onboarding/FirstDebtOrBillStep.tsx:35`, so **data already on disk can
carry this**. ⛔ Frequency is a hypothesis; the corruption is not.

## Regenerate

```bash
node docs/evidence/2026-08-22-p6.8.7c.1-b1-enumeration/b1-semantics.mjs
# the enumeration itself:
grep -rn --include="*.ts" --include="*.tsx" -E "(Number|parseFloat|parseInt)\s*\([^)]*\)\s*(<=|<)\s*0" apps/rn/src
grep -rn --include="*.tsx" -E "keyboardType\s*=\s*\"(numeric|decimal-pad|number-pad)" apps/rn/src
```
⛔ **The second grep is the one that matters** — enumerate the INPUTS, then trace each to its guard.
Enumerating the guard expression is what produced 4, 12 and 14-with-a-comment.
