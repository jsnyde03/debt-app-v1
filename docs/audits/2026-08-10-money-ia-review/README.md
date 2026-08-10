# Money page — information architecture review

**Date:** 2026-08-10 · **Scope:** `apps/rn/src/app/(tabs)/money.tsx`, its section components, the
storage/engine modules that feed it. Read-only review — no source changed.

**Premise under test (Jason):** "Debts and bills are still owed. Bills shouldn't be excluded. I
think that we may need a redesign." Sharpened mid-review to a harder claim: *the debt/bill
separation may itself be wrong — a debt = bill and a bill = debt.*

---

## 1. What the Money page asserts today

`apps/rn/src/app/(tabs)/money.tsx:52` defines `MoneyView = 'debts' | 'bills' | 'goals'`, and the
screen (`money.tsx:71-91`) renders one `SegmentedToggle` (`money.tsx:79-87`) switching between
three fully separate section components. State defaults to `'debts'` (`money.tsx:72`), and the
screen's own doc-comment (`money.tsx:47-51`) is explicit: *"Debts is the hero and opens first."*

**Debts** (`DebtsSection`, `money.tsx:95-284`)
- Hero = sum of live debt balances only: `totalBal = active.reduce((s,d) => s + …currentBalance, 0)`
  (`money.tsx:191`), labeled "remaining across N debts" (`money.tsx:202`).
- A snowball/avalanche strategy toggle (`money.tsx:204-217`) that drives payoff order.
- Each row shows balance + APR (or a BNPL-specific line) and `minimumPayment` (`money.tsx:322-340`).
- Progress bar per row = `1 - currentBalance/originalBalance` (`money.tsx:316`).
- A "PAID OFF" section keeps cleared debts visible as a group (`money.tsx:194-195`).
- Add via `AddRow "Add debt"` → `DebtSheet` (`money.tsx:243`), or "Scan a statement" → OCR prefill
  (`money.tsx:245`, `handleScan`, `money.tsx:162-168`).
- Empty state promises "**to see your debt-free date**" (`money.tsx:176-177`).

**Bills** (`BillsSection`, `money.tsx:386-599`)
- Hero = `perPaycheckTotal` reserved per paycheck, or `oneTimeTotal` when there's no recurring load
  (`money.tsx:526-535`). There is **no balance concept** — `RequiredExpense` has no `balance` field
  (confirmed against `packages/core/storage/debtPlannerStorage.ts:11-40`, re-exported verbatim by
  `apps/rn/src/data/models.ts:8-19`).
- Categorized into housing/utilities/insurance/subscriptions/medical/other + a separate "One-time"
  group once the list reaches `BILL_GROUPING_THRESHOLD = 8` (`money.tsx:375, 463-496`).
- Add via `AddRow "Add bill"` → `ExpenseSheet` (`money.tsx:590`).
- Empty state promises "so your plan **knows what's due**" (`money.tsx:515`) — a different, lesser
  promise than Debts' "debt-free date."

**Goals** (`GoalsSection`, `money.tsx:703-757`) — saved/target + % funded, its own add flow.

**Adding an entity, confirmed per type:**
- Debt: `DebtSheet` (`apps/rn/src/components/entities/DebtSheet.tsx`) — Name, Current balance,
  Minimum payment, APR (optional), due date, recurrence, autopay, BNPL fields.
- Bill: `ExpenseSheet` (`apps/rn/src/components/entities/ExpenseSheet.tsx:89-115`) — Name, Amount,
  Due date, Recurrence, Category, Variable/Trial/Autopay toggles. **No balance field exists to
  enter, and the form never mentions "debt."** (Grepped for `balance|debt|APR` in the file: zero
  matches.)
- First-run onboarding (`apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:100-110`) asks
  the user to choose Debt vs Bill via a bare `SegmentedToggle` with **no guidance** on which to pick
  for an ambiguous case (a medical bill, a payment plan, an informal loan).

## 2. Where "owed" is split

`Debt` (`debtPlannerStorage.ts:42-85`) carries `balance`, `minimumPayment`, `apr`,
`originalBalance`. `RequiredExpense` (`debtPlannerStorage.ts:11-40`) carries `amount`, `dueDate`,
`recurrence`, `category` — **no balance, no APR field exists on the type at all.** This is a
structural fact, not a UI choice: a bill cannot express "how much is left," even if the user wanted
it to.

