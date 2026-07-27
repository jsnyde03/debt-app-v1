/**
 * §2.11.7 — launch control for the premium purchase path.
 *
 * Unlike a brand-new tier (which would default OFF until its value is proven — the
 * don't-launch-until-worth-the-price rule), Debt Premium is ALREADY live (v1.6, Capacitor, $4.99/mo),
 * and the whole v1.7 Elevation ships as ONE release gated on Jason's satisfaction. So this defaults ON,
 * matching live reality. It's a KILL-SWITCH: set false to hide every paywall entry (the More-hub row +
 * the in-context invites) and unlink the paywall — e.g. to ship an internal/testing build that doesn't
 * offer purchases.
 *
 * ⚠️ If you set this false, do NOT submit In-App Purchases for that build's App Review — a hidden
 * paywall alongside IAP metadata is exactly the "reviewer can't find the paywall" Guideline 2.1
 * rejection Debt hit on v1.1. The real "is v1.7's elevated premium worth it?" judgment is the
 * whole-release gate, not this flag.
 */
export const PREMIUM_PURCHASABLE = true;
