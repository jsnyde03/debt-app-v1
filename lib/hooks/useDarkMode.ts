import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { loadStoredState } from "@/lib/storage/loadStoredState";

export function useDarkMode() {
    const [darkMode, setDarkMode] = useState(() => loadStoredState("debtPlanner.darkMode", false));

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
