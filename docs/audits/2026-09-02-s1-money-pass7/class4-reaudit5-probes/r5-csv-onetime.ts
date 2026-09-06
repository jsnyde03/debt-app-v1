import { parseDebtCsvText } from '@core/imports/debtCsv';
const csv = [
  'name,balance,minimumPayment,apr,dueDate,type,recurrence',
  'Medical bill,600,50,0,2026-09-15,debt,one-time',
].join('\n');
const r = parseDebtCsvText(csv, { today: '2026-09-01', makeId: () => 'id-1' } as never);
console.log('errors:', JSON.stringify(r.errors));
console.log('debts:', JSON.stringify(r.debts, null, 1));
