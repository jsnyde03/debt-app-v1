import { buildGuardianBrief } from '@core/guardian/buildGuardianBrief';
const b = buildGuardianBrief({ isPremium: true, floor: 0, discretionary: 300, kept: 300, deployedToDebt: 0, deploySpread: false, shortfall: 0 });
console.log('floor in brief =', b.floor, '| title =', b.title);
