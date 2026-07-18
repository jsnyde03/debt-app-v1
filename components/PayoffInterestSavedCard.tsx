import { formatCurrency } from "@core/utils/formatCurrency";
import type { InterestSaved } from "@/lib/debt/computeInterestSaved";

function formatMonths(months: number): string {
    if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
    return `${Math.round(months / 12)} years`;
}

/**
 * Interest-Saved Momentum Ledger — the FREE headline. Shows what the current
 * payoff plan saves vs. paying only minimums (the motivating core value, never
 * paywalled). Renders nothing when there's no meaningful saving to claim.
 */
export function PayoffInterestSavedCard({ interestSaved }: { interestSaved: InterestSaved }) {
    if (interestSaved.kind === "none") return null;

    if (interestSaved.kind === "payoff-enabling") {
        return (
            <div className="interest-saved-card interest-saved-enabling" aria-label="Interest saved">
                <span className="interest-saved-eyebrow">Your plan is working</span>
                <p className="interest-saved-enabling-line">
                    Minimum payments alone would <strong>never</strong> clear your debt — your plan gets
                    you debt-free by <strong>{interestSaved.debtFreeDate}</strong>.
                </p>
            </div>
        );
    }

    return (
        <div className="interest-saved-card" aria-label="Interest saved">
            <span className="interest-saved-eyebrow">Paying extra saves you</span>
            <div className="interest-saved-amount">{formatCurrency(interestSaved.interestSaved)}</div>
            <p className="interest-saved-sub">
                in interest
                {interestSaved.monthsSaved > 0 && (
                    <>
                        {" "}and <strong>{formatMonths(interestSaved.monthsSaved)}</strong>
                    </>
                )}{" "}
                vs. minimum payments
            </p>
        </div>
    );
}
