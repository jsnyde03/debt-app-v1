import type { DataRepair } from '@/data/models';

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
};

/** "Chase card — balance", the whole-list case, or a migration loss, which is already a sentence. */
export function describeRepair(repair: DataRepair): string {
  // M3-20 — a migration entry carries no entity and no name: its `field` IS the sentence, because the
  // v1.6 key it came from ("debtPlanner.rolloverCount") means nothing to the person reading it.
  if (repair.entity === 'migration') return repair.field;
  const noun = ENTITY_NOUN[repair.entity] ?? 'item';
  if (!repair.name) return `Your ${noun} list — ${repair.field}`;
  return `${repair.name} — ${repair.field}`;
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
   * ⚠️ **A record with no `name` cannot be opened and set** — see `RepairBlock.kind`. The v1.6 bridge's
   * entries are the same case for the same reason; they are counts, and `describeRepair` already treats
   * their `field` as the whole sentence.
   */
  const actionable = (r: DataRepair) => r.entity !== 'migration' && !!r.name;
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
