import { MoreButton } from '@/components/more-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

/** Goals tab. Real content — savings goals + progress — lands at B.5. */
export default function GoalsScreen() {
  return (
    <Screen title="Goals" right={<MoreButton />}>
      <Placeholder label="Goals" note="Savings goals & progress — rebuilding in RN (B.5)." />
    </Screen>
  );
}
