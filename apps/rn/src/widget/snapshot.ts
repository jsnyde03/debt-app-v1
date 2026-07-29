import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { formatWhole } from '@/utils/format';

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
  /** "October 2027" · "Debt-free!" when all debts are cleared · "—" when unknowable. */
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
    const brief = selectPaydayGuardian(withProjectedBalances(store, true));
    if (!brief) return '';
    if (brief.shortfall && brief.shortfall > 0) {
      return `This paycheck is very tight — you're about ${formatWhole(brief.shortfall)} short of your obligations.`;
    }
    if (brief.state === 'tight' && brief.safeMove) {
      return `This paycheck is a little tight. ${brief.safeMove}`;
    }
    if (brief.deployedToDebt > 0) {
      return `This paycheck looks clear. Your cushion is safe, with ${formatWhole(brief.deployedToDebt)} free to put toward debt.`;
    }
    return 'This paycheck looks clear. Your cushion is safe.';
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

  // Has debts but none live → they've cleared everything. Otherwise the projected payoff date (or —).
  const cleared = debts.length > 0 && live.length === 0;
  const debtFreeDate = cleared ? 'Debt-free!' : (selectPayoffView(store).debtFreeDate ?? '—');

  return {
    hasData: debts.length > 0,
    debtFreeDate,
    pctPaid: pct,
    pctLabel: `${Math.round(pct * 100)}%`,
    remaining: formatWhole(totalCurrent),
    updatedAt,
    guardianSpoken: buildGuardianSpoken(store),
    isPremium: store.subscriptionPlan === 'premium',
    debtsJson: JSON.stringify(
      live.map((d) => ({ id: d.id, name: d.name, balance: formatWhole(d.balance) })),
    ),
  };
}
