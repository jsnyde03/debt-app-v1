import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { InteractionManager, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { ExportBackupSheet, ImportBackupSheet } from '@/components/more/BackupSheets';
import { SettingGroup, SettingRow } from '@/components/more/SettingRow';
import { requestNotificationPermission } from '@/notifications/notifications';
import { Screen, Section } from '@/components/screen';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import type { ThemeMode } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { PREMIUM_PURCHASABLE } from '@/premium/config';
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
  const plan = useAppStore((s) => s.store.subscriptionPlan);
  const premiumIsLifetime = useAppStore((s) => s.premiumIsLifetime);
  const [sheet, setSheet] = useState<'export' | 'import' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
    <Screen title="More" onBack={() => router.back()}>
      {/* Trust moment (the moat) — the first thing you see: honest, on-device, never sells you debt. */}
      <TrustCard />

      {/* Premium entry — the ALWAYS-VISIBLE, obvious path to the paywall. Kept high + clearly labeled so
          an App Review tester (and any free user) can always find it without triggering a premium moment
          — the fix for the v1.1 "couldn't find the paywall" rejections. Premium users get manage-sub. */}
      {plan === 'premium' || PREMIUM_PURCHASABLE ? (
        <SettingGroup>
          {plan === 'premium' ? (
            premiumIsLifetime ? (
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
          label="Pay Cycle History"
          subtitle="Look back at your finished pay cycles."
          onPress={() => router.push('/history')}
          last
        />
      </SettingGroup>

      <Section title="Data">
        <SettingGroup>
          <SettingRow icon="ios-share" label="Export backup" subtitle="Save a copy of your data." onPress={() => setSheet('export')} />
          <SettingRow icon="file-download" label="Import backup" subtitle="Restore from a saved backup." onPress={() => setSheet('import')} />
          <SettingRow
            icon="cloud-off"
            label="iCloud Backup"
            subtitle="Automatic cloud backup — coming with Premium."
            right={<Text style={[textStyles.caption, { color: c.text.tertiary }]}>Soon</Text>}
          />
          {confirmingDelete ? (
            <DeleteConfirm onCancel={() => setConfirmingDelete(false)} onConfirm={handleDeleteAll} />
          ) : (
            <SettingRow icon="delete-outline" label="Delete All Data" danger onPress={() => setConfirmingDelete(true)} last />
          )}
        </SettingGroup>
      </Section>

      <Section title="Preferences">
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
            right={<Switch value={prefs.notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          <SettingRow
            icon="lock-outline"
            label="App Lock"
            subtitle="Require Face ID / passcode to open."
            right={<Switch value={prefs.appLockEnabled} onValueChange={(v) => appStore.getState().updatePrefs({ appLockEnabled: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          <SettingRow
            icon="savings"
            label="I have savings elsewhere"
            subtitle="Skip building a starter emergency fund — put more toward debt first."
            right={<Switch value={prefs.hasSavingsElsewhere} onValueChange={(v) => appStore.getState().updatePrefs({ hasSavingsElsewhere: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
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
              empty App Store subscriptions page (R2.3). */}
          {plan === 'premium' && !premiumIsLifetime ? (
            <SettingRow icon="card-membership" label="Manage Subscription" onPress={() => Linking.openURL(LINKS.subscription)} />
          ) : null}
          <SettingRow icon="info-outline" label="Version" right={<Text style={[textStyles.caption, { color: c.text.tertiary }]}>{APP_VERSION}</Text>} last />
        </SettingGroup>
      </Section>

      {__DEV__ ? (
        <Section title="Developer">
          <SettingGroup>
            <SettingRow
              icon="science"
              label="Simulate Premium"
              subtitle="Unlock premium features while they're built (dev only)."
              right={
                <Switch
                  value={plan === 'premium'}
                  onValueChange={(v) => appStore.getState().setSubscriptionPlan(v ? 'premium' : 'free')}
                  trackColor={{ true: c.accent.primary, false: c.border.strong }}
                />
              }
              last
            />
          </SettingGroup>
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
