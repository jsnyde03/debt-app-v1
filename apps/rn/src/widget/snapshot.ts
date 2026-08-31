import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { mayClaim, partitionDebts } from '@/store/trustSelectors';
import { formatWhole } from '@/utils/format';

/**
 * ⛔ **S1.10.6.3 [D3-1] — what `debtFreeDate` says when the balances could not be read.**
 *
 * ⚠️ It goes in the DATE slot deliberately. `DebtViews.swift` renders `snap.debtFreeDate` verbatim beneath
 * a **static** *"DEBT-FREE DATE"* / *"Debt-free"* label on every family, so this reads as *"we cannot give
 * you a date"* rather than as a claim. The `WidgetSnapshot` interface carries no field that could say
 * *"unread"* on its own, and adding one is a native change — which this deliberately is not.
 */
const UNREAD_WIDGET_DATE = 'Balances unread';

/**
 * The compact, display-ready payload the iOS home/lock-screen widget renders (3.5.4). Built here in JS
 * — all formatting + clamping stays on this side, unit-tested — then written to the App-Group
 * `UserDefaults` suite; the Swift widget just decodes these fields (no calc, no formatting natively).
 * Kept to strings + a number + a bool so it survives the JSON round-trip through UserDefaults
 * unambiguously and maps 1:1 onto the Swift `DebtSnapshot` Codable struct.
 */
export interface WidgetSnapshot {
  /** false → no debts entered yet → the widget shows an "open the app" prompt. */
  hasData: boolean;
  /** "October 2027" · "Debt-free" when all debts are cleared · "—" when unknowable. */
  debtFreeDate: string;
  /**
   * ⛔ **S1.13.7.4 [pass-6 `C3-1`] — A FLAG, BECAUSE SIRI WAS SPEAKING THE REFUSAL SENTINELS ALOUD.**
   *
   * `debtFreeDate` carries `'Balances unread'` / `'—'` when the app must not state a figure, and the
   * widget renders it under a STATIC label, which reads correctly. **Siri interpolates it into a
   * sentence**, so the same string became *"You’re on track to be debt-free by Balances unread."* and
   * *"You have — in debt remaining."*
   *
   * ⚠️ **A boolean rather than another string comparison in Swift.** `SiriQueryIntents.swift` already
   * matches `"Debt-free"` by literal, and its own comment records the hazard: *"a TypeScript-scoped
   * search cannot see a `.swift` file, and a silent mismatch here does not crash."* Adding a second
   * literal would add a second thing for that sweep to miss; a flag cannot drift in spelling.
   */
  balancesUnread: boolean;
  /** 0..1 for the SwiftUI ring/Gauge. Clamped. */
  pctPaid: number;
  /** "22%". */
  pctLabel: string;
  /** Compact remaining balance — "$17,200". */
  remaining: string;
  /** Epoch ms of the write — an "as of" footnote / staleness signal on the native side. */
  updatedAt: number;
  /** 3.5.5 — the PREMIUM Guardian read for this paycheck, as a spoken sentence for the Siri "am I okay
   *  this paycheck?" App Shortcut. `""` for free (the intent returns a value-led upsell). The widget
   *  doesn't render this — its Swift `DebtSnapshot` ignores the extra key; only the Siri intent reads it. */
  guardianSpoken: string;
  /** 3.5.5 — premium flag, so the voice log-a-payment intent can gate (free → an upsell). */
  isPremium: boolean;
  /** 3.5.5 — the LIVE debt list as a JSON string `[{id,name,balance}]` (kept a STRING so the snapshot
   *  stays flat), for Siri's `DebtEntity` disambiguation in the log-a-payment intent. */
  debtsJson: string;
}

/** The premium Guardian read as a spoken sentence (Siri), or "" for free. Guarded — `buildWidgetSnapshot`
 *  must never throw (the widget depends on it), so a selector hiccup collapses to "". */
function buildGuardianSpoken(store: DebtStore): string {
  try {
    if (store.subscriptionPlan !== 'premium') return '';
    /**
     * ⛔ **SIRI SAID *"$1,080 free to put toward debt"* OVER AN OBLIGATION THE APP COULD NOT READ.**
     * [S1.10.6.3 · pass-3 blocker D3-2]
     *
     * ⚡ Measured with a control, one variable apart: with a real $1,500 minimum the sentence names
     * **$180**; with the same debt's `minimumPayment` unreadable — pass-2 `C4`'s exact class — it names
     * **$1,080**, and *the sentence around it does not change at all*. The $900 gap is the obligation the
     * app knows it failed to read, while Today refuses to say the user is caught up.
     *
     * ⚠️ The brief is honest about the arrays it was handed; the arrays are wrong. `'required-plan'` is the
     * claim that names exactly this — its route is `debt: ['minimumPayment']` — and the in-app consumers
     * already ask it. ⛔ **The `''` return already existed and Siri already routes it to the value-led
     * upsell** (`SiriQueryIntents.swift:75-78`); what was missing was the call.
     */
    if (!mayClaim(store, 'required-plan')) return '';
    const brief = selectPaydayGuardian(withProjectedBalances(store, true));
    if (!brief) return '';
    if (brief.shortfall && brief.shortfall > 0) {
      return `This paycheck is very tight — you’re about ${formatWhole(brief.shortfall)} short of your obligations.`;
    }
    if (brief.state === 'tight' && brief.safeMove) {
      return `This paycheck is a little tight. ${brief.safeMove}`;
    }
    // ⛔ [L1-12] "Your cushion is safe" was the app's most absolute claim on its least contextual surface
    // — and the SAME sentence already hedged its first clause ("looks clear"). It is derived from a
    // prediction the Guardian grades itself on, and `GuardianScorecard` names the failure direction out
    // loud: "Under-warned — said you'd hold, you dipped below". "Holds" is the present-tense read of the
    // plan that `buildGuardianBrief` already ships under this same `state === 'clear'` gate.
    if (brief.deployedToDebt > 0) {
      return `This paycheck looks clear — your cushion holds, with ${formatWhole(brief.deployedToDebt)} free to put toward debt.`;
    }
    return 'This paycheck looks clear — your cushion holds.';
  } catch {
    return '';
  }
}

