import { EVERYDAY_SPENDING_LABEL, EXPORT_BACKUP_TITLE, IMPORT_BACKUP_TITLE, PAY_CYCLE_HISTORY_TITLE, PRIVACY_CLAIM, PRIVACY_POLICY_LABEL, UNLOCK_PREMIUM_CTA } from '@core/copy/vocabulary';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { tutorialRunFor } from '@/store/tutorialSelectors';
import { startTutorial } from '@/store/tutorialSession';
import { useState } from 'react';
import { InteractionManager, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { ExportBackupSheet, ImportBackupSheet } from '@/components/more/BackupSheets';
import { CloudBackupSheet } from '@/components/more/CloudBackupSheet';
import { SettingGroup, SettingRow } from '@/components/more/SettingRow';
import { requestNotificationPermissionDetailed } from '@/notifications/notifications';
import { notify } from '@/utils/confirm';
import { reportError } from '@/utils/reportError';
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
import { CLOUD_BACKUP_SUPPORTED, getCloudBackupProvider } from '@/storage/cloudBackup';
import { deleteCloudBackup } from '@/storage/cloudBackup/service';
import { clearQuarantinedData } from '@/store/persistence';
import { resetCoachMarks } from '@/store/coachMarks';
import { useAppStore } from '@/store/useAppStore';
import { useLayout } from '@/hooks/use-layout';
import { qaEnabled } from '@/config/qa';
import { CoachMarkProbeReadout } from '@/components/more/CoachMarkProbeReadout';
import { LegacyBridgeProbeReadout } from '@/components/more/LegacyBridgeProbeReadout';
import { ReduceMotionProbeReadout } from '@/components/more/ReduceMotionProbeReadout';
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
  const [sheet, setSheet] = useState<'export' | 'import' | 'cloud' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // P6.8.7d.2 — why the remote could not be erased, or null. Set only on a REFUSED delete, and it is what
  // keeps the local wipe from proceeding behind a promise the app cannot keep.
  const [deleteBlocked, setDeleteBlocked] = useState<'unavailable' | 'error' | 'quarantine' | null>(null);
  // 3.5.5.3 — the reset is instantaneous and invisible (the next mark appears on some other screen,
  // later), so the row confirms in place. Without it the tap reads as a no-op and gets repeated.
  const [tipsReset, setTipsReset] = useState(false);

  // Enabling requires OS permission first — the pref is only written on `granted`. Disabling flips
  // immediately; the sync hook then cancels the schedule. Every non-granted outcome is SPOKEN, because
  // a switch that springs back in silence is indistinguishable from a broken one.
  async function handleNotificationsToggle(next: boolean) {
    if (!next) {
      appStore.getState().updatePrefs({ notificationsEnabled: false });
      return;
    }
    const result = await requestNotificationPermissionDetailed();
    if (result === 'granted') {
      appStore.getState().updatePrefs({ notificationsEnabled: true });
      return;
    }
    // ⛔ This branch used to be `if (granted) …` and nothing else. iOS presents its permission alert
    // ONCE EVER, so for everyone who declined it the first time the switch flipped on, snapped back,
    // and the app said nothing at all — a control that cannot work and never admits it. Whatever the
    // reason, say it; and when the OS will not re-prompt, the only thing that can help is Settings.
    if (result === 'blocked') {
      notify(
        'Notifications are off for Debt Planner',
        'iOS only asks once. You can turn them back on in Settings.',
        { label: 'Open Settings', onPress: () => void Linking.openSettings() },
      );
      return;
    }
    if (result === 'declined') {
      notify('Notifications stay off', 'You can turn them on here whenever you want a nudge before a bill is due.');
      return;
    }
    notify('Not available here', 'Reminders are a feature of the iPhone app.');
  }

  // Reset flips `onboardingComplete=false`, which makes the root Stack.Protected guard swap
  // tabs→onboarding. Doing that while More is pushed would orphan this screen with a dead back
  // stack (Freedom RN lesson #6), so DISMISS to the still-mounted tabs FIRST, then reset once the
  // pop settles.
  /**
   * P6.8.7d.2 [C9] — the local wipe, plus the two copies it used to leave behind.
   *
   * ⛔ **The remote goes FIRST, and a failure to reach it STOPS the local wipe.** Once the local store is
   * reset this screen unmounts (the app routes to onboarding), so there is no surface left on which to
   * admit that the iCloud copy survived. Wiping first and apologising afterwards is not available; the
   * only honest order is to fail before anything is destroyed.
   * ⚠️ A user who needs the device clear right now — the phone-being-handed-on case — is not held
   * hostage by an unreachable iCloud: `deviceOnly` is that escape, and it is offered by name.
   */
  async function handleDeleteAll(opts?: { deviceOnly?: boolean; keepQuarantine?: boolean }) {
    // ⚠️ `CLOUD_BACKUP_SUPPORTED`, not `isAvailable()`. On web and Android there is no container and never
    // was, so there is nothing to fail to erase; blocking there would be refusing to delete on behalf of a
    // copy that does not exist. On iOS the check below runs and a signed-out device DOES block.
    if (!opts?.deviceOnly && CLOUD_BACKUP_SUPPORTED) {
      const cloud = await deleteCloudBackup(getCloudBackupProvider());
      if (!cloud.ok) {
        // ⚠️ `unavailable` is not a bug — it is web, Android, or a signed-out device. It still cannot be
        // reported as success, because on a signed-out iPhone the backup is very much still there.
        setDeleteBlocked(cloud.reason);
        return;
      }
    }
    // ⛔ **THE QUARANTINED COPY IS ERASED BEFORE ANYTHING IS DESTROYED, for the same reason the remote is.**
    // [S1.10.6.7.3 · pass-3 m7] This ran fire-and-forget *after* `reset()` and *after* the screen popped,
    // so a failure had no surface left to admit itself on — while the confirm copy promises, without
    // qualification, that everything "will be permanently erased". The blob is a FULL copy of the
    // portfolio; that nothing reads it does not make it not the user's financial data.
    //
    // ⚠️ **Blocking here needed its own escape, and reusing the iCloud one would have been wrong twice
    // over:** its copy says iCloud could not be reached, which is false for a local fault, and the exit it
    // offers — "delete on this device only" — re-runs the path that just failed. So the reason is
    // distinct and the escape is `keepQuarantine`, which proceeds knowingly. A user is never held hostage
    // by a blob nothing reads.
    if (!opts?.keepQuarantine) {
      try {
        await clearQuarantinedData();
      } catch (error: unknown) {
        reportError(error, { seam: 'persistence', op: 'reset' });
        setDeleteBlocked('quarantine');
        return;
      }
    }
    setConfirmingDelete(false);
    setDeleteBlocked(null);
    // ⛔ `canGoBack()` before `back()` — the THIRD instance of this shape in the repo, after `paywall.tsx`
    // (tagged [C9]) and `schedule/[id].tsx` (3.7.A0), and the only one on a DESTRUCTIVE control. A bare
    // `back()` no-ops when this screen is the only entry on the stack, and here that does not merely
    // strand the user: the reset is sequenced *after* the pop, so "Delete everything" silently does
    // nothing at all. Found by the e2e added at d.2, whose first draft landed on `/more` directly.
    if (router.canGoBack()) router.back();
    else router.replace('/');
    InteractionManager.runAfterInteractions(() => {
      appStore.getState().reset();
    });
  }

  return (
    // 3.6.5 — a wider settings column on iPad (a clean, appropriate treatment for a settings list; a
    // fuller two-column/section-split is a noted future enhancement).
    <Screen
      title="More"
      // Same [C9] shape as the paywall and the schedule route — a back control that no-ops on cold entry.
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      maxWidth={isExpanded ? 680 : undefined}>
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
              label={UNLOCK_PREMIUM_CTA}
              subtitle="Payday Guardian, Can I Afford It & more."
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
          label={PAY_CYCLE_HISTORY_TITLE}
          subtitle="Look back at your finished pay cycles."
          onPress={() => router.push('/history')}
        />
        {/* 3.5.1 — the tutorial's permanent home. The first-run invitation can be declined (and dismissing
            it records the run as seen), so replay must live somewhere stable and findable — not only on a
            card affordance the user might never look at again. Both tiers. */}
        <SettingRow
          icon="gpp-good"
          label="How your Guardian works"
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
          // ⛔ [P6.4.4 · audit L1-33] Was "Re-offer the one-line hints on hidden features." — implementation
          // register ("re-offer", "one-line hints"), and it told the user their features were HIDDEN.
          // ⚠️ NOT the finding's suggested "Show the short tips again as you go": this subtitle composes
          // into the row's `accessibilityLabel` behind the label "Show feature tips again", so that
          // wording read "…again. …again as you go." Describe what the tips ARE; the label already owns
          // the "again". (The composition is documented in `07-money-add-and-rescue.yaml`, which measured
          // it when a selector went red against the joined string.)
          subtitle={tipsReset ? 'Tips will appear again as you go.' : 'Short tips that point out what each screen can do.'}
          onPress={() => {
            resetCoachMarks();
            setTipsReset(true);
          }}
          last
        />
      </SettingGroup>

      <Section title="Data">
        <SettingGroup>
          <SettingRow icon="ios-share" label={EXPORT_BACKUP_TITLE} subtitle="Save a copy of your data." onPress={() => setSheet('export')} />
          <SettingRow icon="file-download" label={IMPORT_BACKUP_TITLE} subtitle="Restore from a saved backup." onPress={() => setSheet('import')} />
          {/* P6.3 — this replaces the "coming soon" row the app had been shipping (finding L1-29). The
              subtitle states what the feature IS rather than that it exists: [D41]'s claim is that the
              data stays in the user's own Apple account, and this row is the first place they meet it. */}
          <SettingRow
            icon="cloud-upload"
            label="iCloud backup"
            subtitle="Keep a copy in your own iCloud account."
            onPress={() => setSheet('cloud')}
          />
          {confirmingDelete ? (
            <DeleteConfirm
              blocked={deleteBlocked}
              onCancel={() => {
                setConfirmingDelete(false);
                setDeleteBlocked(null);
              }}
              onConfirm={() => void handleDeleteAll()}
              onConfirmDeviceOnly={() => void handleDeleteAll({ deviceOnly: true })}
              onConfirmKeepQuarantine={() => void handleDeleteAll({ keepQuarantine: true })}
            />
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
            subtitle="Paycheck-eve reminder and due-date alerts."
            right={<Switch accessibilityLabel="Notifications" value={prefs.notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          <SettingRow
            icon="lock-outline"
            label="App Lock"
            subtitle="Require Face ID / passcode to open."
            right={<Switch accessibilityLabel="App Lock" value={prefs.appLockEnabled} onValueChange={(v) => appStore.getState().updatePrefs({ appLockEnabled: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
          />
          {/* ⛔ [M1-8] THERE IS NO "Share anonymous usage" ROW, and there must not be one until something
              is actually collected. `track()` forwards to a sink, `setFunnelSink` has no production
              caller, and so the switch governed nothing: it offered the user a choice about data that
              does not leave the device, on a screen whose whole job is to be believed.

              ⚠️ R2 measured the direction. The instinct is to wire a sink so the control becomes true —
              but the live privacy page states "no behavioral analytics" in the affirmative, it is linked
              from the paywall under Guideline 3.1.2, and shipping a sink would make that claim false.
              The honest move is the smaller one: collect nothing, claim nothing, show nothing.

              ⛔ **The pref and the plumbing STAY** — `analyticsOptOut`, `funnel.ts`, and the closed event
              union are untouched, because P6.9 owns whether a sink is ever attached. If one ever is, this
              row comes back in the same commit: `funnel.test.ts` fails the moment `setFunnelSink` gains a
              production caller, precisely so that decision cannot be made without re-reading this. */}
          <SettingRow
            icon="savings"
            label="Savings elsewhere"
            subtitle="Skip building a starter emergency fund — put more toward debt first."
            right={<Switch accessibilityLabel="Savings elsewhere" value={prefs.hasSavingsElsewhere} onValueChange={(v) => appStore.getState().updatePrefs({ hasSavingsElsewhere: v })} trackColor={{ true: c.accent.primary, false: c.border.strong }} />}
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
          <SettingRow icon="shopping-cart" label={EVERYDAY_SPENDING_LABEL} subtitle="What you reserve for day-to-day spending each paycheck." onPress={() => router.push('/living-expenses')} last />
        </SettingGroup>
      </Section>

      <Section title="About">
        <SettingGroup>
          <SettingRow icon="privacy-tip" label={PRIVACY_POLICY_LABEL} onPress={() => Linking.openURL(LINKS.privacy)} />
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
      {qaEnabled() && Platform.OS !== 'web' ? (
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
            />
            {/* P6.5 — the ONLY way to verify Sentry on a device. Found during the 2026-08-20 device pass:
                there is no user-triggerable `reportError` path in the whole app. Every one of its 28 call
                sites is a failure handler for something that does not fail on demand (a storage fault, a
                share-sheet throw, a widget write), and the obvious candidate — a rejected backup import —
                sets an in-sheet message and never reports. So capture could not be tested at all, and a
                silent absence of events would have read as "Sentry is broken" rather than "nothing asked
                it to do anything".
                ⛔ It reports rather than THROWS: `reportError` is the seam all 28 sites use, so this
                exercises the real path — including `beforeBreadcrumb`, which is the half that matters.
                Crashing the app would test a different route and lose the breadcrumb trail being checked.
                ⚠️ Gated by `qaEnabled()`, so P6.17's `git grep QA_TOOLS` takes it out with the rest. */}
            <SettingRow
              icon="bug-report"
              label="Send a test error to Sentry"
              subtitle="QA only — check the issue’s breadcrumbs carry no amounts."
              onPress={() => {
                reportError(new Error('QA test event — Debt Planner device pass'), {
                  seam: 'qa-test-event',
                  surface: 'more',
                });
                notify('Sent', 'Check sentry.io → debt-planner → Issues, then read the breadcrumbs.');
              }}
              last
            />
          </SettingGroup>
          {/* 3.5.3 device-QA — trigger the Payday Countdown Live Activity states + the payday-landed drain
              on demand (no need to hand-tune the paycheck date). Removed with QA_TOOLS before submission. */}
          <LiveActivityQA />
          <CoachMarkProbeReadout />
          {/* 4.1.7① — reports what THIS build sees for Reduce Motion, from both sources. Beside the
              coach probe because More is a screen the suite already visits, so it costs no new flow. */}
          <ReduceMotionProbeReadout />
          {/* 5.1b — can this binary read the v1.6 WKWebView localStorage it inherited on an in-place
              upgrade? The one question in Phase 5 that no local test can answer. Same screen as the other
              two probes, so it costs the suite no new flow. */}
          <LegacyBridgeProbeReadout />
        </Section>
      ) : null}

      {sheet === 'export' ? <ExportBackupSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'import' ? <ImportBackupSheet onClose={() => setSheet(null)} /> : null}
      {sheet === 'cloud' ? <CloudBackupSheet onClose={() => setSheet(null)} /> : null}
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
        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{PRIVACY_CLAIM.headline}</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
          {`Your ${PRIVACY_CLAIM.body.replace(/^your /, '')} — no account needed. And ${PRIVACY_CLAIM.noSelling}.`}
        </Text>
      </View>
    </Card>
  );
}

/**
 * P6.8.7d.2 [C9] — the copy used to promise *"permanently erased… cannot be undone"* while the iCloud
 * copy and the quarantined blob both survived. The sentence is now the one the code keeps.
 *
 * ⚠️ It names iCloud unconditionally rather than probing for a backup first. Saying "and in your iCloud
 * backup" when there is none costs a reader nothing; probing would put a native round-trip on a settings
 * screen, and a probe that failed would put the screen right back to promising something it cannot check.
 */
function DeleteConfirm({
  blocked,
  onCancel,
  onConfirm,
  onConfirmDeviceOnly,
  onConfirmKeepQuarantine,
}: {
  blocked: 'unavailable' | 'error' | 'quarantine' | null;
  onCancel: () => void;
  onConfirm: () => void;
  onConfirmDeviceOnly: () => void;
  onConfirmKeepQuarantine: () => void;
}) {
  const c = useAppColors();
  if (blocked) {
    return (
      <View style={styles.confirm} testID="delete-all-blocked">
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
          {blocked === 'unavailable'
            ? 'Nothing was deleted. Sign in to iCloud on this device so the backup there can be erased too — or delete on this device only.'
            : blocked === 'quarantine'
              ? // ⛔ A LOCAL fault, so neither of the iCloud lines is true here and neither escape helps —
                // "this device only" re-runs the step that just failed. [S1.10.6.7.3 · pass-3 m7]
                'Nothing was deleted. A set-aside copy of your data on this device couldn’t be removed, so erasing now would leave it behind — try again, or delete the rest anyway.'
              : 'Nothing was deleted. iCloud couldn’t be reached, so the backup there would have survived — try again, or delete on this device only.'}
        </Text>
        <View style={styles.confirmActions}>
          <View style={styles.confirmBtn}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </View>
          <View style={styles.confirmBtn}>
            <Button label="Try again" variant="secondary" testID="delete-all-retry" onPress={onConfirm} />
          </View>
        </View>
        {/* ⚠️ The escape has to match what actually failed. A local set-aside copy is not helped by
            "this device only" — that path re-runs the step that just failed — so this state offers the
            one exit that works: proceed knowingly. [S1.10.6.7.3 · pass-3 m7] */}
        {blocked === 'quarantine' ? (
          <Button
            label="Delete the rest anyway"
            variant="danger"
            testID="delete-all-keep-quarantine"
            onPress={onConfirmKeepQuarantine}
          />
        ) : (
          <Button
            label="Delete on this device only"
            variant="danger"
            testID="delete-all-device-only"
            onPress={onConfirmDeviceOnly}
          />
        )}
      </View>
    );
  }
  return (
    <View style={styles.confirm}>
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
        All debts, expenses, goals, and settings will be permanently erased — on this device and in your
        iCloud backup. This cannot be undone.
      </Text>
      <View style={styles.confirmActions}>
        <View style={styles.confirmBtn}>
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </View>
        <View style={styles.confirmBtn}>
          <Button label="Delete everything" variant="danger" testID="delete-all-confirm" onPress={onConfirm} />
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
