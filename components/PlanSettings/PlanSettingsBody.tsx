import type { Dispatch, SetStateAction, ChangeEvent } from "react";
import { PaycheckSection } from "@/components/PaycheckSection";
import { ChevronRight } from "@/lib/icons";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { PayCycle } from "@/lib/payCycle/getNextPaycheckDate";
import type { ThemePreference } from "@/lib/hooks/useDarkMode";

// The shared Plan Settings content, container-agnostic. Rendered inside the
// first-run modal (isFirstRunSetup) AND the returning-user accordion, so both
// surfaces stay in sync (v1.5 #15 decision). onClose collapses whichever
// container it lives in; onOpenHistory opens Pay Cycle History.
type PlanSettingsBodyProps = {
    isFirstRunSetup: boolean;
    onClose: () => void;
    onOpenHistory: () => void;

    // Paycheck
    amount: string;
    payCycle: PayCycle;
    semiMonthlyFirstDay: string;
    semiMonthlySecondDay: string;
    monthlyPayDay: string;
    nextPaycheckDate: string;
    currentDate: string;
    onAmountChange: (value: string) => void;
    onPayCycleChange: (value: PayCycle) => void;
    onNextPaycheckDateChange: (value: string) => void;
    onSemiMonthlyFirstDayChange: (value: string) => void;
    onSemiMonthlySecondDayChange: (value: string) => void;
    onMonthlyPayDayChange: (value: string) => void;
    onCalculate: () => void;
    onRolloverPayCycle: () => void;
    onResetToToday: () => void;
    onExportBackup: () => void;
    onImportBackup: (event: ChangeEvent<HTMLInputElement>) => void;
    onPopulateDemoData: () => void;

    // Windfall
    showWindfall: boolean;
    setShowWindfall: Dispatch<SetStateAction<boolean>>;
    windfallInput: string;
    setWindfallInput: Dispatch<SetStateAction<string>>;
    setAmount: Dispatch<SetStateAction<string>>;
    setStatusMessage: Dispatch<SetStateAction<string>>;

    // Appearance
    themePreference: ThemePreference;
    setThemePreference: (pref: ThemePreference) => void;

    // Notifications
    notificationsEnabled: boolean;
    onNotificationsToggle: () => void;

    // App Lock
    appLockEnabled: boolean;
    setAppLockEnabled: (enabled: boolean) => void;

    // Danger zone
    showDeleteConfirm: boolean;
    setShowDeleteConfirm: Dispatch<SetStateAction<boolean>>;
    onDeleteAll: () => void;
};

