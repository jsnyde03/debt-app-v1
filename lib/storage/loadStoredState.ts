export function loadStoredState<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;

    try {
        return JSON.parse(stored) as T;
    } catch {
        return fallback;
    }
}
