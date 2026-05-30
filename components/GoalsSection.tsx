import type { Goal } from "@/lib/storage/debtPlannerStorage";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type GoalsSectionProps = {
    goals: Goal[];
    goalName: string;
    goalTargetAmount: string;
    goalCurrentAmount: string;
    goalType: "emergency" | "savings";
    goalErrors: {
        name?: string;
        targetAmount?: string;
    };
    onGoalNameChange: (value: string) => void;
    onGoalTargetAmountChange: (value: string) => void;
    onGoalCurrentAmountChange: (value: string) => void;
    onGoalTypeChange: (value: "emergency" | "savings") => void;
    onAddGoal: () => void;
    onRemoveGoal: (id: string) => void;
    onUpdateGoal: (
        id: string,
        updates: Partial<Pick<Goal, "targetAmount" | "currentAmount">>) => void;
};

export function GoalsSection({
    goals,
    goalName,
    goalTargetAmount,
    goalCurrentAmount,
    goalType,
    goalErrors,
    onGoalNameChange,
    onGoalTargetAmountChange,
    onGoalCurrentAmountChange,
    onGoalTypeChange,
    onAddGoal,
    onRemoveGoal,
    onUpdateGoal,
}: GoalsSectionProps) {
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editTargetAmount, setEditTargetAmount] = useState("");
    const [editCurrentAmount, setEditCurrentAmount] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddGoalForm, setShowAddGoalForm] = useState(false);
    const [goalPage, setGoalPage] = useState(1);

    const filteredGoals = goals.filter((goal) => goal.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filteredGoals.length / pageSize));
    const visibleGoals = filteredGoals.slice((goalPage - 1) * pageSize, goalPage * pageSize);

    function startEditing(goal: Goal) {
        setEditingGoalId(goal.id);
        setEditTargetAmount(String(goal.targetAmount));
        setEditCurrentAmount(String(goal.currentAmount));
    }

    function cancelEditing() {
        setEditingGoalId(null);
        setEditTargetAmount("");
        setEditCurrentAmount("");
    }

    function saveEditing(id: string) {
        const targetAmount = Number(editTargetAmount);
        const currentAmount = Number(editCurrentAmount || 0);

        if (!targetAmount || targetAmount < 0 || currentAmount < 0 || currentAmount > targetAmount) {
            return;
        }

        onUpdateGoal(id, {
            targetAmount,
            currentAmount,
        });

        cancelEditing();
    }

    function handleAddGoal() {
        onAddGoal();
        setShowAddGoalForm(false);
    }

    function renderGoal(goal: Goal) {
        const isEditing = editingGoalId === goal.id;
        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
        const progressPercent = goal.targetAmount > 0 ? Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100)) : 0;

        if (isEditing) {
            return (
                <div key={goal.id} className="saved-item debt-edit-card compact-debt-edit-card">
                    <div className="saved-title">{goal.name}</div>

                    <div className="compact-debt-edit-grid">
                        <div className="field">
                            <label>Target</label>

                            <input
                                type="number"
                                value={editTargetAmount}
                                onChange={(event) => setEditTargetAmount(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Saved</label>

                            <input
                                type="number"
                                value={editCurrentAmount}
                                onChange={(event) => setEditCurrentAmount(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="debt-edit-actions">
                        <button
                            type="button"
                            className="text-action-button danger-action"
                            onClick={() => {
                                onRemoveGoal(goal.id);
                                cancelEditing();
                            }}
                        >
                            Remove
                        </button>

                        <div className="debt-edit-actions-right">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={cancelEditing}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="add-button debt-save-button"
                                onClick={() => saveEditing(goal.id)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <button key={goal.id} type="button" className="saved-item saved-item-button goal-list-item" onClick={() => startEditing(goal)}>
                <div className="saved-item-left goal-card-content">
                    <div className="saved-title">{goal.name}</div>

                    <div className="saved-meta">
                        {goal.type === "emergency" ? "Emergency Fund" : "Savings"} ·
                        Saved {formatCurrency(goal.currentAmount)} of{" "}
                        {formatCurrency(goal.targetAmount)}
                    </div>

                    <div className="goal-progress-track">
                        <div className="goal-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                </div>

                <div className="saved-item-right">
                    <strong className="saved-amount">
                        {formatCurrency(remainingAmount)} left
                    </strong>

                    <span className="row-chevron">›</span>
                </div>
            </button>
        );
    }

    return (
        <section className="card">
            <div className="section-heading-row">
                <div>
                    <h2>Goals</h2>

                    <p className="secton-collapse-subtitle">
                        Track Savings Targets and Emergency Fund.
                    </p>
                </div>

                <button
                    type="button"
                    className="add-button compact-add-button"
                    onClick={() => setShowAddGoalForm((current) => !current)}
                >
                    {showAddGoalForm ? "Close" : "+ Add"}
                </button>
            </div>

            {showAddGoalForm && (
                <div className="goal-add-card">
                    <div className="form-grid">
                        <div className="field">
                            <label>Goal Name</label>

                            <input
                                type="text"
                                placeholder="Starter Emergency Fund"
                                value={goalName}
                                onChange={(event) => onGoalNameChange(event.target.value)}
                            />

                            {goalErrors.name && (
                                <p className="validation-error">
                                    {goalErrors.name}
                                </p>
                            )}
                        </div>

                        <div className="field">
                            <label>Target Amount</label>

                            <input
                                type="number"
                                placeholder="1000"
                                value={goalTargetAmount}
                                onChange={(event) => onGoalTargetAmountChange(event.target.value)}
                            />

                            {goalErrors.name && (
                                <p className="validation-error">
                                    {goalErrors.targetAmount}
                                </p>
                            )}
                        </div>

                        <div className="field">
                            <label>Current Amount Saved</label>

                            <input
                                type="number"
                                placeholder="0"
                                value={goalCurrentAmount}
                                onChange={(event) => onGoalCurrentAmountChange(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Goal Type</label>

                            <select
                                value={goalType}
                                onChange={(event) => onGoalTypeChange(event.target.value as "emergency" | "savings")}
                            >
                                <option value="emergency">Emergency Fund</option>
                                <option value="savings">Savings</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="add-button modal-primary-action"
                            onClick={handleAddGoal}
                        >
                            Add Goal
                        </button>
                    </div>
                </div>
            )}

            <div className="goal-controls">
                <input
                    type="text"
                    placeholder="Search goals..."
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value)
                        setGoalPage(1);
                    }}
                />
            </div>

            {filteredGoals.length === 0 ? (
                <div className="empty-debt-state compact-empty-state">
                    <strong>No Goals Added Yet.</strong>
                    <p>Add an emergency fund or savings goal to start tracking progress.</p>
                </div>
            ) : (
                visibleGoals.map(renderGoal)
            )}

            {filteredGoals.length > pageSize && (
                <div className="pagination-actions pagination-compact">
                    <button
                        type="button"
                        className="text-action-button"
                        disabled={goalPage >= 1}
                        onClick={() => setGoalPage((current) => Math.max(1, current - 1))}
                    >
                        ‹
                    </button>

                    <span className="pagination-status">
                        Page {goalPage} of {totalPages}
                    </span>

                    <button
                        type="button"
                        className="text-action-button"
                        onClick={() => setGoalPage((current) => Math.min(totalPages, current + 1))}
                    >
                        ›
                    </button>
                </div>
            )}
        </section>
    );
}