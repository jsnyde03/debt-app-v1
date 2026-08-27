import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { mayClaim } from '@/store/trustSelectors';
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
  const live = debts.filter((d) => d.balance > 0);
  const totalOriginal = debts.reduce((s, d) => s + (d.originalBalance ?? d.balance), 0);
  const totalCurrent = debts.reduce((s, d) => s + d.balance, 0);
  const totalPaid = Math.max(0, totalOriginal - totalCurrent);
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
  const mayStateBalances = mayClaim(store, 'debt-balances');

  // Has debts but none live → they've cleared everything. Otherwise the projected payoff date (or —).
  const cleared = debts.length > 0 && live.length === 0 && mayStateBalances;
  const debtFreeDate = !mayStateBalances
    ? UNREAD_WIDGET_DATE
    : cleared
      ? 'Debt-free'
      : (selectPayoffView(store).debtFreeDate ?? '—');

  return {
    hasData: debts.length > 0,
    debtFreeDate,
    // ⚠️ `0` rather than the computed fraction: there is no indeterminate state for a `Gauge`/`ProgressRing`
    // without a native change, and an empty ring beside a "—" label is the honest one of the two.
    pctPaid: mayStateBalances ? pct : 0,
    pctLabel: mayStateBalances ? `${Math.round(pct * 100)}%` : '—',
    remaining: mayStateBalances ? formatWhole(totalCurrent) : '—',
    updatedAt,
    guardianSpoken: buildGuardianSpoken(store),
    isPremium: store.subscriptionPlan === 'premium',
    debtsJson: JSON.stringify(
      live.map((d) => ({ id: d.id, name: d.name, balance: formatWhole(d.balance) })),
    ),
  };
}
