/**
 * Vendor-agnostic premium/IAP facade. Feature code (the paywall, the entitlement sync) imports only
 * this file; the real RevenueCat SDK is attached at runtime by `purchasesClient.ts` via
 * `setPurchasesClient`. This keeps the module import-light so it (and everything that reads it) stays
 * web-safe and testable without pulling the native `react-native-purchases` TurboModule into the
 * tsx/web environment. With no client attached (web, local dev, tests, or a dev build) the facade
 * reports "not premium" and exposes no packages, so nothing native is ever required — and the dev
 * "Simulate Premium" toggle stays authoritative.
 *
 * Ported from the Gig app's proven facade; entitlement id `premium` matches Debt's existing
 * RevenueCat project (the same one the live Capacitor app uses — see docs/REVENUE_SPINE_MANUAL_SETUP).
 */

/** RevenueCat entitlement identifier the gate checks. MUST match the RevenueCat dashboard exactly. */
export const PREMIUM_ENTITLEMENT_ID = 'premium';

/** The non-consumable Lifetime product id (App Store Connect / RevenueCat). Used to tell a Lifetime
 * owner apart from a recurring subscriber so we never tell them to "manage a subscription" (A7). */
export const LIFETIME_PRODUCT_ID = 'paycheck_debt_planner_premium_lifetime';

/**
 * Minimal structural shapes this module depends on — intentionally a subset of the real SDK types
 * (`CustomerInfo`, `PurchasesPackage`) so this file imports nothing native and the real SDK objects
 * are still structurally assignable to them at the client boundary.
 */
export interface EntitlementInfoLike {
  identifier: string;
  /** The product that granted this entitlement — the real SDK's EntitlementInfo carries it. */
  productIdentifier?: string;
}

export interface CustomerInfoLike {
  entitlements: { active: Record<string, EntitlementInfoLike | undefined> };
}

export interface PackageLike {
  /** RevenueCat package identifier (e.g. "$rc_annual"). */
  identifier: string;
  /** "ANNUAL" | "MONTHLY" | "LIFETIME" | … — used to label the billing period on the paywall. */
  packageType: string;
  product: {
    /** Localized, currency-correct billed price string (e.g. "$29.99") — the paywall's hero value. */
    priceString: string;
    /** Raw price for any subordinate per-unit display. */
    price: number;
    title: string;
    identifier: string;
    /**
     * [P6.4.5 · audit L5-19] The introductory offer (free trial / discounted period), when the product
     * has one configured in App Store Connect.
     *
     * ⛔ **This field was not modelled at all, and that half of L5-19 is a defect regardless of the
     * trial decision:** if a trial IS configured in ASC, StoreKit applies it at purchase and the user is
     * charged nothing up front — while the paywall would still read "Start Premium — $29.99 per year"
     * and mention the trial nowhere. Whether 2.0 *offers* a trial is 🎯's call; whether the paywall can
     * *see* one is not.
     */
    introPrice?: {
      /** Localized price of the intro period ("$0.00" for a free trial). */
      priceString: string;
      price: number;
      /** e.g. 7 with `periodUnit: 'DAY'`. */
      periodNumberOfUnits: number;
      periodUnit: string;
    } | null;
  };
}

export interface PurchaseResult {
  customerInfo: CustomerInfoLike | null;
  /** True when the user backed out of Apple's purchase sheet — not an error to surface. */
  userCancelled: boolean;
}

export interface PurchasesClient {
  getCustomerInfo(): Promise<CustomerInfoLike>;
  /** Packages of the current offering, in display order; empty if none configured. */
  getDefaultPackages(): Promise<PackageLike[]>;
  purchase(pkg: PackageLike): Promise<PurchaseResult>;
  restore(): Promise<CustomerInfoLike>;
  /** Subscribe to entitlement changes (purchase/renewal/expiry); returns an unsubscribe fn. */
  addListener(listener: (info: CustomerInfoLike) => void): () => void;
}

let client: PurchasesClient | null = null;

/** Attach the real RevenueCat-backed client (or detach with `null`). Called once at startup. */
export function setPurchasesClient(next: PurchasesClient | null): void {
  client = next;
}

export function getPurchasesClient(): PurchasesClient | null {
  return client;
}

/**
 * Pure predicate: is the premium entitlement active in this CustomerInfo? `null` (no data yet, or
 * offline with no cache) is treated as not-premium; a failed network call never *downgrades* a known
 * plan because the entitlement sync only writes 'free' on a definitive not-active result.
 */
export function isPremiumActive(info: CustomerInfoLike | null): boolean {
  if (!info) return false;
  return info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
}

/** Is the ACTIVE premium entitlement the one-time Lifetime purchase (vs a recurring subscription)?
 * Drives the More-hub copy so a Lifetime owner isn't told to "manage your subscription" (A7). */
export function isLifetimeActive(info: CustomerInfoLike | null): boolean {
  const ent = info?.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  return ent?.productIdentifier === LIFETIME_PRODUCT_ID;
}
