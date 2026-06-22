type AppLockScreenProps = {
    darkMode: boolean;
    onUnlock: () => void;
};

export function AppLockScreen({ darkMode, onUnlock }: AppLockScreenProps) {
    return (
        <main className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
            <div className="app-lock-screen">
                <div className="app-lock-icon">🔒</div>
                <h1>Debt Planner Locked</h1>
                <p>Unlock to view your paycheck plan.</p>

                <button
                    type="button"
                    className="primary-button app-lock-unlock-button"
                    onClick={onUnlock}
                >
                    Unlock
                </button>
            </div>
        </main>
    );
}
