import { buildPayoffTrajectory } from "./buildPayoffTrajectory";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function assertTrue(condition: boolean, label: string) {
    if (!condition) throw new Error(`${label} failed.`);
}

type TDebt = { balance: number; minimumPayment: number; apr: number; type?: string };

function runBuildPayoffTrajectoryTests() {
    // No debts → a single zero point (the chart still renders a flat line).
    {
        const points = buildPayoffTrajectory({ debts: [], monthlyExtraPayment: 0, strategy: "snowball" });
        assertEqual(points.length, 1, "empty debts → one point");
        assertEqual(points[0].month, 0, "empty debts → month 0");
        assertEqual(points[0].balance, 0, "empty debts → balance 0");
    }

    // Zero-balance debts are filtered out → same as empty.
    {
        const points = buildPayoffTrajectory({
            debts: [{ balance: 0, minimumPayment: 50, apr: 20 }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(points[0].balance, 0, "all-paid debts → balance 0");
    }

    // The first point is the summed starting balance.
    {
        const points = buildPayoffTrajectory({
            debts: [
                { balance: 500, minimumPayment: 20, apr: 0 },
                { balance: 1000, minimumPayment: 20, apr: 0 },
            ],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(points[0].balance, 1500, "point 0 is the total starting balance");
    }

    // Payable (0% APR) debt reaches exactly 0, and the trajectory is monotonic
    // non-increasing (a payoff chart must never rise).
    {
        const points = buildPayoffTrajectory({
            debts: [{ balance: 100, minimumPayment: 40, apr: 0 }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(points[points.length - 1].balance, 0, "payable debt reaches 0");
        for (let i = 1; i < points.length; i++) {
            assertTrue(points[i].balance <= points[i - 1].balance, `month ${i} does not rise`);
        }
    }

    // An extra payment pays the same debt off faster (fewer points).
    {
        const base: TDebt[] = [{ balance: 100, minimumPayment: 40, apr: 0 }];
        const noExtra = buildPayoffTrajectory({ debts: base, monthlyExtraPayment: 0, strategy: "snowball" });
        const withExtra = buildPayoffTrajectory({ debts: base, monthlyExtraPayment: 100, strategy: "snowball" });
        assertTrue(withExtra.length < noExtra.length, "extra payment shortens the payoff");
        assertEqual(withExtra[withExtra.length - 1].balance, 0, "extra payment still reaches 0");
    }

    // Snowball vs avalanche allocate the extra to different debts, so their
    // total-balance trajectories diverge (confirms the strategy branch is live).
    {
        const debts: TDebt[] = [
            { balance: 500, minimumPayment: 20, apr: 5 }, // snowball target (smallest balance)
            { balance: 1000, minimumPayment: 20, apr: 25 }, // avalanche target (highest APR)
        ];
        const snow = buildPayoffTrajectory({ debts, monthlyExtraPayment: 200, strategy: "snowball" });
        const aval = buildPayoffTrajectory({ debts, monthlyExtraPayment: 200, strategy: "avalanche" });
        assertTrue(
            JSON.stringify(snow) !== JSON.stringify(aval),
            "snowball and avalanche trajectories differ"
        );
    }

    // Negative amortization: interest outruns the payment, so the trajectory
    // breaks early and never reaches 0 (rather than looping the full 120 months).
    {
        const points = buildPayoffTrajectory({
            debts: [{ balance: 10000, minimumPayment: 10, apr: 30 }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertTrue(points[points.length - 1].balance > 0, "neg-amortization never reaches 0");
        assertTrue(points.length < 121, "neg-amortization breaks early, not the full horizon");
    }

    // BNPL debts are treated as 0% APR regardless of their stored apr — so a BNPL
    // that would otherwise negatively amortize instead pays off.
    {
        const points = buildPayoffTrajectory({
            debts: [{ balance: 100, minimumPayment: 40, apr: 99, type: "bnpl" }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(points[points.length - 1].balance, 0, "BNPL apr is forced to 0 → debt pays off");
    }

    console.log("✅ buildPayoffTrajectory regression tests passed.");
}

runBuildPayoffTrajectoryTests();
