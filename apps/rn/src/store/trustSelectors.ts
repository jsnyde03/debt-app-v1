import type { DataRepair, Debt, DebtStore } from '@/data/models';

/**
 * ⛔ **THE ONE OWNER OF *"MAY THE APP MAKE A CLAIM ABOUT THIS MONEY?"***
 * [P6.8.9.7.11.18 · S1.5 · pass-1 blocker B1]
 *
 * ⚡ **The whole app had exactly TWO trust guards and both were inline in `money.tsx`.** Meanwhile the
 * same claim was made, unguarded, from two other places: `selectPlanState` → `GraduationBanner`
 * (*"You're debt-free. Every balance is cleared."*) and `progress.tsx`'s *"Every balance paid off"* hero.
 * Measured on one migrated store with two blank balances: **Money refused the claim while Today made it.**
 * ⛔ **One tab apart, on one store, the app both refused and asserted the same sentence** — and the
 * repaired `0`s are permanent, so both screens keep celebrating for the life of the install.
 *
 * ⛔ **ANOTHER COPY OF THE CONJUNCT WAS THE WRONG FIX AND IS WHY THIS FILE EXISTS.** Call sites carrying
 * the same rule independently had **already** disagreed once this week: that was M9, where one goal was
 * called a different thing on every screen that named it, because each site tested `type === 'emergency'`
 * for itself. The remedy there was to ask **one owner** (`primaryEmergencyGoal`), and this is the same
 * remedy for the same shape. ⚠️ **The class recurs every time a new screen learns to say "cleared"**, so
 * the guard has to be a function a new screen can *find*, not a pattern it has to *remember*.
 *
 * ⚠️ **`selectPlanState` returns `'debt-free-unverified'` rather than calling this at the render site.**
 * Making the state unrepresentable beats making the check easy: a screen that forgets to ask gets a state
 * it does not handle, instead of a celebration it should not show.
 */

/**
 * Is there a repair on a debt's **balance** that was not a clean recovery?
 *
 * ⛔ **FIELD-SPECIFIC, AND THAT IS A FIX RATHER THAN A NARROWING.** [A ⓪-5's minor] `money.tsx`'s inline
 * guard tested `r.entity === 'debt'` with no field test. That was harmless while `balance` was nearly the
 * only debt field that could produce a repair — and **S1.1's own ⓪-3 fix made it wrong**, because an
 * absent required `apr` or `minimumPayment` now records a repair too, and neither says anything about
 * whether the balances are trustworthy. The claim is about balances, so the guard reads balances.
 *
 * ⚠️ **`recovered` is deliberately excluded and the exclusion is load-bearing in BOTH directions.** A
 * recovered value is exactly right and only its format was wrong (`'4,000'` → `4000`), so suppressing a
 * true celebration over one would be its own false statement. ⛔ **And that exclusion is precisely what
 * made blocker ⓪-1 possible** — `Number('')` was `0` and classified `recovered` — which is why the
 * classification itself is pinned by `migrations.test.ts`'s table rather than trusted here.
 */
/**
 * ⛔ **S1.11.4.1 [pass-4 `F-B4`] — THE LOUDEST LOSS WAS THE ONE IT COULD NOT SEE, AND THE OTHER PRODUCER
 * OF THIS FACT IS TWENTY LINES BELOW.**
 *
 * ⚡ This matched `r.field === 'balance'` exactly, while `poisons()` — in this same file — handles the
 * parenthesised losses through `isWholeRowLoss`, because *"a repair whose field is parenthesised names no
 * field because there was nothing left to name"*. So a lost `balance` FIELD read `debt-free-unverified`
 * and a **whole unreadable `debts` LIST** — strictly more data lost — read plain **`debt-free`**.
 * Measured: `G-1` printed `4 of 4 matched · Under-warned 0 · proven`, `G-2` sent the freed reserve to
 * *"your savings"*, and `G-3` graduated the headline — the exact three sentences those findings closed,
 * recurring on the louder member of their own class.
 *
 * ⚠️ **`!mayClaim(store, 'debt-balances')` was the finding's first suggestion and is NOT what this uses.**
 * That route also carries `originalBalance`, and an unread *original* balance says nothing about whether
 * the CURRENT balances are trustworthy — it is the trophy shelf's question (`C-4`), not this one. Widening
 * to it would suppress the Guardian's framing over a figure that has no bearing on liveness, which is the
 * over-fix the controls in `guardianTrust.test.ts` exist to refuse.
 */
