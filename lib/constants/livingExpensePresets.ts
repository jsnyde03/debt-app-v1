import type { LivingExpense } from "../types/livingExpense";

export const livingExpensePresets: Omit<LivingExpense, "id">[] = [
    {
        name: "Groceries",
        amount: 0,
        enabled: false,
    },
    {
        name: "Gas / Transportation",
        amount: 0,
        enabled: false,
    },
    {
        name: "Dining / Takeout",
        amount: 0,
        enabled: false,
    },
    {
        name: "Household",
        amount: 0,
        enabled: false,
    },
    {
        name: "Pets",
        amount: 0,
        enabled: false,
    },
    {
        name: "Childcare",
        amount: 0,
        enabled: false,

    },
    {
        name: "Misc Spending",
        amount: 0,
        enabled: false,
    },
];