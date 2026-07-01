import { useEffect } from "react";
import { triggerMediumHaptic, triggerSuccessHaptic } from "@/lib/mobile/haptics";

// The single headline celebration to show after a rollover. The parent picks
// the most significant milestone from computeMilestones' result.
export type MilestoneCelebration =
    | { kind: "debt-free" }
    | { kind: "paid-off"; debtName: string }
    | {
          kind: "progress";
          debtName: string;
          threshold: 25 | 50 | 75;
          progressPercent: number;
      };

type MilestoneBadgeProps = {
    celebration: MilestoneCelebration;
    onDismiss: () => void;
};

const CONFETTI_COLORS = [
    "#60a5fa",
    "#a855f7",
    "#34d399",
    "#fbbf24",
    "#f472b6",
    "#38bdf8",
];

// Deterministic pseudo-random so the burst looks organic yet stays render-pure
// and SSR-stable (no Math.random during render).
function seededRandom(seed: number) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

function ConfettiBurst({ pieceCount }: { pieceCount: number }) {
    const pieces = Array.from({ length: pieceCount }, (_, i) => ({
        left: seededRandom(i) * 100,
        delay: seededRandom(i + 100) * 0.5,
        duration: 1.6 + seededRandom(i + 200) * 1.1,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
    }));

    return (
        <div className="milestone-confetti" aria-hidden="true">
            {pieces.map((piece, i) => (
                <span
                    key={i}
                    className={`milestone-confetti-piece${piece.round ? " round" : ""}`}
                    style={{
                        left: `${piece.left}%`,
                        background: piece.color,
                        animationDelay: `${piece.delay}s`,
                        animationDuration: `${piece.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}

export function MilestoneBadge({ celebration, onDismiss }: MilestoneBadgeProps) {
    const isBig = celebration.kind === "debt-free" || celebration.kind === "paid-off";

    // A distinct celebratory pulse when the moment lands - medium for a payoff
    // / debt-free, a lighter success tap for a progress milestone.
    useEffect(() => {
        if (isBig) {
            void triggerMediumHaptic();
        } else {
            void triggerSuccessHaptic();
        }
    }, [isBig]);

    const content = (() => {
        if (celebration.kind === "debt-free") {
            return {
                emoji: "🎉",
                eyebrow: "Debt Free",
                title: "You did it.",
                highlight: "Every debt paid off",
                body: "You've cleared everything you were tracking. This is the whole goal — take the win.",
                cta: "Amazing!",
            };
        }
        if (celebration.kind === "paid-off") {
            return {
                emoji: "🏆",
                eyebrow: "Debt Paid Off",
                title: "Paid in full!",
                highlight: celebration.debtName,
                body: "One debt down for good. That balance is gone — momentum is on your side.",
                cta: "Let's keep going",
            };
        }
        return {
            emoji: celebration.threshold >= 75 ? "🔥" : "✨",
            eyebrow: `${celebration.threshold}% Paid Off`,
            title: "Milestone reached!",
            highlight: celebration.debtName,
            body: `You've paid down ${celebration.progressPercent}% of this debt. Keep the streak alive.`,
            cta: "Nice — continue",
        };
    })();

    return (
        <div
            className="milestone-overlay"
            onClick={onDismiss}
            role="dialog"
            aria-modal="true"
            aria-label={`${content.eyebrow}: ${content.highlight}`}
        >
            <div
                className={`milestone-card${isBig ? " milestone-card-major" : ""}`}
                onClick={(event) => event.stopPropagation()}
            >
                {isBig && <ConfettiBurst pieceCount={celebration.kind === "debt-free" ? 28 : 20} />}

                <div className="milestone-emoji" aria-hidden="true">
                    {content.emoji}
                </div>

                <span className="milestone-eyebrow">{content.eyebrow}</span>
                <h2 className="milestone-title">{content.title}</h2>
                <strong className="milestone-highlight">{content.highlight}</strong>
                <p className="milestone-body">{content.body}</p>

                <button
                    type="button"
                    className="primary-plan-button milestone-cta"
                    onClick={onDismiss}
                >
                    {content.cta}
                </button>
            </div>
        </div>
    );
}
