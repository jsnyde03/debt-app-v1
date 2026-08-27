/**
 * P6.5 — strip money out of Sentry breadcrumbs before they leave the device.
 *
 * ⛔ **This is not hypothetical, and `beforeSend` does not cover it.** `beforeSend` scrubs the EVENT
 * (user, request, device); breadcrumbs are the trail attached to it, and Sentry's touch integration records
 * the pressed element's **accessibility label**. Debt builds those labels out of the user's own figures —
 * `money.tsx:828` renders `"{title}, {count} expenses, {subtotal}"` and `:980` renders `"{value} {sub}"`,
 * where both are formatted amounts. **So a crash on the Money tab would ship someone's real balances to a
 * third party**, which is the one thing this app's claim ([D41]) says never happens.
 *
 * ⚠️ Pure and native-free ON PURPOSE — no `@sentry/react-native` import — so every branch is unit-testable
 * under `tsx` with no device and no DSN. `sentry.ts` supplies it to `Sentry.init`.
 *
 * ⛔ **Redaction is deliberately NARROW.** Blanking every digit would also destroy the counts, step indices
 * and route ids that make a breadcrumb worth having, and a diagnostic trail nobody can read gets turned off
 * — at which point the privacy win is paid for with the whole feature. Money in this app is always
 * currency-formatted (`formatWhole` → `$1,350`), so that is what is matched.
 */

/** `$1,350`, `$1,350.75`, `$ 12` — the shape every money formatter in this app emits. */
const MONEY = /\$\s?\d[\d,]*(?:\.\d+)?/g;

/** What a redacted amount becomes. Recognisable as a redaction, not as a rendering bug. */
export const REDACTED = '$[redacted]';

/**
 * ⛔ **Categories whose content is the USER'S OWN WORDS.** [S1.10.6.6 · pass-3 B7] Sentry's touch
 * integration records the pressed element's accessibility label, and this app builds those out of debt,
 * expense and goal names the user typed. ⚠️ Both spellings are listed because the SDK has used both, and a
 * set that names one of them is the enumeration-is-short class this project keeps measuring.
 */
const USER_AUTHORED_CATEGORIES = new Set(['touch', 'ui.click']);

export function redactMoney(value: string): string {
  return value.replace(MONEY, REDACTED);
}

/** The subset of a Sentry breadcrumb this scrub touches. Structural, so no Sentry types are needed. */
export interface ScrubbableBreadcrumb {
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Returns the breadcrumb with money redacted, or `null` to DROP it entirely.
 *
 * ⛔ `console` breadcrumbs are dropped rather than redacted. Their content is arbitrary — anything the app
 * or a dependency ever logged, including whole store objects in development — so there is no pattern that
 * makes them safe. A category we cannot bound is a category we do not send.
 */
export function scrubBreadcrumb(breadcrumb: ScrubbableBreadcrumb | null): ScrubbableBreadcrumb | null {
  if (!breadcrumb) return null;
  if (breadcrumb.category === 'console') return null;
  /**
   * ⛔ **THE SCRUB TOOK THE AMOUNTS AND LEFT THE CREDITOR NAMES.** [S1.10.6.6 · pass-3 B7]
   *
   * ⚡ Measured through the real scrub on the label `ListRow` actually builds:
   * *"Visa, Focus, $2,400 · 22.99% APR, estimated verified Jun 3, $65.00/mo"* → *"Visa, Focus,
   * $[redacted] · 22.99% APR, estimated verified Jun 3, $[redacted]/mo"*. **The dollar figures go; who they
   * owe, at what rate, and when they last checked stay** — and every one of those `title` props is
   * user-authored (`debt.name`, `item.name`, `g.name`). On a build where the DSN is live.
   *
   * ⛔ **The remedy is not a wider regex — a NAME cannot be pattern-matched.** So the touch categories are
   * dropped whole, the way `console` already is: a row's *identity* is the part that is never diagnostic,
   * and a category whose content we cannot bound is a category we do not send. ⚠️ `navigation` and `http`
   * are kept deliberately — routes, counts and step indices are the trail this feature exists for, and
   * dropping them is how a diagnostic tool gets turned off entirely.
   *
   * ⚠️ **The premise this was originally decided under has changed.** The cost/benefit above was written
   * while the Sentry scaffold was inert; the DSN arrived 2026-08-20 and `sentry.ts` only hard-returns when
   * it is unset. Nothing re-read the decision when it stopped being hypothetical.
   */
  if (breadcrumb.category != null && USER_AUTHORED_CATEGORIES.has(breadcrumb.category)) return null;

  const scrubbed: ScrubbableBreadcrumb = { ...breadcrumb };
  if (typeof scrubbed.message === 'string') scrubbed.message = redactMoney(scrubbed.message);

  if (scrubbed.data && typeof scrubbed.data === 'object') {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(scrubbed.data)) {
      // ⚠️ Strings only. A number in `data` is a count or a coordinate — never a formatted amount — and
      // stringifying it to run the regex would change the payload's shape for no gain.
      data[key] = typeof value === 'string' ? redactMoney(value) : value;
    }
    scrubbed.data = data;
  }

  return scrubbed;
}