export function hasUnreadDebtBalances(store: DebtStore): boolean {
  return store.pendingDataRepairs.some(
    (r) => r.entity === 'debt' && (r.field === 'balance' || isWholeRowLoss(r)) && r.kind !== 'recovered',
  );
}

/**
 * ⛔ **THE ONE OWNER OF *"IS THIS DEBT LIVE?"* — AND ITS ABSENCE COST FIVE FINDINGS IN ONE FILE.**
 * [S1.10.6.9 · `G-1`…`G-5`]
 *
 * ⚡ `store.debts.filter((d) => d.balance > 0)` reads the **one field the import path repairs to `0`**, so
 * every site that spells it out asks *"is this debt live?"* and gets back *"is this debt live, or did we
 * fail to read it?"* — one question wearing the answer to another. `selectPlanState` was given the remedy
 * at pass-1 blocker `B1` and **nothing else was**: `guardianSelectors` spelled the expression out three
 * more times, and measurement found all three wrong in the same direction, because a lost balance repairs
 * to `0` and never to a number.
 *
 * ⛔ **The loudest was the Guardian's own honesty instrument.** `selectCalibrationScore` grades ONE debt
 * regime at a time (2.4.8, never blend), and picks the regime off this expression — so one unreadable
 * balance re-graded the scorecard against the debt-free cycles and turned *"0 of 4 reads matched ·
 * Under-warned 4"* into *"4 of 4 · Under-warned 0"*, with the recalibration apology gone. The component
 * that renders it says in its own docblock that the false-clear direction is the one it never softens.
 *
 * ⚠️ **THREE STATES, NOT A BOOLEAN, and that is the whole point.** A boolean forces every caller to pick
 * a side for the unreadable case silently; a third state is one a caller must handle or fail to compile.
 * It is the same move `selectPlanState` makes with `'debt-free-unverified'`, hoisted to where the other
 * callers can find it. ⛔ `'debt-free'` here means *"no live debt, and we could read every balance"* — it
 * does **not** distinguish "never had a debt", which is `selectPlanState`'s own `'no-debts'` and stays
 * there, because only the Plan hero cares.
 */
export type DebtLiveness = 'has-debt' | 'debt-free' | 'debt-free-unverified';

export function debtLiveness(store: DebtStore): DebtLiveness {
  if (liveDebts(store).length > 0) return 'has-debt';
  return hasUnreadDebtBalances(store) ? 'debt-free-unverified' : 'debt-free';
}

/**
 * The debts with money still on them. ⛔ **THE ONLY PLACE THIS EXPRESSION IS WRITTEN.** Every other site
 * asks the owner, and `lint:trust-claims` reds on a re-derivation — it prints the live count of what is
 * still outstanding, which is the number to read rather than one typed here.
 *
 * ⚠️ **A caller that needs the ARRAY still owes the liveness question.** This returns rows, and rows are
 * silent about what could not be read — a portfolio that is entirely unread returns `[]` here exactly as a
 * paid-off one does. Rank, sum and name from this; branch copy from `debtLiveness`.
 */
export function liveDebts(store: DebtStore): Debt[] {
  return store.debts.filter((d) => d.balance > 0);
}

