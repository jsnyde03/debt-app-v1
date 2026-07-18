import { MoreButton } from '@/components/more-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

/** Bills tab. Real content — bills/debts list + add/edit — lands at B.5. */
export default function BillsScreen() {
  return (
    <Screen title="Bills" right={<MoreButton />}>
      <Placeholder label="Bills" note="Bills & debts management — rebuilding in RN (B.5)." />
    </Screen>
  );
}
