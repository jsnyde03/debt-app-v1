import { applyDebtPaymentProjection } from "./applyDebtPaymentProjection";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

/**
 * Projection auto-maintenance core (v1.7 Phase 2.3) — the "always-current balances, no typing"
 * math. The persisted `balance` is the user's LAST-VERIFIED value as of `lastVerifiedDate` (the
 * trust anchor; it only moves on confirm/correct). This projects that anchor forward to `asOfDate`
 * so premium users see a live number between verifications — always shown labelled "estimated ·
 * verified {date}", never as synced fact.
 *
 * Model choice: month-stepped (calculateMonthlyInterest / applyDebtPaymentProjection), the
 * display/trajectory family — NOT the per-cycle rollover model (calculateCycleInterest). The
 * projection is a DISPLAY projection, so it must reconcile with the payoff trajectory the user
 * already sees. Pure + deterministic (UTC day math, no Date.now) → reconciliation-tested.
 */

const DAYS_PER_MONTH = 365.25 / 12; // 30.4375 — same constant computeDrift uses

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * UTC day difference b − a for YYYY-MM-DD dates. Parsed as UTC so the count is pure day arithmetic:
 * timezone-independent (an estimate must read the same everywhere) and DST-safe. Mirrors computeDrift.
 */
function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(`${aIso}T00:00:00Z`);
  const b = Date.parse(`${bIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return (b - a) / 86400000;
}

/** The fields the projection reads from a Debt — kept structural so callers can pass a partial. */
export interface ProjectableDebt {
  /** The current best-known balance (the projection anchor value). */
  balance: number;
  apr: number;
  minimumPayment: number;
  type?: "debt" | "bnpl";
  /** The projection ANCHOR date — when `balance` is current as-of (advances at rollover + user verify). */
  balanceAsOfDate?: string;
  /** The last USER confirmation date — drives staleness + the label, NOT the projection math. */
  lastVerifiedDate?: string;
}

/**
 * Project the anchor balance forward to `asOfDate`, assuming the minimum payment is made each
 * month — the conservative "if you just paid the minimum" estimate. It biases the number HIGH
 * (never understating what's owed): whole elapsed months apply a full interest+minimum step, and
 * the trailing partial month accrues PRORATED INTEREST ONLY (a payment posts at the month boundary,
 * so mid-month the balance only ticks up — the safe direction). BNPL never accrues interest.
 * Returns the anchor unchanged when unverified, when `asOfDate` is at/before the anchor, or when the
 * anchor is already $0.
 */
export function projectCurrentBalance(debt: ProjectableDebt, asOfDate: string): number {
  const anchor = roundMoney(Math.max(0, debt.balance));
  if (anchor <= 0) return 0;
  // Project from the balance's as-of date. Fall back to lastVerifiedDate for pre-split blobs; absent
  // both → no projection (show the anchor as-is).
  const anchorDate = debt.balanceAsOfDate ?? debt.lastVerifiedDate;
  if (!anchorDate) return anchor;

  const totalMonths = daysBetween(anchorDate, asOfDate) / DAYS_PER_MONTH;
  if (totalMonths <= 0) return anchor; // asOf at/before the anchor → nothing to project

  const apr = debt.type === "bnpl" ? 0 : debt.apr;
  const wholeMonths = Math.floor(totalMonths);
  const frac = totalMonths - wholeMonths;

  let balance = anchor;
  for (let m = 0; m < wholeMonths; m++) {
    if (balance <= 0) return 0;
    balance = applyDebtPaymentProjection({ balance, apr, payment: debt.minimumPayment }).projectedBalance;
  }
  if (frac > 0 && balance > 0) {
    balance = roundMoney(balance + calculateMonthlyInterest(balance, apr) * frac);
  }
  return roundMoney(Math.max(0, balance));
}

/**
 * Route a debts array off the last-verified anchor and onto its projected-to-`asOfDate` position:
 * each `balance` becomes the `projectCurrentBalance` estimate, and `balanceAsOfDate` is re-stamped to
 * `asOfDate` so re-projecting the result is a no-op (idempotent). Every other field passes through
 * untouched — `lastVerifiedDate` in particular is preserved, so staleness + labels stay honest. This
 * is the seam that lets the payday ENGINE (allocation / debt-free date / trajectory / cushion / drift)
 * compute from "where the user actually is" between verifications — the compute-side completion of
 * projection auto-maintenance (2.3 routed the display; 2.4 routes the engine). Pure; premium-gated at
 * the caller (free never projects).
 */
export function projectDebtsToDate<T extends ProjectableDebt>(debts: T[], asOfDate: string): T[] {
  return debts.map((debt) => ({
    ...debt,
    balance: projectCurrentBalance(debt, asOfDate),
    balanceAsOfDate: asOfDate,
  }));
}

/**
 * True when a debt whose anchor is still > $0 projects down to $0 as of `asOfDate` — i.e. it LOOKS
 * paid off but hasn't been confirmed. This is the trigger for the payoff verification gate (2.3.6):
 * we celebrate the moment provisionally but only write the permanent record on a confirmed $0. A
 * debt whose anchor is already $0 is confirmed-paid-off, not "projected", so it returns false.
 */
export function isDebtProjectedPaidOff(debt: ProjectableDebt, asOfDate: string): boolean {
  return debt.balance > 0 && projectCurrentBalance(debt, asOfDate) <= 0;
}

/** How stale an estimate is. `stale` is the gate for the Payday Autopilot re-verify prompt (2.3.5). */
export type EstimateStaleness = "fresh" | "aging" | "stale";

// Tunable — validate against real usage (Phase 6). Defaults lean RARE: for a biweekly user the
// re-verify prompt surfaces roughly every third payday for an untouched debt, not every cycle.
export const ESTIMATE_AGING_DAYS = 30;
export const ESTIMATE_STALE_DAYS = 45;

export interface EstimateConfidence {
  daysSinceVerified: number;
  staleness: EstimateStaleness;
  /** projected − anchor: how far the estimate has moved since last verified (+ interest-led, − paid down). */
  drift: number;
}

/** Confidence in a debt's current estimate, driven by how long since it was last verified. */
export function computeEstimateConfidence(debt: ProjectableDebt, asOfDate: string): EstimateConfidence {
  const daysSinceVerified = debt.lastVerifiedDate
    ? Math.max(0, Math.floor(daysBetween(debt.lastVerifiedDate, asOfDate)))
    : 0;
  const staleness: EstimateStaleness =
    daysSinceVerified >= ESTIMATE_STALE_DAYS ? "stale" : daysSinceVerified >= ESTIMATE_AGING_DAYS ? "aging" : "fresh";
  const drift = roundMoney(projectCurrentBalance(debt, asOfDate) - roundMoney(Math.max(0, debt.balance)));
  return { daysSinceVerified, staleness, drift };
}
