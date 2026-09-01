import type { DataRepair } from '@/data/models';
import { answerableByEdit } from '@/store/trustSelectors';

/**
 * The words the repairs card says, separated from the card so they can be pinned.
 *
 * ⛔ **THE CARD SPOKE ONE LANGUAGE FOR TWO OPPOSITE EVENTS.** [P6.8.9.7.11.12 · A-J2-2] A goal stored as
 * `targetAmount: '4,000'` is **recovered** — the real 4000 — and the card said *"An amount could not be
 * read · Your plan is running without it until you set it again"*, while Money one tab over rendered the
 * goal at `$4,000` and the engine allocated against it. Two screens contradicting each other about the
 * user's money, and this was the one that was wrong.
 *
 * ⚠️ **A recovered repair is still SHOWN, not swallowed.** Hiding it looks tidier and is worse: the record
 * lives in `pendingDataRepairs` until the user acknowledges it, and the trust guards read that list — so a
 * card that never appears is an ack that never fires and a suppression with no way to clear it.
 */

/**
 * ⚠️ The `Record` is EXHAUSTIVE on purpose, and it earned that at P6.8.9.7.2: adding `goal` to
 * `DataRepair['entity']` failed the build right here. An index signature would have shipped a repair the
 * user reads as *"Your item list — targetAmount"*, via a `?? 'item'` fallback, and nothing would have
 * said so. The compiler is the gate for this class.
 */
const ENTITY_NOUN: Record<Exclude<DataRepair['entity'], 'migration'>, string> = {
  debt: 'debt',
  requiredExpense: 'bill',
  livingExpense: 'expense',
  goal: 'savings goal',
  // ⛔ S1.13.7.6 [pass-6 B3-1] — the money on the STORE rather than in a row: the cushion line, the
  // lean/typical paycheck, a windfall, the bills reserve. The exhaustive Record above caught this the
  // moment `plan` joined the union, which is what it is for.
  plan: 'plan',
};

/**
 * ⛔ **S1.9.7 [pass-2 C-m1] — A SCHEMA KEY IS NOT A SENTENCE.** Measured output on a store with six
 * repairs: *"Chase — minimumPayment"*, *"Chase — apr"*, *"Rent — amount"*, *"House Fund — targetAmount"*,
 * *"House Fund — currentAmount"* — and, for the one field somebody had written words for, a full clause.
 * ⚡ **The mechanism for a human string already existed and had been applied to one field of six.**
 *
 * ⚠️ **A map, and it is EXHAUSTIVE over what `migrations.ts` can repair** — the same compiler-as-gate move
 * `ENTITY_NOUN` above earned at P6.8.9.7.2, where adding `goal` to the entity union failed the build right
 * here rather than shipping *"Your item list"*. A new repairable field must be named for the user or it
 * does not compile.
 */
export const FIELD_LABEL: Record<string, string> = {
  cushionFloor: 'your cushion line',
  leanAmount: 'your lean paycheck',
  typicalAmount: 'your typical paycheck',
  windfall: 'a windfall',
  expenseReserveBalance: 'money set aside for bills',
  balance: 'the balance',
  minimumPayment: 'the minimum payment',
  apr: 'the interest rate',
  originalBalance: 'the starting balance',
  scheduledPaymentAmount: 'the scheduled payment',
  amount: 'the amount',
  targetAmount: 'the target',
  currentAmount: 'the amount saved',
  priorityPerPaycheck: 'the per-paycheck amount',
};

/**
 * ⛔ **WHAT A ROW PRINTS WHERE A FIGURE WOULD GO WHEN IT COULD NOT READ ONE.** [S1.10.6.2 · pass-3 C-1]
 *
 * ⚠️ **Not a formatted zero, and that distinction IS the finding.** A repaired money field *is* `0`, so
 * `formatCurrency` of it renders **"$0.00/mo"** — a specific, false, confident figure. An em dash says
 * there is no figure, which is the true thing.
 */
export const UNREAD_FIGURE = '—';

/**
 * ⛔ **THE HONEST STATE, SAID — not merely the false one withheld.** [S1.10.6.2 · pass-3 C-1]
 *
 * ⚡ Suppressing a figure without naming why is how [B1]'s first fix dropped a user into *"Your payoff
 * journey starts here"* over debts they still owed. The row keeps every figure the app *did* read and
 * says, by name, which one is missing — the shape the goals rows have carried since pass-2 [C2].
 *
 * ⚠️ **The words come from `FIELD_LABEL`, the same map the repairs card reads**, so a field is never
 * called one thing on Today and another on Money. Pass `unreadFieldsFor(store, entity, id)` straight in.
 */
