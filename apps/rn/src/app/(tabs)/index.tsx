import { MoreButton } from '@/components/more-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

/** Plan tab (Plan-first index). Real content — payday allocation + required actions — lands at B.3. */
export default function PlanScreen() {
  return (
    <Screen title="Plan" right={<MoreButton />}>
      <Placeholder label="Plan" note="Payday allocation + required actions — rebuilding in RN (B.3)." />
    </Screen>
  );
}
