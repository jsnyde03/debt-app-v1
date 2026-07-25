import type { Debt } from "@core/storage/debtPlannerStorage";
import type { Recurrence } from "@core/types/recurrence";
import { normalizeBnplInstallment } from "@core/debt/bnplInstallment";

type DebtType = "debt" | "bnpl";

const allowedTypes: DebtType[] = ["debt", "bnpl"];

const allowedRecurrences: Recurrence[] = ["one-time", "weekly", "biweekly", "per-paycheck", "monthly"];

function parseCsvLine(line: string) {
    const values: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const nextChar = line[index + 1];

        if (char === '"' && nextChar === '"') {
            current += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            insideQuotes = !insideQuotes;
            continue;
        }

        if (char === "," && !insideQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());

    return values;
}

function normalizeHeader(header: string) {
    return header.trim().toLocaleLowerCase();
}

function toNumber(value: string | undefined) {
    if (!value) return undefined;

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed: undefined;
}

function isValidRecurrence(value: string): value is Recurrence {
    return allowedRecurrences.includes(value as Recurrence);
}

function isValidDebtType(value: string): value is DebtType {
    return allowedTypes.includes(value as DebtType);
}

export async function parseDebtCsv(file: File): Promise<{debts: Debt[]; errors: string[];}> {
    const text = await file.text();

    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    if (lines.length < 2) {
        return {
            debts: [],
            errors: ["CSV must include a header row and at least one debt row."],
        };
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader);
    const errors: string[] = [];
    const debts: Debt[] = [];

    lines.slice(1).forEach((line, rowIndex) => {
        const rowNumber = rowIndex + 2;
        const values = parseCsvLine(line);

        const row = headers.reduce<Record<string, string>>((current, header, index) => {
            current[header] = values[index] ?? "";
            return current;
        }, {});

        const name = row.name?.trim();
        const balance = toNumber(row.balance);
        const minimumPayment = toNumber(row.minimumpayment);
        const apr = toNumber(row.apr) ?? 0;
        const dueDate = row.duedate?.trim();
        const type = (row.type?.trim().toLowerCase() || "debt") as DebtType;
        const recurrence = (row.recurrence?.trim().toLowerCase() || "monthly") as Recurrence;
        const remainingPayments = toNumber(row.remainingpayments);
        const scheduledPaymentAmount = toNumber(row.scheduledpaymentamount);

        if (!name) {
            errors.push(`Row ${rowNumber}: name is required.`);
            return;
        }

        if (!balance || balance <= 0) {
            errors.push(`Row ${rowNumber}: balance must be greater than 0`);
            return;
        }

        if (!minimumPayment || minimumPayment <= 0) {
            errors.push(`Row ${rowNumber}: minimumPayment must be greater than 0`);
            return;
        }

        if (!dueDate) {
            errors.push(`Row ${rowNumber}: dueDate is required.`);
            return;
        }

        if (apr < 0 || apr > 100) {
            errors.push(`Row ${rowNumber}: APR must be between 0 and 100`);
            return;
        }

        if (!isValidDebtType(type)) {
            errors.push(`Row ${rowNumber}: type must be debt or bnpl`);
            return;
        }

        if (!isValidRecurrence(recurrence)) {
            errors.push(`Row ${rowNumber}: recurrence must be one-time, weekly, biweekly, per-paycheck, or monthly`);
            return;
        }

        // Installment-native BNPL: reconcile balance + minimum to scheduled × remaining (2.7.2).
        debts.push(normalizeBnplInstallment({
            id: crypto.randomUUID(),
            name,
            balance,
            originalBalance: balance,
            minimumPayment,
            apr,
            dueDate,
            originalDueDate: dueDate,
            type,
            recurrence,
            remainingPayments: type === "bnpl" ? remainingPayments : undefined,
            scheduledPaymentAmount: type === "bnpl" ? scheduledPaymentAmount : undefined,
            minimumPaidThisCycle: false,
            snowballPaidThisCycle: false,
        }));





    });

    return { debts, errors };
}

