import { DEFAULT_CUSHION_FLOOR } from '@/store/selectors';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
console.log('resolved', typeof DEFAULT_CUSHION_FLOOR, payCyclesPerMonth('biweekly'));
