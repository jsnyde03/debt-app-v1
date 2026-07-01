import { formatCurrency } from "@/lib/utils/formatCurrency";
import { dayBefore } from "@/lib/utils/dayBefore";
import type { Debt, RequiredExpense, Goal } from "@/lib/storage/debtPlannerStorage";
import { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import {
    buildMultiCycleTimeline,
    type MultiCycleTimelineConfig,
} from "@/lib/timeline/buildMultiCycleTimeline";
import type { CompletedRecommendedAction, TimelineItem } from "@/lib/timeline/buildTimelineItems";
import type { LivingExpense } from "@/lib/types/livingExpense";
import { useState } from "react";
import { triggerLightHaptic } from "@/lib/mobile/haptics";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

type TimelineSectionProps = {
    result: AllocationResult | null;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
    goals: Goal[];
    livingExpenses: LivingExpense[];
    completedRecommendedActions: CompletedRecommendedAction[];
    currentDate: string;
    nextPaycheckDate: string;
    payCycleConfig: MultiCycleTimelineConfig;
    strategy: "snowball" | "avalanche";
};

function formatCycleDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function getTimelineIcon(type: string) {
    if (type === "paycheck") return "💵";
    if (type === "living_reserve") return "🛒";
    if (type === "buffer") return "🔒";
    if (type.includes("autopay")) return "⚡";
    if (type.includes("debt") || type === "snowball") return "💳";
    if (type === "emergency") return "📞";
    if (type === "optional_goal") return "🎯";
    return "📌";
}

function getTimelineCategoryIcon(category?: string) {
    switch (category) {
        case "housing": return "🏠";
        case "utilities": return "💡";
        case "insurance": return "🩺";
        case "subscriptions": return "📺";
        case "medical": return "💊";
        default: return "📌";
    }
}

function getTimelineStatusLabel(item: {
    type: string;
    status?: "planned" | "paid" | "external";
    isExternal?: boolean;
    isPaid?: boolean;
}) {
    if (item.isExternal) return "Outside Money";
    if (item.status === "paid" || item.isPaid) {
        if (item.type === "snowball" || item.type === "emergency" || item.type === "optional_goal") {
            return "Committed";
        }
        return "Paid";
    }
    if (item.type.includes("autopay")) return "Autopay";
    if (item.type === "paycheck") return "Income";
    if (item.type === "living_reserve") return "Reserve";
    if (item.type === "buffer") return "Reserved";
    return "Planned";
}

function TimelineItemRow({ item, isProjected }: { item: TimelineItem; isProjected: boolean }) {
    const isPositive = item.type === "paycheck";

    return (
        <div
            className={[
                "timeline-item",
                item.type.includes("autopay") ? "timeline-autopay" : "",
                item.isPaid ? "timeline-paid" : "",
                isProjected ? "timeline-projected" : "",
            ].filter(Boolean).join(" ")}
        >
            <div className="timeline-left">
                <div className="timeline-date">
                    {formatCycleDate(item.date)}
                </div>

                <div className="timeline-label">
                    <div className="timeline-title-row">
                        <span className="timeline-icon">{getTimelineIcon(item.type)}</span>
                        <span className="timeline-title-text">{item.label}</span>
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

                        {(item.type === "snowball" || item.type === "emergency" || item.type === "optional_goal") && (
                            <span className="timeline-recommended-pill timeline-pill">
                                Recommended
                            </span>
                        )}

                        {item.type.includes("autopay") && (
                            <span className="autopay-pill timeline-pill">Autopay</span>
                        )}

                        {item.isExternal && (
                            <span className="autopay-pill timeline-pill">Outside Money</span>
                        )}

                        <span className="timeline-status-pill timeline-pill">
                            {getTimelineStatusLabel(item)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="timeline-right">
                <strong className={isPositive ? "timeline-positive" : "timeline-negative"}>
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
                    Balance {formatCurrency(item.runningCash)}
                </div>
            </div>
        </div>
    );
}

export function TimelineSection({
    result,
    requiredExpenses,
    debts,
    goals,
    livingExpenses,
    completedRecommendedActions,
    currentDate,
    nextPaycheckDate,
    payCycleConfig,
    strategy,
}: TimelineSectionProps) {
    const [timelineExpanded, setTimelineExpanded] = useState(false);
    const [expandedCycles, setExpandedCycles] = useState<Record<number, boolean>>({ 0: true });

    if (!result) return null;

    const cycles = buildMultiCycleTimeline({
        result,
        requiredExpenses,
        debts,
        goals,
        livingExpenses,
        completedRecommendedActions,
        currentDate,
        nextPaycheckDate,
        payCycleConfig,
        strategy,
        paycheckBuffer: 50,
        maxCycles: 3,
    });

    function toggleCycle(index: number) {
        triggerLightHaptic();
        setExpandedCycles((prev) => ({ ...prev, [index]: !prev[index] }));
    }

    return (
        <section className="card timeline-card">
            <button
                type="button"
                className="section-collapse-button timeline-collapse-button"
                onClick={() => {
                    triggerLightHaptic();
                    setTimelineExpanded((v) => !v);
                }}
            >
                <div className="section-collapse-left">
                    <div className="timeline-collapse-copy">
                        <h2>Timeline</h2>
                        <p className="section-collapse-subtitle">
                            All bills across upcoming pay cycles.
                        </p>
                    </div>
                </div>
                <span className={timelineExpanded ? "collapse-chevron expanded" : "collapse-chevron"}>
                    ▼
                </span>
            </button>

            <div
                className={timelineExpanded ? "timeline-outer-body expanded" : "timeline-outer-body collapsed"}
                aria-hidden={!timelineExpanded}
            >
                {cycles.map((cycle, cycleIndex) => {
                    const isCycleExpanded = expandedCycles[cycleIndex] ?? false;
                    const balanceClass =
                        cycle.cushionStatus === "stable"
                            ? "timeline-cycle-balance-chip stable"
                            : cycle.cushionStatus === "tight"
                            ? "timeline-cycle-balance-chip tight"
                            : "timeline-cycle-balance-chip pressure";

                    return (
                        <div key={cycle.cycleStart} className="timeline-cycle-section">
                            <button
                                type="button"
                                className="timeline-cycle-header"
                                onClick={() => toggleCycle(cycleIndex)}
                                aria-expanded={isCycleExpanded}
                            >
                                <div className="timeline-cycle-header-left">
                                    <span className="timeline-cycle-range">
                                        {formatCycleDate(cycle.cycleStart)} – {formatCycleDate(dayBefore(cycle.cycleEnd))}
                                    </span>
                                    <span className="timeline-cycle-meta">
                                        {cycleIndex === 0 ? "This cycle" : "Projected"} · {cycle.items.length} transactions
                                    </span>
                                </div>
                                <div className="timeline-cycle-header-right">
                                    <span className={balanceClass}>
                                        {formatCurrency(cycle.endingBalance)}
                                    </span>
                                    <span className={isCycleExpanded ? "collapse-chevron expanded" : "collapse-chevron"}>
                                        ▼
                                    </span>
                                </div>
                            </button>

                            <div
                                className={
                                    isCycleExpanded
                                        ? "timeline-list timeline-cycle-body expanded"
                                        : "timeline-list timeline-cycle-body collapsed"
                                }
                                aria-hidden={!isCycleExpanded}
                            >
                                {cycle.items.map((item, itemIndex) => (
                                    <TimelineItemRow
                                        key={`${item.date}-${item.label}-${itemIndex}`}
                                        item={item}
                                        isProjected={cycle.isProjected}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
