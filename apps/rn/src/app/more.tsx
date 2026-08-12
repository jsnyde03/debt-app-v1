import Constants from 'expo-constants';
import { router } from 'expo-router';
import { tutorialRunFor } from '@/store/tutorialSelectors';
import { startTutorial } from '@/store/tutorialSession';
import { useState } from 'react';
import { InteractionManager, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { ExportBackupSheet, ImportBackupSheet } from '@/components/more/BackupSheets';
import { SettingGroup, SettingRow } from '@/components/more/SettingRow';
import { requestNotificationPermission } from '@/notifications/notifications';
import { Screen, Section } from '@/components/screen';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { TextField } from '@/components/ui/TextField';
import { MAX_DISPLAY_NAME, normalizeDisplayName } from '@/store/greeting';
import type { ThemeMode } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { resetCoachMarks } from '@/store/coachMarks';
import { useAppStore } from '@/store/useAppStore';
import { useLayout } from '@/hooks/use-layout';
import { QA_TOOLS } from '@/config/qa';
import { LiveActivityQA } from '@/components/more/LiveActivityQA';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { PREMIUM_PURCHASABLE } from '@/premium/config';
import { canManageSubscription, premiumKind } from '@/premium/premiumKind';
import { MANAGE_SUBSCRIPTION_URL, PRIVACY_POLICY_URL, SUPPORT_URL, TERMS_OF_USE_URL } from '@/premium/legal';

const LINKS = {
  privacy: PRIVACY_POLICY_URL,
  terms: TERMS_OF_USE_URL,
  support: SUPPORT_URL,
  subscription: MANAGE_SUBSCRIPTION_URL,
};

const APP_VERSION = Constants.expoConfig?.version ?? '—';

/**
 * The "More" hub (ratified IA EVOLVE) — replaces the old Settings gear, organized by purpose:
 * Pay Cycle History (a destination, top) · Data (backup/reset) · Preferences (real settings) · About.
 * Not here (per the IA verdict): paycheck editing + rollover live on Plan. iCloud backup + the native
 * file-based share/picker + real notification/biometric activation land at B.9 / Phase C.
 */
export default function MoreScreen() {
  const c = useAppColors();
  const prefs = useAppStore((s) => s.store.prefs);
  // 3.7.B.2 — a draft seeded once from the stored value; committed on blur (see the field below).
  const [nameDraft, setNameDraft] = useState(prefs.displayName ?? '');
  const plan = useAppStore((s) => s.store.subscriptionPlan);
  const premiumIsLifetime = useAppStore((s) => s.premiumIsLifetime);
  // 3.7.A5 — has the entitlement actually resolved this launch? Offline it never does.
  const premiumResolved = useAppStore((s) => s.premiumResolved);
  const kind = premiumKind({ plan, premiumResolved, premiumIsLifetime });
  const { isExpanded } = useLayout(); // 3.6.5 — a wider settings column on iPad
  const [sheet, setSheet] = useState<'export' | 'import' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // 3.5.5.3 — the reset is instantaneous and invisible (the next mark appears on some other screen,
  // later), so the row confirms in place. Without it the tap reads as a no-op and gets repeated.
  const [tipsReset, setTipsReset] = useState(false);

  // Enabling requires OS permission first — only flip the pref if granted (a denied prompt leaves it
  // off). Disabling flips immediately; the sync hook then cancels the schedule. (Web: permission
  // returns false, so the toggle stays off — notifications are native-only.)
  async function handleNotificationsToggle(next: boolean) {
    if (!next) {
      appStore.getState().updatePrefs({ notificationsEnabled: false });
      return;
    }
    const granted = await requestNotificationPermission();
    if (granted) appStore.getState().updatePrefs({ notificationsEnabled: true });
  }

  // Reset flips `onboardingComplete=false`, which makes the root Stack.Protected guard swap
  // tabs→onboarding. Doing that while More is pushed would orphan this screen with a dead back
  // stack (Freedom RN lesson #6), so DISMISS to the still-mounted tabs FIRST, then reset once the
  // pop settles.
  function handleDeleteAll() {
    setConfirmingDelete(false);
    router.back();
    InteractionManager.runAfterInteractions(() => appStore.getState().reset());
  }

  return (
    // 3.6.5 — a wider settings column on iPad (a clean, appropriate treatment for a settings list; a
    // fuller two-column/section-split is a noted future enhancement).
    <Screen title="More" onBack={() => router.back()} maxWidth={isExpanded ? 680 : undefined}>
      {/* Trust moment (the moat) — the first thing you see: honest, on-device, never sells you debt. */}
      <TrustCard />

      {/* Premium entry — the ALWAYS-VISIBLE, obvious path to the paywall. Kept high + clearly labeled so
          an App Review tester (and any free user) can always find it without triggering a premium moment
          — the fix for the v1.1 "couldn't find the paywall" rejections. Premium users get manage-sub. */}
      {plan === 'premium' || PREMIUM_PURCHASABLE ? (
        <SettingGroup>
          {plan === 'premium' ? (
            // 3.7.A5 — THREE states, not two; the rule lives in `premiumKind` so this screen and the
            // paywall cannot drift apart on it.
            kind === 'unresolved' ? (
              <SettingRow
                icon="workspace-premium"
                label="Premium"
                subtitle="Active — thanks for the support."
                last
              />
            ) : kind === 'lifetime' ? (
              // A7 — Lifetime is a one-time purchase; there's no subscription to manage, so don't deep-link
              // to the App Store subscriptions page (it'd be empty for a non-consumable).
              <SettingRow
                icon="workspace-premium"
                label="Premium — Lifetime"
                subtitle="Active — a one-time purchase, yours forever. Thanks for the support."
                last
              />
            ) : (
              <SettingRow
                icon="workspace-premium"
                label="Premium"
                subtitle="Active — thanks for the support. Tap to manage your subscription."
                onPress={() => void Linking.openURL(MANAGE_SUBSCRIPTION_URL)}
                last
              />
            )
          ) : (
            <SettingRow
              icon="workspace-premium"
              label="Unlock Premium"
              subtitle="The Payday Guardian, Can I Afford It & more."
              onPress={() => router.push('/paywall')}
              last
            />
          )}
        </SettingGroup>
      ) : null}

      {/* History — a reflective destination, so it sits above the settings sections. */}
      <SettingGroup>
        <SettingRow
          icon="history"
          label="Pay cycle history"
          subtitle="Look back at your finished pay cycles."
          onPress={() => router.push('/history')}
        />
        {/* 3.5.1 — the tutorial's permanent home. The first-run invitation can be declined (and dismissing
            it records the run as seen), so replay must live somewhere stable and findable — not only on a
            card affordance the user might never look at again. Both tiers. */}
        <SettingRow
          icon="gpp-good"
          label="How the Guardian works"
          subtitle="Replay the short walkthrough."
          // [F] `tutorialRunFor`, not an inline tier check. "Which audience gets which walkthrough" is a
          // rule that has already moved once ([D9]), and every re-derivation of it is a place the next
          // move can be missed — agreeing copies are still copies.
          // "Replay the short walkthrough" — from the start, not from a stranded step.
          onPress={() => startTutorial(tutorialRunFor(appStore.getState().store), { resume: false })}
        />
        {/* 3.5.5.3 — the coach-marks' equivalent, and it sits beside the walkthrough's rather than in
            Preferences because they answer the same question: "show me how this works again". A mark is
            offered ONCE ever, so without a way back the whole discovery layer is a one-shot a user can
            lose to a mis-tap. Deliberately not a toggle — there is nothing to configure, only to redo. */}
        <SettingRow
          icon="lightbulb-outline"
          label="Show feature tips again"
          subtitle={tipsReset ? 'Tips will appear again as you go.' : 'Re-offer the one-line hints on hidden features.'}
          onPress={() => {
            resetCoachMarks();
            setTipsReset(true);
          }}
          last
        />
      </SettingGroup>

      <Section title="Data">
        <SettingGroup>
          <SettingRow icon="ios-share" label="Export backup" subtitle="Save a copy of your data." onPress={() => setSheet('export')} />
          <SettingRow icon="file-download" label="Import backup" subtitle="Restore from a saved backup." onPress={() => setSheet('import')} />
          <SettingRow
            icon="cloud-off"
            label="iCloud backup"
            subtitle="Automatic cloud backup — coming soon."
            right={<Text style={[textStyles.caption, { color: c.text.tertiary }]}>Soon</Text>}
          />
          {confirmingDelete ? (
            <DeleteConfirm onCancel={() => setConfirmingDelete(false)} onConfirm={handleDeleteAll} />
          ) : (
            <SettingRow icon="delete-outline" label="Delete all data" danger onPress={() => setConfirmingDelete(true)} last />
          )}
        </SettingGroup>
      </Section>

      <Section title="Preferences">
        {/* 3.7.B.2 (F10.1) — the greeting's name, editable and clearable. Committed on blur rather than
            per keystroke: a persisted store write per character, for a value only Today's header reads.
            Clearing it to empty normalises to `undefined`, so "cleared" and "never set" stay one state. */}
        <Card style={styles.appearance}>
          <TextField
            testID="field-preferences-display-name"
            label="Your name"
            value={nameDraft}
            onChangeText={setNameDraft}
            onBlur={() => appStore.getState().updatePrefs({ displayName: normalizeDisplayName(nameDraft) })}
            placeholder="Used to greet you on Today"
            maxLength={MAX_DISPLAY_NAME}
            autoCapitalize="words"
          />
        </Card>
        <Card style={styles.appearance}>
          <Text style={[textStyles.body, { color: c.text.primary }]}>Appearance</Text>
          <SegmentedToggle<ThemeMode>
            value={prefs.themeMode}
            onChange={(mode) => appStore.getState().updatePrefs({ themeMode: mode })}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Card>
        <SettingGroup>
          {/* The toggles persist the prefs now; native scheduling + biometric activation land at B.9. */}
          <SettingRow
            icon="notifications-none"
            label="Notifications"
            subtitle="Paycheck-eve reminder and bill alerts."
            right={<Switch accessibilityLabel="Notifications" value={prefs.notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          <SettingRow
            icon="lock-outline"
            label="App Lock"
            subtitle="Require Face ID / passcode to open."
            right={<Switch accessibilityLabel="App Lock" value={prefs.appLockEnabled} onValueChange={(v) => appStore.getState().updatePrefs({ appLockEnabled: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          {/* 3.5.4.9 [D-A] — the control that makes "opt-out" mean something. A preference with no switch
              is not an opt-out, it is a field. Worded as what it covers and what it cannot: the events
              carry no financial data BY CONSTRUCTION (a closed union of literals in `analytics/funnel`),
              so this is a choice about product telemetry, not the thing standing between the user's money
              and the network. Inverted here because the stored field is the opt-OUT. */}
          <SettingRow
            icon="insights"
            label="Share anonymous usage"
            subtitle="Which screens get used — never your balances, debts, or amounts."
            right={
              <Switch
                accessibilityLabel="Share anonymous usage"
                value={!prefs.analyticsOptOut}
                onValueChange={(v) => appStore.getState().updatePrefs({ analyticsOptOut: !v })}
                trackColor={{ true: c.accent.primary, false: c.border.strong }}
              />
            }
          />
          <SettingRow
            icon="savings"
            label="I have savings elsewhere"
            subtitle="Skip building a starter emergency fund — put more toward debt first."
            right={<Switch accessibilityLabel="I have savings elsewhere" value={prefs.hasSavingsElsewhere} onValueChange={(v) => appStore.getState().updatePrefs({ hasSavingsElsewhere: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          {/* 3.5.3 — premium-only: the Payday Countdown Live Activity. Free users don't have it, so the
              toggle only appears for premium (never a locked/greyed control). */}
          {plan === 'premium' ? (
            <SettingRow
              icon="schedule"
              label="Payday countdown"
              subtitle="Show a Live Activity in the ~3 days before payday."
              right={<Switch accessibilityLabel="Payday countdown" value={prefs.paydayLiveActivityEnabled} onValueChange={(v) => appStore.getState().updatePrefs({ paydayLiveActivityEnabled: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
            />
          ) : null}
          {/* VIS-6 — opt-in celebratory chime on the debt-free finale (off by default; the beat carries itself). */}
          <SettingRow
            icon="celebration"
            label="Debt-free sound"
            subtitle="Play a chime when you clear your last debt."
            right={<Switch accessibilityLabel="Debt-free sound" value={prefs.debtFreeSoundEnabled ?? false} onValueChange={(v) => appStore.getState().updatePrefs({ debtFreeSoundEnabled: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          <SettingRow icon="shopping-cart" label="Living Expenses" subtitle="Everyday spending reserved each paycheck." onPress={() => router.push('/living-expenses')} last />
        </SettingGroup>
      </Section>

      <Section title="About">
        <SettingGroup>
          <SettingRow icon="privacy-tip" label="Privacy Policy" onPress={() => Linking.openURL(LINKS.privacy)} />
          <SettingRow icon="description" label="Terms of Use" onPress={() => Linking.openURL(LINKS.terms)} />
          <SettingRow icon="help-outline" label="Support" onPress={() => Linking.openURL(LINKS.support)} />
          {/* Only real subscribers manage a subscription — a free user or a Lifetime owner would land on an
              empty App Store subscriptions page (R2.3). 3.7.A5: and an UNRESOLVED entitlement might be
              either, so it is withheld too — a dead link is worse than a missing one. */}
          {canManageSubscription(kind) ? (
            <SettingRow icon="card-membership" label="Manage Subscription" onPress={() => Linking.openURL(LINKS.subscription)} />
          ) : null}
          <SettingRow icon="info-outline" label="Version" right={<Text style={[textStyles.caption, { color: c.text.tertiary }]}>{APP_VERSION}</Text>} last />
        </SettingGroup>
      </Section>

      {/* On-DEVICE QA tools only (Live Activities are iOS-only; the Simulate-Premium toggle is for
          TestFlight). Kept off web — it's the e2e surface, and the "Unlock premium features…" subtitle
          otherwise collides with the paywall's "Unlock Premium" entry. */}
      {(__DEV__ || QA_TOOLS) && Platform.OS !== 'web' ? (
        <Section title="Developer / QA">
          <SettingGroup>
            <SettingRow
              icon="science"
              label="Simulate Premium"
              subtitle="Unlock premium features for testing (dev / TestFlight QA)."
              right={
                <Switch
                  accessibilityLabel="Simulate Premium"
                  value={plan === 'premium'}
                  onValueChange={(v) => appStore.getState().setSubscriptionPlan(v ? 'premium' : 'free')}
                  trackColor={{ true: c.accent.primary, false: c.border.strong }}
                />
              }
              last
            />
          </SettingGroup>
          {/* 3.5.3 device-QA — trigger the Payday Countdown Live Activity states + the payday-landed drain
              on demand (no need to hand-tune the paycheck date). Removed with QA_TOOLS before submission. */}
          <LiveActivityQA />
        </Section>
      ) : null}

      {sheet === 'export' ? <ExportBackupSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'import' ? <ImportBackupSheet onClose={() => setSheet(null)} /> : null}
    </Screen>
  );
}

/** The trust moment — the app's moat stated plainly, at the top of the hub. Calm, not a sales pitch. */
function TrustCard() {
  const c = useAppColors();
  return (
    <Card style={styles.trust}>
      <View style={[styles.trustIcon, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name="verified-user" size={22} color={c.accent.primary} />
      </View>
      <View style={styles.trustText}>
        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>Private by design</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
          Your financial data stays on this device — no account needed. And we&apos;ll never sell you more debt.
        </Text>
      </View>
    </Card>
  );
}

function DeleteConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const c = useAppColors();
  return (
    <View style={styles.confirm}>
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
        All debts, bills, goals, and settings will be permanently erased. This cannot be undone.
      </Text>
      <View style={styles.confirmActions}>
        <View style={styles.confirmBtn}>
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </View>
        <View style={styles.confirmBtn}>
          <Button label="Delete Everything" variant="danger" onPress={onConfirm} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trust: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trustIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  trustText: { flex: 1, gap: 2 },
  appearance: { gap: spacing.md },
  confirm: { padding: spacing.base, gap: spacing.md },
  confirmActions: { flexDirection: 'row', gap: spacing.md },
  confirmBtn: { flex: 1 },
});
