/* C1 pass-7 probe 2: a REAL plan. ONE variable = whether `cushionFloor` is readable. */
import { runMigrations } from '@/data/migrations';
import { repairsPoisoning, answerableByEdit } from '@/store/trustSelectors';
import { repairBlocks, unreadInputsFix, describeRepair } from '@/components/plan/dataRepairsCopy';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { createDefaultStore } from '@/data/defaults';

function storeWith(patch: Record<string, unknown>) {
  const raw: any = JSON.parse(JSON.stringify(createDefaultStore()));
  raw.subscriptionPlan = 'premium';
  raw.paycheck.amount = '2000';
  raw.prefs.onboardingComplete = true;
  raw.debts = [{ id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'credit_card' }];
  raw.requiredExpenses = [{ id: 'r1', name: 'Rent', amount: 900, dueDay: 1, frequency: 'monthly' }];
  raw.livingExpenses = [{ id: 'l1', name: 'Food', amount: 300, frequency: 'monthly' }];
  raw.cushionFloor = 350;
  Object.assign(raw, patch);
  return runMigrations(raw);
}

const cases: [string, Record<string, unknown>][] = [
  ['A · cushionFloor READABLE (350)', {}],
  ['B · cushionFloor UNREADABLE ("abc")', { cushionFloor: 'abc' }],
];

for (const [label, patch] of cases) {
  const s: any = storeWith(patch);
  const poisoning = repairsPoisoning(s, 'required-plan');
  const brief: any = selectPaydayGuardian(s);
  const fix = unreadInputsFix(poisoning, 'and this comes back');
  console.log('\n========', label);
  console.log('store.cushionFloor          =', s.cushionFloor);
  console.log('pendingDataRepairs          =', JSON.stringify(s.pendingDataRepairs));
  console.log('answerableByEdit(each)      =', s.pendingDataRepairs.map(answerableByEdit));
  console.log('repairsPoisoning(required-plan) =', poisoning.length);
  console.log('brief.floor (what the card prints) =', brief ? brief.floor : '(null)');
  console.log('brief.title                 =', brief ? brief.title : '(null)');
  console.log('DataRepairsCard blocks      =', JSON.stringify(repairBlocks(s.pendingDataRepairs)));
  console.log('describeRepair lines        =', JSON.stringify(s.pendingDataRepairs.map(describeRepair)));
  if (poisoning.length > 0 && brief) {
    console.log('GUARDIAN unread body        =',
      `An amount this paycheck has to cover could not be read, so I can\u2019t say what\u2019s spare or hold your $${brief.floor} line against it \u2014 ${fix}.`);
  }
}

/* Control: a DEBT field repair, to prove the probe can see the answerable branch. */
const ctl: any = storeWith({ debts: [{ id: 'd1', name: 'Visa', balance: 'zzz', minimumPayment: 60, apr: 22, type: 'credit_card' }] });
const cp = repairsPoisoning(ctl, 'required-plan');
console.log('\n======== CONTROL · debt balance unreadable');
console.log('pendingDataRepairs          =', JSON.stringify(ctl.pendingDataRepairs));
console.log('answerableByEdit(each)      =', ctl.pendingDataRepairs.map(answerableByEdit));
console.log('unreadInputsFix             =', JSON.stringify(unreadInputsFix(cp, 'and this comes back')));
console.log('DataRepairsCard blocks      =', JSON.stringify(repairBlocks(ctl.pendingDataRepairs)));
