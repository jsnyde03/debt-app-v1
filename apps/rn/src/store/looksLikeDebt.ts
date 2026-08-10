import type { RequiredExpense } from '@/data/models';

/**
 * 3.7.A10.2 [D22b/c] — does this EXPENSE look like it is really a debt?
 *
 * The mistake it catches is silent and expensive: an obligation with a balance, filed as a perpetual
 * expense, is reserved correctly every payday and **omitted from the payoff plan and the debt-free
 * date**. Nothing else in the app ever says so, and the user's largest debt is the most likely one to be
 * mis-filed — a mortgage looks exactly like rent in a list.
 *
 * ⚠️ **Name only, deliberately — and NOT paired with `category`.** Pairing was the first instinct and it
 * is wrong on inspection: the only debt-ish category is `housing`, so requiring both would catch a
 * mortgage and miss every credit card and car loan (they land in `other`). Category as a *conjunct*
 * destroys recall for no precision gain, because the name is doing all the work either way.
 *
 * ⚠️ **Tight list, on purpose.** This drives a suggestion the user sees on their own data, so a false
 * positive is the app telling someone their rent is secretly a debt — which costs more trust than a miss
 * costs money. Every word here names a borrowing instrument. Words that merely *co-occur* with debt —
 * "payment", "monthly", "finance" as in "Finance charge" — are excluded: "Car payment" is caught by
 * "car" only when paired, and a bare "Payment" is not caught at all, which is the correct outcome.
 *
 * Whole-word matched, so "Mastercard" hits and "Discovery+" does not — the latter being exactly the
 * subscription a looser list would accuse.
 */
const DEBT_WORDS = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'loan',
  'mortgage',
  'card', // "credit card", "store card"; not "cardio", because of the word boundary
  'bnpl',
  'klarna',
  'affirm',
  'afterpay',
  'financing',
];

/** `true` when the name contains a word that names a borrowing instrument. */
export function looksLikeDebt(expense: Pick<RequiredExpense, 'name'>): boolean {
  const name = expense.name.toLowerCase();
  // Word boundaries on both sides: the whole point is that "Discovery+" (a subscription) must not match
  // "discover" (a card). A bare `includes` would accuse it.
  return DEBT_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(name));
}