/**
 * ⛔ **THE COMPLEMENT OWNER — *"which debts are CLEARED?"* — AND IT IS A PARTITION, NOT A SECOND FILTER.**
 * [S1.11.4.2 · pass-4 blocker `C4-2`]
 *
 * ⚡ `liveDebts` gave *"is this debt live?"* one owner and left the **inverse** spelled out at every site
 * that asks it, which is the same defect one negation away. Measured on one store with one variable — a
 * $12,000 Chase balance the reader lost, repaired to `0` and recorded, beside an intact Amex — every one
 * of them filed a card the user owes IN FULL as paid off: the permanent trophy shelf read
 * *"Chase — $12,000 paid off"* with a Share button composing *"I paid off 1 debt ($12,000) 🎉"*, Money put
 * it under a **"PAID OFF"** heading, and `selectCelebrationStats` counted `debtsCleared: 1` against a true
 * **0**. ⛔ Every existing guard covered the **amount** and none covered the **membership**: `d.balance <= 0`
 * is the one test a repaired balance passes, and `originalBalance` — the figure that WAS guarded — had been
 * read perfectly.
 *
 * ⛔ **WHY A PARTITION AND NOT A `clearedDebts` FILTER, WHICH IS WHAT THE FINDING ASKED FOR.** Excluding the
 * unread row from *"paid off"* without saying where it goes **deletes it from Money's list**: it is not in
 * `active` either (`view.order` ranks `balance > 0`), so the finding's own stated remedy would have made a
 * debt the user still owes vanish from the debts screen entirely. That failure has a name here already —
 * `migrations.ts:99` records *"puts it in neither the active list nor the paid-off list"* as the shape a
 * `$NaN` came out of. Returning all three groups at once makes "in neither list" unrepresentable, and
 * `trustSelectors.test.ts` asserts the three sum to `store.debts.length`.
 *
 * ⚠️ **Per ROW, not store-wide** — `rowFieldUnread` is the right question for a row and carries the
 * whole-row-loss case with it (`F-B4`'s three-member class). ⛔ Do **not** reach for
 * `hasUnreadDebtBalances` here: it is correctly narrow for its own consumers, and a store-wide gag would
 * take a genuinely-earned trophy off the shelf over an unrelated debt's repair — the *"true statement
 * withheld"* failure `progress.tsx` records having already made once.
 */
export interface DebtPartition {
  /** Money still on them. Identical to `liveDebts(store)`, asserted rather than assumed. */
  live: Debt[];
  /** `balance <= 0` **and** the app read that balance — the only group anything may call *paid off*. */
  cleared: Debt[];
  /** `balance <= 0` only because the reader lost it. Still owed as far as anyone knows; must still be SHOWN. */
  unreadBalance: Debt[];
}

export function partitionDebts(store: DebtStore): DebtPartition {
  const live: Debt[] = [];
  const cleared: Debt[] = [];
  const unreadBalance: Debt[] = [];
  for (const d of store.debts) {
    if (d.balance > 0) live.push(d);
    else if (rowFieldUnread(store, 'debt-balances', 'debt', d.id, 'balance')) unreadBalance.push(d);
    else cleared.push(d);
  }
  return { live, cleared, unreadBalance };
}

/** The debts the app has CONFIRMED are cleared. Sugar over `partitionDebts` for the sites that only ask
 *  the one question — never re-spell it as `balance <= 0`. */
export function clearedDebts(store: DebtStore): Debt[] {
  return partitionDebts(store).cleared;
}



/**
 * ⛔ **THE CLAIM TABLE — which repaired FIELD poisons which CLAIM.** [S1.9.2 · pass-2 C2 · C3 · C4]
 *
 * ⚡ **Pass 2 found the same rule wired to a subset of fields AND a subset of claim sites**, three times
 * over: a goal's `currentAmount` repaired to `0` printed *"$1,000.00 left"* under *"33% funded"* (C2), the
 * full-screen finale fired over a $12,000 card while the banner beside it correctly refused (C3), and a
 * debt whose `minimumPayment` repaired to `0` vanished from the plan so Today said *"You're caught up for
 * this paycheck."* over it (C4). ⛔ **Patching each site rebuilds the defect a fourth time** — the pattern
 * that produced M9 and B1 before it.
 *
 * So the routing is a TABLE, and the table is **gated**: `trustSelectors.test.ts` asserts every field
 * `migrations.ts` can repair appears here under some claim, so a new repairable field cannot land
 * unrouted. ⚠️ That gate is the point. A list of fields decays silently; a list of fields that reds when
 * the repair layer grows does not.
 *
 * ⚠️ **The wildcard `'*'` means *any* field of that entity.** Goals keep it for the reason the goals
 * docblock below already gives — every goal money field feeds the funded comparison or the pace — and it
 * is also what covers the two synthetic repairs (`(a row could not be read)`, `(whole list unreadable)`),
 * which name no real field and are the loudest losses of all.
 */
