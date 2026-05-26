import type { LivingExpense } from "../types/livingExpense";

export const livingExpensePresets: Omit<LivingExpense, "id">[] = [
    {
        name: "Groceries",
        amount: 256,
        enabled: true,
    },
    {
        name: "Gas / Transportation",
        amount: 120,
        enabled: true,
    },
    {
        name: "Dining / Takeout",
        amount: 80,
        enabled: false,
    },
    {
        name: "Household",
        amount: 60,
        enabled: false,
    },
    {
        name: "Pets",
        amount: 40,
        enabled: false,
    },
    {
        name: "Childcare",
        amount: 200,
        enabled: false,

    },
    {
        name: "Misc Spending",
        amount: 100,
        enabled: false,
    },
];