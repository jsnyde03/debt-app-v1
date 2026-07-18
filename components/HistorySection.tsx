import type { PayCycleSnapshot } from "@core/storage/debtPlannerStorage";
import { formatCurrency } from "@core/utils/formatCurrency";
import { dayBefore } from "@core/utils/dayBefore";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import { History, ChevronRight, TrendingDown, TrendingUp } from "@/lib/icons";
import { PREMIUM_PLUS_AVAILABLE } from "@/lib/subscription/plans";

type HistorySectionProps = {
    visibleHistory: PayCycleSnapshot[];
    canAccessHistory: boolean;
    isHistoryCapped: boolean;
    onUpgrade: () => void;
    onClose: () => void;
};

function formatCycleDate(date: string) {
    if (!date) return "Recent cycle";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function HistorySection({
    visibleHistory,
    canAccessHistory,
    isHistoryCapped,
    onUpgrade,
    onClose,
}: HistorySectionProps) {
    return (
        <div className="settings-overlay" onClick={onClose}>
            <div
                className="settings-sheet history-sheet"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-label="Pay Cycle History"
            >
                <div className="settings-sheet-header">
                    <div>
                        <h2>Pay Cycle History</h2>
                        <p className="section-collapse-subtitle">
                            See how far you&apos;ve come, one cycle at a time.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="text-action-button"
                        onClick={() => {
                            triggerLightHaptic();
                            onClose();
                        }}
                    >
                        Close
                    </button>
                </div>

                {!canAccessHistory ? (
                    <div className="card history-locked-card">
                        <div className="history-locked-icon" aria-hidden="true">
                            <History size={28} />
                        </div>
                        <h3>Track your journey with Premium</h3>
                        <p className="history-locked-text">
                            Premium saves a snapshot of every pay cycle so you can
                            watch your total debt fall over time.
                        </p>
                        <button
                            type="button"
                            className="primary-plan-button"
                            onClick={() => {
                                triggerLightHaptic();
                                onUpgrade();
                            }}
                        >
                            Upgrade to Premium
                        </button>
                    </div>
                ) : visibleHistory.length === 0 ? (
                    <div className="card history-empty-card">
                        <div className="history-empty-icon" aria-hidden="true">
                            <History size={28} />
                        </div>
                        <p className="history-empty-text">
                            No finished cycles yet. When you start your next pay
                            cycle, that completed cycle shows up here.
                        </p>
                    </div>
                ) : (
                    <ul className="history-list" aria-label="Past pay cycles">
                        {visibleHistory.map((snapshot, index) => {
                            // visibleHistory is most-recent-first, so the next
                            // item is the chronologically older cycle.
                            const older = visibleHistory[index + 1];
                            const delta = older
                                ? older.totalDebtBalance -
                                  snapshot.totalDebtBalance
                                : 0;
                            const reducedDebt = delta > 0;
                            const increasedDebt = delta < 0;

                            return (
                                <li
                                    key={`${snapshot.cycleEndDate}-${index}`}
                                    className="history-row card"
                                >
                                    <div className="history-row-main">
                                        <span className="history-row-date">
                                            {formatCycleDate(
                                                dayBefore(snapshot.cycleEndDate)
                                            )}
                                        </span>
                                        <span className="history-row-balance">
                                            {formatCurrency(
                                                snapshot.totalDebtBalance
                                            )}
                                        </span>
                                    </div>
                                    <div className="history-row-meta">
                                        <span className="history-row-paid">
                                            {formatCurrency(
                                                snapshot.totalPaidThisCycle
                                            )}{" "}
                                            paid
                                        </span>
                                        {(reducedDebt || increasedDebt) && (
                                            <span
                                                className={
                                                    reducedDebt
                                                        ? "history-row-delta history-row-delta-down"
                                                        : "history-row-delta history-row-delta-up"
                                                }
                                            >
                                                {reducedDebt ? (
                                                    <TrendingDown size={14} />
                                                ) : (
                                                    <TrendingUp size={14} />
                                                )}
                                                {formatCurrency(
                                                    Math.abs(delta)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}

                        {isHistoryCapped && PREMIUM_PLUS_AVAILABLE && (
                            <li>
                                <button
                                    type="button"
                                    className="history-upsell-row"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        onUpgrade();
                                    }}
                                >
                                    <span>
                                        Showing your last 6 cycles. Upgrade to
                                        Premium+ for your full history.
                                    </span>
                                    <ChevronRight size={18} />
                                </button>
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
