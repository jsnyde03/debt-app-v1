import { useState, type PointerEvent, type ReactNode } from "react";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";

type SwipeAction = {
    label: string;
    onTrigger: () => void;
    tone?: "positive" | "warning" | "danger";
};

type SwipeActionCardProps = {
    className: string;
    children: ReactNode;
    leftAction?: SwipeAction;
    rightAction?: SwipeAction;
    disabled?: boolean;
};

const SWIPE_THRESHOLD = 82;
const MAX_SWIPE = 112;

export function SwipeActionCard({ className, children, leftAction, rightAction, disabled = false, }: SwipeActionCardProps) {
    const [startX, setStartX] = useState<number | null>(null);
    const [offsetX, setOffsetX] = useState(0);
    const [thresholdTriggered, setThresholdTriggered] = useState(false);

    function isInteractiveTarget(target: EventTarget | null) {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return Boolean(target.closest("button") || target.closest("input") || target.closest("select") || target.closest("textarea"));
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        if (disabled || isInteractiveTarget(event.target) || (!leftAction && !rightAction)) {
            return;
        }

        setStartX(event.clientX);
        setOffsetX(0);
        setThresholdTriggered(false);
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (startX === null) {
            return;
        }

        const rawOffset = event.clientX - startX;

        const nextOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, rawOffset));

        if (nextOffset > 0 && !leftAction) {
            setOffsetX(0);
            return;
        }

        if (nextOffset < 0 && !rightAction) {
            setOffsetX(0);
            return;
        }

        setOffsetX(nextOffset);

        if (!thresholdTriggered && Math.abs(nextOffset) >= SWIPE_THRESHOLD) {
            setThresholdTriggered(true);
            triggerLightHaptic();
        }
    }
    
    function handlePointerUp() {
        if (startX === null) {
            return;
        }

        const shouldTriggerLeft = offsetX >= SWIPE_THRESHOLD && Boolean(leftAction);
        const shouldTriggerRight = offsetX <= -SWIPE_THRESHOLD && Boolean(rightAction);

        setStartX(null);
        setThresholdTriggered(false);
        setOffsetX(0);

        if (shouldTriggerLeft && leftAction) {
            triggerMediumHaptic();
            leftAction.onTrigger();
            return;
        }

        if (shouldTriggerRight && rightAction) {
            triggerMediumHaptic();
            rightAction.onTrigger();
        }
    }

    function handlePointerCancel() {
        setStartX(null);
        setThresholdTriggered(false);
        setOffsetX(0);
    }

    const activeAction = offsetX > 0 ? leftAction: offsetX < 0 ? rightAction : undefined;

    return (
        <div 
            className={[
                "swipe-action-shell",
                offsetX > 0 ? "is-swiping-left" : "",
                offsetX < 0 ? "is-swiping-right" : "",
            ].filter(Boolean).join(" ")}
        >

            {activeAction && (
                <div
                    className={[
                        "swipe-action-hint",
                        offsetX > 0 ? "swipe-action-hint-left" : "",
                        offsetX < 0 ? "swipe-action-hint-right" : "",
                        activeAction.tone
                            ? `swipe-action-hint-${activeAction.tone}`
                            : "",
                    ].filter(Boolean).join(" ")}
                >
                    {offsetX > 0 ? "→ " : ""}
                    {activeAction.label}
                    {offsetX < 0 ? " ←" : ""}
                </div>
            )}
            {leftAction && (
                <div
                    className={[
                        "swipe-action-background",
                        "swipe-action-left",
                        leftAction.tone
                            ? `swipe-action-${leftAction.tone}`
                            : "",
                    ].filter(Boolean).join(" ")}
                >
                    <span>{leftAction.label}</span>
                </div>
            )}

            {rightAction && (
                <div
                    className={[
                        "swipe-action-background",
                        "swipe-action-right",
                        rightAction.tone
                            ? `swipe-action-${rightAction.tone}`
                            : "",
                    ].filter(Boolean).join(" ")}
                >
                    <span>{rightAction.label}</span>
                </div>
            )}

            <div
                className={`${className} swipe-action-foreground`}
                style={
                    {
                        "--swipe-x": `${offsetX}px`,
                    } as React.CSSProperties
                }
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
            >
                {children}
            </div>
        </div>
    )
}