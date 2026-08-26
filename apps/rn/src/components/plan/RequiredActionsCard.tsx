import { OVERDUE_LABEL } from '@core/copy/vocabulary';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle, checkOffHaptic } from '@/components/ui/CheckCircle';
import { Pill } from '@/components/ui/Pill';
import { useAppColors } from '@/hooks/use-app-colors';
import { useInert } from '@/hooks/use-inert';
import {
  bucketRequiredRows,
  countOutstandingRequired,
  requiredRowKey,
  type RequiredBucket,
  type RequiredRow,
} from '@/store/planSelectors';
import type { Allocation } from '@/store/selectors';
import { a11yHidden, a11yExpanded } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type UnfundedItem = Allocation['unfundedRequiredItems'][number];

const COLLAPSIBLE = new Set<RequiredBucket['key']>(['nextWeek', 'later', 'handled']);

function shortDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The required bills + debt minimums due this paycheck — a calm checklist (the mandatory zone).
 * At scale it groups into urgency buckets (Overdue + This week open; later-in-cycle + Handled
 * collapsed) so a long cycle never becomes a wall. Marking paid strikes a row through in place and
 * it settles into Handled on the next visit — it never vanishes on tap (1.5.4).
 */
export function RequiredActionsCard({
  rows,
  unfunded,
  onMark,
  currentDate,
  hasAnyBills,
  onAddBill,
  shortfallAdviceOwnedElsewhere = false,
}: {
  rows: RequiredRow[];
  /** ⛔ S1.5.2 [B5] — THE ALLOCATION'S REAL ARRAY, ALWAYS. Never an emptied one to hide the list: this
   *  drives the outstanding count, and an emptied array asserts the user owes nothing. Use
   *  `shortfallAdviceOwnedElsewhere` to change what is SHOWN. */
  unfunded: UnfundedItem[];
  onMark: (row: RequiredRow, paid: boolean) => void;
  currentDate: string;
  /** P6.8.7e.3 [C5] — does the PLAN have any required expense at all? ⚠️ Not `rows.length > 0`: a plan can
   *  hold bills with none falling in this cycle, and that user IS caught up. Only the store knows. */
  hasAnyBills: boolean;
  /** Opens the add-bill sheet in place — the same one-tap treatment the no-debts prompt gets. */
  onAddBill?: () => void;
  /** MF.6 (audit #7) — the premium Recovery Plan is on screen and IT owns the "what do I do about the
   *  shortfall" advice, so this card must not compete with a second plan of action. ⛔ It changes ONE
   *  SENTENCE. The obligations stay listed and stay counted: MF.6 was implemented by emptying `unfunded`
   *  at the call site, which withheld them from the count too and rendered "You're caught up for this
   *  paycheck." over $1,060 of unpaid bills ([B5]). Suppressing advice is not the same act as denying
   *  the debt exists. */
  shortfallAdviceOwnedElsewhere?: boolean;
}) {
  const c = useAppColors();
  const [paidThisVisit, setPaidThisVisit] = useState<Set<string>>(() => new Set());
  const [userToggled, setUserToggled] = useState<Set<string>>(() => new Set());

  // Re-entry tidy-up: on each focus, clear the "pinned in place" set so items paid last visit
  // settle into Handled (and re-open the buckets to their defaults).
  useFocusEffect(
    useCallback(() => {
      setPaidThisVisit(new Set());
      setUserToggled(new Set());
    }, []),
  );

  const buckets = bucketRequiredRows(rows, currentDate, paidThisVisit);
  // ⛔ S1.5.2 [B5] — `rows.filter(unhandled).length + unfunded.length` was wrong in BOTH directions: it
  // double-counted a partially-funded bill (a row AND a remainder), and it read 0 whenever the caller
  // emptied `unfunded`. `countOutstandingRequired` owns the question and counts OBLIGATIONS.
  const outstanding = countOutstandingRequired(rows, unfunded);
  const flat = buckets.length === 1 && buckets[0].key === 'thisWeek';

  const handleMark = (row: RequiredRow, paid: boolean) => {
    const key = requiredRowKey(row);
    setPaidThisVisit((prev) => {
      const n = new Set(prev);
      if (paid) n.add(key);
      else n.delete(key);
      return n;
    });
    onMark(row, paid);
  };
  const toggleBucket = (key: string) =>
    setUserToggled((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const isOpen = (b: RequiredBucket) => (b.defaultOpen ? !userToggled.has(b.key) : userToggled.has(b.key));

  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <View style={[styles.tagDot, { backgroundColor: c.accent.success }]} />
            <Text style={[textStyles.title3, { color: c.text.primary }]}>Required actions</Text>
          </View>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Bills and minimums due this paycheck.</Text>
        </View>
        {outstanding > 0 ? <Pill testID="required-outstanding-count" label={String(outstanding)} tone="neutral" /> : null}
      </View>

      {/* ⛔ P6.8.7e.3 [C5 / M2-9] — TWO zero states, and they were rendering the same sentence.
          "You're caught up for this paycheck", in success green, was shown to a user who had **never told
          the app about a single bill** — onboarding takes one debt OR one bill, and there is no `'no-bills'`
          member of `PlanState` to branch on. ⚡ R3: *"that is worse than the absence of a prompt — it
          actively affirms them for a paycheck they have not told the app about."* Their whole first
          Guardian read is computed as if rent does not exist, and free deploys undampened, so it is also
          the most over-confident number they will ever see.
          ⚠️ `rows.length === 0` is NOT the signal — a plan can have bills with none falling in this cycle.
          The honest question is whether any required expense exists at all, so the caller passes it. */}
      {outstanding === 0 ? (
        <View style={styles.pad}>
          {hasAnyBills ? (
            <Text style={[textStyles.subhead, { color: c.accent.success }]}>You’re caught up for this paycheck.</Text>
          ) : (
            <>
              <Text testID="required-no-bills" style={[textStyles.subhead, { color: c.text.primary }]}>
                You haven’t added any bills yet.
              </Text>
              <Text style={[textStyles.caption, { color: c.text.secondary }]}>
                Rent, utilities, subscriptions — anything that comes out every cycle. Until they are here,
                this plan treats all of it as spendable.
              </Text>
              {onAddBill ? <Button label="Add a bill" variant="secondary" onPress={onAddBill} /> : null}
            </>
          )}
        </View>
      ) : null}

      {buckets.map((b) => (
        <BucketBlock
          key={b.key}
          bucket={b}
          flat={flat}
          collapsible={COLLAPSIBLE.has(b.key)}
          open={isOpen(b)}
          onToggle={() => toggleBucket(b.key)}
          onMark={handleMark}
        />
      ))}

      {unfunded.length > 0 ? (
        <View style={[styles.unfunded, { borderTopColor: c.border.subtle }]}>
          <Text
            testID="required-unfunded-note"
            style={[textStyles.caption, styles.unfundedNote, { color: c.accent.warning }]}
          >
            {shortfallAdviceOwnedElsewhere
              ? 'Not covered by this paycheck — your recovery plan below works through these.'
              : 'Short this paycheck — cover these from savings or your next paycheck.'}
          </Text>
          {unfunded.map((u, i) => (
            <View key={`unf-${i}`} style={styles.unfundedRow}>
              <Text style={[textStyles.subhead, { color: c.text.secondary, flex: 1 }]} numberOfLines={1}>
                {u.label}
              </Text>
              <Text style={[textStyles.numericBody, { color: c.accent.warning }]}>{formatCurrency(u.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function BucketBlock({
  bucket,
  flat,
  collapsible,
  open,
  onToggle,
  onMark,
}: {
  bucket: RequiredBucket;
  flat: boolean;
  collapsible: boolean;
  open: boolean;
  onToggle: () => void;
  onMark: (row: RequiredRow, paid: boolean) => void;
}) {
  const c = useAppColors();
  const titleColor = bucket.key === 'overdue' ? c.accent.danger : bucket.key === 'handled' ? c.text.tertiary : c.text.secondary;
  const rows = collapsible && !open ? [] : bucket.rows;
  // [T6.6 · L4-6] Does any row in this bucket carry reserve-funded money? Only then do the header total
  // and the row headlines describe different quantities — see the header below. Reads `bucket.rows`, not
  // `rows`, so a COLLAPSED bucket still labels itself correctly.
  const bucketHasReserve = bucket.rows.some((r) => (r.item.reserveCovered ?? 0) > 0);

  return (
    <View>
      {!flat ? (
        <Pressable
          onPress={collapsible ? onToggle : undefined}
          disabled={!collapsible}
          accessibilityRole={collapsible ? 'button' : 'header'}
          {...(collapsible ? a11yExpanded(open) : {})}
          accessibilityLabel={`${bucket.title}, ${bucket.rows.length} ${bucket.rows.length === 1 ? 'item' : 'items'}, ${formatWhole(bucket.total)}${bucketHasReserve ? ' from this paycheck' : ''}`}
          style={styles.bucketHeader}>
          {collapsible ? (
            <AppIcon name={open ? 'expand-more' : 'chevron-right'} size={20} color={c.text.tertiary} />
          ) : null}
          <Text style={[textStyles.footnote, styles.bucketLabel, { color: titleColor }]}>{bucket.title}</Text>
          <View style={[styles.bucketCount, { backgroundColor: c.background.tertiary }]}>
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{bucket.rows.length}</Text>
          </View>
          <View style={styles.flex} />
          {/* ⛔ [T6.6 · L4-6] The header and the rows under it are DIFFERENT QUANTITIES, not a rounding
              mismatch: `bucket.total` sums `item.amount` (what THIS PAYCHECK contributes) while each row
              headlines `item.amount + reserveCovered` (what the biller is owed). Stacked in one column
              with a bare figure on top, that invites summing a column that was never meant to reconcile —
              a $120 bill with $50 pre-funded reads `$120.00` under a header reading `$70`.
              ⚠️ The label is CONDITIONAL on purpose: the two figures are identical unless the expense
              reserve has pre-funded something, so naming the difference permanently would be noise on
              every ordinary paycheck and would stop being read by the time it mattered. */}
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            {formatWhole(bucket.total)}
            {bucketHasReserve ? ' from this paycheck' : ''}
          </Text>
        </Pressable>
      ) : null}
      {rows.map((row, i) => (
        <RequiredRowView
          key={`${row.item.category}-${row.item.targetId}-${i}`}
          row={row}
          onMark={onMark}
          divider={i < rows.length - 1}
        />
      ))}
    </View>
  );
}

/**
 * The revealed swipe action (3.7.B.4). Its own component because it needs hooks, and `renderRightActions`
 * is a render callback rather than a component — hooks called there are hooks outside a component.
 *
 * Hidden from the a11y tree AND the tab order while the row is CLOSED, and released when it opens.
 *
 * Both halves are needed and neither is enough alone. `aria-hidden` by itself leaves the control tabbable
 * — react-native-web gives every enabled `Pressable` `tabIndex=0` — which is the `aria-hidden-focus`
 * violation `a11y-axe` caught: worse than either alone, because the element announces nothing when it
 * receives focus. `focusable={false}` does not clear that tabIndex (measured). `inert` closes both, which
 * is why it cannot be permanent: `inert` also kills POINTER events, so a permanently-inert action is dead
 * to the very gesture it exists for (native is unaffected — `useInert` no-ops off web — but 3.5.7's embed
 * ships this build, so "web only" is not "nobody").
 */
function SwipeMarkAction({ testID, paid, open, onPress }: { testID: string; paid: boolean; open: boolean; onPress: () => void }) {
  const c = useAppColors();
  const ref = useRef<View>(null);
  useInert(ref, !open);
  return (
    <View ref={ref} testID={`${testID}-fence`} {...a11yHidden(!open)}>
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={paid ? 'Undo, mark unpaid' : 'Mark paid'}
        style={[styles.markAction, { backgroundColor: paid ? c.background.tertiary : c.accent.success }]}>
        <Text style={[textStyles.subhead, styles.markText, { color: paid ? c.text.secondary : c.text.onAccent }]}>
          {paid ? 'Undo' : 'Paid'}
        </Text>
      </Pressable>
    </View>
  );
}

function RequiredRowView({
  row,
  onMark,
  divider,
}: {
  row: RequiredRow;
  onMark: (row: RequiredRow, paid: boolean) => void;
  divider: boolean;
}) {
  const c = useAppColors();
  const swipeRef = useRef<SwipeableMethods>(null);
  const [open, setOpen] = useState(false);
  const { view, item, isAutopay, dueDate } = row;
  const due = shortDate(dueDate);
  const showOverdue = (view.overdue && !isAutopay) || view.autopayFailed;
  // 3.8.5 — the share of this bill already covered by the expense reserve (0 for every pre-3.8 path).
  const reserveCovered = Math.max(0, item.reserveCovered ?? 0);

  // 3.7.B.4 [D28] — one predicate, two affordances. A row the user cannot mark by hand (a healthy autopay,
  // which reports its own state) must not be swipeable either; deriving both from this rather than
  // repeating the branch is what stops the swipe and the checkbox disagreeing about who owns a row.
  const canMark = !(isAutopay && !view.autopayFailed);

  // The single write path for BOTH affordances, haptic included (`checkOffHaptic` is CheckCircle's own
  // rule, exported). The swipe is an accelerator: it must not be able to do anything the tap cannot.
  const mark = () => {
    checkOffHaptic(view.isPaid);
    onMark(row, !view.isPaid);
  };

  let control: React.ReactNode;
  if (isAutopay && view.presumedPaid && !view.autopayFailed) {
    control = <Pill label="Auto-paid" tone="paid" />;
  } else if (!canMark) {
    control = <Pill label="Autopay" tone="autopay" />;
  } else {
    // CheckCircle fires the haptic itself, so it takes the bare write.
    control = <CheckCircle checked={view.isPaid} onPress={() => onMark(row, !view.isPaid)} label={`Mark ${item.label} paid`} />;
  }

  const body = (
    <View
      style={[
        styles.itemRow,
        { backgroundColor: c.background.primary }, // the swipe reveals BEHIND the row; it must not show through
        divider && { borderBottomColor: c.border.subtle, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={styles.itemLeft}>
        <Text
          style={[textStyles.bodyMedium, { color: c.text.primary, textDecorationLine: view.isPaid ? 'line-through' : 'none' }]}
          numberOfLines={2}>
          {item.label}
        </Text>
        <View style={styles.metaRow}>
          {showOverdue ? <Pill label={OVERDUE_LABEL} tone="overdue" /> : null}
          {due ? <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Due {due}</Text> : null}
          {/* 3.7.A4 — §2.7.4 scales an installment-native BNPL to the installments landing inside this
              pay window, so a biweekly plan under a monthly paycheck shows $200 on a row the user knows
              as a $100 payment. The number was right and unexplained; this says what it is made of. */}
          {view.installments ? (
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
              {view.installments.count} × {formatCurrency(view.installments.each)} this cycle
            </Text>
          ) : null}
          {/* 3.8.5 — the same move as the installments line above, for the same reason. `item.amount` is
              what THIS PAYCHECK puts in; the biller is owed `amount + reserveCovered`. A row showing $70
              on a $120 bill is not a rounding nicety — it is the number the user would pay. So the
              headline states the BILL and this says where it comes from. */}
          {reserveCovered > 0 ? (
            <Text style={[textStyles.caption, { color: c.accent.primary }]}>
              {formatCurrency(reserveCovered)} from your reserve
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[textStyles.numericBody, { color: view.isPaid ? c.text.tertiary : c.text.primary }]}>
          {formatCurrency(item.amount + reserveCovered)}
        </Text>
        {control}
      </View>
    </View>
  );

  // 3.7.B.4 [D28] — swipe-to-mark-paid: an ACCELERATOR over the one-tap `CheckCircle`, never the only way
  // in. The checkbox stays exactly as it was, which is what keeps the action reachable by VoiceOver and by
  // anyone who never discovers a hidden gesture (the legacy app shipped a Mark-Paid pill AND a swipe for
  // the same reason). No confirm, unlike swipe-to-delete: this is reversible by the same gesture.
  if (!canMark) return body;

  // ⚠️ The action pane is MOUNTED whether or not the row is open — that is how the reveal animates — so
  // left unguarded it puts a SECOND control for the same action in the accessibility tree of every row at
  // all times: VoiceOver announces each bill twice and offers a control nobody can see.
  //
  // It is hidden from the a11y tree PERMANENTLY rather than only while closed. Two reasons, and the second
  // is not a preference: (1) the `CheckCircle` is the accessible path and it is always present, so nothing
  // is lost — a swipe is a gesture affordance by definition; (2) gating it on open/closed needs component
  // state, and re-rendering during the open animation resets `ReanimatedSwipeable`'s pan — the row snaps
  // shut the instant it opens. That was measured here, not assumed.
  //
  // The `testID` is what keeps it testable without an accessible name: react-native-web renders it as
  // `data-testid`, which a test can address per row while a screen reader still cannot reach it.
  const renderRightActions = () => (
    <SwipeMarkAction
      testID={`swipe-mark-${item.category}-${item.targetId}`}
      paid={view.isPaid}
      open={open}
      onPress={() => {
        mark();
        swipeRef.current?.close();
      }}
    />
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={() => setOpen(true)}
      onSwipeableWillClose={() => setOpen(false)}
      overshootRight={false}
      rightThreshold={40}
      containerStyle={styles.swipeContainer}>
      {body}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: layout.cardPaddingH,
    paddingTop: layout.cardPaddingV,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  pad: { paddingHorizontal: layout.cardPaddingH, paddingBottom: layout.cardPaddingV },
  flex: { flex: 1 },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.sm,
  },
  bucketLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  bucketCount: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, alignItems: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.md,
  },
  // Matches ListRow's delete action so the two swipes on this app feel like one mechanism.
  swipeContainer: { overflow: 'hidden' },
  markAction: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
  markText: { fontWeight: '700' },
  itemLeft: { flex: 1, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unfunded: { paddingHorizontal: layout.cardPaddingH, paddingVertical: layout.cardPaddingV, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  unfundedNote: { fontWeight: '600' },
  unfundedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
