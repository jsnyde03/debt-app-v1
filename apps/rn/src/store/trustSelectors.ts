import type { DataRepair, DebtStore } from '@/data/models';

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
export function hasUnreadDebtBalances(store: DebtStore): boolean {
  return store.pendingDataRepairs.some(
    (r) => r.entity === 'debt' && r.field === 'balance' && r.kind !== 'recovered',
  );
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
  'required-plan': { debt: ['minimumPayment'], requiredExpense: ['amount'], livingExpense: ['amount'] },
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
  return r.field.startsWith('(');
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

/** Does THIS row carry a repair on any of `fields`? The row-level twin of `mayClaim`. */
export function rowFieldUnread(store: DebtStore, entity: DataRepair['entity'], id: string, ...fields: string[]): boolean {
  return unreadFieldsFor(store, entity, id).some((f) => fields.includes(f) || f.startsWith('('));
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
  const list: { id: string }[] =
    r.entity === 'debt'
      ? store.debts
      : r.entity === 'requiredExpense'
        ? store.requiredExpenses
        : r.entity === 'livingExpense'
          ? store.livingExpenses
          : r.entity === 'goal'
            ? store.goals
            : [];
  return list.find((row) => row.id === r.id) as Record<string, unknown> | undefined;
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
