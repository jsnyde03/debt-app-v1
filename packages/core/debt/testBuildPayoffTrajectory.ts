import { buildPayoffTrajectory, simulatePayoff } from "./buildPayoffTrajectory";

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
        const points = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12, debts: [], monthlyExtraPayment: 0, strategy: "snowball" });
        assertEqual(points.length, 1, "empty debts → one point");
        assertEqual(points[0].month, 0, "empty debts → month 0");
        assertEqual(points[0].balance, 0, "empty debts → balance 0");
    }

    // Zero-balance debts are filtered out → same as empty.
    {
        const points = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12,
            debts: [{ balance: 0, minimumPayment: 50, apr: 20 }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(points[0].balance, 0, "all-paid debts → balance 0");
    }

    // The first point is the summed starting balance.
    {
        const points = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12,
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
        const points = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12,
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
        const noExtra = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12, debts: base, monthlyExtraPayment: 0, strategy: "snowball" });
        const withExtra = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12, debts: base, monthlyExtraPayment: 100, strategy: "snowball" });
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
        const snow = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 200, strategy: "snowball" });
        const aval = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 200, strategy: "avalanche" });
        assertTrue(
            JSON.stringify(snow) !== JSON.stringify(aval),
            "snowball and avalanche trajectories differ"
        );
    }

    // Negative amortization: interest outruns the payment, so the trajectory
    // breaks early and never reaches 0 (rather than looping the full 120 months).
    {
        const points = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12,
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
        const points = buildPayoffTrajectory({ cyclesPerMonth: 26 / 12,
            debts: [{ balance: 100, minimumPayment: 40, apr: 99, type: "bnpl" }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(points[points.length - 1].balance, 0, "BNPL apr is forced to 0 → debt pays off");
    }

    console.log("✅ buildPayoffTrajectory regression tests passed.");
}

// 3.4.1.4 — per-debt clear-months (the trajectory waypoints). The pool already pays debts off one at a
// time; these confirm `simulatePayoff` records WHEN each hits zero, carries id/name, and orders by strategy.
function runSimulatePayoffTests() {
    // Two 0% debts, snowball: the smaller balance clears first, both are recorded with their names, and
    // the LAST clear month equals the total debt-free month (the endpoint).
    {
        const { points, clears } = simulatePayoff({ cyclesPerMonth: 26 / 12,
            debts: [
                { id: "a", name: "Small", balance: 200, minimumPayment: 40, apr: 0 },
                { id: "b", name: "Big", balance: 1000, minimumPayment: 40, apr: 0 },
            ],
            monthlyExtraPayment: 100,
            strategy: "snowball",
        });
        assertEqual(clears.length, 2, "both debts recorded a clear month");
        const small = clears.find((c) => c.id === "a");
        const big = clears.find((c) => c.id === "b");
        assertTrue(!!small && !!big, "clears carry id");
        assertEqual(small!.name, "Small", "clears carry name");
        assertTrue(small!.month < big!.month, "snowball clears the smaller balance first");
        assertEqual(Math.max(small!.month, big!.month), points[points.length - 1].month, "the last clear is the debt-free month");
    }

    // Strategy orders the clears: snowball clears the smaller balance first, avalanche the higher APR.
    {
        const debts = [
            { id: "lo", name: "LoAPR", balance: 300, minimumPayment: 20, apr: 3 },
            { id: "hi", name: "HiAPR", balance: 900, minimumPayment: 20, apr: 30 },
        ];
        const snow = simulatePayoff({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 300, strategy: "snowball" });
        const aval = simulatePayoff({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 300, strategy: "avalanche" });
        const snowFirst = [...snow.clears].sort((a, b) => a.month - b.month)[0].id;
        const avalFirst = [...aval.clears].sort((a, b) => a.month - b.month)[0].id;
        assertEqual(snowFirst, "lo", "snowball clears the smaller-balance debt first");
        assertEqual(avalFirst, "hi", "avalanche clears the higher-APR debt first");
    }

    // A debt that never clears (negative amortization) records no waypoint.
    {
        const { clears } = simulatePayoff({ cyclesPerMonth: 26 / 12,
            debts: [{ id: "x", name: "Sink", balance: 10000, minimumPayment: 10, apr: 30 }],
            monthlyExtraPayment: 0,
            strategy: "snowball",
        });
        assertEqual(clears.length, 0, "a debt that never clears has no waypoint");
    }

    // The points-only wrapper is exactly `simulatePayoff().points` — existing callers are unaffected.
    {
        const args = { debts: [{ id: "a", balance: 500, minimumPayment: 30, apr: 0 }], monthlyExtraPayment: 50, strategy: "snowball" as const, cyclesPerMonth: 26 / 12 };
        assertEqual(
            JSON.stringify(buildPayoffTrajectory(args)),
            JSON.stringify(simulatePayoff(args).points),
            "buildPayoffTrajectory === simulatePayoff().points",
        );
    }

    console.log("✅ simulatePayoff (per-debt clears) regression tests passed.");
}

runBuildPayoffTrajectoryTests();
runSimulatePayoffTests();
