import { useState } from "react";
import type { AmortizationSchedule } from "@/lib/debt/buildAmortizationSchedule";
import { formatCurrency } from "@core/utils/formatCurrency";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import { Target, TrendingDown } from "@/lib/icons";

type AmortizationCalendarProps = {
    debtName: string;
    startingBalance: number;
    monthlyPayment: number;
    startDate: string;
    schedule: AmortizationSchedule;
    canAccess: boolean;
    onUpgrade: () => void;
    onClose: () => void;
};

// Month N of the schedule is paid N months after the start date.
function formatScheduleMonth(startDate: string, monthOffset: number) {
    const base = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) {
        return `Month ${monthOffset}`;
    }
    base.setMonth(base.getMonth() + monthOffset);
    return base.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const ROWS_PAGE_SIZE = 12;

export function AmortizationCalendar({
    debtName,
    startingBalance,
    monthlyPayment,
    startDate,
    schedule,
    canAccess,
    onUpgrade,
    onClose,
}: AmortizationCalendarProps) {
    const [visibleCount, setVisibleCount] = useState(ROWS_PAGE_SIZE);
    const visibleRows = schedule.rows.slice(0, visibleCount);
    const debtFreeDate =
        schedule.rows.length > 0
            ? formatScheduleMonth(startDate, schedule.monthsToPayoff)
            : null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div
                className="settings-sheet history-sheet amortization-sheet"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-label={`Payoff schedule for ${debtName}`}
            >
                <div className="settings-sheet-header">
                    <div>
                        <h2>Payoff Schedule</h2>
                        <p className="section-collapse-subtitle">
                            Month-by-month payoff for {debtName}.
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

                {!canAccess ? (
                    <div className="card history-locked-card">
                        <div className="history-locked-icon" aria-hidden="true">
                            <Target size={28} />
                        </div>
                        <h3>See your full payoff schedule with Premium</h3>
                        <p className="history-locked-text">
                            Premium maps out every month of your focus debt — how
                            much goes to interest, how much to principal, and the
                            month it hits $0.
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
                ) : !schedule.payoffPossible || schedule.rows.length === 0 ? (
                    <div className="card history-empty-card">
                        <div className="history-empty-icon" aria-hidden="true">
                            <Target size={28} />
                        </div>
                        <p className="history-empty-text">
                            This debt can&apos;t be projected to payoff yet — the
                            monthly payment needs to cover more than the monthly
                            interest. Increase the payment to see a schedule.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="amortization-summary-strip">
                            <div>
                                <span>Debt Free</span>
                                <strong>{debtFreeDate}</strong>
                            </div>
                            <div>
                                <span>Months</span>
                                <strong>{schedule.monthsToPayoff}</strong>
                            </div>
                            <div>
                                <span>Total Interest</span>
                                <strong>
                                    {formatCurrency(schedule.totalInterest)}
                                </strong>
                            </div>
                        </div>

                        <div className="amortization-assumption">
                            <TrendingDown size={14} />
                            <span>
                                Paying {formatCurrency(monthlyPayment)}/mo on{" "}
                                {formatCurrency(startingBalance)}
                            </span>
                        </div>

                        <div
                            className="amortization-table"
                            role="table"
                            aria-label={`Payoff schedule for ${debtName}`}
                        >
                            <div
                                className="amortization-row amortization-row-head"
                                role="row"
                            >
                                <span role="columnheader">Month</span>
                                <span role="columnheader">Interest</span>
                                <span role="columnheader">Principal</span>
                                <span role="columnheader">Balance</span>
                            </div>

                            {visibleRows.map((row) => (
                                <div
                                    className="amortization-row"
                                    role="row"
                                    key={row.month}
                                >
                                    <span
                                        role="cell"
                                        className="amortization-month"
                                    >
                                        {formatScheduleMonth(
                                            startDate,
                                            row.month
                                        )}
                                    </span>
                                    <span
                                        role="cell"
                                        className="amortization-interest"
                                    >
                                        {formatCurrency(row.interest)}
                                    </span>
                                    <span
                                        role="cell"
                                        className="amortization-principal"
                                    >
                                        {formatCurrency(row.principal)}
                                    </span>
                                    <span
                                        role="cell"
                                        className="amortization-balance"
                                    >
                                        {formatCurrency(row.endingBalance)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {schedule.rows.length > visibleCount && (
                            <div className="load-more-actions">
                                <button
                                    type="button"
                                    className="load-more-button"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setVisibleCount(
                                            (current) => current + ROWS_PAGE_SIZE
                                        );
                                    }}
                                >
                                    Show More Months
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
