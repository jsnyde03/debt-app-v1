import { useState } from "react";
import { usePersistedState } from "@/lib/storage/usePersistedState";
import { triggerErrorHaptic } from "@/lib/mobile/haptics";

export type Goal = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    originalCurrentAmount?: number;
    type: "emergency" | "savings";
};

export function useGoals() {
    const [goals, setGoals] = usePersistedState<Goal[]>("debtPlanner.goals", []);

    const [goalName, setGoalName] = useState("Starter Emergency Fund");
    const [goalTargetAmount, setGoalTargetAmount] = useState("1000");
    const [goalCurrentAmount, setGoalCurrentAmount] = useState("");
    const [goalType, setGoalType] = useState<"emergency" | "savings">(
        "emergency"
    );

    const [goalErrors, setGoalErrors] = useState<{
        name?: string;
        targetAmount?: string;
    }>({});

    function handleAddGoal() {
        const targetAmount = Number(goalTargetAmount);
        const currentAmount = Number(goalCurrentAmount || 0);
        const trimmedName = goalName.trim();

        const nextErrors: typeof goalErrors = {};

        if (!trimmedName) nextErrors.name = "Goal name is required.";

        if (!targetAmount || targetAmount <= 0) {
            nextErrors.targetAmount = "Target amount must be greater than 0.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setGoalErrors(nextErrors);
            void triggerErrorHaptic();
            return;
        }

        setGoalErrors({});

        setGoals((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                name: trimmedName,
                targetAmount,
                currentAmount,
                originalCurrentAmount: currentAmount,
                type: goalType,
            },
        ]);

        setGoalName("");
        setGoalTargetAmount("");
        setGoalCurrentAmount("");
        setGoalType("savings");
    }

    function handleUpdateGoal(
        id: string,
        updates: Partial<Pick<Goal, "targetAmount" | "currentAmount">>
    ) {
        setGoals((current) =>
            current.map((goal) =>
                goal.id === id ? { ...goal, ...updates } : goal
            )
        );
    }

    function handleRemoveGoal(id: string) {
        setGoals((current) => current.filter((goal) => goal.id !== id));
    }

    return {
        goals,
        setGoals,
        goalName,
        setGoalName,
        goalTargetAmount,
        setGoalTargetAmount,
        goalCurrentAmount,
        setGoalCurrentAmount,
        goalType,
        setGoalType,
        goalErrors,
        handleAddGoal,
        handleUpdateGoal,
        handleRemoveGoal,
    };
}
