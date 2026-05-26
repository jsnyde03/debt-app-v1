import type { Recurrence } from "../types/recurrence";

export type RequiredExpensePreset = {
    name: string;
    expenseType: "fixed" | "variable";
    recurrence: Recurrence;
};

export const requiredExpensePresets: RequiredExpensePreset[] = [
    {
        name: "Rent / Mortgage",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Electric",
        expenseType: "variable",
        recurrence: "monthly",
    },
    {
        name: "Water / Sewer",
        expenseType: "variable",
        recurrence: "monthly",
    },
    {
        name: "Gas / Heating",
        expenseType: "variable",
        recurrence: "monthly",
    },
    {
        name: "Internet",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Cell Phone",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Insurance",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Car Payment",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Credit Card Payment",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Loan Payment",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Subscription",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Medical Bill",
        expenseType: "variable",
        recurrence: "monthly",
    },
    {
        name: "Childcare",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Pet Insurance",
        expenseType: "fixed",
        recurrence: "monthly",
    },
    {
        name: "Other Bill",
        expenseType: "fixed",
        recurrence: "monthly",
    },
];
