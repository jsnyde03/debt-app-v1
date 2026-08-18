import { router } from 'expo-router';
import { isDemoReachable } from '@/config/qa';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { notify } from '@/utils/confirm';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/screen';
import { useAppColors } from '@/hooks/use-app-colors';
import { MANAGE_SUBSCRIPTION_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/premium/legal';
import { getPurchasesClient, isPremiumActive, type PackageLike } from '@/premium/purchases';
import { canManageSubscription, premiumKind } from '@/premium/premiumKind';
import { appStore } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** What Premium unlocks — effort-not-info framing: each line is a job the app DOES for you, not a fact
 * it tells you (the un-chattable test). BNPL handling is intentionally NOT here — it's free/all-tiers. */
const PREMIUM_BENEFITS: { icon: IconGlyph; text: string }[] = [
  // ⛔ Was "holds your cushion at your line every payday" — which the NEXT bullet but one contradicts by
  // selling a Recovery Plan for when a cycle comes up short. Two claims on one screen, and the stronger
  // one was the promise being paid for (L1-3).
  { icon: 'shield', text: 'The Payday Guardian — works out how much to keep back each payday to protect your cushion, and reshapes the plan around it.' },
  { icon: 'shopping-cart', text: 'Can I Afford It? — apply any purchase to your plan in one tap, or build a plan to save for it.' },
  { icon: 'healing', text: 'Recovery Plan — a guided catch-up when a cycle comes up short.' },
  { icon: 'auto-graph', text: 'Always-current balances — projected forward or re-scanned in seconds, no monthly retyping.' },
];

/** Apple's required auto-renewable subscription disclosure (Guideline 3.1.2). Also scopes Lifetime:
 * it's a one-time purchase covering today's Premium — future add-on tiers are sold separately (A6). */
const AUTO_RENEW_DISCLOSURE =
  'Payment will be charged to your Apple Account at confirmation of purchase. Subscriptions ' +
  'automatically renew unless canceled at least 24 hours before the end of the current period. Your ' +
  'account is charged for renewal within 24 hours prior to the end of the current period. Manage or ' +
  'cancel anytime in your App Store account settings. Lifetime is a one-time purchase (not a ' +
  'subscription) that covers all current Premium features; any future add-on tiers, like bank ' +
  'connection or an AI coach, are sold separately.';

type PlanKey = 'annual' | 'lifetime' | 'monthly';

interface PlanView {
  key: PlanKey;
  title: string;
  /** The billed amount — the most prominent element per Guideline 3.1.2. */
  priceString: string;
  periodLabel: string;
  subnote: string;
  badge?: string;
  /** The real package to purchase; undefined in the static fallback (web / no SDK). */
  pkg?: PackageLike;
}

const LIFETIME_SUBNOTE = 'Pay once — all today’s Premium, forever';

/** Decided launch prices — shown ONLY when no live SDK is attached (web preview, dev) so the layout and
 * the web E2E / screenshots still render. On a real device these are replaced by RevenueCat's
 * currency-correct strings; if the live packages fail to load, we show an error (never these), so a
 * device user is never offered an unpurchasable price (A1). */
const STATIC_PLANS: PlanView[] = [
  { key: 'annual', title: 'Annual', priceString: '$29.99', periodLabel: 'per year', subnote: 'Billed yearly · just $2.50/mo', badge: 'Best value' },
  { key: 'lifetime', title: 'Lifetime', priceString: '$79.99', periodLabel: 'one time', subnote: LIFETIME_SUBNOTE, badge: 'Pay once' },
  { key: 'monthly', title: 'Monthly', priceString: '$4.99', periodLabel: 'per month', subnote: 'Billed monthly' },
];

const PLAN_ORDER: Record<PlanKey, number> = { annual: 0, lifetime: 1, monthly: 2 };

function planFromPackage(pkg: PackageLike): PlanView | null {
  switch (pkg.packageType) {
    case 'ANNUAL': {
      // Keep the per-month anchor on real devices too (A11) — it justifies the "Best value" badge. Derive
      // the currency symbol from the localized priceString so it isn't a hardcoded "$" on non-USD stores (R2.5).
      const sym = pkg.product.priceString.replace(/[\d.,\s ]/g, '') || '$';
      const perMo = pkg.product.price > 0 ? ` · just ${sym}${(pkg.product.price / 12).toFixed(2)}/mo` : '';
      return { key: 'annual', title: 'Annual', priceString: pkg.product.priceString, periodLabel: 'per year', subnote: `Billed yearly${perMo}`, badge: 'Best value', pkg };
    }
    case 'LIFETIME':
      return { key: 'lifetime', title: 'Lifetime', priceString: pkg.product.priceString, periodLabel: 'one time', subnote: LIFETIME_SUBNOTE, badge: 'Pay once', pkg };
    case 'MONTHLY':
      return { key: 'monthly', title: 'Monthly', priceString: pkg.product.priceString, periodLabel: 'per month', subnote: 'Billed monthly', pkg };
    default:
      return null;
  }
}

/**
 * §2.11.4/2.11.8 Premium paywall. Apple 3.1.2: billed price most prominent per plan, title/length/price,
 * auto-renew disclosure, tappable Terms(EULA)+Privacy, restore. Reads packages from the RevenueCat
 * facade. With NO SDK (web/dev) it renders the static-price fallback (demo). With the SDK attached but
 * packages failing to load, it shows an error+retry — never static, unpurchasable prices on a device (A1).
 */
export default function PaywallScreen() {
  const c = useAppColors();
  const isPremium = useAppStore((s) => s.store.subscriptionPlan === 'premium');
  const premiumIsLifetime = useAppStore((s) => s.premiumIsLifetime);
  // 3.7.A5 — has the entitlement actually resolved this launch? Offline it never does.
  const premiumResolved = useAppStore((s) => s.premiumResolved);
  const plan = useAppStore((s) => s.store.subscriptionPlan);
  const kind = premiumKind({ plan, premiumResolved, premiumIsLifetime });
  const client = getPurchasesClient();

  const [plans, setPlans] = useState<PlanView[]>(STATIC_PLANS);
  const [selectedKey, setSelectedKey] = useState<PlanKey>('annual');
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadPlans = useCallback(async () => {
    if (!client) {
      setLoadingPlans(false); // web / dev → the static-price fallback is intentional (demo/verify only)
      return;
    }
    setLoadingPlans(true);
    setLoadError(false);
    try {
      const packages = await client.getDefaultPackages();
      const mapped = packages.map(planFromPackage).filter((p): p is PlanView => p !== null);
      if (mapped.length > 0) {
        mapped.sort((a, b) => PLAN_ORDER[a.key] - PLAN_ORDER[b.key]);
        setPlans(mapped);
        // If the live offering lacks the preselected plan (e.g. no ANNUAL), select the first real one so
        // a row is always highlighted to match the CTA (R2.7).
        setSelectedKey((cur) => (mapped.some((p) => p.key === cur) ? cur : mapped[0].key));
      } else {
        // Client attached but the offering isn't "current"/has no mappable packages → fail loud, don't
        // masquerade static prices that can't be purchased on a real device (App Review 2.1 + revenue).
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoadingPlans(false);
    }
  }, [client]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const selected = useMemo(() => plans.find((p) => p.key === selectedKey) ?? plans[0], [plans, selectedKey]);
  const busy = purchasing || restoring;

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      /* ignore — a dead link is better than a crash */
    }
  }

  async function handleSubscribe() {
    if (!selected?.pkg || !client) {
      notify('Not available here', 'In-app purchases aren’t available in this preview — try it on your device.');
      return;
    }
    setPurchasing(true);
    try {
      const result = await client.purchase(selected.pkg);
      if (result.userCancelled) return;
      if (isPremiumActive(result.customerInfo)) {
        appStore.getState().setSubscriptionPlan('premium');
        notify('You’re Premium 🎉', 'Your premium tools are unlocked.');
        router.back();
      } else {
        // Purchased at StoreKit but the entitlement didn't come back active (mapping issue) — don't leave
        // the user charged-and-confused with a silent no-op.
        notify('Almost there', 'Your purchase went through, but Premium couldn’t be confirmed yet. Tap Restore, or contact support if it persists.');
      }
    } catch (error) {
      notify('Purchase didn’t complete', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (!client) {
      notify('Not available here', 'Restoring purchases isn’t available in this preview.');
      return;
    }
    setRestoring(true);
    try {
      const info = await client.restore();
      if (isPremiumActive(info)) {
        appStore.getState().setSubscriptionPlan('premium');
        notify('Purchases restored', 'Your premium access is back.');
        router.back();
      } else {
        notify('Nothing to restore', 'No active purchase was found for this Apple Account.');
      }
    } catch (error) {
      notify('Restore didn’t complete', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
  }

  const ctaLabel = purchasing
    ? 'Starting…'
    : selected?.key === 'lifetime'
      ? `Unlock Premium — ${selected?.priceString}`
      : `Start Premium — ${selected?.priceString ?? ''} ${selected?.periodLabel ?? ''}`.trim();

  return (
    // [C9] — `canGoBack()` before `back()`. A bare `router.back()` no-ops when this screen is the only
    // entry on the stack, which strands the user on a paywall with a dead control. That happened for real
    // when the demo exited straight here, and it is the same cold-entry shape 3.7.A0 already fixed on the
    // schedule route. `/onboarding` rather than a tab: someone who reaches the paywall with no history is
    // pre-purchase, and has no plan to go back to.
    <Screen title="Premium" onBack={() => (router.canGoBack() ? router.back() : router.replace('/onboarding'))}>
      <View style={styles.hero}>
        <AppIcon name="workspace-premium" size={30} color={c.accent.primary} />
        <Text style={[textStyles.title2, styles.heroTitle, { color: c.text.primary }]}>Every payday, worked out for you</Text>
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
          {/* ⛔ Was "Debt payoff on autopilot" / "the app does the manual parts". The product says the
              opposite in two other places — "Your Guardian suggests — it never moves your money" and
              "Your call" — so the purchase screen was promising the one thing the app refuses to do.
              Not moving your money is the DIFFERENTIATOR; selling against it was the error (L1-2). */}
          The app does the arithmetic — the money moves stay yours.
        </Text>
      </View>

      <View style={styles.benefits}>
        {PREMIUM_BENEFITS.map((b) => (
          <View key={b.text} style={styles.benefitRow}>
            <AppIcon name={b.icon} size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.flex1, { color: c.text.primary }]}>{b.text}</Text>
          </View>
        ))}
      </View>

      {/* A12 — the moat at the point of conversion, honestly scoped to financial data (A10). */}
      <View style={styles.trust}>
        <AppIcon name="lock" size={16} color={c.text.tertiary} />
        <Text style={[textStyles.caption, styles.flex1, { color: c.text.secondary }]}>
          Private by design — your financial data never leaves your device, and you’ll never be sold more debt.
        </Text>
      </View>

      {isPremium ? (
        // Already premium (A3) — no re-purchase; confirm + offer management, never a second charge.
        <>
          <View style={[styles.premiumBanner, { backgroundColor: c.background.secondary, borderColor: c.border.default }]}>
            <AppIcon name="check-circle" size={20} color={c.accent.primary} />
            <Text style={[textStyles.bodyMedium, styles.flex1, { color: c.text.primary }]}>
              {/* 3.7.A5 — only name the KIND once RevenueCat has answered; offline it never does. */}
              {kind === 'lifetime' ? 'You’re on Premium — Lifetime. Thanks for the support.' : 'You’re on Premium — thanks for the support.'}
            </Text>
          </View>
          {/* Lifetime has no subscription to manage — don't deep-link to the (empty) App Store subs page (R2.3).
              3.7.A5: withheld while unresolved too, since it might be a Lifetime owner. */}
          {!canManageSubscription(kind) ? null : (
            <Button label="Manage subscription" variant="secondary" onPress={() => void openLink(MANAGE_SUBSCRIPTION_URL)} />
          )}
        </>
      ) : loadingPlans ? (
        <ActivityIndicator color={c.accent.primary} style={styles.loading} />
      ) : loadError ? (
        // A1 — client attached but no purchasable packages: fail loud, never offer static prices here.
        <View style={[styles.errorCard, { backgroundColor: c.background.secondary, borderColor: c.border.default }]}>
          <Text style={[textStyles.subhead, styles.flex1, { color: c.text.primary }]}>
            Plans couldn’t load right now. Check your connection and try again.
          </Text>
          <Button label="Retry" variant="secondary" onPress={() => void loadPlans()} disabled={busy} />
        </View>
      ) : (
        <>
          <View style={styles.plans}>
            {plans.map((plan) => {
              const isSel = plan.key === selectedKey;
              return (
                <Pressable
                  key={plan.key}
                  onPress={() => setSelectedKey(plan.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSel }}
                  accessibilityLabel={`${plan.title}${plan.badge ? `, ${plan.badge}` : ''}, ${plan.priceString} ${plan.periodLabel}. ${plan.subnote}`}
                  style={[
                    styles.planRow,
                    { backgroundColor: c.background.secondary, borderColor: isSel ? c.accent.primary : c.border.default },
                    isSel && { borderWidth: 2 },
                  ]}>
                  <View style={[styles.radio, { borderColor: isSel ? c.accent.primary : c.border.default }, isSel && { backgroundColor: c.accent.primary }]}>
                    {isSel ? <AppIcon name="check" size={13} color={c.text.onAccent} /> : null}
                  </View>
                  <View style={styles.planMid}>
                    <View style={styles.planTitleRow}>
                      <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{plan.title}</Text>
                      {plan.badge ? (
                        <View style={[styles.badge, { backgroundColor: c.accent.primary }]}>
                          <Text style={[textStyles.caption, { color: c.text.onAccent, fontWeight: '700' }]}>{plan.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{plan.subnote}</Text>
                  </View>
                  <View style={styles.planPrice}>
                    {/* Billed amount = the most conspicuous element (Guideline 3.1.2). */}
                    <Text style={[styles.priceText, { color: c.text.primary }]}>{plan.priceString}</Text>
                    <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{plan.periodLabel}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button label={ctaLabel} onPress={handleSubscribe} disabled={busy} />
        </>
      )}

      {/* 3.5.4.7 — "show me" for someone who won't buy on description alone. Placed BELOW the CTA and
          above Restore: it is an alternative to deciding now, not a competing primary.
          ⚠️ Withheld where the demo isn't reachable — `isDemoReachable()` is the one definition, so this
          entry cannot outlive its destination. */}
      {isDemoReachable() ? (
        <Pressable
          onPress={() => router.push('/demo?from=paywall')}
          disabled={busy}
          accessibilityRole="button"
          style={styles.restore}>
          <Text style={[textStyles.subhead, { color: c.accent.primary }]}>See it in action</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={handleRestore} disabled={busy} accessibilityRole="button" style={styles.restore}>
        <Text style={[textStyles.subhead, { color: c.accent.primary }]}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
      </Pressable>

      <Text style={[textStyles.caption, styles.disclosure, { color: c.text.tertiary }]}>{AUTO_RENEW_DISCLOSURE}</Text>

      <View style={styles.legalRow}>
        <Pressable onPress={() => openLink(TERMS_OF_USE_URL)} hitSlop={8} accessibilityRole="link">
          <Text style={[textStyles.caption, styles.legalLink, { color: c.text.secondary }]}>Terms of Use (EULA)</Text>
        </Pressable>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>·</Text>
        <Pressable onPress={() => openLink(PRIVACY_POLICY_URL)} hitSlop={8} accessibilityRole="link">
          <Text style={[textStyles.caption, styles.legalLink, { color: c.text.secondary }]}>Privacy Policy</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  hero: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.sm },
  heroTitle: { textAlign: 'center', marginTop: spacing.xs },
  premiumBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth },
  benefits: { gap: spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  trust: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loading: { marginVertical: spacing.xl },
  errorCard: { gap: spacing.md, padding: spacing.md, borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth },
  plans: { gap: spacing.sm },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  planMid: { flex: 1, gap: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { borderRadius: layout.pillRadius ?? 999, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  planPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  restore: { alignItems: 'center', paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' },
  disclosure: { textAlign: 'center' },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  legalLink: { textDecorationLine: 'underline' },
});
