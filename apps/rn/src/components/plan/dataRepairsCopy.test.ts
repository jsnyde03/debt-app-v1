import type { DataRepair } from '@/data/models';

import { describeRepair, repairBlocks, repairsA11yLabel } from './dataRepairsCopy';

/**
 * P6.8.9.7.11.12 (audit A-J2-2) — the repairs card's words.
 *
 * ⛔ **Nothing asserted a single string this card rendered**, which is how it came to say *"could not be
 * read · your plan is running without it"* over an amount it had read correctly. These cases assert the
 * SENTENCES, because the defect was never in the data — `'4,000'` always became `4000` — it was in what
 * the app told the person about it.
 *
 * ⚠️ The reachable door is the JSON restore, not the v1.6 migration: measured at `.11.12`, every v1.6
 * write path coerced with `Number()` before persisting, and its own defect stored `null`, which is a loss.
 * `readBackup` hands an arbitrary user file to `runMigrations`, so string money arrives from hand-edited,
 * third-party and foreign exports.
 */

let passed = 0;

function eq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL [${label}] expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  passed++;
  console.log(`  ✓ ${label}`);
}

/** For claims about a sentence's CONTENT rather than its exact wording — see `.11.13.8`'s cases. */
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function repair(over: Partial<DataRepair> = {}): DataRepair {
  return { entity: 'goal', id: 'g0', name: 'Roof', field: 'targetAmount', ...over };
}

