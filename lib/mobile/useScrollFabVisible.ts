import { useEffect, useState } from "react";

export function useScrollFabVisible(threshold = 240) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const container = document.querySelector(".app-content");
        if (!container) return;

        function handleScroll() {
            setVisible(container!.scrollTop > threshold);
        }

        container.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => container.removeEventListener("scroll", handleScroll);
    }, [threshold]);

    return visible;
}
