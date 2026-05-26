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
    }
    onGoalNameChange: (value: string) => void;
    onGoalTargetAmountChange: (value: string) => void;
    onGoalCurrentAmountChange: (value: string) => void;
    onGoalTypeChange: (value: "emergency" | "savings") => void;
    onAddGoal: () => void;
    onRemoveGoal: (id: string) => void;
    onUpdateGoal: (id: string, updates: Partial<Pick<Goal, "targetAmount" | "currentAmount">>) => void;
}

export function GoalsSection({ goals, goalName, goalTargetAmount, goalCurrentAmount, goalType, goalErrors, onGoalNameChange, onGoalTargetAmountChange, onGoalCurrentAmountChange, onGoalTypeChange, onAddGoal, onRemoveGoal, onUpdateGoal }: GoalsSectionProps) {
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

        onUpdateGoal(id, { targetAmount, currentAmount, });

        cancelEditing();
    }


    return (
        <section className="card">
            <h2>Goals</h2>

            <button
                type="button"
                className="collapsible-header"
                onClick={() => setShowAddGoalForm(((current) => !current))}
                >
                    <span>{showAddGoalForm ? "- Add Goal" : "+ Add Goal"}</span>
                </button>

                {showAddGoalForm && (
                    <div className="form-grid">
                        <div className="field">
                    <label>Goal Name</label>
                    <input
                        type="text"
                        placeholder="Starter Emergency Fund"
                        value={goalName}
                        onChange={(e) => onGoalNameChange(e.target.value)}
                    />
                    {goalErrors.name && (<p className="validation-error">{goalErrors.name}</p>)}
                </div>

                <div className="field">
                    <label>Target Amount</label>
                    <input type="number" placeholder="1000" value={goalTargetAmount} onChange={(e) => onGoalTargetAmountChange(e.target.value)} />
                    {goalErrors.targetAmount && (<p className="validation-error">{goalErrors.targetAmount}</p>)}
                </div>

                <div className="field">
                    <label>Current Amount Saved</label>
                    <input type="number" placeholder="0" value={goalCurrentAmount} onChange={(e) => onGoalCurrentAmountChange(e.target.value)} />
                </div>

                <div className="field">
                    <label>Goal Type</label>
                    <select value={goalType} onChange={(e) => onGoalTypeChange(e.target.value as "emergency" | "savings")} >
                        <option value="emergency">Emergency Fund</option>
                        <option value="savings">Savings</option>
                    </select>
                </div>

                <button className="add-button" onClick={onAddGoal}>
                    Add goal
                </button>

                    </div>
                )}

                <div className="goal-controls">
                    <input
                        type="text"
                        placeholder="Search goals..."
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setGoalPage(1);
                        }}
                    />
                </div>

            {filteredGoals.length === 0 ? (
                <p className="empty-state">No goals added yet.</p>
            ) : (
                visibleGoals.map((goal) => {
                    const isEditing = editingGoalId === goal.id;
                    const progressPercent = goal.targetAmount > 0
                        ? Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100))
                        : 0;

                    return (
                        <div key={goal.id} className="saved-item">
                            {isEditing ? (
                                <>
                                    <div className="field">
                                        <label>Target Amount</label>
                                        <input type="number" value={editTargetAmount} onChange={(e) => setEditTargetAmount(e.target.value)} />
                                    </div>

                                    <div className="field">
                                        <label>Current Amount Saved</label>
                                        <input type="number" value={editCurrentAmount} onChange={(e) => setEditCurrentAmount(e.target.value)} />
                                    </div>

                                    <button className="secondary-button" onClick={() => saveEditing(goal.id)}>
                                        Save
                                    </button>

                                    <button className="secondary-button" onClick={cancelEditing}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="saved-item-left goal-card-content">
                                        <div className="saved-title">{goal.name}</div>
                                        <div className="saved-meta">
                                            {goal.type === "emergency" ? "Emergency Fund" : "Savings"} ·
                                            Saved {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                                        </div>

                                        <div className="goal-progress-track">
                                            <div className="goal-progress-fill" style={{ width: `${progressPercent}%`}}
                                            />
                                        </div>
                                    </div>

                                    <div className="saved-amount">
                                        {formatCurrency(goal.targetAmount - goal.currentAmount)} left
                                    </div>

                                    <div className="saved-actions">
                                        <button className="text-action-button" onClick={() => startEditing(goal)}>
                                            Edit
                                        </button>

                                        <button className="text-action-button danger-action" onClick={() => onRemoveGoal(goal.id)}>
                                            Remove
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })
            )}

            {filteredGoals.length > pageSize && (
                <div className="pagination-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        disabled={goalPage === 1}
                        onClick={() => setGoalPage((current) => Math.max(1, current - 1))}
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        disabled={goalPage === totalPages}
                        onClick={() => setGoalPage((current) => Math.min(totalPages, current + 1))}
                    >
                        Next
                    </button>
                </div>
            )}
        </section>
    );
}