export type MoneyClaim =
  /** "You're debt-free" · "Every balance cleared" · the trophy shelf · the once-ever finale. */
  | 'debt-balances'
  /** "Funded" · "$X left" · "% funded". */
  | 'goal-amounts'
  /** "You're caught up for this paycheck" — what this cycle is obliged to cover. */
  | 'required-plan'
  /** A single row restating its own money: "$0.00/mo", "0% APR", "$1,000.00 left". */
  | 'row-figures';

/** `'any'` = every field of that entity. A named list = exactly those fields. */
type ClaimRoute = Partial<Record<DataRepair['entity'], 'any' | readonly string[]>>;

const CLAIM_FIELDS: Record<MoneyClaim, ClaimRoute> = {
  // A balance is what "cleared" is a claim ABOUT. `originalBalance` joins it because the finale states
  // "$12,400 paid off", which `selectCelebrationStats` sums from exactly that field.
  'debt-balances': { debt: ['balance', 'originalBalance'] },
  // ⚠️ **EVERY goal money field, unlike the debts route above, and the asymmetry is deliberate.** The
  // claim is *"Funded"*, which is `currentAmount >= targetAmount` — both sides repair to `0`, and
  // `0 >= 0` badges a goal Funded. A goal's `priorityPerPaycheck` repairing does not touch that
  // comparison, but it does mean the row's money was mangled, and the cost of suppressing one true
  // "Funded" badge is far below the cost of asserting a false one. ⛔ This replaced a standalone
  // `hasUnreadGoalAmounts`, which after [C2] had no consumer but its own test — and two ways to ask one
  // question is exactly what this module exists to prevent.
  'goal-amounts': { goal: 'any' },
  // What the plan is OBLIGED to cover this cycle. An unreadable one repairs to $0, and an obligation of
  // $0 produces neither an allocation row nor an unfunded item — so it leaves the plan entirely and the
  // count is honestly zero about arrays that are wrong.
  //
  // ⛔ **`balance` JOINS IT AT S1.10.6.9 [`G-4`], AND THE OMISSION WAS THE SAME DEFECT `C-4` CLOSED.** The
  // allocation engine skips a debt with **no balance left to pay**, so a debt whose BALANCE was lost drops
  // its minimum out of the plan exactly as a debt whose MINIMUM was lost does — the obligation is gone by a
  // second door, and only the first was routed. ⚡ Measured on one store with a live Visa beside a lost
  // Store Card: *"tight — you'd dip to $0, below your $200 line"* became **"Yes — you'd still hold about
  // $300"**, with the spare reading **$550** against a true $250, because a $300 minimum stopped being
  // owed. ⚠️ `debtLiveness` cannot catch this one — both worlds are `has-debt`, so the store-level
  // question is the wrong question and the FIELD routing is the right one.
  'required-plan': { debt: ['minimumPayment', 'balance'], requiredExpense: ['amount'], livingExpense: ['amount'] },
  // Any repaired money field a row prints back to the user. ⚠️ This is where `apr` is routed and the only
  // place: it changes no obligation this cycle, but the row states it ("22% APR") and a repaired `0`
  // states 0% — the import path doing what `FORM_ERRORS.aprInvalid` exists to refuse on the form path.
  'row-figures': { debt: 'any', requiredExpense: 'any', livingExpense: 'any', goal: 'any' },
};

/** The table itself, for the completeness gate in `trustSelectors.test.ts`. */
export function claimFields(): Record<MoneyClaim, ClaimRoute> {
  return CLAIM_FIELDS;
}

