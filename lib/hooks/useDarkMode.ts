import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { readKeyValue, writeKey } from "@/lib/storage/safeStorage";

export type ThemePreference = "system" | "light" | "dark";

export function useDarkMode() {
    const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
        const stored = readKeyValue<ThemePreference | boolean | null>("debtPlanner.darkMode", null);
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
        writeKey("debtPlanner.darkMode", themePreference);
    }, [themePreference]);

    useEffect(() => {
        // Sync the resolved theme onto <html> so the body / overscroll backdrop follows the user's
        // EXPLICIT choice — the single source of truth — instead of the OS prefers-color-scheme
        // (which conflicted: a Light choice on a dark-OS device left a dark backdrop behind a light
        // app). A distinct class name from `.dark-theme` (which lives on <main.app> and drives the
        // descendant-scoped content CSS) keeps this root-level backdrop rule out of that cascade.
        // globals.css maps these to the same colors as the native StatusBar below, so the web
        // backdrop and native chrome stay in lockstep. Also covers the pre-mount AppSkeleton /
        // AppLockScreen phases, where <main.app> isn't in the tree yet.
        const root = document.documentElement;
        root.classList.toggle("theme-dark", darkMode);
        root.classList.toggle("theme-light", !darkMode);

        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);

        StatusBar.setStyle({
            style: darkMode ? Style.Dark : Style.Light,
        }).catch(() => undefined);

        StatusBar.setBackgroundColor({ color: darkMode ? "#07111f" : "#eef3f8" }).catch(() => undefined);
    }, [darkMode]);

    return { darkMode, themePreference, setThemePreference };
}
