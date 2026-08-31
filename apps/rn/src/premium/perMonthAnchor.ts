/**
 * ⛔ **S1.12.5.8 [pass-5 `C5-6`] — THE PAYWALL'S PER-MONTH ANCHOR, FORMATTED BY THE LOCALE OR NOT AT ALL.**
 *
 * ⚡ The paywall built this string by hand: it stripped the digits out of RevenueCat's localized
 * `priceString` to recover a symbol — which correctly avoided a hardcoded `$` — and then re-composed the
 * figure with **US placement and US separators**. Measured over real App Store price shapes:
 *
 * | store price | rendered | wrong how |
 * |---|---|---|
 * | `$29.99` | `$2.50/mo` | ⭐ the control — correct |
 * | `29,99 €` | `€2.50/mo` | symbol on the wrong side, and a `.` where the card above uses a `,` |
 * | `₩39,000` | `₩3250.00/mo` | ungrouped, and **KRW has no minor units** |
 * | `¥3,000` | `¥250.00/mo` | same |
 * | `£24.99` | `£2.08/mo` | correct by coincidence — GBP happens to share the US shape |
 *
 * ⛔ **Two price conventions three lines apart on the one screen that asks the user for money.**
 *
 * ⚠️ **Placement, separator and minor-unit count are all properties of the CURRENCY, not of the number**,
 * and none of them is recoverable from the price string. `Intl.NumberFormat` carries all three and needs
 * the ISO code. So: format when the store supplies one, and **drop the anchor when it does not** — which
 * is lane C's own call, *"the honest move is to drop the per-month anchor on non-`$` stores rather than
 * misformat it"*, rather than printing a figure that is wrong in three ways at once.
 *
 * ⛔ **NOT `formatCurrency`.** That is the app's own USD-shaped money voice; this figure is an App Store
 * price and must follow the STORE's locale, not the app's.
 */
export function perMonthAnchor(annualPrice: number, currencyCode: string | undefined): string {
  if (!(annualPrice > 0)) return '';
  // ⛔ No code → no honest way to write it. An empty anchor loses a selling point; a misformatted one
  // states a price convention the store does not use, next to a card that uses the right one.
  if (!currencyCode) return '';
  try {
    // ⚠️ `undefined` locale, deliberately: the device's own formatting, which is what the App Store card
    // beside this line already uses. Pinning a locale here would re-create the mismatch in a new place.
    const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(annualPrice / 12);
    return ` · ${formatted}/mo`;
  } catch {
    // An unknown or malformed code throws rather than guessing — and so do we, silently, back to nothing.
    return '';
  }
}