export function PlanSettingsBody({
    isFirstRunSetup,
    onClose,
    onOpenHistory,
    amount,
    payCycle,
    semiMonthlyFirstDay,
    semiMonthlySecondDay,
    monthlyPayDay,
    nextPaycheckDate,
    currentDate,
    onAmountChange,
    onPayCycleChange,
    onNextPaycheckDateChange,
    onSemiMonthlyFirstDayChange,
    onSemiMonthlySecondDayChange,
    onMonthlyPayDayChange,
    onCalculate,
    onRolloverPayCycle,
    onResetToToday,
    onExportBackup,
    onImportBackup,
    onPopulateDemoData,
    showWindfall,
    setShowWindfall,
    windfallInput,
    setWindfallInput,
    setAmount,
    setStatusMessage,
    themePreference,
    setThemePreference,
    notificationsEnabled,
    onNotificationsToggle,
    appLockEnabled,
    setAppLockEnabled,
    showDeleteConfirm,
    setShowDeleteConfirm,
    onDeleteAll,
}: PlanSettingsBodyProps) {
    return (
        <>
            {isFirstRunSetup && (
                <p className="setup-hint">
                    Enter your paycheck to create your first plan.
                </p>
            )}

            {isFirstRunSetup && (
                <div className="setup-badge">First Time Setup</div>
            )}

            {isFirstRunSetup && (
                <div className="first-run-import-row">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                            triggerLightHaptic();
                            onPopulateDemoData();
                        }}
                    >
                        Try with Sample Data
                    </button>

                    <label className="secondary-button import-button">
                        Import Backup
                        <input
                            type="file"
                            accept="json,application/json"
                            onChange={onImportBackup}
                            hidden
                        />
                    </label>
                </div>
            )}

            <PaycheckSection
                amount={amount}
                payCycle={payCycle}
                semiMonthlyFirstDay={semiMonthlyFirstDay}
                semiMonthlySecondDay={semiMonthlySecondDay}
                monthlyPayDay={monthlyPayDay}
                nextPaycheckDate={nextPaycheckDate}
                currentDate={currentDate}
                showAdminActions={!isFirstRunSetup}
                onExportBackup={onExportBackup}
                onImportBackup={onImportBackup}
                onAmountChange={onAmountChange}
                onPayCycleChange={onPayCycleChange}
                onNextPayCheckDateChange={onNextPaycheckDateChange}
                onSemiMonthlyFirstDayChange={onSemiMonthlyFirstDayChange}
                onSemiMonthlySecondDayChange={onSemiMonthlySecondDayChange}
                onMonthlyPayDayChange={onMonthlyPayDayChange}
                onCalculate={onCalculate}
                onRolloverPayCycle={onRolloverPayCycle}
                onResetToToday={onResetToToday}
            />

            {!isFirstRunSetup && (
                <div className="card windfall-card">
                    {showWindfall ? (
                        <div className="windfall-form">
                            <p className="windfall-label">Got a bonus or extra cash? Add it to this paycheck.</p>
                            <div className="windfall-input-row">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="windfall-input"
                                    placeholder="0.00"
                                    value={windfallInput}
                                    onChange={e => setWindfallInput(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="primary-plan-button"
                                    onClick={() => {
                                        const extra = parseFloat(windfallInput);
                                        if (!extra || extra <= 0) return;
                                        triggerMediumHaptic();
                                        setAmount(prev => String(Math.round((Number(prev) + extra) * 100) / 100));
                                        setWindfallInput("");
                                        setShowWindfall(false);
                                        onClose();
                                        setStatusMessage(`Added $${extra.toFixed(2)} windfall to this paycheck.`);
                                    }}
                                >
                                    Apply
                                </button>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => { setShowWindfall(false); setWindfallInput(""); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="windfall-trigger-button"
                            onClick={() => { triggerLightHaptic(); setShowWindfall(true); }}
                        >
                            <span className="windfall-trigger-icon">💰</span>
                            <span>Got extra money this paycheck?</span>
                        </button>
                    )}
                </div>
            )}

            {!isFirstRunSetup && (
                <button
                    type="button"
                    className="card settings-nav-row"
                    onClick={() => {
                        triggerLightHaptic();
                        onOpenHistory();
                    }}
                    aria-label="View Pay Cycle History"
                >
                    <div>
                        <h3>Pay Cycle History</h3>
                        <p className="section-collapse-subtitle">
                            Look back at your finished pay cycles.
                        </p>
                    </div>
                    <ChevronRight size={20} aria-hidden="true" />
                </button>
            )}

            {!isFirstRunSetup && (
                <div className="card notifications-settings-card">
                    <div className="notifications-settings-row">
                        <div>
                            <h3>Appearance</h3>
                        </div>
                        <div className="theme-selector" role="group" aria-label="Theme preference">
                            {(["system", "light", "dark"] as ThemePreference[]).map((pref) => (
                                <button
                                    key={pref}
                                    type="button"
                                    className={`theme-selector-pill${themePreference === pref ? " theme-selector-pill-active" : ""}`}
                                    onClick={() => { triggerLightHaptic(); setThemePreference(pref); }}
                                    aria-pressed={themePreference === pref}
                                >
                                    {pref === "system" ? "Auto" : pref === "light" ? "Light" : "Dark"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!isFirstRunSetup && (
                <div className="card notifications-settings-card">
                    <div className="notifications-settings-row">
                        <div>
                            <h3>Notifications</h3>
                            <p className="section-collapse-subtitle">
                                Paycheck-eve reminder and upcoming bill alerts.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={notificationsEnabled}
                            className={notificationsEnabled ? "toggle-button toggle-on" : "toggle-button toggle-off"}
                            onClick={onNotificationsToggle}
                            aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>
                </div>
            )}

            {!isFirstRunSetup && (
                <div className="card notifications-settings-card">
                    <div className="notifications-settings-row">
                        <div>
                            <h3>App Lock</h3>
                            <p className="section-collapse-subtitle">
                                Require Face ID, Touch ID, or your device passcode to open the app.
                            </p>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={appLockEnabled}
                            className={appLockEnabled ? "toggle-button toggle-on" : "toggle-button toggle-off"}
                            onClick={() => {
                                triggerLightHaptic();
                                setAppLockEnabled(!appLockEnabled);
                            }}
                            aria-label={appLockEnabled ? "Disable app lock" : "Enable app lock"}
                        >
                            <span className="toggle-thumb" />
                        </button>
                    </div>
                </div>
            )}

            {!isFirstRunSetup && (
                <div className="settings-danger-zone">
                    {showDeleteConfirm ? (
                        <div className="delete-confirm-row">
                            <p className="delete-confirm-text">
                                All debts, bills, goals, and settings will be permanently erased. This cannot be undone.
                            </p>
                            <div className="delete-confirm-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="danger-destructive-button"
                                    onClick={() => {
                                        triggerMediumHaptic();
                                        onDeleteAll();
                                    }}
                                >
                                    Delete Everything
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="danger-text-button"
                            aria-label="Delete all data — permanently erase all debts, bills, goals, and settings"
                            onClick={() => {
                                triggerLightHaptic();
                                setShowDeleteConfirm(true);
                            }}
                        >
                            Delete All Data
                        </button>
                    )}
                </div>
            )}

            <p className="settings-privacy-note">
                Your data stays on this device — nothing is uploaded or shared.
            </p>

            <div className="settings-legal-row">
                <a
                    href="https://github.com/jsnyde03/debt-planner-stie/blob/main/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                >
                    Privacy Policy
                </a>
                <span className="legal-separator">·</span>
                <a
                    href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                >
                    Terms of Use
                </a>
                <span className="legal-separator">·</span>
                <a
                    href="https://github.com/jsnyde03/debt-planner-stie/blob/main/Paycheck%20Debt%20Planner%20Support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                >
                    Support
                </a>
                <span className="legal-separator">·</span>
                <a
                    href="https://apps.apple.com/account/subscriptions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                >
                    Manage Subscription
                </a>
            </div>
        </>
    );
}
