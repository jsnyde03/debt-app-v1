import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Debt, RequiredExpense } from "@/lib/storage/debtPlannerStorage";
import { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import { buildTimelineItems } from "@/lib/timeline/buildTimelineItems";
import { useState } from "react";
import { triggerLightHaptic } from "@/lib/mobile/haptics";

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

function formatTimelineDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
        }
    );
}

function getTimelineIcon(type: string) {
    if (type === "paycheck") {
        return "💵";
    }

    if (type === "living_reserve") {
        return "🛒"
    }

    if (type.includes("autopay")) {
        return "⚡";
    }

    if (type.includes("debt") || type === "snowball") {
        return "💳";
    }

    if (type === "emergency") {
        return "📞";
    }

    if (type === "optional_goal") {
        return "🎯";
    }

    return "📌";
}

function getTimelineCategoryIcon(category?: string) {
    switch (category) {
        case "housing":
            return "🏠";

        case "utilities":
            return "💡";

        case "insurance":
            return "🩺";

        case "subscriptions":
            return "📺";

        case "medical":
            return "💊";

        default:
            return "📌";
    }
}

function getTimelineStatusLabel(item: { type: string; status?: "planned" | "paid" | "external"; isExternal?: boolean, isPaid?: boolean; }) {
    if (item.isExternal) {
        return "Outside Money";
    }

    if (item.status === "paid" || item.isPaid) {
        if (item.type === "snowball" || item.type === "emergency" || item.type === "optional_goal") {
            return "Committed";
        }
        return "Paid";
    }

    if (item.type.includes("autopay")) {
        return "Autopay";
    }

    if (item.type === "paycheck") {
        return "Income";
    }

    if (item.type === "living_reserve") {
        return "Reserve";
    }

    return "Planned";
}

export function TimelineSection({
    result,
    requiredExpenses,
    debts,
    currentDate,
    nextPaycheckDate,
    completedRecommendedActions,
}: TimelineSectionProps) {

    const [timelineExpanded, setTimelineExpanded] = useState(false);

    if (!result) {
        return null;
    }

    const sortedItems = buildTimelineItems({
        result,
        requiredExpenses,
        debts,
        currentDate,
        nextPaycheckDate,
        completedRecommendedActions,
    });


    return (
        <section className="card timeline-card">
            <button
                type="button"
                className="section-collapse-button timeline-collapse-button"
                onClick={() => { triggerLightHaptic(); setTimelineExpanded((current) => !current); }}
            >
                <div className="section-collapse-left">
                    <div className="timeline-collapse-copy">
                        <h2>Timeline</h2>

                        <p className="section-collapse-subtitle">
                            Your paycheck flow through the next pay cycle.
                        </p>
                    </div>
                </div>

                <span
                    className={
                        timelineExpanded
                            ? "collapse-chevron expanded"
                            : "collapse-chevron"
                    }
                >
                    ▼
                </span>
            </button>

            <div
                className={
                    timelineExpanded
                        ? "timeline-list plan-section-body expanded"
                        : "timeline-list plan-section-body collapsed"
                }
                aria-hidden={!timelineExpanded}
            >
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
                                item.isPaid ? "timeline-paid" : "",
                            ].filter(Boolean).join(" ")}
                        >
                            <div className="timeline-left">
                                <div className="timeline-date">
                                    {formatTimelineDate(item.date)}
                                </div>

                                <div className="timeline-label">
                                    <div className="timeline-title-row">
                                        <span className="timeline-icon">
                                            {getTimelineIcon(item.type)}
                                        </span>

                                        <span className="timeline-title-text">
                                            {item.label}
                                        </span>
                                    </div>

                                    <div className="timeline-pill-row">
                                        {item.category && (
                                            <span className="category-pill timeline-pill">
                                                <span className="category-pill-icon">
                                                    {getTimelineCategoryIcon(item.category)}
                                                </span>

                                                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                            </span>
                                        )}

                                        {(
                                            item.type === "snowball" ||
                                            item.type === "emergency" ||
                                            item.type === "optional_goal"
                                        ) && (
                                                <span className="timeline-recommended-pill timeline-pill">
                                                    Recommended
                                                </span>
                                            )}

                                        {item.type.includes("autopay") && (
                                            <span className="autopay-pill timeline-pill">
                                                Autopay
                                            </span>
                                        )}

                                        {item.isExternal && (
                                            <span className="autopay-pill timeline-pill">
                                                Outside Money
                                            </span>
                                        )}

                                        <span className="timeline-status-pill timeline-pill">
                                            {getTimelineStatusLabel(item)}
                                        </span>
                                    </div>
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

                                <div
                                    className={
                                        item.runningCash < 100
                                            ? "timeline-running-cash timeline-cash-warning"
                                            : "timeline-running-cash"
                                    }
                                >
                                    Balance{" "}
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