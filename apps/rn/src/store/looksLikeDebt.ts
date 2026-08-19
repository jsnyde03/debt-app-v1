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
 * "payment", "monthly", "finance" as in "Finance charge" — are excluded, and a bare "Payment" is not
 * caught at all, which is the correct outcome.
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

/**
 * 5.4 — PHRASES, for words that name a borrowing instrument only in combination.
 *
 * ⛔ **`car` is deliberately NOT in `DEBT_WORDS`, and this is the measurement that decided it.** Over a
 * corpus of realistic bill names, a bare `\bcar\b` accused **8 of 19** — including "Car insurance",
 * "Car wash", "Car registration", "Car maintenance" and "Rental car". Car insurance alone is close to
 * universal, so at migration scale that is the app calling ordinary bills debts for a large population
 * at once. The phrase form accuses **2 of 19**: exactly the two that are debts.
 *
 * ⚠️ "Car loan" and "Auto loan" are already caught by `loan` and do not need a rule here.
 * ⚠️ Knowingly missed: brand-named vehicle debt ("Toyota payment"). Catching that needs a lender list,
 * which is recall-chasing with a far worse false-positive profile — the trade this file exists to refuse.
 */
const DEBT_PHRASES = [/\bcar\s+payment\b/, /\bvehicle\s+payment\b/];

/**
 * 5.4 — names that are AMBIGUOUS BY CONSTRUCTION and must never be accused.
 *
 * ⛔ `"Rent / Mortgage"` is a single v1.6 one-tap preset covering both, so an unmodified one contains no
 * information about which the user meant — `mortgage` matches, and for every renter who tapped it that is
 * a coin flip resolved against them. Upgrading makes it land on a whole population at once.
 *
 * ⚠️ Only the UNMODIFIED label is exempt. A user who renamed it to "Mortgage" or "Rocket Mortgage" is
 * telling us which one it is, and is still caught — the exemption covers absence of information, not the
 * word itself.
 */
const AMBIGUOUS_NAMES = ['rent / mortgage'];

/** `true` when the name contains a word or phrase that names a borrowing instrument. */
export function looksLikeDebt(expense: Pick<RequiredExpense, 'name'>): boolean {
  // Whitespace collapsed before the comparison so "Rent /  Mortgage" is the same untouched preset.
  const name = expense.name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (AMBIGUOUS_NAMES.includes(name)) return false;
  if (DEBT_PHRASES.some((phrase) => phrase.test(name))) return true;
  // Word boundaries on both sides: the whole point is that "Discovery+" (a subscription) must not match
  // "discover" (a card). A bare `includes` would accuse it.
  return DEBT_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(name));
}