/**
 * Derive the widget payload from the live store. Pure + total: never throws, always returns a
 * renderable snapshot (missing/degenerate values collapse to safe placeholders), so the widget can
 * never show `NaN`/`—` incorrectly. `updatedAt` is injected (not read from the clock) so it stays
 * testable.
 */
export function buildWidgetSnapshot(store: DebtStore, updatedAt: number): WidgetSnapshot {
  const debts = store.debts ?? [];
  /**
   * ⛔ **S1.12.5.6 [pass-5 `C5-2`] — THE WIDGET STATED A DEBT TOTAL $2,513 BELOW THE APP'S, ON ONE STORE
   * AT ONE INSTANT.**
   *
   * ⚡ Measured: a premium user with one card verified eleven months ago read **"$9,000 remaining"** on the
   * Home Screen and heard *"You have $9,000 in debt remaining"* from Siri, while Money's hero said
   * **$11,513** — 28% apart. A second fixture moved it the other way (app $14,304 · widget $15,000), so
   * the widget was not conservative in a fixed direction; it was simply a different number.
   * ⭐ **Free is the control and it agreed exactly**, because `withProjectedBalances` is a documented no-op
   * for free — so the divergence is the premium projection and nothing else.
   *
   * ⛔ **This module already knew the rule.** `buildGuardianSpoken` below calls
   * `selectPaydayGuardian(withProjectedBalances(store, true))`: the projection was applied to the Guardian
   * SENTENCE and not to the four figures above it. And premium's own paywall bullet is *"Balances that
   * keep themselves roughly right — projected forward between statements"*, while the surface a user sees
   * **without opening the app** was the one that did not.
   *
   * ⚠️ **Only the FORWARD-LOOKING figures move**, and each exclusion is a hazard lane C named:
   *   · `totalOriginal` / `totalPaid` / `pct` stay on the anchors — the backward-looking rule
   *     (`journeySelectors.ts`): "% paid" must not fall while the user does nothing.
   *   · ⛔ `live`/`cleared` stay on the anchors. A projected estimate reaching `$0` would put
   *     **"Debt-free"** on the Home Screen before the user confirmed anything, which
   *     `selectProvisionalPayoffs` and `PayoffInvitationCard` exist to prevent.
   *   · `debtsJson` stays on the anchors — it feeds Siri's log-a-payment disambiguation, where the
   *     verified figure is the one to hand back.
   */
  const engineDebts = withProjectedBalances(store, store.subscriptionPlan === 'premium').debts ?? [];
  // ⚠️ Anchors, deliberately — see the hazard note above.
  const live = debts.filter((d) => d.balance > 0);
  const totalOriginal = debts.reduce((s, d) => s + (d.originalBalance ?? d.balance), 0);
  const totalCurrent = engineDebts.reduce((s, d) => s + d.balance, 0);
  // ⚠️ `totalPaid` is measured against the ANCHOR total, not the projected one: interest accruing between
  // statements is not the user paying money, and crediting it would make "% paid" move on its own.
  const totalPaid = Math.max(0, totalOriginal - debts.reduce((s, d) => s + d.balance, 0));
  const pct = totalOriginal > 0 ? Math.max(0, Math.min(1, totalPaid / totalOriginal)) : 0;

  /**
   * ⛔ **THE APP AND THE WIDGET MADE THE SAME CLAIM FROM THE SAME STORE AND DISAGREED.**
   * [S1.10.6.3 · pass-3 blocker D3-1]
   *
   * ⚡ Measured on one store at one instant: `mayClaim(store, 'debt-balances')` was **false** and
   * `selectPlanState` returned `debt-free-unverified` — the banner correctly refusing — while this payload
   * carried **"Debt-free"**, a **100%** ring and **"$0"** remaining, *permanently*, over $12,400 still owed.
   * A balance the app could not read repairs to `0`, so `live` is empty, `remaining` sums those zeros and
   * `pct` divides `originalBalance` by itself. ⛔ **That is [B1]'s own finding verbatim** — *"one tab apart,
   * on one store, the app both refused and asserted the same sentence"* — with the Home Screen and the Lock
   * Screen standing where Today used to.
   *
   * ⚠️ **ALL FOUR FIGURES DEGRADE TOGETHER, and that is the load-bearing half.** Repairing only the date
   * leaves *"100% · $0"*, which is the same false statement without the word.
   *
   * ⛔ **NOT `hasData: false`.** That is the one lever that looks tempting and is wrong: the Swift views
   * render *"Add debts in app"* for it, which is exactly the false replacement `progress.tsx:186-196`
   * records having shipped once — a true statement withheld and a different false one put in its place,
   * over debts the user has entered and still owes.
   *
   * ⚠️ **The native side does no calculation and no guard**, by design — `DebtViews.swift` renders these
   * strings verbatim under STATIC labels (*"DEBT-FREE DATE"*), so "Balances unread" reads as *"we cannot
   * give you a date"* on every family. JS is the only place a guard can live.
   */
  /**
   * ⛔ **S1.13.7.4 [pass-6 `C3-5`] — THE GUARD WAS COMPUTED OVER DIFFERENT FIELDS THAN THE NUMBER IS
   * COMPUTED FROM.**
   *
   * `'debt-balances'` routes `balance` and `originalBalance`. But `C5-2` correctly moved these figures
   * onto the **PROJECTED** store, and `projectCurrentBalance` reads **`apr` and `minimumPayment`** — which
   * route to `'row-figures'`, and only there. So the pass-5 fix changed what the number is computed FROM
   * without changing what the guard is computed OVER.
   *
   * ⚡ Measured, one variable: a premium user whose imported **APR** was unreadable reads **$6,500** on the
   * Home Screen and hears it from Siri, against a true **$8,931** — and `mayClaim('debt-balances')` is
   * `true`, so nothing refuses. The mirror case (unreadable minimum) reads **$11,800**.
   *
   * ⛔ **And the payload contradicted itself**: on that store `guardianSpoken` is `""` — it refuses to
   * speak the Guardian read *because* the minimum is unread — while the total beside it is computed from
   * that same minimum.
   *
   * ⚠️ Both claims, not a widened route: `'debt-balances'` must keep meaning *"the balances are readable"*
   * for the surfaces that show a RAW balance, or the fix becomes over-suppression — *a suppression that
   * never lets the good state through is a second false statement, not a fix.*
   */
  const mayStateBalances = mayClaim(store, 'debt-balances') && mayClaim(store, 'row-figures');

  // Has debts but none live → they've cleared everything. Otherwise the projected payoff date (or —).
  const cleared = debts.length > 0 && live.length === 0 && mayStateBalances;
  const debtFreeDate = !mayStateBalances
    ? UNREAD_WIDGET_DATE
    : cleared
      ? 'Debt-free'
      // ⛔ [pass-5 C5-2] the PROJECTED store, the same basis `progress.tsx` uses — otherwise the widget's
      // date is computed from a different balance set than the app's. ⚠️ Lane C could not reproduce a
      // fixture where the two printed dates DIFFERED and said so; this is aligned on principle, and the
      // measured divergence is `remaining`.
      : (selectPayoffView(withProjectedBalances(store, store.subscriptionPlan === 'premium')).debtFreeDate ?? '—');

  return {
    hasData: debts.length > 0,
    debtFreeDate,
    // ⚠️ `0` rather than the computed fraction: there is no indeterminate state for a `Gauge`/`ProgressRing`
    // without a native change, and an empty ring beside a "—" label is the honest one of the two.
    balancesUnread: !mayStateBalances,
    pctPaid: mayStateBalances ? pct : 0,
    pctLabel: mayStateBalances ? `${Math.round(pct * 100)}%` : '—',
    remaining: mayStateBalances ? formatWhole(totalCurrent) : '—',
    updatedAt,
    guardianSpoken: buildGuardianSpoken(store),
    isPremium: store.subscriptionPlan === 'premium',
    /**
     * ⛔ **S1.13.7.4 [pass-6 `C3-4`] — A DEBT THE APP COULD NOT READ SILENTLY DISAPPEARED FROM SIRI'S
     * LIST, so it was the one debt the user could not name in order to fix it.**
     *
     * `live` is `balance > 0`, and an unread balance is repaired to `0` — the same membership defect as
     * `C4-2` and `B1-1`, on the voice surface. The user says *"log a payment to Chase"* and Siri does not
     * know Chase exists.
     *
     * ⚠️ **Live PLUS unread, not all debts.** Sourcing from `debts` would resurrect genuinely paid-off
     * debts into the disambiguation list, which is a second false statement rather than a fix. The
     * partition is the owner of that three-way distinction and is not re-derived here.
     */
    debtsJson: JSON.stringify(
      [...live, ...partitionDebts(store).unreadBalance].map((d) => ({
        id: d.id,
        name: d.name,
        balance: formatWhole(d.balance),
      })),
    ),
  };
}
