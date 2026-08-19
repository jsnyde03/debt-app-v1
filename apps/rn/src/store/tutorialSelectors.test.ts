import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { runMigrations } from '@/data/migrations';
import { markTutorialSeen, selectTutorialInvite, tutorialRunFor } from '@/store/tutorialSelectors';

/**
 * 3.5.1 — WHO gets offered the Guardian tutorial.
 *
 * The design gate chose all four audiences, and the interesting cases are the two that are easy to lose:
 * an EXISTING v1.6 user (who carries `guardianIntroSeen: true` and would be silently excluded if that
 * flag were reused) and an UPGRADER (who saw the free run and should get the premium one once). Both are
 * pinned here, because both fail silently — nobody reports an offer they never received.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

function store(over: Partial<DebtStore> = {}, prefs: Partial<DebtStore['prefs']> = {}): DebtStore {
  const s = createDefaultStore();
  return { ...s, ...over, prefs: { ...s.prefs, onboardingComplete: true, ...prefs } };
}

function run() {
  console.log('3.5.1 — tutorial invitation matrix (who gets offered, and which run)...');

  // ── The four audiences the gate chose. ────────────────────────────────────────────────────────
  eq(selectTutorialInvite(store({ subscriptionPlan: 'premium' }))?.run, 'premium', 'new PREMIUM user is offered the premium run');
  eq(selectTutorialInvite(store({ subscriptionPlan: 'free' }))?.run, 'free', 'new FREE user is offered the free run');

  // An existing v1.6 user: has never seen a tutorial. Reusing `guardianIntroSeen` — which such a user
  // carries as `true` — would have silently excluded exactly this person, which is why `tutorialSeen`
  // exists as its own field.
  // ⚠️ 5.6 DROPPED `guardianIntroSeen`, so the old flag can no longer even be constructed here. The
  // exclusion risk is now gone BY CONSTRUCTION rather than by this gate choosing correctly — but the
  // audience assertion stays, because "a v1.6 upgrader is offered the tutorial" is the behaviour, and
  // the reason it works is not something a reader should have to re-derive.
  const v16 = store({ subscriptionPlan: 'premium' }, { tutorialSeen: null });
  eq(selectTutorialInvite(v16)?.run, 'premium', 'an existing v1.6 user IS offered it');

  // An upgrader: saw the free run, then bought premium → offered the premium FINALE once.
  const upgrader = store({ subscriptionPlan: 'premium' }, { tutorialSeen: 'free' });
  eq(selectTutorialInvite(upgrader)?.run, 'premium', 'a free→premium upgrader is re-offered the PREMIUM run');
  // [E4] — and the finale ALONE. Since [D9] the runs are beat-identical for them, so replaying seven
  // beats would charge a customer's attention, right after they paid, for one changed paragraph. Pinned
  // because it is invisible from the outside: both shapes return a truthy invite naming the same run,
  // and only this flag distinguishes "offer the arc" from "offer the beat written for who they now are".
  eq(selectTutorialInvite(upgrader)?.finaleOnly, true, 'an upgrader is offered the FINALE, not the whole arc');
  // …and nobody else is. A first-run user must still walk all seven beats.
  eq(
    selectTutorialInvite(store({ subscriptionPlan: 'premium' }, { tutorialSeen: null }))?.finaleOnly,
    undefined,
    'a first-run premium user gets the whole arc, not the finale',
  );

  // ── And the cases that must NOT be offered. ───────────────────────────────────────────────────
  eq(selectTutorialInvite(store({ subscriptionPlan: 'free' }, { tutorialSeen: 'free' })), null, 'a free user who saw the free run is not re-offered');
  eq(selectTutorialInvite(store({ subscriptionPlan: 'premium' }, { tutorialSeen: 'premium' })), null, 'a premium user who saw the premium run is not re-offered');
  // A premium user who lapses to free must not be offered the LESSER run as if it were new.
  eq(selectTutorialInvite(store({ subscriptionPlan: 'free' }, { tutorialSeen: 'premium' })), null, 'a lapsed premium user is not offered the free run');
  // Mid-onboarding there's no plan for the finale to hand back to.
  eq(selectTutorialInvite(store({}, { onboardingComplete: false })), null, 'never offered before onboarding completes');

  // ── Recording: dismissing is an answer, and premium is never downgraded. ──────────────────────
  eq(markTutorialSeen(createDefaultStore().prefs, 'free').tutorialSeen, 'free', 'seeing the free run records it');
  eq(
    markTutorialSeen({ ...createDefaultStore().prefs, tutorialSeen: 'premium' }, 'free').tutorialSeen,
    'premium',
    'a recorded PREMIUM run is never downgraded to free',
  );
  eq(tutorialRunFor(store({ subscriptionPlan: 'premium' })), 'premium', 'the run follows the tier');

  // ── Migration: every existing blob becomes eligible exactly once. ─────────────────────────────
  // The prefs merge backfills `tutorialSeen` to null, which is what makes the v1.6 audience reachable
  // at all — if it defaulted to a seen value, they'd be silently skipped forever.
  const migrated = runMigrations({ storeVersion: 5, prefs: { onboardingComplete: true, guardianIntroSeen: true } });
  eq(migrated.prefs.tutorialSeen, null, 'an upgraded v5 blob backfills tutorialSeen to null (→ eligible)');
  eq(selectTutorialInvite(migrated)?.run, 'free', '…so the migrated user IS offered the tutorial');
  // ⛔ 5.6 — and the old flag is STRIPPED, not merely absent from the type. The prefs merge preserves any
  // extra key an older blob holds, so a type-only deletion would leave `guardianIntroSeen` in the data
  // forever: a field nothing can read, riding along in every future write. This is the assertion that
  // proves the drop reached the DATA.
  assert(
    !('guardianIntroSeen' in migrated.prefs),
    'the inert guardianIntroSeen is stripped from an upgraded blob, not carried forward (5.6)',
  );
  assert(!('isDemoMode' in migrated.prefs), 'and so is isDemoMode (5.6)');

  console.log(`✅ tutorial invitation matrix: ${passed} assertions passed.\n`);
}

run();
