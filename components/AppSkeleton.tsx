type AppSkeletonProps = {
    darkMode: boolean;
};

export function AppSkeleton({ darkMode }: AppSkeletonProps) {
    return (
        <main className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
            <div className="app-content">
                <div className="skeleton-hero">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-subtitle" />
                </div>

                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card skeleton-card-tall" />
            </div>

            <nav className="bottom-nav">
                <div className="skeleton-nav-item" />
                <div className="skeleton-nav-item" />
                <div className="skeleton-nav-item" />
                <div className="skeleton-nav-item" />
            </nav>
        </main>
    );
}