export default function run() {
  console.log('Running data-repairs copy tests...');

  // ── a recovery must not be spoken as a loss ─────────────────────────────
  {
    const blocks = repairBlocks([repair({ kind: 'recovered' })]);
    eq(blocks.length, 1, 'one recovered repair produces one block');
    eq(blocks[0].kind, 'recovered', '…and it is the recovered block, not the loss block');
    eq(blocks[0].heading, 'An amount was written in a different format', '…with the recovery heading');
    eq(
      blocks[0].detail,
      'Your plan is using it — check the number looks right.',
      '⛔ …and it says the plan IS using the amount, because it is'
    );
    eq(blocks[0].lines.join(''), 'Roof — targetAmount', '…naming the item, which is the only actionable part');
  }

  // ── a real loss keeps the loss language, unchanged ──────────────────────
  {
    const blocks = repairBlocks([repair({ kind: 'lost' })]);
    eq(blocks[0].kind, 'lost', 'a lost repair produces the loss block');
    eq(blocks[0].heading, 'An amount could not be read', '…with the loss heading');
    eq(
      blocks[0].detail,
      'Your plan is running without it until you set it again.',
      '…and the loss consequence is unchanged'
    );
  }

  // ── a record written before the distinction existed means LOSS ──────────
  // Every stored blob backfills without a version bump, and this is the safe direction to be wrong in.
  {
    const blocks = repairBlocks([repair()]);
    eq(blocks[0].kind, 'lost', 'an absent `kind` is treated as a loss');
  }

  // ── both at once: two blocks, losses first ─────────────────────────────
  {
    const blocks = repairBlocks([
      repair({ kind: 'recovered', id: 'g1', name: 'Roof' }),
      repair({ kind: 'lost', id: 'g2', name: 'Car', entity: 'debt', field: 'balance' }),
    ]);
    eq(blocks.length, 2, 'a mixed list produces both blocks');
    eq(blocks[0].kind, 'lost', '⛔ losses come first — they are the ones with an action attached');
    eq(blocks[1].kind, 'recovered', '…and the recoveries follow');
    eq(blocks[0].lines.join(''), 'Car — balance', 'the loss block holds only the loss');
    eq(blocks[1].lines.join(''), 'Roof — targetAmount', 'the recovery block holds only the recovery');
  }

  // ── plurals are counted PER BLOCK, not across the card ─────────────────
  {
    const blocks = repairBlocks([
      repair({ kind: 'lost', id: 'a', name: 'Car', entity: 'debt', field: 'balance' }),
      repair({ kind: 'lost', id: 'b', name: 'Loan', entity: 'debt', field: 'balance' }),
      repair({ kind: 'recovered', id: 'c', name: 'Roof' }),
    ]);
    eq(blocks[0].heading, '2 amounts could not be read', 'the loss block counts only losses');
    eq(blocks[1].heading, 'An amount was written in a different format', '⛔ …and the recovery block is singular');
    eq(
      blocks[0].detail,
      'Your plan is running without them until you set each one again.',
      'the plural loss consequence'
    );
  }

  // ── the a11y label carries the same distinction the sighted reader sees ─
  {
    const blocks = repairBlocks([
      repair({ kind: 'lost', id: 'a', name: 'Car', entity: 'debt', field: 'balance' }),
      repair({ kind: 'recovered', id: 'c', name: 'Roof' }),
    ]);
    const label = repairsA11yLabel(blocks);
    eq(
      label.includes('An amount was written in a different format'),
      true,
      '⛔ VoiceOver hears the recovery heading too — it used to hear the loss sentence over both'
    );
    eq(label.includes('An amount could not be read'), true, '…and the loss heading');
  }

  // ── the describe rules the card already depended on ────────────────────
  eq(
    describeRepair({ entity: 'migration', id: '', name: '', field: 'Your rollover count did not carry over' }),
    'Your rollover count did not carry over',
    'a migration entry IS its own sentence'
  );
  eq(
    describeRepair({ entity: 'debt', id: '', name: '', field: '(whole list unreadable)' }),
    'Your debt list — (whole list unreadable)',
    'a nameless repair names the list it came from'
  );
  eq(
    describeRepair({ entity: 'requiredExpense', id: 'e', name: 'Rent', field: 'amount' }),
    'Rent — amount',
    'a named repair reads as name and field'
  );

  // An empty list must produce no blocks — the card is only mounted when something is pending, and a
  // stray empty block would render a heading with nothing under it.
  /**
   * ⛔ **[P6.8.9.7.11.13.8 · J1-4] "UNTIL YOU SET IT AGAIN" IS FALSE OF A RECORD WITH NOTHING TO OPEN.**
   * Three of the five producers emit one: a whole list that would not read, a single row that would not
   * read, and the v1.6 bridge's counts. Each case below is one of those producers' actual output.
   */
  {
    const blocks = repairBlocks([
      { entity: 'migration', id: '', name: '', field: '3 item(s) from your old version were not recognised' },
    ]);
    eq(blocks[0].kind, 'unrecoverable', 'a v1.6 bridge count is not something you can go and set');
    assert(
      !blocks[0].detail.includes('set it again') && !blocks[0].detail.includes('set each one again'),
      '⛔ …so the card must not tell them to',
    );
    assert(blocks[0].detail.includes('check this against your old app'), '…and it names what they CAN do');
  }
  {
    const blocks = repairBlocks([
      { entity: 'debt', id: '', name: '', field: '(a row could not be read)', kind: 'lost' },
      { entity: 'goal', id: '', name: '', field: '(whole list unreadable)', kind: 'lost' },
    ]);
    eq(blocks.length, 1, 'both nameless losses land in one block');
    eq(blocks[0].kind, 'unrecoverable', '⛔ a row or a list that would not read has nothing to reopen');
    assert(blocks[0].detail.includes('nothing to reopen for them'), '…and the plural says so');
  }
  {
    // ⚠️ The discriminator is the NAME, not the entity — a named debt is actionable, a nameless one is not.
    const blocks = repairBlocks([
      { entity: 'debt', id: 'd0', name: 'Car', field: 'balance', kind: 'lost' },
      { entity: 'debt', id: '', name: '', field: '(a row could not be read)', kind: 'lost' },
    ]);
    eq(blocks.length, 2, 'a named loss and a nameless one are different claims and get different blocks');
    eq(blocks[0].kind, 'lost', 'the named one keeps the actionable sentence');
    eq(blocks[0].lines.join(''), 'Car — balance', '…and holds only itself');
    eq(blocks[1].kind, 'unrecoverable', '…while the nameless one is separated out');
  }
  {
    // The stood-down pace: named, and since `.11.13.4` genuinely settable in `GoalSheet`.
    const blocks = repairBlocks([
      { entity: 'goal', id: 'g0', name: 'Roof', field: 'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt', kind: 'lost' },
    ]);
    eq(blocks[0].kind, 'lost', '⛔ a stood-down pace IS actionable now — the promise became true rather than being dropped');
  }

  eq(repairBlocks([]).length, 0, 'no repairs produces no blocks');

  console.log(`✅ All data-repairs copy tests passed (${passed}).`);
}
