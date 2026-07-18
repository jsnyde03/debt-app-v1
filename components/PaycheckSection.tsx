import type { PayCycle } from "@core/payCycle/getNextPaycheckDate";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";

type PaycheckSectionProps = {
    amount: string;
    payCycle: PayCycle;
    semiMonthlyFirstDay: string;
    semiMonthlySecondDay: string;
    monthlyPayDay: string;
    nextPaycheckDate: string;
    currentDate: string;
    showAdminActions: boolean;

    onExportBackup: () => void;
    onImportBackup?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onAmountChange: (value: string) => void;
    onPayCycleChange: (value: PayCycle) => void;
    onNextPayCheckDateChange: (value: string) => void;
    onSemiMonthlyFirstDayChange: (value: string) => void;
    onSemiMonthlySecondDayChange: (value: string) => void;
    onMonthlyPayDayChange: (value: string) => void;
    onCalculate: () => void;
    onRolloverPayCycle: () => void;
    onResetToToday: () => void;

};

export function PaycheckSection({
    amount,
    payCycle,
    semiMonthlyFirstDay,
    semiMonthlySecondDay,
    monthlyPayDay,
    nextPaycheckDate,
    showAdminActions,
    onImportBackup,
    onExportBackup,
    onAmountChange,
    onPayCycleChange,
    onNextPayCheckDateChange,
    onSemiMonthlyFirstDayChange,
    onSemiMonthlySecondDayChange,
    onMonthlyPayDayChange,
    onCalculate,
    onRolloverPayCycle,
    onResetToToday,
}: PaycheckSectionProps) {
    return (
        <section className="card settings-sheet-content">
            <h2>Paycheck</h2>

            <div className="form-grid">
                <div className="field">
                    <label>Paycheck Amount</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="done"
                        placeholder="Example: 1000"
                        value={amount}
                        onChange={(event) => onAmountChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                onCalculate();
                            }
                        }}
                    />
                </div>

                <div className="field">
                    <label>Pay Cycle</label>
                    <select
                        value={payCycle}
                        onChange={(event) =>
                            onPayCycleChange(event.target.value as PayCycle)
                        }
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="semimonthly">Semi-Monthly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                <div className="field">
                    <label>Next Paycheck Date</label>
                    <input
                        type="date"
                        value={nextPaycheckDate}
                        onChange={(event) => onNextPayCheckDateChange(event.target.value)}
                    />
                </div>

                {payCycle === "semimonthly" && (
                    <>
                        <div className="field">
                            <label>First pay day of month</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={semiMonthlyFirstDay}
                                onChange={(event) =>
                                    onSemiMonthlyFirstDayChange(event.target.value)
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Second pay day of month</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={semiMonthlySecondDay}
                                onChange={(event) =>
                                    onSemiMonthlySecondDayChange(event.target.value)
                                }
                            />
                        </div>
                    </>
                )}

                {payCycle === "monthly" && (
                    <div className="field">
                        <label>Pay day of month</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={monthlyPayDay}
                            onChange={(event) =>
                                onMonthlyPayDayChange(event.target.value)
                            }
                        />
                    </div>
                )}

                <p className="empty-state summary-text">
                    {nextPaycheckDate
                        ? `Planning through ${nextPaycheckDate}.`
                        : "Enter valid payday settings to calculate your pay period."}
                </p>

                <button
                    type="button"
                    className="primary-plan-button"
                    onClick={() => {
                        triggerMediumHaptic();
                        onCalculate();
                    }}
                >
                    Calculate plan
                </button>
            </div>
            {showAdminActions && (
                <div className="settings-utility-section">
                    <div className="plan-admin-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                triggerMediumHaptic();
                                onRolloverPayCycle();
                            }}
                        >
                            Start Next Pay Cycle
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                triggerLightHaptic();
                                onResetToToday();
                            }}
                        >
                            Reset To Today
                        </button>
                    </div>

                    <div className="plan-admin-actions backup-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                triggerLightHaptic();
                                onExportBackup();
                            }}>
                            Export Backup
                        </button>
                    {onImportBackup && (
                        <label className="secondary-button import-button">
                            Import Backup
                            <input type="file" accept=".json,application/json" onChange={onImportBackup} hidden />
                        </label>
                    )}
                        
                    </div>
                </div>
            )}

        </section>
    );
}
