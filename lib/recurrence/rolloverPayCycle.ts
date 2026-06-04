import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

function toDate(date: string) {
    return new Date(`${date}T00:00:00`);
}

function toDateString(date: Date) {
    return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
    const next = toDate(date);
    next.setDate(next.getDate() + days);

    return toDateString(next);
}

function addMonths(date: string, months: number) {
    const current = toDate(date);
    const next = new Date(current);

    next.setMonth(next.getMonth() + months);

    return toDateString(next);
}

function advanceDueDateOnce(date: string, recurrence: RequiredExpense["recurrence"]) {
    switch (recurrence) {
        case "weekly":
            return addDays(date, 7);
        case "biweekly":
            return addDays(date, 14);
        case "monthly":
            return addMonths(date, 1);
        case "quarterly":
            return addMonths(date, 3);
        case "annually":
            return addMonths(date, 12);
        case "per-paycheck":
        case "one-time":
        default:
            return date;
    }
}

function advanceDueDateToPlanDate(dueDate: string, recurrence: RequiredExpense["recurrence"], nextPlanDate: string) {
    if (recurrence === "one-time") {
        return dueDate;
    }

    if (recurrence === "per-paycheck") {
        return nextPlanDate;
    }

    let nextDueDate = dueDate;
    let safety = 0;

    while (toDate(nextDueDate) < toDate(nextPlanDate) && safety < 60) {
        nextDueDate = advanceDueDateOnce(nextDueDate, recurrence);
        safety += 1;
    }

    return nextDueDate;
}

export function rolloverRequiredExpenses(expenses: RequiredExpense[], nextPlanDate: string) {
    return expenses.map((expense) => {
        if (!expense.isPaidThisCycle) {
            return {
                ...expense,
                isPaidThisCycle: false,
            };
        }

        if (expense.recurrence === "one-time") {
            return {
                ...expense,
                isPaidThisCycle: false,
            };
        }
        
        return {
            ...expense, 
            dueDate: advanceDueDateToPlanDate(expense.dueDate, expense.recurrence, nextPlanDate),
            isPaidThisCycle: false,
        };
    });
}

export function rolloverDebts(debts: Debt[], nextPlanDate: string) {
    return debts.map((debt) => {
        const minimumWasPaid = debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

        if (!minimumWasPaid) {
            return {
                ...debt,
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            };
        }

        if (debt.recurrence === "one-time") {
            return {
                ...debt,
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            };
        }

        return {
            ...debt,
            dueDate: advanceDueDateToPlanDate(debt.dueDate, debt.recurrence, nextPlanDate),
            isPaidThisCycle: false,
            minimumPaidThisCycle: false,
            snowballPaidThisCycle: false,
        };
    });
}