**The debt-free date is debt-only, structurally.** `selectDebtFreeDate`
(`apps/rn/src/store/planSelectors.ts:65-76`) calls `projectDebtPayoff({ debts: liveDebts, … })`,
passing only `store.debts.filter(d => d.balance > 0)`. `projectDebtPayoff`'s own parameter type
(`packages/core/debt/projectDebtPayoff.ts:7-12`) has no `requiredExpenses` field — bills are not
merely filtered out, they **cannot be passed in.** Verified: no reference to `requiredExpenses`
anywhere in `projectDebtPayoff.ts`.

**No total-owed figure exists anywhere that spans both.**
- Money > Debts' hero (`totalBal`, `money.tsx:191`) sums debt balances only.
- Money > Bills' hero has no balance to sum — `perPaycheckTotal`/`oneTimeTotal` are flow figures
  (money *reserved*, not money *owed as a stock*).
- `PayCycleSnapshot.totalDebtBalance` (`debtPlannerStorage.ts:198`) — debt-only, feeds History.
- Progress screen's hero date (`apps/rn/src/app/(tabs)/progress.tsx:172,200`) reads
  `view.debtFreeDate` — debt-only, same selector as above.
- The one place bills and debts genuinely get summed together is `PlanSummary.requiredTotal`
  (`planSelectors.ts:275` = `allocation.totalRequired`), built in
  `packages/core/engine/allocatePaycheck.ts:198-210` as
  `expenseRequiredTotal + debtMinimumRequiredTotal`. This is real and correct as far as it goes —
  but it is a **per-cycle flow figure** ("what's due before the next paycheck"), not a stock/balance
  figure. It cannot answer "how much do I owe in total," only "how much do I need this paycheck."

**Today already treats them as one category for one narrow purpose.** `selectRequiredRows`
(`planSelectors.ts:105-141`) merges bill and debt-minimum allocation items into one `RequiredRow[]`
list, rendered by `RequiredActionsCard` (`apps/rn/src/components/plan/RequiredActionsCard.tsx:34-44`,
doc-commented "the required bills + debt minimums due this paycheck"). So the app already presents
them as one thing on Today, and as two unrelated species on Money — the premise's observation is
correct and precisely locatable.

## 3. What it costs the user

Ranked by severity:

