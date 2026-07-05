import { PlanSkeleton } from "@/components/Skeleton/PlanSkeleton";

type AppSkeletonProps = {
    darkMode: boolean;
};

/**
 * Pre-hydration loading screen (rendered while `!isMounted`). Shows the
 * silhouette of whichever tab will be active on load, composed from
 * shape-specific pieces. The app always opens on the Plan tab (`activeTab`
 * isn't persisted), so it renders <PlanSkeleton/>; the composed structure lets
 * other tab silhouettes slot in if the active tab is persisted later.
 */
export function AppSkeleton({ darkMode }: AppSkeletonProps) {
    return (
        <main
            className={`app ${darkMode ? "dark-theme" : "light-theme"}`}
            aria-busy="true"
            aria-label="Loading your plan"
        >
            <div className="app-content">
                <PlanSkeleton />
            </div>

            <nav className="bottom-nav" aria-hidden="true">
                <div className="skeleton-nav-item" />
                <div className="skeleton-nav-item" />
                <div className="skeleton-nav-item" />
                <div className="skeleton-nav-item" />
            </nav>
        </main>
    );
}