/**
 * ⚠️ A repair whose field is parenthesised — `(a row could not be read)`, `(whole list unreadable)` — names
 * no field because there was nothing left to name. Those are the LOUDEST losses, so they poison every
 * claim about their entity rather than matching none of them.
 *
 * ⚠️ `recovered` is excluded here for the same reason `hasUnreadDebtBalances` excludes it, and the reason
 * is load-bearing in both directions — see that docblock.
 */
function poisons(r: DataRepair, claim: MoneyClaim): boolean {
  if (r.kind === 'recovered') return false;
  const fields = CLAIM_FIELDS[claim][r.entity];
  if (!fields) return false;
  if (isWholeRowLoss(r)) return true;
  return fields === 'any' || fields.includes(r.field);
}

/** A repair that names no field: the row, or the whole list, could not be read at all. */
function isWholeRowLoss(r: DataRepair): boolean {
  return isWholeRowLossField(r.field);
}

/**
 * ⛔ **[S1.11.4.8] The whole-LIST member, told apart from the whole-ROW one.** `migrations.ts` writes both
 * as parenthesised fields, and `isWholeRowLossField` covers the pair on purpose — every claim they poison
 * is poisoned by either. What differs is how each is ANSWERED, and only `clearResuppliedRepairs` asks.
 */
function isWholeListLossField(field: string): boolean {
  return field === '(whole list unreadable)';
}

/** ⚠️ The same question asked of a bare field name — `unreadFieldsFor` returns strings, not records. */
function isWholeRowLossField(field: string): boolean {
  return field.startsWith('(');
}

/**
 * ⛔ **THE ONE QUESTION EVERY CLAIM SITE ASKS.** May the app state this class of number?
 *
 * ⚠️ Prefer a selector that makes the bad state **unrepresentable** where one exists — `selectPlanState`
 * returns `'debt-free-unverified'` rather than leaving each screen to remember the check, and that is the
 * better shape. This is for the sites that have no such state to return.
 */
export function mayClaim(store: DebtStore, claim: MoneyClaim): boolean {
  return !store.pendingDataRepairs.some((r) => poisons(r, claim));
}

/**
 * ⛔ **PER-ROW, because a screen that suppresses the whole list over one bad row tells the user less than
 * it knows.** [S1.9.2 · C2] `money.tsx` carried `g.targetAmount === 0` twice as its own idea of "this
 * goal's money is unread" — one field of the two `migrations.ts` repairs, so a goal whose SAVED amount
 * was lost printed its entire target as a remainder with no caption at all. Returns the fields of THIS
 * row that were repaired, so the row can caption the number it is about to print.
 */
export function unreadFieldsFor(store: DebtStore, entity: DataRepair['entity'], id: string): string[] {
  return store.pendingDataRepairs
    // ⚠️ A whole-row / whole-list loss carries `id: ''` because there was no id to read, so it belongs to
    // every row of its entity — matching it on id alone would attach it to none of them.
    .filter((r) => r.entity === entity && r.kind !== 'recovered' && (r.id === id || isWholeRowLoss(r)))
    .map((r) => r.field);
}

/**
 * ⛔ **THE CLAIM IS A PARAMETER BECAUSE A ROUTE WITH NO CALLER IS DECORATION.** [S1.10.6.2 · pass-3 C-1]
 *
 * ⚡ Pass 2 added `'row-figures'` — the route for *"a single row restating its own money"* — and pass 3
 * measured its production consumers at **zero**: three grep hits, all the declaration or its own test.
 * The table's fields were widened and its **claim sites** were only re-declared, so Money still printed
 * *"0% APR"* on a card charging 22% and *"$0.00/mo"* on one demanding $150 — the two strings the route's
 * own docblock names as the reason it exists.
 *
 * ⚠️ **So the row asks the TABLE which fields it may speak, rather than remembering a list.** The answer
 * is the intersection of what this site asked for and what the claim routes; a field the claim does not
 * route contributes nothing and **`lint:trust-claims` reds on the mismatch** rather than leaving it to be
 * noticed. ⛔ That gate is the durable half — the enumeration is what has been short every single time.
 */
