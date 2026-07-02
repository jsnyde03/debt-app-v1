// Tab-aware app header: renders the hero title/subtitle for the active tab,
// the last-saved indicator + status toast (Plan tab only), and the dev-only
// RC Reset button. Extracted verbatim from page.tsx (orchestrator refactor
// 2.18 Phase 2) — no behavior or visual change.

type ActiveTab = "plan" | "bills" | "snowball" | "goals";

function formatLastSaved(value: string) {
    const savedAt = new Date(value);

    if (Number.isNaN(savedAt.getTime())) {
        return "Saved locally";
    }

    return `Saved locally · ${savedAt.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    })}`;
}

type AppHeaderProps = {
    activeTab: ActiveTab;
    heroSubtitle: string;
    lastSavedAt: string;
    statusMessage: string;
    isToastExiting: boolean;
    // Dev-only RC Reset handler (already wraps haptic + RevenueCat reset in
    // page.tsx). The button only renders when NEXT_PUBLIC_DEV_MODE === "true".
    onDevRcReset: () => void;
};

export function AppHeader({
    activeTab,
    heroSubtitle,
    lastSavedAt,
    statusMessage,
    isToastExiting,
    onDevRcReset,
}: AppHeaderProps) {
    return (
        <section className={activeTab === "plan" ? "hero" : "hero hero-page"} aria-label="Page header">
            {activeTab === "plan" ? (
                <>
                    <h1>Debt Planner</h1>
                    <p>{heroSubtitle}</p>
                </>
            ) : activeTab === "bills" ? (
                <>
                    <h1 className="page-heading">Bills</h1>
                    <p className="page-subheading">Manage recurring expenses and debts.</p>
                </>
            ) : activeTab === "snowball" ? (
                <>
                    <h1 className="page-heading">Payoff</h1>
                    <p className="page-subheading">Optimize your debt payoff strategy.</p>
                </>
            ) : activeTab === "goals" ? (
                <>
                    <h1 className="page-heading">Goals</h1>
                    <p className="page-subheading">Track savings goals and emergency funds.</p>
                </>
            ) : null}
            {lastSavedAt && activeTab === "plan" && (
                <p className="last-saved-indicator">
                    {formatLastSaved(lastSavedAt)}
                </p>
            )}
            {statusMessage && (
                <div className={`save-status-toast${isToastExiting ? " exiting" : ""}`} role="status" aria-live="polite">
                    {statusMessage}
                </div>
            )}

            {process.env.NEXT_PUBLIC_DEV_MODE === "true" && (
                <button
                    type="button"
                    className="rc-reset-button"
                    onClick={onDevRcReset}
                >
                    RC Reset
                </button>
            )}
        </section>
    );
}
