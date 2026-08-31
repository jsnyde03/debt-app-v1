import { useState, type ChangeEvent } from "react";
import { usePersistedState } from "@/lib/storage/usePersistedState";
import type { Debt } from "@core/storage/debtPlannerStorage";
import type { Recurrence } from "@core/types/recurrence";
import { triggerErrorHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { parseDebtCsvText } from "@core/imports/debtCsv";

export function useDebts(saveResetSnapshot: (overrides?: { debts?: Debt[] }) => void) {
    const [debts, setDebts] = usePersistedState<Debt[]>("debtPlanner.debts", []);

    const [debtName, setDebtName] = useState("");
    const [debtBalance, setDebtBalance] = useState("");
    const [debtMinimumPayment, setDebtMinimumPayment] = useState("");
    const [debtDueDate, setDebtDueDate] = useState("");
    const [debtApr, setDebtApr] = useState("");
    const [debtType, setDebtType] = useState<"debt" | "bnpl">("debt");
    const [debtRecurrence, setDebtRecurrence] =
        useState<Recurrence>("monthly");

    const [debtIsAutopay, setDebtIsAutopay] = useState(false);

    const [debtRemainingPayments, setDebtRemainingPayments] = useState("");
    const [debtScheduledPaymentAmount, setDebtScheduledPaymentAmount] =
        useState("");

    const [debtErrors, setDebtErrors] = useState<{
        name?: string;
        balance?: string;
        minimumPayment?: string;
        dueDate?: string;
        apr?: string;
    }>({});

    const [debtWarnings, setDebtWarnings] = useState<{
        minimumPayment?: string;
    }>({});

    function handleAddDebt() {
        const balance = Number(debtBalance);
        const minimumPayment = Number(debtMinimumPayment);
        const apr = Number(debtApr || 0);
        const trimmedName = debtName.trim();

        const nextErrors: typeof debtErrors = {};
        const nextWarnings: typeof debtWarnings = {};

        if (!trimmedName) nextErrors.name = "Debt name is required.";
        if (!balance || balance <= 0) {
            nextErrors.balance = "Balance must be greater than zero.";
        }

        if (!minimumPayment || minimumPayment <= 0) {
            nextErrors.minimumPayment =
                "Minimum payment must be greater than zero.";
        }

        if (balance > 0 && minimumPayment > balance) {
            nextErrors.minimumPayment = "Minimum payment must not exceed balance.";
        }

        if (!debtDueDate) nextErrors.dueDate = "Due date is required.";

        if (!Number.isFinite(apr) || apr < 0 || apr > 100) {
            nextErrors.apr = "APR must be between 0 and 100.";
        }

        const estimatedMonthlyInterest = (balance * (apr / 100)) / 12;

        if (apr > 0 && minimumPayment <= estimatedMonthlyInterest) {
            nextWarnings.minimumPayment =
                "Minimum payment may not cover monthly interest. Balance may increase unless extra is paid.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setDebtErrors(nextErrors);
            setDebtWarnings(nextWarnings);
            // Both halves of the conflict were live: the haptic is imported here, and the
            // success path below ends `return true`, so the error path owes a `false`.
            void triggerErrorHaptic();
            return false;
        }

        setDebtErrors({});
        setDebtWarnings(nextWarnings);

        setDebts((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                name: trimmedName,
                balance,
                originalBalance: balance,
                minimumPayment,
                dueDate: debtDueDate,
                originalDueDate: debtDueDate,
                apr,
                type: debtType,
                recurrence: debtRecurrence,
                remainingPayments:
                    debtType === "bnpl" && debtRemainingPayments
                        ? Number(debtRemainingPayments)
                        : undefined,
                scheduledPaymentAmount:
                    debtType === "bnpl" && debtScheduledPaymentAmount
                        ? Number(debtScheduledPaymentAmount)
                        : undefined,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
                isAutopay: debtIsAutopay,
            },
        ]);

        setDebtName("");
        setDebtBalance("");
        setDebtMinimumPayment("");
        setDebtDueDate("");
        setDebtApr("");
        setDebtType("debt");
        setDebtRecurrence("monthly");
        setDebtRemainingPayments("");
        setDebtScheduledPaymentAmount("");
        setDebtIsAutopay(false);

        return true;
    }

    function handleUpdateDebt(
        id: string,
        updates: Partial<
            Pick<Debt, "balance" | "minimumPayment" | "dueDate" | "apr" | "isAutopay" | "recurrence">
        >
    ) {
        setDebts((current) =>
            current.map((debt) =>
                debt.id === id ? { ...debt, ...updates } : debt
            )
        );
    }

    function handleRemoveDebt(id: string) {
        setDebts((current) => current.filter((debt) => debt.id !== id));
    }

    function restoreDebt(debt: Debt) {
        setDebts((current) => [...current, debt]);
    }

    function handleMarkDebtMinimumPaid(id: string) {
        setDebts((current) => {
            const nextDebts = current.map((debt) => {
                const currentlyPaid =
                    debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

                return debt.id === id
                    ? {
                        ...debt,
                        minimumPaidThisCycle: !currentlyPaid,
                        isPaidThisCycle: !currentlyPaid,
                        // Confirming the minimum resolves any reported autopay
                        // failure so it doesn't re-fail next cycle (mirrors
                        // bulkMarkRequiredPaid). No-op for manual debts.
                        autopayFailedThisCycle: false,
                    }
                    : debt;
            });

            saveResetSnapshot({ debts: nextDebts });

            return nextDebts;
        });
    }

    function handleMarkDebtSnowballPaid(id: string) {
        setDebts((current) =>
            current.map((debt) =>
                debt.id === id
                    ? {
                        ...debt,
                        snowballPaidThisCycle: !debt.snowballPaidThisCycle,
                    }
                    : debt
            )
        );
    }

    async function handleImportCsv(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            // Reading the bytes is this tree's job (a browser `File`); turning them into debts is the
            // shared parser's. Ids stay UUIDs here because that is what this surface has always
            // persisted — the RN app derives its own instead, which is why the parser takes a minter.
            const importResult = parseDebtCsvText(await file.text(), {
                makeId: () => crypto.randomUUID(),
            });

            if (importResult.debts.length > 0) {
                setDebts((current) => [...current, ...importResult.debts]);
            }

            if (importResult.errors.length > 0) {
                alert(
                    `Imported ${importResult.debts.length} debts with ${importResult.errors.length
                    } skipped rows.\n\n${importResult.errors
                        .slice(0, 5)
                        .join("\n")}`
                );
            } else {
                void triggerMediumHaptic();
                alert(`Imported ${importResult.debts.length} debts.`);
            }
        } catch {
            alert("Unable to import debt CSV.");
        }

        event.target.value = "";
    }

    return {
        debts,
        setDebts,
        debtName,
        setDebtName,
        debtBalance,
        setDebtBalance,
        debtMinimumPayment,
        setDebtMinimumPayment,
        debtDueDate,
        setDebtDueDate,
        debtApr,
        setDebtApr,
        debtType,
        setDebtType,
        debtRecurrence,
        setDebtRecurrence,
        debtIsAutopay,
        setDebtIsAutopay,
        debtRemainingPayments,
        setDebtRemainingPayments,
        debtScheduledPaymentAmount,
        setDebtScheduledPaymentAmount,
        debtErrors,
        debtWarnings,
        handleAddDebt,
        handleUpdateDebt,
        handleRemoveDebt,
        restoreDebt,
        handleMarkDebtMinimumPaid,
        handleMarkDebtSnowballPaid,
        handleImportCsv,
    };
}
