import type { PackageLike } from './purchases';

/**
 * Whether THIS user can actually take the store's introductory offer.
 *
 * ⛔ Mirrors RevenueCat's `INTRO_ELIGIBILITY_STATUS`, deliberately collapsed to what the copy needs.
 * `'unknown'` is a real, common answer — the SDK returns it whenever subscription-group info is missing,
 * and on Android always.
 */
export type IntroEligibility = 'eligible' | 'not-eligible' | 'unknown';

/**
 * The intro-offer prefix for a plan's subnote — `""` unless the user can genuinely have the offer.
 *
 * ⛔ **THE ELIGIBILITY ARGUMENT IS THE WHOLE POINT OF THIS FUNCTION, AND IT IS NOT OPTIONAL.**
 * `pkg.product.introPrice` describes the **product**; it says nothing about the **person**. Apple grants
 * an introductory offer **once per Apple Account per subscription group** and enforces that at purchase,
 * so a returning subscriber who has already used theirs is charged in full — while a paywall keyed on
 * `introPrice` alone would still be promising them "30 days free, then …". That is a false claim about
 * money on the one screen that takes it, and it is the same proxy-gate class as L3-7's "Autopay · ran":
 * a gate that establishes *the offer exists* used to assert *you will get it*.
 *
 * ⚠️ **Only `'eligible'` renders.** `'unknown'` shows plain pricing, which is the SDK's own instruction —
 * *"The best course of action on unknown status is to display the non-intro pricing, to not create a
 * misleading situation."* Under-promising is the safe direction; there is no symmetric harm.
 *
 * ⛔ **Debt ships 2.0 with NO trial (🎯 2026-08-21)**, so today every caller passes `'unknown'` and this
 * returns `""`. It is wired anyway so that turning a trial on is a **config change plus a code change**
 * rather than a config change that silently ships a false promise: `Purchases.checkTrialOrIntroductory
 * PriceEligibility(productIdentifiers)` must be threaded to the call site first. The compiler is what
 * enforces that — the parameter cannot be forgotten, only answered.
 *
 * ⚠️ Free and discounted are different sentences: "7 days free" is an offer, "$4.99 for 3 months" is a
 * price. Never say "free" for a non-zero intro.
 */
export function introPrefix(pkg: PackageLike, eligibility: IntroEligibility): string {
  if (eligibility !== 'eligible') return '';
  const intro = pkg.product.introPrice;
  if (!intro || intro.periodNumberOfUnits <= 0) return '';
  const unit = intro.periodUnit.toLowerCase().replace(/s$/, '');
  const n = intro.periodNumberOfUnits;
  const period = `${n} ${unit}${n === 1 ? '' : 's'}`;
  return intro.price === 0 ? `${period} free, then ` : `${intro.priceString} for ${period}, then `;
}