1. **A real debt entered as a bill is caught by nothing — and the sharpest case is rent vs.
   mortgage.** Both are housing, monthly, fixed, non-negotiable; one is perpetual, one terminates.
   `RequiredExpenseCategory` offers `"housing"` (`packages/core/storage/debtPlannerStorage.ts:3-9`),
   which actively invites a mortgage into the perpetual bucket — reserved correctly every payday
   (`allocatePaycheck.ts:198-210`), but silently omitted from the payoff plan and the debt-free date
   (§2), with nothing catching it. This is not hypothetical: `ExpenseSheet.tsx` has zero mention of
   balance, debt, or APR, and the shared preset list `packages/core/constants/requiredExpensePresets.ts:10-59`
   — a one-tap "fill this bill in for me" grid, currently wired into the legacy Capacitor shell's
   `components/RequiredExpenses/AddExpenseModal.tsx:99-116` but not (yet) into the RN `ExpenseSheet`
   this review scopes — **offers "Rent / Mortgage," "Credit Card Payment," and "Loan Payment" as
   one-tap Bill presets.** The preset data itself commits the exact mistake this review exists to
   flag, and would ship it into the RN app the moment someone wires presets into `ExpenseSheet` as a
   plausible near-term enhancement. If a mis-filed debt is instead given `recurrence: 'monthly'` (the
   form's default, `ExpenseSheet.tsx:38`), it's presented as an unchanging, non-shrinking obligation
   forever — no interest math (no field for it), no payoff date, no progress bar. `recurrence:
   'one-time'` isn't a real fix either — a one-time `RequiredExpense` is **dropped entirely** the
   cycle after it's marked paid (`packages/core/recurrence/rolloverPayCycle.ts:100-106`), not
   amortized down.
2. **No surface answers "how much do I actually owe, all in."** A user with a mix of card debt and
   a medical payment plan or informal loan filed as a "bill" cannot get a true total anywhere in the
   app (§2). Their debt-free date is quietly partial.
3. **The payoff narrative — and its motivational machinery — doesn't reach bill-shaped debt.** Debts
   gets a focus debt (`payoffSelectors.ts:101`), a progress bar, a snowball/avalanche strategy, a
   "PAID OFF" trophy case, and dedicated celebration UI (`VanquishedBeat`, full-screen
   `PaidOffFinale` — `apps/rn/src/app/(tabs)/index.tsx:433-445`). None of it exists for Bills. A user
   paying off a medical bill gets no focus, no progress, no win — the app's actual reward loop
   never fires for money that is, in every real sense, debt.
4. **A credit-risk leak, not just a cosmetic one.** Debt minimums are hardcoded essential in the
   Recovery Plan "by rule (credit impact)" (`packages/core/recovery/buildRecoveryPlan.ts:8-12`
   comment) — real debts can never be suggested for deferral during a shortfall. A debt mis-filed as
   a Bill has no such protection: `RequiredExpense.deferability` (`debtPlannerStorage.ts:39`) can
   default or be toggled to `"deferrable"` via `classifyDeferability`
   (`packages/core/obligations/classifyDeferability.ts:16-19`), and the Recovery Plan could then
   suggest deferring what is actually a real debt payment — exactly the harm the essential-by-rule
   carve-out exists to prevent.
5. **Where the design is actually right:** the two paths that produce ambiguous data automatically —
   CSV import (`packages/core/imports/debtCsv.ts`) and statement-scan prefill
   (`parseStatementText`, wired at `money.tsx:162-168`) — are both debt-specific by construction. A
   real credit-card/loan statement naturally has a balance and a minimum, so the tool routes it
   correctly without asking. The ambiguity is concentrated entirely in **manual entry of genuinely
   ambiguous obligations** (medical bills, payment plans, informal loans) — not in the
   well-instrumented paths. That's a real, defensible boundary, not something to discard.

## 4. Design: the model is right; naming and entry are not

**Closed, per Jason directly:** the terminating/perpetual split is the *deliberate* design intent,
not an accident to fix. His own words: *"Expenses are things like rent, utilities, living expenses,
subscriptions etc. that do not have an end date. Debts are bill[s]. Credit card, BNPL, Loans,
Mortgage. Debts are the items that we want to track."* No option below touches `Debt`/`RequiredExpense`
or any engine module — that hypothesis (§4 in the prior draft of this review) is retired. What
follows is scoped to naming, entry, and recovering from a mistake already made — including by the
taxonomy's own author, which is the strongest evidence naming alone won't fully carry this (Jason:
*"if it confuses me then it'll confuse someone else too"*).

### 4.1 Naming — where "Bill" actively fights the author's own definition

The internal type is already named correctly: `RequiredExpense`
(`packages/core/storage/debtPlannerStorage.ts:11`). The drift is UI-only — every user-facing surface
built on it says "Bill" instead. Audited every user-facing string in `apps/rn/src` containing "bill":

| Surface | String | file:line | Misleading under Jason's definition? |
|---|---|---|---|
| Money section toggle | `'Bills'` | `money.tsx:84` | **Yes — the label itself.** A credit-card *bill* is a debt; this is the exact collision Jason named. |
| Bills empty state | "Add a required bill or payment…", "Add your first bill" | `money.tsx:515-516` | **Yes.** |
| Bills add row | `"Add bill"` | `money.tsx:590` | **Yes.** |
| Bills search | `"Search bills"` | `money.tsx:624` | Minor, same family. |
| Bill pluralizer / one-time copy | `'bill'/'bills'`, `"N one-time bills"` | `money.tsx:524,529,664,492` | Minor, follows the section name. |
| Add/edit sheet title + subtitle + CTA | `"Edit bill"`, `"Add a bill"`, `"A required bill or payment due each cycle."`, `"Add bill"` | `ExpenseSheet.tsx:92-94` | **Yes — sharpest case.** The component's own internal type is `RequiredExpense`; the sheet overrides it to say "bill" in every visible string. |
| First-run onboarding | Toggle option `'Bill'`, field label `'Bill name'`, component name `FirstDebtOrBillStep` | `FirstDebtOrBillStep.tsx:103,113` | **Yes — this is the user's first exposure to the taxonomy**, unguided (§1). |
| Breakdown sheet | "…opened from the Bills hero. Itemizes each recurring bill…", `'bill'/'bills'` | `BillBreakdownSheet.tsx:45,95` | Yes, downstream of the section name. |
| Push notification | Title `'Upcoming bill'` / `` `${count} upcoming bills` ``, built from `requiredExpenses` only | `apps/rn/src/notifications/notifications.ts:101,125-136` | **Yes** — genuinely an Expenses notification, mislabeled. |
| Settings toggle copy | "Paycheck-eve reminder and **bill** alerts." | `more.tsx:194` | Yes, same notification. |
| Preset data (shared, wired into the legacy Capacitor shell only — see §3) | `"Rent / Mortgage"`, `"Credit Card Payment"`, `"Loan Payment"`, `"Medical Bill"`, `"Other Bill"` | `packages/core/constants/requiredExpensePresets.ts:10-59` | **Yes, and the worst offender** — the *data*, not just the copy, commits the mistake. Not currently wired into the RN `ExpenseSheet` this review scopes, but the shared source is where a future "add presets to RN" pass would inherit it from. |
| Guardian attestation / discovery holdback ("bills complete," "I got to know your bills") | Many — `index.tsx:136,471,777,780`; `guardianSelectors.ts:140,312,329,378,382,387,389`; `PaydayGuardianCard.tsx:69,158-159,363,473`; `tutorialPath.ts:113,139,183` | Broader Guardian language | **Out of scope for this fix.** This is colloquial usage about "have all your regular outflows been told to the Guardian" — arguably still correct as "bills" in the vernacular sense Jason used when he said "Debts are bill[s]" too. Renaming the *section* doesn't require touching this; flagged only for optional later consistency. |

**Recommendation: rename the section "Bills" → "Expenses"** (`money.tsx:84` and every row above marked
"Yes") including the sheet title/CTA and the onboarding step. This is copy-only — no field, type, or
store action changes. It directly fixes the collision Jason named ("a credit card *bill* is a
debt") by removing the word that invites it. **But treat it as necessary, not sufficient** — per
§4.2/§4.3, the strongest evidence in this whole review is that the taxonomy's own author mis-filed
under it; a clearer label helps a first-time reader, but it does nothing for someone who never reads
labels closely enough to be stopped by one, which by Jason's own account includes him.

### 4.2 Remove the classification decision from the user

**How Add is wired today:** three independent, hardcoded entry points, one per section — `AddRow
label="Add debt"` → `DebtSheet` (`money.tsx:243`), `AddRow label="Add bill"` → `ExpenseSheet`
(`money.tsx:590`), `AddRow label="Add goal"` → `GoalSheet` (`money.tsx:753`). The user must pick the
correct *section* — i.e. solve the taxonomy — before they can type a name. That's backwards: the
taxonomy is exactly the thing they're getting wrong.

**Jason's proposal, evaluated:** collapse to one `Add`, first asking "What are you adding? Something
you owe · A savings goal" (Goals needs its own fork — see §4.5 — collapsing it into a balance
question would confuse two different axes: *owing* vs. *saving*). Within "something you owe," ask
one question in the user's own language: **"Does this have a balance you're paying down?"** with
concrete examples on each side (Yes: Visa, car loan, mortgage, BNPL · No: rent, phone, Netflix), then
render the right fields and file it correctly. This is not a proxy for the terminating/perpetual
axis — **it is that axis, restated as a fact the user already knows about their own obligation
instead of a taxonomy they have to learn.** It's the strongest single fix in this document: it
directly answers the housing case (§3 #1) because "does my mortgage have a balance I'm paying down"
has an obvious correct answer, where "is my mortgage a Bill or a Debt" does not.

**What it takes to build (presentation layer only):** `DebtSheet`, `ExpenseSheet`, and `GoalSheet`
stay exactly as they are — the chooser is a new, small component that sits in front of them and
routes to the existing sheet unchanged, exactly as `DebtSheet`'s existing `prefill?: Partial<Debt>`
prop already lets a caller open it pre-seeded (used today for scan-to-prefill, `money.tsx:162-168`).
Concretely: replace the three `AddRow`s (or add one screen-level `Add` next to `MoreButton` at
`money.tsx:78`) with one entry point that opens a 2-step chooser, then opens `DebtSheet` or
`ExpenseSheet` (seeded with whatever name/amount the user already typed at the chooser step, same
mechanism as prefill) or `GoalSheet`. No `packages/core` change, no store/type change — this is a
`money.tsx`-and-one-new-component change.

### 4.3 A one-line definition, visible while browsing

Add a persistent (not dismissable-away) one-line caption under each section header — concrete nouns,
not definitions, matching Jason's own phrasing:
- Under "Debts": *"Credit cards, loans, mortgage, BNPL — anything with a balance you're paying off."*
- Under "Expenses": *"Rent, utilities, subscriptions — the recurring cost of living, with no balance
  to pay off."*

This is copy in `money.tsx`'s `DebtsSection`/`BillsSection` render (near the `MoneyHero`,
`money.tsx:200-202` and `539-545`) — no logic change. Cheap, and it's the thing a user glancing at
the screen (not filling out a form) actually sees, unlike a hint buried in an add sheet.

### 4.4 Recovery: catching what's *already* mis-filed

**Highest-value item, per Jason directly** — entry guardrails (§4.2/§4.3) only help the next item; he
already has one filed wrong. Two things are needed: a detector, and a conversion path. Neither exists
today (confirmed: `store.ts:58-70` has `addDebt`/`updateDebt`/`removeDebt` and
`addExpense`/`updateExpense`/`removeExpense` — no conversion action of any kind).

**Detector** — two tiers, both cheap and precise rather than clever:
1. **Category, exact match.** Every `RequiredExpense` with `category === 'housing'`
   (`debtPlannerStorage.ts:3-9`) is Jason's own named ambiguous case (rent vs. mortgage) — flag all
   of them, no false-positive risk beyond "we asked about your housing payment once."
2. **Name, keyword match.** The vocabulary already exists in the codebase in two places and just
   needs to be read as a shared list instead of only as autofill content: the BNPL provider names
   already enumerated in `DebtSheet.tsx:50-59` (Klarna, Affirm, Afterpay, PayPal, Zip, Sezzle) and the
   debt-shaped preset names in `requiredExpensePresets.ts:51-59` ("Credit Card Payment," "Loan
   Payment"), extended with generic terms (card, visa, mastercard, amex, discover, loan, mortgage,
   finance). Match against `RequiredExpense.name`.

**Where it surfaces — neither nagging nor missable.** Not a blocking modal, not a banner re-shown
every launch (there's app precedent for what to avoid: `dismissedTrials`,
`index.tsx:144-146`/`531`, is *ephemeral* and re-asks every open until resolved — wrong shape here;
`store.reviewPrompted`, `index.tsx:583-586`, is persisted-once — closer, but still a launch-time
interruption). Recommend instead a **quiet, permanent, row-level indicator**: a small "Looks like a
debt? Convert" affordance on the matching row itself inside the Expenses list (or its detail sheet),
always present for a matching row until resolved, invisible for every non-matching row, discoverable
on the user's own schedule rather than pushed at them. This also naturally catches *future* mis-files
without needing a fresh one-time scan.

**Conversion — expense to debt, without re-entry.** Add one new store/glue function
`convertExpenseToDebt(expenseId, debtFields)`: it is not silent, because a bill's schema genuinely
never captured balance/APR/minimum-payment — the user must supply those. But name, due date, autopay
carry over for free, using the exact prefill mechanism `DebtSheet` already exposes
(`DebtSheet.tsx:73`, `prefill?: Partial<Debt> | null`, already used for scan-import at
`money.tsx:167`): tapping "Convert to Debt" opens `DebtSheet` pre-seeded from the expense, the user
fills in the balance/APR/minimum it's missing, and on submit the call site also fires
`removeExpense(expenseId)` so the item isn't double-counted. This is store-glue and UI wiring, not an
engine change — `Debt`, `RequiredExpense`, and every `packages/core` payoff/allocation module are
untouched.

### 4.5 Goals — a different axis, not the same ambiguity

`Goal` (`debtPlannerStorage.ts:87-99`) has `targetAmount`/`currentAmount`/`type: "emergency" |
"savings"` — no `dueDate`, no `recurrence`, no notion of being *owed*; it's money the user is building
**up** toward, not a liability. `GoalSheet.tsx:14-34` confirms the form has no balance-owed framing
at all. Goals doesn't suffer this review's ambiguity — the axis it sits on (saving vs. owing) is
orthogonal to the one under dispute (terminating vs. perpetual), which is exactly why §4.2's chooser
forks *before* asking the balance question rather than folding Goals into it: "does this have a
balance you're paying down" would wrongly catch a savings goal too if asked first.

### 4.6 What must merge, what must stay separate

Explicit, because it's easy to over-correct in the same pass as a naming fix: Today's "Required
actions" list is **correct as built** and must not change. `selectRequiredRows`
(`planSelectors.ts:105-141`) merging bills and debt minimums into one due-this-paycheck list, and
`RequiredActionView`/`RequiredAllocationItem` (`deriveRequiredActionView.ts:9-31`) treating them
identically for paid/overdue/autopay state, is right under Jason's own definition — both are owed
*this paycheck*, regardless of which is terminating. The same is true of `PlanSummary.requiredTotal`
(`planSelectors.ts:275`, `allocatePaycheck.ts:198-210`) and the Recovery Plan's obligation-agnostic
`RecoveryCandidate` shape (`buildRecoveryPlan.ts:19-23`) — all correctly obligation-agnostic because
they answer "what do I need to pay this cycle," not "what am I paying off." What must **stay
separate** is exactly what's separate today: the payoff engine (`projectDebtPayoff`, the debt-free
date, `DebtsSection`'s progress bars/focus/celebration) — none of it should start reading
`requiredExpenses`, and nothing in §4.1-§4.4 asks it to.

## 5. Recommendation

Build, in this order, ranked by value per effort:

1. **§4.2, single-entry Add with the balance question** — highest value. It is the one change that
   fixes the problem at the moment it's made rather than after, for every future entry, without
   requiring the user to have correctly read a label first. Presentation-only; touches `money.tsx` +
   one new chooser component.
2. **§4.4, the recovery detector + conversion path** — highest value *for Jason specifically*, since
   he already has a live instance of the mistake and a guardrail alone doesn't reach backward. Also
   presentation/store-glue only; the one new piece of surface area is a single `convertExpenseToDebt`
   glue function plus a row-level affordance.
3. **§4.1, rename Bills → Expenses** — cheap, do it, but don't expect it to carry the fix alone; do it
   alongside #1 rather than as a stand-in for it. The section label and the `ExpenseSheet` title/CTA
   are the highest-leverage strings; the Guardian-copy row in the table is explicitly out of scope.
4. **§4.3, the one-line under-header definitions** — cheap, low-risk, complements #1 for anyone
   browsing rather than adding.

**What I would not do:** don't treat the rename (#3) as sufficient on its own — Jason's own
mis-filing is direct evidence against that, stronger than any argument I could construct. Don't build
a "smart" auto-classifier that silently re-files an item based on the keyword/category detector in
§4.4 — the detector should *surface*, never *act*; a wrong silent re-file (e.g., a legitimately
perpetual "Loan Payment"-named subscription service) would cost more trust than the current silence.
And don't touch `selectRequiredRows`, `RequiredActionView`, or any other already-correct merge point
named in §4.6 while making this pass — that merge is right, and "fixing" it would break something
that isn't broken.

## 6. Open questions for Jason

1. §4.2's chooser puts the balance question in front of every "something I owe" add. Should the
   *existing* per-section `AddRow`s survive alongside it (a debt-tab "Add debt" still exists for
   someone who already knows what they're adding), or should the single entry point fully replace
   them? The review recommends full replacement — one path, no shortcut back into pre-committing to a
   section — but that's a real UX call, not just an engineering one.
2. §4.4's detector will very likely flag Jason's own account's existing item(s). Should the first
   build of the row-level affordance run once retroactively across all existing users' data at
   rollout (a real, if small, population that may have the identical mistake), or ship forward-only
   and let existing mis-files surface only when the user next opens that row?
3. The keyword list in §4.4 (card/visa/mastercard/amex/discover/loan/mortgage/finance) is a genuine
   judgment call on precision vs. recall — too loose and it flags real subscriptions ("Chase Sapphire
   Rewards" as a card-sounding merchant name, say); too tight and it misses real cases. Worth Jason
   spot-checking the list before it ships rather than treating it as self-evidently correct.
4. §4.1 leaves the broader Guardian "bills complete" vernacular untouched as out-of-scope. Confirm
   that's actually fine long-term, or whether "expenses complete" is worth a consistency pass later —
   low stakes either way, but worth a decision rather than a default.
