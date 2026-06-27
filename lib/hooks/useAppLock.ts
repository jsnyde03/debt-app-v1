import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";

// Only lock after the app has sat in the background this long - a brief
// switch to another app (notification, copy/paste, etc.) shouldn't force
// re-authentication every time.
const LOCK_GRACE_PERIOD_MS = 30_000;

function loadStoredState<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;

    try {
        return JSON.parse(stored) as T;
    } catch {
        return fallback;
    }
}

export function useAppLock() {
    const [appLockEnabled, setAppLockEnabledState] = useState(() =>
        loadStoredState("debtPlanner.appLockEnabled", false)
    );

    const [isUnlocked, setIsUnlocked] = useState(
        () => !loadStoredState("debtPlanner.appLockEnabled", false)
    );

    useEffect(() => {
        localStorage.setItem("debtPlanner.appLockEnabled", JSON.stringify(appLockEnabled));
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
        setIsUnlocked(!enabled);
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
