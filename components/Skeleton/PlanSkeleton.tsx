/**
 * Plan-tab-shaped loading silhouette. Roughly mirrors the real Plan layout —
 * hero (title + subtitle), the adaptive metric grid, an on-track/status card,
 * and a few action-list rows — so the pre-hydration screen reads as the page
 * that's about to appear rather than a generic stack of blocks.
 *
 * The app always opens on the Plan tab (`activeTab` is not persisted), so this
 * is the only tab silhouette needed today. It's a self-contained composable
 * piece so other tab skeletons (e.g. a debt-row-shaped Bills silhouette) can
 * slot in if the active tab is ever persisted — see the "persist the active
 * tab" backlog item. Reuses the shared `skeletonShimmer` base (no new anim).
 */
export function PlanSkeleton() {
    return (
        <>
            <div className="skeleton-hero">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-subtitle" />
            </div>

            <div className="skeleton-panel">
                <div className="skeleton-line skeleton-panel-label" />
                <div className="skeleton-stat-grid">
                    <div className="skeleton-stat" />
                    <div className="skeleton-stat" />
                    <div className="skeleton-stat" />
                    <div className="skeleton-stat" />
                </div>
            </div>

            <div className="skeleton-row-group">
                <div className="skeleton-row" />
                <div className="skeleton-row" />
                <div className="skeleton-row" />
            </div>
        </>
    );
}