export function rowFieldUnread(
  store: DebtStore,
  claim: MoneyClaim,
  entity: DataRepair['entity'],
  id: string,
  ...fields: string[]
): boolean {
  const asked = routedSubset(claim, entity, fields);
  return unreadFieldsFor(store, entity, id).some((f) => asked.includes(f) || isWholeRowLossField(f));
}

/**
 * ⛔ **THE SUM-LEVEL TWIN — a total missing an unknown addend is not a total.** [S1.10.6.2 · pass-3 C-2]
 *
 * `rowFieldUnread` is the right question for a row and the **wrong** question for a headline: captioning
 * the Groceries row still leaves *"Reserve per paycheck: $120"* standing over a true figure of at least
 * $520. And `mayClaim` is too wide for the same headline — it is store-wide across all four entities, so
 * an unread goal target would gag a bills total it says nothing about.
 *
 * ⚠️ **Scoped to the entity whose rows the sum is over**, which is the narrowing `money.tsx:377`'s debts
 * hero already applies by hand. The rows below the headline still say everything the app does know.
 */
export function anyRowFieldUnread(
  store: DebtStore,
  claim: MoneyClaim,
  entity: DataRepair['entity'],
  ...fields: string[]
): boolean {
  const asked = routedSubset(claim, entity, fields);
  return store.pendingDataRepairs.some(
    (r) => r.entity === entity && r.kind !== 'recovered' && (isWholeRowLoss(r) || asked.includes(r.field)),
  );
}

/** What this claim actually routes for this entity, intersected with what the call site asked for. */
function routedSubset(claim: MoneyClaim, entity: DataRepair['entity'], fields: string[]): string[] {
  const routed = CLAIM_FIELDS[claim][entity];
  if (!routed) return [];
  return routed === 'any' ? fields : fields.filter((f) => routed.includes(f));
}

