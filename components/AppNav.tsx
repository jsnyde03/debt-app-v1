import { Home as HomeIcon, CreditCard, TrendingUp, Target, Settings } from "@/lib/icons";

// The responsive app navigation: the phone `.bottom-nav` and the iPad
// `.sidebar-nav` (which also carries a Settings button). Both are rendered;
// CSS decides which is visible at a given breakpoint. Extracted verbatim from
// page.tsx (orchestrator refactor 2.18 Phase 2) — no behavior or visual change.
//
// onSelectTab owns the per-tab side effects (haptic + tab switch + the
// bills-view default) so both navs stay in sync; onToggleSettings toggles the
// Plan Settings sheet from the sidebar Settings button.

type ActiveTab = "plan" | "bills" | "snowball" | "goals";

type AppNavProps = {
    activeTab: ActiveTab;
    showPlanSettings: boolean;
    onSelectTab: (tab: ActiveTab) => void;
    onToggleSettings: () => void;
};

export function AppNav({
    activeTab,
    showPlanSettings,
    onSelectTab,
    onToggleSettings,
}: AppNavProps) {
    return (
        <>
            <nav className="bottom-nav" aria-label="Main navigation">
                <button
                    type="button"
                    className={
                        activeTab === "plan"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => onSelectTab("plan")}
                >
                    <HomeIcon size={20} aria-hidden="true" />
                    <small>Plan</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "bills"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => onSelectTab("bills")}
                >
                    <CreditCard size={20} aria-hidden="true" />
                    <small>Bills</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "snowball"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => onSelectTab("snowball")}
                >
                    <TrendingUp size={20} aria-hidden="true" />
                    <small>Payoff</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "goals"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => onSelectTab("goals")}
                >
                    <Target size={20} aria-hidden="true" />
                    <small>Goals</small>
                </button>
            </nav>

            <nav className="sidebar-nav" aria-label="Main navigation">
                <div className="sidebar-logo" aria-hidden="true">
                    <TrendingUp size={20} />
                </div>
                <button
                    type="button"
                    className={activeTab === "plan" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => onSelectTab("plan")}
                >
                    <HomeIcon size={22} aria-hidden="true" />
                    <small>Plan</small>
                </button>
                <button
                    type="button"
                    className={activeTab === "bills" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => onSelectTab("bills")}
                >
                    <CreditCard size={22} aria-hidden="true" />
                    <small>Bills</small>
                </button>
                <button
                    type="button"
                    className={activeTab === "snowball" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => onSelectTab("snowball")}
                >
                    <TrendingUp size={22} aria-hidden="true" />
                    <small>Payoff</small>
                </button>
                <button
                    type="button"
                    className={activeTab === "goals" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => onSelectTab("goals")}
                >
                    <Target size={22} aria-hidden="true" />
                    <small>Goals</small>
                </button>
                <button
                    type="button"
                    className="sidebar-nav-item sidebar-settings-btn"
                    aria-label="Open Plan Settings"
                    aria-expanded={showPlanSettings}
                    onClick={onToggleSettings}
                >
                    <Settings size={22} aria-hidden="true" />
                    <small>Settings</small>
                </button>
            </nav>
        </>
    );
}
