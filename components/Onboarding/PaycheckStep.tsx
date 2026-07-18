import { useState } from "react";
import { getNextPaycheckDate, type PayCycle } from "@core/payCycle/getNextPaycheckDate";
import { getCurrentDate } from "@/lib/hooks/usePayCycleSettings";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import { writeKey } from "@/lib/storage/safeStorage";

type PaycheckStepProps = {
    onNext: () => void;
    onSkip: () => void;
};

function computeNext(payCycle: PayCycle, firstDay: string, secondDay: string, payDay: string): string {
    const today = getCurrentDate();
    try {
        return getNextPaycheckDate({
            payCycle,
            currentDate: today,
            semiMonthlyFirstDay: Number(firstDay),
            semiMonthlySecondDay: Number(secondDay),
            monthlyPayDay: Number(payDay),
        });
    } catch {
        return getNextPaycheckDate({ payCycle: "biweekly", currentDate: today });
    }
}

export function PaycheckStep({ onNext, onSkip }: PaycheckStepProps) {
    const [amount, setAmount] = useState("");
    const [payCycle, setPayCycle] = useState<PayCycle>("biweekly");
    const [firstDay, setFirstDay] = useState("1");
    const [secondDay, setSecondDay] = useState("15");
    const [payDay, setPayDay] = useState("1");
    const [nextDate, setNextDate] = useState(() => computeNext("biweekly", "1", "15", "1"));
    const [error, setError] = useState("");

    function handleCycleChange(cycle: PayCycle) {
        setPayCycle(cycle);
        setNextDate(computeNext(cycle, firstDay, secondDay, payDay));
    }

    function handleNext() {
        if (!amount || Number(amount) <= 0) {
            setError("Enter your paycheck amount to continue.");
            return;
        }
        setError("");
        const today = getCurrentDate();
        writeKey("debtPlanner.amount", amount);
        writeKey("debtPlanner.payCycle", payCycle);
        writeKey("debtPlanner.currentDate", today);
        writeKey("debtPlanner.nextPaycheckDate", nextDate);
        if (payCycle === "semimonthly") {
            writeKey("debtPlanner.semiMonthlyFirstDay", firstDay);
            writeKey("debtPlanner.semiMonthlySecondDay", secondDay);
        }
        if (payCycle === "monthly") {
            writeKey("debtPlanner.monthlyPayDay", payDay);
        }
        triggerLightHaptic();
        onNext();
    }

    return (
        <div className="onboarding-scroll">
            <div className="onboarding-progress">
                <span className="onboarding-dot" />
                <span className="onboarding-dot active" />
                <span className="onboarding-dot" />
                <span className="onboarding-dot" />
            </div>

            <div className="onboarding-copy">
                <h2 className="onboarding-title">When do you<br />get paid?</h2>
                <p className="onboarding-subtitle">
                    This sets up your pay cycle so we know which bills are due next.
                </p>
            </div>

            <div className="onboarding-fields">
                <div className="onboarding-field">
                    <label htmlFor="ob-amount">Paycheck Amount</label>
                    <input
                        id="ob-amount"
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="done"
                        placeholder="e.g. 1500"
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    />
                    {error && <p style={{ color: "var(--danger-color)", fontSize: "0.82rem", margin: "2px 0 0" }}>{error}</p>}
                </div>

                <div className="onboarding-field">
                    <label htmlFor="ob-cycle">Pay Cycle</label>
                    <select
                        id="ob-cycle"
                        value={payCycle}
                        onChange={(e) => handleCycleChange(e.target.value as PayCycle)}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="semimonthly">Semi-Monthly (e.g. 1st & 15th)</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                {payCycle === "semimonthly" && (
                    <div className="onboarding-day-pair">
                        <div className="onboarding-field">
                            <label htmlFor="ob-first">First payday</label>
                            <input
                                id="ob-first"
                                type="text"
                                inputMode="numeric"
                                placeholder="1"
                                value={firstDay}
                                onChange={(e) => {
                                    setFirstDay(e.target.value);
                                    setNextDate(computeNext(payCycle, e.target.value, secondDay, payDay));
                                }}
                            />
                        </div>
                        <div className="onboarding-field">
                            <label htmlFor="ob-second">Second payday</label>
                            <input
                                id="ob-second"
                                type="text"
                                inputMode="numeric"
                                placeholder="15"
                                value={secondDay}
                                onChange={(e) => {
                                    setSecondDay(e.target.value);
                                    setNextDate(computeNext(payCycle, firstDay, e.target.value, payDay));
                                }}
                            />
                        </div>
                    </div>
                )}

                {payCycle === "monthly" && (
                    <div className="onboarding-field">
                        <label htmlFor="ob-payday">Payday (day of month)</label>
                        <input
                            id="ob-payday"
                            type="text"
                            inputMode="numeric"
                            placeholder="1"
                            value={payDay}
                            onChange={(e) => {
                                setPayDay(e.target.value);
                                setNextDate(computeNext(payCycle, firstDay, secondDay, e.target.value));
                            }}
                        />
                    </div>
                )}

                <div className="onboarding-field">
                    <label htmlFor="ob-next-date">Next Paycheck Date</label>
                    <input
                        id="ob-next-date"
                        type="date"
                        value={nextDate}
                        onChange={(e) => setNextDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="onboarding-cta-stack">
                <button
                    type="button"
                    className="onboarding-primary-btn"
                    onClick={handleNext}
                >
                    Continue
                </button>
                <button
                    type="button"
                    className="onboarding-skip-btn"
                    onClick={() => { triggerLightHaptic(); onSkip(); }}
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}
