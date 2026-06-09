import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Debt, RequiredExpense } from "@/lib/storage/debtPlannerStorage";
import { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import { buildTimelineItems } from "@/lib/timeline/buildTimelineItems";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

type TimelineRecommendedAction = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    recommendedAmount: number;
    actualAmount: number;
    paymentSource?: "paycheck" | "external";
}

type TimelineSectionProps = {
    result: AllocationResult | null;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
    currentDate: string;
    nextPaycheckDate: string;
    completedRecommendedActions: TimelineRecommendedAction[];
};

export function TimelineSection({
    result,
    requiredExpenses,
    debts,
    currentDate,
    nextPaycheckDate,
    completedRecommendedActions,
}: TimelineSectionProps) {

    if (!result) {
        return null;
    }

    const sortedItems = buildTimelineItems({
        result,
        requiredExpenses,
        debts,
        currentDate,
        completedRecommendedActions,
    });


    return (
        <section className="card timeline-card">
            <div className="section-header">
                <h2>Timeline</h2>

                <p className="section-subtitle">
                    Your paycheck flow through the next pay cycle.
                </p>
            </div>

            <div className="timeline-list">
                {sortedItems.map((item, index) => {
                    const isPositive = item.type === "paycheck";

                    return (
                        <div
                            key={`${item.date}-${item.label}-${index}`}
                            className={[
                                "timeline-item",
                                item.type.includes("autopay")
                                    ? "timeline-autopay"
                                    : "",
                            ].filter(Boolean).join(" ")}
                        >
                            <div className="timeline-left">
                                <div className="timeline-date">
                                    {item.date}
                                </div>

                                <div className="timeline-label">
                                    {item.label}

                                    {item.type.includes("autopay") && (
                                        <span className="autopay-pill">
                                            Autopay
                                        </span>
                                    )}

                                    {item.isExternal && (
                                        <span className="autopay-pill">
                                            Outside Money
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="timeline-right">
                                <strong
                                    className={
                                        isPositive
                                            ? "timeline-positive"
                                            : "timeline-negative"
                                    }
                                >
                                    {isPositive ? "+" : "-"}
                                    {formatCurrency(item.amount)}
                                </strong>

                                <div className="timeline-running-cash">
                                    Safe Cash:{" "}
                                    {formatCurrency(item.runningCash)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="timeline-next-paycheck">
                    Next Paycheck: {nextPaycheckDate}
                </div>
            </div>
        </section>
    );
}