export function unreadRowCaption(unreadFields: readonly string[]): string | undefined {
  if (unreadFields.length === 0) return undefined;
  // A parenthesised field names no field because there was nothing left to read — see `isWholeRowLoss`.
  // ⛔ It outranks any named field on the same row: "the balance could not be read" understates a row
  // that could not be read at all.
  if (unreadFields.some((f) => f.startsWith('('))) return 'This row could not be read';
  const labels = [...new Set(unreadFields.map((f) => FIELD_LABEL[f] ?? f))];
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
  // Sentence case: `FIELD_LABEL` entries start with a lowercase article ("the balance").
  const sentence = `${list} could not be read`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** "Chase card — the balance", the whole-list case, or a migration loss, which is already a sentence. */
export function describeRepair(repair: DataRepair): string {
  // M3-20 — a migration entry carries no entity and no name: its `field` IS the sentence, because the
  // v1.6 key it came from ("debtPlanner.rolloverCount") means nothing to the person reading it.
  if (repair.entity === 'migration') return repair.field;
  const noun = ENTITY_NOUN[repair.entity] ?? 'item';
  // ⚠️ Falls back to the raw field rather than to a generic word: an unmapped key is ugly and TRUE, and
  // "an amount" over the wrong field would be neither. The `field` is also already a sentence for the
  // synthetic losses ("(a row could not be read)") and for the pace, so an unmapped value is correct there.
  const field = FIELD_LABEL[repair.field] ?? repair.field;
  if (!repair.name) return `Your ${noun} list — ${field}`;
  return `${repair.name} — ${field}`;
}

export interface RepairBlock {
  /**
   * ⛔ **`unrecoverable` IS SEPARATE FROM `lost` BECAUSE THE ACTION IS.** [P6.8.9.7.11.13.8 · J1-4] The
   * loss block promises *"until you set it again"*, and **three of the five producers of a `DataRepair`
   * emit records that promise cannot be true of** — enumerated rather than listed: a whole list that would
   * not read (`migrations.ts:82`), a row that would not read (`:108`), and the v1.6 bridge's counts
   * (`persistence.ts:134`). There is no item to open in any of them.
   *
   * ⚡ **The discriminator was already in this file**: a record with no `name` is one nothing can point at,
   * which is exactly why `describeRepair` writes *"Your debt list — …"* for it. Same test, now used for the
   * sentence as well as the noun.
   *
   * ⚠️ Same move as `.11.12.1`'s recovered/lost split, and for the same reason — one word covering two
   * events made the app state something false about the user's money.
   */
  kind: 'lost' | 'unrecoverable' | 'recovered';
  heading: string;
  detail: string;
  lines: string[];
}

/**
 * ⚠️ **Absent `kind` means `lost`.** Every record written before the distinction existed meant a loss, and
 * that is also the safe direction to be wrong in: it asks the person to check a number that was fine,
 * rather than telling them nothing about one that was not.
 */
function kindOf(repair: DataRepair): 'lost' | 'recovered' {
  return repair.kind === 'recovered' ? 'recovered' : 'lost';
}

/**
 * Losses first — they are the ones with an action attached. A block is omitted entirely when nothing in
 * the list belongs to it, so the ordinary single-cause case still reads as one statement.
 */
export function repairBlocks(repairs: DataRepair[]): RepairBlock[] {
  /**
   * ⚠️ **A record that names no ROW cannot be opened and set** — see `RepairBlock.kind`. The v1.6 bridge's
   * entries are the same case for the same reason; they are counts, and `describeRepair` already treats
   * their `field` as the whole sentence.
   *
   * ⛔ **S1.12.5.4 [pass-5 `B5-8`] — THIS WAS A SECOND COPY OF THE PREDICATE, AND IT WAS NOT THE SAME ONE.**
   * It read `r.entity !== 'migration' && !!r.name` — omitting `isWholeRowLoss` entirely — while
   * `trustSelectors.answerableByEdit`'s docblock claimed this test was *"re-derived rather than
   * re-invented"*. Two producers of one question, already disagreeing, with a comment asserting they could
   * not. ⚡ And both carried `B5-7`'s defect: `!!r.name` asks whether the row's NAME is empty, not whether
   * the repair names a row — a debt whose name key is absent still has a screen to open.
   *
   * The owner is `answerableByEdit`. One producer, imported.
   */
  const actionable = answerableByEdit;
  const lost = repairs.filter((r) => kindOf(r) === 'lost' && actionable(r));
  const unrecoverable = repairs.filter((r) => kindOf(r) === 'lost' && !actionable(r));
  const recovered = repairs.filter((r) => kindOf(r) === 'recovered');
  const blocks: RepairBlock[] = [];

  if (lost.length > 0) {
    const one = lost.length === 1;
    blocks.push({
      kind: 'lost',
      heading: one ? 'An amount could not be read' : `${lost.length} amounts could not be read`,
      detail: one
        ? 'Your plan is running without it until you set it again.'
        : 'Your plan is running without them until you set each one again.',
      lines: lost.map(describeRepair),
    });
  }

  if (unrecoverable.length > 0) {
    const one = unrecoverable.length === 1;
    /**
     * ⚠️ **The action named has to be one the app can actually offer**, and for these there is no screen
     * to open: the row or the list is gone, or the count describes v1.6 keys this build never understood.
     * Checking the figures against the old app is the honest instruction — it is what
     * `describeMigrationLosses` already says these records should prompt.
     */
    blocks.push({
      kind: 'unrecoverable',
      // ⚠️ One heading for both counts — unlike the other two blocks, the number is already in each line
      // ("3 item(s) from your old version were not recognised"), and saying it twice reads as two events.
      heading: 'Some of your old data did not come across',
      detail: one
        ? 'There is nothing to reopen for it — check this against your old app and add anything missing.'
        : 'There is nothing to reopen for them — check these against your old app and add anything missing.',
      lines: unrecoverable.map(describeRepair),
    });
  }

  if (recovered.length > 0) {
    const one = recovered.length === 1;
    blocks.push({
      kind: 'recovered',
      heading: one
        ? 'An amount was written in a different format'
        : `${recovered.length} amounts were written in a different format`,
      detail: one
        ? 'Your plan is using it — check the number looks right.'
        : 'Your plan is using them — check the numbers look right.',
      lines: recovered.map(describeRepair),
    });
  }

  return blocks;
}

/** One spoken sentence per block, so VoiceOver hears the same distinction the sighted reader sees. */
export function repairsA11yLabel(blocks: RepairBlock[]): string {
  return blocks.map((b) => `${b.heading}. ${b.lines.join('. ')}. ${b.detail}`).join(' ');
}