/**
 * ⛔ **THE RESET PATH — a repair is a question, and it has to be able to be ANSWERED.** [S1.9.2 · pass-2 C1]
 *
 * ⚡ **Nothing ever removed an entry from `pendingDataRepairs`.** A whole-repo grep returned exactly two
 * mutation sites: `mergeRepairs`, a union that only ever grows, and `acknowledgeDataRepairs`, which marks
 * `acknowledged: true` and empties nothing — correct for the card, and the guards do not read that flag.
 * So a person who imported a file with one unreadable balance, **retyped it exactly as the card asked**,
 * and then genuinely paid off every debt was shown the broken-plan Money screen (`$0 · remaining across 0
 * debts`, a strategy toggle over an empty list), lost the Progress trophy shelf, and never saw the
 * graduation banner — **for the life of the install, with no way to clear it.** Measured through a reload.
 *
 * ⛔ **THE HARD PART IS WHICH SIGNAL COUNTS, and getting it wrong re-opens a closed blocker.** A-J2-1 is
 * the rule that *the ack hides the CARD and does not un-repair the DATA* — `acknowledgeDataRepairs` used
 * to empty this list, and one *"Got it"* tap restored *"Every balance cleared"* over debts still owed. So
 * the signal cannot be the acknowledgement. It has to be **the user supplying the number again**, which is
 * exactly what the card asks for and exactly what nothing was watching.
 *
 * ⚠️ **A CLASS, NOT A LIST OF ACTIONS** — the same remedy [B2] needed. Clearing repairs inside `updateDebt`
 * / `updateGoal` / `updateExpense` / `verifyDebtBalance` is a list, and a list is what left `importStore`
 * and `reset()` as extra doors onto [B2]'s snapshot. This runs in the `set` wrapper over any patch that
 * moves the store, so a future writer inherits it without knowing it exists.
 *
 * The three signals, and the direction each runs in:
 *
 *  1. **The named field's value MOVED.** The user typed a number over the repaired one. ⚠️ This cannot fire
 *     on the repair being *created*, because a repair absent from `before` is skipped entirely — otherwise
 *     the migration that writes the repair would clear it in the same patch, and hydrate would disarm
 *     every guard in the product.
 *  2. **The row is GONE.** A deleted debt states nothing, so there is nothing left to distrust.
 * ⛔ **AND ONE SIGNAL A CLASS RULE STRUCTURALLY CANNOT SEE** — see `answerBalanceRepairs`. Confirming a
 * balance is the user answering, and the honest confirmed value may be the same `0` the repair wrote, so
 * nothing about the store moves. ⚠️ The first cut tried to read it off `lastVerifiedDate` and **measured
 * green on a probe that could not discriminate**: `runMigrations` stamps `lastVerifiedDate =
 * paycheck.currentDate`, and `confirmPayoff` passes that same date, so on the day that matters most the
 * date is unchanged. Intent that leaves no trace has to be stated by the action that has it.
 *
 * ⚠️ **A repair NOTHING CAN BE OPENED FOR is cleared by the ACKNOWLEDGEMENT instead, and only that.** A
 * whole-row or whole-list loss names no field; a `migration` record names no row at all. Neither signal
 * above can ever fire for one, so it would be permanent by construction — and every guard would stay armed
 * for the life of the install, which is C1 again wearing a different face. ⛔ **The predicate is
 * `dataRepairsCopy`'s own `actionable`, re-derived here rather than re-invented**: that file already
 * decides this exact question to choose between *"until you set it again"* and *"there is nothing to
 * reopen for it — check this against your old app"*. The second sentence IS the ack meaning "I have
 * answered". ⛔ This does **not** re-open A-J2-1, whose blocker was a FIELD-level repair — there the
 * number can be re-supplied and the card asks for exactly that, so the ack must not stand in for it.
 *
 * ⚠️ **The first cut got this wrong and a standing test caught it**: `migration` records fell through to
 * signal 2, because the entity owns no list, so `findRow` returned nothing and every v1.6 bridge loss read
 * as *"the row is gone"* and was dropped at bootstrap.
 */
export function clearResuppliedRepairs(before: DebtStore, after: DebtStore): DebtStore {
  if (after.pendingDataRepairs.length === 0) return after;
  const key = (r: DataRepair) => `${r.entity} ${r.id} ${r.field}`;
  const known = new Set(before.pendingDataRepairs.map(key));
  const kept = after.pendingDataRepairs.filter((r) => {
    // A repair this very patch created is never cleared by it — see signal 1's note.
    if (!known.has(key(r))) return true;
    /**
     * ⛔ **S1.11.4.8 [🎯 2026-08-28] — AN ACKNOWLEDGEMENT SILENCES THE CARD AND DOES NOT VERIFY THE DATA.**
     *
     * ⚡ A whole-row or whole-list loss used to be dropped by the ack, and dropping the record ends the
     * suppression with it: one *"Got it"* over a backup whose entire `debts` array was unreadable put the
     * app back on the debt-free framing — **"every balance is cleared"** — over a portfolio it never read.
     * Measured at `S1.11.4.1` and taken to Jason, because both directions are defensible and this one is
     * a product call: *the generic tap is not an answer to "are you debt-free?"*, which is the doctrine
     * the rest of this module is built on ([A-J2-1]: the ack hides the CARD, it does not un-repair
     * the DATA).
     *
     * ⚠️ **So the answer has to be a real one**, and there are exactly two:
     *   · the list comes back — the user enters their debts, and `listFor` stops being empty; or
     *   · they say so — `resolveUnreadableRows` removes the record, from the card's own action.
     * ⛔ A `migration` count keeps the old behaviour: it names v1.6 keys this build never understood,
     * there is no list for it to refill, and the ack is genuinely the only answer it can have.
     */
    if (isWholeRowLoss(r)) {
      /**
       * ⚠️ **AND THE TWO PARENTHESISED LOSSES ARE NOT THE SAME QUESTION** — a standing control in
       * `trustSelectors.test.ts` is what said so, by failing: *"editing a debt that CAN be read answers
       * nothing about the one that cannot."* A whole **LIST** loss is answered when the list comes back,
       * because the user has re-entered the portfolio the reader could not parse. A whole **ROW** loss is
       * not: the other rows being present says nothing about the one that is gone, so only the explicit
       * confirmation removes it.
       */
      if (isWholeListLossField(r.field)) return listFor(after, r.entity).length === 0;
      return true;
    }
    if (!answerableByEdit(r)) return !r.acknowledged;
    const wasRow = findRow(before, r);
    const nowRow = findRow(after, r);
    if (!nowRow) return false; // signal 2 — the row is gone
    if (wasRow && wasRow[r.field] !== nowRow[r.field]) return false; // signal 1 — the number moved
    return true;
  });
  return kept.length === after.pendingDataRepairs.length ? after : { ...after, pendingDataRepairs: kept };
}

