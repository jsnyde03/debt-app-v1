import { PlanSettingsBody, type PlanSettingsBodyProps } from "@/components/PlanSettings/PlanSettingsBody";

// The two container shells that wrap <PlanSettingsBody>:
//   • returning users get the inline `.plan-settings-accordion` (expand/collapse),
//   • first-run setup gets the `.settings-overlay > .settings-sheet` modal.
// Only one is active at a time, so PlanSettingsBody is rendered once per render
// and the ~40-prop pass-through lives in a single place (it was duplicated
// across two call sites in page.tsx before). Extracted verbatim from page.tsx
// (orchestrator refactor 2.18 Phase 2) — no behavior or visual change.

type PlanSettingsSheetProps = PlanSettingsBodyProps & {
    // Whether the sheet is currently open (drives the accordion expand/collapse
    // and gates the first-run overlay).
    showPlanSettings: boolean;
    // Header "Close" action: haptic + collapse + reset delete-confirm.
    onCloseSheet: () => void;
};

export function PlanSettingsSheet({
    showPlanSettings,
    onCloseSheet,
    ...bodyProps
}: PlanSettingsSheetProps) {
    const { isFirstRunSetup } = bodyProps;

    return (
        <>
            {!isFirstRunSetup && (
                <div
                    className={`plan-settings-accordion ${showPlanSettings ? "expanded" : "collapsed"}`}
                    aria-hidden={!showPlanSettings}
                >
                    <div className="plan-settings-accordion-inner">
                        <div className="settings-sheet-header">
                            <div>
                                <h2>Plan Settings</h2>
                                <p className="section-collapse-subtitle">
                                    Adjust paycheck, pay cycle, and plan settings.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-action-button"
                                onClick={onCloseSheet}
                            >
                                Close
                            </button>
                        </div>
                        <PlanSettingsBody {...bodyProps} />
                    </div>
                </div>
            )}

            {showPlanSettings && isFirstRunSetup && (
                <div
                    className="settings-overlay"
                    onClick={() => {
                        if (!isFirstRunSetup) {
                            onCloseSheet();
                        }
                    }}
                >
                    <div
                        className="settings-sheet"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="settings-sheet-header">
                            <div>
                                <h2>{isFirstRunSetup ? "Create Your First Plan" : "Plan Settings"}</h2>
                                {!isFirstRunSetup && (
                                    <p className="section-collapse-subtitle">
                                        Adjust paycheck, pay cycle, and plan settings.
                                    </p>
                                )}
                            </div>

                            {!isFirstRunSetup && (
                                <button
                                    type="button"
                                    className="text-action-button"
                                    onClick={onCloseSheet}
                                >
                                    Close
                                </button>
                            )}
                        </div>

                        <PlanSettingsBody {...bodyProps} />
                    </div>
                </div>
            )}
        </>
    );
}
