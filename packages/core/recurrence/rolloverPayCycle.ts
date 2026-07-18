import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

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

function dayOfMonth(date: string) {
    return toDate(date).getDate();
}

// Advance a date by whole months, clamping the day to the target month's last
// day (Jan 31 + 1mo -> Feb 28, NOT Mar 3 via setMonth's overflow). `anchorDay`
// is the intended day-of-month (from the ORIGINAL due date); clamping against
// it instead of the running date prevents permanent drift once a date passes
// through a short month (Feb 28 -> Mar 31, not Mar 28).
function addMonths(date: string, months: number, anchorDay?: number) {
    const current = toDate(date);
    const day = anchorDay ?? current.getDate();
    // First of the target month (new Date normalizes month overflow into years).
    const target = new Date(current.getFullYear(), current.getMonth() + months, 1);
    const lastDayOfTarget = new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0
    ).getDate();
    target.setDate(Math.min(day, lastDayOfTarget));

    return toDateString(target);
}

function advanceDueDateOnce(
    date: string,
    recurrence: RequiredExpense["recurrence"],
    anchorDay?: number
) {
    switch (recurrence) {
        case "weekly":
            return addDays(date, 7);
        case "biweekly":
            return addDays(date, 14);
        case "monthly":
            return addMonths(date, 1, anchorDay);
        case "quarterly":
            return addMonths(date, 3, anchorDay);
        case "annually":
            return addMonths(date, 12, anchorDay);
        case "per-paycheck":
        case "one-time":
        default:
            return date;
    }
}

function advanceDueDateToPlanDate(
    dueDate: string,
    recurrence: RequiredExpense["recurrence"],
    nextPlanDate: string,
    originalDueDate?: string
) {
    if (recurrence === "one-time") {
        return dueDate;
    }

    if (recurrence === "per-paycheck") {
        return nextPlanDate;
    }

    // Anchor month advancement to the original day-of-month so a 31st bill that
    // passes through February returns to the 31st rather than sticking on the 28th.
    const anchorDay = dayOfMonth(originalDueDate ?? dueDate);
    let nextDueDate = dueDate;
    let safety = 0;

    while (toDate(nextDueDate) < toDate(nextPlanDate) && safety < 60) {
        nextDueDate = advanceDueDateOnce(nextDueDate, recurrence, anchorDay);
        safety += 1;
    }

    return nextDueDate;
}

export function rolloverRequiredExpenses(expenses: RequiredExpense[], nextPlanDate: string) {
    return expenses.flatMap((expense) => {
        // Unpaid obligations carry into the new cycle unchanged (still owed).
        if (!expense.isPaidThisCycle) {
            return [{ ...expense, isPaidThisCycle: false }];
        }

        // A PAID one-time expense is done - drop it. Previously it was reset to
        // unpaid with its original (now past) due date, so next cycle it
        // reappeared as an overdue required expense and re-consumed the budget
        // every cycle forever. The projection timeline already drops it.
        if (expense.recurrence === "one-time") {
            return [];
        }

        // Recurring: advance to the next occurrence and reset for the new cycle.
        return [
            {
                ...expense,
                dueDate: advanceDueDateToPlanDate(expense.dueDate, expense.recurrence, nextPlanDate, expense.originalDueDate),
                isPaidThisCycle: false,
            },
        ];
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
            dueDate: advanceDueDateToPlanDate(debt.dueDate, debt.recurrence, nextPlanDate, debt.originalDueDate),
            isPaidThisCycle: false,
            minimumPaidThisCycle: false,
            snowballPaidThisCycle: false,
        };
    });
}