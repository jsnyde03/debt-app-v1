/* C1 pass-7 probe: ONE store, ONE variable = whether `cushionFloor` is readable. */
import { runMigrations } from '@/data/migrations';
import { repairsPoisoning } from '@/store/trustSelectors';
import { repairBlocks, unreadInputsFix, describeRepair } from '@/components/plan/dataRepairsCopy';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { createDefaultStore } from '@/data/defaults';

function storeWith(floorRaw: unknown) {
  const base = createDefaultStore() as any;
  const raw = JSON.parse(JSON.stringify(base));
  raw.cushionFloor = floorRaw;
  raw.subscriptionPlan = 'premium';
  return runMigrations(raw);
}

for (const [label, raw] of [['READABLE cushionFloor: 350', 350], ['UNREADABLE cushionFloor: "abc"', 'abc']] as const) {
  const s = storeWith(raw) as any;
  console.log('\n================', label);
  console.log('store.cushionFloor        =', s.cushionFloor);
  console.log('pendingDataRepairs        =', JSON.stringify(s.pendingDataRepairs));
  const poisoning = repairsPoisoning(s, 'required-plan');
  console.log('repairsPoisoning(required-plan).length =', poisoning.length);
  console.log('unreadInputsFix           =', JSON.stringify(unreadInputsFix(poisoning, 'and this comes back')));
  console.log('describeRepair lines      =', JSON.stringify(s.pendingDataRepairs.map(describeRepair)));
  console.log('repairBlocks              =', JSON.stringify(repairBlocks(s.pendingDataRepairs), null, 1));
  const brief = selectPaydayGuardian(s);
  console.log('brief.floor               =', brief ? brief.floor : '(null brief)');
  if (brief) {
    console.log('CARD unread body          =',
      `An amount this paycheck has to cover could not be read, so I can\u2019t say what\u2019s spare or hold your $${brief.floor} line against it \u2014 ${unreadInputsFix(poisoning, 'and this comes back')}.`);
  }
}
