import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { loadStoredState } from "@/lib/storage/loadStoredState";

export type ThemePreference = "system" | "light" | "dark";

export function useDarkMode() {
    const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
        const stored = loadStoredState<ThemePreference | boolean | null>("debtPlanner.darkMode", null);
        if (stored === null) return "system";
        if (typeof stored === "boolean") return stored ? "dark" : "light";
        return stored;
    });

    const [systemDark, setSystemDark] = useState(() =>
        typeof window !== "undefined"
            ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false)
            : false
    );

    useEffect(() => {
        const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mql) return;
        function handleChange(e: MediaQueryListEvent) {
            setSystemDark(e.matches);
        }
        mql.addEventListener("change", handleChange);
        return () => mql.removeEventListener("change", handleChange);
    }, []);

    const darkMode = themePreference === "dark" || (themePreference === "system" && systemDark);

    useEffect(() => {
        localStorage.setItem("debtPlanner.darkMode", JSON.stringify(themePreference));
    }, [themePreference]);

    useEffect(() => {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);

        StatusBar.setStyle({
            style: darkMode ? Style.Dark : Style.Light,
        }).catch(() => undefined);

        StatusBar.setBackgroundColor({ color: darkMode ? "#07111f" : "#eef3f8" }).catch(() => undefined);
    }, [darkMode]);

    return { darkMode, themePreference, setThemePreference };
}
