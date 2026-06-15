import { useRef, useState, type ReactNode, type TouchEvent } from "react";
import { triggerLightHaptic, triggerSuccessHaptic } from "@/lib/mobile/haptics";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;

type PullToRefreshProps = {
    className: string;
    onRefresh: () => void | Promise<void>;
    children: ReactNode;
};

export function PullToRefresh({ className, onRefresh, children }: PullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const startYRef = useRef<number | null>(null);
    const triggeredRef = useRef(false);

    function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
        if (isRefreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            startYRef.current = null;
            return;
        }

        startYRef.current = event.touches[0].clientY;
        triggeredRef.current = false;
        setIsDragging(true);
    }

    function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
        if (startYRef.current === null || isRefreshing) return;

        const delta = event.touches[0].clientY - startYRef.current;

        if (delta <= 0) {
            setPullDistance(0);
            return;
        }

        const distance = Math.min(MAX_PULL, delta * 0.5);
        setPullDistance(distance);

        if (distance >= PULL_THRESHOLD && !triggeredRef.current) {
            triggeredRef.current = true;
            void triggerLightHaptic();
        }
    }

    async function handleTouchEnd() {
        if (startYRef.current === null) {
            return;
        }

        const shouldRefresh = pullDistance >= PULL_THRESHOLD;
        startYRef.current = null;
        setIsDragging(false);

        if (!shouldRefresh) {
            setPullDistance(0);
            return;
        }

        setIsRefreshing(true);
        setPullDistance(PULL_THRESHOLD);

        try {
            await onRefresh();
        } finally {
            await triggerSuccessHaptic();
            setIsRefreshing(false);
            setPullDistance(0);
        }
    }

    const progress = Math.min(1, pullDistance / PULL_THRESHOLD);

    return (
        <div
            ref={containerRef}
            className={className}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <div
                className={`pull-refresh-zone${isDragging ? " dragging" : ""}${isRefreshing ? " refreshing" : ""}`}
                style={{ height: `${pullDistance}px` }}
            >
                <span
                    className="pull-refresh-spinner"
                    style={!isRefreshing ? { opacity: progress, transform: `rotate(${progress * 360}deg)` } : undefined}
                />
            </div>

            {children}
        </div>
    );
}
