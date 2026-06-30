import type { ReactNode } from "react";
import { triggerLightHaptic } from "@/lib/mobile/haptics";

type CompletedActionsListProps = {
    count: number;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    children: ReactNode;
};

export function CompletedActionsList({
    count,
    isExpanded,
    onToggleExpanded,
    children,
}: CompletedActionsListProps) {
    return (
        <div className="plan-dashboard-section completed-section">
            <button
                type="button"
                className="section-collapse-button"
                onClick={() => {
                    triggerLightHaptic();
                    onToggleExpanded();
                }}
            >
                <div className="section-collapse-left">
                    <div>
                        <h2>Completed This Cycle</h2>
                        <p className="section-collapse-subtitle">Payments confirmed for this pay cycle.</p>
                    </div>

                    <span className="section-count-pill">
                        {count}
                    </span>
                </div>

                <span
                    className={
                        isExpanded
                            ? "collapse-chevron expanded"
                            : "collapse-chevron"
                    }
                >
                    ▼
                </span>
            </button>

            <div
                className={
                    isExpanded
                        ? "plan-section-body expanded"
                        : "plan-section-body collapsed"
                }
                aria-hidden={!isExpanded}
            >
                <div className="required-actions-list">
                    {children}
                </div>
            </div>
        </div>
    );
}
