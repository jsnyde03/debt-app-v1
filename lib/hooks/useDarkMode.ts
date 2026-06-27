import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { loadStoredState } from "@/lib/storage/loadStoredState";

export function useDarkMode() {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        const stored = loadStoredState<boolean | null>("debtPlanner.darkMode", null);
        if (stored !== null) return stored;
        return typeof window !== "undefined"
            ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false)
            : false;
    });

    useEffect(() => {
        localStorage.setItem("debtPlanner.darkMode", JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);

        StatusBar.setStyle({
            style: darkMode ? Style.Dark : Style.Light,
        }).catch(() => undefined);

        StatusBar.setBackgroundColor({ color: darkMode ? "#07111f" : "#eef3f8", }).catch(() => undefined);
    }, [darkMode]);

    return { darkMode, setDarkMode };
}
