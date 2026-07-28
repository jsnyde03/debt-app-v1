import type { DebtStore } from '@/data/models';
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
  };
}
