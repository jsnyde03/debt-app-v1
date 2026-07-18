import { useState } from "react";
import { readKeyValue, writeKey } from "@/lib/storage/safeStorage";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

type EntryType = "debt" | "expense";

type FirstDebtOrBillStepProps = {
    onNext: () => void;
    onSkip: () => void;
};

function nextMonthDueDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
}

export function FirstDebtOrBillStep({ onNext, onSkip }: FirstDebtOrBillStepProps) {
    const [type, setType] = useState<EntryType>("debt");
    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [minimumPayment, setMinimumPayment] = useState("");
    const [apr, setApr] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    function handleAdd() {
        if (!name.trim()) {
            setError("Enter a name.");
            return;
        }
        if (type === "debt") {
            if (!balance || Number(balance) <= 0) { setError("Enter the current balance."); return; }
            if (!minimumPayment || Number(minimumPayment) <= 0) { setError("Enter the minimum payment."); return; }
        } else {
            if (!amount || Number(amount) <= 0) { setError("Enter the amount."); return; }
        }
        setError("");

        if (type === "debt") {
            const existing = readKeyValue<Debt[]>("debtPlanner.debts", []);
            const newDebt: Debt = {
                id: `debt-${Date.now()}`,
                name: name.trim(),
                balance: Number(balance),
                minimumPayment: Number(minimumPayment),
                apr: Number(apr) || 0,
                dueDate: nextMonthDueDate(),
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                isAutopay: false,
            };
            writeKey("debtPlanner.debts", [...existing, newDebt]);
        } else {
            const existing = readKeyValue<RequiredExpense[]>("debtPlanner.requiredExpenses", []);
            const newExpense: RequiredExpense = {
                id: `expense-${Date.now()}`,
                name: name.trim(),
                amount: Number(amount),
                dueDate: nextMonthDueDate(),
                recurrence: "monthly",
                isPaidThisCycle: false,
                isAutopay: false,
                category: "other",
            };
            writeKey("debtPlanner.requiredExpenses", [...existing, newExpense]);
        }

        triggerLightHaptic();
        onNext();
    }

    return (
        <div className="onboarding-scroll">
            <div className="onboarding-progress">
                <span className="onboarding-dot" />
                <span className="onboarding-dot" />
                <span className="onboarding-dot active" />
                <span className="onboarding-dot" />
            </div>

            <div className="onboarding-copy">
                <h2 className="onboarding-title">Add your first<br />debt or bill</h2>
                <p className="onboarding-subtitle">
                    See your plan come to life right away. You can add more any time.
                </p>
            </div>

            <div className="onboarding-fields">
                <div className="onboarding-type-toggle">
                    <button
                        type="button"
                        className={`onboarding-type-btn${type === "debt" ? " selected" : ""}`}
                        onClick={() => { setType("debt"); setError(""); }}
                    >
                        💳 Debt
                    </button>
                    <button
                        type="button"
                        className={`onboarding-type-btn${type === "expense" ? " selected" : ""}`}
                        onClick={() => { setType("expense"); setError(""); }}
                    >
                        🧾 Bill
                    </button>
                </div>

                <div className="onboarding-field">
                    <label htmlFor="ob-entry-name">{type === "debt" ? "Debt name" : "Bill name"}</label>
                    <input
                        id="ob-entry-name"
                        type="text"
                        placeholder={type === "debt" ? "e.g. Visa Card" : "e.g. Rent"}
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                    />
                </div>

                {type === "debt" ? (
                    <>
                        <div className="onboarding-field">
                            <label htmlFor="ob-balance">Current balance</label>
                            <input
                                id="ob-balance"
                                type="text"
                                inputMode="decimal"
                                placeholder="e.g. 2400"
                                value={balance}
                                onChange={(e) => { setBalance(e.target.value); setError(""); }}
                            />
                        </div>
                        <div className="onboarding-day-pair">
                            <div className="onboarding-field">
                                <label htmlFor="ob-min">Minimum payment</label>
                                <input
                                    id="ob-min"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="e.g. 35"
                                    value={minimumPayment}
                                    onChange={(e) => { setMinimumPayment(e.target.value); setError(""); }}
                                />
                            </div>
                            <div className="onboarding-field">
                                <label htmlFor="ob-apr">APR % (optional)</label>
                                <input
                                    id="ob-apr"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="e.g. 22.99"
                                    value={apr}
                                    onChange={(e) => setApr(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="onboarding-field">
                        <label htmlFor="ob-bill-amount">Amount</label>
                        <input
                            id="ob-bill-amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g. 1200"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError(""); }}
                        />
                    </div>
                )}

                {error && <p style={{ color: "var(--danger-color)", fontSize: "0.82rem", margin: "0" }}>{error}</p>}
            </div>

            <div className="onboarding-cta-stack">
                <button
                    type="button"
                    className="onboarding-primary-btn"
                    onClick={handleAdd}
                >
                    Add &amp; Continue
                </button>
                <button
                    type="button"
                    className="onboarding-skip-btn"
                    onClick={() => { triggerLightHaptic(); onSkip(); }}
                >
                    Skip, I&apos;ll add later
                </button>
            </div>
        </div>
    );
}
