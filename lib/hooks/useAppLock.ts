import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { readKeyValue, writeKey } from "@/lib/storage/safeStorage";

// Only lock after the app has sat in the background this long - a brief
// switch to another app (notification, copy/paste, etc.) shouldn't force
// re-authentication every time.
const LOCK_GRACE_PERIOD_MS = 30_000;

export function useAppLock() {
    const [appLockEnabled, setAppLockEnabledState] = useState(() =>
<<<<<<< Updated upstream
        readKeyValue("debtPlanner.appLockEnabled", false)
    );

    const [isUnlocked, setIsUnlocked] = useState(
        () => !readKeyValue("debtPlanner.appLockEnabled", false)
=======
        loadStoredState("debtPlanner.appLockEnabled", false)
    );

    const [isUnlocked, setIsUnlocked] = useState(
        () => !loadStoredState("debtPlanner.appLockEnabled", false)
>>>>>>> Stashed changes
    );

    useEffect(() => {
        writeKey("debtPlanner.appLockEnabled", appLockEnabled);
    }, [appLockEnabled]);

    const requestUnlock = useCallback(async () => {
        try {
            const status = await BiometricAuth.checkBiometry().catch(() => null);

            if (status && !status.isAvailable && !status.deviceIsSecure) {
                // No biometry enrolled and no device passcode set - there is nothing
                // to authenticate against. Fail open rather than locking the user
                // out of their own data with no way back in.
                setIsUnlocked(true);
                return;
            }

            await BiometricAuth.authenticate({
                reason: "Unlock Debt Planner",
                allowDeviceCredential: true,
                iosFallbackTitle: "Use Passcode",
                androidTitle: "Unlock Debt Planner",
            });

            setIsUnlocked(true);
        } catch {
            setIsUnlocked(false);
        }
    }, []);

    function setAppLockEnabled(enabled: boolean) {
        setAppLockEnabledState(enabled);
        // Enabling ARMS the lock for the next background/relaunch — the user stays in
        // the app they're already using. Slamming them to the Unlock screen the instant
        // they flip the toggle reads as a glitch (audit #14). The appStateChange listener
        // locks on the next background; a cold launch inits isUnlocked=!enabled. Disabling
        // always leaves them unlocked.
        if (!enabled) setIsUnlocked(true);
    }

    const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (!appLockEnabled) return;

        let handle: { remove: () => void } | undefined;

        void App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) {
                if (lockTimeoutRef.current) {
                    clearTimeout(lockTimeoutRef.current);
                    lockTimeoutRef.current = undefined;
                }
                return;
            }

            lockTimeoutRef.current = setTimeout(() => {
                setIsUnlocked(false);
            }, LOCK_GRACE_PERIOD_MS);
        }).then((created) => {
            handle = created;
        });

        return () => {
            handle?.remove();
            if (lockTimeoutRef.current) {
                clearTimeout(lockTimeoutRef.current);
                lockTimeoutRef.current = undefined;
            }
        };
    }, [appLockEnabled]);

    return {
        appLockEnabled,
        setAppLockEnabled,
        isUnlocked,
        requestUnlock,
    };
}
