import type { Goal } from "@core/storage/debtPlannerStorage";
import { useState } from "react";
import { formatCurrency } from "@core/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { useScrollFabVisible } from "@/lib/mobile/useScrollFabVisible";
import { Shield, Target, ChevronRight } from "@/lib/icons";

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
    const [showAddGoalModal, setShowAddGoalModal] = useState(false);
    const pageSize = 10;
    const [goalVisibleCount, setGoalVisibleCount] = useState(pageSize);
    const showFab = useScrollFabVisible();

    const filteredGoals = goals.filter((goal) => goal.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const visibleGoals = filteredGoals.slice(0, goalVisibleCount);

    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? Math.min(100, Math.max(0, (totalSaved / totalTarget) * 100)) : 0;
    const fundedGoalsCount = goals.filter((goal) => goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount).length;

    function startEditing(goal: Goal) {
        triggerLightHaptic();
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
        // Tolerate comma grouping ("1,000") like the debt-edit path — Number("1,000")
        // is NaN, which the old guard silently swallowed into a no-op. And ALLOW an
        // over-funded goal (currentAmount > targetAmount): lowering a funded goal's
        // target is data-safe (markGoal reconciles) and shouldn't fail silently (#6).
        const clean = (s: string) => Number(String(s).replace(/,/g, "").trim());
        const targetAmount = clean(editTargetAmount);
        const currentAmount = editCurrentAmount.trim() === "" ? 0 : clean(editCurrentAmount);

        if (!Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(currentAmount) || currentAmount < 0) {
            return;
        }

        triggerMediumHaptic();

        onUpdateGoal(id, {
            targetAmount,
            currentAmount,
        });

        cancelEditing();
    }

    function handleAddGoal() {
        triggerMediumHaptic();
        onAddGoal();
        setShowAddGoalModal(false);
    }

    function renderGoal(goal: Goal) {
        const isEditing = editingGoalId === goal.id;
        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
        const progressPercent = goal.targetAmount > 0 ? Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100)) : 0;
        const isComplete = goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
        const GoalIcon = goal.type === "emergency" ? Shield : Target;

        if (isEditing) {
            return (
                <div key={goal.id} className="saved-item debt-edit-card compact-debt-edit-card">
                    <div className="saved-title">{goal.name}</div>

                    <div className="compact-debt-edit-grid">
                        <div className="field">
                            <label>Target</label>

                            <input
                                type="text"
                                inputMode="decimal"
                                value={editTargetAmount}
                                onChange={(event) => setEditTargetAmount(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Saved</label>

                            <input
                                type="text"
                                inputMode="decimal"
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
                                triggerMediumHaptic();
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
                                onClick={() => {
                                    triggerLightHaptic();
                                    cancelEditing();
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="add-button debt-save-button"
                                onClick={() => {
                                    triggerMediumHaptic();
                                    saveEditing(goal.id);
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <button
                key={goal.id}
                type="button"
                className="saved-item saved-item-button goal-list-item"
                onClick={() => startEditing(goal)}
            >
                <div className="saved-item-left goal-card-content">
                    <div className="goal-title-row">
                        <span className="goal-type-icon"><GoalIcon size={14} aria-hidden="true" /></span>
                        <div className="saved-title">{goal.name}</div>

                        {isComplete && (
                            <span className="insight-chip good goal-complete-chip">
                                Funded
                            </span>
                        )}
                    </div>

                    <div className="saved-meta">
                        {goal.type === "emergency" ? "Emergency Fund" : "Savings"} ·
                        Saved {formatCurrency(goal.currentAmount)} of{" "}
                        {formatCurrency(goal.targetAmount)}
                    </div>

                    <div className="goal-progress-row">
                        <div className="goal-progress-track">
                            <div
                                className={`goal-progress-fill ${isComplete ? "complete" : ""}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        <span className="goal-progress-percent">
                            {Math.round(progressPercent)}%
                        </span>
                    </div>
                </div>

                <div className="saved-item-right">
                    <strong className="saved-amount">
                        {isComplete ? "Goal met" : `${formatCurrency(remainingAmount)} left`}
                    </strong>

                    <ChevronRight size={18} className="row-chevron" aria-hidden="true" />
                </div>
            </button>
        );
    }

    return (
        <>
        <section className="card goals-polish-card">
            <div className="section-heading-row">
                <div>
                    <h2>Goals</h2>

                    <p className="section-collapse-subtitle">
                        Track Savings and Emergency Fund.
                    </p>
                </div>

                <button
                    type="button"
                    className="add-button compact-add-button goals-add-button"
                    onClick={() => {
                        triggerLightHaptic();
                        setShowAddGoalModal(true);
                    }}
                >
                    + Add
                </button>
            </div>

            {goals.length > 0 ? (
                <div className="goals-tab-layout">
                    <div className="goals-summary-col">
                        <div className="goal-summary-strip">
                            <div>
                                <span>Total Saved</span>
                                <strong>{formatCurrency(totalSaved)}</strong>
                            </div>

                            <div>
                                <span>Total Goal</span>
                                <strong>{formatCurrency(totalTarget)}</strong>
                            </div>

                            <div>
                                <span>Overall Progress</span>
                                <strong>{Math.round(overallProgress)}%</strong>
                            </div>
                        </div>

                        <div className="goal-controls">
                            <input
                                type="text"
                                placeholder="Search goals..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setGoalVisibleCount(pageSize);
                                }}
                            />
                        </div>

                        <div className="premium-momentum-card">
                            <span>{fundedGoalsCount > 0 ? "🎉" : "👑"}</span>
                            <div>
                                <strong>
                                    {fundedGoalsCount > 0
                                        ? `${fundedGoalsCount} goal${fundedGoalsCount === 1 ? "" : "s"} fully funded`
                                        : "Every contribution moves you closer"}
                                </strong>
                                <p>
                                    {fundedGoalsCount > 0
                                        ? "Great work staying consistent. Keep building toward what's next."
                                        : "Small, steady deposits add up faster than they feel like they do."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="goals-main-col">
                        {filteredGoals.length === 0 ? (
                            <div className="empty-debt-state compact-empty-state">
                                <strong>No matching goals.</strong>
                                <p>Try a different search term.</p>
                            </div>
                        ) : (
                            <div className="goals-list">
                                {visibleGoals.map(renderGoal)}
                            </div>
                        )}

                        {filteredGoals.length > goalVisibleCount && (
                            <div className="load-more-actions">
                                <button
                                    type="button"
                                    className="load-more-button"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setGoalVisibleCount((current) => current + pageSize);
                                    }}
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="goal-controls">
                        <input
                            type="text"
                            placeholder="Search goals..."
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setGoalVisibleCount(pageSize);
                            }}
                        />
                    </div>

                    <div className="empty-debt-state compact-empty-state">
                        <Target size={48} className="empty-state-icon" aria-hidden="true" />
                        <strong>No Goals Added Yet.</strong>
                        <p>Add an emergency fund or savings goal to start tracking progress.</p>
                    </div>
                </>
            )}
        </section>

        {showAddGoalModal && (
            <div
                className="center-modal-overlay"
                onClick={() => {
                    triggerLightHaptic();
                    setShowAddGoalModal(false);
                }}
            >
                <div
                    className="center-modal goal-add-modal"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="center-modal-header">
                        <div>
                            <h2>Add Goal</h2>
                            <p>Track A Savings Or Emergency Fund Target.</p>
                        </div>

                        <button
                            type="button"
                            className="text-action-button"
                            onClick={() => {
                                triggerLightHaptic();
                                setShowAddGoalModal(false);
                            }}
                        >
                            Close
                        </button>
                    </div>

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
                                type="text"
                                inputMode="decimal"
                                placeholder="1000"
                                value={goalTargetAmount}
                                onChange={(event) => onGoalTargetAmountChange(event.target.value)}
                            />

                            {goalErrors.targetAmount && (
                                <p className="validation-error">
                                    {goalErrors.targetAmount}
                                </p>
                            )}
                        </div>

                        <div className="field">
                            <label>Current Amount Saved</label>

                            <input
                                type="text"
                                inputMode="decimal"
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
            </div>
        )}

        {showFab && !showAddGoalModal && (
            <button
                type="button"
                className="add-button floating-add-button goals-add-button"
                onClick={() => {
                    triggerLightHaptic();
                    setShowAddGoalModal(true);
                }}
                aria-label="Add Goal"
            >
                + Add
            </button>
        )}
        </>
    );
}