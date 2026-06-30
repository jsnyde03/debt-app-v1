import type { ReactNode } from "react";

type OptionalGoalsListProps = {
    children: ReactNode;
};

export function OptionalGoalsList({ children }: OptionalGoalsListProps) {
    return (
        <div className="plan-dashboard-section">
            <h2>Optional Goals</h2>

            <p className="section-collapse-subtitle">
                Optional savings contributions after required payments and debt payoff.
            </p>

            {children}
        </div>
    );
}
