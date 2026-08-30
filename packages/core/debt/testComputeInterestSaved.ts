import { computeInterestSaved } from "./computeInterestSaved";
import { projectDebtPayoff } from "./projectDebtPayoff";
import { roundMoney } from "@core/utils/money";
import type { Debt } from "@core/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
    }
}
function assert(cond: boolean, label: string) {
    if (!cond) throw new Error(`${label} failed.`);
}

function debt(over: Partial<Debt> & { id: string }): Debt {
    return {
        name: "Debt", balance: 5000, minimumPayment: 100, dueDate: "2026-01-05",
        apr: 20, type: "debt", recurrence: "monthly", ...over,
    };
}

const START = "2026-01-01";

function run() {
    // ── both payable → reconciles with projectDebtPayoff (min-vs-current) ──
    {
        const debts = [debt({ id: "d1", balance: 5000, minimumPayment: 100, apr: 20 })];
        const extra = 200;
        const result = computeInterestSaved({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: extra, strategy: "snowball", startDate: START });

        const minPlan = projectDebtPayoff({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 0, strategy: "snowball", startDate: START });
        const actualPlan = projectDebtPayoff({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: extra, strategy: "snowball", startDate: START });

        assertEqual(result.kind, "saving", "both payable → kind saving");
        if (result.kind === "saving") {
            assertEqual(
                result.interestSaved,
                roundMoney(minPlan.totalInterestPaid - actualPlan.totalInterestPaid),
                "interestSaved reconciles with projectDebtPayoff min-minus-current"
            );
            assertEqual(
                result.monthsSaved,
                minPlan.monthsToDebtFree - actualPlan.monthsToDebtFree,
                "monthsSaved reconciles with projectDebtPayoff"
            );
            assert(result.interestSaved > 0, "paying extra saves interest");
            assert(result.monthsSaved > 0, "paying extra saves months");
        }
    }

    // ── no extra → nothing to claim ──
    assertEqual(
        computeInterestSaved({ cyclesPerMonth: 26 / 12, debts: [debt({ id: "d1" })], monthlyExtraPayment: 0, strategy: "snowball", startDate: START }).kind,
        "none",
        "no extra → none"
    );

    // ── no live debts → none ──
    assertEqual(
        computeInterestSaved({ cyclesPerMonth: 26 / 12, debts: [debt({ id: "d1", balance: 0 })], monthlyExtraPayment: 200, strategy: "snowball", startDate: START }).kind,
        "none",
        "no live debts → none"
    );

    // ── minimum ALONE never clears it (min == monthly interest), but the plan does
    //    → the "payoff-enabling" killer message ──
    {
        // 10000 @ 30% APR → monthly interest = 10000 * 0.30/12 = 250. A $250 minimum
        // exactly covers interest → balance never falls → unpayable. +$500 extra clears it.
        const debts = [debt({ id: "d1", balance: 10000, apr: 30, minimumPayment: 250 })];
        const minPlan = projectDebtPayoff({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 0, strategy: "snowball", startDate: START });
        assertEqual(minPlan.estimatedDebtFreeDate, "Unable to estimate", "sanity: minimums alone are unpayable here");

        const result = computeInterestSaved({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 500, strategy: "snowball", startDate: START });
        assertEqual(result.kind, "payoff-enabling", "unpayable minimums + payable plan → payoff-enabling");
        if (result.kind === "payoff-enabling") {
            assert(result.debtFreeDate !== "Unable to estimate", "payoff-enabling carries a real debt-free date");
        }
    }

    // ── even with the extra it can't be paid off → none (no false claim) ──
    {
        const debts = [debt({ id: "d1", balance: 10000, apr: 30, minimumPayment: 100 })];
        const result = computeInterestSaved({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 100, strategy: "snowball", startDate: START });
        assertEqual(result.kind, "none", "plan still unpayable → none");
    }

    console.log("✅ computeInterestSaved regression tests passed.");
}

run();