/**
 * Can the user open something and set this number again? ⚠️ The same test `dataRepairsCopy.repairBlocks`
 * uses to choose its wording — a record with no `name`, or a `migration` count, has no screen to open.
 */
function answerableByEdit(r: DataRepair): boolean {
  return r.entity !== 'migration' && !!r.name && !isWholeRowLoss(r);
}

/** The row a repair names, in whichever list its entity lives in. A `migration` record has none. */
function findRow(store: DebtStore, r: DataRepair): Record<string, unknown> | undefined {
  return listFor(store, r.entity).find((row) => row.id === r.id) as Record<string, unknown> | undefined;
}

/**
 * The list a repair's entity lives in — `[]` for a `migration` count, which owns none. ⚠️ Extracted from
 * `findRow` rather than re-derived: `S1.11.4.8` needs the list's EMPTINESS and `findRow` needs a row in
 * it, and two spellings of *"which list is this"* is the two-producers shape this module exists to refuse.
 */
function listFor(store: DebtStore, entity: DataRepair['entity']): { id: string }[] {
  return entity === 'debt'
    ? store.debts
    : entity === 'requiredExpense'
      ? store.requiredExpenses
      : entity === 'livingExpense'
        ? store.livingExpenses
        : entity === 'goal'
          ? store.goals
          : [];
}

/**
 * ⛔ **CONFIRMING A BALANCE IS ANSWERING THE QUESTION, AND IT IS THE ONE ANSWER THAT MOVES NOTHING.**
 * [S1.9.2 · C1]
 *
 * `clearResuppliedRepairs` above watches for the number CHANGING, which covers every ordinary edit. It
 * cannot cover `verifyDebtBalance` / `verifyDebtBalances`, because the honest confirmed balance may be
 * exactly the `0` the repair wrote — a user whose card really is paid off types the same digit the loss
 * left behind. ⚠️ Reading it off `lastVerifiedDate` instead was tried and **measured wrong**:
 * `runMigrations` stamps that field to `paycheck.currentDate` and `confirmPayoff` passes the same date,
 * so on the day the repair is raised the stamp does not move either.
 *
 * ⛔ So the two actions that mean *"the user has looked at this number and says it is right"* say so, and
 * the RULE still lives here — one function, two callers, rather than a rule copied twice. That is the
 * distinction [B2] draws: a class rule for writes that are somebody else's, an explicit call for an
 * intent only the action holds. ⚠️ A third confirm path must call this; there is no way to make the
 * store infer it, and pretending otherwise is what the `lastVerifiedDate` attempt was.
 */
export function answerBalanceRepairs(store: DebtStore, confirmedIds: readonly string[]): DebtStore {
  if (store.pendingDataRepairs.length === 0) return store;
  const ids = new Set(confirmedIds);
  const kept = store.pendingDataRepairs.filter(
    (r) => !(r.entity === 'debt' && r.field === 'balance' && ids.has(r.id)),
  );
  return kept.length === store.pendingDataRepairs.length ? store : { ...store, pendingDataRepairs: kept };
}
